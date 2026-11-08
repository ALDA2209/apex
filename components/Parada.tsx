"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  YAPE,
  auxilioDeRuta,
  estado,
  pedirYape,
  reanudar,
  repararConMecanico,
  useBotiquines,
  useIntegridad,
  useKits,
  useSalud,
  useSoles,
  usarBotiquin,
  usarKit,
} from "@/lib/estado";

const JET = "var(--font-jetbrains)";
const BRIC = "var(--font-bricolage)";
const MECANICO = 80;
const TRABAJO_MS = 2200;

function Barra({ etiqueta, valor }: { etiqueta: string; valor: number }) {
  const color = valor > 60 ? "#2dd4bf" : valor > 30 ? "#fbbf24" : "#f43f5e";
  return (
    <div className="flex-1">
      <div className="flex justify-between text-[10px] uppercase tracking-[0.25em] text-white/70" style={{ fontFamily: JET }}>
        <span>{etiqueta}</span>
        <span style={{ color }}>{valor}%</span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/15">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: valor + "%", background: color, boxShadow: "0 0 8px " + color }} />
      </div>
    </div>
  );
}

type Accion = { n: number; titulo: string; detalle: string; activa: boolean; ir: () => void };

export default function Parada() {
  const integridad = useIntegridad();
  const salud = useSalud();
  const kits = useKits();
  const botiquines = useBotiquines();
  const soles = useSoles();
  const [trabajo, setTrabajo] = useState<string | null>(null);
  const [mecanico, setMecanico] = useState(false);
  const [nota, setNota] = useState<string | null>(null);
  const reloj = useRef<ReturnType<typeof setTimeout> | null>(null);

  const forzada = integridad <= 0 || salud <= 0;

  useEffect(
    () => () => {
      if (reloj.current) clearTimeout(reloj.current);
    },
    [],
  );

  const trabajar = useCallback((nombre: string, fin: () => void) => {
    setTrabajo(nombre);
    setNota(null);
    reloj.current = setTimeout(() => {
      fin();
      setTrabajo(null);
    }, TRABAJO_MS);
  }, []);

  const pagarMecanico = (con: boolean) => {
    const monto = con ? MECANICO : Math.round(MECANICO * 0.9);
    setMecanico(false);
    trabajar("Mecánico reparando…", () => {
      repararConMecanico(monto, con, con ? -5 : 10);
      setNota(
        con
          ? "Pediste boleta: queda constancia del servicio y del IGV incluido en el precio."
          : "Sin boleta no tienes cómo probar el servicio si el arreglo falla. Pide siempre tu comprobante.",
      );
    });
  };

  const acciones: Accion[] = [
    {
      n: 1,
      titulo: "Usar kit de reparación",
      detalle: "Tienes " + kits + " · repara 40% del mototaxi",
      activa: kits > 0 && integridad < 100,
      ir: () => trabajar("Reparando con tu kit…", usarKit),
    },
    {
      n: 2,
      titulo: "Usar botiquín",
      detalle: "Tienes " + botiquines + " · cura 40% de tu salud",
      activa: botiquines > 0 && salud < 100,
      ir: () => trabajar("Curándote…", usarBotiquin),
    },
    {
      n: 3,
      titulo: "Llamar al mecánico · S/ " + MECANICO,
      detalle: "Deja el mototaxi como nuevo",
      activa: soles >= MECANICO && integridad < 100,
      ir: () => setMecanico(true),
    },
    {
      n: 4,
      titulo: "Pedir un yape a la familia · +S/ " + YAPE,
      detalle: estado.yapeUsado ? "Ya te ayudaron una vez" : "Solo una vez por ruta",
      activa: !estado.yapeUsado,
      ir: () => {
        pedirYape();
        setNota(
          "Un pago por celular es solo el pago: no reemplaza al comprobante. Cuando compres algo, pide igual tu boleta o factura.",
        );
      },
    },
  ];
  if (forzada) {
    acciones.push({
      n: 5,
      titulo: "Grúa de auxilio",
      detalle: "Te levanta, pero cobra lo que tengas (hasta S/ 80)",
      activa: true,
      ir: () => trabajar("Llegó la grúa…", () => void auxilioDeRuta()),
    });
  }

  const seguir = useCallback(() => {
    if (!forzada && !trabajo && !mecanico) reanudar();
  }, [forzada, trabajo, mecanico]);

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if (trabajo) return;
      if (mecanico) {
        if (e.key === "1") pagarMecanico(true);
        if (e.key === "2") pagarMecanico(false);
        return;
      }
      const a = acciones.find((x) => String(x.n) === e.key);
      if (a && a.activa) a.ir();
      if (e.code === "Space" || e.code === "Enter" || e.code === "KeyR") {
        e.preventDefault();
        seguir();
      }
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  });

  return (
    <div className="absolute inset-x-0 bottom-0 z-20 flex justify-center px-4 pb-6 [@media(max-height:480px)]:px-2 [@media(max-height:480px)]:pb-1">
      <div
        className="w-full max-w-3xl overflow-y-auto rounded-2xl border border-white/10 p-5 backdrop-blur-md sm:p-6 max-h-[calc(100dvh-1rem)] [@media(max-height:480px)]:p-3 [@media(max-height:480px)]:sm:p-3"
        style={{ background: "rgba(6,10,20,0.88)" }}
      >
        <p className="text-[10px] uppercase tracking-[0.3em]" style={{ color: "#5eead4", fontFamily: JET }}>
          {forzada ? "No puedes seguir así" : "Estacionado en la berma"}
        </p>
        <p className="mt-1 text-xl text-white" style={{ fontFamily: BRIC }}>
          {forzada
            ? integridad <= 0
              ? "Tu mototaxi no arranca. Necesitas repararlo."
              : "Te sientes mal. Necesitas curarte antes de seguir."
            : "Tómate un respiro y arregla lo que haga falta."}
        </p>

        <div className="mt-4 flex gap-5">
          <Barra etiqueta="Mototaxi" valor={integridad} />
          <Barra etiqueta="Salud" valor={salud} />
        </div>

        {trabajo ? (
          <div className="mt-5">
            <p className="text-base text-white" style={{ fontFamily: BRIC }}>
              {trabajo}
            </p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full rounded-full"
                style={{
                  background: "#ff7a3d",
                  animation: "parada-trabajo " + TRABAJO_MS + "ms linear forwards",
                }}
              />
            </div>
            <style>{"@keyframes parada-trabajo{from{width:0}to{width:100%}}"}</style>
          </div>
        ) : mecanico ? (
          <div className="mt-5">
            <p className="text-lg text-white" style={{ fontFamily: BRIC }}>
              Mecánico: «Son S/ {MECANICO}. ¿Le hago su boleta? Si no, le dejo S/ {Math.round(MECANICO * 0.9)}.»
            </p>
            <div className="mt-3 flex flex-col gap-2">
              {[true, false].map((con, i) => (
                <button
                  key={String(con)}
                  type="button"
                  onClick={() => pagarMecanico(con)}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-white transition hover:border-[#ff7a3d]"
                  style={{ fontFamily: BRIC }}
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-md text-xs font-bold" style={{ background: "#ff7a3d", color: "#1a0d05", fontFamily: JET }}>
                    {i + 1}
                  </span>
                  {con ? "Sí, con boleta. Pago S/ " + MECANICO + "." : "Sin boleta. Pago S/ " + Math.round(MECANICO * 0.9) + "."}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              {acciones.map((a) => (
                <button
                  key={a.n}
                  type="button"
                  disabled={!a.activa}
                  onClick={a.ir}
                  className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-white transition enabled:hover:border-[#ff7a3d] disabled:opacity-40"
                  style={{ fontFamily: BRIC }}
                >
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold" style={{ background: "#ff7a3d", color: "#1a0d05", fontFamily: JET }}>
                    {a.n}
                  </span>
                  <span>
                    <span className="block text-base leading-snug">{a.titulo}</span>
                    <span className="block text-sm text-white/60">{a.detalle}</span>
                  </span>
                </button>
              ))}
            </div>
            {nota && (
              <div
                className="mt-4 rounded-xl border px-4 py-3"
                style={{ borderColor: "rgba(94,234,212,0.3)", background: "rgba(94,234,212,0.06)" }}
              >
                <p className="text-[10px] uppercase tracking-[0.25em]" style={{ color: "#5eead4", fontFamily: JET }}>
                  Lo que debes saber
                </p>
                <p className="mt-1 text-base leading-snug text-white/90" style={{ fontFamily: BRIC }}>
                  {nota}
                </p>
              </div>
            )}
            <button
              type="button"
              disabled={forzada}
              onClick={seguir}
              className="mt-4 rounded-full px-6 py-3 text-[11px] uppercase tracking-[0.25em] transition enabled:hover:brightness-110 disabled:opacity-40"
              style={{ background: "#ff7a3d", color: "#1a0d05", fontFamily: JET }}
            >
              Seguir ruta · Espacio
            </button>
          </>
        )}
      </div>
    </div>
  );
}
