import { useSyncExternalStore } from "react";
import { CANSANCIO_POR_NIVEL, type Nivel } from "@/lib/niveles";
import { leerProgreso } from "@/lib/semana";
import { tieneMejora } from "@/lib/tienda";

export type Genero = "el" | "ella";
export type FasePuente = "libre" | "alto" | "dialogo" | "regreso" | "parada" | "servicio" | "meta" | "arrestado";
export type Decision = { puente: number; k: number; opcion: number; correcta: boolean };
/** Una infracción: respuesta incorrecta ante la autoridad. peso 1 = error, 2 = delito. */
export type Falta = { puente: number; k: number; peso: number };

/** Con estos puntos de infracción el policía te arresta (4 si compraste "Un punto de paciencia"). */
export const limiteFaltas = () => (tieneMejora(leerProgreso().compras, "paciencia") ? 4 : 3);
export type Objetivo = "" | "bodega" | "local" | "oficial" | "volver" | "listo";
export type TipoLugar = "garaje" | "servicio" | "puente";
export type Compra = { lugar: string; monto: number; conComprobante: boolean };
export type Comprobante = "boleta" | "factura" | "ninguno";
export type Venta = { negocio: string; monto: number; comprobante: Comprobante; acierto: boolean };
export type EstadoCliente = "" | "llamando" | "sale" | "listo" | "vuelve";

export const CAPITAL = 150;
export const SALUD_POR_SEGUNDO = 1;

export const estado = {
  x: 0,
  z: 0,
  ax: 0,
  az: 0,
  nuevoCarril: null as number | null,
  activo: false,
  velocidad: 1,
  turbo: 1,
  golpe: 0,
  soles: 0,
  perdido: 0,
  choques: 0,
  riesgo: 20,
  integridad: 100,
  salud: 100,
  defensa: false,
  kits: 0,
  botiquines: 0,
  yapeUsado: false,
  berma: 1,
  bocinaT: 0,
  comedor: false,
  comedorT: 0,
  platoColor: "#f0c987",
  bebidaColor: "",
  nivel: 1 as Nivel,
  cajas: 4,
  kmh: 0,
  papeleta: null as null | { kmh: number; limite: number; multa: number; t: number },
  infracciones: [] as { kmh: number; limite: number; multa: number }[],
  entregaActiva: false,
  cliente: "" as EstadoCliente,
  clienteT: 0,
  ventas: 0,
  entregas: [] as Venta[],
  aprendidas: [] as string[],
  inmuneHasta: 0,
  noEstacionarHasta: 0,
  apie: false,
  base: 0,
  tipoLugar: "garaje" as TipoLugar,
  lugar: "",
  puerta: "",
  dentro: false,
  objetivo: "" as Objetivo,
  cerca: "" as string,
  hacerAccion: null as null | (() => void),
  orbita: { yaw: 0, pitch: 0, arrastrando: false },
  fase: "libre" as FasePuente,
  puente: 0,
  servicio: 0,
  decisiones: [] as Decision[],
  faltas: [] as Falta[],
  compras: [] as Compra[],
  consultas: [] as string[],
  gastoAbogado: 0,
  genero: "el" as Genero,
};

const oyentes = new Set<() => void>();
const avisar = () => oyentes.forEach((f) => f());
const limitar = (n: number) => Math.max(0, Math.min(100, n));

export function sumarSoles(n: number) {
  estado.soles += n;
  avisar();
}

export function chocar(multa: number) {
  if (estado.fase !== "libre" || !estado.activo) return;
  if (performance.now() < estado.inmuneHasta) return;
  estado.perdido = Math.min(estado.soles, multa);
  estado.soles -= estado.perdido;
  estado.choques += 1;
  estado.integridad = limitar(estado.integridad - (estado.defensa ? 9 : 18));
  estado.salud = limitar(estado.salud - 10);
  estado.inmuneHasta = performance.now() + 1200;
  if (estado.integridad <= 0 || estado.salud <= 0) {
    estado.velocidad = 0;
    estado.berma = estado.x < 0 ? -1 : 1;
    estado.fase = "parada";
  }
  avisar();
}

