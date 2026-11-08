"use client";

import { useTactil } from "@/components/Tactil";
import { useEffect, useRef, useState } from "react";
import { ctxAudio, salidaEfectos } from "@/lib/audio";
import { estacionar, estado, useFase } from "@/lib/estado";

const JET = "var(--font-jetbrains)";
const TURBO = 2.1;

type Bocina = { ctx: AudioContext; g: GainNode; osc: OscillatorNode[] };

function crearBocina(): Bocina | null {
  try {
    const ctx = ctxAudio();
    const sal = salidaEfectos();
    if (!ctx || !sal) return null;
    const g = ctx.createGain();
    g.gain.value = 0;
    const filtro = ctx.createBiquadFilter();
    filtro.type = "lowpass";
    filtro.frequency.value = 1800;
    g.connect(filtro);
    filtro.connect(sal);
    const osc = [415, 523].map((hz) => {
      const o = ctx.createOscillator();
      o.type = "sawtooth";
      o.frequency.value = hz;
      o.connect(g);
      o.start();
      return o;
    });
    return { ctx, g, osc };
  } catch {
    return null;
  }
}

function Tecla({ etiqueta, activa }: { etiqueta: string; activa: boolean }) {
  return (
    <span
      className="flex h-8 min-w-8 items-center justify-center rounded-md border px-2 text-xs font-bold transition"
      style={{
        fontFamily: JET,
        background: activa ? "#ff7a3d" : "rgba(255,255,255,0.08)",
        color: activa ? "#1a0d05" : "#fff",
        borderColor: activa ? "#ff7a3d" : "rgba(255,255,255,0.2)",
        boxShadow: activa ? "0 0 14px rgba(255,122,61,0.6)" : "none",
        transform: activa ? "translateY(1px)" : "none",
      }}
    >
      {etiqueta}
    </span>
  );
}

function Grupo({ children, texto }: { children: React.ReactNode; texto: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1">{children}</div>
      <span className="text-[10px] uppercase tracking-[0.22em] text-white/70" style={{ fontFamily: JET }}>
        {texto}
      </span>
    </div>
  );
}

export default function Controles() {
  const fase = useFase();
  const tactil = useTactil();
  const [w, setW] = useState(false);
  const [h, setH] = useState(false);
  const [a, setA] = useState(false);
  const [d, setD] = useState(false);
  const wRef = useRef(false);
  const bocina = useRef<Bocina | null>(null);

  useEffect(() => {
    const tocar = (sube: boolean) => {
      if (!bocina.current) bocina.current = crearBocina();
      const b = bocina.current;
      if (!b) return;
      void b.ctx.resume();
      const t = b.ctx.currentTime;
      b.g.gain.cancelScheduledValues(t);
      b.g.gain.setTargetAtTime(sube ? 0.16 : 0, t, sube ? 0.01 : 0.04);
    };
    const abajo = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.code === "KeyW" || e.code === "ArrowUp") {
        wRef.current = true;
        setW(true);
      }
      if (e.code === "KeyH") {
        tocar(true);
        setH(true);
        estado.bocinaT = performance.now();
      }
      if (e.code === "KeyR") estacionar();
      if (e.code === "KeyA" || e.code === "ArrowLeft") setA(true);
      if (e.code === "KeyD" || e.code === "ArrowRight") setD(true);
    };
    const arriba = (e: KeyboardEvent) => {
      if (e.code === "KeyW" || e.code === "ArrowUp") {
        wRef.current = false;
        setW(false);
      }
      if (e.code === "KeyH") {
        tocar(false);
        setH(false);
      }
      if (e.code === "KeyA" || e.code === "ArrowLeft") setA(false);
      if (e.code === "KeyD" || e.code === "ArrowRight") setD(false);
    };
    const soltarTodo = () => {
      wRef.current = false;
      setW(false);
      setH(false);
      setA(false);
      setD(false);
      if (bocina.current) tocar(false);
    };
    window.addEventListener("keydown", abajo);
    window.addEventListener("keyup", arriba);
    window.addEventListener("blur", soltarTodo);
    return () => {
      window.removeEventListener("keydown", abajo);
      window.removeEventListener("keyup", arriba);
      window.removeEventListener("blur", soltarTodo);
      if (bocina.current) {
        bocina.current.osc.forEach((o) => {
          try {
            o.stop();
          } catch {}
        });
        bocina.current = null;
      }
    };
  }, []);

  useEffect(() => {
    let raf = 0;
    let antes = performance.now();
    const paso = (t: number) => {
      const dt = Math.min(0.05, (t - antes) / 1000);
      antes = t;
      const meta = wRef.current && estado.fase === "libre" && estado.activo ? TURBO : 1;
      estado.turbo += (meta - estado.turbo) * Math.min(1, dt * 4);
      raf = requestAnimationFrame(paso);
    };
    raf = requestAnimationFrame(paso);
    return () => {
      cancelAnimationFrame(raf);
      estado.turbo = 1;
    };
  }, []);

  if (fase !== "libre" || tactil) return null;

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-5 z-10 flex justify-center px-4">
      <div className="flex flex-wrap items-center justify-center gap-x-7 gap-y-2 rounded-full border border-white/10 bg-black/45 px-6 py-3 backdrop-blur">
        <Grupo texto="Carril">
          <Tecla etiqueta="A" activa={a} />
          <Tecla etiqueta="D" activa={d} />
        </Grupo>
        <Grupo texto="Acelerar">
          <Tecla etiqueta="W" activa={w} />
        </Grupo>
        <Grupo texto="Bocina">
          <Tecla etiqueta="H" activa={h} />
        </Grupo>
        <Grupo texto="Arrastrar · mirar">
          <Tecla etiqueta="Mouse" activa={false} />
        </Grupo>
        <Grupo texto="Estacionar y reparar">
          <Tecla etiqueta="R" activa={false} />
        </Grupo>
      </div>
    </div>
  );
}
