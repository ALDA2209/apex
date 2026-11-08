"use client";

import { diaActual, rangoDe, useProgreso } from "@/lib/semana";

const JET = "var(--font-jetbrains)";
/* Tu dinero y tu experiencia de la semana: arriba, siempre a la vista. */
export default function Billetera({ conMapa = true }: { conMapa?: boolean }) {
  const p = useProgreso();
  const dia = diaActual();
  const r = rangoDe(p.xp);
  const tramo = r.siguiente ? r.siguiente - r.desde : 1;
  const pct = r.siguiente ? Math.min(100, ((p.xp - r.desde) / tramo) * 100) : 100;
  const base =
    "absolute z-10 w-[11rem] rounded-2xl border border-white/10 bg-black/45 p-3 backdrop-blur " +
    "[@media(max-height:480px)]:flex [@media(max-height:480px)]:w-auto [@media(max-height:480px)]:items-center [@media(max-height:480px)]:gap-3 [@media(max-height:480px)]:rounded-full [@media(max-height:480px)]:px-3 [@media(max-height:480px)]:py-1 " +
    "[@media(max-width:640px)_and_(orientation:portrait)]:w-40 [@media(max-width:640px)_and_(orientation:portrait)]:p-2";
  /* Con mapa (carrera): escritorio bajo el mapa; celular horizontal junto a CAJA; celular vertical bajo INFRACCIONES. */
  const sitio = conMapa
    ? "right-5 top-[21.6rem] [@media(max-height:480px)]:right-auto [@media(max-height:480px)]:left-[calc(50%+4.6rem)] [@media(max-height:480px)]:top-2 [@media(max-width:640px)_and_(orientation:portrait)]:right-auto [@media(max-width:640px)_and_(orientation:portrait)]:left-2 [@media(max-width:640px)_and_(orientation:portrait)]:top-[17rem]"
    : "right-5 top-[4.3rem] [@media(max-height:480px)]:right-2 [@media(max-height:480px)]:top-10 [@media(max-width:640px)_and_(orientation:portrait)]:right-2 [@media(max-width:640px)_and_(orientation:portrait)]:top-11";
  return (
    <div
      className={`${base} ${sitio}`}
      style={{ fontFamily: JET }}
      title="Tu dinero y tu experiencia de la semana"
    >
      <p className={`text-[9px] uppercase tracking-[0.22em] text-white/60 [@media(max-height:480px)]:hidden`}>
        {dia.nombre} · Semana {p.semana}
      </p>
      <p className={`mt-0.5 flex items-baseline gap-1.5 [@media(max-height:480px)]:mt-0`}>
        <span className="text-[9px] uppercase tracking-[0.22em] text-white/50 [@media(max-height:480px)]:hidden">Billetera</span>
        <span className="text-lg font-semibold leading-none" style={{ color: "#fbbf24" }}>
          S/ {p.dinero}
        </span>
      </p>
      <div className={`mt-2 [@media(max-height:480px)]:mt-0 [@media(max-height:480px)]:flex [@media(max-height:480px)]:items-center [@media(max-height:480px)]:gap-2`}>
        <span className={`block h-1 overflow-hidden rounded-full bg-white/15 [@media(max-height:480px)]:hidden`}>
          <span
            className="block h-full rounded-full"
            style={{ width: `${pct}%`, background: "#a78bfa", boxShadow: "0 0 8px #a78bfa" }}
          />
        </span>
        <p className={`mt-1 text-[9px] uppercase tracking-[0.18em] [@media(max-height:480px)]:mt-0 [@media(max-height:480px)_and_(max-width:700px)]:hidden`} style={{ color: "#c4b5fd" }}>
          {r.nombre} · <span className="text-white/60">{p.xp} XP</span>
        </p>
      </div>
    </div>
  );
}
