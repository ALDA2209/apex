export type Opcion = {
  texto: string;
  correcta: boolean;
  riesgo: number;
  soles: number;
  oficial: string;
  leccion: string;
  /** Delito (ofrecer coima, comprobantes falsos…): cuenta doble en las infracciones. */
  delito?: boolean;
};

/** Una pregunta de la autoridad con sus alternativas. */
export type Pregunta = {
  pregunta: (trato: string) => string;
  opciones: Opcion[];
  /** Todas las preguntas las crea la IA (Gemini) para cada partida. */
  origen?: "ia";
};

export type Puente = {
  titulo: string;
  subtitulo: string;
  distancia: number;
  oficial: string;
  insignia: string;
  uniforme: string;
  banda: string;
  pregunta: (trato: string) => string;
  opciones: Opcion[];
  origen?: "ia";
  /** Segunda pregunta del interrogatorio en este puente. */
  extra?: Pregunta;
};

/* Datos fijos de cada puente (oficial, lugar, distancia). Las preguntas las pone la IA al empezar. */
export const PUENTES_N1: Puente[] = [
  {
    titulo: "PUENTE 1",
    subtitulo: "CONTROL DE COMPROBANTES",
    distancia: 150,
    oficial: "Oficial Ramos",
    insignia: "OF",
    uniforme: "#1f3a5f",
    banda: "#d9ff3f",
    pregunta: () => "",
    opciones: [],
  },
  {
    titulo: "PUENTE 2",
    subtitulo: "ADUANA",
    distancia: 440,
    oficial: "Agente Mendoza",
    insignia: "AD",
    uniforme: "#14532d",
    banda: "#d9ff3f",
    pregunta: () => "",
    opciones: [],
  },
  {
    titulo: "PUENTE 3",
    subtitulo: "OPERATIVO CON FISCALÍA",
    distancia: 750,
    oficial: "Fiscal Paredes",
    insignia: "FI",
    uniforme: "#2b2540",
    banda: "#ffffff",
    pregunta: () => "",
    opciones: [],
  },
];

/* Lista de trabajo: se llena con el nivel elegido (ver niveles.ts). */
export const PUENTES: Puente[] = [...PUENTES_N1];

/** La pregunta k (0 = primera, 1 = segunda) del puente i. */
export function preguntaDe(i: number, k: number): Pregunta | undefined {
  const p = PUENTES[i];
  if (!p) return undefined;
  return k === 0 ? p : p.extra;
}

export const esDelito = (o: Opcion) => !o.correcta && (o.delito ?? o.riesgo >= 35);
/** Puntos de infracción de una respuesta: 0 si es correcta, 1 si es un error, 2 si es un delito. */
export const puntosDe = (o: Opcion) => (o.correcta ? 0 : esDelito(o) ? 2 : 1);
