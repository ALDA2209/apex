/* Servidor pequeño de Apex: guarda la clave de Gemini y responde solo dos cosas:
   /tutor  → el Dr. Aldahir Silva comenta tu partida
   /simple → explica una lección en palabras más fáciles
   /preguntas → crea las preguntas de los puentes (distintas en cada partida)
   Sin dependencias. La clave va en la variable GEMINI_API_KEY (nunca en el código). */
import http from "node:http";

const PUERTO = process.env.PORT || 3001;
/* Hasta 6 claves, de proyectos distintos de Google (cada proyecto tiene su propio cupo gratis). */
const CLAVES = ["", "_2", "_3", "_4", "_5", "_6"].map((n) => (process.env["GEMINI_API_KEY" + n] || "").trim()).filter(Boolean);
const CLAVE = CLAVES[0] || "";
const MODELOS = (process.env.GEMINI_MODEL || "gemini-3.8-flash").split(",").map((m) => m.trim());
const MODELO = MODELOS[0];

/* Modelos de respaldo: se le pregunta a Google cuáles existen hoy (los nombres cambian y los viejos se retiran). */
let cacheModelos = { t: 0, lista: MODELOS };
async function listaModelos() {
  if (!CLAVE) return MODELOS;
  if (Date.now() - cacheModelos.t < 30 * 60 * 1000) return cacheModelos.lista;
  let lista = MODELOS;
  let ok = false;
  try {
    const r = await fetch("https://generativelanguage.googleapis.com/v1beta/models?pageSize=200", {
      headers: { "x-goog-api-key": CLAVE },
      signal: AbortSignal.timeout(8000),
    });
    if (r.ok) {
      const j = await r.json();
      const ver = (n) => parseFloat(n.match(/gemini-(\d+(?:\.\d+)?)/)?.[1] || "0");
      const otros = (j.models || [])
        .filter((m) => (m.supportedGenerationMethods || []).includes("generateContent"))
        .map((m) => String(m.name || "").replace(/^models\//, ""))
        .filter((n) => /^gemini-\d+(\.\d+)?-flash(-lite)?$/.test(n) && !MODELOS.includes(n))
        .sort((a, b) => ver(b) - ver(a) || a.length - b.length)
        .slice(0, 3);
      lista = [...MODELOS, ...otros];
      ok = true;
    }
  } catch {}
  // si no se pudo preguntar, se vuelve a intentar en 5 minutos
  cacheModelos = { t: ok ? Date.now() : Date.now() - 25 * 60 * 1000, lista };
  console.log("modelos:", lista.join(", "));
  return lista;
}
const ORIGENES = (process.env.ALLOWED_ORIGIN || "*").split(",").map((s) => s.trim());
const LIMITE_IP = 20; // consultas por IP cada 10 minutos
const LIMITE_DIA = 900; // consultas por día en total
const MAX_BYTES = 8000;
const RUTAS = ["/tutor", "/simple", "/preguntas"];

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

/* Si una clave da 429 (límite), esa pareja clave+modelo descansa 60 s y se usa la siguiente clave. */
const frio = new Map();
async function conClaves(modelo, hacer) {
  let ultimo;
  for (let i = 0; i < CLAVES.length; i++) {
    const id = `${i}|${modelo}`;
    if ((frio.get(id) || 0) > Date.now()) {
      ultimo = ultimo || new Error(`Gemini ${modelo} 429`);
      continue;
    }
    try {
      return await hacer(CLAVES[i]);
    } catch (e) {
      ultimo = e;
      if (!/ 429$/.test(String(e))) throw e;
      const largo = e.diario ? 30 * 60 * 1000 : 60000;
      frio.set(id, Date.now() + largo);
      console.log(`clave ${i + 1} de ${CLAVES.length}: ${modelo} en pausa ${e.diario ? "30 min (cupo del día)" : "60 s"}`);
    }
  }
  throw ultimo;
}
async function error429(r, modelo) {
  const t = await r.text().catch(() => "");
  console.log("429 detalle:", t.replace(/\s+/g, " ").slice(0, 260));
  const e = new Error(`Gemini ${modelo} 429`);
  e.diario = /PerDay/i.test(t);
  return e;
}

async function llamar(modelo, sistema, usuario, clave) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 14000);
  try {
    const generationConfig = { temperature: 0.5, maxOutputTokens: 2000 };
    if (/^gemini-([3-9]|\d{2})/.test(modelo)) generationConfig.thinkingConfig = { thinkingLevel: "low" };
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": clave },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: sistema }] },
        contents: [{ role: "user", parts: [{ text: usuario }] }],
        generationConfig,
      }),
      signal: ctl.signal,
    });
    if (!r.ok) {
      if (r.status === 429) throw await error429(r, modelo);
      throw new Error(`Gemini ${modelo} ${r.status}`);
    }
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
  for (const m of await listaModelos()) {
    for (let v = 0; v < 2; v++) {
      try {
        return await conClaves(m, (k) => llamar(m, sistema, usuario, k));
      } catch (e) {
        ultimo = e;
        console.log("falló", String(e).slice(0, 120));
        // 503 = el modelo está saturado un momento: se reintenta una vez antes de pasar al siguiente
        if (!/ 503$/.test(String(e))) break;
        await new Promise((f) => setTimeout(f, 1500));
      }
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


/* ---------- /preguntas: preguntas nuevas en cada partida ----------
   Cada puente tiene una lista de situaciones y de ideas a evaluar. El servidor sortea dos de cada una
   (así, aunque Gemini se repita, la pregunta cambia) y Gemini solo redacta. Solo se permiten estos hechos. */
const PUENTES_IA = [
  {
    oficial: "Oficial Ramos",
    control: "control de comprobantes en la carretera",
    situaciones: [
      "el mototaxista lleva cajas de gaseosas para vender en su bodega",
      "lleva sacos de arroz y azúcar comprados a dos proveedores",
      "transporta ropa para vender en la feria del domingo",
      "lleva útiles escolares para una librería del barrio",
      "transporta verduras compradas en el mercado mayorista",
      "lleva repuestos de moto para un taller",
      "transporta cajas de galletas y snacks para revender",
      "lleva productos de limpieza para varios clientes",
    ],
    ideas: [
      "la compra de mercadería se sustenta con el comprobante de pago del proveedor",
      "para trasladar mercadería se usa la guía de remisión, que no reemplaza al comprobante de compra",
      "quien vende debe entregar comprobante de pago aunque el cliente no lo pida",
      "se debe llevar los documentos a la mano durante el traslado, no prometer traerlos después",
      "un cuaderno de apuntes o un mensaje de chat no reemplaza un comprobante de pago",
      "ofrecer dinero a un funcionario para evitar un control es un delito (cohecho)",
      "boleta para consumidor final y factura cuando el cliente tiene RUC y la pide",
    ],
  },
  {
    oficial: "Agente Mendoza",
    control: "control de aduanas",
    situaciones: [
      "el mototaxista lleva mercadería que entró desde otro país por la frontera",
      "transporta electrodomésticos pequeños importados",
      "lleva zapatillas y ropa deportiva importadas para vender",
      "transporta accesorios de celular comprados a un importador",
      "lleva juguetes importados para la campaña de fin de año",
      "transporta herramientas importadas para una ferretería",
      "lleva cajas de cosméticos importados para revender",
    ],
    ideas: [
      "la mercadería que entra al país se declara ante la aduana y se pagan los tributos que correspondan",
      "la declaración aduanera respalda que la mercadería ingresó legalmente",
      "comprar mercadería sin documentos que acrediten su ingreso legal puede terminar en retención o incautación",
      "la cantidad y el valor declarados deben coincidir con lo real; si hay diferencia, se reconoce y se regulariza",
      "decir que son muestras o pocas cosas no exime de declarar lo que corresponde declarar",
      "ante la duda, se consulta a la aduana antes de pasar, no después",
      "eres responsable de lo que transportas: si no sabes qué es ni de quién, no lo lleves",
    ],
  },
  {
    oficial: "Fiscal Paredes",
    control: "operativo conjunto de Fiscalía y SUNAT",
    situaciones: [
      "el emprendedor vende snacks y bebidas en una bodega",
      "vende ropa por redes sociales y cobra con Yape",
      "tiene un puesto de comida y a veces el cliente paga en efectivo",
      "entrega pedidos a domicilio con su mototaxi",
      "vende útiles y fotocopias en un kiosco",
      "tiene una pequeña tienda de abarrotes con varios clientes al día",
      "vende frutas y menestras en el mercado",
    ],
    ideas: [
      "los comprobantes electrónicos se pueden consultar en el portal de SUNAT para verificar su validez",
      "usar o emitir comprobantes falsos, o que no corresponden a una operación real, tiene consecuencias legales graves",
      "se emite comprobante en cada venta, aunque el cliente no lo pida y aunque pague en efectivo o por celular",
      "llevar un registro de ventas ayuda a explicar cada operación cuando se pide",
      "si se omitió un comprobante, lo mejor es reconocerlo y regularizarlo, no ocultarlo",
      "el comprobante se emite al momento de la venta, no a fin de mes",
      "un logo o un sello no demuestran que un comprobante sea auténtico",
    ],
  },
];

const sortear = (a, n) => [...a].sort(() => Math.random() - 0.5).slice(0, n);

const REGLAS_PREGUNTAS = `Eres guionista de un juego educativo peruano sobre cultura tributaria y aduanera para jóvenes y emprendedores de mypes.
Escribes preguntas de decisión que hace una autoridad en un control de carretera, y las opciones de respuesta del jugador.
REGLAS ESTRICTAS:
- Usa SOLO la idea que se te indica para cada pregunta. No inventes leyes, artículos, montos, porcentajes, plazos ni nombres de normas.
- No escribas cifras de dinero ni porcentajes. Evita números en general.
- La pregunta la dice la autoridad, en primera persona, con lenguaje claro y natural (máx. 45 palabras). Debe plantear una situación concreta distinta cada vez.
- Cada pregunta tiene exactamente UNA opción correcta. Las demás son errores que de verdad cometen las personas (creíbles, no absurdos).
- "gravedad" de una opción incorrecta: 1 = error leve u omisión, 2 = error serio, 3 = delito (por ejemplo ofrecer dinero a un funcionario o usar comprobantes falsos). La correcta lleva gravedad 0.
- "oficial": lo que responde la autoridad tras esa opción (máx. 25 palabras, firme y respetuoso, sin amenazas ni insultos).
- "leccion": la regla correcta explicada en palabras simples (máx. 40 palabras), sin inventar nada.
- Es un juego: no des asesoría legal real. Español peruano, sin emojis.`;

const ESQUEMA_PREGUNTAS = {
  type: "OBJECT",
  properties: {
    preguntas: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          puente: { type: "INTEGER" },
          pregunta: { type: "STRING" },
          opciones: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                texto: { type: "STRING" },
                correcta: { type: "BOOLEAN" },
                gravedad: { type: "INTEGER" },
                oficial: { type: "STRING" },
                leccion: { type: "STRING" },
              },
              required: ["texto", "correcta", "gravedad", "oficial", "leccion"],
            },
          },
        },
        required: ["puente", "pregunta", "opciones"],
      },
    },
  },
  required: ["preguntas"],
};

