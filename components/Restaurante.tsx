"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import Saber from "@/components/Saber";
import {
  cobrarServicio,
  consumirServicio,
  estado,
  pedirEnComedor,
  salirDeTienda,
  setComedor,
  useSoles,
} from "@/lib/estado";
import type { Plato, Servicio } from "@/lib/ruta";

const JET = "var(--font-jetbrains)";
const BRIC = "var(--font-bricolage)";

const COLOR_PLATO: Record<string, string> = {
  ceviche: "#f2dcc0",
  pachamanca: "#8a5a34",
  locro: "#e8a43a",
  cecina: "#7a3b22",
  chicharron: "#c98a3b",
  chicha: "#6d1f4f",
  agua: "#cfe8ff",
  emoliente: "#c9a56b",
  maracuya: "#f6c445",
  gaseosa: "#e0a82e",
};

type Paso = "elegir" | "espera" | "come" | "cuenta" | "listo";

export default function Restaurante({ s }: { s: Servicio }) {
  const saldo = useSoles();
  const [cant, setCant] = useState<Record<string, number>>({});
  const [paso, setPaso] = useState<Paso>("elegir");
  const [pagado, setPagado] = useState(0);
  const [con, setCon] = useState(true);

  const total = useMemo(() => s.platos.reduce((t, p) => t + p.precio * (cant[p.id] ?? 0), 0), [s, cant]);
  const lineas = s.platos.filter((p) => (cant[p.id] ?? 0) > 0);
  const descuento = Math.round(total * 0.1 * 100) / 100;
  const trato = "joven";

  useEffect(() => {
    setComedor(true);
    return () => setComedor(false);
  }, []);

  const cambiar = (p: Plato, d: number) => {
    const nuevo = (cant[p.id] ?? 0) + d;
    if (nuevo < 0 || nuevo > p.max) return;
    if (d > 0 && total + p.precio > saldo) return;
    setCant({ ...cant, [p.id]: nuevo });
  };

  const pedir = () => {
    const comida = lineas.find((l) => l.tipo !== "bebida");
    const bebida = lineas.find((l) => l.tipo === "bebida");
    pedirEnComedor(comida ? (COLOR_PLATO[comida.id] ?? "#f0c987") : "", bebida ? (COLOR_PLATO[bebida.id] ?? "#f6c445") : "");
    setPaso("espera");
  };

  useEffect(() => {
    if (paso === "espera") {
      const id = setTimeout(() => setPaso("come"), 4800);
      return () => clearTimeout(id);
    }
    if (paso === "come") {
      const id = setTimeout(() => {
        const e = { integridad: 0, salud: 0, kits: 0, botiquines: 0 };
        for (const p of lineas) {
          const c = cant[p.id] ?? 0;
          e.integridad += p.integridad * c;
          e.salud += p.salud * c;
        }
        consumirServicio(e);
        setPaso("cuenta");
      }, 4400);
      return () => clearTimeout(id);
    }
  }, [paso, lineas, cant]);

  const pagar = (conComp: boolean) => {
    const monto = conComp ? total : Math.round((total - descuento) * 100) / 100;
    cobrarServicio(s.nombre, monto, conComp, conComp ? 0 : 5);
    setCon(conComp);
    setPagado(monto);
    setPaso("listo");
  };

  useEffect(() => {
    if (paso !== "listo") return;
    const tecla = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        salirDeTienda();
      }
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [paso]);

  const caja = "w-full max-w-3xl rounded-2xl border border-white/10 p-4 backdrop-blur-md sm:p-5";
  const fondo = { background: "rgba(6,10,20,0.9)" };

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex justify-center p-3 sm:p-4">
      <div className={`${caja} pointer-events-auto max-h-[58vh] overflow-y-auto`} style={fondo}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em]" style={{ color: "#5eead4", fontFamily: JET }}>
              {s.titulo} · {s.nombre}
            </p>
            <p className="mt-1 text-base leading-snug text-white sm:text-lg" style={{ fontFamily: BRIC }}>
              {paso === "elegir" && `Mesero: «Buenas, ${trato}. Siéntese, aquí tiene la carta.»`}
              {paso === "espera" && "Mesero: «Enseguida le traigo su pedido.»"}
              {paso === "come" && "Disfrutando tu comida…"}
              {paso === "cuenta" && "Mesero: «¿Todo bien? Aquí tiene la cuenta.»"}
              {paso === "listo" && "Mesero: «Gracias por su visita. ¡Buen viaje!»"}
            </p>
          </div>
          <span
            className="shrink-0 rounded-full border border-white/15 px-3 py-1 text-[11px] uppercase tracking-[0.2em]"
            style={{ color: "#fbbf24", fontFamily: JET }}
          >
            S/ {saldo}
          </span>
        </div>

        {paso === "elegir" && (
          <>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {[...s.platos].sort((a, b) => Number(a.tipo === "bebida") - Number(b.tipo === "bebida")).map((p, idx, arr) => {
                const c = cant[p.id] ?? 0;
                const cabecera =
                  idx === 0 ? (p.tipo === "bebida" ? "Bebidas" : "Platos") : p.tipo === "bebida" && arr[idx - 1].tipo !== "bebida" ? "Bebidas" : "";
                const falta = c === 0 && total + p.precio > saldo;
                return (
                  <Fragment key={p.id}>
                  {cabecera && (
                    <p
                      className="mt-1 text-[10px] uppercase tracking-[0.3em] md:col-span-2"
                      style={{ color: "#5eead4", fontFamily: JET }}
                    >
                      {cabecera}
                    </p>
                  )}
                  <div
                    className="flex items-center gap-3 rounded-xl border px-3 py-2"
                    style={{
                      borderColor: c > 0 ? "rgba(255,122,61,0.6)" : "rgba(255,255,255,0.1)",
                      background: c > 0 ? "rgba(255,122,61,0.08)" : "rgba(255,255,255,0.04)",
                      opacity: falta ? 0.5 : 1,
                    }}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-semibold text-white" style={{ fontFamily: BRIC }}>
                        {p.nombre}
                      </p>
                      <p className="text-[13px] leading-snug text-white/70" style={{ fontFamily: BRIC }}>
                        {p.desc}
                      </p>
                      <span className="text-[10px] uppercase tracking-[0.2em]" style={{ color: "#5eead4", fontFamily: JET }}>
                        +{p.salud} salud
                      </span>
                    </div>
                    <span className="shrink-0 text-sm font-semibold" style={{ color: "#fbbf24", fontFamily: JET }}>
                      S/ {p.precio}
                    </span>
                    <div className="flex shrink-0 items-center gap-2" style={{ fontFamily: JET }}>
                      <button
                        type="button"
                        onClick={() => cambiar(p, -1)}
                        className="h-8 w-8 rounded-md border border-white/15 text-white hover:border-[#ff7a3d]"
                        aria-label={`Quitar ${p.nombre}`}
                      >
                        −
                      </button>
                      <span className="w-4 text-center text-white">{c}</span>
                      <button
                        type="button"
                        onClick={() => cambiar(p, 1)}
                        className="h-8 w-8 rounded-md border border-white/15 text-white hover:border-[#ff7a3d]"
                        aria-label={`Agregar ${p.nombre}`}
                      >
                        +
                      </button>
                    </div>
                  </div>
                  </Fragment>
                );
              })}
            </div>
            <div className="mt-3 flex items-center gap-3">
              <button
                type="button"
                disabled={total === 0}
                onClick={pedir}
                className="rounded-full px-6 py-3 text-[11px] uppercase tracking-[0.25em] transition enabled:hover:brightness-110 disabled:opacity-40"
                style={{ background: "#ff7a3d", color: "#1a0d05", fontFamily: JET }}
              >
                {total > 0 ? "Pedir" : "Elige un plato o una bebida"}
              </button>
              <button
                type="button"
                onClick={salirDeTienda}
                className="text-[11px] uppercase tracking-[0.25em] text-white/60 hover:text-white"
                style={{ fontFamily: JET }}
              >
                Salir sin pedir
              </button>
            </div>
          </>
        )}

        {(paso === "espera" || paso === "come") && (
          <div className="mt-3">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/15">
              <div
                key={paso}
                className="h-full rounded-full"
                style={{
                  background: "#ff7a3d",
                  animation: `${paso === "espera" ? "barra4" : "barra44"} linear forwards`,
                  animationDuration: paso === "espera" ? "4.8s" : "4.4s",
                }}
              />
            </div>
            <style>{`@keyframes barra4{from{width:0}to{width:100%}}@keyframes barra44{from{width:0}to{width:100%}}`}</style>
            <p className="mt-2 text-sm text-white/60" style={{ fontFamily: BRIC }}>
              {lineas.map((p) => `${cant[p.id]} × ${p.nombre}`).join(" · ")}
            </p>
          </div>
        )}

        {paso === "cuenta" && (
          <>
            <div className="mt-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3" style={{ fontFamily: BRIC }}>
              {lineas.map((p) => (
                <p key={p.id} className="flex justify-between text-base text-white">
                  <span>
                    {cant[p.id]} × {p.nombre}
                  </span>
                  <span style={{ color: "#fbbf24" }}>S/ {p.precio * (cant[p.id] ?? 0)}</span>
                </p>
              ))}
              <p className="mt-2 flex justify-between border-t border-white/10 pt-2 text-base font-semibold text-white">
                <span>Total consumido</span>
                <span style={{ color: "#fbbf24" }}>S/ {total}</span>
              </p>
            </div>
            <p className="mt-3 text-base text-white" style={{ fontFamily: BRIC }}>
              ¿Le entrego su boleta?
            </p>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => pagar(true)}
                className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-base text-white hover:border-[#ff7a3d]"
                style={{ fontFamily: BRIC }}
              >
                Sí, con boleta · pago S/ {total}
              </button>
              <button
                type="button"
                onClick={() => pagar(false)}
                className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-base text-white hover:border-[#ff7a3d]"
                style={{ fontFamily: BRIC }}
              >
                Sin boleta, con descuento · pago S/ {Math.round((total - descuento) * 100) / 100}
              </button>
            </div>
          </>
        )}

        {paso === "listo" && (
          <>
            <div
              className="mt-3 rounded-xl border px-4 py-3"
              style={{ borderColor: "rgba(94,234,212,0.3)", background: "rgba(94,234,212,0.06)" }}
            >
              <p className="text-base leading-snug text-white" style={{ fontFamily: BRIC }}>
                {con
                  ? `Pagaste S/ ${pagado} y te dieron tu boleta: tu compra queda sustentada.`
                  : `Pagaste S/ ${pagado} sin boleta. Ahorraste un poco, pero no tienes cómo sustentar el gasto (riesgo fiscal +5).`}
              </p>
              <p className="mt-2 text-[11px] uppercase tracking-[0.2em]" style={{ color: "#5eead4", fontFamily: JET }}>
                Salud {Math.round(estado.salud)}% · Mototaxi {Math.round(estado.integridad)}%
              </p>
            </div>
            <div className="mt-3">
              <Saber id={s.saberId} titulo={s.saberTitulo} bono={s.saberBono}>
                {s.saber.map((t, i) => (
                  <p key={i}>{t}</p>
                ))}
              </Saber>
            </div>
            <button
              type="button"
              onClick={salirDeTienda}
              className="mt-3 rounded-full px-6 py-3 text-[11px] uppercase tracking-[0.25em] transition hover:brightness-110"
              style={{ background: "#ff7a3d", color: "#1a0d05", fontFamily: JET }}
            >
              Salir · Espacio
            </button>
          </>
        )}
      </div>
    </div>
  );
}
