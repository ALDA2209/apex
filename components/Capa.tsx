"use client";

import Dialogo from "@/components/Dialogo";
import Parada from "@/components/Parada";
import Servicio from "@/components/Servicio";
import Meta from "@/components/Meta";
import Arresto from "@/components/Arresto";
import Ruta from "@/components/Ruta";
import { estado, LIMITE_FALTAS, useBotiquines, useDentro, useFaltas, useFase, useIntegridad, useKits, useRiesgo, useSalud } from "@/lib/estado";
import Objetivo from "@/components/Objetivo";
import Velocimetro from "@/components/Velocimetro";

function Riesgo() {
  const riesgo = useRiesgo();
  const color = riesgo <= 35 ? "#2dd4bf" : riesgo <= 65 ? "#fbbf24" : "#f43f5e";
  return (
    <div
      className="absolute left-5 top-[4.3rem] z-10 flex items-center gap-3 rounded-full [@media(max-width:640px)_and_(orientation:portrait)]:left-2 [@media(max-width:640px)_and_(orientation:portrait)]:top-[5.6rem] [@media(max-width:640px)_and_(orientation:portrait)]:gap-2 [@media(max-width:640px)_and_(orientation:portrait)]:px-3 [@media(max-width:640px)_and_(orientation:portrait)]:py-1 border border-white/10 bg-black/40 px-4 py-2 backdrop-blur [@media(max-height:480px)]:left-2 [@media(max-height:480px)]:top-10 [@media(max-height:480px)]:gap-2 [@media(max-height:480px)]:px-3 [@media(max-height:480px)]:py-1"
      style={{ fontFamily: "var(--font-jetbrains)" }}
    >
      <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-white">
        Nv {estado.nivel}
      </span>
      <span className="text-[10px] uppercase tracking-[0.3em] text-white/60 [@media(max-height:480px)]:tracking-[0.15em]">Riesgo</span>
      <span className="h-1.5 w-28 overflow-hidden rounded-full bg-white/15 [@media(max-height:480px)]:w-12 [@media(max-width:640px)_and_(orientation:portrait)]:w-10">
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

/* Puntos de infracción: con 3 el policía te arresta. */
function Infracciones() {
  const faltas = useFaltas();
  const grave = faltas >= LIMITE_FALTAS - 1 && faltas > 0;
  return (
    <div
      className="absolute left-5 top-[14.2rem] z-10 flex items-center gap-2.5 rounded-full border bg-black/40 px-4 py-1.5 backdrop-blur [@media(max-height:480px)]:left-[14.8rem] [@media(max-height:480px)]:top-10 [@media(max-height:480px)]:px-3 [@media(max-height:480px)]:py-1 [@media(max-width:640px)_and_(orientation:portrait)]:left-2 [@media(max-width:640px)_and_(orientation:portrait)]:top-[14.4rem]"
      style={{ fontFamily: "var(--font-jetbrains)", borderColor: grave ? "rgba(244,63,94,0.7)" : "rgba(255,255,255,0.1)" }}
      title="Infracciones: con 3 puntos el policía te arresta"
    >
      <span className="text-[10px] uppercase tracking-[0.25em] text-white/60">Infracciones</span>
      <span className="flex items-center gap-1.5">
        {Array.from({ length: LIMITE_FALTAS }).map((_, i) => (
          <span
            key={i}
            className="h-2.5 w-2.5 rounded-full"
            style={{
              background: i < faltas ? "#f43f5e" : "rgba(255,255,255,0.18)",
              boxShadow: i < faltas ? "0 0 8px #f43f5e" : "none",
            }}
          />
        ))}
      </span>
    </div>
  );
}

function Mini({ etiqueta, valor }: { etiqueta: string; valor: number }) {
  const color = valor > 60 ? "#2dd4bf" : valor > 30 ? "#fbbf24" : "#f43f5e";
  return (
    <div className="flex items-center gap-3">
      <span className="w-16 text-[10px] uppercase tracking-[0.25em] text-white/60 [@media(max-width:640px)_and_(orientation:portrait)]:w-[4.6rem] [@media(max-height:480px)]:w-auto [@media(max-height:480px)]:tracking-[0.1em]">{etiqueta}</span>
      <span className="h-1.5 w-24 overflow-hidden rounded-full bg-white/15 [@media(max-height:480px)]:w-10 [@media(max-width:640px)_and_(orientation:portrait)]:w-12">
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
      className="absolute left-5 top-[7.6rem] z-10 flex flex-col gap-2 rounded-2xl [@media(max-width:640px)_and_(orientation:portrait)]:left-2 [@media(max-width:640px)_and_(orientation:portrait)]:top-[8.3rem] [@media(max-width:640px)_and_(orientation:portrait)]:gap-1 [@media(max-width:640px)_and_(orientation:portrait)]:px-3 [@media(max-width:640px)_and_(orientation:portrait)]:py-2 border border-white/10 bg-black/40 px-4 py-3 backdrop-blur [@media(max-height:480px)]:left-2 [@media(max-height:480px)]:top-[4.4rem] [@media(max-height:480px)]:flex-row [@media(max-height:480px)]:flex-wrap [@media(max-height:480px)]:items-center [@media(max-height:480px)]:gap-x-3 [@media(max-height:480px)]:gap-y-0 [@media(max-height:480px)]:rounded-full [@media(max-height:480px)]:px-3 [@media(max-height:480px)]:py-1"
      style={{ fontFamily: "var(--font-jetbrains)" }}
    >
      <Mini etiqueta="Mototaxi" valor={integridad} />
      <Mini etiqueta="Salud" valor={salud} />
      <p className="text-[10px] uppercase tracking-[0.25em] text-white/50 [@media(max-height:480px)]:tracking-[0.05em]">
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
        className="pointer-events-none absolute inset-x-0 bottom-24 z-10 flex justify-center px-4 [@media(max-height:480px)]:bottom-auto [@media(max-height:480px)]:top-[7.2rem] [@media(max-width:640px)_and_(orientation:portrait)]:bottom-auto [@media(max-width:640px)_and_(orientation:portrait)]:top-[13.5rem]"
        style={{ fontFamily: "var(--font-jetbrains)" }}
      >
        <div
          className="animate-pulse rounded-full border px-5 py-2 [@media(max-height:480px)]:px-3 [@media(max-height:480px)]:py-1 [@media(max-height:480px)]:text-[9px] text-[11px] uppercase tracking-[0.2em] text-white backdrop-blur"
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
      <Infracciones />
      <Ruta />
      <Cansancio />
      <Velocimetro />
      <Objetivo />
      <Dialogo />
      {fase === "parada" && <Parada />}
      {fase === "servicio" && dentro && <Servicio />}
      {fase === "meta" && <Meta alSalir={alSalir} />}
      {fase === "arrestado" && <Arresto alSalir={alSalir} />}
    </>
  );
}
