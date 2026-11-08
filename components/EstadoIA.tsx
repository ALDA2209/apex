"use client";

import { useSyncExternalStore } from "react";
import { leerEstadoIA, suscribirEstadoIA } from "@/lib/ia";

/* Una línea que dice si la IA (Gemini) está lista para crear las preguntas de tu partida. */
export default function EstadoIA() {
  const e = useSyncExternalStore(suscribirEstadoIA, leerEstadoIA, leerEstadoIA);
  const info =
    e.fase === "lista"
      ? { color: "#5eead4", punto: "#5eead4", texto: "IA lista · tendrás preguntas nuevas en esta partida" }
      : e.fase === "pidiendo"
        ? { color: "#c4b5fd", punto: "#a78bfa", texto: "IA preparando tus preguntas… puede tardar hasta un minuto" }
        : e.fase === "error"
          ? { color: "#fbbf24", punto: "#fbbf24", texto: `IA sin conexión (${e.motivo}) · se usarán preguntas de respaldo` }
          : e.fase === "sin-url"
            ? { color: "#8b93b8", punto: "#8b93b8", texto: "IA no configurada · se usarán preguntas de respaldo" }
            : { color: "#8b93b8", punto: "#8b93b8", texto: "IA en espera" };
  return (
    <p className="flex items-start gap-2 font-mono text-[10px] leading-relaxed tracking-[0.04em]" style={{ color: info.color }} role="status">
      <span className={`mt-[3px] h-1.5 w-1.5 shrink-0 rounded-full ${e.fase === "pidiendo" ? "animate-pulse" : ""}`} style={{ background: info.punto }} />
      <span>{info.texto}</span>
    </p>
  );
}
