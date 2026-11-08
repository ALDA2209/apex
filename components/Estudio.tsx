"use client";

import { useEffect, useState } from "react";
import { callar, hablar } from "@/lib/audio";
import { ABOGADO, CONSULTAS, COSTO_CONSULTA, NOTA_ABOGADO, RIESGO_CONSULTA, type Consulta } from "@/lib/abogado";
import { consultarAbogado, estado, salirDeTienda, useSoles } from "@/lib/estado";
import type { Servicio } from "@/lib/ruta";

const JET = "var(--font-jetbrains)";
const BRIC = "var(--font-bricolage)";

const SALUDO = `Buenas, soy el ${ABOGADO}, abogado tributarista. Cada consulta cuesta ${COSTO_CONSULTA} soles y te entrego un recibo por honorarios. Pregunta antes de decidir: es más barato que una sanción. ¿Qué quieres saber?`;

export default function Estudio({ s }: { s: Servicio }) {
  const saldo = useSoles();
  const [abierta, setAbierta] = useState<string | null>(null);
  const [hechas, setHechas] = useState<string[]>([...estado.consultas]);
  const [aviso, setAviso] = useState("");

  const abrir = (c: Consulta) => {
    // ya consultada: se puede volver a escuchar sin pagar de nuevo
    if (!estado.consultas.includes(c.id)) {
      if (!consultarAbogado(c.id, COSTO_CONSULTA, RIESGO_CONSULTA)) {
        setAviso(`No te alcanza la caja para esta consulta (S/ ${COSTO_CONSULTA}).`);
        return;
      }
      setHechas([...estado.consultas]);
    }
    setAviso("");
    setAbierta(c.id);
    hablar(`${c.pregunta} ${c.respuesta.join(" ")}`, "narrador");
  };

  useEffect(() => {
    hablar(SALUDO, "narrador");
    return () => callar();
  }, []);

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      const i = Number(e.key) - 1;
      if (i >= 0 && i < CONSULTAS.length) abrir(CONSULTAS[i]);
      else if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        salirDeTienda();
      }
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const actual = CONSULTAS.find((c) => c.id === abierta);

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex justify-center p-3 sm:p-4">
      <div
        className="pointer-events-auto max-h-[70vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-white/10 p-4 backdrop-blur-md sm:p-5"
        style={{ background: "rgba(6,10,20,0.93)" }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em]" style={{ color: "#5eead4", fontFamily: JET }}>
              {s.titulo} · {s.nombre}
            </p>
            <p className="mt-1 text-base leading-snug text-white sm:text-lg" style={{ fontFamily: BRIC }}>
              {ABOGADO}: «Pregunta antes de decidir. Una consulta cuesta S/ {COSTO_CONSULTA} y te da un recibo por
              honorarios.»
            </p>
          </div>
          <span
            className="shrink-0 rounded-full border border-white/15 px-3 py-1 text-[11px] uppercase tracking-[0.2em]"
            style={{ color: "#fbbf24", fontFamily: JET }}
          >
            Caja S/ {saldo}
          </span>
        </div>

        <div className="mt-4 flex flex-col gap-2">
          {CONSULTAS.map((c, i) => {
            const pagada = hechas.includes(c.id);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => abrir(c)}
                className="flex items-start gap-3 rounded-xl border bg-white/5 px-4 py-3 text-left text-white transition hover:bg-white/10"
                style={{
                  fontFamily: BRIC,
                  borderColor: abierta === c.id ? "#5eead4" : "rgba(255,255,255,0.1)",
                }}
              >
                <span
                  className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold"
                  style={{ background: "#ff7a3d", color: "#1a0d05", fontFamily: JET }}
                >
                  {i + 1}
                </span>
                <span className="flex-1">
                  <span className="block text-base font-semibold leading-snug">{c.tema}</span>
                  <span className="block text-[13px] text-white/60">
                    {c.pregunta} · Ayuda en: {c.puenteNombre}
                  </span>
                </span>
                <span
                  className="shrink-0 self-center rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.18em]"
                  style={{
                    fontFamily: JET,
                    background: pagada ? "rgba(94,234,212,0.15)" : "#fbbf24",
                    color: pagada ? "#5eead4" : "#1a1205",
                  }}
                >
                  {pagada ? "Escuchar de nuevo" : `Consultar · S/ ${COSTO_CONSULTA}`}
                </span>
              </button>
            );
          })}
        </div>

        {aviso && (
          <p className="mt-3 text-sm" style={{ color: "#f43f5e", fontFamily: BRIC }}>
            {aviso}
          </p>
        )}

        {actual && (
          <div
            className="mt-4 rounded-xl border px-4 py-3"
            style={{ borderColor: "rgba(94,234,212,0.3)", background: "rgba(94,234,212,0.06)" }}
          >
            <p className="text-[10px] uppercase tracking-[0.25em]" style={{ color: "#5eead4", fontFamily: JET }}>
              Lo que explica tu abogado · riesgo fiscal {RIESGO_CONSULTA}
            </p>
            <div className="mt-2 flex flex-col gap-2 text-base leading-snug text-white/90" style={{ fontFamily: BRIC }}>
              {actual.respuesta.map((t, k) => (
                <p key={k}>{t}</p>
              ))}
            </div>
          </div>
        )}

        <p className="mt-3 text-[11px] text-white/40" style={{ fontFamily: BRIC }}>
          {NOTA_ABOGADO}
        </p>
        <button
          type="button"
          onClick={salirDeTienda}
          className="mt-3 rounded-full px-6 py-3 text-[11px] uppercase tracking-[0.25em] transition hover:brightness-110"
          style={{ background: "#ff7a3d", color: "#1a0d05", fontFamily: JET }}
        >
          Salir del estudio · Espacio
        </button>
      </div>
    </div>
  );
}
