import { PUENTES, PUENTES_N1, type Opcion, type Pregunta, type Puente } from "@/lib/puentes";
import { BANCO_EXTRA } from "@/lib/banco";
import { hayIA, pedirPreguntas, type PreguntaIA } from "@/lib/ia";
import { estado } from "@/lib/estado";

export type Nivel = 1 | 2 | 3;

export const NIVELES: { n: Nivel; nombre: string; detalle: string }[] = [
  { n: 1, nombre: "Nivel 1 · Aprendiz", detalle: "3 opciones, preguntas directas" },
  { n: 2, nombre: "Nivel 2 · Repartidor", detalle: "4 opciones, casos con detalles, más tráfico" },
  { n: 3, nombre: "Nivel 3 · Experto", detalle: "4 opciones parecidas, 20 s para decidir, el fiscal recuerda tus ventas" },
];

/** Segundos para decidir en cada puente (0 = sin límite). */
export const TIEMPO_POR_NIVEL: Record<Nivel, number> = { 1: 0, 2: 0, 3: 20 };
/** Qué tan rápido baja la salud al manejar. */
export const CANSANCIO_POR_NIVEL: Record<Nivel, number> = { 1: 1, 2: 1.3, 3: 1.6 };
/** Vehículos extra en la pista. */
export const TRAFICO_EXTRA: Record<Nivel, number> = { 1: 0, 2: 2, 3: 3 };

const op = (
  texto: string,
  correcta: boolean,
  riesgo: number,
  soles: number,
  oficial: string,
  leccion: string,
): Opcion => ({ texto, correcta, riesgo, soles, oficial, leccion });

const NOTA = " Información de ejemplo. Revisa las reglas vigentes en sunat.gob.pe.";

