"use client";

import { useCallback, useEffect, useState } from "react";
import Historia from "@/components/Historia";
import { NOTA_REGLAMENTO, REGLAS } from "@/lib/reglamento";
import { estado, type Genero } from "@/lib/estado";

const JET = "var(--font-jetbrains)";
const BRIC = "var(--font-bricolage)";

export default function Briefing({
  nombre,
  genero,
  alElegir,
  alTerminar,
}: {
  nombre: string;
  genero: Genero | null;
  alElegir: (g: Genero) => void;
  alTerminar: () => void;
}) {
  const quien = nombre.trim() || "piloto";
  const [reglamento, setReglamento] = useState(false);

  const elegir = useCallback(
    (g: Genero) => {
      estado.genero = g;
      alElegir(g);
    },
    [alElegir],
  );

  useEffect(() => {
    if (genero) estado.genero = genero;
  }, [genero]);

  useEffect(() => {
    if (genero !== null) return;
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "1") elegir("el");
      if (e.key === "2") elegir("ella");
      if (e.code === "Escape") alTerminar();
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [genero, elegir, alTerminar]);

  useEffect(() => {
    if (!reglamento) return;
    const tecla = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        alTerminar();
      }
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [reglamento, alTerminar]);

  if (genero === null) {
    return (
      <div
        className="absolute inset-0 z-20 flex flex-col justify-end"
        style={{
          background:
            "linear-gradient(to top, rgba(5,6,12,0.92) 0%, rgba(5,6,12,0.55) 38%, rgba(5,6,12,0.1) 70%, rgba(5,6,12,0.35) 100%)",
        }}
      >
        <div className="mx-auto w-full max-w-3xl px-6 pb-10 sm:pb-14">
          <p
            className="mb-3 text-[11px] uppercase tracking-[0.3em]"
            style={{ color: "#5eead4", fontFamily: JET }}
          >
            Antes de empezar
          </p>
          <p className="text-xl leading-relaxed text-white sm:text-2xl" style={{ fontFamily: BRIC }}>
            ¿Cómo te presentamos en la historia, {quien}?
          </p>
          <div className="mt-6 flex gap-3">
            {(["el", "ella"] as Genero[]).map((g, i) => (
              <button
                key={g}
                type="button"
                onClick={() => elegir(g)}
                className="rounded-full border border-white/20 bg-black/40 px-8 py-3 text-sm uppercase tracking-[0.25em] text-white backdrop-blur transition hover:border-[#ff7a3d] hover:text-[#ff7a3d]"
                style={{ fontFamily: JET }}
              >
                {g === "el" ? "Él" : "Ella"}
                <span className="ml-3 text-white/40">{i + 1}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const escenas = [
    {
      lugar: "MISIÓN 1 · RUTA A LA FERIA",
      texto: `${quien}, hoy debutas en el reparto de la familia. Tu tía te presta su mototaxi de carga: viejo, pero fiel. Atrás van las cajas con el pedido importado.`,
    },
    {
      lugar: "EN LA CARRETERA",
      texto:
        "Esquiva buses, combis y autos y junta monedas. Entrega pedidos a los negocios de la ruta y dale a cada cliente su comprobante. Respeta el límite de velocidad: hay radares. Cada choque te cuesta dinero.",
    },
    {
      lugar: "LOS PUENTES",
      texto:
        "En cada puente de control te detendrán. Tendrás que hablar con el oficial y responder bien: comprobantes, aduana y un operativo conjunto con la Fiscalía.",
    },
    {
      lugar: "CONTROLES",
      texto:
        "A / D: cambiar de carril. E: hablar con el oficial. Habrá respuestas fáciles y respuestas correctas: cada decisión sube o baja tu riesgo fiscal. Llega con tu mercadería a salvo.",
    },
  ];

  if (reglamento) {
    return (
      <div className="absolute inset-0 z-20 flex items-center justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm">
        <div
          className="my-auto w-full max-w-2xl rounded-2xl border border-white/10 p-6"
          style={{ background: "rgba(6,10,20,0.95)" }}
        >
          <p className="text-[10px] uppercase tracking-[0.3em]" style={{ color: "#5eead4", fontFamily: JET }}>
            Antes de salir
          </p>
          <h2 className="mt-1 text-3xl font-semibold text-white" style={{ fontFamily: BRIC }}>
            Reglamento del conductor de vehículo menor
          </h2>
          <ol className="mt-4 flex flex-col gap-3">
            {REGLAS.map((r, i) => (
              <li key={i} className="flex gap-3 text-base leading-snug text-white/90" style={{ fontFamily: BRIC }}>
                <span
                  className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold"
                  style={{ background: "#ff7a3d", color: "#1a0d05", fontFamily: JET }}
                >
                  {i + 1}
                </span>
                <span>
                  <b>{r.titulo}</b> {r.texto}
                </span>
              </li>
            ))}
          </ol>
          <p className="mt-4 text-[11px] text-white/40" style={{ fontFamily: BRIC }}>
            {NOTA_REGLAMENTO} En la bodega lo tienes de nuevo, y al leerlo ganas un bono.
          </p>
          <button
            type="button"
            onClick={alTerminar}
            className="mt-4 rounded-full px-6 py-3 text-[11px] uppercase tracking-[0.25em] transition hover:brightness-110"
            style={{ background: "#ff7a3d", color: "#1a0d05", fontFamily: JET }}
          >
            Entendido · Espacio
          </button>
        </div>
      </div>
    );
  }

  return <Historia escenas={escenas} alTerminar={() => setReglamento(true)} />;
}
