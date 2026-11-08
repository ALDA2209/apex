"use client";

import { useEffect, useState } from "react";
import { useProgreso } from "@/lib/semana";
import { CATALOGO, MEJORAS, esTuyo, imagenDe, nombreDe, type Grupo, type Item } from "@/lib/tienda";
import type { Perfil } from "@/lib/perfil";

const ETIQUETA = "font-mono text-[11px] uppercase tracking-[0.24em] text-tenue";
const PESTANAS: { id: Grupo; nombre: string }[] = [
  { id: "moto", nombre: "Mototaxi" },
  { id: "cabeza", nombre: "Personaje" },
  { id: "mejora", nombre: "Mejoras" },
];

type Props = {
  perfil: Perfil;
  alCambiar: (p: Perfil) => void;
  alCerrar: () => void;
  alIrTienda: () => void;
};

/* Ventana de inventario: todo lo que tienes (lo básico y lo que compraste). Tocar una cosa te la pone. */
export default function InventarioMenu({ perfil, alCambiar, alCerrar, alIrTienda }: Props) {
  const prog = useProgreso();
  const [pestana, setPestana] = useState<Grupo>("moto");

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") alCerrar();
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [alCerrar]);

  const compradas = prog.compras.filter((id) => CATALOGO.some((i) => i.id === id));
  const vacio = compradas.length === 0;
  const cuenta = (g: Grupo) => compradas.filter((id) => CATALOGO.find((i) => i.id === id)?.grupo === g).length;
  const tuyos = (g: Grupo) => CATALOGO.filter((i) => i.grupo === g && esTuyo(i, prog.compras));
  const mejoras = MEJORAS.filter((m) => prog.compras.includes(m.id));

  const tarjeta = (i: Item) => {
    const puesto = !!i.puesto?.(perfil);
    const comprado = i.precio > 0;
    return (
      <button
        key={i.id}
        type="button"
        disabled={puesto}
        onClick={() => i.poner && alCambiar(i.poner(perfil))}
        className={`flex flex-col items-center gap-1 overflow-hidden rounded-xl border pb-2 text-sm transition disabled:cursor-default ${
          puesto ? "border-menta/60 bg-menta/[0.06] text-white" : "border-white/10 text-tenue hover:border-white/35 hover:text-white"
        }`}
      >
        <span className="relative block aspect-square w-full bg-gradient-to-b from-white/[0.06] to-transparent">
          {i.imagen && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imagenDe(i.imagen, perfil.genero)} alt={nombreDe(i, perfil.genero)} loading="lazy" draggable={false} className="absolute inset-0 h-full w-full object-contain" />
          )}
        </span>
        <span className="px-1 leading-tight">{nombreDe(i, perfil.genero)}</span>
        <span className="font-mono text-[10px] tracking-[0.1em]" style={{ color: puesto ? "#5eead4" : comprado ? "#fbbf24" : "#8b93b8" }}>
          {puesto ? "PUESTO ✓" : comprado ? "COMPRADO · PONER" : "BÁSICO · PONER"}
        </span>
      </button>
    );
  };

  const grupo = (titulo: string, items: Item[]) => (
    <div key={titulo}>
      <p className={ETIQUETA}>{titulo}</p>
      <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4 [@media(max-height:480px)]:grid-cols-6">{items.map(tarjeta)}</div>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/55 sm:items-center sm:p-6 md:justify-start md:bg-black/35 md:pl-12"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) alCerrar();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Inventario"
        className="anim-subir flex max-h-[88vh] w-full max-w-xl [@media(max-height:480px)]:max-h-[96vh] [@media(max-height:480px)]:max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-white/15 bg-[#0c1229]/95 shadow-2xl backdrop-blur-xl sm:rounded-3xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-white/10 px-5 py-4 [@media(max-height:480px)]:py-2">
          <div>
            <h2 className="font-display text-2xl font-bold leading-none tracking-tight [@media(max-height:480px)]:text-xl">Inventario</h2>
            <p className="mt-1.5 text-[12px] text-tenue [@media(max-height:480px)]:hidden">
              {vacio ? "Aquí verás todo lo que compres." : `${compradas.length} ${compradas.length === 1 ? "cosa comprada" : "cosas compradas"} · toca una para ponértela`}
            </p>
          </div>
          <button
            type="button"
            onClick={alCerrar}
            aria-label="Cerrar inventario"
            className="grid h-9 w-9 shrink-0 [@media(max-height:480px)]:h-8 [@media(max-height:480px)]:w-8 place-items-center rounded-full border border-white/15 text-tenue transition hover:border-white/40 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-3 gap-1.5 px-5 pt-4 [@media(max-height:480px)]:pt-2" role="tablist">
          {PESTANAS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={pestana === t.id}
              onClick={() => setPestana(t.id)}
              className={`whitespace-nowrap rounded-xl border px-1 py-2.5 font-mono text-[10px] uppercase tracking-[0.06em] transition sm:px-2 sm:text-[11px] sm:tracking-[0.12em] [@media(max-height:480px)]:py-1.5 ${
                pestana === t.id ? "border-acento bg-acento/15 text-white" : "border-white/10 text-tenue hover:border-white/30 hover:text-white"
              }`}
            >
              {t.nombre} <span className="text-tenue/70">{cuenta(t.id)}</span>
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-5 overflow-y-auto px-5 py-4 [@media(max-height:480px)]:gap-3 [@media(max-height:480px)]:py-2">
          {vacio && (
            <div className="rounded-xl border border-dashed border-white/15 p-4 text-center">
              <p className="text-sm font-semibold text-white">Todavía no compraste nada</p>
              <p className="mt-1 text-[12px] leading-relaxed text-tenue">
                Termina un día de ruta para ganar dinero y gástalo en la tienda: colores para tu mototaxi, cascos, lentes y mejoras que ayudan a jugar.
              </p>
            </div>
          )}

          {pestana === "moto" && grupo("Color del mototaxi", tuyos("moto"))}

          {pestana === "cabeza" && (
            <>
              {grupo("Casco", tuyos("cabeza").filter((i) => i.tipo === "casco"))}
              {grupo("Lentes", tuyos("cabeza").filter((i) => i.tipo === "lentes"))}
              {perfil.genero !== "ella" && grupo("Barba", tuyos("cabeza").filter((i) => i.tipo === "barba"))}
              {perfil.genero === "ella" && grupo("Joyas", tuyos("cabeza").filter((i) => i.tipo === "joya"))}
            </>
          )}

          {pestana === "mejora" &&
            (mejoras.length === 0 ? (
              <p className="rounded-xl border border-white/10 px-4 py-3 text-[12px] text-tenue">Ninguna mejora todavía. Las mejoras ayudan a jugar y valen todos los días.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {mejoras.map((m) => (
                  <div key={m.id} className="rounded-xl border border-menta/40 px-4 py-3">
                    <p className="text-sm font-semibold text-white">{m.nombre} ✓</p>
                    <p className="mt-0.5 text-[12px] leading-relaxed text-tenue">{m.detalle}</p>
                  </div>
                ))}
              </div>
            ))}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-white/10 px-5 py-3 [@media(max-height:480px)]:py-1.5">
          <button type="button" onClick={alIrTienda} className="font-mono text-[11px] uppercase tracking-[0.18em] transition hover:text-white" style={{ color: "#fbbf24" }}>
            Ir a la tienda →
          </button>
          <button type="button" onClick={alCerrar} className="rounded-xl bg-acento px-5 py-2 text-sm font-semibold text-[#1a0d05] transition hover:brightness-110 active:scale-[0.98]">
            Listo
          </button>
        </div>
      </div>
    </div>
  );
}
