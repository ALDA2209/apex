import { BARBAS, CASCOS, COLORES, LENTES, PERFIL_INICIAL, SIN_CASCO, type Perfil } from "@/lib/perfil";

/* La tienda: aquí se gasta el dinero de la billetera. Lo básico viene gratis; lo demás se compra. */

export type Grupo = "moto" | "cabeza" | "mejora";

export type Item = {
  id: string;
  grupo: Grupo;
  /** subgrupo para ordenar: color, casco, lentes, barba */
  tipo: string;
  nombre: string;
  detalle?: string;
  precio: number;
  /** foto chica (generada del modelo 3D) que se ve en la tienda */
  imagen?: string;
  /** cómo queda el perfil si te lo pones */
  poner?: (p: Perfil) => Perfil;
  /** ¿ya lo llevas puesto? */
  puesto?: (p: Perfil) => boolean;
};

const PRECIO_COLOR = 40;

const colores: Item[] = COLORES.map((c, i) => ({
  id: `color:${c.valor}`,
  grupo: "moto" as const,
  tipo: "color",
  nombre: c.nombre,
  precio: i === 0 ? 0 : PRECIO_COLOR,
  imagen: `/tienda/moto-${i}.png`,
  poner: (p) => ({ ...p, color: c.valor }),
  puesto: (p) => p.color === c.valor,
}));

const personalizado: Item = {
  id: "color:libre",
  grupo: "moto",
  tipo: "color",
  nombre: "A tu gusto",
  detalle: "Elige cualquier color",
  precio: 120,
  imagen: "/tienda/moto-libre.png",
  puesto: (p) => !COLORES.some((c) => c.valor === p.color),
};

const cascos: Item[] = [
  { id: "casco:sin", grupo: "cabeza", tipo: "casco", nombre: "Sin casco", imagen: "/tienda/cara-base.png", precio: 0, poner: (p) => ({ ...p, casco: SIN_CASCO }), puesto: (p) => p.casco === SIN_CASCO },
  ...CASCOS.map((n, i) => ({
    id: `casco:${i}`,
    grupo: "cabeza" as const,
    tipo: "casco",
    nombre: n,
    imagen: `/tienda/casco-${i}.png`,
    precio: 60,
    poner: (p: Perfil) => ({ ...p, casco: i }),
    puesto: (p: Perfil) => p.casco === i,
  })),
];

const lentes: Item[] = LENTES.map((n, i) => ({
  id: `lentes:${i}`,
  grupo: "cabeza" as const,
  tipo: "lentes",
  nombre: n,
  imagen: i === 0 ? "/tienda/cara-base.png" : `/tienda/lentes-${i}.png`,
  precio: i === 0 ? 0 : i === 1 ? 40 : 60,
  poner: (p: Perfil) => ({ ...p, lentes: i }),
  puesto: (p: Perfil) => (p.lentes ?? 0) === i,
}));

const barbas: Item[] = BARBAS.map((n, i) => ({
  id: `barba:${i}`,
  grupo: "cabeza" as const,
  tipo: "barba",
  nombre: n,
  imagen: i === 0 ? "/tienda/cara-base.png" : `/tienda/barba-${i}.png`,
  precio: i === 0 ? 0 : i === 1 ? 30 : 40,
  poner: (p: Perfil) => ({ ...p, barba: i }),
  puesto: (p: Perfil) => (p.barba ?? 0) === i,
}));

/* Mejoras que ayudan a jugar. Se compran una vez y valen todos los días. */
export const MEJORAS: Item[] = [
  { id: "mejora:kit", grupo: "mejora", tipo: "mejora", nombre: "Kit de reparación de regalo", detalle: "Empiezas cada día con 1 kit extra para arreglar el mototaxi en ruta.", precio: 150 },
  { id: "mejora:botiquin", grupo: "mejora", tipo: "mejora", nombre: "Botiquín de regalo", detalle: "Empiezas cada día con 1 botiquín extra para recuperar tu salud.", precio: 150 },
  { id: "mejora:consulta", grupo: "mejora", tipo: "mejora", nombre: "Primera consulta gratis", detalle: "La primera consulta al abogado de cada día no te cuesta nada.", precio: 200 },
  { id: "mejora:paciencia", grupo: "mejora", tipo: "mejora", nombre: "Un punto de paciencia", detalle: "El policía te arresta con 4 puntos de infracción en vez de 3.", precio: 300 },
];

export const CATALOGO: Item[] = [...colores, personalizado, ...cascos, ...lentes, ...barbas, ...MEJORAS];

export const itemPorId = (id: string) => CATALOGO.find((i) => i.id === id);

/** ¿Lo puedes usar? Lo gratis siempre; lo demás, si ya lo compraste. */
export const esTuyo = (i: Item, compras: string[]) => i.precio === 0 || compras.includes(i.id);

export const tieneMejora = (compras: string[], id: string) => compras.includes(`mejora:${id}`);

/* Si en tu perfil quedó algo que no compraste (por ejemplo, de antes de la tienda), se vuelve a lo básico. */
export function perfilPermitido(p: Perfil, compras: string[]): Perfil {
  let r = { ...p };
  const libre = !COLORES.some((c) => c.valor === r.color);
  const colorOk = libre ? compras.includes("color:libre") : esTuyo(itemPorId(`color:${r.color}`) ?? colores[0], compras);
  if (!colorOk) r.color = PERFIL_INICIAL.color;
  const revisar = (id: string, base: () => void) => {
    const it = itemPorId(id);
    if (!it || !esTuyo(it, compras)) base();
  };
  revisar(r.casco === SIN_CASCO ? "casco:sin" : `casco:${r.casco}`, () => (r.casco = SIN_CASCO));
  revisar(`lentes:${r.lentes ?? 0}`, () => (r.lentes = 0));
  revisar(`barba:${r.barba ?? 0}`, () => (r.barba = 0));
  return r;
}
