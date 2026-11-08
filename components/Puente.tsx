"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import { CanvasTexture, DoubleSide, SRGBColorSpace } from "three";
import type { Group } from "three";
import { estado, llegarAPuente } from "@/lib/estado";
import { resolverPuente } from "@/lib/niveles";
import { PUENTES, type Puente as DatosPuente } from "@/lib/puentes";

export function crearCartel(titulo: string, sub: string) {
  const c = document.createElement("canvas");
  c.width = 1600;
  c.height = 180;
  const g = c.getContext("2d")!;
  g.fillStyle = "#06121f";
  g.fillRect(0, 0, 1600, 180);
  g.strokeStyle = "#5eead4";
  g.lineWidth = 8;
  g.strokeRect(10, 10, 1580, 160);
  g.textBaseline = "middle";
  g.textAlign = "left";
  g.fillStyle = "#ff7a3d";
  g.font = "800 84px sans-serif";
  g.fillText(titulo, 60, 94);
  const w = g.measureText(titulo).width;
  const x = 60 + w + 60;
  let px = 64;
  do {
    g.font = `700 ${px}px sans-serif`;
    px -= 2;
  } while (g.measureText(sub).width > 1540 - x && px > 24);
  g.fillStyle = "#e6fffb";
  g.fillText(sub, x, 96);
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  return tex;
}

