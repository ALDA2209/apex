"use client";

import { useMemo } from "react";
import { RoundedBox } from "@react-three/drei";
import { CanvasTexture, SRGBColorSpace } from "three";

function crearLetrero(linea1: string, linea2: string) {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 256;
  const g = c.getContext("2d")!;
  g.fillStyle = "#08111f";
  g.fillRect(0, 0, 1024, 256);
  g.strokeStyle = "#5eead4";
  g.lineWidth = 8;
  g.strokeRect(10, 10, 1004, 236);
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillStyle = "#ff7a3d";
  g.font = "800 92px sans-serif";
  g.fillText(linea1, 512, 100);
  g.fillStyle = "#e6fffb";
  g.font = "700 54px sans-serif";
  g.fillText(linea2, 512, 190);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

/** Frente hacia +z. Para mirar a la carretera, rótala con rotation={[0, -Math.PI/2, 0]} */
export type Variante = "bodega" | "restaurante" | "taller";

export default function Bodega({
  linea1 = "BODEGA LA FAMILIA",
  linea2 = "REPUESTOS · ABARROTES",
  variante = "bodega",
}: {
  linea1?: string;
  linea2?: string;
  variante?: Variante;
}) {
  const letrero = useMemo(() => crearLetrero(linea1, linea2), [linea1, linea2]);
  return (
    <group>
      {/* cuerpo */}
      <RoundedBox args={[10, 4.4, 6]} radius={0.15} smoothness={3} position={[0, 2.2, 0]}>
        <meshStandardMaterial color="#26304c" roughness={0.75} />
      </RoundedBox>
      {/* techo */}
      <RoundedBox args={[10.6, 0.3, 6.6]} radius={0.08} smoothness={2} position={[0, 4.5, 0]}>
        <meshStandardMaterial color="#141b2d" roughness={0.6} metalness={0.3} />
      </RoundedBox>

      {/* letrero */}
      <mesh position={[0, 3.82, 3.07]}>
        <planeGeometry args={[5.4, 1.35]} />
        <meshBasicMaterial map={letrero} toneMapped={false} />
      </mesh>

      {/* toldo a rayas */}
      {Array.from({ length: 10 }, (_, i) => (
        <mesh key={i} position={[-4.5 + i, 2.72, 3.6]} rotation={[0.45, 0, 0]}>
          <boxGeometry args={[1, 0.08, 1.7]} />
          <meshStandardMaterial color={i % 2 ? "#f8fafc" : "#ff7a3d"} roughness={0.8} />
        </mesh>
      ))}

      {/* puerta */}
      <RoundedBox args={[1.7, 2.5, 0.2]} radius={0.05} smoothness={2} position={[0, 1.25, 3.0]}>
        <meshStandardMaterial color="#0b111f" roughness={0.5} />
      </RoundedBox>
      <mesh position={[0, 1.4, 3.12]}>
        <planeGeometry args={[1.35, 2.05]} />
        <meshStandardMaterial color="#000000" emissive="#ffc27a" emissiveIntensity={1.5} />
      </mesh>
      <mesh position={[0.55, 1.2, 3.16]}>
        <boxGeometry args={[0.06, 0.5, 0.05]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* vitrinas con estantes */}
      {[-3.1, 3.1].map((x) => (
        <group key={x} position={[x, 1.6, 3.02]}>
          <mesh>
            <planeGeometry args={[2.6, 1.7]} />
            <meshStandardMaterial color="#000000" emissive="#ffb866" emissiveIntensity={1.1} />
          </mesh>
          {[-0.45, 0.1, 0.62].map((y) => (
            <mesh key={y} position={[0, y, 0.04]}>
              <boxGeometry args={[2.4, 0.06, 0.1]} />
              <meshStandardMaterial color="#3a2a1a" />
            </mesh>
          ))}
          {[-0.9, -0.3, 0.35, 0.9].map((px, i) => (
            <mesh key={px} position={[px, -0.25 + (i % 2) * 0.55, 0.1]}>
              <boxGeometry args={[0.4, 0.34, 0.14]} />
              <meshStandardMaterial color={["#ef4444", "#2dd4bf", "#fbbf24", "#60a5fa"][i]} />
            </mesh>
          ))}
        </group>
      ))}

      {/* luz sobre la puerta */}
      <mesh position={[0, 2.85, 3.3]}>
        <sphereGeometry args={[0.14, 16, 16]} />
        <meshStandardMaterial color="#000000" emissive="#fff1c2" emissiveIntensity={3} />
      </mesh>
      <pointLight position={[0, 2.5, 4.2]} intensity={8} distance={9} color="#ffd9a0" />

      {variante === "restaurante" &&
        [-2.4, 2.4].map((x) => (
          <group key={x} position={[x, 0, 5.6]}>
            <mesh position={[0, 0.72, 0]}>
              <cylinderGeometry args={[0.5, 0.5, 0.06, 20]} />
              <meshStandardMaterial color="#f8fafc" roughness={0.6} />
            </mesh>
            <mesh position={[0, 0.36, 0]}>
              <cylinderGeometry args={[0.06, 0.06, 0.72, 10]} />
              <meshStandardMaterial color="#2a2f3a" />
            </mesh>
            {[-0.8, 0.8].map((s) => (
              <mesh key={s} position={[s, 0.24, 0]}>
                <cylinderGeometry args={[0.22, 0.22, 0.48, 14]} />
                <meshStandardMaterial color="#ff7a3d" roughness={0.7} />
              </mesh>
            ))}
          </group>
        ))}
      {variante === "taller" && (
        <group position={[-3.6, 0, 3.5]}>
          <mesh position={[0, 3.3, 0]}>
            <boxGeometry args={[0.2, 6.6, 0.2]} />
            <meshStandardMaterial color="#1a2236" />
          </mesh>
          <mesh position={[0, 5.6, 0.14]}>
            <boxGeometry args={[1.2, 0.36, 0.08]} />
            <meshStandardMaterial color="#000000" emissive="#2dd4bf" emissiveIntensity={3} />
          </mesh>
          <mesh position={[0, 5.6, 0.14]}>
            <boxGeometry args={[0.36, 1.2, 0.08]} />
            <meshStandardMaterial color="#000000" emissive="#2dd4bf" emissiveIntensity={3} />
          </mesh>
        </group>
      )}

      {/* neumáticos y cilindros afuera */}
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[-4.3, 0.18 + i * 0.36, 4.1]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.38, 0.17, 12, 24]} />
          <meshStandardMaterial color="#121418" roughness={0.9} />
        </mesh>
      ))}
      <mesh position={[4.2, 0.45, 4.1]}>
        <cylinderGeometry args={[0.32, 0.32, 0.9, 16]} />
        <meshStandardMaterial color="#1d6aa5" roughness={0.6} metalness={0.3} />
      </mesh>
      <RoundedBox args={[0.8, 0.6, 0.8]} radius={0.04} smoothness={2} position={[3.4, 0.3, 4.4]}>
        <meshStandardMaterial color="#8a5a34" roughness={0.9} />
      </RoundedBox>
    </group>
  );
}
