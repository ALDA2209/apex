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
import CascoElla from "@/components/CascosElla";
import { AccesoriosReal } from "@/components/Accesorios";
import type { Perfil } from "@/lib/perfil";

type V3 = [number, number, number];

/* Cada personaje es un modelo 3D con su propia medida: dónde están sus caderas, rodillas, hombros y cabeza.
   El juego le pone huesos por código usando estos puntos. */
type Cfg = {
  ruta: string;
  /** el modelo mide ~1,89 con los pies en y = -pies; se lleva a su altura real con esta escala */
  escala: number;
  pies: number;
  cadera: V3;
  rodilla: V3;
  tobillo: V3;
  hombro: V3;
  codo: V3;
  mano: V3;
  torso: [V3, V3];
  /** donde se apoya el casco: altura y z del centro de la cabeza, y su tamaño */
  cabeza: { y: number; z: number; escala: number };
  /** ajuste de los lentes respecto de la cara del varón */
  cara: { y: number; z: number };
  /** al manejar: inclinación del cuerpo hacia adelante y cuánto se adelanta para alcanzar el manubrio */
  inclina: number;
  avance: number;
};

const CFG: Record<"el" | "ella", Cfg> = {
  el: {
    ruta: "/models/avatar1.glb",
    escala: 1.75 / 1.889,
    pies: 0.9505,
    cadera: [0.115, -0.25, 0],
    rodilla: [0.115, -0.62, 0],
    tobillo: [0.11, -0.95, 0.02],
    hombro: [0.23, 0.5, 0],
    codo: [0.33, 0.13, 0],
    mano: [0.45, -0.3, 0],
    torso: [
      [0, -0.2, 0],
      [0, 0.62, 0],
    ],
    cabeza: { y: 0.78, z: 0.005, escala: 0.7 },
    cara: { y: 0, z: 0 },
    inclina: 0.25,
    avance: 0,
  },
  ella: {
    ruta: "/models/avatar2.glb",
    escala: 1.68 / 1.898,
    pies: 0.951,
    cadera: [0.095, -0.15, 0],
    rodilla: [0.095, -0.47, 0],
    tobillo: [0.095, -0.9, 0.01],
    hombro: [0.21, 0.52, 0],
    codo: [0.3, 0.22, 0],
    mano: [0.415, -0.1, 0],
    torso: [
      [0, -0.12, 0],
      [0, 0.6, 0],
    ],
    cabeza: { y: 0.79, z: -0.005, escala: 0.86 },
    cara: { y: 0.03, z: 0.015 },
    inclina: 0.4,
    avance: 0.1,
  },
};

export const RUTA_AVATAR = CFG.el.ruta;
export const RUTA_AVATAR_ELLA = CFG.ella.ruta;

const lado = (p: V3, l: number): V3 => [p[0] * l, p[1], p[2]];

/* huesos: 0 raíz, 1 muslo I, 2 pierna I, 3 muslo D, 4 pierna D, 5 brazo I, 6 antebrazo I, 7 brazo D, 8 antebrazo D */
const segmentos = (c: Cfg): { a: V3; b: V3; hueso: number; peso: number }[] => [
  { a: c.torso[0], b: c.torso[1], hueso: 0, peso: 3 },
  ...[-1, 1].flatMap((l, i) => [
    { a: lado(c.cadera, l), b: lado(c.rodilla, l), hueso: 1 + i * 2, peso: 1 },
    { a: lado(c.rodilla, l), b: lado(c.tobillo, l), hueso: 2 + i * 2, peso: 1 },
    { a: lado(c.hombro, l), b: lado(c.codo, l), hueso: 5 + i * 2, peso: 1 },
    { a: lado(c.codo, l), b: lado(c.mano, l), hueso: 6 + i * 2, peso: 1 },
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

function crear(geoOriginal: BufferGeometry, material: Material, cfg: Cfg) {
  const SEGMENTOS = segmentos(cfg);
  const { cadera: CADERA, rodilla: RODILLA, hombro: HOMBRO, codo: CODO } = cfg;
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
  const cfg = CFG[perfil.genero === "ella" ? "ella" : "el"];
  const { scene } = useGLTF(cfg.ruta);
  /* altura (en metros) de la cadera sobre el suelo, de pie */
  const CADERA_M = (cfg.cadera[1] + cfg.pies) * cfg.escala;
  const fase = useRef(0);
  const cuerpo = useRef<Group>(null);

  const { malla, huesos } = useMemo(() => {
    let m: Mesh | null = null;
    scene.traverse((o) => {
      if (!m && (o as Mesh).isMesh) m = o as Mesh;
    });
    const fuente = m as unknown as Mesh;
    return crear(fuente.geometry, fuente.material as Material, cfg);
  }, [scene, cfg]);

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
      const INCLINA = cfg.inclina;
      const compensa = cfg.escala;
      const k = conduce.k ?? 1;
      const mano: [number, number] = [conduce.mano[0] / k, conduce.mano[1] / k];
      const desnivel = conduce.asiento / k + 0.07 / k - CADERA_M;
      // piernas adelante y rodillas dobladas
      muI.rotation.x = muD.rotation.x = -1.1 - INCLINA;
      piI.rotation.x = piD.rotation.x = 0.8;
      raiz.rotation.x = INCLINA;
      // brazos: dos segmentos que llegan al manubrio
      const L1 = Math.hypot(cfg.codo[0] - cfg.hombro[0], cfg.codo[1] - cfg.hombro[1]) * compensa;
      const L2 = Math.hypot(cfg.mano[0] - cfg.codo[0], cfg.mano[1] - cfg.codo[1]) * compensa;
      const sh = { f: cfg.hombro[1] * Math.sin(INCLINA) * compensa, d: (cfg.hombro[1] + cfg.pies) * compensa + desnivel };
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
        g.position.z = cfg.avance;
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
        g.position.y = -(CADERA_M - 0.389);
        g.position.z = 0;
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
      g.position.z = 0;
      g.position.y = Math.abs(Math.sin(fase.current)) * 0.035 * m + Math.sin(fase.current * 0.45) * 0.004 * (1 - m);
      g.rotation.x = -0.1 * e;
    }
  });

  return (
    <group scale={conduce?.k ?? 1}>
    <group ref={cuerpo}>
      <group rotation={[0, Math.PI, 0]} scale={cfg.escala} position={[0, cfg.pies * cfg.escala, 0]}>
        <primitive object={malla} />
        <group position={[0, cfg.cabeza.y, cfg.cabeza.z]}>
          <group rotation={[0, Math.PI, 0]}>
            <group scale={cfg.cabeza.escala}>
              {casco !== undefined && (perfil.genero === "ella" ? <CascoElla casco={casco} color={perfil.color} /> : <Casco casco={casco} color={perfil.color} />)}
            </group>
          </group>
        </group>
        <group position={[0, cfg.cara.y, cfg.cara.z]}>
          <AccesoriosReal lentes={perfil.lentes} barba={perfil.genero === "ella" ? 0 : perfil.barba} joya={perfil.genero === "ella" ? perfil.joya : 0} />
        </group>
      </group>
    </group>
    </group>
  );
}

useGLTF.preload(RUTA_AVATAR);
useGLTF.preload(RUTA_AVATAR_ELLA);
