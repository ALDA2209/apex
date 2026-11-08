import type { Opcion, Pregunta } from "@/lib/puentes";

/* Banco de respaldo: preguntas extra para cuando la IA no responde.
   Con las que ya existen en cada nivel, hay 5 por puente, y en cada partida se sortean 2. */
const NOTA = " Información de ejemplo. Revisa las reglas vigentes en sunat.gob.pe.";
const op = (texto: string, correcta: boolean, riesgo: number, soles: number, oficial: string, leccion: string): Opcion => ({
  texto,
  correcta,
  riesgo,
  soles,
  oficial,
  leccion,
});

/** dif = dificultad aproximada (1 fácil, 2 media) para elegir según el nivel. */
export const BANCO_EXTRA: (Pregunta & { dif: 1 | 2 })[][] = [
  [
    {
      dif: 1,
      pregunta: (t) =>
        `Buenos días, ${t}. Veo que transporta mercadería para su negocio. ¿Qué lleva consigo para sustentar la compra y el traslado?`,
      opciones: [
        op("El comprobante de pago de cada compra y la guía de remisión, a la mano.", true, -10, 60,
          "Todo en orden. Gracias por tenerlo a la mano. Puede continuar.",
          "Para transportar mercadería se llevan, a la mano, el comprobante de la compra y la guía de remisión del traslado." + NOTA),
        op("Los tengo guardados en mi casa; si quiere, mañana se los muestro.", false, 20, -60,
          "Los documentos se muestran en el momento del control, no después.",
          "Los documentos deben acompañar a la mercadería durante el traslado. Prometer mostrarlos después no sustenta lo que llevas."),
        op("Le muestro un mensaje del proveedor que dice que ya le pagué.", false, 15, -50,
          "Un mensaje no es un comprobante de pago.",
          "Un mensaje de chat no reemplaza el comprobante de pago. Pide siempre tu comprobante al comprar."),
        op("Son compras pequeñas, no hace falta llevar nada.", false, 20, -60,
          "Aunque sea poco, necesita sustento.",
          "El tamaño de la compra no elimina la necesidad de sustentar lo que transportas."),
      ],
    },
    {
      dif: 2,
      pregunta: (t) =>
        `Control de comprobantes, ${t}. Un cliente me comenta que usted le vendió ayer sin darle comprobante. ¿Qué responde?`,
      opciones: [
        op("Tiene razón, debí entregarlo. Desde ahora emito comprobante en cada venta, aunque no lo pidan.", true, -10, 60,
          "Reconocer el error y corregirlo es lo correcto. Puede continuar.",
          "Quien vende debe entregar comprobante de pago aunque el cliente no lo pida. Si se omitió, se reconoce y se regulariza." + NOTA),
        op("Como no lo pidió, no era necesario.", false, 20, -70,
          "No depende de que lo pidan.",
          "La obligación de entregar comprobante no depende de que el cliente lo pida."),
        op("Era una venta chica; esas no cuentan.", false, 20, -70,
          "Toda venta cuenta.",
          "El tamaño de la venta no cambia la obligación, salvo lo que establezca la norma vigente: revisa sunat.gob.pe."),
        op("Ese cliente miente; yo no vendí nada.", false, 25, -90,
          "Negarlo no ayuda. Queda constancia.",
          "Llevar un registro de tus ventas te permite explicar cada operación en lugar de negarla."),
      ],
    },
  ],
  [
    {
      dif: 1,
      pregunta: (t) =>
        `Control aduanero, ${t}. Veo productos que parecen importados. ¿Tiene algún documento que demuestre su ingreso legal al país?`,
      opciones: [
        op("Sí, aquí está la declaración aduanera de la mercadería.", true, -10, 60,
          "Documento en regla. Puede continuar.",
          "La declaración aduanera respalda que la mercadería ingresó legalmente al país." + NOTA),
        op("Se la compré a alguien en la feria; él me dijo que todo estaba en regla.", false, 25, -80,
          "La palabra de un vendedor no es un documento.",
          "Comprar mercadería sin documentos que acrediten su ingreso legal puede terminar en retención. Pide siempre la documentación."),
        op("No tengo papeles, pero son productos muy conocidos.", false, 25, -80,
          "Que sean conocidos no prueba su ingreso legal.",
          "El ingreso legal se prueba con documentos, no con la fama del producto."),
        op("Los trajo un familiar y él los declarará después.", false, 25, -80,
          "La declaración va antes, no después.",
          "Lo que corresponde declarar se declara al ingresar, no después de transportarlo."),
      ],
    },
    {
      dif: 2,
      pregunta: (t) =>
        `Control aduanero, ${t}. Usted planea traer más mercadería el próximo mes y no sabe qué debe declarar. ¿Qué hace?`,
      opciones: [
        op("Consulto a la aduana antes de traerla y declaro lo que corresponda.", true, -10, 70,
          "Preguntar antes es lo más inteligente. Puede continuar.",
          "Ante la duda, se consulta a la aduana antes de pasar, no después." + NOTA),
        op("Traigo poquito cada vez para que no se note.", false, 30, -100,
          "Fraccionar para evitar la declaración es una mala práctica. Queda constancia.",
          "Dividir la mercadería para evitar declarar lo que corresponde puede traer sanciones. Lo correcto es declarar."),
        op("Hago lo mismo que otros comerciantes del mercado.", false, 15, -50,
          "Lo que hacen otros no es una norma.",
          "Imitar a otros no te protege: cada operación debe cumplir lo que corresponde."),
        op("No declaro nada; si me paran, pago una multa y listo.", false, 25, -90,
          "Eso no es un plan; es un riesgo.",
          "Asumir una sanción como 'costo del negocio' es un error: pierdes mercadería y dinero."),
      ],
    },
  ],
  [
    {
      dif: 1,
      pregunta: (t) =>
        `Operativo conjunto de Fiscalía y SUNAT, ${t}. Un cliente le pagó por Yape y no pidió comprobante. ¿Qué hace usted?`,
      opciones: [
        op("Emito el comprobante igual: pagar por celular no cambia la obligación.", true, -15, 80,
          "Correcto. Verificado. Puede continuar.",
          "Quien vende debe entregar comprobante aunque el pago sea en efectivo o por celular." + NOTA),
        op("Como no fue en efectivo, no hace falta.", false, 20, -80,
          "La forma de pago no cambia la obligación.",
          "Que el pago sea por celular no elimina la obligación de entregar comprobante."),
        op("Se lo envío solo si me lo pide después.", false, 20, -80,
          "El comprobante se entrega al vender.",
          "El comprobante se emite al momento de la venta, no cuando el cliente se acuerde."),
        op("Lo anoto en mi cuaderno y listo.", false, 20, -80,
          "Un cuaderno no reemplaza el comprobante.",
          "Tus apuntes ayudan a ordenarte, pero no reemplazan los comprobantes de pago."),
      ],
    },
    {
      dif: 2,
      pregunta: (t) =>
        `Operativo conjunto de Fiscalía y SUNAT, ${t}. Un proveedor le ofreció comprobantes “baratos” que no corresponden a sus compras, para que pague menos tributos. ¿Qué responde?`,
      opciones: [
        op("No. Usar comprobantes que no corresponden a mis operaciones es grave. Solo uso los míos.", true, -15, 80,
          "Buena decisión. Puede continuar.",
          "Usar comprobantes que no corresponden a una operación real puede tener consecuencias legales graves. Usa solo los de tus propias operaciones." + NOTA),
        op("Acepto solo uno, para probar.", false, 35, -120,
          "Usar uno solo ya es grave. Debo dejar constancia.",
          "Un solo comprobante falso o ajeno ya es un problema serio. No existe 'probar'."),
        op("Se los compro si el precio es bueno.", false, 35, -120,
          "Comprar comprobantes es un delito. Esto queda registrado.",
          "Comprar o usar comprobantes que no corresponden a tus operaciones tiene consecuencias legales graves."),
        op("Le pregunto si son de verdad y, si dice que sí, los uso.", false, 30, -100,
          "Su palabra no basta. Usted es responsable de lo que usa.",
          "Eres responsable de los comprobantes que usas: verifícalos en el portal de SUNAT y emite los tuyos."),
      ],
    },
  ],
];
