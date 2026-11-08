"use client";

import { useState } from "react";
import { comprar, useProgreso } from "@/lib/semana";
import { CATALOGO, MEJORAS, esTuyo, type Grupo, type Item } from "@/lib/tienda";
import type { Perfil } from "@/lib/perfil";

const ETIQUETA = "font-mono text-[11px] uppercase tracking-[0.24em] text-tenue";
const PESTANAS: { id: Grupo; nombre: string }[] = [
  { id: "moto", nombre: "Mototaxi" },
  { id: "cabeza", nombre: "Personaje" },
  { id: "mejora", nombre: "Mejoras" },
];
const GRUPOS_CABEZA = [
  { tipo: "casco", titulo: "Casco" },
  { tipo: "lentes", titulo: "Lentes" },
  { tipo: "barba", titulo: "Barba" },
];

type Props = {
  perfil: Perfil;
  alCambiar: (p: Perfil) => void;
  /** vista previa en el modelo 3D (null = quitar la vista previa) */
  alProbar: (p: Perfil | null) => void;
  alVolver: () => void;
};

export default function TiendaMenu({ perfil, alCambiar, alProbar, alVolver }: Props) {
  const prog = useProgreso();
  const [pestana, setPestana] = useState<Grupo>("moto");
  const [sel, setSel] = useState<Item | null>(null);
  const [libre, setLibre] = useState("#ff7a3d");
  const [aviso, setAviso] = useState("");

  const tuyo = (i: Item) => esTuyo(i, prog.compras);
  const puesto = (i: Item) => !!i.puesto?.(perfil);
  const aplicar = (i: Item, color = libre): Perfil => (i.id === "color:libre" ? { ...perfil, color } : (i.poner?.(perfil) ?? perfil));

  const elegir = (i: Item) => {
    setSel(i);
    setAviso("");
    if (i.grupo !== "mejora") alProbar(aplicar(i));
  };

  const cambiarPestana = (g: Grupo) => {
    setPestana(g);
    setSel(null);
    setAviso("");
    alProbar(null);
  };

  const volver = () => {
    alProbar(null);
    alVolver();
  };

  const comprarItem = (i: Item) => {
    if (!comprar(i.id, i.precio)) {
      setAviso(`Te faltan S/ ${Math.max(0, i.precio - prog.dinero)} para comprar esto.`);
      return false;
    }
    setAviso(`Compraste ${i.nombre}.`);
    return true;
  };

  const ponerse = (i: Item) => {
    alCambiar(aplicar(i));
    alProbar(null);
  };

  const accion = () => {
    if (!sel || sel.grupo === "mejora") return null;
    const mio = tuyo(sel);
    const ya = puesto(sel) && (sel.id !== "color:libre" || perfil.color === libre);
    const falta = sel.precio - prog.dinero;
    return (
      <div className="sticky bottom-0 -mx-5 mt-2 border-t border-white/10 bg-[#0c1229]/95 px-5 py-3 backdrop-blur sm:-mx-7 sm:px-7 md:-mx-14 md:px-14">
        <div className="flex items-center gap-3">
          {sel.id === "color:libre" && (
            <label className="relative h-10 w-10 shrink-0 cursor-pointer rounded-full ring-2 ring-white/70" style={{ background: libre }} title="Elegir color">
              <input
                type="color"
                value={libre}
                aria-label="Elegir color"
                onChange={(e) => {
                  setLibre(e.target.value);
                  alProbar(aplicar(sel, e.target.value));
                }}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
            </label>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{sel.nombre}</p>
            <p className="text-[11px] text-tenue">
              {ya ? "Lo llevas puesto" : mio ? "Ya es tuyo" : falta > 0 ? `Te faltan S/ ${falta}` : `Cuesta S/ ${sel.precio}`}
            </p>
          </div>
          {ya ? (
            <span className="rounded-xl border border-menta/40 px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.18em] text-menta">Equipado ✓</span>
          ) : mio ? (
            <button type="button" onClick={() => ponerse(sel)} className="rounded-xl bg-acento px-5 py-2.5 text-sm font-semibold text-[#1a0d05] transition hover:brightness-110 active:scale-[0.98]">
              Equipar
            </button>
          ) : (
            <button
              type="button"
              disabled={falta > 0}
              onClick={() => {
                if (comprarItem(sel)) ponerse(sel);
              }}
              className="rounded-xl bg-[#fbbf24] px-5 py-2.5 text-sm font-semibold text-[#1a1205] transition enabled:hover:brightness-110 enabled:active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Comprar · S/ {sel.precio}
            </button>
          )}
        </div>
      </div>
    );
  };

  /* Tarjeta con la foto del objeto: el mototaxi con ese color, o la cabeza con ese accesorio. */
  const boton = (i: Item) => {
    const activo = sel?.id === i.id;
    const mio = tuyo(i);
    return (
      <button
        key={i.id}
        type="button"
        onClick={() => elegir(i)}
        aria-pressed={activo}
        className={`flex flex-col items-center gap-1 overflow-hidden rounded-xl border pb-2 text-sm transition ${
          activo ? "border-acento bg-acento/15 text-white" : puesto(i) ? "border-menta/40 text-white" : "border-white/10 text-tenue hover:border-white/30 hover:text-white"
        }`}
      >
        <span className="relative block aspect-square w-full bg-gradient-to-b from-white/[0.06] to-transparent">
          {i.imagen && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={i.imagen} alt={i.nombre} loading="lazy" draggable={false} className="absolute inset-0 h-full w-full object-contain" />
          )}
          {i.id === "color:libre" && (
            <span className="absolute right-1.5 top-1.5 h-4 w-4 rounded-full ring-1 ring-white/50" style={{ background: puesto(i) ? perfil.color : "conic-gradient(red, yellow, lime, aqua, blue, magenta, red)" }} />
          )}
        </span>
        <span className="px-1 leading-tight">{i.nombre}</span>
        <span className="font-mono text-[10px] tracking-[0.1em]" style={{ color: mio || puesto(i) ? "#5eead4" : "#fbbf24" }}>
          {puesto(i) ? "PUESTO ✓" : mio ? "TUYO" : `S/ ${i.precio}`}
        </span>
      </button>
    );
  };

  return (
    <div className="anim-subir flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <button type="button" onClick={volver} className="font-mono text-[11px] uppercase tracking-[0.2em] text-tenue transition hover:text-white">
          ← Volver
        </button>
        <p className="text-lg font-semibold" style={{ color: "#fbbf24" }}>
          S/ {prog.dinero}
        </p>
      </div>
      <div>
        <h2 className="font-display text-4xl font-bold leading-none tracking-tight">Tienda</h2>
        <p className="mt-2 text-[13px] leading-relaxed text-tenue">Gasta lo que ganas en tus rutas. Toca algo para verlo en tu mototaxi o en tu personaje antes de comprarlo.</p>
      </div>

      <div className="grid grid-cols-3 gap-1.5" role="tablist">
        {PESTANAS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={pestana === t.id}
            onClick={() => cambiarPestana(t.id)}
            className={`rounded-xl border px-2 py-2.5 font-mono text-[11px] uppercase tracking-[0.14em] transition ${
              pestana === t.id ? "border-acento bg-acento/15 text-white" : "border-white/10 text-tenue hover:border-white/30 hover:text-white"
            }`}
          >
            {t.nombre}
          </button>
        ))}
      </div>

      {pestana === "moto" && (
        <div>
          <p className={ETIQUETA}>Color del mototaxi</p>
          <div className="mt-3 grid grid-cols-3 gap-2">{CATALOGO.filter((i) => i.tipo === "color").map(boton)}</div>
        </div>
      )}

      {pestana === "cabeza" &&
        GRUPOS_CABEZA.map((g) => (
          <div key={g.tipo}>
            <p className={ETIQUETA}>{g.titulo}</p>
            <div className="mt-2 grid grid-cols-3 gap-2">{CATALOGO.filter((i) => i.tipo === g.tipo).map(boton)}</div>
          </div>
        ))}

      {pestana === "mejora" && (
        <div className="flex flex-col gap-3">
          <p className="text-[12px] text-tenue">Ayudan a jugar. Las compras valen para todos los días.</p>
          {MEJORAS.map((m) => {
            const mio = tuyo(m);
            const falta = m.precio - prog.dinero;
            return (
              <div key={m.id} className={`rounded-xl border p-4 ${mio ? "border-menta/40" : "border-white/10"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">{m.nombre}</p>
                    <p className="mt-1 text-[12px] leading-relaxed text-tenue">{m.detalle}</p>
                  </div>
                  {mio ? (
                    <span className="shrink-0 font-mono text-[11px] uppercase tracking-[0.14em] text-menta">Tuya ✓</span>
                  ) : (
                    <button
                      type="button"
                      disabled={falta > 0}
                      onClick={() => comprarItem(m)}
                      className="shrink-0 rounded-xl bg-[#fbbf24] px-4 py-2 text-sm font-semibold text-[#1a1205] transition enabled:hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      S/ {m.precio}
                    </button>
                  )}
                </div>
                {!mio && falta > 0 && <p className="mt-2 text-[11px] text-tenue/70">Te faltan S/ {falta}</p>}
              </div>
            );
          })}
        </div>
      )}

      {aviso && (
        <p className="text-[12px]" style={{ color: aviso.startsWith("Te faltan") ? "#fb7185" : "#5eead4" }} role="status">
          {aviso}
        </p>
      )}
      {accion()}
      <p className="text-[10px] leading-relaxed text-tenue/50">Es un juego: el dinero y los precios son de ejemplo.</p>
    </div>
  );
}
