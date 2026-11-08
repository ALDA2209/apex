"use client";

import { callar, hablar } from "@/lib/audio";
import { CONSULTAS } from "@/lib/abogado";
import { useCallback, useEffect, useState } from "react";
import { concluirPuente, decidir, estado, evaluarArresto, limiteFaltas, puntosFaltas, useFase, usePuente } from "@/lib/estado";
import { PUENTES, puntosDe, type Pregunta as DatosPregunta, type Puente as DatosPuente } from "@/lib/puentes";
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

function Pregunta({
  p,
  q,
  indice,
  k,
  total,
  alSeguir,
}: {
  p: DatosPuente;
  q: DatosPregunta;
  indice: number;
  k: number;
  total: number;
  alSeguir: () => void;
}) {
  const trato = "joven";
  const [sel, setSel] = useState<number | null>(null);
  const op = sel === null ? null : q.opciones[sel];

  const elegir = useCallback(
    (i: number) => {
      if (sel !== null) return;
      const o = q.opciones[i];
      setSel(i);
      decidir(indice, i, o.correcta, o.riesgo, o.soles, k, puntosDe(o));
    },
    [sel, q, indice, k],
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
        q.opciones.forEach((o, i) => {
          if (!o.correcta && o.riesgo < menor) {
            menor = o.riesgo;
            k = i;
          }
        });
        elegir(k);
      }
    }, 100);
    return () => clearInterval(id);
  }, [limite, sel, q, elegir]);

  const puntos = puntosFaltas();
  const arrestado = op !== null && puntos >= limiteFaltas();
  const textoVoz = op ? op.oficial + (arrestado ? " Queda detenido." : "") : q.pregunta(trato);
  useEffect(() => {
    hablar(textoVoz, "oficial");
    return () => callar();
  }, [textoVoz]);

  const seguir = useCallback(() => {
    if (sel !== null) alSeguir();
  }, [sel, alSeguir]);

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if (sel === null) {
        const i = Number(e.key) - 1;
        if (i >= 0 && i < q.opciones.length) elegir(i);
      } else if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        seguir();
      }
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [sel, q, elegir, seguir]);

  return (
    <div className="absolute inset-x-0 bottom-0 z-20 flex justify-center px-4 pb-6 [@media(max-height:480px)]:px-2 [@media(max-height:480px)]:pb-1">
      <div
        className="w-full max-w-3xl overflow-y-auto rounded-2xl border border-white/10 p-5 backdrop-blur-md sm:p-6 max-h-[calc(var(--alto,100dvh)-1rem)] [@media(max-height:480px)]:p-3 [@media(max-height:480px)]:sm:p-3"
        style={{ background: "rgba(6,10,20,0.86)" }}
      >
        <div className="mb-4 flex items-center gap-3 [@media(max-height:480px)]:mb-1 [@media(max-height:480px)]:gap-2">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold [@media(max-height:480px)]:h-7 [@media(max-height:480px)]:w-7 [@media(max-height:480px)]:text-[10px]"
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
          <div className="ml-auto flex flex-wrap items-center justify-end gap-2 [@media(max-height:480px)]:mr-[4.5rem]" style={{ fontFamily: JET }}>
            {q.origen === "ia" && (
              <span
                className="rounded-full px-2.5 py-1 text-[9px] uppercase tracking-[0.18em]"
                style={{ background: "rgba(167,139,250,0.16)", color: "#c4b5fd" }}
                title="Pregunta creada por Gemini para esta partida"
              >
                ✦ Creada con IA
              </span>
            )}
            <span className="rounded-full border border-white/15 px-2.5 py-1 text-[9px] uppercase tracking-[0.18em] text-white/70">
              Pregunta {k + 1} de {total}
            </span>
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
        <p className="text-lg leading-relaxed text-white sm:text-xl [@media(max-height:480px)]:text-sm [@media(max-height:480px)]:leading-snug" style={{ fontFamily: BRIC }}>
          {op ? op.oficial : q.pregunta(trato)}
        </p>

        {op === null ? (
          <div className="mt-5 flex flex-col gap-2 [@media(max-height:480px)]:mt-2 [@media(max-height:480px)]:gap-1">
            {q.opciones.map((o, i) => (
              <button
                key={i}
                type="button"
                onClick={() => elegir(i)}
                className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 [@media(max-height:480px)]:px-3 [@media(max-height:480px)]:py-1.5 text-left text-white transition hover:border-[#ff7a3d] hover:bg-white/10"
                style={{ fontFamily: BRIC }}
              >
                <span
                  className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold"
                  style={{ background: "#ff7a3d", color: "#1a0d05", fontFamily: JET }}
                >
                  {i + 1}
                </span>
                <span className="text-base leading-snug [@media(max-height:480px)]:text-xs">{o.texto}</span>
                {o.correcta && estado.consultas.some((id) => CONSULTAS.find((c) => c.id === id)?.puente === indice) && (
                  <span
                    className="ml-auto shrink-0 self-center rounded-full px-2.5 py-1 text-[9px] uppercase tracking-[0.18em]"
                    style={{ background: "rgba(94,234,212,0.15)", color: "#5eead4", fontFamily: JET }}
                  >
                    ⚖ Lo explicó tu abogado
                  </span>
                )}
              </button>
            ))}
          </div>
        ) : (
          <div className="mt-4 [@media(max-height:480px)]:mt-2">
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
            {!op.correcta && (
              <div
                className="mt-3 rounded-xl border px-4 py-2.5 [@media(max-height:480px)]:mt-2 [@media(max-height:480px)]:py-1.5"
                style={{
                  borderColor: "rgba(244,63,94,0.6)",
                  background: arrestado ? "rgba(127,29,29,0.55)" : "rgba(244,63,94,0.1)",
                  fontFamily: JET,
                }}
              >
                <p className="text-[11px] uppercase tracking-[0.22em]" style={{ color: "#fb7185" }}>
                  {arrestado
                    ? "Quedas arrestado · pierdes el día"
                    : puntos === limiteFaltas() - 1
                      ? "¡Última advertencia! Una infracción más y te arrestan"
                      : "Infracción registrada"}{" "}
                  · {puntos}/{limiteFaltas()}
                </p>
                <p className="mt-1 text-xs text-white/75" style={{ fontFamily: BRIC }}>
                  {puntosDe(op) === 2
                    ? "Esto es un delito y cuenta doble."
                    : arrestado
                      ? "Sigues respondiendo mal ante la autoridad."
                      : "Si sigues respondiendo mal ante la autoridad, serás arrestado."}
                </p>
              </div>
            )}
            <div
              className="mt-4 rounded-xl border px-4 py-3 [@media(max-height:480px)]:mt-2 [@media(max-height:480px)]:px-3 [@media(max-height:480px)]:py-1.5"
              style={{ borderColor: "rgba(94,234,212,0.3)", background: "rgba(94,234,212,0.06)" }}
            >
              <p className="text-[10px] uppercase tracking-[0.25em]" style={{ color: "#5eead4", fontFamily: JET }}>
                Lo que debes saber
              </p>
              <p className="mt-1 text-base leading-snug text-white/90 [@media(max-height:480px)]:text-xs" style={{ fontFamily: BRIC }}>
                {op.leccion}
              </p>
            </div>
            <p className="mt-3 text-[11px] text-white/40" style={{ fontFamily: BRIC }}>
              Los montos del juego son un ejemplo. Las sanciones reales las fija el Código Tributario.
            </p>
            <button
              type="button"
              onClick={seguir}
              className="mt-4 rounded-full px-6 py-3 text-[11px] uppercase tracking-[0.25em] transition hover:brightness-110 [@media(max-height:480px)]:mt-2 [@media(max-height:480px)]:py-1.5"
              style={{ background: "#ff7a3d", color: "#1a0d05", fontFamily: JET }}
            >
              {arrestado ? "Ver lo que pasó · Espacio" : k + 1 < total ? "Siguiente pregunta · Espacio" : "Volver al mototaxi · Espacio"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Conversacion({ p, indice }: { p: DatosPuente; indice: number }) {
  const [k, setK] = useState(0);
  const total = p.extra ? 2 : 1;
  const q: DatosPregunta = k === 0 || !p.extra ? p : p.extra;
  const alSeguir = useCallback(() => {
    if (evaluarArresto()) return;
    if (k + 1 < total) setK(k + 1);
    else concluirPuente();
  }, [k, total]);
  return <Pregunta key={k} p={p} q={q} indice={indice} k={k} total={total} alSeguir={alSeguir} />;
}

export default function Dialogo() {
  const fase = useFase();
  const n = usePuente();
  const p = PUENTES[n];
  if (!p || fase !== "dialogo") return null;
  return <Conversacion key={n} p={p} indice={n} />;
}