/* ---------------- NIVEL 2 ---------------- */
const N2: Pick<Puente, "pregunta" | "opciones">[] = [
  {
    pregunta: (t) =>
      `Control de comprobantes, ${t}. Veo cajas de dos proveedores distintos. ¿Qué documentos me muestra para sustentar lo que transporta?`,
    opciones: [
      op(
        "Las facturas de cada proveedor y la guía de remisión del traslado.",
        true, -10, 60,
        "Cada compra tiene su sustento y el traslado su guía. Puede continuar.",
        "Cada compra se sustenta con su comprobante de pago y el traslado de mercadería con su guía de remisión. Si compras a varios proveedores, llevas los comprobantes de todos." + NOTA,
      ),
      op(
        "Solo la factura del proveedor más grande; la otra la tengo en casa.",
        false, 20, -60,
        "La mercadería de la otra compra no tiene sustento aquí. Queda observada.",
        "Toda la mercadería que transportas debe poder sustentarse en el momento. Llevar solo parte de los comprobantes deja el resto sin respaldo.",
      ),
      op(
        "Solo la guía de remisión, que dice todo lo que llevo.",
        false, 15, -40,
        "La guía indica el traslado, pero no reemplaza el comprobante de la compra.",
        "La guía de remisión sustenta el traslado, no la compra. Se necesitan ambos documentos.",
      ),
      op(
        "Un cuaderno donde anoto todo lo que compro y vendo.",
        false, 25, -70,
        "Un cuaderno no es un comprobante de pago.",
        "Tus apuntes ayudan a ordenarte, pero no reemplazan los comprobantes que respaldan tus operaciones.",
      ),
    ],
  },
  {
    pregunta: (t) =>
      `Control aduanero, ${t}. Su declaración aduanera indica 20 cajas, pero en su mototaxi cuento 25. ¿Qué me explica?`,
    opciones: [
      op(
        "Que llevo 5 cajas más de las declaradas y debo regularizar la diferencia.",
        true, -10, 70,
        "Gracias por decirlo de frente. Regularizamos la diferencia y continúa.",
        "Si hay diferencia entre lo declarado y lo que transportas, lo correcto es reconocerla y regularizarla. Ocultarla suele ser peor." + NOTA,
      ),
      op(
        "Que quien contó las cajas se equivocó.",
        false, 25, -80,
        "Contamos dos veces. Las cajas no coinciden y queda constancia.",
        "Declarar cantidades distintas a las reales puede traer sanciones. Verifica tu mercadería antes de declararla.",
      ),
      op(
        "Que esas 5 cajas son de otra persona y no sé qué llevan.",
        false, 30, -90,
        "No puede transportar mercadería sin saber de quién ni qué es. Quedan retenidas.",
        "Eres responsable de lo que transportas. Si no sabes qué es ni de quién, no deberías llevarlo.",
      ),
      op(
        "Que son muestras sin valor y no necesitan declararse.",
        false, 25, -80,
        "Las muestras también se verifican. Hay que declarar lo que corresponda.",
        "Llamar 'muestra' a la mercadería no te exime de declarar lo que corresponde declarar. Ante la duda, pregunta a la aduana.",
      ),
    ],
  },
  {
    pregunta: (t) =>
      `Operativo conjunto de Fiscalía y SUNAT, ${t}. Quiero confirmar que su comprobante electrónico es auténtico. ¿Cómo se puede verificar?`,
    opciones: [
      op(
        "Se consulta su validez en el portal de SUNAT con los datos del comprobante.",
        true, -15, 80,
        "Consultado y válido. Puede continuar.",
        "Los comprobantes electrónicos se pueden consultar en el portal de SUNAT con los datos del comprobante. Verificar te protege a ti y a tu cliente." + NOTA,
      ),
      op(
        "Basta con que tenga logo y sello; así se ve oficial.",
        false, 20, -80,
        "El aspecto no prueba nada. Un comprobante se valida en los sistemas.",
        "Un logo o un sello no demuestran que un comprobante sea auténtico.",
      ),
      op(
        "Se confía en quien lo emitió; nunca se verifica.",
        false, 25, -90,
        "Verificar es parte del control.",
        "Verificar un comprobante es sencillo y te protege: no basta con confiar.",
      ),
      op(
        "Se compara con otro comprobante parecido de otro cliente.",
        false, 20, -60,
        "Comparar con otro no demuestra nada.",
        "La validez no se comprueba comparando con otros comprobantes: se consulta en el sistema de SUNAT.",
      ),
    ],
  },
];

