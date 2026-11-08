"use client";

import { useSyncExternalStore } from "react";
import { leerEstadoIA, suscribirEstadoIA } from "@/lib/ia";

/* Una línea que dice si la IA (Gemini) está lista para crear las preguntas de tu partida. */
export default function EstadoIA() {
  const e = useSyncExternalStore(suscribirEstadoIA, leerEstadoIA, leerEstadoIA);
  const info =
    e.fase === "lista"
      ? { color: "#5eead4", punto: "#5eead4", texto: "IA lista · preguntas nuevas creadas para tu partida" }
      : e.fase === "pidiendo"
        ? { color: "#c4b5fd", punto: "#a78bfa", texto: "IA preparando tus preguntas… puede tardar hasta un minuto" }
        : e.fase === "error"
          ? { color: "#fbbf24", punto: "#fbbf24", texto: `La IA no respondió (${e.motivo}). Pulsa «Reintentar».` }
          : e.fase === "sin-url"
            ? { color: "#8b93b8", punto: "#8b93b8", texto: "Falta conectar la IA: el juego necesita el servidor de preguntas." }
            : { color: "#8b93b8", punto: "#8b93b8", texto: "La IA crea tus preguntas al pulsar «Empezar» (puede tardar hasta un minuto)" };
  return (
    <p className="flex items-start gap-2 font-mono text-[10px] leading-relaxed tracking-[0.04em]" style={{ color: info.color }} role="status">
      <span className={`mt-[3px] h-1.5 w-1.5 shrink-0 rounded-full ${e.fase === "pidiendo" ? "animate-pulse" : ""}`} style={{ background: info.punto }} />
      <span>{info.texto}</span>
    </p>
  );
}
