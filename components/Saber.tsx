"use client";

import { useEffect, useRef, useState } from "react";
import { callar, hablar } from "@/lib/audio";
import { aprender, estado } from "@/lib/estado";

const JET = "var(--font-jetbrains)";
const BRIC = "var(--font-bricolage)";

/* Tarjeta plegable "¿Por qué...?": al abrirla por primera vez regala una bonificación. */
export default function Saber({
  id,
  titulo,
  bono,
  children,
}: {
  id: string;
  titulo: string;
  bono: number;
  children: React.ReactNode;
}) {
  const [abierto, setAbierto] = useState(false);
  const [ganado, setGanado] = useState(estado.aprendidas.includes(id));

  const cuerpo = useRef<HTMLDivElement>(null);
  const [leyendo, setLeyendo] = useState(false);

  const leer = () => {
    const t = cuerpo.current?.innerText ?? "";
    if (!t) return;
    hablar(`${titulo}. ${t}`, "narrador", () => setLeyendo(false));
    setLeyendo(true);
  };
  const parar = () => {
    callar();
    setLeyendo(false);
  };

  const alternar = () => {
    if (!abierto && aprender(id, bono)) setGanado(true);
    if (abierto) parar();
    setAbierto(!abierto);
  };

  // al abrir la tarjeta, una voz masculina la lee sola (se puede detener)
  useEffect(() => {
    if (!abierto) return;
    const t = window.setTimeout(leer, 250);
    return () => {
      window.clearTimeout(t);
      callar();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto]);

  return (
    <div
      className="rounded-xl border"
      style={{ borderColor: "rgba(251,191,36,0.4)", background: "rgba(251,191,36,0.05)" }}
    >
      <button
        type="button"
        onClick={alternar}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
        style={{ fontFamily: BRIC }}
      >
        <span className="text-base font-semibold text-white">{titulo}</span>
        <span
          className="shrink-0 rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.2em]"
          style={{
            fontFamily: JET,
            background: ganado ? "rgba(94,234,212,0.15)" : "#fbbf24",
            color: ganado ? "#5eead4" : "#1a1205",
          }}
        >
          {ganado ? (abierto ? "Ocultar" : "Ver de nuevo") : `Abrir · +S/ ${bono}`}
        </span>
      </button>
      {abierto && (
        <div className="border-t px-4 pb-4 pt-3" style={{ borderColor: "rgba(251,191,36,0.25)" }}>
          {ganado && (
            <p className="mb-3 text-[11px] uppercase tracking-[0.2em]" style={{ color: "#fbbf24", fontFamily: JET }}>
              Bonificación por aprender: +S/ {bono}
            </p>
          )}
          <button
            type="button"
            onClick={leyendo ? parar : leer}
            className="mb-3 rounded-full border border-white/20 px-4 py-1.5 text-[11px] uppercase tracking-[0.2em] text-white/90 hover:border-white/50"
            style={{ fontFamily: JET }}
          >
            {leyendo ? "■ Detener voz" : "▶ Escuchar"}
          </button>
          <div
            ref={cuerpo}
            className="flex flex-col gap-3 text-base leading-snug text-white/90"
            style={{ fontFamily: BRIC }}
          >
            {children}
          </div>
        </div>
      )}
    </div>
  );
}
