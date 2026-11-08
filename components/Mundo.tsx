"use client";

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Vector3 } from "three";
import type { Group } from "three";
import Avatar from "@/components/Avatar";
import Garaje, { GARAJE } from "@/components/Garaje";
import { cambiarFase, entrarATienda, llamarCliente, estado, ponerCerca, terminarSubida, useApie, volverABajar } from "@/lib/estado";
import type { Perfil } from "@/lib/perfil";

const VEL = 3.4;
const RUMBO = (62 * Math.PI) / 180;

type Anim = { tipo: "bajar" | "subir"; t: number; dur: number; desde: Vector3; hasta: Vector3 };

const suavizar = (t: number) => t * t * (3 - 2 * t);

function suelo(x: number, zr: number) {
  const g = GARAJE;
  if (estado.tipoLugar === "puente") return 0;
  if (zr > g.zMin - 0.2 && zr < g.zMax + 0.2) {
    if (x >= g.rampaX1) return g.altura;
    if (x > g.rampaX0) return ((x - g.rampaX0) / (g.rampaX1 - g.rampaX0)) * g.altura;
  }
  return 0;
}

function limitar(p: Vector3) {
  const g = GARAJE;
  const zr = p.z - estado.base;
  p.z = estado.base + Math.max(-11, Math.min(7, zr));
  const enVereda = estado.tipoLugar !== "puente" && zr > g.zMin && zr < g.zMax;
  const maxX = enVereda ? g.puertaX - 0.6 : 4.5;
  p.x = Math.max(-4.5, Math.min(maxX, p.x));
  if (!enVereda && p.x > 4.5) p.x = 4.5;
}

