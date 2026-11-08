"use client";

import { useEffect, useMemo, useState } from "react";
import Saber from "@/components/Saber";
import { estado, pagarServicio, salirDeTienda, useServicio, useSoles } from "@/lib/estado";
import Restaurante from "@/components/Restaurante";
import { SERVICIOS, type Plato } from "@/lib/ruta";
import Entrega from "@/components/Entrega";
import Estudio from "@/components/Estudio";

const JET = "var(--font-jetbrains)";
const BRIC = "var(--font-bricolage)";

function Efecto({ p }: { p: Plato }) {
  const v: string[] = [];
  if (p.salud) v.push(`+${p.salud} salud`);
  if (p.integridad) v.push(`+${p.integridad} mototaxi`);
  if (p.kits) v.push(`+${p.kits} kit`);
  if (p.botiquines) v.push(`+${p.botiquines} botiquín`);
  return (
    <span className="text-[10px] uppercase tracking-[0.2em]" style={{ color: "#5eead4", fontFamily: JET }}>
      {v.join(" · ")}
    </span>
  );
}

function Tarjeta({ n }: { n: number }) {
  const s = SERVICIOS[n];
  const saldo = useSoles();
  const [cant, setCant] = useState<Record<string, number>>({});
  const [paso, setPaso] = useState<"elegir" | "pagar" | "listo">("elegir");
  const [cobrado, setCobrado] = useState(0);
  const [con, setCon] = useState(true);
  const [atendiendo, setAtendiendo] = useState(false);
  const comida = s.variante === "restaurante";
  const comprobante = comida ? "boleta" : "factura";

  const total = useMemo(() => s.platos.reduce((t, p) => t + p.precio * (cant[p.id] ?? 0), 0), [s, cant]);
  const lineas = s.platos.filter((p) => (cant[p.id] ?? 0) > 0);
  const descuento = Math.round(total * 0.1 * 100) / 100;

  const cambiar = (p: Plato, d: number) => {
    const nuevo = (cant[p.id] ?? 0) + d;
    if (nuevo < 0 || nuevo > p.max) return;
    if (d > 0 && total + p.precio > saldo) return;
    setCant({ ...cant, [p.id]: nuevo });
  };

  const pagar = (conComp: boolean) => {
    const monto = conComp ? total : Math.round((total - descuento) * 100) / 100;
    const efecto = { integridad: 0, salud: 0, kits: 0, botiquines: 0 };
    for (const p of lineas) {
      const c = cant[p.id] ?? 0;
      efecto.integridad += p.integridad * c;
      efecto.salud += p.salud * c;
      efecto.kits += p.kits * c;
      efecto.botiquines += p.botiquines * c;
    }
    if (!pagarServicio(s.nombre, monto, conComp, conComp ? 0 : 5, efecto)) return;
    setCon(conComp);
    setCobrado(monto);
    setAtendiendo(true);
    setPaso("listo");
  };

  useEffect(() => {
    if (!atendiendo) return;
    const id = setTimeout(() => setAtendiendo(false), 2400);
    return () => clearTimeout(id);
  }, [atendiendo]);

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if (paso === "listo" && !atendiendo && (e.code === "Space" || e.code === "Enter")) {
        e.preventDefault();
        salirDeTienda();
      }
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [paso, atendiendo]);

  return (
    <div className="absolute inset-0 z-30 flex items-end justify-center overflow-y-auto bg-black/40 p-4 sm:items-center">
      <div
        className="my-auto w-full max-w-4xl rounded-2xl border border-white/10 p-5 backdrop-blur-md sm:p-6"
        style={{ background: "rgba(6,10,20,0.92)" }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em]" style={{ color: "#5eead4", fontFamily: JET }}>
              {s.titulo} · {s.nombre}
            </p>
            <p className="mt-1 text-lg leading-snug text-white" style={{ fontFamily: BRIC }}>
              {s.frase}
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
            <p className="mt-4 text-[10px] uppercase tracking-[0.3em] text-white/60" style={{ fontFamily: JET }}>
              {s.carta}
            </p>
            <div className="mt-2 grid gap-2 md:grid-cols-2">
              {s.platos.map((p) => {
                const c = cant[p.id] ?? 0;
                const falta = c === 0 && total + p.precio > saldo;
                return (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 rounded-xl border px-3 py-2.5"
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
                      <Efecto p={p} />
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
                );
              })}
            </div>
            <div className="mt-4 flex items-center gap-3">
              <button
                type="button"
                onClick={() => (total > 0 ? setPaso("pagar") : salirDeTienda())}
                className="rounded-full px-6 py-3 text-[11px] uppercase tracking-[0.25em] transition hover:brightness-110"
                style={{ background: "#ff7a3d", color: "#1a0d05", fontFamily: JET }}
              >
                {total > 0 ? `Pedir · S/ ${total}` : "Salir sin comprar"}
              </button>
            </div>
          </>
        )}

        {paso === "pagar" && (
          <>
            <div className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3" style={{ fontFamily: BRIC }}>
              {lineas.map((p) => (
                <p key={p.id} className="flex justify-between text-base text-white">
                  <span>
                    {cant[p.id]} × {p.nombre}
                  </span>
                  <span style={{ color: "#fbbf24" }}>S/ {p.precio * (cant[p.id] ?? 0)}</span>
                </p>
              ))}
              <p className="mt-2 flex justify-between border-t border-white/10 pt-2 text-base font-semibold text-white">
                <span>Total</span>
                <span style={{ color: "#fbbf24" }}>S/ {total}</span>
              </p>
            </div>
            <p className="mt-4 text-lg text-white" style={{ fontFamily: BRIC }}>
              {comida ? "¿Me da su boleta?" : "¿Pide su factura?"}
            </p>
            <div className="mt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => pagar(true)}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-base text-white hover:border-[#ff7a3d]"
                style={{ fontFamily: BRIC }}
              >
                Sí, con {comprobante} · pago S/ {total}
              </button>
              <button
                type="button"
                onClick={() => pagar(false)}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-base text-white hover:border-[#ff7a3d]"
                style={{ fontFamily: BRIC }}
              >
                Sin {comprobante}, me hacen descuento · pago S/ {Math.round((total - descuento) * 100) / 100}
              </button>
            </div>
            <button
              type="button"
              onClick={() => setPaso("elegir")}
              className="mt-3 text-[11px] uppercase tracking-[0.25em] text-white/60 hover:text-white"
              style={{ fontFamily: JET }}
            >
              ← Cambiar pedido
            </button>
          </>
        )}

        {paso === "listo" && (
          <>
            {atendiendo ? (
              <div className="mt-6">
                <p className="text-lg text-white" style={{ fontFamily: BRIC }}>
                  {comida ? "Disfrutando tu comida…" : "Atendiéndote…"}
                </p>
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/15">
                  <div className="h-full animate-[barra_2.4s_linear_forwards] rounded-full" style={{ background: "#ff7a3d" }} />
                </div>
                <style>{`@keyframes barra{from{width:0}to{width:100%}}`}</style>
              </div>
            ) : (
              <>
                <div
                  className="mt-4 rounded-xl border px-4 py-3"
                  style={{ borderColor: "rgba(94,234,212,0.3)", background: "rgba(94,234,212,0.06)" }}
                >
                  <p className="text-base leading-snug text-white" style={{ fontFamily: BRIC }}>
                    {con
                      ? `Pagaste S/ ${cobrado} y te dieron tu ${comprobante}: tu compra queda sustentada.`
                      : `Pagaste S/ ${cobrado} sin ${comprobante}. Ahorraste un poco, pero no tienes cómo sustentar el gasto (riesgo fiscal +5).`}
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
                  className="mt-4 rounded-full px-6 py-3 text-[11px] uppercase tracking-[0.25em] transition hover:brightness-110"
                  style={{ background: "#ff7a3d", color: "#1a0d05", fontFamily: JET }}
                >
                  Salir · Espacio
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function Servicio() {
  const n = useServicio();
  if (!SERVICIOS[n]) return null;
  if (SERVICIOS[n].entrega) return <Entrega key={n} s={SERVICIOS[n]} />;
  if (SERVICIOS[n].variante === "estudio") return <Estudio key={n} s={SERVICIOS[n]} />;
  if (SERVICIOS[n].variante === "restaurante") return <Restaurante key={n} s={SERVICIOS[n]} />;
  return <Tarjeta key={n} n={n} />;
}
