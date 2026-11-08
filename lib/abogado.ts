/* Consultas del Estudio Jurídico: cada una explica una regla y ayuda en un puente concreto. */
export type Consulta = {
  id: string;
  tema: string;
  puente: number; // índice del puente donde ayuda (0, 1, 2)
  puenteNombre: string;
  pregunta: string;
  respuesta: string[];
};

export const COSTO_CONSULTA = 25;
export const RIESGO_CONSULTA = -4;
export const ABOGADO = "Dr. Paredes";

export const CONSULTAS: Consulta[] = [
  {
    id: "comprobantes",
    tema: "Comprobantes y guía de remisión",
    puente: 0,
    puenteNombre: "Puente 1 · Control de comprobantes",
    pregunta: "¿Qué debo llevar en el mototaxi cuando transporto mercadería?",
    respuesta: [
      "Quien entrega bienes debe emitir un comprobante de pago: boleta o factura.",
      "Para trasladar mercadería se usa además la guía de remisión, que lista lo que llevas.",
      "Lleva ambos documentos a la mano. Sin sustento, la mercadería puede ser observada y puedes recibir una sanción.",
    ],
  },
  {
    id: "aduana",
    tema: "Aduanas y valor declarado",
    puente: 1,
    puenteNombre: "Puente 2 · Aduana",
    pregunta: "Si importo mercadería, ¿qué valor debo declarar?",
    respuesta: [
      "El valor declarado debe reflejar lo que realmente pagaste al proveedor.",
      "Debes poder demostrarlo con comprobantes de pago, por ejemplo transferencias o facturas.",
      "Tu ganancia es un tema distinto: no se mezcla con el valor de la mercadería. Declarar menos para pagar menos tributos es una infracción.",
    ],
  },
  {
    id: "fiscalizacion",
    tema: "Fiscalización: tus derechos y deberes",
    puente: 2,
    puenteNombre: "Puente 3 · Operativo con fiscalía",
    pregunta: "Si me fiscalizan, ¿qué puedo y qué debo hacer?",
    respuesta: [
      "El Código Tributario (artículo 92) te reconoce derechos como deudor tributario: contar con asesoramiento particular cuando te pidan comparecer, conocer en qué etapa está tu trámite y no volver a entregar documentos que ya presentaste y la administración conserva.",
      "Quien vende debe emitir y entregar comprobante en cada operación. No hacerlo es una infracción del artículo 174 del Código Tributario, y llevar tu registro de ventas te ayuda a demostrar lo que hiciste.",
      "Nunca ofrezcas dinero a un funcionario para evitar un control: es un delito y empeora tu situación.",
    ],
  },
];

export const NOTA_ABOGADO =
  "Información de ejemplo, no es asesoría legal real. Los derechos del deudor están en el artículo 92 del Código Tributario (mef.gob.pe). Las normas y sanciones reales están en sunat.gob.pe. Consulta siempre a un profesional.";
