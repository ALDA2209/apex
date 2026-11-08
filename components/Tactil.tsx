"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { estado, suscribir, useApie, useCerca, useDentro, useFase } from "@/lib/estado";

const JET = "var(--font-jetbrains)";

/* ¿Es un celular o tablet? (o se fuerza con ?tactil=1 para probar en la compu) */
export function useTactil() {
  const [t, setT] = useState(false);
  useEffect(() => {
    try {
      const forzado = new URLSearchParams(window.location.search).get("tactil") === "1";
      setT(forzado || window.matchMedia("(pointer: coarse)").matches);
    } catch {
      setT(false);
    }
  }, []);
  return t;
}

/* Los botones táctiles "aprietan" las mismas teclas que usa el juego en la compu. */
function tecla(code: string, abajo: boolean) {
  window.dispatchEvent(new KeyboardEvent(abajo ? "keydown" : "keyup", { code, bubbles: true }));
}

function Boton({
  code,
  children,
  grande = false,
  mantener = true,
  color = "rgba(255,255,255,0.14)",
  etiqueta,
}: {
  code: string;
  children: ReactNode;
  grande?: boolean;
  mantener?: boolean;
  color?: string;
  etiqueta: string;
}) {
  const [on, setOn] = useState(false);
  const activo = useRef(false);
  const soltar = () => {
    if (!activo.current) return;
    activo.current = false;
    setOn(false);
    if (mantener) tecla(code, false);
  };
  useEffect(() => () => soltar(), []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <button
      type="button"
      aria-label={etiqueta}
      onPointerDown={(e) => {
        e.preventDefault();
        (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
        activo.current = true;
        setOn(true);
        tecla(code, true);
        if (!mantener) {
          window.setTimeout(() => {
            tecla(code, false);
            activo.current = false;
            setOn(false);
          }, 90);
        }
      }}
      onPointerUp={soltar}
      onPointerCancel={soltar}
      onLostPointerCapture={soltar}
      onContextMenu={(e) => e.preventDefault()}
      className={`flex select-none items-center justify-center rounded-2xl border border-white/25 text-white backdrop-blur ${
        grande
          ? "h-20 min-w-20 px-4 text-lg [@media(max-height:480px)]:h-14 [@media(max-height:480px)]:min-w-14 [@media(max-height:480px)]:text-base"
          : "h-14 min-w-14 px-3 text-sm [@media(max-height:480px)]:h-10 [@media(max-height:480px)]:min-w-10 [@media(max-height:480px)]:text-xs"
      }`}
      style={{
        background: on ? "rgba(255,122,61,0.75)" : color,
        fontFamily: JET,
        touchAction: "none",
        WebkitUserSelect: "none",
        transform: on ? "scale(0.94)" : "none",
        transition: "transform 80ms, background 80ms",
      }}
    >
      {children}
    </button>
  );
}

/* Botón de pantalla completa (solo celular/tablet): da mucho más espacio al juego. */
export function PantallaCompleta({ derecha = "right-5" }: { derecha?: string }) {
  const tactil = useTactil();
  const [ok, setOk] = useState(false);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const f = () => setOn(!!document.fullscreenElement);
    setOk(!!document.fullscreenEnabled);
    document.addEventListener("fullscreenchange", f);
    return () => document.removeEventListener("fullscreenchange", f);
  }, []);
  if (!tactil || !ok) return null;
  const alternar = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
        try {
          await (screen.orientation as unknown as { lock?: (o: string) => Promise<void> }).lock?.("landscape");
        } catch {
          /* no todos los celulares dejan fijar la orientación */
        }
      }
    } catch {
      /* si el navegador no lo permite, no pasa nada */
    }
  };
  return (
    <button
      type="button"
      onClick={alternar}
      aria-label={on ? "Salir de pantalla completa" : "Pantalla completa"}
      className={`fixed top-5 z-40 flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/50 text-base text-white/90 backdrop-blur [@media(max-width:640px)_and_(orientation:portrait)]:top-2 [@media(max-width:640px)_and_(orientation:portrait)]:h-7 [@media(max-width:640px)_and_(orientation:portrait)]:w-7 [@media(max-height:480px)]:top-2 [@media(max-height:480px)]:h-7 [@media(max-height:480px)]:w-7 ${derecha}`}
    >
      {on ? "⤡" : "⛶"}
    </button>
  );
}

