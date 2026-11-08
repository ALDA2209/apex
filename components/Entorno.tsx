"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

function lienzo(ancho: number, alto: number) {
  const c = document.createElement("canvas");
  c.width = ancho;
  c.height = alto;
  const g = c.getContext("2d")!;
  return { c, g };
}

function aTextura(c: HTMLCanvasElement) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* ---------------- Cielo al atardecer ---------------- */
function Cielo() {
  const grupo = useRef<THREE.Group>(null);

  const textura = useMemo(() => {
    const W = 1024;
    const H = 1024;
    const { c, g } = lienzo(W, H);

    const grad = g.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0.0, "#050816");
    grad.addColorStop(0.2, "#120d38");
    grad.addColorStop(0.34, "#3a1a63");
    grad.addColorStop(0.42, "#8e3a78");
    grad.addColorStop(0.47, "#e0605f");
    grad.addColorStop(0.495, "#ff9a52");
    grad.addColorStop(0.5, "#ffb27a");
    grad.addColorStop(0.505, "#7b3560");
    grad.addColorStop(0.6, "#3a1a4f");
    grad.addColorStop(1.0, "#140a20");
    g.fillStyle = grad;
    g.fillRect(0, 0, W, H);

    g.save();
    g.translate(W * 0.75, H * 0.5);
    g.scale(0.5, 1);
    const sol = g.createRadialGradient(0, 0, 0, 0, 0, H * 0.11);
    sol.addColorStop(0, "rgba(255,240,200,1)");
    sol.addColorStop(0.12, "rgba(255,196,120,0.9)");
    sol.addColorStop(0.5, "rgba(255,130,80,0.25)");
    sol.addColorStop(1, "rgba(255,120,70,0)");
    g.fillStyle = sol;
    g.fillRect(-W, -H, W * 2, H * 2);
    g.restore();

    return aTextura(c);
  }, []);

  useFrame((state) => {
    if (grupo.current) grupo.current.position.copy(state.camera.position);
  });

  return (
    <group ref={grupo}>
      <mesh renderOrder={-1} frustumCulled={false}>
        <sphereGeometry args={[500, 48, 32]} />
        <meshBasicMaterial map={textura} side={THREE.BackSide} fog={false} depthWrite={false} />
      </mesh>
    </group>
  );
}

/* ---------------- Montañas andinas en capas ---------------- */
const CAPAS = [
  { color: "#b2567a", z: -300, fase: 1.1, altura: 150 },
  { color: "#6a2f6b", z: -270, fase: 3.7, altura: 135 },
  { color: "#2e1650", z: -240, fase: 5.3, altura: 115 },
];

function cordillera(color: string, fase: number, altura: number) {
  const W = 2048;
  const H = 256;
  const { c, g } = lienzo(W, H);
  g.fillStyle = color;
  g.beginPath();
  g.moveTo(0, H);
  for (let x = 0; x <= W; x += 4) {
    const a = 1 - Math.abs(Math.sin(x * 0.0046 + fase));
    const b = 1 - Math.abs(Math.sin(x * 0.011 + fase * 2.3));
    const d = Math.sin(x * 0.031 + fase * 5.1) * 0.5 + 0.5;
    g.lineTo(x, H - (altura * (0.55 * a + 0.3 * b + 0.15 * d) + 20));
  }
  g.lineTo(W, H);
  g.closePath();
  g.fill();
  return aTextura(c);
}

