"use client";

import { useEffect, useRef, useState } from "react";
import { estado, useChoques, useSoles, useVentas } from "@/lib/estado";

export default function Marcador() {
  const soles = useSoles();
  const ventas = useVentas();
  const choques = useChoques();
  const [aviso, setAviso] = useState(false);
  const previo = useRef(choques);

  useEffect(() => {
    if (choques === previo.current) return;
    previo.current = choques;
    if (choques === 0) {
      setAviso(false);
      return;
    }
    setAviso(true);
    const id = setTimeout(() => setAviso(false), 900);
    return () => clearTimeout(id);
  }, [choques]);

  return (
    <>
      <div
        className="absolute left-1/2 top-5 z-10 flex -translate-x-1/2 items-center gap-3 rounded-full border border-white/10 bg-black/40 px-5 py-2 backdrop-blur"
        style={{ fontFamily: "var(--font-jetbrains)" }}
      >
        <span className="text-[10px] uppercase tracking-[0.3em] text-white/60">Caja</span>
        <span className="text-sm font-semibold tracking-widest" style={{ color: "#ffc94a" }}>
          S/ {soles}
        </span>
        {ventas > 0 && (
          <>
            <span className="h-3 w-px bg-white/20" />
            <span className="text-[10px] uppercase tracking-[0.3em] text-white/60">Ventas</span>
            <span className="text-sm font-semibold tracking-widest" style={{ color: "#5eead4" }}>
              S/ {ventas}
            </span>
          </>
        )}
      </div>

      {aviso && (
        <>
          <div className="pointer-events-none absolute inset-0 z-10 shadow-[inset_0_0_180px_rgba(244,63,94,0.6)]" />
          <div
            className="pointer-events-none absolute left-1/2 top-20 z-10 -translate-x-1/2 text-center"
            style={{ fontFamily: "var(--font-jetbrains)" }}
          >
            <p className="text-sm uppercase tracking-[0.35em]" style={{ color: "#f43f5e" }}>
              ¡Choque!
            </p>
            {estado.perdido > 0 && (
              <p className="mt-1 text-xs tracking-widest text-white/80">− S/ {estado.perdido}</p>
            )}
          </div>
        </>
      )}
    </>
  );
}
