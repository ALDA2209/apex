"use client";

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import Piloto from "@/components/Piloto";
import type { Perfil } from "@/lib/perfil";
import { cansar, estado, ponerKmh, useCajas } from "@/lib/estado";
import { KMH_POR_VEL } from "@/lib/transito";

const VELOCIDAD = 18;
const ANCHO_CARRIL = 3;

export default function Kart({ perfil }: { perfil: Perfil }) {
  const grupo = useRef<Group>(null);
  const cajas = useCajas();
  const carril = useRef(0);
  const vel = useRef(estado.velocidad);
  const camX = useRef(0);
  const reloj = useRef(0);

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if (estado.fase !== "libre" || !estado.activo) return;
      if (e.code === "KeyA" || e.code === "ArrowLeft") {
        carril.current = Math.max(-1, carril.current - 1);
      }
      if (e.code === "KeyD" || e.code === "ArrowRight") {
        carril.current = Math.min(1, carril.current + 1);
      }
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, []);

  useFrame(({ camera }, delta) => {
    const k = grupo.current;
    if (!k) return;
    if (estado.apie) {
      ponerKmh(0);
      return;
    }
    const dt = Math.min(delta, 0.05);

    if (estado.nuevoCarril !== null) {
      carril.current = estado.nuevoCarril;
      estado.nuevoCarril = null;
    }
    if (estado.golpe > 0) estado.golpe = Math.max(0, estado.golpe - dt);
    cansar(dt);
    reloj.current += dt;
    // con poca salud el mototaxi se vuelve inestable: se va de lado y responde lento
    const fatiga = estado.fase === "libre" ? Math.max(0, Math.min(1, (50 - estado.salud) / 50)) : 0;

    // W: el turbo se apaga solo al frenar para un puente
    const aTurbo = 1 + (estado.turbo - 1) * Math.max(0, Math.min(1, (estado.velocidad - 0.6) / 0.4));
    const objetivo = estado.velocidad * aTurbo * (estado.golpe > 0 ? 0.3 : 1);
    vel.current += (objetivo - vel.current) * Math.min(1, dt * 6);
    k.position.z -= VELOCIDAD * vel.current * dt;
    ponerKmh(vel.current * KMH_POR_VEL);

    const meta = estado.fase === "parada" ? estado.berma * 3.75 : carril.current * ANCHO_CARRIL;
    const r = reloj.current;
    const bamboleo = fatiga * (Math.sin(r * 1.3) * 0.5 + Math.sin(r * 3.1) * 0.2);
    const dx = meta + bamboleo - k.position.x;
    k.position.x += dx * Math.min(1, dt * (8 - 4 * fatiga));
    k.rotation.y = -dx * 0.06;
    k.rotation.z = -dx * 0.05 + Math.sin(r * 2.3) * 0.05 * fatiga;

    estado.x = k.position.x;
    estado.z = k.position.z;

    const temblor = estado.golpe > 0.4 ? (Math.random() - 0.5) * 0.18 : 0;
    camX.current += (k.position.x * 0.6 - camX.current) * Math.min(1, dt * 5);

    // vista 360: arrastrar con el mouse; al soltar vuelve sola detrás del mototaxi
    const o = estado.orbita;
    if (!o.arrastrando) {
      while (o.yaw > Math.PI) o.yaw -= Math.PI * 2;
      while (o.yaw < -Math.PI) o.yaw += Math.PI * 2;
      const r = Math.exp(-dt * 2.5);
      o.yaw *= r;
      o.pitch *= r;
      if (Math.abs(o.yaw) < 0.002) o.yaw = 0;
      if (Math.abs(o.pitch) < 0.002) o.pitch = 0;
    }
    const f = Math.min(1, Math.hypot(o.yaw, o.pitch * 1.6) / 0.12);
    let cx = camX.current + temblor;
    let cy = 3.1 + temblor;
    let cz = k.position.z + 6.3;
    let lx = camX.current;
    let ly = 1.5;
    let lz = k.position.z - 10;
    if (f > 0) {
      const pit = Math.max(-0.2, Math.min(1.25, 0.27 + o.pitch));
      const R = 6.6;
      const tx = k.position.x;
      const tz = k.position.z;
      const ox = tx + R * Math.sin(o.yaw) * Math.cos(pit);
      const oy = 1.4 + R * Math.sin(pit);
      const oz = tz + R * Math.cos(o.yaw) * Math.cos(pit);
      cx += (ox - cx) * f;
      cy += (oy - cy) * f;
      cz += (oz - cz) * f;
      lx += (tx - lx) * f;
      ly += (1.2 - ly) * f;
      lz += (tz - lz) * f;
    }
    camera.position.set(cx, cy, cz);
    camera.lookAt(lx, ly, lz);
  });

  return (
    <group ref={grupo}>
      <Piloto perfil={perfil} cajas={cajas} />
    </group>
  );
}
