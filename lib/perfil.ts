export type Perfil = { nombre: string; color: string; casco: number; piel: number };

export const COLORES = [
  { nombre: "Ámbar", valor: "#ff7a3d" },
  { nombre: "Turquesa", valor: "#2dd4bf" },
  { nombre: "Índigo", valor: "#6d7bff" },
  { nombre: "Carmesí", valor: "#f43f5e" },
  { nombre: "Lima", valor: "#a3e635" },
];

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
};