const PROHIBIDO = /art[ií]culo|\bart\.|\bUIT\b|%|\bS\/\s*\d|\d{3,}|ley\s+n[°º.]|decreto/i;

function pedidoPreguntas(b) {
  const nivel = [1, 2, 3].includes(Number(b.nivel)) ? Number(b.nivel) : 1;
  const evitar = (Array.isArray(b.evitar) ? b.evitar : []).slice(0, 12).map((t) => limpio(t, 160)).filter(Boolean);
  const nOp = nivel === 1 ? 3 : 4;
  const plan = [];
  const lineas = [];
  PUENTES_IA.forEach((p, i) => {
    const sit = sortear(p.situaciones, 2);
    const ide = sortear(p.ideas, 2);
    for (let k = 0; k < 2; k++) {
      plan.push({ puente: i, k });
      lineas.push(
        `Pregunta ${plan.length} (puente ${i}, ${p.oficial}, ${p.control}): situación: ${sit[k]}. Idea que evalúa: ${ide[k]}.`,
      );
    }
  });
  const dificultad =
    nivel === 1
      ? "Nivel fácil: preguntas directas y opciones claramente distintas."
      : nivel === 2
        ? "Nivel medio: incluye un detalle de la situación y errores que parecen razonables."
        : "Nivel difícil: opciones muy parecidas entre sí; el error es sutil y la diferencia está en un detalle.";
  const estilos = [
    "autoridad formal y serena",
    "autoridad apurada porque hay cola de vehículos",
    "autoridad amable pero firme",
    "autoridad estricta y directa",
    "autoridad que explica con calma",
  ];
  const errores = [
    "errores por desconocimiento",
    "errores por confiarse o ahorrarse tiempo",
    "errores por costumbre del barrio",
    "errores por creer que 'así nomás se puede'",
  ];
  const nonce = Math.random().toString(36).slice(2, 8);
  const usuario = `[variación ${nonce}] Tono de las autoridades en esta partida: ${sortear(estilos, 1)[0]}. En las alternativas incorrectas predominan ${sortear(errores, 1)[0]}. Cambia siempre las palabras, los ejemplos y el orden en que aparecen las ideas.
Crea ${plan.length} preguntas, en este orden, cada una con exactamente ${nOp} opciones (una sola correcta). ${dificultad}
${lineas.join("\n")}
${evitar.length ? "No repitas ni parafrasees estas preguntas ya vistas por el jugador:\n- " + evitar.join("\n- ") : ""}
Devuelve el campo "puente" con el número de puente indicado en cada pregunta.`;
  return { nivel, nOp, plan, usuario };
}

