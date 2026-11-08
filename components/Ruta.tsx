"use client";

import { useEffect, useState } from "react";
import { estado } from "@/lib/estado";
import { META, SERVICIOS } from "@/lib/ruta";
import { PUENTES } from "@/lib/puentes";

const JET = "var(--font-jetbrains)";
const VEL = 18; // metros por segundo a ritmo normal
const PAUSA = 9; // segundos estimados en cada parada o diálogo
const ALCANCE = 220; // metros que muestra el minimapa hacia adelante
const Y_JUGADOR = 80; // % desde arriba donde va el jugador

type Marca = { d: number; sigla: string; nombre: string; tipo: "puente" | "servicio" | "meta" };

const MARCAS: Marca[] = [
  ...PUENTES.map((p, i): Marca => ({ d: p.distancia, sigla: `P${i + 1}`, nombre: p.subtitulo, tipo: "puente" })),
  ...SERVICIOS.map((s): Marca => ({ d: s.distancia, sigla: s.variante === "restaurante" ? "R" : s.variante === "entrega" ? "E" : "T", nombre: s.nombre, tipo: "servicio" })),
  { d: META, sigla: "META", nombre: "META", tipo: "meta" as const },
].sort((a, b) => a.d - b.d);

const COLOR = { puente: "#ff7a3d", servicio: "#fbbf24", meta: "#d9ff3f" } as const;

function hecho(m: Marca, i: number) {
  if (m.tipo === "meta") return false;
  const n = MARCAS.filter((x, k) => k <= i && x.tipo === m.tipo).length;
  return n <= (m.tipo === "puente" ? estado.puente : estado.servicio);
}

export default function Ruta() {
  const [rec, setRec] = useState(0);
  const [, otro] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setRec(Math.max(0, -estado.z));
      otro((n) => n + 1);
    }, 120);
    return () => clearInterval(id);
  }, []);

  const pend = MARCAS.filter((m, i) => !hecho(m, i));
  const proximo = pend[0];
  const falta = Math.max(0, META - 6.8 - rec);
  const seg = Math.round(falta / VEL + Math.max(0, pend.length - 1) * PAUSA);
  const mm = Math.floor(seg / 60);
  const ss = String(seg % 60).padStart(2, "0");
  const pct = Math.min(100, (rec / (META - 6.8)) * 100);
  const aProximo = proximo ? Math.max(0, Math.round(proximo.d - 6.8 - rec)) : 0;

  return (
    <div
      className="absolute right-5 top-[4.3rem] z-10 w-[11rem] rounded-2xl border border-white/10 bg-black/45 p-2.5 backdrop-blur"
      style={{ fontFamily: JET }}
    >
      <div className="mb-2 flex items-center justify-between text-[9px] uppercase tracking-[0.22em]">
        <span className="text-white/60">Mapa</span>
        <span style={{ color: "#5eead4" }}>
          Llegas ~{mm}:{ss}
        </span>
      </div>

      <div
        className="relative h-44 overflow-hidden rounded-xl border border-white/10"
        style={{
          background:
            "radial-gradient(120% 90% at 50% 100%, rgba(45,212,191,0.16), rgba(6,10,20,0.95) 70%), repeating-linear-gradient(0deg, rgba(255,255,255,0.04) 0 1px, transparent 1px 22px)",
        }}
      >
        {/* carretera */}
        <span className="absolute inset-y-0 left-1/2 w-9 -translate-x-1/2 bg-white/[0.07]" />
        <span className="absolute inset-y-0 left-[calc(50%-18px)] w-px bg-white/25" />
        <span className="absolute inset-y-0 left-[calc(50%+18px)] w-px bg-white/25" />
        <span
          className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2"
          style={{ background: "repeating-linear-gradient(180deg, rgba(255,255,255,0.35) 0 6px, transparent 6px 14px)" }}
        />

        {/* hitos */}
        {MARCAS.map((m, i) => {
          const ok = hecho(m, i);
          const adelante = m.d - 6.8 - rec;
          if (ok && adelante < -40) return null;
          const lejos = adelante > ALCANCE;
          const y = lejos ? 9 : Y_JUGADOR - (Math.max(adelante, -40) / ALCANCE) * (Y_JUGADOR - 9);
          const esSig = proximo === m;
          if (lejos && !esSig) return null;
          return (
            <span
              key={i}
              className="absolute left-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 transition-[top] duration-150"
              style={{ top: `${y}%`, opacity: ok ? 0.35 : lejos ? 0.75 : 1 }}
            >
              <span
                className="h-3.5 w-3.5 rotate-45 rounded-[3px] border-2"
                style={{
                  borderColor: COLOR[m.tipo],
                  background: ok ? COLOR[m.tipo] : "#06121f",
                  boxShadow: ok ? "none" : `0 0 8px ${COLOR[m.tipo]}`,
                }}
              />
              <span
                className="absolute left-5 whitespace-nowrap text-[9px] font-semibold tracking-[0.1em]"
                style={{ color: COLOR[m.tipo] }}
              >
                {m.sigla}
                {esSig && !ok ? ` ${aProximo}m` : ""}
              </span>
            </span>
          );
        })}

        {/* jugador */}
        <span
          className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{ top: `${Y_JUGADOR}%` }}
        >
          <svg width="16" height="18" viewBox="0 0 16 18" aria-hidden>
            <path d="M8 1 L14.5 16 L8 12.5 L1.5 16 Z" fill="#2dd4bf" stroke="#ffffff" strokeWidth="1.4" strokeLinejoin="round" />
          </svg>
        </span>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <span className="h-1 flex-1 overflow-hidden rounded-full bg-white/15">
          <span
            className="block h-full rounded-full"
            style={{ width: `${pct}%`, background: "#ff7a3d", boxShadow: "0 0 8px #ff7a3d" }}
          />
        </span>
        <span className="text-[9px] text-white/60">{Math.round(pct)}%</span>
      </div>
      {proximo && (
        <p className="mt-1.5 truncate text-[9px] uppercase tracking-[0.18em] text-white/60">
          Próximo · <span style={{ color: COLOR[proximo.tipo] }}>{proximo.nombre}</span>
        </p>
      )}
    </div>
  );
}
