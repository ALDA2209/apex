"use client";

import { useEffect, useState, type ReactNode } from "react";
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

/* ---------- fondos de cada escena ---------- */

const ESTRELLAS = Array.from({ length: 70 }, (_, i) => ({
  x: (i * 337) % 1600,
  y: (i * 149) % 420,
  r: 0.8 + ((i * 7) % 5) * 0.35,
  d: (i % 7) * 0.5,
}));

function Escena1() {
  // madrugada en el barrio: una sola ventana con luz
  const casas = [
    [0, 700, 150, 140], [140, 660, 120, 180], [250, 710, 160, 130], [400, 640, 140, 200],
    [530, 700, 130, 140], [650, 670, 170, 170], [810, 720, 120, 120], [920, 650, 150, 190],
    [1060, 700, 140, 140], [1190, 665, 130, 175], [1310, 710, 150, 130], [1450, 660, 160, 180],
  ];
  return (
    <div
      className="absolute inset-0"
      style={{ background: "linear-gradient(to bottom, #050816 0%, #0b1a3a 45%, #274a7a 78%, #f08a5d 100%)" }}
    >
      <style>{`@keyframes est { 0%,100%{opacity:.25} 50%{opacity:1} } @keyframes luz { 0%,100%{opacity:.85} 50%{opacity:1} }`}</style>
      <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 h-full w-full">
        {ESTRELLAS.map((e, i) => (
          <circle key={i} cx={e.x} cy={e.y} r={e.r} fill="#dbeafe" style={{ animation: `est ${2 + (i % 4)}s ${e.d}s infinite` }} />
        ))}
        <circle cx="1240" cy="170" r="46" fill="#fef3c7" opacity="0.95" />
        <circle cx="1240" cy="170" r="120" fill="url(#halo)" />
        <defs>
          <radialGradient id="halo">
            <stop offset="0" stopColor="#fef3c7" stopOpacity="0.35" />
            <stop offset="1" stopColor="#fef3c7" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="ventana">
            <stop offset="0" stopColor="#ffd28a" stopOpacity="0.9" />
            <stop offset="1" stopColor="#ffd28a" stopOpacity="0" />
          </radialGradient>
        </defs>
        <g transform="translate(0 -260)">
        <polygon points="0,600 220,470 420,560 640,430 880,560 1100,450 1340,560 1600,480 1600,1300 0,1300" fill="#0e1b3d" />
        <polygon points="0,660 260,560 520,640 780,540 1040,640 1300,560 1600,650 1600,1300 0,1300" fill="#0a132b" />
        {casas.map(([x, y, w, h], i) => (
          <g key={i}>
            <rect x={x} y={y} width={w} height={h + 200} fill="#050914" />
            {[0, 1].map((f) =>
              [0, 1].map((c) => (
                <rect key={f + "" + c} x={x + 22 + c * (w / 2 - 6)} y={y + 24 + f * 48} width="16" height="20" fill="#0c1630" />
              )),
            )}
          </g>
        ))}
        {/* la casa de tu familia */}
        <circle cx="708" cy="716" r="70" fill="url(#ventana)" style={{ animation: "luz 3s infinite" }} />
        <rect x="700" y="704" width="16" height="22" fill="#ffd28a" />
        <rect x="0" y="840" width="1600" height="400" fill="#02040a" />
        </g>
      </svg>
    </div>
  );
}