function Montanas() {
  const grupo = useRef<THREE.Group>(null);
  const texturas = useMemo(
    () => CAPAS.map((l) => cordillera(l.color, l.fase, l.altura)),
    [],
  );

  useFrame((state) => {
    if (!grupo.current) return;
    grupo.current.position.set(state.camera.position.x * 0.92, 0, state.camera.position.z);
  });

  return (
    <group ref={grupo}>
      {CAPAS.map((l, i) => (
        <mesh key={l.color} position={[0, 52, l.z]} frustumCulled={false}>
          <planeGeometry args={[1000, 125]} />
          <meshBasicMaterial map={texturas[i]} transparent fog={false} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

/* ---------------- Pista ---------------- */
const SEG = 24;
const ANCHO = 9.6;
const LARGO = 360;
const POSTES = 12;
const CENTRO = -120;

function crearAsfalto() {
  const W = 512;
  const H = 256;
  const { c, g } = lienzo(W, H);

  g.fillStyle = "#262933";
  g.fillRect(0, 0, W, H);

  for (let i = 0; i < 9000; i++) {
    const v = 40 + Math.random() * 50;
    g.fillStyle = `rgba(${v},${v},${v + 10},${0.1 + Math.random() * 0.2})`;
    g.fillRect(Math.random() * W, Math.random() * H, 1.5, 1.5);
  }

  const px = (x: number) => ((x + ANCHO / 2) / ANCHO) * W;

  g.fillStyle = "rgba(0,0,0,0.14)";
  for (const centro of [-3, 0, 3]) {
    g.fillRect(px(centro - 0.85) - 12, 0, 24, H);
    g.fillRect(px(centro + 0.85) - 12, 0, 24, H);
  }

  g.fillStyle = "rgba(235,240,255,0.88)";
  for (const x of [-1.5, 1.5]) g.fillRect(px(x) - 3, 24, 6, 96);
  for (const x of [-4.4, 4.4]) g.fillRect(px(x) - 3, 0, 6, H);

  const t = aTextura(c);
  t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1, LARGO / 8);
  t.anisotropy = 8;
  return t;
}

function Poste({ lado, z }: { lado: number; z: number }) {
  return (
    <group position={[lado * 6.4, 0, z]}>
      <mesh position={[0, 2.3, 0]}>
        <cylinderGeometry args={[0.07, 0.11, 4.6, 10]} />
        <meshStandardMaterial color="#2a2f3d" roughness={0.6} metalness={0.5} />
      </mesh>
      <mesh position={[-lado * 0.85, 4.55, 0]}>
        <boxGeometry args={[1.7, 0.08, 0.08]} />
        <meshStandardMaterial color="#2a2f3d" roughness={0.6} metalness={0.5} />
      </mesh>
      <mesh position={[-lado * 1.65, 4.42, 0]}>
        <sphereGeometry args={[0.24, 16, 12]} />
        <meshStandardMaterial color="#000000" emissive="#ffc27a" emissiveIntensity={4} />
      </mesh>
    </group>
  );
}

function Pista() {
  const grupo = useRef<THREE.Group>(null);
  const asfalto = useMemo(crearAsfalto, []);

  useFrame((state) => {
    if (grupo.current) {
      grupo.current.position.z = Math.round(state.camera.position.z / SEG) * SEG;
    }
  });

  return (
    <group ref={grupo}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, CENTRO]}>
        <planeGeometry args={[ANCHO, LARGO]} />
        <meshStandardMaterial map={asfalto} roughness={0.6} metalness={0.2} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, CENTRO]}>
        <planeGeometry args={[700, LARGO + 120]} />
        <meshStandardMaterial color="#1a1226" roughness={1} />
      </mesh>

      {[-1, 1].map((lado) => (
        <group key={lado} position={[lado * 5.1, 0, CENTRO]}>
          <mesh position={[0, 0.3, 0]}>
            <boxGeometry args={[0.2, 0.55, LARGO]} />
            <meshStandardMaterial color="#2e3342" roughness={0.45} metalness={0.5} />
          </mesh>
          <mesh position={[-lado * 0.11, 0.6, 0]}>
            <boxGeometry args={[0.05, 0.05, LARGO]} />
            <meshStandardMaterial color="#000000" emissive="#5eead4" emissiveIntensity={3} />
          </mesh>
        </group>
      ))}

      {Array.from({ length: POSTES }).map((_, i) =>
        [-1, 1].map((lado) => (
          <Poste key={`${i}-${lado}`} lado={lado} z={36 - i * SEG} />
        )),
      )}
    </group>
  );
}

export default function Entorno() {
  return (
    <>
      <Cielo />
      <Montanas />
      <Pista />
    </>
  );
}
