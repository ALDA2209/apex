"use client";

import { callar, hablar } from "@/lib/audio";
import { useCallback, useEffect, useMemo, useState } from "react";
import { estado, registrarVenta, salirDeTienda, useSoles, type Comprobante } from "@/lib/estado";
import type { Servicio } from "@/lib/ruta";

const JET = "var(--font-jetbrains)";
const BRIC = "var(--font-bricolage)";

type Paso = "pedido" | "comprobante" | "firma" | "listo";

type Resultado = {
  acierto: boolean;
  riesgo: number;
  extra: number;
  comprobante: Comprobante;
  respuesta: string;
  leccion: string;
};

const NOTA = "Información de ejemplo. Revisa las reglas vigentes en sunat.gob.pe.";

function evaluar(s: Servicio, eleccion: Comprobante): Resultado {
  const e = s.entrega!;
  const quiereFactura = e.quiere === "factura";
  if (eleccion === "boleta") {
    if (quiereFactura) {
      return {
        acierto: false,
        riesgo: 8,
        extra: 0,
        comprobante: "boleta",
        respuesta: `${e.cliente}: «Joven, con boleta no me sirve para mi contabilidad. Necesito factura con mi RUC.»`,
        leccion:
          "Cuando el cliente es una empresa con RUC y necesita sustentar su compra, se le emite factura con su RUC. Pregunta siempre qué comprobante necesita. " +
          NOTA,
      };
    }
    return {
      acierto: true,
      riesgo: -5,
      extra: 0,
      comprobante: "boleta",
      respuesta: `${e.cliente}: «Gracias, joven. Está bien así. Aquí tiene mi firma de conformidad.»`,
      leccion:
        "Quien vende debe entregar comprobante de pago aunque el cliente no lo pida. A un consumidor final se le entrega boleta de venta. " + NOTA,
    };
  }
  if (eleccion === "factura") {
    if (quiereFactura) {
      return {
        acierto: true,
        riesgo: -5,
        extra: 0,
        comprobante: "factura",
        respuesta: `${e.cliente}: «Perfecto, con mi RUC ${e.ruc}. Gracias. Firmo la conformidad.»`,
        leccion:
          "La factura se emite a quien tiene RUC y la necesita para su negocio. Lleva los datos del cliente, así que verifica su RUC. " + NOTA,
      };
    }
    return {
      acierto: false,
      riesgo: 5,
      extra: 0,
      comprobante: "factura",
      respuesta: `${e.cliente}: «Joven, yo no tengo RUC. Una boleta bastaba.»`,
      leccion:
        "Para emitir factura necesitas el RUC del cliente. Si no lo tiene, corresponde una boleta de venta. " + NOTA,
    };
  }
  // sin comprobante
  const tentacion = e.quiere === "sin" ? e.extra : 0;
  return {
    acierto: false,
    riesgo: 15 + (tentacion > 0 ? 5 : 0),
    extra: tentacion,
    comprobante: "ninguno",
    respuesta:
      tentacion > 0
        ? `${e.cliente}: «¡Así me gusta! Aquí van S/ ${tentacion} más.» Pero esa venta queda sin sustento.`
        : `${e.cliente}: «Joven, ¿y mi comprobante?» Esa venta queda sin sustento.`,
    leccion:
      "Vender sin entregar comprobante te deja sin sustento y puede traer sanciones. Ese dinero extra no compensa el riesgo. " + NOTA,
  };
}

const NOMBRE: Record<Comprobante, string> = {
  boleta: "Boleta de venta",
  factura: "Factura",
  ninguno: "Sin comprobante",
};

