"use client";

import Dialogo from "@/components/Dialogo";
import Parada from "@/components/Parada";
import Servicio from "@/components/Servicio";
import Meta from "@/components/Meta";
import Ruta from "@/components/Ruta";
import { estado, useBotiquines, useDentro, useFase, useIntegridad, useKits, useRiesgo, useSalud } from "@/lib/estado";
import Objetivo from "@/components/Objetivo";
import Velocimetro from "@/components/Velocimetro";

function Riesgo() {
  const riesgo = useRiesgo();
  const color = riesgo <= 35 ? "#2dd4bf" : riesgo <= 65 ? "#fbbf24" : "#f43f5e";
  return (
    <div
      className="absolute left-5 top-[4.3rem] z-10 flex items-center gap-3 rounded-full border border-white/10 bg-black/40 px-4 py-2 backdrop-blur"
      style={{ fontFamily: "var(--font-jetbrains)" }}
    >
      <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-white">
        Nv {estado.nivel}
      </span>
      <span className="text-[10px] uppercase tracking-[0.3em] text-white/60">Riesgo fiscal</span>
      <span className="h-1.5 w-28 overflow-hidden rounded-full bg-white/15">
        <span
          className="block h-full rounded-full transition-all duration-500"
          style={{ width: `${riesgo}%`, background: color, boxShadow: `0 0 8px ${color}` }}
        />
      </span>
      <span className="w-8 text-right text-xs font-semibold" style={{ color }}>
        {riesgo}%
      </span>
    </div>
  );
}

function Mini({ etiqueta, valor }: { etiqueta: string; valor: number }) {
  const color = valor > 60 ? "#2dd4bf" : valor > 30 ? "#fbbf24" : "#f43f5e";
  return (
    <div className="flex items-center gap-3">
      <span className="w-16 text-[10px] uppercase tracking-[0.25em] text-white/60">{etiqueta}</span>
      <span className="h-1.5 w-24 overflow-hidden rounded-full bg-white/15">
        <span
          className="block h-full rounded-full transition-all duration-500"
          style={{ width: valor + "%", background: color, boxShadow: "0 0 8px " + color }}
        />
      </span>
      <span className="w-9 text-right text-xs font-semibold" style={{ color }}>
        {valor}%
      </span>
    </div>
  );
}

function Estado() {
  const integridad = useIntegridad();
  const salud = useSalud();
  const kits = useKits();
  const botiquines = useBotiquines();
  return (
    <div
      className="absolute left-5 top-[7.6rem] z-10 flex flex-col gap-2 rounded-2xl border border-white/10 bg-black/40 px-4 py-3 backdrop-blur"
      style={{ fontFamily: "var(--font-jetbrains)" }}
    >
      <Mini etiqueta="Mototaxi" valor={integridad} />
      <Mini etiqueta="Salud" valor={salud} />
      <p className="text-[10px] uppercase tracking-[0.25em] text-white/50">
        Kits {kits} · Botiquines {botiquines}
      </p>
    </div>
  );
}

function Cansancio() {
  const salud = useSalud();
  const fase = useFase();
  if (salud >= 50 || fase !== "libre") return null;
  const f = Math.min(1, (50 - salud) / 50);
  return (
    <>
      <div
        className="pointer-events-none absolute inset-0 z-[5]"
        style={{ background: `radial-gradient(ellipse at center, transparent 55%, rgba(244,63,94,${0.12 + f * 0.35}) 100%)` }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-24 z-10 flex justify-center px-4"
        style={{ fontFamily: "var(--font-jetbrains)" }}
      >
        <div
          className="animate-pulse rounded-full border px-5 py-2 text-[11px] uppercase tracking-[0.2em] text-white backdrop-blur"
          style={{ borderColor: "rgba(244,63,94,0.6)", background: "rgba(40,6,16,0.7)" }}
        >
          Salud baja · el mototaxi se vuelve inestable · come algo en la próxima parada
        </div>
      </div>
    </>
  );
}

export default function Capa({ alSalir }: { alSalir: () => void }) {
  const fase = useFase();
  const dentro = useDentro();
  return (
    <>
      <Riesgo />
      <Estado />
      <Ruta />
      <Cansancio />
      <Velocimetro />
      <Objetivo />
      <Dialogo />
      {fase === "parada" && <Parada />}
      {fase === "servicio" && dentro && <Servicio />}
      {fase === "meta" && <Meta alSalir={alSalir} />}
    </>
  );
}
