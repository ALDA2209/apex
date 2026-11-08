"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import { CanvasTexture, SRGBColorSpace } from "three";
import type { Group, MeshStandardMaterial } from "three";
import Avatar from "@/components/Avatar";
import { estado, useComedor } from "@/lib/estado";
import type { Perfil } from "@/lib/perfil";

/* El interior del restaurante vive lejos de la pista; la cámara se muda hasta aquí. */
const SALA = { x: 600, z: 600 };
const MESA = { x: -1.6, z: 0.4 };
const MOSTRADOR = { x: 2.4, z: -2.2 };
const JUNTO = { x: -0.7, z: 0.4 };

const CLIENTES: { x: number; z: number; giro: number; perfil: Perfil; fase: number }[] = [
  { x: 1.35, z: 1.8, giro: -Math.PI / 2, perfil: { nombre: "", color: "#6d7bff", casco: 0, piel: 2 }, fase: 0 },
  { x: 3.05, z: 1.8, giro: Math.PI / 2, perfil: { nombre: "", color: "#f43f5e", casco: 0, piel: 1 }, fase: 2 },
  { x: 2.35, z: 0.4, giro: -Math.PI / 2, perfil: { nombre: "", color: "#2dd4bf", casco: 0, piel: 3 }, fase: 4 },
  { x: 4.05, z: 0.4, giro: Math.PI / 2, perfil: { nombre: "", color: "#a3e635", casco: 0, piel: 0 }, fase: 1 },
  { x: -3.4, z: -1.25, giro: Math.PI, perfil: { nombre: "", color: "#ff7a3d", casco: 0, piel: 4 }, fase: 3 },
];
const MESAS = [
  { x: 2.2, z: 1.8 },
  { x: 3.2, z: 0.4 },
  { x: -3.4, z: -2.1 },
  { x: MESA.x, z: MESA.z },
];

