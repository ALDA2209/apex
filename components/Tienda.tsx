"use client";

import { useEffect, useMemo, useState } from "react";
import { CAPITAL, equipar, estado, registrarCompra, useSoles } from "@/lib/estado";
import Saber from "@/components/Saber";
import { NOTA_REGLAMENTO, REGLAS } from "@/lib/reglamento";

const JET = "var(--font-jetbrains)";
const BRIC = "var(--font-bricolage)";

type Articulo = { id: "defensa" | "kit" | "botiquin"; nombre: string; precio: number; max: number; desc: string };

const ARTICULOS: Articulo[] = [
  { id: "defensa", nombre: "Defensa reforzada", precio: 60, max: 1, desc: "Los choques dañan tu mototaxi la mitad." },
  { id: "kit", nombre: "Kit de reparación", precio: 40, max: 3, desc: "Repara 40% del mototaxi en plena ruta." },
  { id: "botiquin", nombre: "Botiquín", precio: 30, max: 3, desc: "Cura 40% de tu salud en plena ruta." },
];

const soles = (n: number) => "S/ " + n.toFixed(2);

function Boleta({ lineas, total, con }: { lineas: { n: string; c: number; p: number }[]; total: number; con: boolean }) {
  const base = total / 1.18;
  const igv = total - base;
  return (
    <div
      className="rounded-xl border border-dashed px-4 py-3 text-sm text-white/90"
      style={{ borderColor: "rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.04)", fontFamily: JET }}
    >
      <p className="text-[10px] uppercase tracking-[0.25em] text-white/60">
        Boleta de venta · {con ? "ejemplo educativo" : "no emitida"}
      </p>
      <p className="mt-1 text-xs text-white/60">Bodega y Repuestos La Familia (negocio ficticio)</p>
      <div className="mt-3 flex flex-col gap-1 text-xs">
        {lineas.map((l) => (
          <div key={l.n} className="flex justify-between gap-4">
            <span>
              {l.c} × {l.n}
            </span>
            <span>{soles(l.c * l.p)}</span>
          </div>
        ))}
      </div>
      {con && (
        <div className="mt-3 border-t border-white/15 pt-2 text-xs text-white/70">
          <div className="flex justify-between">
            <span>Valor de venta</span>
            <span>{soles(base)}</span>
          </div>
          <div className="flex justify-between">
            <span>IGV 18% (incluye IPM)</span>
            <span>{soles(igv)}</span>
          </div>
        </div>
      )}
      <div className="mt-2 flex justify-between border-t border-white/15 pt-2 text-sm font-semibold text-white">
        <span>Total pagado</span>
        <span>{soles(total)}</span>
      </div>
    </div>
  );
}