function Oficial({ uniforme, banda }: { uniforme: string; banda: string }) {
  const piel = "#c68642";
  return (
    <group position={[1.7, 0, 4.2]} rotation={[0, Math.PI, 0]}>
      {[-1, 1].map((l) => (
        <RoundedBox
          key={`pierna${l}`}
          args={[0.17, 0.85, 0.2]}
          radius={0.05}
          smoothness={2}
          position={[l * 0.11, 0.43, 0]}
        >
          <meshStandardMaterial color="#141c2c" roughness={0.7} />
        </RoundedBox>
      ))}
      <RoundedBox args={[0.5, 0.62, 0.3]} radius={0.12} smoothness={3} position={[0, 1.18, 0]}>
        <meshStandardMaterial color={uniforme} roughness={0.6} />
      </RoundedBox>
      {[0, 1].map((i) => (
        <RoundedBox
          key={`banda${i}`}
          args={[0.52, 0.06, 0.32]}
          radius={0.02}
          smoothness={2}
          position={[0, 1.08 + i * 0.22, 0]}
        >
          <meshStandardMaterial color="#000000" emissive={banda} emissiveIntensity={1.6} />
        </RoundedBox>
      ))}
      <RoundedBox args={[0.13, 0.55, 0.15]} radius={0.05} smoothness={2} position={[-0.33, 1.15, 0]}>
        <meshStandardMaterial color={uniforme} roughness={0.6} />
      </RoundedBox>
      <RoundedBox
        args={[0.13, 0.55, 0.15]}
        radius={0.05}
        smoothness={2}
        position={[0.42, 1.65, 0]}
        rotation={[0, 0, -0.25]}
      >
        <meshStandardMaterial color={uniforme} roughness={0.6} />
      </RoundedBox>
      <mesh position={[0.5, 1.95, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.6, 8]} />
        <meshStandardMaterial color="#2a2f3a" />
      </mesh>
      <mesh position={[0.5, 2.3, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.26, 0.26, 0.04, 24]} />
        <meshStandardMaterial color="#000000" emissive="#ef4444" emissiveIntensity={1.8} />
      </mesh>
      <mesh position={[0.5, 2.3, -0.03]}>
        <ringGeometry args={[0.13, 0.19, 24]} />
        <meshBasicMaterial color="#ffffff" side={DoubleSide} />
      </mesh>
      <mesh position={[0, 1.66, 0]}>
        <sphereGeometry args={[0.14, 24, 24]} />
        <meshStandardMaterial color={piel} roughness={0.7} />
      </mesh>
      <mesh position={[0, 1.7, 0]}>
        <sphereGeometry args={[0.158, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#16233a" roughness={0.6} />
      </mesh>
      <RoundedBox args={[0.26, 0.03, 0.14]} radius={0.01} smoothness={2} position={[0, 1.69, -0.15]}>
        <meshStandardMaterial color="#16233a" roughness={0.6} />
      </RoundedBox>
      {[-1, 1].map((l) => (
        <mesh key={`ojo${l}`} position={[l * 0.05, 1.65, -0.125]}>
          <sphereGeometry args={[0.014, 10, 10]} />
          <meshStandardMaterial color="#0b0d12" />
        </mesh>
      ))}
    </group>
  );
}

function PuenteActivo({ p, indice }: { p: DatosPuente; indice: number }) {
  const raiz = useRef<Group>(null);
  const brazo = useRef<Group>(null);
  const cartel = useMemo(() => crearCartel(p.titulo, p.subtitulo), [p]);
  const zPuente = -p.distancia;
  const zParada = zPuente + 6;

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    if (raiz.current) raiz.current.visible = estado.activo;
    if (!estado.activo) return;

    const mio = estado.puente === indice;
    if (mio && estado.fase === "libre") {
      const dist = estado.z - zParada;
      if (dist < 70 && dist > -12) {
        estado.velocidad = Math.max(0.12, Math.min(0.99, dist / 30));
        if (dist < 0.8) {
          resolverPuente(indice, { sinComprobante: estado.entregas.filter((v) => v.comprobante === "ninguno").length });
          llegarAPuente(zPuente + 6, p.oficial);
        }
      }
    }

    const b = brazo.current;
    if (b) {
      const cerrado = mio && (estado.fase === "alto" || estado.fase === "dialogo");
      const meta = cerrado ? 0 : 1.35;
      b.rotation.z += (meta - b.rotation.z) * Math.min(1, dt * 4);
    }
  });

  return (
    <group ref={raiz} position={[0, 0, zPuente]} visible={false}>
      {[-1, 1].map((l) => (
        <group key={`pilar${l}`}>
          <RoundedBox args={[0.7, 6.6, 1]} radius={0.12} smoothness={3} position={[l * 5.7, 3.3, 0]}>
            <meshStandardMaterial color="#141b2d" roughness={0.5} metalness={0.5} />
          </RoundedBox>
          <mesh position={[l * 5.5, 3.3, 0.52]}>
            <boxGeometry args={[0.06, 6, 0.04]} />
            <meshStandardMaterial color="#000000" emissive="#5eead4" emissiveIntensity={3} />
          </mesh>
        </group>
      ))}

      <RoundedBox args={[12.4, 1.7, 1.3]} radius={0.12} smoothness={3} position={[0, 6.9, 0]}>
        <meshStandardMaterial color="#0d1424" roughness={0.45} metalness={0.5} />
      </RoundedBox>
      <mesh position={[0, 6.9, 0.67]}>
        <planeGeometry args={[11.8, 1.33]} />
        <meshBasicMaterial map={cartel} toneMapped={false} />
      </mesh>

      <RoundedBox args={[0.5, 1.4, 0.5]} radius={0.08} smoothness={2} position={[-5.1, 0.7, 3.8]}>
        <meshStandardMaterial color="#1b2338" roughness={0.5} metalness={0.4} />
      </RoundedBox>
      <group ref={brazo} position={[-5.1, 1.15, 3.8]} rotation={[0, 0, 1.35]}>
        {Array.from({ length: 8 }, (_, i) => (
          <mesh key={i} position={[0.65 + i * 1.3, 0, 0]}>
            <boxGeometry args={[1.3, 0.22, 0.22]} />
            <meshStandardMaterial
              color={i % 2 ? "#f8fafc" : "#ef4444"}
              emissive={i % 2 ? "#f8fafc" : "#ef4444"}
              emissiveIntensity={0.5}
            />
          </mesh>
        ))}
      </group>

      <mesh position={[0, 0.03, 4.55]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[9.6, 0.45]} />
        <meshStandardMaterial color="#000000" emissive="#ef4444" emissiveIntensity={1.4} />
      </mesh>

      <RoundedBox args={[2.2, 2.6, 2.2]} radius={0.12} smoothness={3} position={[7.2, 1.3, 3]}>
        <meshStandardMaterial color="#17223a" roughness={0.5} metalness={0.4} />
      </RoundedBox>
      <mesh position={[6.08, 1.7, 3]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[1.5, 0.9]} />
        <meshStandardMaterial color="#000000" emissive="#5eead4" emissiveIntensity={1.8} side={DoubleSide} />
      </mesh>

      <Oficial uniforme={p.uniforme} banda={p.banda} />
    </group>
  );
}

export default function Puente() {
  return (
    <group>
      {PUENTES.map((p, i) => (
        <PuenteActivo key={i} p={p} indice={i} />
      ))}
    </group>
  );
}
