"use client";

import { useEffect, useState } from "react";
import Historia, { type EscenaTexto } from "@/components/Historia";

const JET = "var(--font-jetbrains)";
const BRIC = "var(--font-bricolage)";

const ESCENAS: EscenaTexto[] = [
  {
    lugar: "HUÁNUCO · 4:50 A. M.",
    texto:
      "El mercado todavía duerme, pero en una casa del barrio ya hay luz. Hoy sale el pedido más grande del año.",
  },
  {
    lugar: "TRES GENERACIONES",
    texto:
      "Desde hace tres generaciones, tu familia vende ropa y accesorios en el mercado. Esta semana llegó un pedido importado: hay que entregarlo en la feria de la ciudad vecina.",
  },
  {
    lugar: "UNA RUTA, TRES CONTROLES",
    texto:
      "Entre la casa y la feria hay una carretera llena de tráfico y tres puentes de control. Ahí se decide si llegas con tu mercadería... o sin ella.",
  },
];

function Fondo() {
  const [mover, setMover] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setMover(true), 60);
    return () => clearTimeout(id);
  }, []);

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{
        background:
          "linear-gradient(to bottom, #1c0b3a 0%, #4a1a6b 35%, #b2467a 62%, #ff9a5a 82%, #ffcf8a 100%)",
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          transform: mover ? "scale(1.12)" : "scale(1)",
          transition: "transform 30s linear",
          transformOrigin: "50% 85%",
        }}
      >
        <div
          className="absolute left-1/2 top-[60%] h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background:
              "radial-gradient(circle, #fff4cf 0%, #ffcf8a 35%, rgba(255,154,90,0) 70%)",
          }}
        />
        <svg
          viewBox="0 0 1600 900"
          preserveAspectRatio="xMidYMax slice"
          className="absolute inset-0 h-full w-full"
        >
          <polygon
            points="0,640 160,560 300,610 470,500 640,600 800,540 980,620 1150,520 1320,610 1460,550 1600,600 1600,900 0,900"
            fill="#b2567a"
            opacity="0.9"
          />
          <polygon
            points="0,700 200,610 380,690 560,600 760,700 960,620 1180,710 1380,630 1600,700 1600,900 0,900"
            fill="#6a2f6b"
          />
          <polygon
            points="0,780 240,700 460,770 700,690 940,780 1180,710 1420,790 1600,740 1600,900 0,900"
            fill="#2e1650"
          />
          <rect x="0" y="828" width="1600" height="72" fill="#0d0620" />
          <rect x="0" y="824" width="1600" height="6" fill="#ff8a4a" opacity="0.6" />
          <g
            style={{
              transform: mover ? "translateX(1750px)" : "translateX(-220px)",
              transition: "transform 24s linear",
            }}
          >
            <g fill="#06020d">
              <rect x="6" y="786" width="40" height="14" rx="3" />
              <rect x="10" y="768" width="30" height="18" rx="2" />
              <rect x="44" y="768" width="56" height="34" rx="8" />
              <rect x="40" y="758" width="62" height="12" rx="4" />
              <circle cx="26" cy="816" r="12" />
              <circle cx="106" cy="816" r="12" />
            </g>
          </g>
        </svg>
      </div>
    </div>
  );
}

function Titulo({ alTerminar }: { alTerminar: () => void }) {
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "Enter" || e.code === "Escape") {
        e.preventDefault();
        alTerminar();
      }
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [alTerminar]);

  return (
    <div
      className="absolute inset-0 z-20 flex cursor-pointer select-none flex-col items-center justify-center text-center"
      onClick={alTerminar}
      style={{
        background:
          "radial-gradient(ellipse at center, rgba(5,6,12,0.3), rgba(5,6,12,0.88))",
      }}
    >
      <p
        className="mb-4 text-[11px] uppercase tracking-[0.5em]"
        style={{ color: "#5eead4", fontFamily: JET }}
      >
        Carrera de decisiones
      </p>
      <h1
        className="text-7xl font-extrabold tracking-tight sm:text-9xl"
        style={{
          fontFamily: "var(--font-unbounded)",
          background: "linear-gradient(180deg, #fff1d6, #ff7a3d)",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
        }}
      >
        APEX
      </h1>
      <p className="mt-6 max-w-md px-6 text-base text-white/80" style={{ fontFamily: BRIC }}>
        Esquiva, decide y llega con tu mercadería a salvo. Cultura tributaria y aduanera, a
        toda velocidad.
      </p>
      <p
        className="mt-12 animate-pulse text-[11px] uppercase tracking-[0.3em] text-white/60"
        style={{ fontFamily: JET }}
      >
        Clic o Espacio · continuar
      </p>
    </div>
  );
}

export default function Intro({ alTerminar }: { alTerminar: () => void }) {
  const [titulo, setTitulo] = useState(false);

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-black">
      <Fondo />
      {titulo ? (
        <Titulo alTerminar={alTerminar} />
      ) : (
        <Historia
          escenas={ESCENAS}
          etiquetaFinal="ver título"
          alTerminar={() => setTitulo(true)}
          alSaltar={alTerminar}
        />
      )}
    </main>
  );
}
