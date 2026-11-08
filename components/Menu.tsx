"use client";

import { useEffect, useRef } from "react";
import type { MutableRefObject } from "react";
import Avatar from "./Avatar";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Vector3, type Group } from "three";
import Piloto from "./Piloto";
import { AVATARES, AVATAR_REAL, BARBAS, CASCOS, COLORES, LENTES, MOTOS, PIELES, SIN_CASCO, type Perfil } from "@/lib/perfil";
import { NIVELES, type Nivel } from "@/lib/niveles";

type Props = {
  perfil: Perfil;
  alCambiar: (p: Perfil) => void;
  alJugar: () => void;
  nivel: Nivel;
  alNivel: (n: Nivel) => void;
};

const ZOOM_MIN = 7;
const ZOOM_MAX = 15;
type ApiZoom = { mas: () => void; menos: () => void };

/* Deja listos los botones + y − para acercar o alejar la cámara */
function ZoomBotones({ api }: { api: MutableRefObject<ApiZoom | null> }) {
  const { camera, controls } = useThree();
  useEffect(() => {
    const mover = (factor: number) => {
      const c = controls as unknown as { target?: Vector3; update?: () => void } | null;
      const objetivo = c?.target ?? new Vector3();
      const d = camera.position.clone().sub(objetivo);
      d.setLength(Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, d.length() * factor)));
      camera.position.copy(objetivo).add(d);
      c?.update?.();
    };
    api.current = { mas: () => mover(0.78), menos: () => mover(1.28) };
    return () => {
      api.current = null;
    };
  }, [camera, controls, api]);
  return null;
}

function Vitrina({ perfil }: { perfil: Perfil }) {
  const moto = useRef<Group>(null);
  const quieto = useRef(0);

  return (
    <>
      <group ref={moto} position={[-0.9, 0.08, 0.3]} rotation={[0, -2.45, 0]}>
        <Piloto perfil={perfil} vacio />
      </group>
      {/* el personaje, de pie junto al mototaxi */}
      <group position={[1.7, 0.08, 0.6]} rotation={[0, 2.75, 0]} scale={1.12}>
        <Avatar perfil={perfil} marcha={quieto} casco={perfil.casco === SIN_CASCO ? undefined : perfil.casco} />
      </group>
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[3.3, 3.4, 0.08, 64]} />
        <meshStandardMaterial color="#141a33" metalness={0.6} roughness={0.35} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.07, 0]}>
        <ringGeometry args={[3.1, 3.2, 96]} />
        <meshStandardMaterial color="#000000" emissive={perfil.color} emissiveIntensity={2.5} />
      </mesh>
    </>
  );
}

const ORDEN_AVATARES = [AVATAR_REAL, 0, 1, 2];

const ETIQUETA = "font-mono text-[11px] uppercase tracking-[0.24em] text-tenue";

