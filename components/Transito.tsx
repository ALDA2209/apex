"use client";

import { useMemo, useRef } from "react";
import type { MutableRefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import { CanvasTexture, SRGBColorSpace } from "three";
import type { Group, MeshStandardMaterial, PointLight } from "three";
import { estado, multarVelocidad } from "@/lib/estado";
import { RADARES, TOLERANCIA, TRAMOS, multaPorExceso, tramoEn } from "@/lib/transito";

function crearSenal(limite: number) {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const g = c.getContext("2d")!;
  g.clearRect(0, 0, 256, 256);
  g.fillStyle = "#f8fafc";
  g.beginPath();
  g.arc(128, 128, 120, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = "#dc2626";
  g.lineWidth = 26;
  g.beginPath();
  g.arc(128, 128, 106, 0, Math.PI * 2);
  g.stroke();
  g.fillStyle = "#0b0f19";
  g.font = "800 112px sans-serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(String(limite), 128, 138);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

function crearPlaca(texto: string) {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 128;
  const g = c.getContext("2d")!;
  g.fillStyle = "#0b1a2a";
  g.fillRect(0, 0, 512, 128);
  g.strokeStyle = "#fbbf24";
  g.lineWidth = 8;
  g.strokeRect(6, 6, 500, 116);
  g.fillStyle = "#fbbf24";
  g.font = "800 58px sans-serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(texto, 256, 68);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

function Senal({ limite, x, z }: { limite: number; x: number; z: number }) {
  const tex = useMemo(() => crearSenal(limite), [limite]);
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 1.4, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 2.8, 8]} />
        <meshStandardMaterial color="#9aa5b8" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0, 2.95, 0.04]}>
        <circleGeometry args={[0.6, 32]} />
        <meshBasicMaterial map={tex} transparent toneMapped={false} />
      </mesh>
      <mesh position={[0, 2.95, 0.02]}>
        <circleGeometry args={[0.66, 32]} />
        <meshStandardMaterial color="#1a2236" />
      </mesh>
    </group>
  );
}

function Radar({ z, indice, flash }: { z: number; indice: number; flash: MutableRefObject<number[]> }) {
  const placa = useMemo(() => crearPlaca("RADAR"), []);
  const luz = useRef<PointLight>(null);
  const led = useRef<MeshStandardMaterial>(null);
  useFrame(() => {
    const dt = performance.now() - (flash.current[indice] ?? 0);
    const on = dt < 260;
    if (luz.current) luz.current.intensity = on ? 40 : 0;
    if (led.current) led.current.emissiveIntensity = on ? 6 : 1.2 + Math.sin(performance.now() / 300) * 0.6;
  });
  return (
    <group position={[5.9, 0, z]}>
      <mesh position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 2.4, 8]} />
        <meshStandardMaterial color="#6b7488" metalness={0.5} roughness={0.5} />
      </mesh>
      <RoundedBox args={[0.9, 0.8, 0.7]} radius={0.06} smoothness={3} position={[0, 2.7, 0]}>
        <meshStandardMaterial color="#cbd5e1" roughness={0.45} metalness={0.4} />
      </RoundedBox>
      <mesh position={[-0.22, 2.7, 0.36]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.17, 0.17, 0.08, 20]} />
        <meshStandardMaterial color="#05070c" roughness={0.2} metalness={0.8} />
      </mesh>
      <mesh position={[0.25, 2.88, 0.36]}>
        <sphereGeometry args={[0.07, 12, 12]} />
        <meshStandardMaterial ref={led} color="#000000" emissive="#ef4444" emissiveIntensity={1.2} />
      </mesh>
      <mesh position={[0, 2.18, 0.36]}>
        <planeGeometry args={[0.8, 0.2]} />
        <meshBasicMaterial map={placa} toneMapped={false} />
      </mesh>
      <pointLight ref={luz} position={[-1.2, 2.7, 1.5]} intensity={0} distance={14} color="#ffffff" />
    </group>
  );
}

/* Letreros de velocidad, radares y la medición: si pasas por un radar por encima del límite, te multan. */
export default function Transito() {
  const raiz = useRef<Group>(null);
  const ult = useRef<number | null>(null);
  const flash = useRef<number[]>(RADARES.map(() => 0));

  useFrame(() => {
    if (raiz.current) raiz.current.visible = estado.activo;
    if (!estado.activo) {
      ult.current = null;
      return;
    }
    const d = -estado.z;
    if (ult.current === null || d < ult.current - 30) ult.current = d;
    if (estado.apie || estado.fase !== "libre") {
      ult.current = d;
      return;
    }
    RADARES.forEach((r, i) => {
      if (ult.current! < r && d >= r) {
        flash.current[i] = performance.now();
        const limite = tramoEn(r).limite;
        const kmh = estado.kmh;
        if (kmh > limite + TOLERANCIA) {
          const m = multaPorExceso(kmh - limite);
          multarVelocidad(kmh, limite, m.monto, m.riesgo);
        }
      }
    });
    ult.current = d;
  });

  return (
    <group ref={raiz} visible={false}>
      {TRAMOS.map((t, i) => (
        <group key={i}>
          <Senal limite={t.limite} x={-5.7} z={-(t.desde + 14)} />
          <Senal limite={t.limite} x={5.7} z={-(t.desde + 14)} />
        </group>
      ))}
      {RADARES.map((r, i) => (
        <group key={r}>
          <Senal limite={tramoEn(r).limite} x={5.7} z={-(r - 22)} />
          <Radar z={-r} indice={i} flash={flash} />
        </group>
      ))}
    </group>
  );
}
