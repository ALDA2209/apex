"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { callar, hablar, tic, whoosh } from "@/lib/audio";

const JET = "var(--font-jetbrains)";
const BRIC = "var(--font-bricolage)";

export type EscenaTexto = { lugar: string; texto: string };

/* Reloj de la esquina: arranca a una hora y avanza en vivo. */
function Reloj({ inicio }: { inicio: [number, number, number] }) {
  const [seg, setSeg] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setSeg((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const total = inicio[0] * 3600 + inicio[1] * 60 + inicio[2] + seg;
  const f = (n: number) => String(n % 60).padStart(2, "0");
  return (
    <span>
      {f(Math.floor(total / 3600))}:{f(Math.floor(total / 60))}:{f(total)}
    </span>
  );
}

/* Cinemática: franjas de cine, textura de película, panel de transmisión con voz y texto que se escribe. */
export default function Historia({
  escenas,
  alTerminar,
  alSaltar,
  fondos,
  locutor = "VOZ DE LA RUTA",
  hora = [4, 50, 12],
}: {
  escenas: EscenaTexto[];
  alTerminar: () => void;
  alSaltar?: () => void;
  /** un fondo por escena (si no hay, se ve la escena 3D de atrás) */
  fondos?: ReactNode[];
  locutor?: string;
  hora?: [number, number, number];
}) {
  const [n, setN] = useState(0);
  const [letras, setLetras] = useState(0);
  const [entra, setEntra] = useState(false);

  const escena = escenas[n];
  const largo = escena.texto.length;
  const completo = letras >= largo;
  const ultima = n === escenas.length - 1;
  const saltar = alSaltar ?? alTerminar;

  useEffect(() => {
    const id = setTimeout(() => setEntra(true), 80);
    return () => clearTimeout(id);
  }, []);

  // se escribe letra por letra, con un "tic" suave
  useEffect(() => {
    if (completo) return;
    const id = setTimeout(
      () => {
        setLetras((v) => v + 1);
        if (letras % 3 === 0) tic();
      },
      escena.texto[letras] === "." || escena.texto[letras] === "," ? 140 : 26,
    );
    return () => clearTimeout(id);
  }, [letras, completo, escena.texto]);

  // la voz lee cada escena
  useEffect(() => {
    const id = setTimeout(() => hablar(escena.texto, "narrador"), 350);
    return () => {
      clearTimeout(id);
      callar();
    };
  }, [n, escena.texto]);

  const avanzar = useCallback(() => {
    if (!completo) {
      setLetras(largo);
      return;
    }
    if (ultima) {
      callar();
      alTerminar();
      return;
    }
    whoosh();
    setN((v) => v + 1);
    setLetras(0);
  }, [completo, largo, ultima, alTerminar]);

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if (e.code === "Escape") {
        callar();
        saltar();
        return;
      }
      if (e.code === "Space" || e.code === "Enter" || e.code === "ArrowRight") {
        e.preventDefault();
        avanzar();
      }
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [avanzar, saltar]);

  return (
    <div className="absolute inset-0 z-20 cursor-pointer select-none overflow-hidden" onClick={avanzar}>
      <style>{`
        @keyframes cine-kb { from { transform: scale(1) translate3d(0,0,0); } to { transform: scale(1.14) translate3d(-1.5%, -1%, 0); } }
        @keyframes cine-grano { 0%{transform:translate(0,0)} 20%{transform:translate(-3%,2%)} 40%{transform:translate(2%,-3%)} 60%{transform:translate(-2%,-1%)} 80%{transform:translate(3%,3%)} 100%{transform:translate(0,0)} }
        @keyframes cine-onda { 0%,100%{ transform: scaleY(0.25) } 50%{ transform: scaleY(1) } }
        @keyframes cine-radar { to { transform: rotate(360deg) } }
        @keyframes cine-parpadeo { 0%,49%{opacity:1} 50%,100%{opacity:0.15} }
      `}</style>

      {/* fondos por escena, con cruce suave y cámara lenta */}
      {fondos && (
        <div className="absolute inset-0 bg-black">
          {fondos.map((f, i) => (
            <div
              key={i}
              className="absolute inset-0"
              style={{ opacity: i === n ? 1 : 0, transition: "opacity 1100ms ease" }}
            >
              <div
                key={i === n ? "on" + n : "off" + i}
                className="absolute inset-0"
                style={{
                  animation: i === n ? "cine-kb 26s linear forwards" : "none",
                  transformOrigin: ["50% 70%", "30% 60%", "50% 55%"][i % 3],
                }}
              >
                {f}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* textura de película + líneas de monitor + viñeta */}
      <div
        className="pointer-events-none absolute -inset-[10%] opacity-[0.07] mix-blend-overlay"
        style={{
          animation: "cine-grano 0.6s steps(2) infinite",
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage: "repeating-linear-gradient(to bottom, rgba(0,0,0,0) 0 2px, rgba(0,0,0,0.35) 2px 3px)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(0,0,0,0) 45%, rgba(0,0,0,0.65) 100%), linear-gradient(to top, rgba(4,5,12,0.9) 0%, rgba(4,5,12,0.45) 32%, rgba(4,5,12,0) 60%)",
        }}
      />

      {/* franjas de cine */}
      {["top", "bottom"].map((lado) => (
        <div
          key={lado}
          className="pointer-events-none absolute inset-x-0 bg-black"
          style={{
            [lado]: 0,
            height: entra ? "8.5vh" : "50vh",
            transition: "height 1400ms cubic-bezier(0.2,0.8,0.2,1)",
          }}
        />
      ))}

      {/* HUD de transmisión */}
      <div
        className="pointer-events-none absolute inset-x-0 flex items-center justify-between px-5 text-[10px] uppercase tracking-[0.28em] text-white/70"
        style={{ top: "calc(8.5vh + 0.9rem)", fontFamily: JET, opacity: entra ? 1 : 0, transition: "opacity 900ms ease 900ms" }}
      >
        <span className="flex items-center gap-2">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ background: "#f43f5e", boxShadow: "0 0 8px #f43f5e", animation: "cine-parpadeo 1.2s infinite" }}
          />
          Transmisión en vivo
        </span>
        <span className="text-white/80">
          <Reloj inicio={hora} />
        </span>
      </div>

      {/* capítulos */}
      <div
        className="pointer-events-none absolute left-1/2 flex -translate-x-1/2 gap-1.5"
        style={{ top: "calc(8.5vh + 2.6rem)" }}
      >
        {escenas.map((_, i) => (
          <span
            key={i}
            className="h-[3px] w-10 rounded-full"
            style={{
              background: i < n ? "#ff7a3d" : i === n ? "rgba(255,122,61,0.9)" : "rgba(255,255,255,0.22)",
              boxShadow: i === n ? "0 0 10px rgba(255,122,61,0.8)" : "none",
              transition: "background 400ms ease",
            }}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          callar();
          saltar();
        }}
        className="absolute right-5 rounded-full border border-white/15 bg-black/50 px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-white/80 backdrop-blur hover:text-white"
        style={{ top: "calc(8.5vh + 3.6rem)", fontFamily: JET }}
      >
        Saltar
      </button>

      {/* panel de transmisión: emblema que escanea + texto */}
      <div className="absolute inset-x-0 flex justify-center px-4" style={{ bottom: "calc(8.5vh + 1rem)" }}>
        <div
          className="flex w-full max-w-4xl gap-4 p-4 sm:gap-5 sm:p-5"
          style={{
            background: "linear-gradient(135deg, rgba(8,14,28,0.9), rgba(6,10,20,0.78))",
            border: "1px solid rgba(94,234,212,0.28)",
            clipPath: "polygon(0 0, calc(100% - 22px) 0, 100% 22px, 100% 100%, 22px 100%, 0 calc(100% - 22px))",
            boxShadow: "0 0 40px rgba(94,234,212,0.08)",
            backdropFilter: "blur(6px)",
            transform: entra ? "translateY(0)" : "translateY(30px)",
            opacity: entra ? 1 : 0,
            transition: "transform 900ms ease 700ms, opacity 900ms ease 700ms",
          }}
        >
          <div className="flex shrink-0 flex-col items-center gap-2">
            <div
              className="relative h-16 w-16 overflow-hidden rounded-full sm:h-24 sm:w-24"
              style={{
                border: "1px solid rgba(94,234,212,0.5)",
                background: "radial-gradient(circle, rgba(94,234,212,0.14), rgba(94,234,212,0.02) 70%)",
              }}
            >
              {[0.35, 0.65, 0.95].map((r) => (
                <span
                  key={r}
                  className="absolute left-1/2 top-1/2 rounded-full"
                  style={{
                    width: r * 100 + "%",
                    height: r * 100 + "%",
                    transform: "translate(-50%,-50%)",
                    border: "1px solid rgba(94,234,212,0.28)",
                  }}
                />
              ))}
              <span
                className="absolute inset-0"
                style={{
                  background: "conic-gradient(from 0deg, rgba(94,234,212,0.55), rgba(94,234,212,0) 28%)",
                  animation: "cine-radar 3s linear infinite",
                }}
              />
              <span className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#ff7a3d]" />
            </div>
            <div className="flex h-5 items-end gap-[3px]">
              {[0, 1, 2, 3, 4, 5, 6].map((b) => (
                <span
                  key={b}
                  className="w-[3px] origin-bottom rounded-sm bg-[#5eead4]"
                  style={{
                    height: "100%",
                    transform: completo ? "scaleY(0.15)" : undefined,
                    animation: completo ? "none" : `cine-onda ${0.5 + (b % 4) * 0.13}s ease-in-out ${b * 0.07}s infinite`,
                    opacity: completo ? 0.4 : 1,
                  }}
                />
              ))}
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <p className="flex items-center justify-between gap-3 text-[10px] uppercase tracking-[0.28em]" style={{ fontFamily: JET }}>
              <span style={{ color: "#5eead4" }}>{locutor}</span>
              <span className="text-white/45">{escena.lugar}</span>
            </p>
            <p
              className="mt-2 min-h-[5.5rem] text-lg leading-relaxed text-white sm:min-h-[6.5rem] sm:text-2xl"
              style={{ fontFamily: BRIC }}
            >
              {escena.texto.slice(0, letras)}
              <span
                className="ml-0.5 inline-block h-[1.05em] w-[2px] translate-y-[0.15em] bg-[#ff7a3d]"
                style={{ animation: "cine-parpadeo 0.9s infinite" }}
              />
            </p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="text-[10px] text-white/35" style={{ fontFamily: BRIC }}>
                Historia ficticia con fines educativos.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
