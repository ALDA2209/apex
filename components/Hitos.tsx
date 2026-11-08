"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import type { Group } from "three";
import { estado, llegarAServicio } from "@/lib/estado";
import { META, SERVICIOS, type Servicio } from "@/lib/ruta";
import { cambiarFase } from "@/lib/estado";
import { crearCartel } from "@/components/Puente";
import { Acera } from "@/components/Garaje";

/* Frena suavemente hacia una parada y avisa cuando llegó. */
function frenar(zParada: number, alLlegar: () => void) {
  const dist = estado.z - zParada;
  if (dist < 70 && dist > -12) {
    estado.velocidad = Math.max(0.12, Math.min(0.99, dist / 30));
    if (dist < 0.8) {
      estado.velocidad = 0;
      alLlegar();
    }
  }
}

function Local({ s, indice }: { s: Servicio; indice: number }) {
  const raiz = useRef<Group>(null);
  const aparte = useRef(false);
  const z = -s.distancia;

  useFrame(() => {
    if (raiz.current) raiz.current.visible = estado.activo;
    if (!estado.activo) return;
    if (estado.fase === "libre" && estado.servicio === indice) {
      const dist = estado.z - (z + 6);
      // arrimarse a la derecha, junto a la vereda
      if (dist < 34 && !aparte.current) {
        aparte.current = true;
        estado.nuevoCarril = 1;
        estado.inmuneHasta = performance.now() + 2500;
      }
      frenar(z + 6, () => llegarAServicio(z + 6, s.lugar, s.puerta, !!s.entrega));
    } else if (estado.fase === "libre") {
      aparte.current = false;
    }
  });

  return (
    <group ref={raiz} visible={false}>
      <Acera z0={z + 6} linea1={s.letrero[0]} linea2={s.letrero[1]} variante={s.variante === "entrega" ? "bodega" : s.variante} parqueo={s.parqueo} />
    </group>
  );
}

function Meta() {
  const raiz = useRef<Group>(null);
  const cartel = useMemo(() => crearCartel("META", "LLEGASTE A TU DESTINO"), []);
  const z = -META;

  useFrame(() => {
    if (raiz.current) raiz.current.visible = estado.activo;
    if (!estado.activo) return;
    if (estado.fase === "libre" && estado.puente >= 3 && estado.servicio >= SERVICIOS.length) {
      frenar(z + 6.8, () => cambiarFase("meta"));
    }
  });

  return (
    <group ref={raiz} position={[0, 0, z]} visible={false}>
      {[-1, 1].map((l) => (
        <group key={l}>
          <RoundedBox args={[0.8, 7.4, 1]} radius={0.12} smoothness={3} position={[l * 5.9, 3.7, 0]}>
            <meshStandardMaterial color="#141b2d" roughness={0.5} metalness={0.5} />
          </RoundedBox>
          <mesh position={[l * 5.7, 3.7, 0.52]}>
            <boxGeometry args={[0.08, 6.8, 0.04]} />
            <meshStandardMaterial color="#000000" emissive="#d9ff3f" emissiveIntensity={3.5} />
          </mesh>
        </group>
      ))}
      <RoundedBox args={[12.8, 1.9, 1.3]} radius={0.12} smoothness={3} position={[0, 7.6, 0]}>
        <meshStandardMaterial color="#0d1424" roughness={0.45} metalness={0.5} />
      </RoundedBox>
      <mesh position={[0, 7.6, 0.67]}>
        <planeGeometry args={[12.2, 1.5]} />
        <meshBasicMaterial map={cartel} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.03, 3]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[9.6, 1.2]} />
        <meshStandardMaterial color="#000000" emissive="#d9ff3f" emissiveIntensity={1.4} />
      </mesh>
    </group>
  );
}

export default function Hitos() {
  return (
    <group>
      {SERVICIOS.map((s, i) => (
        <Local key={i} s={s} indice={i} />
      ))}
      <Meta />
    </group>
  );
}