function validarPreguntas(j, plan, nOp) {
  const lista = j?.preguntas;
  if (!Array.isArray(lista) || lista.length < plan.length) throw new Error("faltan preguntas");
  return plan.map((pl, n) => {
    const q = lista[n];
    const pregunta = limpio(q?.pregunta, 420);
    if (pregunta.length < 20 || PROHIBIDO.test(pregunta)) throw new Error("pregunta inválida");
    const ops = Array.isArray(q?.opciones) ? q.opciones : [];
    if (ops.length !== nOp) throw new Error("opciones inválidas");
    if (ops.filter((o) => o?.correcta === true).length !== 1) throw new Error("correctas inválidas");
    const opciones = ops.map((o) => {
      const texto = limpio(o.texto, 240);
      const oficial = limpio(o.oficial, 240);
      const leccion = limpio(o.leccion, 420);
      if (texto.length < 4 || oficial.length < 4 || leccion.length < 15) throw new Error("opción corta");
      if (PROHIBIDO.test(texto + " " + oficial + " " + leccion)) throw new Error("texto no permitido");
      const correcta = o.correcta === true;
      const gravedad = correcta ? 0 : Math.max(1, Math.min(3, Math.round(Number(o.gravedad)) || 1));
      return { texto, correcta, gravedad, oficial, leccion };
    });
    return { puente: pl.puente, k: pl.k, pregunta, opciones };
  });
}

