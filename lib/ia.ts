declare const process: { env: Record<string, string | undefined> };
/* Conexión con el servidor de IA (Gemini). Si no hay servidor o falla, el juego usa sus textos de respaldo. */
let BASE = "";
try {
  BASE = process.env.NEXT_PUBLIC_IA_URL ?? "";
} catch {
  BASE = "";
}

export const hayIA = () => BASE.length > 0;

async function pedir(ruta: string, cuerpo: unknown, ms = 12000): Promise<string | null> {
  if (!BASE) return null;
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), ms);
  try {
    const r = await fetch(BASE.replace(/\/$/, "") + ruta, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cuerpo),
      signal: ctl.signal,
    });
    if (!r.ok) return null;
    const j = (await r.json()) as { texto?: string };
    return j.texto?.trim() || null;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

export type DatosTutor = {
  nivel: number;
  decisiones: { titulo: string; eligio: string; correcta: boolean; leccion: string }[];
  ventas: { negocio: string; comprobante: string; acierto: boolean }[];
  consultas: number;
  riesgo: number;
  infracciones: number;
};

export const pedirTutor = (d: DatosTutor) => pedir("/tutor", d);
export const pedirSimple = (texto: string) => pedir("/simple", { texto }, 10000);

/* ---------- Preguntas creadas por la IA para cada partida ---------- */
export type PreguntaIA = {
  puente: number;
  k: number;
  pregunta: string;
  opciones: { texto: string; correcta: boolean; gravedad: number; oficial: string; leccion: string }[];
};

/** Despierta el servidor (en el plan gratis se duerme) para que responda rápido cuando se necesite. */
export function despertarIA() {
  if (!BASE) return;
  fetch(BASE.replace(/\/$/, "") + "/salud").catch(() => {});
}

/* Estado de la IA para mostrarlo en el menú (y saber por qué no llegó, si falla). */
export type EstadoIA = { fase: "sin-url" | "inactiva" | "pidiendo" | "lista" | "error"; motivo: string };
let estadoIA: EstadoIA = { fase: BASE ? "inactiva" : "sin-url", motivo: "" };
const oyentesIA = new Set<() => void>();
function ponerEstadoIA(e: EstadoIA) {
  estadoIA = e;
  oyentesIA.forEach((f) => f());
}
export const leerEstadoIA = () => estadoIA;
export function suscribirEstadoIA(f: () => void) {
  oyentesIA.add(f);
  return () => {
    oyentesIA.delete(f);
  };
}

export async function pedirPreguntas(nivel: number, evitar: string[]): Promise<PreguntaIA[] | null> {
  if (!BASE) return null;
  ponerEstadoIA({ fase: "pidiendo", motivo: "" });
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 80000);
  try {
    const r = await fetch(BASE.replace(/\/$/, "") + "/preguntas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nivel, evitar }),
      signal: ctl.signal,
    });
    if (!r.ok) {
      ponerEstadoIA({ fase: "error", motivo: r.status === 429 ? "demasiadas pruebas seguidas, espera unos minutos" : `el servidor respondió ${r.status}` });
      return null;
    }
    const j = (await r.json()) as { preguntas?: PreguntaIA[] };
    const l = j.preguntas;
    if (!Array.isArray(l) || l.length < 6) {
      ponerEstadoIA({ fase: "error", motivo: "la IA devolvió preguntas incompletas" });
      return null;
    }
    const ok = l.every(
      (q) =>
        typeof q?.pregunta === "string" &&
        Array.isArray(q.opciones) &&
        q.opciones.length >= 3 &&
        q.opciones.filter((o) => o.correcta).length === 1,
    );
    ponerEstadoIA(ok ? { fase: "lista", motivo: "" } : { fase: "error", motivo: "la IA devolvió un formato no válido" });
    return ok ? l : null;
  } catch (e) {
    const abortado = e instanceof DOMException && e.name === "AbortError";
    ponerEstadoIA({
      fase: "error",
      motivo: abortado ? "el servidor tardó demasiado en responder" : "no se pudo conectar (revisa la dirección y ALLOWED_ORIGIN)",
    });
    return null;
  } finally {
    clearTimeout(t);
  }
}
