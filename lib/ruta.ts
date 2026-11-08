export const META = 880;

export type Plato = {
  id: string;
  tipo?: "plato" | "bebida";
  nombre: string;
  desc: string;
  precio: number;
  max: number;
  integridad: number;
  salud: number;
  kits: number;
  botiquines: number;
};

export type Entrega = {
  cliente: string;
  trato: string;
  pedido: string;
  monto: number;
  /** lo que el cliente necesita: boleta, factura (con su RUC) o te pide "sin boleta" */
  quiere: "boleta" | "factura" | "sin";
  ruc?: string;
  frase: string;
  extra: number;
  color: string;
  piel: number;
};

export type Servicio = {
  entrega?: Entrega;
  titulo: string;
  nombre: string;
  letrero: [string, string];
  parqueo: { tipo: number; z: number }[];
  puerta: string;
  lugar: string;
  distancia: number;
  variante: "restaurante" | "taller" | "entrega";
  frase: string;
  carta: string;
  platos: Plato[];
  saberId: string;
  saberTitulo: string;
  saberBono: number;
  saber: string[];
};

const nada = { integridad: 0, salud: 0, kits: 0, botiquines: 0 };

export const SERVICIOS: Servicio[] = [
  {
    titulo: "ENTREGA 1",
    nombre: "BODEGA DOÑA ROSA",
    letrero: ["BODEGA DOÑA ROSA", "ABARROTES · DESDE 1998"],
    parqueo: [{ tipo: 1, z: -22 }],
    puerta: "Llamar a la dueña",
    lugar: "la Bodega Doña Rosa",
    distancia: 240,
    variante: "entrega",
    frase: "",
    carta: "",
    platos: [],
    saberId: "",
    saberTitulo: "",
    saberBono: 0,
    saber: [],
    entrega: {
      cliente: "Doña Rosa",
      trato: "la dueña de la bodega",
      pedido: "6 cajas de galletas y 4 bolsas de arroz",
      monto: 90,
      quiere: "sin",
      frase: "¡Buenas, joven! Qué bueno que llegó mi pedido. Oye, si no me das boleta te pago S/ 10 más, ¿ya?",
      extra: 10,
      color: "#fda4af",
      piel: 2,
    },
  },
  {
    titulo: "PARADA 1",
    nombre: "RESTAURANTE EL FOGÓN",
    letrero: ["EL FOGÓN", "RESTAURANTE · COMIDA TÍPICA"],
    parqueo: [
      { tipo: 1, z: -18.5 },
      { tipo: 4, z: -27 },
      { tipo: 0, z: -36 },
      { tipo: 6, z: 7 },
    ],
    puerta: "Entrar al restaurante",
    lugar: "el restaurante",
    distancia: 330,
    variante: "restaurante",
    frase: "Hora de recuperar fuerzas. Elige tu plato de la carta.",
    carta: "Carta del día",
    platos: [
      {
        id: "ceviche",
        nombre: "Ceviche de pescado",
        desc: "Pescado fresco en limón, cebolla y ají, con camote y choclo. El plato bandera del Perú.",
        precio: 24,
        max: 2,
        ...nada,
        salud: 35,
      },
      {
        id: "pachamanca",
        nombre: "Pachamanca",
        desc: "Carnes, papas y habas cocidas bajo tierra con piedras calientes.",
        precio: 28,
        max: 2,
        ...nada,
        salud: 40,
      },
      {
        id: "locro",
        nombre: "Locro",
        desc: "Guiso espeso de zapallo y papa, calientito y abundante.",
        precio: 16,
        max: 2,
        ...nada,
        salud: 25,
      },
      {
        id: "cecina",
        nombre: "Cecina con yuca",
        desc: "Carne seca y ahumada, con yuca sancochada y cebolla criolla.",
        precio: 22,
        max: 2,
        ...nada,
        salud: 30,
      },
      {
        id: "chicharron",
        nombre: "Chicharrón con camote",
        desc: "Trozos de cerdo bien doraditos con camote frito y salsa criolla.",
        precio: 20,
        max: 2,
        ...nada,
        salud: 28,
      },
      {
        id: "chicha",
        tipo: "bebida",
        nombre: "Chicha morada",
        desc: "Bebida fría de maíz morado con piña y canela.",
        precio: 5,
        max: 2,
        ...nada,
        salud: 8,
      },
      {
        id: "agua",
        tipo: "bebida",
        nombre: "Agua de mesa",
        desc: "Botellita de agua fresca, para hidratarte en el camino.",
        precio: 3,
        max: 2,
        ...nada,
        salud: 5,
      },
      {
        id: "emoliente",
        tipo: "bebida",
        nombre: "Emoliente caliente",
        desc: "Cebada, linaza y limón, calentito. Muy peruano.",
        precio: 4,
        max: 2,
        ...nada,
        salud: 10,
      },
      {
        id: "maracuya",
        tipo: "bebida",
        nombre: "Jugo de maracuyá",
        desc: "Jugo natural bien frío, con su toque ácido.",
        precio: 7,
        max: 2,
        ...nada,
        salud: 12,
      },
      {
        id: "gaseosa",
        tipo: "bebida",
        nombre: "Gaseosa helada",
        desc: "Botella personal bien fría.",
        precio: 6,
        max: 2,
        ...nada,
        salud: 6,
      },
    ],
    saberId: "boleta",
    saberTitulo: "¿Qué es una boleta de venta?",
    saberBono: 8,
    saber: [
      "La boleta de venta es un comprobante de pago que te entrega quien te vende, normalmente cuando compras como consumidor final.",
      "Es la prueba de que pagaste y sirve de sustento de tu compra. Si no te la dan, tienes derecho a pedirla.",
      "Información de ejemplo. Revisa las reglas vigentes en sunat.gob.pe.",
    ],
  },
  {
    titulo: "ENTREGA 2",
    nombre: "BAZAR EL PROGRESO",
    letrero: ["BAZAR EL PROGRESO", "ÚTILES · REGALOS · RUC"],
    parqueo: [{ tipo: 2, z: -24 }],
    puerta: "Llamar al encargado",
    lugar: "el Bazar El Progreso",
    distancia: 540,
    variante: "entrega",
    frase: "",
    carta: "",
    platos: [],
    saberId: "",
    saberTitulo: "",
    saberBono: 0,
    saber: [],
    entrega: {
      cliente: "Don Aníbal",
      trato: "el encargado del bazar",
      pedido: "10 cuadernos, 5 cajas de lapiceros y 2 mochilas",
      monto: 140,
      quiere: "factura",
      ruc: "20123456789",
      frase: "¡Joven, a tiempo! Soy una empresa con RUC y necesito la factura para mi contabilidad.",
      extra: 0,
      color: "#93c5fd",
      piel: 3,
    },
  },
  {
    titulo: "PARADA 2",
    nombre: "TALLER Y BOTICA RUTA SEGURA",
    letrero: ["RUTA SEGURA", "TALLER · BOTICA"],
    parqueo: [
      { tipo: 5, z: -19 },
      { tipo: 2, z: -28 },
    ],
    puerta: "Entrar al taller y botica",
    lugar: "el taller y la botica",
    distancia: 640,
    variante: "taller",
    frase: "Aquí reparan mototaxis y venden curaciones. Gasta bien tu dinero.",
    carta: "Servicios y productos",
    platos: [
      {
        id: "reparacion",
        nombre: "Reparación general",
        desc: "Frenos, aceite y ajuste de la carrocería. Tu mototaxi queda como nuevo.",
        precio: 35,
        max: 1,
        ...nada,
        integridad: 35,
      },
      {
        id: "llanta",
        nombre: "Llanta nueva",
        desc: "Cambio de una llanta desgastada.",
        precio: 20,
        max: 2,
        ...nada,
        integridad: 15,
      },
      {
        id: "curaciones",
        nombre: "Curaciones y vendas",
        desc: "Gasas, alcohol y vendas para curarte los golpes.",
        precio: 18,
        max: 2,
        ...nada,
        salud: 25,
      },
      {
        id: "kit",
        nombre: "Kit de reparación (para llevar)",
        desc: "Herramientas para arreglar el mototaxi en plena ruta con R.",
        precio: 25,
        max: 2,
        ...nada,
        kits: 1,
      },
      {
        id: "botiquin",
        nombre: "Botiquín (para llevar)",
        desc: "Primeros auxilios para usar en plena ruta con R.",
        precio: 25,
        max: 2,
        ...nada,
        botiquines: 1,
      },
    ],
    saberId: "gasto",
    saberTitulo: "¿Para qué guardar la factura del taller?",
    saberBono: 8,
    saber: [
      "Los comprobantes de lo que gastas en tu negocio ayudan a sustentar esos gastos. Por eso conviene pedirlos y guardarlos.",
      "La factura es el comprobante que se pide cuando necesitas sustentar compras de tu actividad.",
      "Información de ejemplo. Revisa las reglas vigentes en sunat.gob.pe.",
    ],
  },
];