/* Pasa el tiempo manejando: el piloto se cansa y le da hambre. */
let enteroSalud = 100;
export function cansar(dt: number) {
  if (estado.fase !== "libre" || !estado.activo || estado.apie) return;
  estado.salud = Math.max(0, estado.salud - dt * SALUD_POR_SEGUNDO * CANSANCIO_POR_NIVEL[estado.nivel]);
  const n = Math.round(estado.salud);
  if (n !== enteroSalud) {
    enteroSalud = n;
    if (estado.salud <= 0) {
      estado.velocidad = 0;
      estado.berma = estado.x < 0 ? -1 : 1;
      estado.fase = "parada";
    }
    avisar();
  }
}

/* Velocímetro: solo avisa cuando cambia el número entero. */
export function ponerKmh(n: number) {
  const k = Math.max(0, Math.round(n));
  if (k === estado.kmh) return;
  estado.kmh = k;
  avisar();
}

/* Un radar te midió por encima del límite: papeleta y multa. */
export function multarVelocidad(kmh: number, limite: number, multa: number, riesgo: number) {
  const m = Math.min(estado.soles, multa);
  estado.soles -= m;
  estado.riesgo = limitar(estado.riesgo + riesgo);
  estado.infracciones.push({ kmh, limite, multa: m });
  estado.papeleta = { kmh, limite, multa: m, t: performance.now() };
  avisar();
}

export function cambiarFase(f: FasePuente) {
  estado.fase = f;
  avisar();
}

export function decidir(
  puente: number,
  opcion: number,
  correcta: boolean,
  riesgo: number,
  soles: number,
  k = 0,
  peso = 0,
) {
  estado.decisiones.push({ puente, k, opcion, correcta });
  if (!correcta && peso > 0) estado.faltas.push({ puente, k, peso });
  estado.riesgo = limitar(estado.riesgo + riesgo);
  estado.soles = Math.max(0, estado.soles + soles);
  avisar();
}

export const puntosFaltas = () => estado.faltas.reduce((t, f) => t + f.peso, 0);

/* Después de cada respuesta: si ya juntaste 3 puntos de infracción, el policía te arresta. */
export function evaluarArresto(): boolean {
  if (puntosFaltas() < limiteFaltas()) return false;
  estado.velocidad = 0;
  estado.fase = "arrestado";
  avisar();
  return true;
}

export function terminarPuente() {
  estado.puente += 1;
  estado.velocidad = 1;
  estado.fase = "libre";
  avisar();
}

/* El mototaxi llegó a una parada de servicio: el personaje baja y camina al local. */
export function llegarAServicio(base: number, lugar: string, puerta: string, entrega = false) {
  estado.velocidad = 0;
  estado.entregaActiva = entrega;
  estado.cliente = "";
  estado.base = base;
  estado.tipoLugar = "servicio";
  estado.lugar = lugar;
  estado.puerta = puerta;
  estado.objetivo = "local";
  estado.cerca = "";
  estado.apie = true;
  estado.fase = "servicio";
  avisar();
}

/* El mototaxi llegó a un puente: el personaje baja y camina hasta el oficial. */
export function llegarAPuente(base: number, oficial: string) {
  estado.velocidad = 0;
  estado.base = base;
  estado.tipoLugar = "puente";
  estado.lugar = oficial;
  estado.puerta = "Hablar con " + oficial;
  estado.objetivo = "oficial";
  estado.cerca = "";
  estado.apie = true;
  estado.fase = "alto";
  avisar();
}

/* Terminó la charla del puente: hay que volver al mototaxi. */
export function concluirPuente() {
  estado.puente += 1;
  estado.objetivo = "volver";
  estado.fase = "regreso";
  avisar();
}