function pizarra() {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 512;
  const g = c.getContext("2d")!;
  g.fillStyle = "#0e1a24";
  g.fillRect(0, 0, 1024, 512);
  g.strokeStyle = "#ff7a3d";
  g.lineWidth = 10;
  g.strokeRect(14, 14, 996, 484);
  g.fillStyle = "#ff7a3d";
  g.font = "800 70px sans-serif";
  g.textAlign = "center";
  g.fillText("MENÚ DEL DÍA", 512, 100);
  g.fillStyle = "#e6fffb";
  g.font = "600 42px sans-serif";
  [
    "Ceviche · S/ 24",
    "Pachamanca · S/ 28",
    "Cecina con yuca · S/ 22",
    "Chicharrón · S/ 20",
    "Locro · S/ 16",
  ].forEach((t, i) => g.fillText(t, 512, 168 + i * 52));
  g.fillStyle = "#5eead4";
  g.fillText("Bebidas desde S/ 3", 512, 168 + 5 * 52 + 14);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

function Mesa({ x, z, mantel }: { x: number; z: number; mantel: string }) {
  return (
    <group position={[x, 0, z]}>
      <RoundedBox args={[1.3, 0.06, 0.9]} radius={0.02} smoothness={2} position={[0, 0.75, 0]}>
        <meshStandardMaterial color={mantel} roughness={0.8} />
      </RoundedBox>
      <mesh position={[0, 0.37, 0]}>
        <cylinderGeometry args={[0.07, 0.09, 0.74, 10]} />
        <meshStandardMaterial color="#2a2f3a" />
      </mesh>
      {[-0.85, 0.85].map((s) => (
        <group key={s} position={[s, 0, 0]}>
          <mesh position={[0, 0.45, 0]}>
            <boxGeometry args={[0.46, 0.06, 0.46]} />
            <meshStandardMaterial color="#6b3f1d" roughness={0.8} />
          </mesh>
          <mesh position={[s > 0 ? 0.2 : -0.2, 0.75, 0]}>
            <boxGeometry args={[0.05, 0.6, 0.46]} />
            <meshStandardMaterial color="#6b3f1d" roughness={0.8} />
          </mesh>
          {[[-0.19, -0.19], [0.19, -0.19], [-0.19, 0.19], [0.19, 0.19]].map(([a, b], i) => (
            <mesh key={i} position={[a, 0.22, b]}>
              <boxGeometry args={[0.04, 0.44, 0.04]} />
              <meshStandardMaterial color="#3d2411" />
            </mesh>
          ))}
        </group>
      ))}
      <mesh position={[0, 0.79, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.1, 10]} />
        <meshStandardMaterial color="#ff7a3d" emissive="#ff7a3d" emissiveIntensity={0.6} />
      </mesh>
    </group>
  );
}

/* Lo que pediste: plato y/o vaso. Lee los colores del estado en cada cuadro. */
function Servido() {
  const comida = useRef<Group>(null);
  const vaso = useRef<Group>(null);
  const mats = useRef<(MeshStandardMaterial | null)[]>([]);
  const liquido = useRef<MeshStandardMaterial>(null);
  useFrame(() => {
    if (comida.current) comida.current.visible = !!estado.platoColor;
    if (vaso.current) vaso.current.visible = !!estado.bebidaColor;
    mats.current.forEach((m, i) => {
      if (m && i !== 3 && estado.platoColor) m.color.set(estado.platoColor);
    });
    if (liquido.current && estado.bebidaColor) liquido.current.color.set(estado.bebidaColor);
  });
  return (
    <group>
      <group ref={comida}>
        <mesh position={[0, 0.02, 0]}>
          <cylinderGeometry args={[0.22, 0.2, 0.03, 20]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.4} />
        </mesh>
        <group position={[0, 0.05, 0]}>
          {[
            [0, 0, 0.1],
            [0.08, 0.02, 0.08],
            [-0.08, 0.03, 0.07],
            [0.02, 0.05, 0.07],
          ].map(([a, b, r], i) => (
            <mesh key={i} position={[a, b, 0]}>
              <sphereGeometry args={[r, 12, 12]} />
              <meshStandardMaterial
                ref={(m) => {
                  mats.current[i] = m;
                }}
                color={i === 3 ? "#fbbf24" : "#f0c987"}
                roughness={0.7}
              />
            </mesh>
          ))}
        </group>
      </group>
      {/* vaso con la bebida */}
      <group ref={vaso} position={[0.3, 0, 0.12]}>
        <mesh position={[0, 0.09, 0]}>
          <cylinderGeometry args={[0.055, 0.042, 0.18, 16]} />
          <meshStandardMaterial color="#dff3ff" transparent opacity={0.35} roughness={0.1} />
        </mesh>
        <mesh position={[0, 0.07, 0]}>
          <cylinderGeometry args={[0.05, 0.04, 0.13, 16]} />
          <meshStandardMaterial ref={liquido} color="#f6c445" roughness={0.3} />
        </mesh>
      </group>
    </group>
  );
}

export default function Comedor({ perfil }: { perfil: Perfil }) {
  const activo = useComedor();
  const camarero = useRef<Group>(null);
  const bandeja = useRef<Group>(null);
  const sobreMesa = useRef<Group>(null);
  const comidaMesa = useRef<Group>(null);
  const marcha = useRef(0);
  const come = useRef(0);
  const comeClientes = useRef(CLIENTES.map(() => 0));
  const quieto = useRef(0);
  const refsClientes = useRef(CLIENTES.map(() => ({ current: 0 })));
  const pizarraTex = useMemo(() => (typeof document !== "undefined" ? pizarra() : null), []);

  useFrame(({ camera, clock }) => {
    if (!estado.comedor) return;
    const t = clock.elapsedTime;
    camera.position.set(SALA.x - 0.1 + Math.sin(t * 0.3) * 0.08, 1.85, SALA.z + 3.4);
    camera.lookAt(SALA.x - 1.9, 0.85, SALA.z + 0.3);

    CLIENTES.forEach((c, i) => {
      refsClientes.current[i].current = Math.sin(t * 0.7 + c.fase) > 0.55 ? 1 : 0;
    });

    // el mesero va por el plato y lo trae a tu mesa
    const e = estado.comedorT > 0 ? (performance.now() - estado.comedorT) / 1000 : -1;
    let cx = MOSTRADOR.x;
    let cz = MOSTRADOR.z;
    let giro = Math.PI;
    let anda = 0;
    let lleva = false;
    let enMesa = false;
    if (e >= 0) {
      if (e < 1.5) {
        lleva = e > 0.8;
      } else if (e < 4.5) {
        const u = (e - 1.5) / 3;
        cx = MOSTRADOR.x + (JUNTO.x - MOSTRADOR.x) * u;
        cz = MOSTRADOR.z + (JUNTO.z - MOSTRADOR.z) * u;
        giro = Math.atan2(-(JUNTO.x - MOSTRADOR.x), -(JUNTO.z - MOSTRADOR.z));
        anda = 0.8;
        lleva = true;
      } else if (e < 5.3) {
        cx = JUNTO.x;
        cz = JUNTO.z;
        giro = Math.PI / 2;
        lleva = e < 4.8;
        enMesa = e >= 4.8;
      } else if (e < 8.3) {
        const u = (e - 5.3) / 3;
        cx = JUNTO.x + (MOSTRADOR.x - JUNTO.x) * u;
        cz = JUNTO.z + (MOSTRADOR.z - JUNTO.z) * u;
        giro = Math.atan2(-(MOSTRADOR.x - JUNTO.x), -(MOSTRADOR.z - JUNTO.z));
        anda = 0.8;
        enMesa = true;
      } else {
        enMesa = true;
      }
    }
    marcha.current += (anda - marcha.current) * 0.2;
    quieto.current = e;
    if (camarero.current) {
      camarero.current.position.set(cx, 0, cz);
      camarero.current.rotation.y = giro;
    }
    if (bandeja.current) bandeja.current.visible = lleva;
    if (sobreMesa.current) sobreMesa.current.visible = enMesa;
    if (comidaMesa.current) {
      const s = e > 5 ? Math.max(0.15, 1 - (e - 5) / 5) : 1;
      comidaMesa.current.scale.setScalar(s);
    }
    come.current = enMesa && e > 5.4 && e < 9.4 ? 1 : 0;
    void comeClientes;
  });

  if (!activo) return null;

  return (
    <group position={[SALA.x, 0, SALA.z]}>
      {/* piso, techo y paredes */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <planeGeometry args={[11, 8]} />
        <meshStandardMaterial color="#8a5a34" roughness={0.85} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 3.4, 0]}>
        <planeGeometry args={[11, 8]} />
        <meshStandardMaterial color="#1b2338" roughness={0.9} />
      </mesh>
      {[
        [0, -4, 11, 0],
        [0, 4, 11, Math.PI],
      ].map(([x, z, w, r], i) => (
        <mesh key={i} position={[x, 1.7, z]} rotation={[0, r, 0]}>
          <planeGeometry args={[w, 3.4]} />
          <meshStandardMaterial color={i ? "#2c3a5e" : "#33466f"} roughness={0.9} />
        </mesh>
      ))}
      {[-5.5, 5.5].map((x, i) => (
        <mesh key={i} position={[x, 1.7, 0]} rotation={[0, i ? -Math.PI / 2 : Math.PI / 2, 0]}>
          <planeGeometry args={[8, 3.4]} />
          <meshStandardMaterial color="#2c3a5e" roughness={0.9} />
        </mesh>
      ))}

      {/* pizarra con el menú */}
      {pizarraTex && (
        <mesh position={[-1.5, 2.0, -3.95]}>
          <planeGeometry args={[3.2, 1.6]} />
          <meshBasicMaterial map={pizarraTex} toneMapped={false} />
        </mesh>
      )}

      {/* mostrador y cocina */}
      <RoundedBox args={[3.2, 1.05, 0.8]} radius={0.04} smoothness={2} position={[MOSTRADOR.x + 0.4, 0.52, -3.4]}>
        <meshStandardMaterial color="#26304c" roughness={0.6} />
      </RoundedBox>
      <mesh position={[MOSTRADOR.x + 0.4, 2.0, -3.95]}>
        <planeGeometry args={[2.4, 1.1]} />
        <meshStandardMaterial color="#000000" emissive="#ffb866" emissiveIntensity={1.6} />
      </mesh>
      <mesh position={[MOSTRADOR.x + 1.4, 1.1, -3.4]}>
        <boxGeometry args={[0.4, 0.14, 0.3]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.6} roughness={0.4} />
      </mesh>

      {/* mesas y comensales */}
      {MESAS.map((m, i) => (
        <Mesa key={i} x={m.x} z={m.z} mantel={i === 3 ? "#f8fafc" : i % 2 ? "#ff7a3d" : "#f4e3c8"} />
      ))}
      {CLIENTES.map((c, i) => (
        <group key={i} position={[c.x, 0, c.z]} rotation={[0, c.giro, 0]}>
          <Avatar perfil={c.perfil} marcha={quieto} sentado come={refsClientes.current[i]} />
        </group>
      ))}

      {/* tú */}
      <group position={[MESA.x - 0.85, 0, MESA.z]} rotation={[0, -Math.PI / 2, 0]}>
        <Avatar perfil={perfil} marcha={marcha} sentado come={come} />
      </group>

      {/* tu plato sobre la mesa */}
      <group ref={sobreMesa} position={[MESA.x + 0.1, 0.78, MESA.z]} visible={false}>
        <group ref={comidaMesa}>
          <Servido />
        </group>
      </group>

      {/* el mesero */}
      <group ref={camarero} position={[MOSTRADOR.x, 0, MOSTRADOR.z]} rotation={[0, Math.PI, 0]}>
        <Avatar perfil={{ nombre: "", color: "#f8fafc", casco: 0, piel: 2 }} marcha={marcha} />
        <group ref={bandeja} position={[0, 1.15, -0.45]} visible={false}>
          <Servido />
        </group>
      </group>

      {/* luces cálidas */}
      {[-3, 0, 3].map((x) => (
        <group key={x} position={[x, 2.9, 0.2]}>
          <mesh>
            <sphereGeometry args={[0.14, 12, 12]} />
            <meshStandardMaterial color="#000000" emissive="#ffd9a0" emissiveIntensity={3} />
          </mesh>
          <pointLight intensity={14} distance={9} color="#ffd9a0" />
        </group>
      ))}
    </group>
  );
}
