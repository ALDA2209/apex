"use client";

import { useEffect, useRef, useState } from "react";
import { hayIA, pedirTutor } from "@/lib/ia";
import { estado, useRiesgo, useSoles, useVentas } from "@/lib/estado";
import { PUENTES, preguntaDe } from "@/lib/puentes";
import { callar, hablar } from "@/lib/audio";
import { ABOGADO, CONSULTAS, COSTO_CONSULTA } from "@/lib/abogado";
import { CAPITAL } from "@/lib/estado";
import { cobrarDia, DIAS, diaActual, leerProgreso, rangoDe, siguienteDia, type ResultadoDia } from "@/lib/semana";

const JET = "var(--font-jetbrains)";
const BRIC = "var(--font-bricolage)";

export default function Meta({ alSalir }: { alSalir: () => void }) {
  useEffect(() => () => callar(), []);
  const [textoIA, setTextoIA] = useState<string | null>(null);
  /* Se cobra el día una sola vez: ganancia, experiencia y rango. */
  const [dia, setDia] = useState<ResultadoDia | null>(null);
  const cobrado = useRef(false);
  useEffect(() => {
    if (cobrado.current) return;
    cobrado.current = true;
    setDia(
      cobrarDia({
        soles: estado.soles,
        capital: CAPITAL,
        correctas: estado.decisiones.filter((d) => d.correcta).length,
        comprasConComprobante: estado.compras.filter((c) => c.conComprobante).length,
        ventasConComprobante: estado.entregas.filter((v) => v.comprobante !== "ninguno").length,
        faltas: estado.faltas.reduce((t, f) => t + f.peso, 0),
      }),
    );
  }, []);
  const [pensando, setPensando] = useState(hayIA());
  const soles = useSoles();
  const ventas = useVentas();
  const entregas = estado.entregas;
  const ventasCon = entregas.filter((v) => v.comprobante !== "ninguno").length;
  const riesgo = useRiesgo();
  const decisiones = estado.decisiones;
  const bien = decisiones.filter((d) => d.correcta).length;
  const conComp = estado.compras.filter((c) => c.conComprobante).length;
  const moto = Math.round(estado.integridad);
  const salud = Math.round(estado.salud);
  const nivelColor = (n: number) => (n >= 60 ? "#2dd4bf" : n >= 30 ? "#fbbf24" : "#f43f5e");
  const consultadas = CONSULTAS.filter((c) => estado.consultas.includes(c.id));
  const falladas = decisiones.filter((d) => !d.correcta).length;
  const consejo =
    consultadas.length === 0
      ? `No consultaste a un abogado. Una consulta cuesta ${COSTO_CONSULTA} soles; una sanción puede costar mucho más.${
          falladas > 0 ? ` Te habría ayudado en los ${falladas} puente${falladas > 1 ? "s" : ""} donde fallaste.` : ""
        }`
      : `Consultaste ${consultadas.length} de ${CONSULTAS.length} temas y gastaste ${estado.gastoAbogado} soles. Eso es prevención: cuesta menos que corregir un error después.${
          falladas > 0 ? " Aun así, repasa las lecciones de los puentes donde fallaste." : " Y tus decisiones lo demuestran."
        }`;
  useEffect(() => {
    if (!hayIA()) return;
    let vivo = true;
    pedirTutor({
      nivel: estado.nivel,
      decisiones: estado.decisiones.map((d) => ({
        titulo: PUENTES[d.puente]?.titulo + " · " + PUENTES[d.puente]?.subtitulo,
        eligio: preguntaDe(d.puente, d.k)?.opciones[d.opcion]?.texto ?? "",
        correcta: d.correcta,
        leccion: preguntaDe(d.puente, d.k)?.opciones[d.opcion]?.leccion ?? "",
      })),
      ventas: estado.entregas.map((v) => ({ negocio: v.negocio, comprobante: v.comprobante, acierto: v.acierto })),
      consultas: estado.consultas.length,
      riesgo: Math.round(estado.riesgo),
      infracciones: estado.infracciones.length,
    }).then((t) => {
      if (!vivo) return;
      setTextoIA(t);
      setPensando(false);
      if (t) hablar(`${ABOGADO}. ${t}`, "narrador");
    });
    return () => {
      vivo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const color = riesgo <= 35 ? "#2dd4bf" : riesgo <= 65 ? "#fbbf24" : "#f43f5e";
  const veredicto =
    riesgo <= 35
      ? "Ruta en regla. Tu negocio avanza tranquilo."
      : riesgo <= 65
        ? "Llegaste, pero con riesgos. Repasa tus decisiones."
        : "Llegaste con mucho riesgo fiscal. Aprende de cada decisión.";

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm">
      <div
        className="my-auto w-full max-w-3xl rounded-2xl border border-white/10 p-6"
        style={{ background: "rgba(6,10,20,0.94)" }}
      >
        <p className="text-[10px] uppercase tracking-[0.3em]" style={{ color: "#d9ff3f", fontFamily: JET }}>
          {dia ? DIAS[dia.dia - 1].nombre : diaActual().nombre} completado · Semana {leerProgreso().semana}
        </p>
        <h2 className="mt-1 text-3xl font-semibold text-white" style={{ fontFamily: BRIC }}>
          {veredicto}
        </h2>

        {dia && (
          <div
            className="mt-4 rounded-2xl border px-4 py-3"
            style={{ borderColor: "rgba(251,191,36,0.45)", background: "rgba(251,191,36,0.06)", fontFamily: JET }}
          >
            <p className="text-[10px] uppercase tracking-[0.3em]" style={{ color: "#fbbf24" }}>
              Paga del día
            </p>
            <div className="mt-1 flex flex-wrap items-baseline gap-x-6 gap-y-1">
              <span className="text-3xl font-semibold" style={{ color: "#fbbf24" }}>
                + S/ {dia.ganancia}
              </span>
              <span className="text-xl font-semibold" style={{ color: "#c4b5fd" }}>
                + {dia.xp} XP
              </span>
              <span className="text-xs text-white/70">
                Billetera: S/ {leerProgreso().dinero} · {rangoDe(leerProgreso().xp).nombre}
              </span>
            </div>
            <p className="mt-1.5 text-xs text-white/70" style={{ fontFamily: BRIC }}>
              Por la caja S/ {dia.porCaja} · por respuestas correctas S/ {dia.porRespuestas}
              {dia.rutaLimpia ? " · por ruta sin infracciones S/ 30" : ""}
            </p>
            {dia.rangoDespues !== dia.rangoAntes && (
              <p className="mt-1 text-sm" style={{ color: "#c4b5fd", fontFamily: BRIC }}>
                ¡Subiste de rango! Ahora eres {dia.rangoDespues}.
              </p>
            )}
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4" style={{ fontFamily: JET }}>
          {[
            ["Estado del mototaxi", `${moto}%`, nivelColor(moto)],
            ["Salud del conductor", `${salud}%`, nivelColor(salud)],
            ["Caja", `S/ ${soles}`, "#fbbf24"],
            ["Ventas", `S/ ${ventas}`, "#fbbf24"],
            ["Ventas con comprobante", `${ventasCon}/${entregas.length}`, "#5eead4"],
            ["Riesgo fiscal", `${riesgo}%`, color],
            ["Decisiones bien", `${bien}/${PUENTES.length}`, "#5eead4"],
            ["Compras con comprobante", `${conComp}/${estado.compras.length}`, "#5eead4"],
          ].map(([t, v, c]) => (
            <div key={t} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
              <p className="text-[9px] uppercase tracking-[0.25em] text-white/50">{t}</p>
              <p className="text-xl font-semibold" style={{ color: c }}>
                {v}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-5 text-[10px] uppercase tracking-[0.3em] text-white/60" style={{ fontFamily: JET }}>
          Mapa de decisiones
        </p>
        <div className="mt-2 flex flex-col gap-2">
          {PUENTES.map((p, i) => {
            const ds = decisiones.filter((x) => x.puente === i).sort((x, y) => x.k - y.k);
            const todas = ds.length > 0 && ds.every((x) => x.correcta);
            const color = ds.length === 0 ? "#94a3b8" : todas ? "#5eead4" : "#f43f5e";
            return (
              <div
                key={i}
                className="rounded-xl border px-4 py-3"
                style={{
                  borderColor: ds.length === 0 ? "rgba(255,255,255,0.1)" : todas ? "rgba(94,234,212,0.4)" : "rgba(244,63,94,0.4)",
                  background: "rgba(255,255,255,0.03)",
                }}
              >
                <p className="text-[10px] uppercase tracking-[0.25em]" style={{ fontFamily: JET, color }}>
                  {p.titulo} · {p.subtitulo} · {ds.length === 0 ? "sin decisión" : todas ? "Bien" : "A mejorar"}
                </p>
                {ds.map((d) => {
                  const o = preguntaDe(i, d.k)?.opciones[d.opcion];
                  if (!o) return null;
                  return (
                    <div key={d.k} className="mt-2">
                      <p className="text-base text-white" style={{ fontFamily: BRIC }}>
                        <span style={{ color: d.correcta ? "#5eead4" : "#f43f5e" }}>{d.correcta ? "✓" : "✗"}</span> Elegiste: {o.texto}
                      </p>
                      <p className="mt-1 text-sm leading-snug text-white/70" style={{ fontFamily: BRIC }}>
                        {o.leccion}
                      </p>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        <div
          className="mt-4 rounded-xl border px-4 py-3"
          style={{ borderColor: "rgba(251,191,36,0.4)", background: "rgba(251,191,36,0.05)" }}
        >
          <p className="text-[10px] uppercase tracking-[0.3em]" style={{ color: "#fbbf24", fontFamily: JET }}>
            ⚖ Tu abogado opina · {ABOGADO}
          </p>
          <p className="mt-1 text-base leading-snug text-white/90" style={{ fontFamily: BRIC }}>
            {pensando ? "El Dr. Paredes está revisando tu partida…" : (textoIA ?? consejo)}
          </p>
          {textoIA && (
            <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-white/40" style={{ fontFamily: JET }}>
              Comentario generado con IA (Gemini) a partir de tus decisiones · puede equivocarse
            </p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => hablar(`${ABOGADO}. ${textoIA ?? consejo}`, "narrador")}
              className="rounded-full border border-white/20 px-4 py-1.5 text-[11px] uppercase tracking-[0.2em] text-white/90 hover:border-white/50"
              style={{ fontFamily: JET }}
            >
              ▶ Escuchar
            </button>
            <button
              type="button"
              onClick={callar}
              className="rounded-full border border-white/20 px-4 py-1.5 text-[11px] uppercase tracking-[0.2em] text-white/60 hover:border-white/50"
              style={{ fontFamily: JET }}
            >
              ■ Detener
            </button>
          </div>
        </div>

        {estado.faltas.length > 0 && (
          <p className="mt-4 text-sm text-white/80" style={{ fontFamily: BRIC }}>
            Infracciones ante la autoridad: {estado.faltas.reduce((t, x) => t + x.peso, 0)} de 3 puntos. ¡Estuviste cerca del arresto!
          </p>
        )}

        {estado.infracciones.length > 0 && (
          <p className="mt-4 text-sm text-white/80" style={{ fontFamily: BRIC }}>
            Fotopapeletas por exceso de velocidad: {estado.infracciones.length} · S/{" "}
            {estado.infracciones.reduce((t, v) => t + v.multa, 0)} en multas de juego.
          </p>
        )}

        {entregas.length > 0 && (
          <>
            <p className="mt-5 text-[10px] uppercase tracking-[0.3em] text-white/60" style={{ fontFamily: JET }}>
              Tus entregas
            </p>
            <div className="mt-2 flex flex-col gap-2">
              {entregas.map((v, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-3 rounded-xl border px-4 py-3"
                  style={{
                    borderColor: v.acierto ? "rgba(94,234,212,0.4)" : "rgba(244,63,94,0.4)",
                    background: "rgba(255,255,255,0.03)",
                  }}
                >
                  <div>
                    <p className="text-base text-white" style={{ fontFamily: BRIC }}>
                      {v.negocio}
                    </p>
                    <p
                      className="text-[10px] uppercase tracking-[0.25em]"
                      style={{ fontFamily: JET, color: v.acierto ? "#5eead4" : "#f43f5e" }}
                    >
                      {v.comprobante === "ninguno" ? "Sin comprobante" : v.comprobante === "boleta" ? "Boleta" : "Factura"} ·{" "}
                      {v.acierto ? "Bien" : "A mejorar"}
                    </p>
                  </div>
                  <span className="text-base font-semibold" style={{ color: "#fbbf24", fontFamily: JET }}>
                    S/ {v.monto}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

        <p className="mt-4 text-[11px] text-white/40" style={{ fontFamily: BRIC }}>
          Los montos del juego son un ejemplo. Las reglas y sanciones reales están en sunat.gob.pe.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              siguienteDia();
              alSalir();
            }}
            className="rounded-full px-6 py-3 text-[11px] uppercase tracking-[0.25em] transition hover:brightness-110"
            style={{ background: "#ff7a3d", color: "#1a0d05", fontFamily: JET }}
          >
            {dia?.semanaCerrada
              ? `Cerrar la semana → Semana ${leerProgreso().semana + 1}`
              : `Siguiente día → ${DIAS[Math.min(4, (dia?.dia ?? diaActual().n))].nombre}`}
          </button>
          <button
            type="button"
            onClick={alSalir}
            className="rounded-full border border-white/20 px-6 py-3 text-[11px] uppercase tracking-[0.25em] text-white transition hover:border-white/50"
            style={{ fontFamily: JET }}
          >
            Volver al menú
          </button>
        </div>
      </div>
    </div>
  );
}
