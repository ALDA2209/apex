"use client";

import { useTactil } from "@/components/Tactil";
import { estado, useApie, useCerca, useCliente, useDentro, useObjetivo } from "@/lib/estado";

const JET = "var(--font-jetbrains)";

function Tecla({ t }: { t: string }) {
  return (
    <span
      className="flex h-8 min-w-8 items-center justify-center rounded-md border border-white/20 bg-white/10 px-2 text-xs font-bold text-white"
      style={{ fontFamily: JET }}
    >
      {t}
    </span>
  );
}

export default function Objetivo() {
  const apie = useApie();
  const dentro = useDentro();
  const objetivo = useObjetivo();
  const tactil = useTactil();
  const cerca = useCerca();
  const cliente = useCliente();
  if (!apie || dentro) return null;

  const enRuta = estado.fase !== "libre";
  const texto =
    objetivo === "bodega"
      ? "Entra a la bodega a equipar tu mototaxi"
      : objetivo === "local"
        ? estado.entregaActiva
          ? cliente === "llamando"
            ? "«¡Buenas! ¿Hay alguien? ¡Traigo su pedido!»"
            : cliente === "sale"
              ? "Ya viene a atenderte…"
              : `Camina hasta la puerta de ${estado.lugar} y llama al cliente`
          : `Camina hasta ${estado.lugar} y entra`
        : objetivo === "oficial"
          ? `Camina hasta ${estado.lugar} y habla con él`
          : objetivo === "volver"
            ? enRuta
              ? estado.tipoLugar === "servicio"
                ? "Sube a tu mototaxi para seguir, o vuelve a entrar si falta algo"
                : "Vuelve a tu mototaxi y sube para seguir la ruta"
              : "Sube a tu mototaxi para salir, o vuelve a la bodega a comprar más"
            : "";
  const accion =
    cerca === "bodega" && estado.entregaActiva && cliente !== ""
      ? ""
      : cerca === "bodega"
      ? estado.tipoLugar === "servicio"
        ? estado.puerta
        : "Entrar a la bodega"
      : cerca === "oficial"
        ? estado.puerta
        : cerca === "moto"
          ? "Subir al mototaxi"
          : "";

  return (
    <>
      <div
        className="absolute left-1/2 top-[4.6rem] z-10 -translate-x-1/2 rounded-full border border-white/10 bg-black/45 px-5 py-2 backdrop-blur"
        style={{ fontFamily: JET }}
      >
        <span className="text-[10px] uppercase tracking-[0.3em]" style={{ color: "#5eead4" }}>
          Objetivo
        </span>
        <span className="ml-3 text-xs text-white">{texto}</span>
      </div>

      {accion && !tactil && (
        <div className="absolute inset-x-0 bottom-24 z-20 flex justify-center px-4">
          <button
            type="button"
            onClick={() => estado.hacerAccion?.()}
            className="flex items-center gap-4 rounded-full border border-white/15 bg-black/60 px-6 py-3 text-white backdrop-blur transition hover:border-[#ff7a3d]"
            style={{ fontFamily: JET }}
          >
            <span
              className="flex h-8 w-8 items-center justify-center rounded-md text-sm font-bold"
              style={{ background: "#ff7a3d", color: "#1a0d05" }}
            >
              E
            </span>
            <span className="text-[11px] uppercase tracking-[0.25em]">{accion}</span>
          </button>
        </div>
      )}

      {!tactil && (
      <div className="pointer-events-none absolute inset-x-0 bottom-5 z-10 flex justify-center px-4">
        <div className="flex items-center gap-3 rounded-full border border-white/10 bg-black/45 px-5 py-3 backdrop-blur">
          <div className="flex gap-1">
            <Tecla t="W" />
            <Tecla t="A" />
            <Tecla t="S" />
            <Tecla t="D" />
          </div>
          <span className="text-[10px] uppercase tracking-[0.22em] text-white/70" style={{ fontFamily: JET }}>
            Caminar
          </span>
          <Tecla t="Mouse" />
          <span className="text-[10px] uppercase tracking-[0.22em] text-white/70" style={{ fontFamily: JET }}>
            Arrastrar · mirar
          </span>
        </div>
      </div>
      )}
    </>
  );
}
