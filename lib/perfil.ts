export type Perfil = {
  nombre: string;
  color: string;
  casco: number;
  piel: number;
  /** modelo de mototaxi: 0 real (3D), 1 cabina de dos tonos, 2 clásico */
  moto?: number;
  /** personaje: 0 repartidor, 1 emprendedor, 2 aventurero */
  avatar?: number;
};

export const COLORES = [
  { nombre: "Celeste", valor: "#3aa8f0" },
  { nombre: "Ámbar", valor: "#ff7a3d" },
  { nombre: "Turquesa", valor: "#2dd4bf" },
  { nombre: "Índigo", valor: "#6d7bff" },
  { nombre: "Carmesí", valor: "#f43f5e" },
  { nombre: "Lima", valor: "#a3e635" },
  { nombre: "Azul", valor: "#2e6bff" },
  { nombre: "Rojo", valor: "#e0262e" },
];

export const MOTOS = [
  { nombre: "Real", detalle: "Modelo 3D, techo blanco" },
  { nombre: "Cabina", detalle: "Dibujado, dos tonos" },
  { nombre: "Clásico", detalle: "Dibujado, con baca" },
];

export type Atuendo = {
  nombre: string;
  detalle: string;
  torso: string;
  pantalon: string;
  /** chaleco con el color del perfil */
  chaleco: boolean;
  bolso: boolean;
  /** 0 pelo corto, 1 gorra, 2 pelo largo */
  pelo: 0 | 1 | 2;
  colorPelo: string;
};

export const AVATARES: Atuendo[] = [
  { nombre: "Repartidor", detalle: "Traje oscuro", torso: "#222838", pantalon: "#1b2030", chaleco: false, bolso: false, pelo: 0, colorPelo: "#17120f" },
  { nombre: "Emprendedor", detalle: "Camisa y chaleco", torso: "#e9edf5", pantalon: "#2b4a7a", chaleco: true, bolso: false, pelo: 1, colorPelo: "#17120f" },
  { nombre: "Aventurero", detalle: "Chaqueta y bolso", torso: "#4a5a3a", pantalon: "#3a3226", chaleco: false, bolso: true, pelo: 2, colorPelo: "#2a1a12" },
];

export function atuendo(p: Perfil): Atuendo {
  return AVATARES[p.avatar ?? 0] ?? AVATARES[0];
}

export const PIELES = [
  { nombre: "Arena", valor: "#f1c9a5" },
  { nombre: "Miel", valor: "#e0ac84" },
  { nombre: "Canela", valor: "#c68642" },
  { nombre: "Cacao", valor: "#8d5524" },
  { nombre: "Ébano", valor: "#5c3a21" },
];

export const CASCOS = ["Integral", "Abierto", "Cresta", "Retro"];

export const PERFIL_INICIAL: Perfil = {
  nombre: "",
  color: COLORES[0].valor,
  casco: 0,
  piel: 1,
  moto: 0,
  avatar: 0,
};
