"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import {
  actualizarSonido,
  ajustes,
  callar,
  cargarAjustes,
  iniciarAudio,
  ponerAjuste,
  suscribirAudio,
  versionAudio,
  type Ajustes,
} from "@/lib/audio";

const JET = "var(--font-jetbrains)";

/* Arranca el sonido con el primer toque/tecla (los navegadores lo exigen) y mueve el motor cada cuadro. */
export function Sonido() {
  useEffect(() => {
    cargarAjustes();
    const iniciar = () => iniciarAudio();
    window.addEventListener("pointerdown", iniciar);
    window.addEventListener("keydown", iniciar);
    let raf = 0;
    const paso = () => {
      actualizarSonido();
      raf = requestAnimationFrame(paso);
    };
    raf = requestAnimationFrame(paso);
    return () => {
      window.removeEventListener("pointerdown", iniciar);
      window.removeEventListener("keydown", iniciar);
      cancelAnimationFrame(raf);
      callar();
    };
  }, []);
  return null;
}

function Barra({ k, etiqueta }: { k: Exclude<keyof Ajustes, "leer">; etiqueta: string }) {
  useSyncExternalStore(suscribirAudio, versionAudio, () => 0);
  const v = ajustes[k];
  return (
    <label className="flex items-center gap-3" style={{ fontFamily: JET }}>
      <span className="w-24 shrink-0 text-[10px] uppercase tracking-[0.2em] text-white/70">{etiqueta}</span>
      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={v}
        onChange={(e) => ponerAjuste(k, Number(e.target.value))}
        className="h-2 flex-1 cursor-pointer accent-[#ff7a3d]"
        aria-label={etiqueta}
      />
      <span className="w-9 text-right text-[11px] text-white/80">{Math.round(v * 100)}</span>
    </label>
  );
}

/* Botón de engranaje + panel de ajustes de sonido. */
export default function Ajustes({ derecha = "right-5" }: { derecha?: string }) {
  const [abierto, setAbierto] = useState(false);
  useSyncExternalStore(suscribirAudio, versionAudio, () => 0);

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto((a) => !a)}
        aria-label="Ajustes de sonido"
        className={`fixed top-5 z-40 [@media(max-width:640px)_and_(orientation:portrait)]:top-2 [@media(max-width:640px)_and_(orientation:portrait)]:h-7 [@media(max-width:640px)_and_(orientation:portrait)]:w-7 [@media(max-height:480px)]:top-2 [@media(max-height:480px)]:h-7 [@media(max-height:480px)]:w-7 flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/50 text-base text-white/90 backdrop-blur hover:text-white ${derecha}`}
      >
        ⚙
      </button>
      {abierto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onPointerDown={(e) => {
            if (e.target === e.currentTarget) setAbierto(false);
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-white/10 p-5"
            style={{ background: "rgba(6,10,20,0.96)" }}
          >
            <p className="text-[10px] uppercase tracking-[0.3em]" style={{ color: "#5eead4", fontFamily: JET }}>
              Ajustes
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-white" style={{ fontFamily: "var(--font-bricolage)" }}>
              Sonido
            </h2>
            <div className="mt-4 flex flex-col gap-3">
              <Barra k="general" etiqueta="General" />
              <Barra k="musica" etiqueta="Música" />
              <Barra k="motor" etiqueta="Motor" />
              <Barra k="ambiente" etiqueta="Ambiente" />
              <Barra k="efectos" etiqueta="Bocinas" />
              <Barra k="voces" etiqueta="Voces" />
              <label
                className="mt-1 flex cursor-pointer items-center gap-3 text-sm text-white/90"
                style={{ fontFamily: "var(--font-bricolage)" }}
              >
                <input
                  type="checkbox"
                  checked={ajustes.leer}
                  onChange={(e) => ponerAjuste("leer", e.target.checked)}
                  className="h-4 w-4 accent-[#ff7a3d]"
                />
                Leer los diálogos en voz alta
              </label>
            </div>
            <button
              type="button"
              onClick={() => setAbierto(false)}
              className="mt-5 rounded-full px-6 py-3 text-[11px] uppercase tracking-[0.25em] hover:brightness-110"
              style={{ background: "#ff7a3d", color: "#1a0d05", fontFamily: JET }}
            >
              Listo
            </button>
          </div>
        </div>
      )}
    </>
  );
}