export default function Entrega({ s }: { s: Servicio }) {
  const e = s.entrega!;
  const saldo = useSoles();
  const [paso, setPaso] = useState<Paso>("pedido");
  const [res, setRes] = useState<Resultado | null>(null);
  const [dibuja, setDibuja] = useState(false);
  const serie = useMemo(() => 100 + estado.entregas.length * 37 + Math.round(e.monto), [e.monto]);

  const elegir = useCallback(
    (c: Comprobante) => {
      if (paso !== "comprobante") return;
      const r = evaluar(s, c);
      registrarVenta(s.nombre, e.monto, c, r.acierto, r.riesgo, r.extra);
      setRes(r);
      setPaso("firma");
    },
    [paso, s, e.monto],
  );

  const textoVoz =
    paso === "pedido" ? e.frase : (paso === "firma" || paso === "listo") && res ? res.respuesta.replace(/^[^:]*:\s*/, "") : "";
  useEffect(() => {
    if (textoVoz) hablar(textoVoz, "cliente");
    return () => callar();
  }, [textoVoz]);

  useEffect(() => {
    if (paso !== "firma") return;
    const a = setTimeout(() => setDibuja(true), 60);
    const b = setTimeout(() => setPaso("listo"), 2200);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
    };
  }, [paso]);

  useEffect(() => {
    const tecla = (ev: KeyboardEvent) => {
      if (paso === "pedido" && (ev.code === "Space" || ev.code === "Enter")) {
        ev.preventDefault();
        setPaso("comprobante");
      } else if (paso === "comprobante") {
        if (ev.key === "1") elegir("boleta");
        if (ev.key === "2") elegir("factura");
        if (ev.key === "3") elegir("ninguno");
      } else if (paso === "listo" && (ev.code === "Space" || ev.code === "Enter")) {
        ev.preventDefault();
        salirDeTienda();
      }
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [paso, elegir]);

  const caja = "w-full max-w-3xl rounded-2xl border border-white/10 p-4 backdrop-blur-md sm:p-5";
  const opciones: { c: Comprobante; titulo: string; sub: string }[] = [
    { c: "boleta", titulo: "Boleta de venta", sub: "Para consumidor final" },
    { c: "factura", titulo: "Factura", sub: "Para clientes con RUC" },
    {
      c: "ninguno",
      titulo: "Sin comprobante",
      sub: e.quiere === "sin" && e.extra > 0 ? `Te paga S/ ${e.extra} más` : "No entregar nada",
    },
  ];

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex justify-center p-3 sm:p-4">
      <div className={`${caja} pointer-events-auto max-h-[62vh] overflow-y-auto`} style={{ background: "rgba(6,10,20,0.92)" }}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em]" style={{ color: "#5eead4", fontFamily: JET }}>
              {s.titulo} · {s.nombre}
            </p>
            <p className="mt-1 text-base leading-snug text-white sm:text-lg" style={{ fontFamily: BRIC }}>
              {paso === "pedido" && `${e.cliente}: «${e.frase}»`}
              {paso === "comprobante" && "¿Qué comprobante le entregas?"}
              {paso === "firma" && res && res.respuesta}
              {paso === "listo" && res && res.respuesta}
            </p>
          </div>
          <span
            className="shrink-0 rounded-full border border-white/15 px-3 py-1 text-[11px] uppercase tracking-[0.2em]"
            style={{ color: "#fbbf24", fontFamily: JET }}
          >
            Caja S/ {saldo}
          </span>
        </div>

        {(paso === "pedido" || paso === "comprobante") && (
          <div className="mt-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3" style={{ fontFamily: BRIC }}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.25em] text-white/50" style={{ fontFamily: JET }}>
                  Pedido · {e.trato}
                </p>
                <p className="text-base text-white">{e.pedido}</p>
                {e.ruc && (
                  <p className="text-[12px] text-white/60" style={{ fontFamily: JET }}>
                    RUC del cliente: {e.ruc}
                  </p>
                )}
              </div>
              <span className="shrink-0 text-lg font-semibold" style={{ color: "#fbbf24", fontFamily: JET }}>
                S/ {e.monto}
              </span>
            </div>
          </div>
        )}

        {paso === "pedido" && (
          <button
            type="button"
            onClick={() => setPaso("comprobante")}
            className="mt-3 rounded-full px-6 py-3 text-[11px] uppercase tracking-[0.25em] transition hover:brightness-110"
            style={{ background: "#ff7a3d", color: "#1a0d05", fontFamily: JET }}
          >
            Entregar el pedido · Espacio
          </button>
        )}

        {paso === "comprobante" && (
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {opciones.map((o, i) => (
              <button
                key={o.c}
                type="button"
                onClick={() => elegir(o.c)}
                className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-left transition hover:border-[#ff7a3d]"
              >
                <span className="block text-base font-semibold text-white" style={{ fontFamily: BRIC }}>
                  {o.titulo} <span className="text-white/40" style={{ fontFamily: JET }}>{i + 1}</span>
                </span>
                <span className="block text-[12px] text-white/65" style={{ fontFamily: BRIC }}>
                  {o.sub}
                </span>
              </button>
            ))}
          </div>
        )}

        {paso === "firma" && res && (
          <div className="mt-3 flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
            <div className="flex-1" style={{ fontFamily: JET }}>
              <p className="text-[10px] uppercase tracking-[0.25em] text-white/50">Comprobante emitido</p>
              <p className="text-sm text-white">
                {res.comprobante === "ninguno"
                  ? "Ninguno · venta sin sustento"
                  : `${NOMBRE[res.comprobante]} ${res.comprobante === "boleta" ? "B001" : "F001"}-${String(serie).padStart(6, "0")}`}
              </p>
              {res.comprobante === "factura" && e.ruc && <p className="text-[11px] text-white/60">RUC {e.ruc}</p>}
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-[0.25em] text-white/50" style={{ fontFamily: JET }}>
                Firma de conformidad
              </p>
              <svg viewBox="0 0 190 60" className="h-12 w-40">
                <path
                  d="M8 40 C 22 6, 34 62, 52 28 S 78 52, 96 22 S 128 50, 150 26 L 182 30"
                  fill="none"
                  stroke="#93c5fd"
                  strokeWidth="3"
                  strokeLinecap="round"
                  pathLength={1}
                  style={{
                    strokeDasharray: 1,
                    strokeDashoffset: dibuja ? 0 : 1,
                    transition: "stroke-dashoffset 1.6s ease-in-out",
                  }}
                />
              </svg>
            </div>
          </div>
        )}

        {paso === "listo" && res && (
          <>
            <div className="mt-3 flex flex-wrap gap-2" style={{ fontFamily: JET }}>
              <span
                className="rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.2em]"
                style={{ color: "#5eead4", borderColor: "rgba(94,234,212,0.4)" }}
              >
                Venta + S/ {e.monto + res.extra}
              </span>
              <span
                className="rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.2em]"
                style={{
                  color: res.riesgo <= 0 ? "#5eead4" : "#f43f5e",
                  borderColor: res.riesgo <= 0 ? "rgba(94,234,212,0.4)" : "rgba(244,63,94,0.4)",
                }}
              >
                Riesgo fiscal {res.riesgo > 0 ? "+" : ""}
                {res.riesgo}%
              </span>
              <span className="rounded-full border border-white/15 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-white/70">
                {NOMBRE[res.comprobante]}
              </span>
            </div>
            <p className="mt-3 text-sm leading-snug text-white/80" style={{ fontFamily: BRIC }}>
              {res.leccion}
            </p>
            <button
              type="button"
              onClick={salirDeTienda}
              className="mt-3 rounded-full px-6 py-3 text-[11px] uppercase tracking-[0.25em] transition hover:brightness-110"
              style={{ background: "#ff7a3d", color: "#1a0d05", fontFamily: JET }}
            >
              Seguir · Espacio
            </button>
          </>
        )}
      </div>
    </div>
  );
}