function Escena2() {
  // el mercado de madrugada: pasillo en perspectiva, luz cálida, profundidad de campo y neblina
  const tarpas = ["#7a1f24", "#8a5a14", "#1d4a5e", "#5b2a6e", "#6e2a2a", "#2a5a45"];
  const prendas = ["#7a2a2a", "#b0792a", "#2a5f78", "#6b3a85", "#8a3a3a", "#3a7a5a", "#a8a39a"];
  const niveles = [0, 1, 2, 3, 4, 5];
  const VP = { x: 800, y: 300 };

  const puesto = (i: number, lado: "izq" | "der") => {
    const s = Math.pow(0.68, i);
    const hueco = 330 * s + 30;
    const tx = lado === "izq" ? VP.x - hueco - 360 * s : VP.x + hueco + 360 * s;
    const base = VP.y + 230 * s;
    const ty = base - 340 * s;
    const t = tarpas[(i * 2 + (lado === "izq" ? 0 : 1)) % tarpas.length];
    return (
      <g
        key={lado + i}
        transform={lado === "izq" ? `translate(${tx} ${ty}) scale(${s})` : `translate(${tx} ${ty}) scale(${-s} ${s})`}
        filter={i > 0 ? `url(#m2-b${i})` : undefined}
      >
        <rect x="0" y="70" width="360" height="270" fill="url(#m2-int)" />
        <rect x="0" y="70" width="360" height="270" fill="#000" opacity="0.18" />
        {Array.from({ length: 8 }, (_, k) => (
          <g key={k}>
            <rect x={18 + k * 42} y={96} width="3" height="14" fill="#0a0504" />
            <rect x={10 + k * 42} y={108} width="30" height={64 + ((k * 7 + i * 3) % 4) * 14} rx="3" fill={prendas[(k + i * 2) % prendas.length]} opacity="0.92" />
            <rect x={10 + k * 42} y={108} width="5" height={64 + ((k * 7 + i * 3) % 4) * 14} fill="#ffd9a0" opacity="0.35" />
          </g>
        ))}
        <rect x="0" y="262" width="360" height="78" fill="#150a07" />
        <rect x="0" y="260" width="360" height="4" fill="#ffb866" opacity="0.7" />
        <rect x="26" y="226" width="70" height="36" fill="#9a6a38" />
        <rect x="104" y="238" width="52" height="24" fill="#7f5429" />
        <rect x="200" y="214" width="90" height="48" fill="#b07a40" />
        <polygon points="-14,74 374,74 396,4 -36,4" fill={t} />
        <polygon points="-14,74 374,74 380,60 -8,60" fill="#000" opacity="0.35" />
        <rect x="-36" y="2" width="432" height="4" fill="#ffd9a0" opacity="0.45" />
        <rect x="-8" y="74" width="11" height="266" fill="#0a0504" />
        <rect x="353" y="74" width="11" height="266" fill="#0a0504" />
        <circle cx="300" cy="84" r="46" fill="url(#m2-foco)" />
        <circle cx="300" cy="82" r="6" fill="#fff7d6" />
        <circle cx="90" cy="84" r="40" fill="url(#m2-foco)" opacity="0.8" />
        <circle cx="90" cy="82" r="5" fill="#fff7d6" />
      </g>
    );
  };

  const bokeh = Array.from({ length: 26 }, (_, i) => ({
    x: (i * 211) % 1600,
    y: 90 + ((i * 97) % 300),
    r: 10 + ((i * 13) % 30),
    c: i % 9 === 99 ? "#5eead4" : i % 3 === 0 ? "#ff9a5a" : "#ffd28a",
    o: 0.08 + ((i * 7) % 5) * 0.03,
    d: (i % 6) * 0.6,
  }));

  const cable = (lado: "izq" | "der") =>
    Array.from({ length: 11 }, (_, k) => {
      const t = k / 11;
      const x0 = lado === "izq" ? 40 : 1560;
      const x = x0 + (VP.x - x0) * t * 0.92;
      const y = 105 + (VP.y - 105) * t * 0.92 + Math.sin(k * 1.7) * 3;
      const r = 34 * (1 - t) + 6;
      return (
        <g key={lado + k} style={{ animation: `m2f ${1.8 + (k % 4) * 0.5}s ${k * 0.17}s infinite` }}>
          <circle cx={x} cy={y} r={r * 1.6} fill="url(#m2-foco)" opacity="0.9" />
          <circle cx={x} cy={y} r={Math.max(2.5, r * 0.18)} fill="#fff7d6" />
        </g>
      );
    });

  const persona = (x: number, y: number, k: number, cargada: boolean, dur: number) => (
    <g style={{ animation: `m2p${k} ${dur}s ease-in-out infinite alternate` }} transform={`translate(${x} ${y})`}>
      <g fill="#05030a" stroke="#ffb866" strokeWidth="1" strokeOpacity="0.5">
        <circle cx="0" cy="-70" r="9" />
        <path d="M-12,-58 Q0,-64 12,-58 L15,-14 L-15,-14 Z" />
        <rect x="-11" y="-14" width="9" height="42" rx="3" />
        <rect x="2" y="-14" width="9" height="42" rx="3" />
        {cargada && <rect x="-20" y="-96" width="40" height="22" rx="4" />}
      </g>
      <ellipse cx="0" cy="30" rx="26" ry="5" fill="#ffb866" opacity="0.12" />
    </g>
  );

  return (
    <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, #050816 0%, #0d1a38 38%, #2a3b63 62%, #d98a52 100%)" }}>
      <style>{`
        @keyframes m2f { 0%,100%{opacity:.75} 45%{opacity:1} 50%{opacity:.55} 55%{opacity:1} }
        @keyframes m2n { from { transform: translateX(-12%) } to { transform: translateX(12%) } }
        @keyframes m2p1 { from { transform: translate(780px,430px) } to { transform: translate(860px,430px) } }
        @keyframes m2p2 { from { transform: translate(930px,392px) } to { transform: translate(880px,392px) } }
      `}</style>
      <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 h-full w-full">
        <defs>
          <radialGradient id="m2-foco">
            <stop offset="0" stopColor="#ffe9b0" stopOpacity="0.85" />
            <stop offset="0.4" stopColor="#ffb866" stopOpacity="0.3" />
            <stop offset="1" stopColor="#ff9a5a" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="m2-int" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f0a850" />
            <stop offset="0.5" stopColor="#8f3f16" />
            <stop offset="1" stopColor="#1c0b05" />
          </linearGradient>
          <radialGradient id="m2-fin">
            <stop offset="0" stopColor="#ffcf8a" stopOpacity="0.95" />
            <stop offset="0.45" stopColor="#e98a4a" stopOpacity="0.4" />
            <stop offset="1" stopColor="#e98a4a" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="m2-calle" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#2a1a1c" />
            <stop offset="0.2" stopColor="#0d070c" />
            <stop offset="1" stopColor="#04020a" />
          </linearGradient>
          <linearGradient id="m2-haz" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffd9a0" stopOpacity="0.3" />
            <stop offset="1" stopColor="#ffd9a0" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="m2-niebla" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#ffcf9a" stopOpacity="0" />
            <stop offset="0.5" stopColor="#ffcf9a" stopOpacity="0.07" />
            <stop offset="1" stopColor="#ffcf9a" stopOpacity="0" />
          </linearGradient>
          {[1, 2, 3, 4, 5].map((i) => (
            <filter key={i} id={"m2-b" + i} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation={i * 0.9} />
            </filter>
          ))}
          <filter id="m2-bk"><feGaussianBlur stdDeviation="5" /></filter>
          <filter id="m2-fg"><feGaussianBlur stdDeviation="16" /></filter>
          <filter id="m2-ref"><feGaussianBlur stdDeviation="6 14" /></filter>
        </defs>

        {/* resplandor del fondo del pasillo */}
        <ellipse cx={VP.x} cy={VP.y} rx="520" ry="230" fill="url(#m2-fin)" />
        <polygon points="0,0 1600,0 1600,300 0,300" fill="#0b1430" opacity="0.15" />

        {/* calle mojada */}
        <polygon points={`0,${VP.y} 1600,${VP.y} 1600,1100 0,1100`} fill="url(#m2-calle)" />

        {/* reflejos de las luces en el suelo */}
        {niveles.map((i) => {
          const s = Math.pow(0.68, i);
          const base = VP.y + 230 * s;
          const hueco = 330 * s + 30;
          return [VP.x - hueco - 60 * s, VP.x + hueco + 60 * s].map((x, k) => (
            <rect key={i + "-" + k} x={x - 10 * s} y={base + 6 * s} width={20 * s} height={150 * s} rx={10 * s} fill="#ffb866" opacity={0.28 - i * 0.03} filter="url(#m2-ref)" />
          ));
        })}

        {/* puestos del más lejano al más cercano */}
        {[5, 4, 3, 2, 1, 0].map((i) => (
          <g key={i}>
            {puesto(i, "izq")}
            {puesto(i, "der")}
          </g>
        ))}

        {/* gente caminando */}
        {persona(0, 0, 1, true, 14)}
        {persona(0, 0, 2, false, 18)}

        {/* focos en cables que llevan la vista al fondo */}
        {cable("izq")}
        {cable("der")}

        {/* bokeh: luces fuera de foco */}
        <g filter="url(#m2-bk)">
          {bokeh.map((b, i) => (
            <circle key={i} cx={b.x} cy={b.y} r={b.r} fill={b.c} opacity={b.o} style={{ animation: `m2f ${3 + (i % 4)}s ${b.d}s infinite` }} />
          ))}
        </g>

        {/* rayo de luz */}
        <polygon points="1180,40 1330,40 980,540 760,540" fill="url(#m2-haz)" />

        {/* neblina que se mueve */}
        <g style={{ animation: "m2n 16s ease-in-out infinite alternate" }}>
          <rect x="-200" y="300" width="2000" height="140" fill="url(#m2-niebla)" />
          <rect x="-200" y="400" width="2000" height="110" fill="url(#m2-niebla)" opacity="0.7" />
        </g>

        {/* telas colgadas en primer plano, fuera de foco */}
        <g filter="url(#m2-fg)" fill="#04020a" opacity="0.95">
          <polygon points="-40,60 300,60 240,200 110,320 -40,260" />
          <polygon points="1640,60 1330,60 1400,210 1520,330 1640,280" />
          <rect x="560" y="40" width="480" height="30" />
        </g>
      </svg>
      {/* gradación de color: sombras azuladas, luces cálidas */}
      <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 45%, rgba(10,20,50,0) 20%, rgba(10,20,50,0.55) 100%)" }} />
    </div>
  );
}

