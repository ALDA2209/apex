"use client";

import { useMemo } from "react";
import { RoundedBox } from "@react-three/drei";
import { ExtrudeGeometry, Shape } from "three";
import Bodega, { type Variante } from "@/components/Bodega";
import { TIPOS, Vehiculo } from "@/components/Trafico";

/* Todo lo fijo del punto de partida: vereda elevada, rampa y la bodega.
   La vereda cubre el riel de la pista, así que se puede subir por la rampa. */
export const GARAJE = {
  puertaX: 7.4,
  puertaZ: -6,
  rampaX0: 4.1,
  rampaX1: 4.9,
  altura: 0.62,
  zMin: -9,
  zMax: -3,
};

export function Acera({
  z0 = 0,
  linea1,
  linea2,
  variante,
  parqueo = [],
}: {
  z0?: number;
  parqueo?: { tipo: number; z: number }[];
  linea1?: string;
  linea2?: string;
  variante?: Variante;
}) {
  const rampa = useMemo(() => {
    const s = new Shape();
    s.moveTo(0, 0);
    s.lineTo(GARAJE.rampaX1 - GARAJE.rampaX0, 0);
    s.lineTo(GARAJE.rampaX1 - GARAJE.rampaX0, GARAJE.altura);
    s.closePath();
    const g = new ExtrudeGeometry(s, { depth: GARAJE.zMax - GARAJE.zMin, bevelEnabled: false });
    g.translate(0, 0, -(GARAJE.zMax - GARAJE.zMin) / 2);
    return g;
  }, []);

  return (
    <group position={[0, 0, z0]}>
      <RoundedBox
        args={[2.7, GARAJE.altura, 10.4]}
        radius={0.04}
        smoothness={2}
        position={[GARAJE.rampaX1 + 1.35, GARAJE.altura / 2, GARAJE.puertaZ]}
      >
        <meshStandardMaterial color="#3a4157" roughness={0.8} />
      </RoundedBox>
      <mesh geometry={rampa} position={[GARAJE.rampaX0, 0, GARAJE.puertaZ]}>
        <meshStandardMaterial color="#3a4157" roughness={0.8} />
      </mesh>
      {parqueo.map((v, i) => (
        <group key={i} position={[7.7, 0, v.z]}>
          <Vehiculo t={TIPOS[v.tipo]} />
        </group>
      ))}
      <group position={[GARAJE.puertaX + 3, GARAJE.altura, GARAJE.puertaZ]} rotation={[0, -Math.PI / 2, 0]}>
        <Bodega linea1={linea1} linea2={linea2} variante={variante} />
      </group>
    </group>
  );
}

export default function Garaje() {
  return <Acera />;
}