export default function Mundo({ perfil }: { perfil: Perfil }) {
  const apie = useApie();
  const grupo = useRef<Group>(null);
  const marcha = useRef(0);
  const pos = useRef(new Vector3());
  const vel = useRef({ x: 0, z: 0 });
  const giro = useRef(0);
  const anim = useRef<Anim | null>(null);
  const estira = useRef(0);
  const estiraT = useRef(0);
  const tecla = useRef<Record<string, boolean>>({});
  const antes = useRef(false);
  const camPos = useRef(new Vector3());
  const camMira = useRef(new Vector3());
  const tmp = useRef(new Vector3());

  useEffect(() => {
    const abajo = (e: KeyboardEvent) => {
      tecla.current[e.code] = true;
      if (e.code === "KeyE" && !e.repeat) estado.hacerAccion?.();
    };
    const arriba = (e: KeyboardEvent) => {
      tecla.current[e.code] = false;
    };
    const soltar = () => {
      tecla.current = {};
    };
    window.addEventListener("keydown", abajo);
    window.addEventListener("keyup", arriba);
    window.addEventListener("blur", soltar);
    estado.hacerAccion = () => {
      if (!estado.apie || anim.current || estado.dentro) return;
      if (estado.cerca === "bodega") {
        if (estado.entregaActiva) llamarCliente();
        else entrarATienda();
      } else if (estado.cerca === "oficial") {
        ponerCerca("");
        cambiarFase("dialogo");
      } else if (estado.cerca === "moto") {
        anim.current = {
          tipo: "subir",
          t: 0,
          dur: 1,
          desde: pos.current.clone(),
          hasta: new Vector3(estado.x, 0.55, estado.z + 0.2),
        };
        ponerCerca("");
      }
    };
    return () => {
      window.removeEventListener("keydown", abajo);
      window.removeEventListener("keyup", arriba);
      window.removeEventListener("blur", soltar);
      estado.hacerAccion = null;
    };
  }, []);

  useFrame(({ camera }, delta) => {
    const dt = Math.min(delta, 0.05);
    if (!estado.apie) {
      antes.current = false;
      // rescate: el puente sigue cerrado y estás arriba del mototaxi → vuelves a bajar
      if (estado.fase === "alto" && estado.tipoLugar === "puente") volverABajar();
      return;
    }
    const kx = estado.x;
    const kz = estado.z;

    if (!antes.current) {
      antes.current = true;
      pos.current.set(kx, 0.55, kz + 0.2);
      vel.current = { x: 0, z: 0 };
      giro.current = Math.atan2(-Math.sin(RUMBO), Math.cos(RUMBO));
      anim.current = {
        tipo: "bajar",
        t: 0,
        dur: 0.9,
        desde: pos.current.clone(),
        hasta: new Vector3(kx + 1.4, 0, kz + 0.3),
      };
      camPos.current.copy(camera.position);
      camMira.current.set(kx * 0.6, 1.5, kz - 10);
    }

    const p = pos.current;
    const a = anim.current;
    let enTecla = false;
    const o = estado.orbita;
    if (a?.tipo === "subir") {
      o.yaw *= Math.exp(-dt * 5);
      o.pitch *= Math.exp(-dt * 5);
    }
    const rumbo = RUMBO - o.yaw;
    const FWD = { x: Math.sin(rumbo), z: -Math.cos(rumbo) };
    const DER = { x: Math.cos(rumbo), z: Math.sin(rumbo) };

    if (a) {
      a.t = Math.min(1, a.t + dt / a.dur);
      const u = suavizar(a.t);
      p.lerpVectors(a.desde, a.hasta, u);
      p.y += Math.sin(Math.PI * a.t) * 0.3;
      marcha.current += ((a.tipo === "bajar" ? 0.5 : 0.4) - marcha.current) * Math.min(1, dt * 8);
      vel.current = { x: 0, z: 0 };
      if (a.t >= 1) {
        anim.current = null;
        if (a.tipo === "subir") terminarSubida();
        else estiraT.current = 1.5;
      }
    } else if (!estado.dentro) {
      const ix = (tecla.current.KeyD || tecla.current.ArrowRight ? 1 : 0) - (tecla.current.KeyA || tecla.current.ArrowLeft ? 1 : 0);
      const iz = (tecla.current.KeyW || tecla.current.ArrowUp ? 1 : 0) - (tecla.current.KeyS || tecla.current.ArrowDown ? 1 : 0);
      let dx = FWD.x * iz + DER.x * ix;
      let dz = FWD.z * iz + DER.z * ix;
      const l = Math.hypot(dx, dz);
      enTecla = l > 0;
      if (l > 0) {
        dx /= l;
        dz /= l;
      }
      const k = Math.min(1, dt * 10);
      vel.current.x += (dx * VEL - vel.current.x) * k;
      vel.current.z += (dz * VEL - vel.current.z) * k;
      p.x += vel.current.x * dt;
      p.z += vel.current.z * dt;

      // el mototaxi es un obstáculo
      const mx = 1.25;
      const z0 = kz - 1.9;
      const z1 = kz + 2.4;
      if (p.x > kx - mx && p.x < kx + mx && p.z > z0 && p.z < z1) {
        const izq = p.x - (kx - mx);
        const der = kx + mx - p.x;
        const ar = p.z - z0;
        const ab = z1 - p.z;
        const m = Math.min(izq, der, ar, ab);
        if (m === izq) p.x = kx - mx;
        else if (m === der) p.x = kx + mx;
        else if (m === ar) p.z = z0;
        else p.z = z1;
      }
      limitar(p);
      p.y = suelo(p.x, p.z - estado.base);

      const rapidez = Math.hypot(vel.current.x, vel.current.z);
      marcha.current += (Math.min(1, rapidez / VEL) - marcha.current) * Math.min(1, dt * 10);
      if (rapidez > 0.25) {
        const meta = Math.atan2(-vel.current.x, -vel.current.z);
        let d = meta - giro.current;
        while (d > Math.PI) d -= Math.PI * 2;
        while (d < -Math.PI) d += Math.PI * 2;
        giro.current += d * Math.min(1, dt * 12);
      }

      // qué tengo cerca
      let cerca = "";
      const enPuente = estado.tipoLugar === "puente";
      const aOficial = enPuente && estado.fase === "alto" && Math.hypot(p.x - 1.7, p.z - (estado.base - 1.8)) < 2.4;
      const aPuerta =
        !enPuente && Math.hypot(p.x - (GARAJE.puertaX - 0.5), p.z - (GARAJE.puertaZ + estado.base)) < 2.3;
      const dMoto = Math.hypot(p.x - kx, p.z - (kz + 0.4));
      // terminaste lo que ibas a hacer: el mototaxi tiene prioridad sobre la puerta
      const aMotoYa = estado.objetivo === "volver" && !enPuente && dMoto < 3.9;
      if (aMotoYa) {
        cerca = "moto";
      } else if (aPuerta) {
        cerca = "bodega";
      } else if (aOficial) {
        cerca = "oficial";
      } else if (!(enPuente && estado.fase === "alto") && Math.hypot(p.x - kx, p.z - (kz + 0.4)) < 2.9) {
        // en un puente no puedes subir al mototaxi hasta hablar con el oficial
        cerca = "moto";
      }
      ponerCerca(cerca);
    } else {
      vel.current = { x: 0, z: 0 };
      marcha.current += (0 - marcha.current) * Math.min(1, dt * 8);
    }
    void enTecla;
    if (estiraT.current > 0) {
      estiraT.current -= dt;
      estira.current = Math.sin(Math.PI * Math.min(1, Math.max(0, 1 - estiraT.current / 1.5)));
    } else {
      estira.current = 0;
    }

    estado.ax = p.x;
    estado.az = p.z;
    if (grupo.current) {
      grupo.current.position.copy(p);
      grupo.current.rotation.y = giro.current;
    }

    // cámara
    const subiendo = anim.current?.tipo === "subir";
    const deseada = tmp.current;
    let k = 1 - Math.exp(-dt * 3);
    if (subiendo) {
      deseada.set(kx * 0.6, 3.1, kz + 6.3);
      k = 1 - Math.exp(-dt * 5);
    } else {
      const pit = Math.max(-0.1, Math.min(1.2, 0.37 + o.pitch));
      const R = 7.4;
      deseada.set(p.x - FWD.x * R * Math.cos(pit), 0.9 + R * Math.sin(pit), p.z - FWD.z * R * Math.cos(pit));
    }
    camPos.current.lerp(deseada, k);
    const mira = subiendo
      ? deseada.set(kx * 0.6, 1.5, kz - 10)
      : deseada.set(p.x + FWD.x * 1.6, 1.2, p.z + FWD.z * 1.6);
    camMira.current.lerp(mira, k);
    camera.position.copy(camPos.current);
    camera.lookAt(camMira.current);
  });

  return (
    <>
      <Garaje />
      {apie && (
        <group ref={grupo}>
          <Avatar perfil={perfil} marcha={marcha} estira={estira} />
        </group>
      )}
    </>
  );
}
