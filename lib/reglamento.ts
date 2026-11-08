/* Reglamento del conductor de vehículo menor: se muestra al empezar y también en la bodega. */
export const REGLAS: { titulo: string; texto: string }[] = [
  {
    titulo: "Respeta los límites de velocidad.",
    texto:
      "En esta ruta: 50 km/h en avenidas y 30 km/h en zonas comerciales y escolares. Los radares te miden al pasar: si te pasas, recibes una fotopapeleta.",
  },
  {
    titulo: "Usa casco",
    texto: "y lleva siempre tu licencia de conducir vigente y los documentos de tu vehículo.",
  },
  {
    titulo: "No excedas la carga.",
    texto: "Un mototaxi de carga tiene un límite de peso: pasarte lo hace inestable y peligroso.",
  },
  {
    titulo: "Respeta las señales",
    texto: "y cede el paso. En los puentes de control detente cuando te lo indiquen.",
  },
  {
    titulo: "Si estás cansado, descansa.",
    texto: "La fatiga causa accidentes: come algo y recupérate en las paradas.",
  },
  {
    titulo: "Lleva tus comprobantes.",
    texto: "Si transportas mercadería, lleva el comprobante de pago y la guía de remisión. Al vender, entrega boleta o factura.",
  },
];

export const NOTA_REGLAMENTO =
  "Información de ejemplo. Los límites de velocidad urbanos del MTC son 30 km/h en calles y zonas comerciales o escolares, y 50 km/h en avenidas; pueden variar según la municipalidad. Las multas del juego son valores de juego, no las reales. Revisa las normas vigentes del MTC y de tu municipalidad.";