/* ---------------- NIVEL 3 ---------------- */
const N3: (Pick<Puente, "pregunta" | "opciones"> & { resolver?: Puente["resolver"] })[] = [
  {
    pregunta: (t) =>
      `Control de comprobantes, ${t}. Veo cajas de su proveedor y otras sin marca. Quiero el comprobante de compra y la guía de remisión de TODO lo que lleva.`,
    opciones: [
      op(
        "Aquí están las facturas de ambas compras y la guía que lista también las cajas sin marca.",
        true, -10, 70,
        "Todo sustentado y listado. Puede continuar.",
        "Todo lo que transportas debe estar sustentado con comprobantes y listado en la guía de remisión, incluso lo que no tiene marca." + NOTA,
      ),
      op(
        "Aquí está la factura del proveedor y la guía. Las cajas sin marca son de un amigo; las regularizo después.",
        false, 12, -40,
        "La mercadería sin sustento queda observada. Debe regularizar.",
        "Casi: llevabas parte de los documentos, pero lo que transportas sin sustento sigue siendo un problema. Regularizar 'después' no sirve en el control.",
      ),
      op(
        "La guía lo cubre todo; la factura de esas cajas me la envían al celular mañana.",
        false, 18, -50,
        "Sin el comprobante en mano, no puedo darlas por sustentadas.",
        "La guía sustenta el traslado, pero cada compra necesita su comprobante en el momento del control.",
      ),
      op(
        "Esas cajas las compré en efectivo y no pedí nada.",
        false, 25, -90,
        "Sin comprobante de compra no hay sustento. Queda constancia.",
        "Al comprar, pide siempre tu comprobante: sin él no puedes sustentar lo que transportas.",
      ),
    ],
  },
  {
    pregunta: (t) =>
      `Control aduanero, ${t}. El valor declarado de su mercadería es la mitad del precio al que usted la vende en la feria. ¿Cómo lo explica?`,
    opciones: [
      op(
        "El valor declarado es lo que pagué al proveedor; mi precio de venta incluye costos y ganancia. Aquí está el comprobante de pago.",
        true, -10, 80,
        "Coherente y con sustento. Puede continuar.",
        "El valor declarado debe reflejar lo realmente pagado, y lo puedes demostrar con comprobantes de pago. Tu ganancia es un tema distinto." + NOTA,
      ),
      op(
        "Le pedí al proveedor que pusiera un valor menor para pagar menos.",
        false, 35, -120,
        "Declarar un valor menor al real es una infracción grave. Queda constancia.",
        "Declarar un valor menor al realmente pagado para pagar menos tributos puede traer sanciones graves.",
      ),
      op(
        "No lo sé: la factura la hizo el proveedor y yo no la revisé.",
        false, 18, -60,
        "Debe revisar lo que declara. Queda observado.",
        "Eres responsable de lo que declaras: revisa siempre tus documentos antes de presentarlos.",
      ),
      op(
        "Son valores referenciales, no hay que declararlos con exactitud.",
        false, 25, -90,
        "La declaración debe ser exacta.",
        "Los datos de una declaración aduanera deben corresponder a la operación real.",
      ),
    ],
  },
  {
    pregunta: (t) =>
      `Operativo conjunto de Fiscalía y SUNAT, ${t}. Estamos verificando sus comprobantes de hoy. ¿Cómo se asegura de emitir comprobante en cada venta?`,
    opciones: [
      op(
        "Emito comprobante en cada venta, aunque el cliente no lo pida, y llevo mi registro.",
        true, -15, 90,
        "Muy bien. Verificado. Puede continuar.",
        "Quien vende debe entregar comprobante aunque el cliente no lo pida. Llevar tu registro te ayuda a demostrarlo." + NOTA,
      ),
      op(
        "Solo cuando el cliente lo pide.",
        false, 20, -90,
        "La obligación no depende de que el cliente lo pida.",
        "Quien vende debe entregar comprobante de pago aunque el cliente no lo pida.",
      ),
      op(
        "Solo en las ventas grandes.",
        false, 20, -80,
        "No se elige a cuáles ventas se emite comprobante.",
        "El tamaño de la venta no cambia la obligación de emitir comprobante, salvo lo que la norma vigente establezca: revisa sunat.gob.pe.",
      ),
      op(
        "Los comprobantes los emito a fin de mes, todos juntos.",
        false, 25, -100,
        "El comprobante se entrega al momento de la venta.",
        "El comprobante se emite cuando haces la venta, no cuando te acuerdas.",
      ),
    ],
    resolver: ({ sinComprobante }) =>
      sinComprobante > 0
        ? {
            pregunta: (t: string) =>
              `Operativo conjunto de Fiscalía y SUNAT, ${t}. Veo en el sistema que una de sus ventas de hoy no tiene comprobante. ¿Qué me dice?`,
            opciones: [
              op(
                "Fue un error mío. La regularizo y desde ahora emito comprobante en cada venta.",
                true, -5, 40,
                "Reconocer el error ayuda. Regularice y continúe.",
                "Si omitiste un comprobante, lo mejor es reconocerlo y regularizarlo. Ocultarlo empeora la situación." + NOTA,
              ),
              op(
                "Fue una venta chica, no importa.",
                false, 25, -100,
                "Importa. Queda constancia.",
                "El monto de la venta no elimina la obligación de entregar comprobante.",
              ),
              op(
                "El cliente no lo pidió, así que no me correspondía.",
                false, 20, -90,
                "Quien vende debe emitirlo aunque no se lo pidan.",
                "Quien vende debe entregar comprobante de pago aunque el cliente no lo pida.",
              ),
              op(
                "No recuerdo esa venta.",
                false, 30, -110,
                "Eso no ayuda. Queda constancia.",
                "Llevar un registro de tus ventas te permite explicar cada operación cuando te lo piden.",
              ),
            ],
          }
        : {
            pregunta: (t: string) =>
              `Operativo conjunto de Fiscalía y SUNAT, ${t}. Veo sus ventas de hoy con comprobante. Confírmeme: ¿lo hace siempre así?`,
            opciones: [
              op(
                "Emito comprobante en cada venta, aunque el cliente no lo pida, y llevo mi registro.",
                true, -15, 90,
                "Muy bien. Verificado. Puede continuar.",
                "Quien vende debe entregar comprobante aunque el cliente no lo pida. Llevar tu registro te ayuda a demostrarlo." + NOTA,
              ),
              op("Solo cuando el cliente lo pide.", false, 20, -90, "La obligación no depende de eso.", "Quien vende debe entregar comprobante aunque el cliente no lo pida."),
              op("Solo en las ventas grandes.", false, 20, -80, "No se elige a cuáles ventas se emite.", "El tamaño de la venta no cambia la obligación, salvo lo que la norma vigente establezca: revisa sunat.gob.pe."),
              op("Los emito a fin de mes, todos juntos.", false, 25, -100, "Se entrega al momento de la venta.", "El comprobante se emite cuando haces la venta."),
            ],
          },
  },
];