/* Pago en una parada de servicio. Devuelve false si no alcanza el dinero. */
export function pagarServicio(
  lugar: string,
  monto: number,
  conComprobante: boolean,
  riesgo: number,
  efecto: { integridad: number; salud: number; kits: number; botiquines: number },
) {
  if (estado.soles < monto) return false;
  estado.soles -= monto;
  estado.riesgo = limitar(estado.riesgo + riesgo);
  estado.integridad = limitar(estado.integridad + efecto.integridad);
  estado.salud = limitar(estado.salud + efecto.salud);
  estado.kits += efecto.kits;
  estado.botiquines += efecto.botiquines;
  estado.compras.push({ lugar, monto, conComprobante });
  avisar();
  return true;
}

/* Pagas una consulta al abogado: bajas tu riesgo y te queda anotada para los puentes. */
export function consultarAbogado(id: string, costo: number, riesgo: number) {
  const gratis = estado.consultas.length === 0 && tieneMejora(leerProgreso().compras, "consulta");
  if (gratis) costo = 0;
  if (estado.consultas.includes(id) || estado.soles < costo) return false;
  estado.soles -= costo;
  estado.gastoAbogado += costo;
  estado.riesgo = limitar(estado.riesgo + riesgo);
  estado.consultas.push(id);
  avisar();
  return true;
}

export function setComedor(on: boolean) {
  estado.comedor = on;
  estado.comedorT = 0;
  avisar();
}

/* El mesero trae el plato: empieza a contar el tiempo del servicio. */
export function pedirEnComedor(color: string, bebida = "") {
  estado.comedorT = performance.now();
  estado.platoColor = color;
  estado.bebidaColor = bebida;
  avisar();
}

/* Te comiste el plato: se recupera lo que corresponda. */
export function consumirServicio(efecto: { integridad: number; salud: number; kits: number; botiquines: number }) {
  estado.integridad = limitar(estado.integridad + efecto.integridad);
  estado.salud = limitar(estado.salud + efecto.salud);
  estado.kits += efecto.kits;
  estado.botiquines += efecto.botiquines;
  avisar();
}

/* Pagas la cuenta de lo que consumiste. */
export function cobrarServicio(lugar: string, monto: number, conComprobante: boolean, riesgo: number) {
  estado.soles = Math.max(0, estado.soles - monto);
  estado.riesgo = limitar(estado.riesgo + riesgo);
  estado.compras.push({ lugar, monto, conComprobante });
  avisar();
}

/* ---------- Garaje (antes de salir) ---------- */

export function prepararPartida() {
  reiniciarPartida();
  estado.base = 0;
  estado.tipoLugar = "garaje";
  estado.velocidad = 0;
  estado.soles = CAPITAL;
  estado.apie = true;
  estado.objetivo = "bodega";
  /* Mejoras compradas en la tienda del menú. */
  const compras = leerProgreso().compras;
  if (tieneMejora(compras, "kit")) estado.kits += 1;
  if (tieneMejora(compras, "botiquin")) estado.botiquines += 1;
  avisar();
}

/* ---------- A pie ---------- */

export function ponerCerca(id: string) {
  if (estado.cerca === id) return;
  estado.cerca = id;
  avisar();
}

export function entrarATienda() {
  estado.dentro = true;
  estado.cerca = "";
  avisar();
}

/* Entregas: llamas al cliente, sale del negocio y viene hacia ti. */
export function llamarCliente() {
  if (estado.cliente !== "") return;
  estado.cliente = "llamando";
  estado.clienteT = performance.now();
  estado.cerca = "";
  avisar();
}

export function clienteLlego() {
  estado.cliente = "listo";
  estado.dentro = true;
  estado.cerca = "";
  avisar();
}

/* Cobras una venta: entra a tu caja y a tus ventas. */
export function registrarVenta(
  negocio: string,
  monto: number,
  comprobante: Comprobante,
  acierto: boolean,
  riesgo: number,
  extra = 0,
) {
  const total = monto + extra;
  estado.soles += total;
  estado.ventas += total;
  estado.riesgo = limitar(estado.riesgo + riesgo);
  estado.entregas.push({ negocio, monto: total, comprobante, acierto });
  estado.cajas = Math.max(0, estado.cajas - 2); // entregaste parte de la carga
  avisar();
}

