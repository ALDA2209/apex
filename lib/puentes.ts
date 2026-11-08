export type Opcion = {
  texto: string;
  correcta: boolean;
  riesgo: number;
  soles: number;
  oficial: string;
  leccion: string;
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
  /** Nivel 3: la pregunta depende de lo que hiciste antes (el fiscal "recuerda"). */
  resolver?: (ctx: { sinComprobante: number }) => Pick<Puente, "pregunta" | "opciones">;
};

export const PUENTES_N1: Puente[] = [
  {
    titulo: "PUENTE 1",
    subtitulo: "CONTROL DE COMPROBANTES",
    distancia: 150,
    oficial: "Oficial Ramos",
    insignia: "OF",
    uniforme: "#1f3a5f",
    banda: "#d9ff3f",
    pregunta: (trato) =>
      `Buenos días, ${trato}. Control de comprobantes. Veo mercadería importada en su mototaxi. ¿Me muestra el comprobante de pago de lo que lleva?`,
    opciones: [
      {
        texto: "Sí, oficial. Aquí tengo la factura de la compra y la guía de remisión del traslado.",
        correcta: true,
        riesgo: -10,
        soles: 50,
        oficial: "Todo en regla. Gracias por colaborar. Puede continuar.",
        leccion:
          "Quien entrega bienes debe emitir un comprobante de pago, y para trasladar mercadería se usa la guía de remisión. Llevar ambos a la mano evita problemas en el camino.",
      },
      {
        texto: "Es mercadería de mi familia, no necesito comprobantes.",
        correcta: false,
        riesgo: 20,
        soles: -50,
        oficial:
          "Sin sustento no puedo dejarle pasar así nomás. Esta vez queda como infracción, pero debe regularizar sus documentos.",
        leccion:
          "Aunque la mercadería sea de la familia, la entrega o el traslado de bienes necesita sustento: comprobante de pago y guía de remisión. No tenerlos puede traer sanciones según el Código Tributario.",
      },
      {
        texto: "Oficial, ¿cuánto cuesta olvidarnos de esto? Le doy algo y seguimos.",
        correcta: false,
        riesgo: 40,
        soles: -100,
        oficial: "Ofrecer dinero a un funcionario para evitar un control es un delito. Esto queda registrado.",
        leccion:
          "Ofrecer dinero a un funcionario para evitar un control es un delito (cohecho). La salida correcta siempre es presentar tus documentos en regla.",
      },
    ],
  },
  {
    titulo: "PUENTE 2",
    subtitulo: "ADUANA",
    distancia: 440,
    oficial: "Agente Mendoza",
    insignia: "AD",
    uniforme: "#14532d",
    banda: "#d9ff3f",
    pregunta: (trato) =>
      `Control aduanero, ${trato}. Veo mercadería que parece importada. ¿Tiene la declaración aduanera de esos productos?`,
    opciones: [
      {
        texto: "Sí, agente. Aquí está la declaración aduanera y la factura del proveedor.",
        correcta: true,
        riesgo: -10,
        soles: 60,
        oficial: "Todo coincide con lo declarado. Puede continuar.",
        leccion:
          "La mercadería que entra al país se declara ante la aduana y se pagan los tributos que correspondan. La declaración aduanera es lo que respalda que ingresó legalmente.",
      },
      {
        texto: "La compré a un vendedor en la frontera y no me dio ningún papel.",
        correcta: false,
        riesgo: 30,
        soles: -80,
        oficial:
          "Sin documentos no puedo acreditar que ingresó legalmente. La mercadería queda retenida mientras se verifica.",
        leccion:
          "Comprar mercadería sin documentos que acrediten su ingreso legal puede terminar en retención o incautación. Pide siempre la documentación cuando compres.",
      },
      {
        texto: "Son pocas cosas. ¿No podemos pasar sin declarar?",
        correcta: false,
        riesgo: 25,
        soles: -60,
        oficial: "Lo que corresponde declarar se declara. Debo dejar constancia de esto.",
        leccion:
          "No declarar lo que corresponde declarar puede traer sanciones. Ante la duda, consulta a la aduana antes de pasar, no después.",
      },
    ],
  },
  {
    titulo: "PUENTE 3",
    subtitulo: "OPERATIVO CON FISCALÍA",
    distancia: 750,
    oficial: "Fiscal Paredes",
    insignia: "FI",
    uniforme: "#2b2540",
    banda: "#ffffff",
    pregunta: (trato) =>
      `Operativo conjunto de Fiscalía y SUNAT, ${trato}. Estamos verificando comprobantes de pago. ¿Me muestra el comprobante de su última venta?`,
    opciones: [
      {
        texto: "Aquí está, fiscal. Es un comprobante electrónico y se puede consultar su validez en SUNAT.",
        correcta: true,
        riesgo: -15,
        soles: 80,
        oficial: "Verificado. Gracias por colaborar con el operativo. Puede continuar.",
        leccion:
          "Los comprobantes electrónicos se pueden verificar en el portal de SUNAT. Un comprobante auténtico te protege a ti y a tu cliente.",
      },
      {
        texto: "Uso comprobantes que me pasó un conocido. No sé si son reales.",
        correcta: false,
        riesgo: 35,
        soles: -120,
        oficial:
          "Usar comprobantes que no corresponden a su operación es grave. Debo dejar constancia y comunicarlo a SUNAT.",
        leccion:
          "Usar o emitir comprobantes falsos, o que no corresponden a una operación real, puede tener consecuencias legales graves. Emite siempre el comprobante de tus propias ventas.",
      },
      {
        texto: "No emití comprobante: el cliente pagó en efectivo y no lo pidió.",
        correcta: false,
        riesgo: 25,
        soles: -90,
        oficial: "Quien vende debe entregar comprobante aunque el cliente no lo pida. Queda registrado.",
        leccion:
          "Quien vende debe entregar comprobante de pago aunque el cliente no lo pida. Que el pago sea en efectivo o por celular no cambia esa obligación.",
      },
    ],
  },
];

/* Lista de trabajo: se llena con el nivel elegido (ver niveles.ts). */
export const PUENTES: Puente[] = [...PUENTES_N1];
