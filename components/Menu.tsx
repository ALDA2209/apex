"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import type { Group } from "three";
import Piloto from "./Piloto";
import { CASCOS, COLORES, PIELES, type Perfil } from "@/lib/perfil";
import { NIVELES, type Nivel } from "@/lib/niveles";

type Props = {
  perfil: Perfil;
  alCambiar: (p: Perfil) => void;
  alJugar: () => void;
  nivel: Nivel;
  alNivel: (n: Nivel) => void;
};

function Vitrina({ perfil }: { perfil: Perfil }) {
  const giro = useRef<Group>(null);
  useFrame((_, delta) => {
    if (giro.current) giro.current.rotation.y += delta * 0.5;
  });

  return (
    <>
      <group ref={giro} position={[0, 0.08, 0]}>
        <Piloto perfil={perfil} />
      </group>
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[2.3, 2.4, 0.08, 64]} />
        <meshStandardMaterial color="#141a33" metalness={0.6} roughness={0.35} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.07, 0]}>
        <ringGeometry args={[2.1, 2.2, 96]} />
        <meshStandardMaterial color="#000000" emissive={perfil.color} emissiveIntensity={2.5} />
      </mesh>
    </>
  );
}

const ETIQUETA = "font-mono text-[11px] uppercase tracking-[0.24em] text-tenue";

export default function Menu({ perfil, alCambiar, alJugar, nivel, alNivel }: Props) {
  const valido = perfil.nombre.trim().length >= 2;

  return (
    <div className="fondo-menu grid min-h-screen w-screen md:grid-cols-[minmax(380px,480px)_1fr]">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (valido) alJugar();
        }}
        className="relative z-10 flex flex-col justify-center gap-9 px-7 py-10 md:px-14"
      >
        <header className="anim-subir">
          <p className="font-mono text-[11px] uppercase tracking-[0.32em] text-menta">
            Cultura tributaria y aduanera
          </p>
          <h1 className="mt-3 font-display text-6xl font-bold leading-none tracking-tight">APEX</h1>
          <p className="mt-3 max-w-xs text-[15px] leading-relaxed text-tenue">
            Conduce, decide y cumple. Cada decisión en la pista tiene consecuencias.
          </p>
        </header>

        <label className="anim-subir block" style={{ animationDelay: "80ms" }}>
          <span className={ETIQUETA}>Nombre de piloto</span>
          <input
            value={perfil.nombre}
            onChange={(e) => alCambiar({ ...perfil, nombre: e.target.value })}
            maxLength={16}
            placeholder="Escribe tu nombre"
            autoComplete="off"
            spellCheck={false}
            className="mt-2 w-full border-0 border-b border-white/20 bg-transparent pb-2 text-2xl font-medium outline-none placeholder:text-white/25 focus:border-acento"
          />
        </label>

        <div className="anim-subir" style={{ animationDelay: "160ms" }}>
          <p className={ETIQUETA}>Color del kart</p>
          <div className="mt-3 flex gap-3">
            {COLORES.map((c) => {
              const activo = perfil.color === c.valor;
              return (
                <button
                  key={c.valor}
                  type="button"
                  aria-label={c.nombre}
                  title={c.nombre}
                  onClick={() => alCambiar({ ...perfil, color: c.valor })}
                  className={`h-9 w-9 rounded-full transition ${
                    activo
                      ? "scale-110 ring-2 ring-white ring-offset-2 ring-offset-[#0c1229]"
                      : "opacity-80 hover:opacity-100"
                  }`}
                  style={{ backgroundColor: c.valor }}
                />
              );
            })}
          </div>
        </div>

        <div className="anim-subir" style={{ animationDelay: "200ms" }}>
          <p className={ETIQUETA}>Tono de piel</p>
          <div className="mt-3 flex gap-3">
            {PIELES.map((p, i) => (
              <button
                key={p.valor}
                type="button"
                aria-label={p.nombre}
                title={p.nombre}
                onClick={() => alCambiar({ ...perfil, piel: i })}
                className={`h-9 w-9 rounded-full transition ${
                  perfil.piel === i
                    ? "scale-110 ring-2 ring-white ring-offset-2 ring-offset-[#0c1229]"
                    : "opacity-80 hover:opacity-100"
                }`}
                style={{ backgroundColor: p.valor }}
              />
            ))}
          </div>
        </div>

        <div className="anim-subir" style={{ animationDelay: "240ms" }}>
          <p className={ETIQUETA}>Casco</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {CASCOS.map((nombre, i) => (
              <button
                key={nombre}
                type="button"
                onClick={() => alCambiar({ ...perfil, casco: i })}
                className={`rounded-xl border px-3 py-3 text-sm transition ${
                  perfil.casco === i
                    ? "border-acento bg-acento/15 text-white"
                    : "border-white/10 text-tenue hover:border-white/30 hover:text-white"
                }`}
              >
                {nombre}
              </button>
            ))}
          </div>
        </div>

        <div className="anim-subir" style={{ animationDelay: "280ms" }}>
          <p className={ETIQUETA}>Nivel</p>
          <div className="mt-3 flex flex-col gap-2">
            {NIVELES.map((n) => (
              <button
                key={n.n}
                type="button"
                onClick={() => alNivel(n.n)}
                aria-pressed={nivel === n.n}
                className={`rounded-xl border px-4 py-2.5 text-left transition ${
                  nivel === n.n
                    ? "border-acento bg-acento/15 text-white"
                    : "border-white/10 text-tenue hover:border-white/30 hover:text-white"
                }`}
              >
                <span className="block text-sm font-semibold">{n.nombre}</span>
                <span className="block text-[12px] opacity-70">{n.detalle}</span>
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={!valido}
          className="anim-subir group flex items-center justify-between rounded-2xl bg-acento px-6 py-4 text-left font-semibold text-[#1a0d05] transition enabled:hover:brightness-110 enabled:active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
          style={{ animationDelay: "320ms" }}
        >
          <span>{valido ? "Entrar a la pista" : "Escribe tu nombre para entrar"}</span>
          <span className="font-mono text-sm opacity-70 transition group-hover:translate-x-1">→</span>
        </button>

        <p className="font-mono text-[11px] text-tenue/80">A · D o ← → para cambiar de carril</p>
      </form>

      <section className="relative min-h-[46vh] md:min-h-screen">
        <Canvas camera={{ position: [4.4, 2.8, 5.6], fov: 38 }} dpr={[1, 2]}>
          <hemisphereLight args={["#9a7bff", "#1a1030", 1.1]} />
          <directionalLight position={[3, 5, 2]} intensity={2.2} color="#ffb27a" />
          <directionalLight position={[-4, 3, -3]} intensity={1.4} color="#6d7bff" />
          <Vitrina perfil={perfil} />
        </Canvas>
        <p className="pointer-events-none absolute bottom-6 right-8 font-mono text-[11px] uppercase tracking-[0.3em] text-white/40">
          Vista previa
        </p>
      </section>
    </div>
  );
}