export function salirDeTienda() {
  if (estado.cliente === "listo") {
    estado.cliente = "vuelve";
    estado.clienteT = performance.now();
  }
  estado.dentro = false;
  estado.objetivo = "volver";
  avisar();
}

/* Rescate: bajar de nuevo si quedaste sobre el mototaxi con el puente cerrado. */
export function volverABajar() {
  estado.apie = true;
  estado.objetivo = "oficial";
  estado.cerca = "";
  avisar();
}

export function terminarSubida() {
  const enRuta = estado.fase === "servicio" || estado.fase === "regreso";
  if (estado.fase === "servicio") estado.servicio += 1;
  estado.apie = false;
  estado.cerca = "";
  estado.dentro = false;
  estado.cliente = "";
  estado.entregaActiva = false;
  if (enRuta) {
    estado.objetivo = "";
    estado.velocidad = 1;
    estado.fase = "libre";
    estado.inmuneHasta = performance.now() + 1500;
  } else {
    estado.objetivo = "listo";
  }
  avisar();
}

export function registrarCompra(
  lugar: string,
  monto: number,
  conComprobante: boolean,
  riesgo: number,
) {
  estado.soles = Math.max(0, estado.soles - monto);
  estado.riesgo = limitar(estado.riesgo + riesgo);
  estado.compras.push({ lugar, monto, conComprobante });
  avisar();
}

export function equipar(defensa: boolean, kits: number, botiquines: number) {
  estado.defensa = estado.defensa || defensa;
  estado.kits += kits;
  estado.botiquines += botiquines;
  avisar();
}

/* ---------- Estacionar y reparar en ruta ---------- */

export function estacionar() {
  if (estado.fase !== "libre" || !estado.activo) return;
  if (performance.now() < estado.noEstacionarHasta) return;
  estado.velocidad = 0;
  estado.berma = estado.x < 0 ? -1 : 1;
  estado.fase = "parada";
  avisar();
}

export function reanudar() {
  if (estado.integridad <= 0 || estado.salud <= 0) return;
  estado.velocidad = 1;
  estado.nuevoCarril = estado.berma;
  estado.fase = "libre";
  estado.inmuneHasta = performance.now() + 2500;
  estado.noEstacionarHasta = performance.now() + 500;
  avisar();
}

export function usarKit() {
  if (estado.kits <= 0) return;
  estado.kits -= 1;
  estado.integridad = limitar(estado.integridad + 40);
  avisar();
}

export function usarBotiquin() {
  if (estado.botiquines <= 0) return;
  estado.botiquines -= 1;
  estado.salud = limitar(estado.salud + 40);
  avisar();
}

export function repararConMecanico(monto: number, conComprobante: boolean, riesgo: number) {
  estado.soles = Math.max(0, estado.soles - monto);
  estado.integridad = 100;
  estado.riesgo = limitar(estado.riesgo + riesgo);
  estado.compras.push({ lugar: "Mecánico de ruta", monto, conComprobante });
  avisar();
}

/* Bonificación por aprender: se gana una sola vez por cada tema. */
export function aprender(id: string, monto: number) {
  if (estado.aprendidas.includes(id)) return false;
  estado.aprendidas.push(id);
  estado.soles += monto;
  avisar();
  return true;
}

export const YAPE = 60;

export function pedirYape() {
  if (estado.yapeUsado) return;
  estado.yapeUsado = true;
  estado.soles += YAPE;
  avisar();
}

export function auxilioDeRuta() {
  const cobro = Math.min(estado.soles, 80);
  estado.soles -= cobro;
  estado.integridad = Math.max(estado.integridad, 40);
  estado.salud = Math.max(estado.salud, 40);
  avisar();
  return cobro;
}