export default function Tienda({ alTerminar }: { alTerminar: () => void }) {
  const saldo = useSoles();
  const articulos = ARTICULOS.filter((a) => a.id !== "defensa" || !estado.defensa);
  const [cant, setCant] = useState<Record<string, number>>({ defensa: 0, kit: 0, botiquin: 0 });
  const [paso, setPaso] = useState<"elegir" | "pagar" | "listo">("elegir");
  const [con, setCon] = useState(true);
  const [pagado, setPagado] = useState(0);

  const total = useMemo(
    () => articulos.reduce((t, a) => t + a.precio * (cant[a.id] ?? 0), 0),
    [cant],
  );
  const lineas = articulos.filter((a) => (cant[a.id] ?? 0) > 0).map((a) => ({
    n: a.nombre,
    c: cant[a.id],
    p: a.precio,
  }));
  const descuento = Math.round(total * 0.1 * 100) / 100;

  const cambiar = (a: Articulo, d: number) => {
    const nuevo = (cant[a.id] ?? 0) + d;
    if (nuevo < 0 || nuevo > a.max) return;
    if (d > 0 && total + a.precio > saldo) return;
    setCant({ ...cant, [a.id]: nuevo });
  };

  const pagar = (conComprobante: boolean) => {
    const monto = conComprobante ? total : total - descuento;
    setCon(conComprobante);
    setPagado(monto);
    registrarCompra("Garaje de la familia", monto, conComprobante, conComprobante ? -5 : 10);
    equipar(cant.defensa > 0, cant.kit, cant.botiquin);
    setPaso("listo");
  };

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if ((e.code === "Space" || e.code === "Enter") && paso === "listo") {
        e.preventDefault();
        alTerminar();
      }
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [paso, alTerminar]);

  return (
    <div className="absolute inset-0 z-20 flex items-end justify-center overflow-y-auto px-4 pb-6 pt-16 sm:items-center">
      <div
        className="w-full max-w-3xl rounded-2xl border border-white/10 p-5 backdrop-blur-md sm:p-7"
        style={{ background: "rgba(6,10,20,0.9)" }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em]" style={{ color: "#5eead4", fontFamily: JET }}>
              Antes de salir
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-white" style={{ fontFamily: "var(--font-unbounded)" }}>
              Garaje de la familia
            </h2>
          </div>
          <div
            className="rounded-full border border-white/15 bg-black/40 px-4 py-2 text-xs text-white"
            style={{ fontFamily: JET }}
          >
            <span className="text-white/60">CAPITAL </span>
            <span style={{ color: "#fbbf24" }}>{soles(saldo)}</span>
          </div>
        </div>

        {paso === "elegir" && (
          <>
            <p className="mt-4 text-base text-white/80" style={{ fontFamily: BRIC }}>
              Tienes {soles(CAPITAL)} para equipar tu mototaxi. No alcanza para todo: lo que no gastes
              llega contigo a la ruta como Caja.
            </p>
            <div className="mt-3">
              <Saber id="reglamento" titulo="Reglamento del conductor de vehículo menor" bono={10}>
                {REGLAS.map((r, i) => (
                  <p key={i}>
                    <b>
                      {i + 1}. {r.titulo}
                    </b>{" "}
                    {r.texto}
                  </p>
                ))}
                <p className="text-[11px] text-white/40">{NOTA_REGLAMENTO}</p>
              </Saber>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {articulos.map((a) => {
                const c = cant[a.id] ?? 0;
                return (
                  <div
                    key={a.id}
                    className="flex flex-col justify-between rounded-xl border border-white/10 bg-white/5 p-4"
                    style={{ borderColor: c > 0 ? "#ff7a3d" : undefined }}
                  >
                    <div>
                      <p className="text-base font-semibold text-white" style={{ fontFamily: BRIC }}>
                        {a.nombre}
                      </p>
                      <p className="mt-1 text-sm text-white/70" style={{ fontFamily: BRIC }}>
                        {a.desc}
                      </p>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-sm" style={{ color: "#fbbf24", fontFamily: JET }}>
                        {soles(a.precio)}
                      </span>
                      <div className="flex items-center gap-2" style={{ fontFamily: JET }}>
                        <button
                          type="button"
                          onClick={() => cambiar(a, -1)}
                          className="h-8 w-8 rounded-md border border-white/20 text-white hover:border-[#ff7a3d]"
                        >
                          −
                        </button>
                        <span className="w-4 text-center text-sm text-white">{c}</span>
                        <button
                          type="button"
                          onClick={() => cambiar(a, 1)}
                          className="h-8 w-8 rounded-md border border-white/20 text-white hover:border-[#ff7a3d]"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <span className="text-sm text-white/80" style={{ fontFamily: JET }}>
                Total: <span style={{ color: "#fbbf24" }}>{soles(total)}</span>
              </span>
              <button
                type="button"
                onClick={() => (total > 0 ? setPaso("pagar") : alTerminar())}
                className="rounded-full px-6 py-3 text-[11px] uppercase tracking-[0.25em] transition hover:brightness-110"
                style={{ background: "#ff7a3d", color: "#1a0d05", fontFamily: JET }}
              >
                {total > 0 ? "Ir a pagar" : "Salir sin comprar"}
              </button>
            </div>
          </>
        )}

        {paso === "pagar" && (
          <>
            <div className="mt-5 flex items-center gap-3">
              <span
                className="flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold"
                style={{ background: "#1f3a5f", color: "#d9ff3f", fontFamily: JET }}
              >
                DR
              </span>
              <p className="text-[11px] uppercase tracking-[0.25em] text-white" style={{ fontFamily: JET }}>
                Doña Rosa · Bodega y repuestos
              </p>
            </div>
            <p className="mt-3 text-lg leading-relaxed text-white" style={{ fontFamily: BRIC }}>
              Son {soles(total)}, mijo. ¿Le hago su boleta? Si no, le dejo {soles(total - descuento)}.
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => pagar(true)}
                className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-white transition hover:border-[#ff7a3d]"
                style={{ fontFamily: BRIC }}
              >
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold" style={{ background: "#ff7a3d", color: "#1a0d05", fontFamily: JET }}>1</span>
                <span className="text-base">Sí, con boleta, por favor. Pago {soles(total)}.</span>
              </button>
              <button
                type="button"
                onClick={() => pagar(false)}
                className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-white transition hover:border-[#ff7a3d]"
                style={{ fontFamily: BRIC }}
              >
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold" style={{ background: "#ff7a3d", color: "#1a0d05", fontFamily: JET }}>2</span>
                <span className="text-base">Sin boleta, mejor. Pago {soles(total - descuento)}.</span>
              </button>
            </div>
            <button
              type="button"
              onClick={() => setPaso("elegir")}
              className="mt-4 text-[11px] uppercase tracking-[0.25em] text-white/60 hover:text-white"
              style={{ fontFamily: JET }}
            >
              ← Volver a elegir
            </button>
          </>
        )}

        {paso === "listo" && (
          <>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Boleta lineas={lineas} total={pagado} con={con} />
              <div
                className="rounded-xl border px-4 py-3"
                style={{ borderColor: "rgba(94,234,212,0.3)", background: "rgba(94,234,212,0.06)" }}
              >
                <p className="text-[10px] uppercase tracking-[0.25em]" style={{ color: "#5eead4", fontFamily: JET }}>
                  Lo que debes saber
                </p>
                <p className="mt-2 text-base leading-snug text-white/90" style={{ fontFamily: BRIC }}>
                  {con
                    ? "Pediste tu comprobante: ahora puedes demostrar lo que compraste. El IGV (18%, que incluye el IPM) normalmente ya viene dentro del precio y lo asume quien consume."
                    : "Ahorraste hoy, pero sin comprobante es más difícil probar tu compra o hacer un reclamo. Y el impuesto que no se declara deja de financiar servicios públicos."}
                </p>
                <p className="mt-3 text-[11px] text-white/40" style={{ fontFamily: BRIC }}>
                  Los montos y negocios del juego son un ejemplo. Esta boleta no es un comprobante válido.
                </p>
              </div>
            </div>
            <div className="mt-4">
              <Saber id="igv" titulo="¿Por qué se paga IGV?" bono={10}>
                <p>
                  El IGV es un impuesto que se paga cuando compras. No se suma aparte: ya viene
                  dentro del precio.
                </p>
                <p>
                  En tu compra de {soles(total)}: producto {soles(total / 1.18)} + IGV{" "}
                  {soles(total - total / 1.18)}.
                </p>
                <p>
                  La tasa total es 18%. En 2026 son 15.5% de IGV y 2.5% del Impuesto de Promoción
                  Municipal.
                </p>
                <p>
                  La bodega no se queda con ese dinero: lo entrega a SUNAT. Pero primero resta el IGV
                  que ella misma pagó en sus compras. Ejemplo: vendió S/ 1,000 (IGV S/ 180) y compró
                  S/ 500 (IGV S/ 90), así que entrega S/ 90.
                </p>
                <p>
                  Tú eres el consumidor final: no puedes restar nada, por eso el IGV se nota en el
                  precio que pagas.
                </p>
                <p>
                  ¿Y para qué sirve? Los tributos pagan el funcionamiento del Estado y los bienes y
                  servicios públicos que usamos entre todos. Sin tributos, el Estado no podría
                  funcionar.
                </p>
                <p className="text-[11px] text-white/40">
                  Fuente: SUNAT (tasa vigente en 2026). Las tasas pueden cambiar.
                </p>
              </Saber>
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <span className="text-sm text-white/80" style={{ fontFamily: JET }}>
                Te quedan: <span style={{ color: "#fbbf24" }}>{soles(saldo)}</span>
              </span>
              <button
                type="button"
                onClick={alTerminar}
                className="rounded-full px-6 py-3 text-[11px] uppercase tracking-[0.25em] transition hover:brightness-110"
                style={{ background: "#ff7a3d", color: "#1a0d05", fontFamily: JET }}
              >
                Salir a la ruta · Espacio
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