function Escena3() {
  // la carretera con tres puentes de control, vista desde el mototaxi
  const puentes = [
    { y: 392, w: 120, c: "#5eead4" },
    { y: 352, w: 230, c: "#fbbf24" },
    { y: 292, w: 400, c: "#ff7a3d" },
  ];
  return (
    <div
      className="absolute inset-0"
      style={{ background: "linear-gradient(to bottom, #0a0f2c 0%, #2b2a6b 40%, #c2527c 72%, #ffb070 100%)" }}
    >
      <style>{`
        @keyframes raya { from { stroke-dashoffset: 0 } to { stroke-dashoffset: -120 } }
        @keyframes pulso { 0%,100%{opacity:.55} 50%{opacity:1} }
      `}</style>
      <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 h-full w-full">
        <defs>
          <linearGradient id="asfalto" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#2a2340" />
            <stop offset="1" stopColor="#07050f" />
          </linearGradient>
          <radialGradient id="sol3">
            <stop offset="0" stopColor="#fff4cf" />
            <stop offset="0.35" stopColor="#ffcf8a" stopOpacity="0.8" />
            <stop offset="1" stopColor="#ff9a5a" stopOpacity="0" />
          </radialGradient>
        </defs>
        <g transform="translate(0 -165)">
        <circle cx="800" cy="410" r="190" fill="url(#sol3)" />
        <polygon points="0,430 200,360 380,420 560,340 700,410 900,350 1100,420 1300,350 1500,410 1600,380 1600,440 0,440" fill="#3a1f55" />
        <polygon points="0,440 1600,440 1600,1300 0,1300" fill="#1a0f2e" />
        {/* carretera en perspectiva */}
        <polygon points="760,440 840,440 1787,1100 -187,1100" fill="url(#asfalto)" />
        <line x1="760" y1="440" x2="-187" y2="1100" stroke="#ffd9a0" strokeWidth="5" opacity="0.8" />
        <line x1="840" y1="440" x2="1787" y2="1100" stroke="#ffd9a0" strokeWidth="5" opacity="0.8" />
        <line x1="800" y1="440" x2="800" y2="1100" stroke="#ffe7b0" strokeWidth="10" strokeDasharray="34 86" style={{ animation: "raya 0.8s linear infinite" }} />
        {/* puentes de control */}
        {puentes.map((p, i) => {
          const ancho = p.w;
          const izq = 800 - ancho / 2;
          return (
            <g key={i} style={{ animation: `pulso ${1.8 + i * 0.4}s ${i * 0.3}s infinite` }}>
              <rect x={izq - 6} y={p.y} width="10" height={440 - p.y + 60 + i * 20} fill="#0b0816" />
              <rect x={izq + ancho - 4} y={p.y} width="10" height={440 - p.y + 60 + i * 20} fill="#0b0816" />
              <rect x={izq - 14} y={p.y - 12} width={ancho + 28} height="18" fill="#0b0816" />
              <rect x={izq - 14} y={p.y - 14} width={ancho + 28} height="3" fill={p.c} />
              <rect x={800 - 24 - i * 4} y={p.y + 8} width={48 + i * 8} height={6 + i * 2} fill={p.c} opacity="0.9" />
              <circle cx={800} cy={p.y + 11} r={30 + i * 14} fill={p.c} opacity="0.1" />
            </g>
          );
        })}
        {/* nuestro mototaxi, de espaldas */}
        <g fill="#06020d" transform="translate(800 635)">
          <ellipse cx="0" cy="62" rx="76" ry="10" opacity="0.5" />
          <rect x="-58" y="-34" width="116" height="62" rx="16" />
          <rect x="-48" y="-62" width="96" height="34" rx="10" />
          <rect x="-34" y="-52" width="68" height="18" rx="4" fill="#2b2a6b" />
          <rect x="-66" y="28" width="22" height="40" rx="6" />
          <rect x="44" y="28" width="22" height="40" rx="6" />
          <rect x="-44" y="-6" width="16" height="9" rx="2" fill="#ff3b3b" />
          <rect x="28" y="-6" width="16" height="9" rx="2" fill="#ff3b3b" />
        </g>
        </g>
      </svg>
    </div>
  );
}

