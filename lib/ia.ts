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
