"use client";

import { useEffect, useState } from "react";
import { estado, useApie, useFase, useKmh, usePapeleta } from "@/lib/estado";
import { TOLERANCIA, tramoEn } from "@/lib/transito";

const JET = "var(--font-jetbrains)";
const BRIC = "var(--font-bricolage)";

/* Velocímetro en km/h, el límite del tramo y la papeleta cuando un radar te mide de más. */
export default function Velocimetro() {
  const kmh = useKmh();
  const apie = useApie();
  const fase = useFase();
  const papeleta = usePapeleta();
  const [d, setD] = useState(0);
  const [ver, setVer] = useState(false);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setD(Math.max(0, -estado.z)), 200);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!papeleta) return;
    setVer(true);
    setFlash(true);
    const a = setTimeout(() => setFlash(false), 140);
    const b = setTimeout(() => setVer(false), 6000);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
    };
  }, [papeleta]);

  const tramo = tramoEn(d);
  const pasado = kmh > tramo.limite + TOLERANCIA;
  const color = pasado ? "#f43f5e" : "#5eead4";
  const oculto = apie || fase === "meta" || fase === "servicio" || fase === "arrestado";

  return (
    <>
      {flash && <div className="pointer-events-none absolute inset-0 z-[40] bg-white/80" />}

      {!oculto && (
        <div
          className="absolute left-1/2 top-[4.3rem] z-10 flex -translate-x-1/2 [@media(max-width:640px)_and_(orientation:portrait)]:top-auto [@media(max-width:640px)_and_(orientation:portrait)]:bottom-[9.5rem] [@media(max-width:640px)_and_(orientation:portrait)]:gap-3 [@media(max-width:640px)_and_(orientation:portrait)]:px-4 [@media(max-width:640px)_and_(orientation:portrait)]:py-1 items-center gap-4 rounded-2xl border bg-black/55 px-5 py-2 backdrop-blur [@media(max-height:480px)]:top-auto [@media(max-height:480px)]:bottom-2 [@media(max-height:480px)]:gap-3 [@media(max-height:480px)]:px-3 [@media(max-height:480px)]:py-1"
          style={{ fontFamily: JET, borderColor: pasado ? "rgba(244,63,94,0.8)" : "rgba(255,255,255,0.15)" }}
        >
          <div className="flex items-baseline gap-2">
            <span className={`text-4xl font-semibold leading-none [@media(max-height:480px)]:text-2xl ${pasado ? "animate-pulse" : ""}`} style={{ color }}>
              {kmh}
            </span>
            <span className="text-[10px] uppercase tracking-[0.3em] text-white/70">km/h</span>
          </div>
          <span className="h-8 w-px bg-white/20" />
          <div className="flex items-center gap-2">
            <span
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-base [@media(max-height:480px)]:h-8 [@media(max-height:480px)]:w-8 [@media(max-height:480px)]:text-xs font-extrabold text-black"
              style={{ boxShadow: "inset 0 0 0 5px #dc2626" }}
              aria-label={`Límite ${tramo.limite} kilómetros por hora`}
            >
              {tramo.limite}
            </span>
            <span className="text-[9px] uppercase leading-tight tracking-[0.2em] text-white/70">
              Límite
              <br />
              {tramo.nombre}
            </span>
          </div>
        </div>
      )}

      {ver && papeleta && !oculto && (
        <div className="pointer-events-none absolute inset-x-0 top-[8.4rem] z-20 flex justify-center px-4 [@media(max-width:640px)_and_(orientation:portrait)]:top-[15rem] [@media(max-height:480px)]:top-[4.4rem]">
          <div
            className="max-w-md rounded-2xl border px-5 py-3 backdrop-blur [@media(max-height:480px)]:px-3 [@media(max-height:480px)]:py-1.5 [@media(max-height:480px)]:text-xs"
            style={{ borderColor: "rgba(244,63,94,0.7)", background: "rgba(40,6,16,0.82)" }}
          >
            <p className="text-[10px] uppercase tracking-[0.3em]" style={{ color: "#f43f5e", fontFamily: JET }}>
              Fotopapeleta · Radar
            </p>
            <p className="mt-1 text-base text-white" style={{ fontFamily: BRIC }}>
              Te midieron <b>{papeleta.kmh} km/h</b> donde el límite es <b>{papeleta.limite} km/h</b>.
            </p>
            <p className="text-sm text-white/80" style={{ fontFamily: BRIC }}>
              Multa: S/ {papeleta.multa} (valor de juego). Suelta la W para bajar a la velocidad permitida.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