export default function Tactil() {
  const tactil = useTactil();
  const fase = useFase();
  const apie = useApie();
  const dentro = useDentro();
  const cerca = useCerca();
  const activo = useSyncExternalStore(suscribir, () => estado.activo, () => false);
  const [vertical, setVertical] = useState(false);

  useEffect(() => {
    const f = () => setVertical(window.innerHeight > window.innerWidth);
    f();
    window.addEventListener("resize", f);
    return () => window.removeEventListener("resize", f);
  }, []);

  if (!tactil) return null;
  if (fase === "dialogo" || fase === "parada" || fase === "meta" || dentro) return null;

  const conduciendo = activo && !apie && fase === "libre";
  const caminando = apie;
  if (!conduciendo && !caminando) return null;

  const accion =
    cerca === "bodega"
      ? estado.entregaActiva
        ? "Llamar"
        : "Entrar"
      : cerca === "oficial"
        ? "Hablar"
        : cerca === "moto"
          ? "Subir"
          : "";

  return (
    <>
      {vertical && (
        <div
          className="pointer-events-none absolute inset-x-0 bottom-44 z-20 flex justify-center px-4 [@media(max-width:640px)_and_(orientation:portrait)]:bottom-[15.5rem]"
          style={{ fontFamily: JET }}
        >
          <div className="rounded-full border border-white/20 bg-black/70 px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-white">
            Gira el celular para jugar mejor
          </div>
        </div>
      )}

      {conduciendo && (
        <div className="pointer-events-none absolute inset-x-0 bottom-4 z-20 flex items-end justify-between px-4 [@media(max-height:480px)]:bottom-2 [@media(max-height:480px)]:px-2">
          <div className="pointer-events-auto flex gap-3">
            <Boton code="KeyA" mantener={false} grande etiqueta="Carril izquierdo">
              ◀
            </Boton>
            <Boton code="KeyD" mantener={false} grande etiqueta="Carril derecho">
              ▶
            </Boton>
          </div>
          <div className="pointer-events-auto flex items-end gap-3">
            <div className="flex flex-col gap-2">
              <Boton code="KeyH" etiqueta="Bocina">
                Bocina
              </Boton>
              <Boton code="KeyR" mantener={false} etiqueta="Estacionar y reparar">
                Estac.
              </Boton>
            </div>
            <Boton code="KeyW" grande color="rgba(45,212,191,0.4)" etiqueta="Acelerar">
              Acelerar
            </Boton>
          </div>
        </div>
      )}

      {caminando && (
        <div className="pointer-events-none absolute inset-x-0 bottom-4 z-20 flex items-end justify-between px-4 [@media(max-height:480px)]:bottom-2 [@media(max-height:480px)]:px-2">
          <div className="pointer-events-auto grid grid-cols-3 grid-rows-2 gap-2">
            <div />
            <Boton code="KeyW" etiqueta="Adelante">
              ▲
            </Boton>
            <div />
            <Boton code="KeyA" etiqueta="Izquierda">
              ◀
            </Boton>
            <Boton code="KeyS" etiqueta="Atrás">
              ▼
            </Boton>
            <Boton code="KeyD" etiqueta="Derecha">
              ▶
            </Boton>
          </div>
          {accion && (
            <div className="pointer-events-auto">
              <Boton code="KeyE" mantener={false} grande color="rgba(255,122,61,0.65)" etiqueta={accion}>
                {accion}
              </Boton>
            </div>
          )}
        </div>
      )}
    </>
  );
}
