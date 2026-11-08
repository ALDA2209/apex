/* Servidor pequeño de Apex: guarda la clave de Gemini y responde solo dos cosas:
   /tutor  → el Dr. Aldahir Silva comenta tu partida
   /simple → explica una lección en palabras más fáciles
   Sin dependencias. La clave va en la variable GEMINI_API_KEY (nunca en el código). */
import http from "node:http";

const PUERTO = process.env.PORT || 3001;
const CLAVE = process.env.GEMINI_API_KEY || "";
const MODELOS = (process.env.GEMINI_MODEL || "gemini-3.8-flash,gemini-2.5-flash").split(",").map((m) => m.trim());
const MODELO = MODELOS[0];
const ORIGENES = (process.env.ALLOWED_ORIGIN || "*").split(",").map((s) => s.trim());
const LIMITE_IP = 20; // consultas por IP cada 10 minutos
const LIMITE_DIA = 400; // consultas por día en total
const MAX_BYTES = 8000;

const porIp = new Map();
let hoy = new Date().toDateString();
let totalHoy = 0;

function permitido(ip) {
  const d = new Date().toDateString();
  if (d !== hoy) {
    hoy = d;
    totalHoy = 0;
  }
  if (totalHoy >= LIMITE_DIA) return false;
  const ahora = Date.now();
  const lista = (porIp.get(ip) || []).filter((t) => ahora - t < 10 * 60 * 1000);
  if (lista.length >= LIMITE_IP) return false;
  lista.push(ahora);
  porIp.set(ip, lista);
  totalHoy++;
  return true;
}

const limpio = (t, n = 400) =>
  String(t ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .trim()
    .slice(0, n);

const REGLAS = `Eres el Dr. Aldahir Silva, abogado tributarista peruano de un juego educativo llamado Apex.
Hablas a jóvenes y emprendedores de mypes (bodegueros, mototaxistas) en español peruano, con palabras simples y tono cálido.
REGLAS ESTRICTAS:
- Usa SOLO la información que te doy. No inventes leyes, artículos, montos ni plazos.
- Si algo no está en la información, no lo afirmes.
- No des asesoría legal real: es un juego. Recuérdalo solo si es natural, en media frase.
- Máximo 90 palabras. Sin listas, sin títulos, sin emojis. Texto corrido.
- Cierra con una recomendación concreta y práctica.`;

async function llamar(modelo, sistema, usuario) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 14000);
  try {
    const generationConfig = { temperature: 0.5, maxOutputTokens: 2000 };
    if (modelo.startsWith("gemini-3")) generationConfig.thinkingConfig = { thinkingLevel: "low" };
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": CLAVE },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: sistema }] },
        contents: [{ role: "user", parts: [{ text: usuario }] }],
        generationConfig,
      }),
      signal: ctl.signal,
    });
    if (!r.ok) throw new Error(`Gemini ${modelo} ${r.status}`);
    const j = await r.json();
    const texto = (j.candidates?.[0]?.content?.parts || [])
      .filter((p) => !p.thought)
      .map((p) => p.text || "")
      .join(" ")
      .trim();
    if (!texto) throw new Error("vacío");
    return texto;
  } finally {
    clearTimeout(t);
  }
}

/* Prueba cada modelo de la lista hasta que uno responda. */
async function gemini(sistema, usuario) {
  let ultimo;
  for (const m of MODELOS) {
    try {
      return await llamar(m, sistema, usuario);
    } catch (e) {
      ultimo = e;
      console.log("falló", String(e).slice(0, 120));
    }
  }
  throw ultimo;
}

function armarTutor(b) {
  const dec = (Array.isArray(b.decisiones) ? b.decisiones : []).slice(0, 5).map(
    (d) =>
      `- ${limpio(d.titulo, 80)}: eligió «${limpio(d.eligio, 200)}» (${d.correcta ? "correcto" : "incorrecto"}). Regla: ${limpio(d.leccion, 300)}`,
  );
  const ven = (Array.isArray(b.ventas) ? b.ventas : []).slice(0, 4).map(
    (v) => `- Venta a ${limpio(v.negocio, 60)}: comprobante ${limpio(v.comprobante, 20)} (${v.acierto ? "bien" : "mal"})`,
  );
  return `Datos de la partida (nivel ${Number(b.nivel) || 1}):
Decisiones en los puentes:
${dec.join("\n") || "- ninguna"}
Ventas:
${ven.join("\n") || "- ninguna"}
Consultas pagadas al abogado: ${Number(b.consultas) || 0} de 3.
Riesgo fiscal final: ${Number(b.riesgo) || 0}%. Fotopapeletas: ${Number(b.infracciones) || 0}.
Escribe tu comentario final al jugador: reconoce lo que hizo bien, explica con sus propias decisiones el error más importante (si lo hay) y da una recomendación.`;
}

function responder(res, codigo, obj, origen) {
  const ok = ORIGENES.includes("*") || ORIGENES.includes(origen);
  res.writeHead(codigo, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": ok ? origen || "*" : ORIGENES[0],
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  });
  res.end(JSON.stringify(obj));
}

http
  .createServer(async (req, res) => {
    const origen = req.headers.origin || "";
    if (req.method === "OPTIONS") return responder(res, 204, {}, origen);
    if (req.url === "/salud") return responder(res, 200, { ok: true, clave: !!CLAVE, modelo: MODELO }, origen);
    if (req.method !== "POST" || !["/tutor", "/simple"].includes(req.url || "")) {
      return responder(res, 404, { error: "no existe" }, origen);
    }
    if (!(ORIGENES.includes("*") || ORIGENES.includes(origen))) return responder(res, 403, { error: "origen" }, origen);
    const ip = String(req.headers["x-forwarded-for"] || req.socket.remoteAddress || "").split(",")[0].trim();
    if (!permitido(ip)) return responder(res, 429, { error: "límite" }, origen);
    if (!CLAVE) return responder(res, 503, { error: "sin clave" }, origen);

    let cuerpo = "";
    let grande = false;
    req.on("data", (c) => {
      cuerpo += c;
      if (cuerpo.length > MAX_BYTES) grande = true;
    });
    req.on("end", async () => {
      if (grande) return responder(res, 413, { error: "grande" }, origen);
      try {
        const b = JSON.parse(cuerpo || "{}");
        let texto;
        if (req.url === "/tutor") {
          texto = await gemini(REGLAS, armarTutor(b));
        } else {
          const base = limpio(b.texto, 700);
          if (!base) return responder(res, 400, { error: "vacío" }, origen);
          texto = await gemini(
            REGLAS + "\nTu tarea ahora: explica el texto con palabras aún más simples y UN ejemplo cotidiano de bodega o mototaxi. Máximo 60 palabras. No agregues reglas nuevas.",
            base,
          );
        }
        responder(res, 200, { texto }, origen);
      } catch (e) {
        console.log("error:", String(e).slice(0, 200));
        responder(res, 502, { error: "ia" }, origen);
      }
    });
  })
  .listen(PUERTO, () => console.log("Apex IA en puerto", PUERTO));