export function reiniciarPartida() {
  estado.soles = 0;
  estado.choques = 0;
  estado.perdido = 0;
  estado.golpe = 0;
  estado.velocidad = 1;
  estado.turbo = 1;
  estado.nuevoCarril = null;
  estado.riesgo = 20;
  estado.integridad = 100;
  estado.salud = 100;
  enteroSalud = 100;
  estado.defensa = false;
  estado.kits = 0;
  estado.botiquines = 0;
  estado.yapeUsado = false;
  estado.aprendidas = [];
  estado.inmuneHasta = 0;
  estado.noEstacionarHasta = 0;
  estado.orbita.yaw = 0;
  estado.orbita.pitch = 0;
  estado.orbita.arrastrando = false;
  estado.apie = false;
  estado.base = 0;
  estado.tipoLugar = "garaje";
  estado.comedor = false;
  estado.dentro = false;
  estado.objetivo = "";
  estado.cerca = "";
  estado.fase = "libre";
  estado.puente = 0;
  estado.servicio = 0;
  estado.decisiones = [];
  estado.faltas = [];
  estado.compras = [];
  estado.consultas = [];
  estado.gastoAbogado = 0;
  estado.ventas = 0;
  estado.cajas = 4;
  estado.entregas = [];
  estado.infracciones = [];
  estado.papeleta = null;
  estado.kmh = 0;
  estado.cliente = "";
  estado.entregaActiva = false;
  avisar();
}

export function suscribir(f: () => void) {
  oyentes.add(f);
  return () => {
    oyentes.delete(f);
  };
}

export function useCliente() {
  return useSyncExternalStore(suscribir, () => estado.cliente, () => "" as EstadoCliente);
}

export function useCajas() {
  return useSyncExternalStore(suscribir, () => estado.cajas, () => 4);
}

export function useKmh() {
  return useSyncExternalStore(suscribir, () => estado.kmh, () => 0);
}

export function usePapeleta() {
  return useSyncExternalStore(suscribir, () => estado.papeleta, () => null);
}

export function useVentas() {
  return useSyncExternalStore(suscribir, () => estado.ventas, () => 0);
}

export function useComedor() {
  return useSyncExternalStore(suscribir, () => estado.comedor, () => false);
}

export function useServicio() {
  return useSyncExternalStore(suscribir, () => estado.servicio, () => 0);
}

export function useSoles() {
  return useSyncExternalStore(suscribir, () => estado.soles, () => 0);
}

export function useChoques() {
  return useSyncExternalStore(suscribir, () => estado.choques, () => 0);
}

export function useRiesgo() {
  return useSyncExternalStore(suscribir, () => estado.riesgo, () => 20);
}

export function useFase() {
  return useSyncExternalStore(suscribir, () => estado.fase, () => "libre" as FasePuente);
}

export function useFaltas() {
  return useSyncExternalStore(suscribir, () => puntosFaltas(), () => 0);
}

export function usePuente() {
  return useSyncExternalStore(suscribir, () => estado.puente, () => 0);
}

export function useIntegridad() {
  return useSyncExternalStore(suscribir, () => estado.integridad, () => 100);
}

export function useSalud() {
  return useSyncExternalStore(suscribir, () => Math.round(estado.salud), () => 100);
}

export function useKits() {
  return useSyncExternalStore(suscribir, () => estado.kits, () => 0);
}

export function useBotiquines() {
  return useSyncExternalStore(suscribir, () => estado.botiquines, () => 0);
}

export function useApie() {
  return useSyncExternalStore(suscribir, () => estado.apie, () => false);
}

export function useDentro() {
  return useSyncExternalStore(suscribir, () => estado.dentro, () => false);
}

export function useObjetivo() {
  return useSyncExternalStore(suscribir, () => estado.objetivo, () => "" as Objetivo);
}

export function useCerca() {
  return useSyncExternalStore(suscribir, () => estado.cerca, () => "");
}