/* Reserva: guarda los juegos de preguntas que la IA ya creó. Solo se usa si Gemini no puede responder (límite del día). */
const reserva = { 3: [], 4: [] };
function guardarReserva(nOp, lista) {
  const r = reserva[nOp];
  r.push(lista);
  if (r.length > 30) r.shift();
}
function sacarReserva(nOp, evitar) {
  const r = reserva[nOp] || [];
  if (!r.length) return null;
  const puntaje = (l) => l.filter((q) => evitar.some((t) => t && q.pregunta.startsWith(String(t).slice(0, 40)))).length + Math.random();
  return [...r].sort((a, b) => puntaje(a) - puntaje(b))[0];
}

async function crearPreguntas(b) {
  const { nOp, plan, usuario } = pedidoPreguntas(b);
  const fin = Date.now() + 68000;
  let ultimo;
  for (let intento = 0; intento < 2; intento++) {
    try {
      const crudo = await geminiJson(REGLAS_PREGUNTAS, usuario, fin);
      const lista = validarPreguntas(JSON.parse(crudo), plan, nOp);
      guardarReserva(nOp, lista);
      return lista;
    } catch (e) {
      ultimo = e;
      console.log("preguntas, intento", intento + 1, String(e).slice(0, 120));
      if (/Gemini|Abort/.test(String(e))) break; // límite o tiempo: otro intento no ayuda
    }
  }
  const guardada = /Gemini|Abort/.test(String(ultimo)) ? sacarReserva(nOp, b.evitar && Array.isArray(b.evitar) ? b.evitar : []) : null;
  if (guardada) {
    console.log("usando reserva de preguntas de la IA (Gemini sin cupo):", reserva[nOp].length, "guardadas");
    return guardada;
  }
  throw ultimo;
}

