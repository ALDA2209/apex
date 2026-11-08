"use client";

import { useMemo, useRef } from "react";
import type { MutableRefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import {
  Bone,
  BufferAttribute,
  Group,
  Mesh,
  Skeleton,
  SkinnedMesh,
  type BufferGeometry,
  type Material,
} from "three";
import { Casco } from "@/components/Piloto";
import { AccesoriosReal } from "@/components/Accesorios";
import type { Perfil } from "@/lib/perfil";

export const RUTA_AVATAR = "/models/avatar1.glb";

/* El modelo mide 1,89 de alto con los pies en y = -0,95. Lo dejamos en 1,75 con los pies en el suelo. */
const ESCALA = 1.75 / 1.889;
const PIES = 0.9505;

type V3 = [number, number, number];
const CADERA: V3 = [0.115, -0.25, 0];
const RODILLA: V3 = [0.115, -0.62, 0];
const TOBILLO: V3 = [0.11, -0.95, 0.02];
const HOMBRO: V3 = [0.23, 0.5, 0];
const CODO: V3 = [0.33, 0.13, 0];
const MANO: V3 = [0.45, -0.3, 0];

const lado = (p: V3, l: number): V3 => [p[0] * l, p[1], p[2]];

/* huesos: 0 raíz, 1 muslo I, 2 pierna I, 3 muslo D, 4 pierna D, 5 brazo I, 6 antebrazo I, 7 brazo D, 8 antebrazo D */
const SEGMENTOS: { a: V3; b: V3; hueso: number; peso: number }[] = [
  { a: [0, -0.2, 0], b: [0, 0.62, 0], hueso: 0, peso: 3 },
  ...[-1, 1].flatMap((l, i) => [
    { a: lado(CADERA, l), b: lado(RODILLA, l), hueso: 1 + i * 2, peso: 1 },
    { a: lado(RODILLA, l), b: lado(TOBILLO, l), hueso: 2 + i * 2, peso: 1 },
    { a: lado(HOMBRO, l), b: lado(CODO, l), hueso: 5 + i * 2, peso: 1 },
    { a: lado(CODO, l), b: lado(MANO, l), hueso: 6 + i * 2, peso: 1 },
  ]),
];

function distancia(p: V3, a: V3, b: V3): number {
  const ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const ap = [p[0] - a[0], p[1] - a[1], p[2] - a[2]];
  const len2 = ab[0] * ab[0] + ab[1] * ab[1] + ab[2] * ab[2];
  const t = Math.max(0, Math.min(1, (ap[0] * ab[0] + ap[1] * ab[1] + ap[2] * ab[2]) / len2));
  const dx = p[0] - (a[0] + ab[0] * t);
  const dy = p[1] - (a[1] + ab[1] * t);
  const dz = p[2] - (a[2] + ab[2] * t);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function crear(geoOriginal: BufferGeometry, material: Material) {
  const geo = geoOriginal.clone();
  const pos = geo.getAttribute("position");
  const n = pos.count;
  const indices = new Uint16Array(n * 4);
  const pesos = new Float32Array(n * 4);

  for (let i = 0; i < n; i++) {
    const p: V3 = [pos.getX(i), pos.getY(i), pos.getZ(i)];
    const lista = SEGMENTOS.map((s) => ({
      h: s.hueso,
      w: s.peso / Math.pow(distancia(p, s.a, s.b) + 0.015, 3),
    }))
      .sort((x, y) => y.w - x.w)
      .slice(0, 3);
    const total = lista.reduce((acc, e) => acc + e.w, 0);
    lista.forEach((e, k) => {
      indices[i * 4 + k] = e.h;
      pesos[i * 4 + k] = e.w / total;
    });
  }
  geo.setAttribute("skinIndex", new BufferAttribute(indices, 4));
  geo.setAttribute("skinWeight", new BufferAttribute(pesos, 4));

  const hueso = (pos: V3, padre?: V3) => {
    const b = new Bone();
    b.position.set(pos[0] - (padre?.[0] ?? 0), pos[1] - (padre?.[1] ?? 0), pos[2] - (padre?.[2] ?? 0));
    return b;
  };
  const raiz = new Bone();
  const huesos: Bone[] = [raiz];
  [-1, 1].forEach((l) => {
    const cadera = lado(CADERA, l);
    const hombro = lado(HOMBRO, l);
    const muslo = hueso(cadera);
    const pierna = hueso(lado(RODILLA, l), cadera);
    const brazo = hueso(hombro);
    const ante = hueso(lado(CODO, l), hombro);
    muslo.add(pierna);
    brazo.add(ante);
    raiz.add(muslo, brazo);
    huesos.push(muslo, pierna);
  });
  // orden de índices: 1 muslo I, 2 pierna I, 3 muslo D, 4 pierna D, luego brazos
  const muslos = huesos.slice(1);
  const brazos: Bone[] = [];
  [-1, 1].forEach((l, i) => {
    const hombro = lado(HOMBRO, l);
    void hombro;
    brazos.push(raiz.children[i * 2 + 1] as Bone, (raiz.children[i * 2 + 1] as Bone).children[0] as Bone);
  });
  const todos = [raiz, ...muslos, ...brazos];

  const malla = new SkinnedMesh(geo, material);
  malla.frustumCulled = false;
  malla.add(raiz);
  malla.updateMatrixWorld(true);
  malla.bind(new Skeleton(todos));
  return { malla, huesos: todos };
}

export default function AvatarReal({
  perfil,
  marcha,
  estira,
  sentado = false,
  come,
  casco,
  conduce,
}: {
  perfil: Perfil;
  marcha: MutableRefObject<number>;
  estira?: MutableRefObject<number>;
  sentado?: boolean;
  come?: MutableRefObject<number>;
  casco?: number;
  /** manejando: altura del asiento y dónde están las manos (altura, z) respecto al personaje */
  conduce?: { asiento: number; mano: [number, number]; k?: number };
}) {
  const { scene } = useGLTF(RUTA_AVATAR);
  const fase = useRef(0);
  const cuerpo = useRef<Group>(null);

  const { malla, huesos } = useMemo(() => {
    let m: Mesh | null = null;
    scene.traverse((o) => {
      if (!m && (o as Mesh).isMesh) m = o as Mesh;
    });
    const fuente = m as unknown as Mesh;
    return crear(fuente.geometry, fuente.material as Material);
  }, [scene]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const m = marcha.current;
    fase.current += dt * (3 + m * 7);
    const s = Math.sin(fase.current);
    const amp = 0.8 * m;
    const [, muI, piI, muD, piD, brI, anI, brD, anD] = huesos;

    // hacia adelante = giro negativo en x (el frente del modelo es +z)
    muI.rotation.x = -s * amp;
    muD.rotation.x = s * amp;
    piI.rotation.x = Math.max(0, s) * amp * 0.7;
    piD.rotation.x = Math.max(0, -s) * amp * 0.7;
    brI.rotation.x = s * amp * 0.85;
    brD.rotation.x = -s * amp * 0.85;
    anI.rotation.x = -Math.abs(s) * amp * 0.25;
    anD.rotation.x = -Math.abs(s) * amp * 0.25;
    brI.rotation.z = 0;
    brD.rotation.z = 0;
    const g = cuerpo.current;

    if (conduce) {
      const raiz = huesos[0];
      const INCLINA = 0.25;
      const compensa = ESCALA;
      const k = conduce.k ?? 1;
      const mano: [number, number] = [conduce.mano[0] / k, conduce.mano[1] / k];
      const desnivel = conduce.asiento / k + 0.07 / k - 0.649;
      // piernas adelante y rodillas dobladas
      muI.rotation.x = muD.rotation.x = -1.1 - INCLINA;
      piI.rotation.x = piD.rotation.x = 0.8;
      raiz.rotation.x = INCLINA;
      // brazos: dos segmentos que llegan al manubrio
      const L1 = 0.383 * compensa;
      const L2 = 0.446 * compensa;
      const sh = { f: 0.5 * Math.sin(INCLINA) * compensa, d: (0.5 + PIES) * compensa + desnivel };
      const f = -mano[1] - sh.f;
      const d = sh.d - mano[0];
      const D = Math.min(Math.hypot(f, d), L1 + L2 - 0.01);
      const phi = Math.atan2(f, d);
      const alfa = Math.acos(Math.max(-1, Math.min(1, (L1 * L1 + D * D - L2 * L2) / (2 * L1 * D))));
      const t1 = phi - alfa;
      const ef = L1 * Math.sin(t1);
      const ed = L1 * Math.cos(t1);
      const t2 = Math.atan2(f - ef, d - ed);
      brI.rotation.x = brD.rotation.x = -t1 - INCLINA;
      anI.rotation.x = anD.rotation.x = -(t2 - t1);
      brI.rotation.z = 0;
      brD.rotation.z = 0;
      if (g) {
        g.position.y = desnivel + Math.sin(fase.current * 0.45) * 0.004;
        g.rotation.x = 0;
      }
      return;
    }

    if (sentado) {
      muI.rotation.x = -1.5;
      muD.rotation.x = -1.5;
      piI.rotation.x = 1.5;
      piD.rotation.x = 1.5;
      const c = come?.current ?? 0;
      const f = fase.current * 1.4;
      brI.rotation.x = -0.85 + Math.sin(f * 0.5) * 0.03;
      brD.rotation.x = c > 0 ? -1.4 - Math.sin(f * 3.2) * 0.2 * c : -0.85;
      anI.rotation.x = -0.5;
      anD.rotation.x = c > 0 ? -1.7 * c : -0.5;
      if (g) {
        g.position.y = -0.26;
        g.rotation.x = 0;
      }
      return;
    }

    const e = estira?.current ?? 0;
    if (e > 0) {
      brI.rotation.x = Math.PI * 0.92 * e * -1;
      brD.rotation.x = Math.PI * 0.92 * e * -1;
      brI.rotation.z = -0.2 * e;
      brD.rotation.z = 0.2 * e;
    }
    if (g) {
      g.position.y = Math.abs(Math.sin(fase.current)) * 0.035 * m + Math.sin(fase.current * 0.45) * 0.004 * (1 - m);
      g.rotation.x = -0.1 * e;
    }
  });

  return (
    <group scale={conduce?.k ?? 1}>
    <group ref={cuerpo}>
      <group rotation={[0, Math.PI, 0]} scale={ESCALA} position={[0, PIES * ESCALA, 0]}>
        <primitive object={malla} />
        <group position={[0, 0.78, 0.005]}>
          <group rotation={[0, Math.PI, 0]}>
            <group scale={0.7}>
              {casco !== undefined && <Casco casco={casco} color={perfil.color} />}
            </group>
          </group>
        </group>
        <AccesoriosReal lentes={perfil.lentes} barba={perfil.barba} />
      </group>
    </group>
    </group>
  );
}

useGLTF.preload(RUTA_AVATAR);
