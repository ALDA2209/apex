"use client";

import { useMemo } from "react";
import { RoundedBox } from "@react-three/drei";
import { DoubleSide, ExtrudeGeometry, Shape } from "three";

/* Cascos pensados para ella. Se ponen igual que los del varón (cabeza de radio ~0,14; el frente mira a -z),
   pero con otra forma y otros colores: lazo, orejitas, corazones y flores. */

function Corazon({ color, escala = 0.1, ...resto }: { color: string; escala?: number; position?: [number, number, number]; rotation?: [number, number, number] }) {
  const geo = useMemo(() => {
    const s = new Shape();
    s.moveTo(0, -0.5);
    s.bezierCurveTo(-0.9, 0.05, -0.55, 0.75, 0, 0.35);
    s.bezierCurveTo(0.55, 0.75, 0.9, 0.05, 0, -0.5);
    const g = new ExtrudeGeometry(s, { depth: 0.22, bevelEnabled: true, bevelSize: 0.06, bevelThickness: 0.07, bevelSegments: 3, curveSegments: 14 });
    g.translate(0, 0, -0.11);
    return g;
  }, []);
  return (
    <mesh geometry={geo} scale={escala} {...resto}>
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.55} metalness={0.2} roughness={0.3} />
    </mesh>
  );
}

/* Parte de arriba de un casco abierto: se ve la cara y el cabello */
function CascaraAbierta({ color, brillo = 0.4 }: { color: string; brillo?: number }) {
  return (
    <>
      <mesh>
        <sphereGeometry args={[0.175, 32, 12, 0, Math.PI * 2, 0, Math.PI * 0.36]} />
        <meshStandardMaterial color={color} metalness={0.25} roughness={brillo} side={DoubleSide} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.175, 32, 10, 5.56, 4.58, Math.PI * 0.36, Math.PI * 0.26]} />
        <meshStandardMaterial color={color} metalness={0.25} roughness={brillo} side={DoubleSide} />
      </mesh>
    </>
  );
}

function CascoCompleto({ cascara, visera, children }: { cascara: string; visera: string; children?: React.ReactNode }) {
  return (
    <group position={[0, 0.015, 0]}>
      <group scale={[1, 0.96, 1.06]}>
        <mesh>
          <sphereGeometry args={[0.185, 32, 28]} />
          <meshStandardMaterial color={cascara} metalness={0.35} roughness={0.22} />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.19, 32, 12, Math.PI * 1.5 - 0.95, 1.9, Math.PI * 0.38, Math.PI * 0.2]} />
          <meshStandardMaterial color={visera} metalness={0.9} roughness={0.12} />
        </mesh>
      </group>
      {children}
    </group>
  );
}

/* 0 · Perla con lazo: casco integral rosado nacarado, visera dorada rosa y un lazo del color de tu perfil */
function PerlaConLazo({ color }: { color: string }) {
  return (
    <CascoCompleto cascara="#f7dce8" visera="#c97c8f">
      <group position={[0, 0.185, 0.03]}>
        {[-1, 1].map((l) => (
          <mesh key={l} position={[l * 0.062, 0, 0]} rotation={[0, 0, l * -0.3]} scale={[1.5, 0.95, 0.75]}>
            <sphereGeometry args={[0.045, 18, 14]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.45} roughness={0.35} />
          </mesh>
        ))}
        <mesh scale={[1, 1, 0.9]}>
          <sphereGeometry args={[0.03, 16, 14]} />
          <meshStandardMaterial color="#fff4f8" emissive={color} emissiveIntensity={0.25} roughness={0.3} />
        </mesh>
      </group>
    </CascoCompleto>
  );
}