export default function Menu({ perfil, alCambiar, alJugar, nivel, alNivel }: Props) {
  const valido = perfil.nombre.trim().length >= 2;
  const zoom = useRef<ApiZoom | null>(null);

  // teclas + y − para acercar o alejar (si no estás escribiendo el nombre)
  useEffect(() => {
    const alTeclear = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement | null)?.tagName === "INPUT") return;
      if (e.key === "+" || e.key === "=") zoom.current?.mas();
      if (e.key === "-" || e.key === "_") zoom.current?.menos();
    };
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, []);

  return (
    <div className="fondo-menu flex min-h-screen w-full max-w-full flex-col overflow-x-clip md:grid md:grid-cols-[minmax(380px,480px)_1fr]">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (valido) alJugar();
        }}
        className="relative z-10 flex min-w-0 flex-col justify-center gap-6 px-5 py-8 sm:gap-7 sm:px-7 sm:py-10 md:px-14"
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

        <div className="anim-subir" style={{ animationDelay: "120ms" }}>
          <p className={ETIQUETA}>Personaje</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {ORDEN_AVATARES.map((i) => {
              const a = AVATARES[i];
              return (
              <button
                key={a.nombre}
                type="button"
                onClick={() => alCambiar({ ...perfil, avatar: i })}
                aria-pressed={(perfil.avatar ?? 0) === i}
                className={`min-w-0 rounded-xl border px-2.5 py-2.5 text-left transition sm:px-3 ${
                  (perfil.avatar ?? 0) === i
                    ? "border-acento bg-acento/15 text-white"
                    : "border-white/10 text-tenue hover:border-white/30 hover:text-white"
                }`}
              >
                <span className="block text-sm font-semibold">{a.nombre}</span>
                <span className="block text-[11px] opacity-70">{a.detalle}</span>
              </button>
              );
            })}
          </div>
        </div>

        <div className="anim-subir" style={{ animationDelay: "140ms" }}>
          <p className={ETIQUETA}>Mototaxi</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {MOTOS.map((m, i) => (
              <button
                key={m.nombre}
                type="button"
                onClick={() => alCambiar({ ...perfil, moto: i })}
                aria-pressed={(perfil.moto ?? 0) === i}
                className={`min-w-0 rounded-xl border px-2.5 py-2.5 text-left transition sm:px-3 ${
                  (perfil.moto ?? 0) === i
                    ? "border-acento bg-acento/15 text-white"
                    : "border-white/10 text-tenue hover:border-white/30 hover:text-white"
                }`}
              >
                <span className="block text-sm font-semibold">{m.nombre}</span>
                <span className="block text-[11px] opacity-70">{m.detalle}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="anim-subir" style={{ animationDelay: "160ms" }}>
          <p className={ETIQUETA}>Color del mototaxi</p>
          <div className="mt-3 flex flex-wrap gap-3">
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
            <label
              title="Elegir otro color"
              className={`relative h-9 w-9 cursor-pointer rounded-full transition ${
                COLORES.some((c) => c.valor === perfil.color)
                  ? "opacity-80 hover:opacity-100"
                  : "scale-110 ring-2 ring-white ring-offset-2 ring-offset-[#0c1229]"
              }`}
              style={{
                background: COLORES.some((c) => c.valor === perfil.color)
                  ? "conic-gradient(red, yellow, lime, aqua, blue, magenta, red)"
                  : perfil.color,
              }}
            >
              <input
                type="color"
                aria-label="Elegir otro color"
                value={perfil.color}
                onChange={(e) => alCambiar({ ...perfil, color: e.target.value })}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
            </label>
          </div>
        </div>

        {perfil.avatar !== AVATAR_REAL && (
        <div className="anim-subir" style={{ animationDelay: "200ms" }}>
          <p className={ETIQUETA}>Tono de piel</p>
          <div className="mt-3 flex flex-wrap gap-3">
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
        )}

        <div className="anim-subir" style={{ animationDelay: "240ms" }}>
          <p className={ETIQUETA}>Accesorios (opcional)</p>
          {[
            { titulo: "Casco", opciones: ["Sin casco", ...CASCOS], valores: [SIN_CASCO, 0, 1, 2, 3], actual: perfil.casco, campo: "casco" as const },
            { titulo: "Lentes", opciones: LENTES, valores: [0, 1, 2], actual: perfil.lentes ?? 0, campo: "lentes" as const },
            { titulo: "Barba", opciones: BARBAS, valores: [0, 1, 2], actual: perfil.barba ?? 0, campo: "barba" as const },
          ].map((g) => (
            <div key={g.titulo} className="mt-3">
              <p className="mb-1.5 text-xs text-tenue">{g.titulo}</p>
              <div className="grid grid-cols-3 gap-2">
                {g.opciones.map((nombre, k) => (
                  <button
                    key={nombre}
                    type="button"
                    onClick={() => alCambiar({ ...perfil, [g.campo]: g.valores[k] })}
                    aria-pressed={g.actual === g.valores[k]}
                    className={`rounded-xl border px-2 py-2.5 text-sm transition ${
                      g.actual === g.valores[k]
                        ? "border-acento bg-acento/15 text-white"
                        : "border-white/10 text-tenue hover:border-white/30 hover:text-white"
                    }`}
                  >
                    {nombre}
                  </button>
                ))}
              </div>
            </div>
          ))}
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
        <p className="text-[10px] text-tenue/50">Modelos 3D del mototaxi y del personaje generados con Meshy (CC BY 4.0).</p>
      </form>

      <section className="sticky top-0 z-20 order-first h-[40vh] min-h-[260px] bg-[#0b0820] md:order-none md:h-screen md:min-h-0 md:self-start md:bg-transparent">
        <Canvas camera={{ position: [5.4, 4.3, 8.9], fov: 38 }} dpr={[1, 2]}>
          <hemisphereLight args={["#9a7bff", "#1a1030", 1.1]} />
          <directionalLight position={[3, 5, 2]} intensity={2.2} color="#ffb27a" />
          <directionalLight position={[-4, 3, -3]} intensity={1.4} color="#6d7bff" />
          <Vitrina perfil={perfil} />
          {/* solo gira con el mouse (o el dedo): arrastra para ver todo alrededor */}
          <ZoomBotones api={zoom} />
          <OrbitControls
            makeDefault
            enablePan={false}
            enableZoom
            zoomSpeed={0.8}
            minDistance={ZOOM_MIN}
            maxDistance={ZOOM_MAX}
            enableDamping
            dampingFactor={0.08}
            rotateSpeed={0.9}
            minPolarAngle={0.55}
            maxPolarAngle={Math.PI / 2.05}
            target={[0, 1, 0.3]}
          />
        </Canvas>
        <div className="absolute bottom-6 right-8 flex items-center gap-3">
          <p className="pointer-events-none hidden font-mono text-[11px] uppercase tracking-[0.3em] text-white/40 sm:block">
            Arrastra para girar · rueda, + o − para acercar
          </p>
          {[
            { t: "+", nombre: "Acercar", f: () => zoom.current?.mas() },
            { t: "−", nombre: "Alejar", f: () => zoom.current?.menos() },
          ].map((b) => (
            <button
              key={b.nombre}
              type="button"
              aria-label={b.nombre}
              title={b.nombre}
              onClick={b.f}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/30 text-xl text-white/80 backdrop-blur transition hover:border-white/50 hover:text-white active:scale-95"
            >
              {b.t}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
