"use client";

import { useProgreso } from "@/lib/semana";
import { CATALOGO, MEJORAS, esTuyo, type Item } from "@/lib/tienda";
import type { Perfil } from "@/lib/perfil";

const ETIQUETA = "font-mono text-[11px] uppercase tracking-[0.24em] text-tenue";

type Props = {
  perfil: Perfil;
  alCambiar: (p: Perfil) => void;
  alVolver: () => void;
  alIrTienda: () => void;
};

/* Todo lo que tienes: lo básico (gratis) y lo que compraste. Tocar una cosa te la pone. */
export default function InventarioMenu({ perfil, alCambiar, alVolver, alIrTienda }: Props) {
  const prog = useProgreso();
  const compradas = prog.compras.filter((id) => CATALOGO.some((i) => i.id === id));
  const vacio = compradas.length === 0;
  const tuyos = (tipo: (i: Item) => boolean) => CATALOGO.filter((i) => tipo(i) && esTuyo(i, prog.compras));

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
          puesto ? "border-menta/50 text-white" : "border-white/10 text-tenue hover:border-white/30 hover:text-white"
        }`}
      >
        <span className="relative block aspect-square w-full bg-gradient-to-b from-white/[0.06] to-transparent">
          {i.imagen && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={i.imagen} alt={i.nombre} loading="lazy" draggable={false} className="absolute inset-0 h-full w-full object-contain" />
          )}
        </span>
        <span className="px-1 leading-tight">{i.nombre}</span>
        <span className="font-mono text-[10px] tracking-[0.1em]" style={{ color: puesto ? "#5eead4" : comprado ? "#fbbf24" : "#8b93b8" }}>
          {puesto ? "PUESTO ✓" : comprado ? "COMPRADO · PONER" : "BÁSICO · PONER"}
        </span>
      </button>
    );
  };

  const grupo = (titulo: string, items: Item[]) =>
    items.length === 0 ? null : (
      <div key={titulo}>
        <p className={ETIQUETA}>{titulo}</p>
        <div className="mt-2 grid grid-cols-3 gap-2">{items.map(tarjeta)}</div>
      </div>
    );

  const mejoras = MEJORAS.filter((m) => prog.compras.includes(m.id));

  return (
    <div className="anim-subir flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <button type="button" onClick={alVolver} className="font-mono text-[11px] uppercase tracking-[0.2em] text-tenue transition hover:text-white">
          ← Volver
        </button>
        <button type="button" onClick={alIrTienda} className="font-mono text-[11px] uppercase tracking-[0.2em] transition hover:text-white" style={{ color: "#fbbf24" }}>
          Ir a la tienda →
        </button>
      </div>
      <div>
        <h2 className="font-display text-4xl font-bold leading-none tracking-tight">Inventario</h2>
        <p className="mt-2 text-[13px] leading-relaxed text-tenue">
          {vacio ? "Aquí verás todo lo que compres. Toca algo para ponértelo." : `Tienes ${compradas.length} ${compradas.length === 1 ? "cosa comprada" : "cosas compradas"}. Toca algo para ponértelo.`}
        </p>
      </div>

      {vacio && (
        <div className="rounded-xl border border-dashed border-white/15 p-4 text-center">
          <p className="text-sm font-semibold text-white">Todavía no compraste nada</p>
          <p className="mt-1 text-[12px] leading-relaxed text-tenue">
            Termina un día de ruta para ganar dinero y gástalo en la tienda: colores para tu mototaxi, cascos, lentes y mejoras que ayudan a jugar.
          </p>
          <button
            type="button"
            onClick={alIrTienda}
            className="mt-3 rounded-xl bg-[#fbbf24] px-5 py-2.5 text-sm font-semibold text-[#1a1205] transition hover:brightness-110 active:scale-[0.98]"
          >
            Ver la tienda
          </button>
        </div>
      )}

      {grupo("Mototaxi · color", tuyos((i) => i.tipo === "color"))}
      {grupo("Personaje · casco", tuyos((i) => i.tipo === "casco"))}
      {grupo("Personaje · lentes", tuyos((i) => i.tipo === "lentes"))}
      {grupo("Personaje · barba", tuyos((i) => i.tipo === "barba"))}

      <div>
        <p className={ETIQUETA}>Mejoras para jugar</p>
        {mejoras.length === 0 ? (
          <p className="mt-2 rounded-xl border border-white/10 px-4 py-3 text-[12px] text-tenue">Ninguna todavía.</p>
        ) : (
          <div className="mt-2 flex flex-col gap-2">
            {mejoras.map((m) => (
              <div key={m.id} className="rounded-xl border border-menta/40 px-4 py-3">
                <p className="text-sm font-semibold text-white">{m.nombre} ✓</p>
                <p className="mt-0.5 text-[12px] leading-relaxed text-tenue">{m.detalle}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
