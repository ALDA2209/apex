import { PUENTES, PUENTES_N1, type Opcion, type Pregunta, type Puente } from "@/lib/puentes";
import { hayIA, pedirPreguntas, refrescarIA, type PreguntaIA } from "@/lib/ia";

export type Nivel = 1 | 2 | 3;

export const NIVELES: { n: Nivel; nombre: string; detalle: string }[] = [
  { n: 1, nombre: "Nivel 1 · Aprendiz", detalle: "3 opciones, preguntas directas" },
  { n: 2, nombre: "Nivel 2 · Repartidor", detalle: "4 opciones, casos con detalles, más tráfico" },
  { n: 3, nombre: "Nivel 3 · Experto", detalle: "4 opciones parecidas, 20 s para decidir, el fiscal recuerda tus ventas" },
];

/** Segundos para decidir en cada puente (0 = sin límite). */
export const TIEMPO_POR_NIVEL: Record<Nivel, number> = { 1: 0, 2: 0, 3: 20 };
/** Qué tan rápido baja la salud al manejar. */
export const CANSANCIO_POR_NIVEL: Record<Nivel, number> = { 1: 1, 2: 1.3, 3: 1.6 };
/** Vehículos extra en la pista. */
export const TRAFICO_EXTRA: Record<Nivel, number> = { 1: 0, 2: 2, 3: 3 };

const NOTA = " Información de ejemplo. Revisa las reglas vigentes en sunat.gob.pe.";

function mezclar<T>(a: T[]): T[] {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

/* Todas las preguntas las crea la IA (Gemini) para cada partida: no hay preguntas escritas en el código.
   Se piden desde el menú; el juego no empieza hasta que llegan. */
const CLAVE_VISTAS = "apex-preguntas-vistas";
const leerVistas = (): string[] => {
  try {
    const j = JSON.parse(localStorage.getItem(CLAVE_VISTAS) || "[]");
    return Array.isArray(j) ? j.filter((x) => typeof x === "string").slice(-12) : [];
  } catch {
    return [];
  }
};

type Pedido = { n: Nivel; promesa: Promise<PreguntaIA[] | null>; lista: PreguntaIA[] | null };
let pedido: Pedido | null = null;

/** Pide a la IA las preguntas del nivel (si ya hay un pedido en curso o listo para ese nivel, no repite). */
export function precargarIA(n: Nivel) {
  if (!hayIA()) return;
  if (pedido && pedido.n === n) return;
  const p: Pedido = { n, lista: null, promesa: pedirPreguntas(n, leerVistas()) };
  pedido = p;
  p.promesa.then((l) => {
    if (pedido !== p) return; // ya se pidió otro nivel
    if (l) p.lista = l;
    else pedido = null; // falló: el botón "Reintentar" vuelve a pedir
    refrescarIA();
  });
}

/** ¿Ya llegaron las preguntas de la IA para este nivel? */
export const iaListaPara = (n: Nivel) => !!pedido && pedido.n === n && !!pedido.lista;

/** Arma los 3 puentes con las preguntas de la IA. Devuelve false si todavía no están listas. */
export function prepararNivel(n: Nivel): boolean {
  if (!pedido || pedido.n !== n || !pedido.lista) return false;
  const lista = pedido.lista;
  const SOLES = [60, 70, 80];
  const RIESGO = [0, 15, 25, 40];
  const SANCION = [0, -50, -85, -120];
  const convertir = (q: PreguntaIA, i: number): Pregunta => ({
    origen: "ia",
    pregunta: () => q.pregunta,
    opciones: mezclar(
      q.opciones.map((o): Opcion => {
        const g = Math.max(0, Math.min(3, Math.round(o.gravedad)));
        return o.correcta
          ? { texto: o.texto, correcta: true, riesgo: -10, soles: SOLES[i] ?? 60, oficial: o.oficial, leccion: o.leccion + NOTA }
          : {
              texto: o.texto,
              correcta: false,
              riesgo: RIESGO[Math.max(1, g)],
              soles: SANCION[Math.max(1, g)],
              oficial: o.oficial,
              leccion: o.leccion,
              delito: g >= 3,
            };
      }),
    ),
  });
  const nuevos: Puente[] = [];
  for (let i = 0; i < PUENTES_N1.length; i++) {
    const q0 = lista.find((q) => q.puente === i && q.k === 0);
    const q1 = lista.find((q) => q.puente === i && q.k === 1);
    if (!q0 || !q1) return false;
    const c0 = convertir(q0, i);
    nuevos.push({ ...PUENTES_N1[i], pregunta: c0.pregunta, opciones: c0.opciones, origen: "ia", extra: convertir(q1, i) });
  }
  PUENTES.splice(0, PUENTES.length, ...nuevos);
  try {
    const vistas = lista.map((q) => q.pregunta.slice(0, 160));
    localStorage.setItem(CLAVE_VISTAS, JSON.stringify([...leerVistas(), ...vistas].slice(-18)));
  } catch {}
  pedido = null; // ya se usaron: la próxima partida pide otras nuevas
  return true;
}
