import { useSyncExternalStore } from "react";
import type { Nivel } from "@/lib/niveles";

/* La semana de trabajo: de lunes a viernes. Cada día es una ruta; el dinero y la experiencia
   se guardan en este dispositivo (localStorage) y sirven para la tienda. */

export type Dia = { n: number; nombre: string; corto: string; nivel: Nivel; tema: string };

export const DIAS: Dia[] = [
  { n: 1, nombre: "Lunes", corto: "LUN", nivel: 1, tema: "Comprobantes en la carretera" },
  { n: 2, nombre: "Martes", corto: "MAR", nivel: 1, tema: "La guía de remisión y el traslado" },
  { n: 3, nombre: "Miércoles", corto: "MIÉ", nivel: 2, tema: "Aduana y mercadería importada" },
  { n: 4, nombre: "Jueves", corto: "JUE", nivel: 2, tema: "Ventas, Yape y comprobantes" },
  { n: 5, nombre: "Viernes", corto: "VIE", nivel: 3, tema: "El gran operativo de Fiscalía" },
];

export const RANGOS = [
  { nombre: "Aprendiz", desde: 0 },
  { nombre: "Repartidor", desde: 150 },
  { nombre: "Experto", desde: 400 },
  { nombre: "Empresario", desde: 800 },
];

/** Cuánto vale cada cosa (dinero y experiencia de juego, no reales). */
export const PREMIO = {
  porRespuestaBien: 20,
  rutaLimpia: 30,
  xpRespuesta: 10,
  xpVentaConComprobante: 15,
  xpCompraConComprobante: 10,
  xpDia: 50,
  xpRutaLimpia: 20,
  multaArresto: 40,
};

export type Progreso = {
  semana: number;
  dia: number;
  dinero: number;
  xp: number;
  /** días de esta semana ya completados */
  hechos: number[];
  /** cosas compradas en la tienda (para el paso 2) */
  compras: string[];
};

export type ResultadoDia = {
  dia: number;
  ganancia: number;
  xp: number;
  porRespuestas: number;
  porCaja: number;
  rutaLimpia: boolean;
  rangoAntes: string;
  rangoDespues: string;
  semanaCerrada: boolean;
};

const CLAVE = "apex-progreso";
const INICIAL: Progreso = { semana: 1, dia: 1, dinero: 0, xp: 0, hechos: [], compras: [] };

let progreso: Progreso = { ...INICIAL };
let cargado = false;
const oyentes = new Set<() => void>();
const avisar = () => oyentes.forEach((f) => f());

function guardar() {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(progreso));
  } catch {}
}

export function cargarProgreso() {
  if (cargado) return;
  cargado = true;
  try {
    const j = JSON.parse(localStorage.getItem(CLAVE) || "null");
    if (j && typeof j === "object") {
      progreso = {
        semana: Math.max(1, Number(j.semana) || 1),
        dia: Math.min(5, Math.max(1, Number(j.dia) || 1)),
        dinero: Math.max(0, Number(j.dinero) || 0),
        xp: Math.max(0, Number(j.xp) || 0),
        hechos: Array.isArray(j.hechos) ? j.hechos.filter((x: unknown) => typeof x === "number") : [],
        compras: Array.isArray(j.compras) ? j.compras.filter((x: unknown) => typeof x === "string") : [],
      };
    }
  } catch {}
  avisar();
}

export const leerProgreso = () => progreso;
export const diaActual = (): Dia => DIAS[Math.min(4, Math.max(0, progreso.dia - 1))];
export const nivelDelDia = (n: number): Nivel => DIAS[Math.min(4, Math.max(0, n - 1))].nivel;

export function rangoDe(xp: number) {
  let i = 0;
  RANGOS.forEach((r, k) => {
    if (xp >= r.desde) i = k;
  });
  const sig = RANGOS[i + 1];
  return { nombre: RANGOS[i].nombre, desde: RANGOS[i].desde, siguiente: sig?.desde ?? null, nombreSiguiente: sig?.nombre ?? null };
}

/** Modo demostración: saltar a cualquier día sin tocar el dinero. */
export function elegirDia(n: number) {
  progreso = { ...progreso, dia: Math.min(5, Math.max(1, n)) };
  guardar();
  avisar();
}

type Datos = { soles: number; capital: number; correctas: number; comprasConComprobante: number; ventasConComprobante: number; faltas: number };

/* Terminaste el día: se paga la ganancia y se suma la experiencia. */
export function cobrarDia(d: Datos): ResultadoDia {
  const antes = rangoDe(progreso.xp).nombre;
  const porCaja = Math.max(0, Math.round(d.soles - d.capital));
  const porRespuestas = d.correctas * PREMIO.porRespuestaBien;
  const rutaLimpia = d.faltas === 0;
  const ganancia = porCaja + porRespuestas + (rutaLimpia ? PREMIO.rutaLimpia : 0);
  const xp =
    d.correctas * PREMIO.xpRespuesta +
    d.ventasConComprobante * PREMIO.xpVentaConComprobante +
    d.comprasConComprobante * PREMIO.xpCompraConComprobante +
    PREMIO.xpDia +
    (rutaLimpia ? PREMIO.xpRutaLimpia : 0);
  const hechos = progreso.hechos.includes(progreso.dia) ? progreso.hechos : [...progreso.hechos, progreso.dia];
  const dia = progreso.dia;
  progreso = { ...progreso, dinero: progreso.dinero + ganancia, xp: progreso.xp + xp, hechos };
  guardar();
  avisar();
  return {
    dia,
    ganancia,
    xp,
    porRespuestas,
    porCaja,
    rutaLimpia,
    rangoAntes: antes,
    rangoDespues: rangoDe(progreso.xp).nombre,
    semanaCerrada: dia === 5,
  };
}

/* Te arrestaron: no cobras el día y pagas una multa, pero la experiencia de lo que respondiste bien se queda. */
export function perderDia(correctas: number) {
  const multa = Math.min(progreso.dinero, PREMIO.multaArresto);
  const xp = correctas * PREMIO.xpRespuesta;
  progreso = { ...progreso, dinero: progreso.dinero - multa, xp: progreso.xp + xp };
  guardar();
  avisar();
  return { multa, xp };
}

/* Pasar al día siguiente; después del viernes empieza una semana nueva. */
export function siguienteDia() {
  if (progreso.dia >= 5) progreso = { ...progreso, semana: progreso.semana + 1, dia: 1, hechos: [] };
  else progreso = { ...progreso, dia: progreso.dia + 1 };
  guardar();
  avisar();
}

/* Comprar en la tienda: se descuenta de la billetera. */
export function comprar(id: string, precio: number): boolean {
  if (progreso.compras.includes(id) || progreso.dinero < precio) return false;
  progreso = { ...progreso, dinero: progreso.dinero - precio, compras: [...progreso.compras, id] };
  guardar();
  avisar();
  return true;
}

export function suscribirProgreso(f: () => void) {
  oyentes.add(f);
  return () => {
    oyentes.delete(f);
  };
}

export function useProgreso() {
  return useSyncExternalStore(suscribirProgreso, leerProgreso, () => INICIAL);
}