function mezclar<T>(a: T[]): T[] {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

/* Menos opciones en el nivel 1: quita errores al azar, pero deja siempre la correcta. */
function ajustarOpciones(ops: Opcion[], cuantas: number): Opcion[] {
  if (ops.length <= cuantas) return ops;
  const mal = mezclar(ops.filter((o) => !o.correcta)).slice(0, cuantas - 1);
  return [ops.find((o) => o.correcta)!, ...mal];
}

/* Todas las preguntas de respaldo de un puente, con su dificultad. */
function bancoDe(i: number): (Pregunta & { dif: 1 | 2 | 3 })[] {
  const base = PUENTES_N1[i];
  const n3 = N3[i];
  const n3q: Pregunta = n3.resolver
    ? n3.resolver({ sinComprobante: 0 })
    : { pregunta: n3.pregunta, opciones: n3.opciones };
  return [
    { dif: 1, pregunta: base.pregunta, opciones: base.opciones },
    { dif: 2, pregunta: N2[i].pregunta, opciones: N2[i].opciones },
    { dif: 3, ...n3q },
    ...BANCO_EXTRA[i],
  ];
}

let generacion = 0;

/* Arma los 3 puentes del nivel con 2 preguntas cada uno, sorteadas del banco de respaldo
   (la correcta ya no siempre es la 1). Enseguida se piden a la IA unas nuevas. */
export function prepararNivel(n: Nivel) {
  generacion += 1;
  const nOp = n === 1 ? 3 : 4;
  const nuevos: Puente[] = PUENTES_N1.map((base, i) => {
    const cerca = bancoDe(i).filter((q) => Math.abs(q.dif - n) <= 1);
    const elegidas = mezclar(cerca.length >= 2 ? cerca : bancoDe(i));
    let q1: Pregunta = elegidas[0];
    const q2: Pregunta = elegidas[1];
    let resolver: Puente["resolver"];
    if (n === 3 && i === 2) {
      // el fiscal "recuerda" tus ventas: la primera pregunta depende de lo que hiciste
      q1 = { pregunta: N3[i].pregunta, opciones: N3[i].opciones };
      resolver = N3[i].resolver;
    }
    return {
      ...base,
      pregunta: q1.pregunta,
      opciones: mezclar(ajustarOpciones(q1.opciones, nOp)),
      origen: "respaldo",
      resolver,
      extra: {
        pregunta: q2.pregunta,
        opciones: mezclar(ajustarOpciones(q2.opciones, nOp)),
        origen: "respaldo",
      },
    };
  });
  PUENTES.splice(0, PUENTES.length, ...nuevos);
  void cargarPreguntasIA(n, generacion);
}

const CLAVE_VISTAS = "apex-preguntas-vistas";
const leerVistas = (): string[] => {
  try {
    const j = JSON.parse(localStorage.getItem(CLAVE_VISTAS) || "[]");
    return Array.isArray(j) ? j.filter((x) => typeof x === "string").slice(-12) : [];
  } catch {
    return [];
  }
};

/* Pide a Gemini las preguntas de esta partida. Si llegan a tiempo, reemplazan las de respaldo
   (solo en los puentes que todavía no has pasado). Si falla, el juego sigue con el banco. */
type Pedido = { n: Nivel; promesa: Promise<PreguntaIA[] | null> };
let pedido: Pedido | null = null;

/* Se piden desde el menú: así, cuando empiezas a jugar, las preguntas de la IA ya están listas. */
export function precargarIA(n: Nivel) {
  if (!hayIA()) return;
  if (pedido && pedido.n === n) return;
  const p: Pedido = { n, promesa: pedirPreguntas(n, leerVistas()) };
  p.promesa.then((l) => {
    if (!l && pedido === p) pedido = null; // falló: la próxima vez se vuelve a intentar
  });
  pedido = p;
}

async function cargarPreguntasIA(n: Nivel, gen: number) {
  if (!hayIA()) return;
  precargarIA(n);
  const usado = pedido;
  const lista = usado ? await usado.promesa : null;
  if (!lista || gen !== generacion) return;
  if (pedido === usado) pedido = null; // ya se usaron: la próxima partida pide otras nuevas
  const SOLES = [60, 70, 80];
  const RIESGO = [0, 15, 25, 40];
  const SANCION = [0, -50, -85, -120];
  const convertir = (q: PreguntaIA, i: number): Pregunta => ({
    origen: "ia",
    pregunta: () => q.pregunta,
    opciones: mezclar(
      q.opciones.map((o): Opcion => {
        const g = Math.max(0, Math.min(3, Math.round(o.gravedad)));
        return o.correcta
          ? { texto: o.texto, correcta: true, riesgo: -10, soles: SOLES[i] ?? 60, oficial: o.oficial, leccion: o.leccion + NOTA }
          : {
              texto: o.texto,
              correcta: false,
              riesgo: RIESGO[Math.max(1, g)],
              soles: SANCION[Math.max(1, g)],
              oficial: o.oficial,
              leccion: o.leccion,
              delito: g >= 3,
            };
      }),
    ),
  });
  for (const q of lista) {
    const p = PUENTES[q.puente];
    if (!p) continue;
    const yaEnCurso = estado.puente > q.puente || (estado.puente === q.puente && estado.fase !== "libre");
    if (yaEnCurso) continue;
    const c = convertir(q, q.puente);
    if (q.k === 0) {
      if (p.resolver) continue; // la pregunta que "recuerda" tus ventas se queda
      p.pregunta = c.pregunta;
      p.opciones = c.opciones;
      p.origen = "ia";
    } else {
      p.extra = c;
    }
  }
  try {
    const nuevas = lista.map((q) => q.pregunta.slice(0, 160));
    localStorage.setItem(CLAVE_VISTAS, JSON.stringify([...leerVistas(), ...nuevas].slice(-18)));
  } catch {}
}

/* Antes de llegar al puente: si la pregunta depende de lo que hiciste, se arma ahora. */
export function resolverPuente(i: number, ctx: { sinComprobante: number }) {
  const p = PUENTES[i];
  if (!p?.resolver) return;
  const r = p.resolver(ctx);
  PUENTES[i] = { ...p, ...r, opciones: mezclar(r.opciones), resolver: undefined };
}
