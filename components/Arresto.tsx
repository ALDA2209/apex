"use client";

import { useEffect } from "react";
import { callar, hablar, sirena } from "@/lib/audio";
import { estado, LIMITE_FALTAS, puntosFaltas } from "@/lib/estado";
import { preguntaDe, PUENTES } from "@/lib/puentes";

const JET = "var(--font-jetbrains)";
const BRIC = "var(--font-bricolage)";

/* Pantalla de arresto: juntaste 3 puntos de infracción ante la autoridad y pierdes la partida. */
export default function Arresto({ alSalir }: { alSalir: () => void }) {
  const ultima = estado.faltas[estado.faltas.length - 1];
  const oficial = PUENTES[ultima?.puente ?? 0]?.oficial ?? "El oficial";

  useEffect(() => {
    sirena(3);
    hablar(`${oficial}. Queda detenido. Reunió demasiadas infracciones. La partida termina aquí.`, "oficial");
    return () => callar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const casos = estado.faltas.map((f) => {
    const q = preguntaDe(f.puente, f.k);
    const d = estado.decisiones.find((x) => x.puente === f.puente && x.k === f.k);
    const elegida = d && q ? q.opciones[d.opcion] : undefined;
    const correcta = q?.opciones.find((o) => o.correcta);
    return { f, texto: q?.pregunta("joven") ?? "", elegida, correcta, titulo: PUENTES[f.puente]?.subtitulo ?? "" };
  });

  return (
    <div className="absolute inset-0 z-30 overflow-y-auto" style={{ background: "rgba(4,6,14,0.985)" }}>
      <style>{`
        @keyframes arr-luz-roja { 0%,45% { opacity: .95 } 50%,100% { opacity: .08 } }
        @keyframes arr-luz-azul { 0%,45% { opacity: .08 } 50%,100% { opacity: .95 } }
      `}</style>
      <div className="pointer-events-none fixed inset-x-0 top-0 z-10 flex h-2">
        <span className="h-full w-1/2" style={{ background: "#ef4444", boxShadow: "0 0 40px 10px #ef4444", animation: "arr-luz-roja 0.9s steps(1) infinite" }} />
        <span className="h-full w-1/2" style={{ background: "#3b82f6", boxShadow: "0 0 40px 10px #3b82f6", animation: "arr-luz-azul 0.9s steps(1) infinite" }} />
      </div>

      <div className="mx-auto flex min-h-full max-w-3xl flex-col justify-center px-4 py-8 sm:py-12">
        <p className="text-[10px] uppercase tracking-[0.35em]" style={{ color: "#fb7185", fontFamily: JET }}>
          {oficial} · {puntosFaltas()}/{LIMITE_FALTAS} puntos de infracción
        </p>
        <h2 className="mt-2 text-4xl font-bold leading-none text-white sm:text-6xl" style={{ fontFamily: BRIC }}>
          Arrestado
        </h2>
        <p className="mt-3 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg" style={{ fontFamily: BRIC }}>
          Respondiste mal varias veces ante la autoridad y el oficial te detuvo. Aquí la partida termina. En la vida real,
          conocer las reglas antes de salir te ahorra multas, retención de mercadería y problemas legales.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={alSalir}
            className="rounded-full px-6 py-3 text-[11px] uppercase tracking-[0.25em] transition hover:brightness-110"
            style={{ background: "#ff7a3d", color: "#1a0d05", fontFamily: JET }}
          >
            Volver a intentarlo
          </button>
        </div>
        <p className="mt-6 text-[10px] uppercase tracking-[0.3em] text-white/60" style={{ fontFamily: JET }}>
          Lo que pasó y lo que debías responder
        </p>
        <div className="mt-2 flex flex-col gap-2">
          {casos.map(({ f, texto, elegida, correcta, titulo }, i) => (
            <div
              key={i}
              className="rounded-xl border px-4 py-3"
              style={{ borderColor: "rgba(244,63,94,0.45)", background: "rgba(255,255,255,0.04)" }}
            >
              <p className="text-[10px] uppercase tracking-[0.22em]" style={{ color: "#fb7185", fontFamily: JET }}>
                {titulo} · pregunta {f.k + 1} · {f.peso === 2 ? "delito (+2)" : "infracción (+1)"}
              </p>
              {texto && (
                <p className="mt-1 text-sm text-white/70" style={{ fontFamily: BRIC }}>
                  {texto}
                </p>
              )}
              {elegida && (
                <p className="mt-1.5 text-sm text-white" style={{ fontFamily: BRIC }}>
                  <b style={{ color: "#fb7185" }}>Tú:</b> {elegida.texto}
                </p>
              )}
              {correcta && (
                <p className="mt-1 text-sm text-white" style={{ fontFamily: BRIC }}>
                  <b style={{ color: "#5eead4" }}>Lo correcto:</b> {correcta.texto}
                </p>
              )}
              {correcta && (
                <p className="mt-1 text-xs leading-snug text-white/65" style={{ fontFamily: BRIC }}>
                  {correcta.leccion}
                </p>
              )}
            </div>
          ))}
        </div>

        <p className="mt-4 text-[11px] text-white/40" style={{ fontFamily: BRIC }}>
          Es un juego: las multas y el arresto son de ejemplo. Las reglas y sanciones reales están en sunat.gob.pe.
        </p>
      </div>
    </div>
  );
}
