"use client";

import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { BufferAttribute, Color, Mesh } from "three";

export const RUTA_MOTO = "/models/mototaxi.glb";

/* Escala y posición: el frente del modelo (-x) pasa a mirar hacia -z y el asiento queda en z = 0,15 */
const ESCALA = 1.5;
const ALTO = 0.6937 * ESCALA;
const DESPLAZA_Z = 0.15 + 0.17 * ESCALA;

const BLANCO = new Color("#f4f6fa");
const NEGRO = new Color("#111318");
const VIDRIO = new Color("#26364f");
const ASIENTO = new Color("#1c202b");
const GRIS = new Color("#2a2e38");
const FARO = new Color("#fff0c8");

/* 0 cuerpo, 1 techo, 2 rueda/bajos, 3 vidrio, 4 asiento, 5 espejo, 6 faro */
function clasificar(x: number, y: number, z: number, nx: number, ny: number): number {
  const rueda =
    (Math.abs(x - 0.66) < 0.22 && y < -0.3 && Math.abs(z) > 0.28) ||
    (x < -0.58 && y < -0.33 && Math.abs(z) < 0.16);
  if (rueda || y < -0.5) return 2;
  if (Math.abs(z) > 0.47 && y > -0.1 && x < -0.45) return 5;
  if (x < -0.5 && y > -0.02 && nx < -0.35 && ny < 0.6) return 3;
  if (y > 0.4) return 1;
  if (x < -0.72 && y > -0.34 && y < -0.1 && Math.abs(z) > 0.18 && nx < -0.5) return 6;
  if (y > -0.38 && y < 0.1 && ny > 0.55 && Math.abs(z) < 0.5 && x > -0.45) return 4;
  return 0;
}

export default function MotoReal({ color }: { color: string }) {
  const { scene } = useGLTF(RUTA_MOTO);

  const base = useMemo(() => {
    let malla: Mesh | null = null;
    scene.traverse((o) => {
      if (!malla && (o as Mesh).isMesh) malla = o as Mesh;
    });
    const geo = (malla as unknown as Mesh).geometry.clone();
    geo.computeVertexNormals();
    const pos = geo.getAttribute("position");
    const nor = geo.getAttribute("normal");
    const region = new Uint8Array(pos.count);
    for (let i = 0; i < pos.count; i++) {
      region[i] = clasificar(pos.getX(i), pos.getY(i), pos.getZ(i), nor.getX(i), nor.getY(i));
    }
    geo.setAttribute("color", new BufferAttribute(new Float32Array(pos.count * 3), 3));
    return { geo, region };
  }, [scene]);

  useMemo(() => {
    const cuerpo = new Color(color);
    const col = base.geo.getAttribute("color") as BufferAttribute;
    const tabla = [cuerpo, BLANCO, NEGRO, VIDRIO, ASIENTO, GRIS, FARO];
    for (let i = 0; i < base.region.length; i++) {
      const c = tabla[base.region[i]];
      col.setXYZ(i, c.r, c.g, c.b);
    }
    col.needsUpdate = true;
  }, [base, color]);

  return (
    <group rotation={[0, -Math.PI / 2, 0]} scale={ESCALA} position={[0, ALTO, DESPLAZA_Z]}>
      <mesh geometry={base.geo}>
        <meshStandardMaterial vertexColors roughness={0.55} metalness={0.05} />
      </mesh>
    </group>
  );
}

useGLTF.preload(RUTA_MOTO);
