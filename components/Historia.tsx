"use client";

import { useCallback, useEffect, useState } from "react";

const JET = "var(--font-jetbrains)";
const BRIC = "var(--font-bricolage)";

export type EscenaTexto = { lugar: string; texto: string };

export default function Historia({
  escenas,
  alTerminar,
  alSaltar,
  etiquetaFinal = "empezar ruta",
}: {
  escenas: EscenaTexto[];
  alTerminar: () => void;
  alSaltar?: () => void;
  etiquetaFinal?: string;
}) {
  const [n, setN] = useState(0);
  const [vistas, setVistas] = useState(0);

  const escena = escenas[n];
  const palabras = escena.texto.split(" ");
  const largo = palabras.length;
  const completo = vistas >= largo;
  const ultima = n === escenas.length - 1;
  const saltar = alSaltar ?? alTerminar;

  useEffect(() => {
    if (completo) return;
    const id = setTimeout(() => setVistas((v) => v + 1), 85);
    return () => clearTimeout(id);
  }, [vistas, completo]);

  const avanzar = useCallback(() => {
    if (!completo) {
      setVistas(largo);
      return;
    }
    if (ultima) {
      alTerminar();
      return;
    }
    setN((v) => v + 1);
    setVistas(0);
  }, [completo, largo, ultima, alTerminar]);

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if (e.code === "Escape") {
        saltar();
        return;
      }
      if (e.code === "Space" || e.code === "Enter" || e.code === "ArrowRight") {
        e.preventDefault();
        avanzar();
      }
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [avanzar, saltar]);

  return (
    <div
      className="absolute inset-0 z-20 flex cursor-pointer select-none flex-col justify-end"
      onClick={avanzar}
      style={{
        background:
          "linear-gradient(to top, rgba(5,6,12,0.92) 0%, rgba(5,6,12,0.55) 38%, rgba(5,6,12,0.1) 70%, rgba(5,6,12,0.35) 100%)",
      }}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          saltar();
        }}
        className="absolute right-5 top-5 rounded-full border border-white/15 bg-black/40 px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-white/80 backdrop-blur hover:text-white"
        style={{ fontFamily: JET }}
      >
        Saltar
      </button>

      <div className="absolute inset-x-0 bottom-0 h-[3px] bg-white/10">
        <div
          className="h-full"
          style={{
            width: ((n + Math.min(1, vistas / largo)) / escenas.length) * 100 + "%",
            background: "linear-gradient(90deg, #ff7a3d, #ffb27a)",
            boxShadow: "0 0 12px rgba(255,122,61,0.7)",
            transition: "width 400ms ease",
          }}
        />
      </div>

      <div className="mx-auto w-full max-w-3xl px-6 pb-10 sm:pb-14">
        <p
          className="mb-3 text-[11px] uppercase tracking-[0.3em]"
          style={{ color: "#5eead4", fontFamily: JET }}
        >
          {escena.lugar}
        </p>
        <p
          className="min-h-[7.5rem] text-xl leading-relaxed text-white sm:text-2xl"
          style={{ fontFamily: BRIC }}
        >
          {palabras.map((w, i) => (
            <span
              key={n + "-" + i}
              style={{
                display: "inline-block",
                marginRight: "0.28em",
                opacity: i < vistas ? 1 : 0,
                filter: i < vistas ? "blur(0px)" : "blur(8px)",
                transform: i < vistas ? "translateY(0)" : "translateY(8px)",
                transition: "opacity 450ms ease, filter 450ms ease, transform 450ms ease",
              }}
            >
              {w}
            </span>
          ))}
        </p>

        <div className="mt-7 flex items-center justify-end">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              avanzar();
            }}
            className="group flex items-center gap-3 rounded-full border border-white/15 bg-white/5 py-2 pl-5 pr-2 text-white backdrop-blur transition hover:border-[#ff7a3d] hover:bg-white/10"
            style={{ fontFamily: JET }}
          >
            <span className="text-[11px] uppercase tracking-[0.22em]">
              {completo ? (ultima ? etiquetaFinal : "Continuar") : "Mostrar todo"}
            </span>
            <span
              className="rounded-full px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em]"
              style={{
                background: completo ? "#ff7a3d" : "rgba(255,255,255,0.14)",
                color: completo ? "#1a0d05" : "rgba(255,255,255,0.8)",
                transition: "background 300ms ease, color 300ms ease",
              }}
            >
              Espacio
            </span>
          </button>
        </div>

        <p className="mt-4 text-[11px] text-white/40" style={{ fontFamily: BRIC }}>
          Historia ficticia con fines educativos.
        </p>
      </div>
    </div>
  );
}