/* 1 · Orejitas: casco abierto lila con orejas de gatita */
function Orejitas({ color }: { color: string }) {
  return (
    <group position={[0, 0.015, 0]}>
      <CascaraAbierta color="#cdb5f2" brillo={0.3} />
      {[-1, 1].map((l) => (
        <group key={l} position={[l * 0.1, 0.145, 0.015]} rotation={[0, 0, l * -0.4]}>
          <mesh>
            <coneGeometry args={[0.062, 0.115, 4]} />
            <meshStandardMaterial color="#cdb5f2" metalness={0.25} roughness={0.3} />
          </mesh>
          <mesh position={[0, -0.006, -0.02]} scale={[0.62, 0.7, 0.4]}>
            <coneGeometry args={[0.062, 0.115, 4]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} roughness={0.5} />
          </mesh>
        </group>
      ))}
      <RoundedBox args={[0.24, 0.012, 0.09]} radius={0.006} smoothness={2} position={[0, 0.07, -0.185]} rotation={[0.25, 0, 0]}>
        <meshStandardMaterial color="#e9def9" roughness={0.4} />
      </RoundedBox>
    </group>
  );
}

/* 2 · Corazones: casco integral fucsia con visera oscura y corazones brillantes arriba */
function Corazones({ color }: { color: string }) {
  return (
    <CascoCompleto cascara="#ff5aa5" visera="#2a0f2a">
      <Corazon color={color} escala={0.11} position={[0, 0.215, 0.01]} />
      <Corazon color="#fff0f6" escala={0.055} position={[-0.105, 0.165, 0.01]} rotation={[0, 0, 0.45]} />
      <Corazon color="#fff0f6" escala={0.055} position={[0.105, 0.165, 0.01]} rotation={[0, 0, -0.45]} />
    </CascoCompleto>
  );
}

/* 3 · Flores: casco abierto crema con un ramito de flores al costado */
function Flores({ color }: { color: string }) {
  const petalos = Array.from({ length: 6 }, (_, i) => (i / 6) * Math.PI * 2);
  return (
    <group position={[0, 0.015, 0]}>
      <CascaraAbierta color="#f4e7d0" brillo={0.45} />
      <RoundedBox args={[0.24, 0.012, 0.09]} radius={0.006} smoothness={2} position={[0, 0.07, -0.185]} rotation={[0.25, 0, 0]}>
        <meshStandardMaterial color="#e7d3b3" roughness={0.5} />
      </RoundedBox>
      {/* flor grande y flor chica, a la izquierda del casco */}
      {[
        { p: [-0.158, 0.075, -0.045] as [number, number, number], e: 1 },
        { p: [-0.15, 0.03, 0.035] as [number, number, number], e: 0.65 },
      ].map((f, k) => (
        <group key={k} position={f.p} rotation={[0, -Math.PI / 2, 0]} scale={f.e}>
          {petalos.map((a, i) => (
            <mesh key={i} position={[Math.cos(a) * 0.03, Math.sin(a) * 0.03, 0]} scale={[1, 1, 0.55]}>
              <sphereGeometry args={[0.022, 12, 10]} />
              <meshStandardMaterial color={k === 0 ? color : "#fff4f8"} emissive={k === 0 ? color : "#ffd6e6"} emissiveIntensity={0.3} roughness={0.5} />
            </mesh>
          ))}
          <mesh>
            <sphereGeometry args={[0.017, 12, 10]} />
            <meshStandardMaterial color="#f2c14e" metalness={0.5} roughness={0.35} />
          </mesh>
        </group>
      ))}
      {[-0.5, 0.5].map((r, i) => (
        <mesh key={i} position={[-0.152, 0.03 + (i ? -0.04 : 0.1), -0.075 + i * 0.12]} rotation={[0, 0, r]} scale={[0.5, 1.3, 0.4]}>
          <sphereGeometry args={[0.018, 10, 8]} />
          <meshStandardMaterial color="#6fae6a" roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

export default function CascoElla({ casco, color }: { casco: number; color: string }) {
  return (
    <>
      {casco === 0 && <PerlaConLazo color={color} />}
      {casco === 1 && <Orejitas color={color} />}
      {casco === 2 && <Corazones color={color} />}
      {casco === 3 && <Flores color={color} />}
    </>
  );
}