/* Si existe la foto (public/intro/escenaN.jpg) se usa encima del dibujo; si no, se ve el dibujo. */
function ConFoto({ n, zoom, sube, children }: { n: number; zoom: number; sube: number; children: ReactNode }) {
  const [ok, setOk] = useState(true);
  return (
    <>
      {children}
      {ok && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/intro/escena${n}.jpg`}
          alt=""
          onError={() => setOk(false)}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ objectPosition: "55% 50%", transform: `translateY(-${sube}%) scale(${zoom})` }}
          draggable={false}
        />
      )}
    </>
  );
}

const FONDOS = [
  <ConFoto key="a" n={1} zoom={1.15} sube={30}><Escena1 /></ConFoto>,
  <ConFoto key="b" n={2} zoom={1.05} sube={10}><Escena2 /></ConFoto>,
  <ConFoto key="c" n={3} zoom={1.0} sube={7}><Escena3 /></ConFoto>,
];

function Titulo({ alTerminar }: { alTerminar: () => void }) {
  const [ver, setVer] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setVer(true), 100);
    const tecla = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "Enter" || e.code === "Escape") {
        e.preventDefault();
        alTerminar();
      }
    };
    window.addEventListener("keydown", tecla);
    return () => {
      clearTimeout(id);
      window.removeEventListener("keydown", tecla);
    };
  }, [alTerminar]);

  const aparece = (ms: number) => ({
    opacity: ver ? 1 : 0,
    transform: ver ? "translateY(0)" : "translateY(18px)",
    transition: `opacity 900ms ease ${ms}ms, transform 900ms ease ${ms}ms`,
  });

  return (
    <div
      className="absolute inset-0 z-20 flex cursor-pointer select-none flex-col items-center justify-center overflow-hidden text-center"
      onClick={alTerminar}
      style={{ background: "radial-gradient(ellipse at center, rgba(5,6,16,0.35), rgba(3,4,10,0.94))" }}
    >
      <style>{`
        @keyframes brillo { 0% { background-position: 130% 0, 0 0 } 60%,100% { background-position: -60% 0, 0 0 } }
        @keyframes glitch {
          0%,92%,100% { transform: translate(0,0); text-shadow: none }
          93% { transform: translate(-4px,1px); text-shadow: 4px 0 #22d3ee, -4px 0 #ff3d6e }
          95% { transform: translate(4px,-2px); text-shadow: -4px 0 #22d3ee, 4px 0 #ff3d6e }
          97% { transform: translate(-2px,0); text-shadow: 2px 0 #22d3ee, -2px 0 #ff3d6e }
        }
        @keyframes velo { from { stroke-dashoffset: 0 } to { stroke-dashoffset: -400 } }
      `}</style>

      {/* líneas de velocidad */}
      <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-40" preserveAspectRatio="none" viewBox="0 0 100 100">
        {Array.from({ length: 16 }, (_, i) => (
          <line
            key={i}
            x1={4 + i * 6.3}
            x2={4 + i * 6.3 + 14}
            y1={10 + ((i * 29) % 80)}
            y2={10 + ((i * 29) % 80)}
            stroke={i % 3 === 0 ? "#ff7a3d" : "#5eead4"}
            strokeWidth="0.25"
            strokeDasharray="14 30"
            style={{ animation: `velo ${1.2 + (i % 5) * 0.3}s linear infinite` }}
          />
        ))}
      </svg>

      {/* esquinas */}
      {["left-5 top-5 border-l border-t", "right-5 top-5 border-r border-t", "bottom-5 left-5 border-b border-l", "bottom-5 right-5 border-b border-r"].map((c) => (
        <span key={c} className={`pointer-events-none absolute h-8 w-8 border-[#5eead4]/60 ${c}`} />
      ))}

      {/* autor: pequeño y discreto, a un costado */}
      <p
        className="pointer-events-none absolute bottom-[5.2rem] left-10 text-[10px] uppercase tracking-[0.3em] text-white/40"
        style={{ fontFamily: JET, ...aparece(1500) }}
      >
        Aldahir Silva
      </p>

      <p className="mb-5 text-[11px] uppercase tracking-[0.55em]" style={{ color: "#5eead4", fontFamily: JET, ...aparece(100) }}>
        Primer Hackathon · Huánuco 2026
      </p>

      <div className="relative" style={aparece(300)}>
        <h1
          className="relative overflow-hidden text-8xl font-extrabold tracking-tight sm:text-[10rem]"
          style={{
            fontFamily: "var(--font-unbounded)",
            backgroundImage:
              "linear-gradient(105deg, transparent 42%, rgba(255,255,255,0.95) 50%, transparent 58%), linear-gradient(180deg, #fff6df 0%, #ffb15c 55%, #ff5a1f 100%)",
            backgroundSize: "250% 100%, 100% 100%",
            backgroundRepeat: "no-repeat",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            filter: "drop-shadow(0 0 28px rgba(255,122,61,0.45))",
            animation: "glitch 5s infinite, brillo 3.6s ease-in-out 1.2s infinite",
            lineHeight: 1,
          }}
        >
          APEX
        </h1>
      </div>

      <div className="mt-3 flex items-center gap-3" style={aparece(550)}>
        <span className="h-px w-16 bg-gradient-to-r from-transparent to-[#5eead4]" />
        <p className="text-xs uppercase tracking-[0.4em] text-white/85" style={{ fontFamily: JET }}>
          Carrera de decisiones
        </p>
        <span className="h-px w-16 bg-gradient-to-l from-transparent to-[#5eead4]" />
      </div>

      <p className="mt-7 max-w-md px-6 text-base text-white/80 sm:text-lg" style={{ fontFamily: BRIC, ...aparece(750) }}>
        Esquiva, decide y llega con tu mercadería a salvo. Cultura tributaria y aduanera, a toda velocidad.
      </p>

      <div
        className="mt-12 flex items-center gap-3 rounded-full border border-[#ff7a3d]/60 bg-[#ff7a3d]/10 px-6 py-3 transition hover:bg-[#ff7a3d]/25"
        style={{ fontFamily: JET, ...aparece(1000) }}
      >
        <span className="animate-pulse text-[11px] uppercase tracking-[0.3em] text-white">Pulsa para comenzar</span>
      </div>
    </div>
  );
}

export default function Intro({ alTerminar }: { alTerminar: () => void }) {
  const [titulo, setTitulo] = useState(false);

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-black">
      {titulo ? (
        <>
          <div className="absolute inset-0">{FONDOS[2]}</div>
          <Titulo alTerminar={alTerminar} />
        </>
      ) : (
        <Historia
          escenas={ESCENAS}
          fondos={FONDOS}
          locutor="VOZ DE LA RUTA"
          hora={[4, 50, 12]}
          alTerminar={() => setTitulo(true)}
          alSaltar={alTerminar}
        />
      )}
    </main>
  );
}
