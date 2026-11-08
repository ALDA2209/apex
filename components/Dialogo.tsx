"use client";

import { callar, hablar } from "@/lib/audio";
import { useCallback, useEffect, useState } from "react";
import { concluirPuente, decidir, estado, useFase, usePuente } from "@/lib/estado";
import { PUENTES, type Puente as DatosPuente } from "@/lib/puentes";
import { TIEMPO_POR_NIVEL } from "@/lib/niveles";

const JET = "var(--font-jetbrains)";
const BRIC = "var(--font-bricolage)";

function Cambio({ etiqueta, valor, bueno }: { etiqueta: string; valor: string; bueno: boolean }) {
  return (
    <span
      className="rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.2em]"
      style={{
        fontFamily: JET,
        color: bueno ? "#5eead4" : "#f43f5e",
        borderColor: bueno ? "rgba(94,234,212,0.4)" : "rgba(244,63,94,0.4)",
      }}
    >
      {etiqueta} {valor}
    </span>
  );
}

function Conversacion({ p, indice }: { p: DatosPuente; indice: number }) {
  const trato = "joven";
  const [sel, setSel] = useState<number | null>(null);
  const op = sel === null ? null : p.opciones[sel];

  const elegir = useCallback(
    (i: number) => {
      if (sel !== null) return;
      const o = p.opciones[i];
      setSel(i);
      decidir(indice, i, o.correcta, o.riesgo, o.soles);
    },
    [sel, p, indice],
  );

  const limite = TIEMPO_POR_NIVEL[estado.nivel];
  const [resta, setResta] = useState(limite);

  useEffect(() => {
    if (!limite || sel !== null) return;
    const t0 = performance.now();
    const id = setInterval(() => {
      const r = Math.max(0, limite - (performance.now() - t0) / 1000);
      setResta(r);
      if (r <= 0) {
        clearInterval(id);
        // se acabó el tiempo: titubeaste, y eso se nota (la respuesta incorrecta menos grave)
        let k = 0;
        let menor = Infinity;
        p.opciones.forEach((o, i) => {
          if (!o.correcta && o.riesgo < menor) {
            menor = o.riesgo;
            k = i;
          }
        });
        elegir(k);
      }
    }, 100);
    return () => clearInterval(id);
  }, [limite, sel, p, elegir]);

  const textoVoz = op ? op.oficial : p.pregunta(trato);
  useEffect(() => {
    hablar(textoVoz, "oficial");
    return () => callar();
  }, [textoVoz]);

  const seguir = useCallback(() => {
    if (sel !== null) concluirPuente();
  }, [sel]);

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if (sel === null) {
        const i = Number(e.key) - 1;
        if (i >= 0 && i < p.opciones.length) elegir(i);
      } else if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        seguir();
      }
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [sel, p, elegir, seguir]);

  return (
    <div className="absolute inset-x-0 bottom-0 z-20 flex justify-center px-4 pb-6">
      <div
        className="w-full max-w-3xl rounded-2xl border border-white/10 p-5 backdrop-blur-md sm:p-6"
        style={{ background: "rgba(6,10,20,0.86)" }}
      >
        <div className="mb-4 flex items-center gap-3">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold"
            style={{ background: p.uniforme, color: p.banda, fontFamily: JET }}
          >
            {p.insignia}
          </span>
          <div style={{ fontFamily: JET }}>
            <p className="text-[11px] uppercase tracking-[0.25em] text-white">{p.oficial}</p>
            <p className="text-[10px] uppercase tracking-[0.25em]" style={{ color: "#5eead4" }}>
              {p.titulo} · {p.subtitulo}
            </p>
          </div>
        </div>

        {limite > 0 && op === null && (
          <div className="mb-3 flex items-center gap-3" style={{ fontFamily: JET }}>
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/15">
              <span
                className="block h-full rounded-full"
                style={{
                  width: `${(resta / limite) * 100}%`,
                  background: resta < 6 ? "#f43f5e" : "#fbbf24",
                  transition: "width 0.1s linear",
                }}
              />
            </span>
            <span className="w-10 text-right text-xs font-semibold" style={{ color: resta < 6 ? "#f43f5e" : "#fbbf24" }}>
              {Math.ceil(resta)} s
            </span>
          </div>
        )}
        <p className="text-lg leading-relaxed text-white sm:text-xl" style={{ fontFamily: BRIC }}>
          {op ? op.oficial : p.pregunta(trato)}
        </p>

        {op === null ? (
          <div className="mt-5 flex flex-col gap-2">
            {p.opciones.map((o, i) => (
              <button
                key={i}
                type="button"
                onClick={() => elegir(i)}
                className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-white transition hover:border-[#ff7a3d] hover:bg-white/10"
                style={{ fontFamily: BRIC }}
              >
                <span
                  className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold"
                  style={{ background: "#ff7a3d", color: "#1a0d05", fontFamily: JET }}
                >
                  {i + 1}
                </span>
                <span className="text-base leading-snug">{o.texto}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="mt-4">
            <div className="flex flex-wrap gap-2">
              <Cambio
                etiqueta="Riesgo fiscal"
                valor={`${op.riesgo > 0 ? "+" : ""}${op.riesgo}`}
                bueno={op.riesgo <= 0}
              />
              <Cambio
                etiqueta="Caja"
                valor={`${op.soles >= 0 ? "+" : "−"} S/ ${Math.abs(op.soles)}`}
                bueno={op.soles >= 0}
              />
            </div>
            <div
              className="mt-4 rounded-xl border px-4 py-3"
              style={{ borderColor: "rgba(94,234,212,0.3)", background: "rgba(94,234,212,0.06)" }}
            >
              <p className="text-[10px] uppercase tracking-[0.25em]" style={{ color: "#5eead4", fontFamily: JET }}>
                Lo que debes saber
              </p>
              <p className="mt-1 text-base leading-snug text-white/90" style={{ fontFamily: BRIC }}>
                {op.leccion}
              </p>
            </div>
            <p className="mt-3 text-[11px] text-white/40" style={{ fontFamily: BRIC }}>
              Los montos del juego son un ejemplo. Las sanciones reales las fija el Código Tributario.
            </p>
            <button
              type="button"
              onClick={seguir}
              className="mt-4 rounded-full px-6 py-3 text-[11px] uppercase tracking-[0.25em] transition hover:brightness-110"
              style={{ background: "#ff7a3d", color: "#1a0d05", fontFamily: JET }}
            >
              Volver al mototaxi · Espacio
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Dialogo() {
  const fase = useFase();
  const n = usePuente();
  const p = PUENTES[n];
  if (!p || fase !== "dialogo") return null;
  return <Conversacion key={n} p={p} indice={n} />;
}
