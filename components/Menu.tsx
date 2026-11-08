"use client";

import TiendaMenu from "@/components/TiendaMenu";
import InventarioMenu from "@/components/InventarioMenu";
import { useEffect, useRef, useState } from "react";
import type { MutableRefObject } from "react";
import Avatar from "./Avatar";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Vector3, type Group } from "three";
import Piloto from "./Piloto";
import { SIN_CASCO, type Perfil } from "@/lib/perfil";
import { NIVELES } from "@/lib/niveles";
import { DIAS, diaActual, elegirDia, rangoDe, useProgreso } from "@/lib/semana";

type Props = {
  perfil: Perfil;
  alCambiar: (p: Perfil) => void;
  alJugar: () => void;
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

const ETIQUETA = "font-mono text-[11px] uppercase tracking-[0.24em] text-tenue";

export default function Menu({ perfil, alCambiar, alJugar }: Props) {
  const prog = useProgreso();
  const dia = diaActual();
  const rango = rangoDe(prog.xp);
  const pctXp = rango.siguiente ? Math.min(100, ((prog.xp - rango.desde) / (rango.siguiente - rango.desde)) * 100) : 100;
  const [demo, setDemo] = useState(false);
  const [vista, setVista] = useState<"inicio" | "tienda">("inicio")
  const [verInventario, setVerInventario] = useState(false);
  const [prueba, setPrueba] = useState<Perfil | null>(null);
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
        {vista === "tienda" ? (
          <TiendaMenu perfil={perfil} alCambiar={alCambiar} alProbar={setPrueba} alVolver={() => setVista("inicio")} />
        ) : (
          <>
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

        <div className="anim-subir" style={{ animationDelay: "100ms" }}>
          <div className="flex items-center justify-between">
            <p className={ETIQUETA}>Semana {prog.semana}</p>
            <button
              type="button"
              onClick={() => setDemo((d) => !d)}
              className="font-mono text-[10px] uppercase tracking-[0.18em] text-tenue/60 underline-offset-4 transition hover:text-white hover:underline"
            >
              {demo ? "Salir del modo demostración" : "Modo demostración"}
            </button>
          </div>
          <div className="mt-3 grid grid-cols-5 gap-1.5">
            {DIAS.map((d) => {
              const actual = prog.dia === d.n;
              const hecho = prog.hechos.includes(d.n);
              const bloqueado = !demo && !actual && !hecho;
              return (
                <button
                  key={d.n}
                  type="button"
                  disabled={!demo}
                  onClick={() => elegirDia(d.n)}
                  aria-pressed={actual}
                  title={d.nombre}
                  className={`min-w-0 rounded-xl border px-1 py-2 text-center transition disabled:cursor-default ${
                    actual
                      ? "border-acento bg-acento/15 text-white"
                      : hecho
                        ? "border-menta/40 text-menta"
                        : bloqueado
                          ? "border-white/10 text-tenue/50"
                          : "border-white/15 text-tenue hover:border-white/40 hover:text-white"
                  }`}
                >
                  <span className="block font-mono text-[11px] font-semibold tracking-[0.12em]">{d.corto}</span>
                  <span className="block text-[11px] leading-none">{hecho ? "✓" : actual ? "●" : "·"}</span>
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-sm font-semibold text-white">
            {dia.nombre} · {NIVELES.find((n) => n.n === dia.nivel)?.nombre.split(" · ")[1]}
          </p>
          <p className="text-[12px] text-tenue">{dia.tema}</p>

          <div className="mt-3 flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-tenue">Billetera</p>
              <p className="text-xl font-semibold" style={{ color: "#fbbf24" }}>
                S/ {prog.dinero}
              </p>
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em]" style={{ color: "#c4b5fd" }}>
                {rango.nombre} · {prog.xp} XP
              </p>
              <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-white/15">
                <span
                  className="block h-full rounded-full"
                  style={{ width: `${pctXp}%`, background: "#a78bfa", boxShadow: "0 0 8px #a78bfa" }}
                />
              </span>
              <p className="mt-1 text-[11px] text-tenue">
                {rango.siguiente ? `${rango.siguiente - prog.xp} XP para ser ${rango.nombreSiguiente}` : "Rango máximo"}
              </p>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={!valido}
          className="anim-subir group flex items-center justify-between rounded-2xl bg-acento px-6 py-4 text-left font-semibold text-[#1a0d05] transition enabled:hover:brightness-110 enabled:active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
          style={{ animationDelay: "140ms" }}
        >
          <span>{valido ? `Empezar el ${dia.nombre.toLowerCase()}` : "Escribe tu nombre para entrar"}</span>
          <span className="font-mono text-sm opacity-70 transition group-hover:translate-x-1">→</span>
        </button>

        <div className="anim-subir grid grid-cols-2 gap-2" style={{ animationDelay: "160ms" }}>
          <button
            type="button"
            onClick={() => setVista("tienda")}
            className="flex items-center justify-between rounded-2xl border border-white/15 px-4 py-3.5 text-left font-semibold text-white transition hover:border-white/40 hover:bg-white/[0.04] active:scale-[0.99]"
          >
            <span>Tienda</span>
            <span className="font-mono text-sm" style={{ color: "#fbbf24" }}>
              S/ {prog.dinero}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setVerInventario(true)}
            className="flex items-center justify-between rounded-2xl border border-white/15 px-4 py-3.5 text-left font-semibold text-white transition hover:border-white/40 hover:bg-white/[0.04] active:scale-[0.99]"
          >
            <span>Inventario</span>
            <span className="font-mono text-sm text-tenue">{prog.compras.length}</span>
          </button>
        </div>

        <p className="font-mono text-[11px] text-tenue/80">A · D o ← → para cambiar de carril</p>
        <p className="text-[10px] text-tenue/50">Modelos 3D del mototaxi y del personaje generados con Meshy (CC BY 4.0).</p>
          </>
        )}
      </form>

      {verInventario && (
        <InventarioMenu
          perfil={perfil}
          alCambiar={alCambiar}
          alCerrar={() => setVerInventario(false)}
          alIrTienda={() => {
            setVerInventario(false);
            setVista("tienda");
          }}
        />
      )}

      <section className="sticky top-0 z-20 order-first h-[40vh] min-h-[260px] bg-[#0b0820] md:order-none md:h-screen md:min-h-0 md:self-start md:bg-transparent">
        <Canvas camera={{ position: [5.4, 4.3, 8.9], fov: 38 }} dpr={[1, 2]}>
          <hemisphereLight args={["#9a7bff", "#1a1030", 1.1]} />
          <directionalLight position={[3, 5, 2]} intensity={2.2} color="#ffb27a" />
          <directionalLight position={[-4, 3, -3]} intensity={1.4} color="#6d7bff" />
          <Vitrina perfil={prueba ?? perfil} />
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