async function llamarJson(modelo, sistema, usuario, clave, ms = 40000) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), ms);
  try {
    const generationConfig = {
      temperature: 1,
      maxOutputTokens: 8000,
      responseMimeType: "application/json",
      responseSchema: ESQUEMA_PREGUNTAS,
    };
    if (/^gemini-([3-9]|\d{2})/.test(modelo)) generationConfig.thinkingConfig = { thinkingLevel: "low" };
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": clave },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: sistema }] },
        contents: [{ role: "user", parts: [{ text: usuario }] }],
        generationConfig,
      }),
      signal: ctl.signal,
    });
    if (!r.ok) {
      if (r.status === 429) throw await error429(r, modelo);
      throw new Error(`Gemini ${modelo} ${r.status}`);
    }
    const j = await r.json();
    const texto = (j.candidates?.[0]?.content?.parts || [])
      .filter((p) => !p.thought)
      .map((p) => p.text || "")
      .join("")
      .trim();
    if (!texto) throw new Error("vacío");
    return texto;
  } finally {
    clearTimeout(t);
  }
}

/* `fin` = hora límite de todo el pedido (el juego espera 80 s; se responde antes). Cada intento puede usar hasta 40 s. */
async function geminiJson(sistema, usuario, fin) {
  let ultimo;
  for (const m of await listaModelos()) {
    for (let v = 0; v < 2; v++) {
      const resta = fin - Date.now();
      if (resta < 9000) throw ultimo || new Error("Abort: tiempo agotado");
      try {
        return await conClaves(m, (k) => llamarJson(m, sistema, usuario, k, Math.min(40000, resta - 2000)));
      } catch (e) {
        ultimo = e;
        console.log("falló", String(e).slice(0, 120));
        // 503 = el modelo está saturado un momento: se reintenta una vez antes de pasar al siguiente
        if (!/ 503$/.test(String(e))) break;
        await new Promise((f) => setTimeout(f, 1500));
      }
    }
  }
  throw ultimo;
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
    if (req.url === "/modelos") return responder(res, 200, { modelos: await listaModelos() }, origen);
    if (req.url === "/salud") return responder(res, 200, { ok: true, clave: !!CLAVE, claves: CLAVES.length, modelo: MODELO, preguntas: true, reserva: reserva[3].length + reserva[4].length }, origen);
    if (req.method !== "POST" || !RUTAS.includes(req.url || "")) {
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
        if (req.url === "/preguntas") {
          const preguntas = await crearPreguntas(b);
          return responder(res, 200, { preguntas }, origen);
        }
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

listaModelos(); // al arrancar, averigua qué modelos existen hoy
