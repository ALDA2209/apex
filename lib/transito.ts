/* Límites de velocidad de la ruta y radares.
   Los límites de 30 y 50 km/h siguen los límites urbanos del MTC (calles y zonas
   comerciales/escolares 30, avenidas 50). Los montos de las multas son de juego. */

export const KMH_POR_VEL = 30; // velocidad normal del mototaxi = 30 km/h
export const TOLERANCIA = 3; // km/h de margen antes de multar

export type Tramo = { desde: number; hasta: number; limite: number; nombre: string };

export const TRAMOS: Tramo[] = [
  { desde: 0, hasta: 160, limite: 50, nombre: "Avenida" },
  { desde: 160, hasta: 350, limite: 30, nombre: "Zona comercial" },
  { desde: 350, hasta: 560, limite: 50, nombre: "Avenida" },
  { desde: 560, hasta: 700, limite: 30, nombre: "Zona escolar" },
  { desde: 700, hasta: 9999, limite: 50, nombre: "Avenida" },
];

/** Distancia (m desde la salida) donde está cada radar. */
export const RADARES = [80, 190, 385, 590, 800];

export function tramoEn(d: number): Tramo {
  return TRAMOS.find((t) => d >= t.desde && d < t.hasta) ?? TRAMOS[TRAMOS.length - 1];
}

/** Multa de juego según cuánto te pasaste del límite. */
export function multaPorExceso(exceso: number): { monto: number; riesgo: number } {
  if (exceso > 30) return { monto: 80, riesgo: 12 };
  if (exceso > 10) return { monto: 40, riesgo: 8 };
  return { monto: 20, riesgo: 5 };
}
