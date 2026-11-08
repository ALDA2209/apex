"use client";

import { useRef } from "react";
import type { MutableRefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import type { Group } from "three";
import { PIELES, atuendo, type Perfil } from "@/lib/perfil";
import { Casco } from "@/components/Piloto";

/** El personaje a pie. Mira hacia -z cuando rotation.y = 0. */
export default function Avatar({
  perfil,
  marcha,
  estira,
  sentado = false,
  come,
  casco,
}: {
  perfil: Perfil;
  /** 0 = quieto, 1 = caminando. Se lee en cada cuadro. */
  marcha: MutableRefObject<number>;
  /** 0 = nada, 1 = brazos arriba estirándose. */
  estira?: MutableRefObject<number>;
  /** Sentado a la mesa (las piernas quedan bajo la mesa). */
  sentado?: boolean;
  /** 0 = manos en la mesa, 1 = llevándose comida a la boca. */
  come?: MutableRefObject<number>;
  /** si se indica, lleva ese casco puesto en vez de pelo o gorra */
  casco?: number;
}) {
  const piernaI = useRef<Group>(null);
  const piernaD = useRef<Group>(null);
  const rodillaI = useRef<Group>(null);
  const rodillaD = useRef<Group>(null);
  const brazoI = useRef<Group>(null);
  const brazoD = useRef<Group>(null);
  const cuerpo = useRef<Group>(null);
  const fase = useRef(0);

  const piel = (PIELES[perfil.piel] ?? PIELES[0]).valor;
  const color = perfil.color;
  const at = atuendo(perfil);
  const TRAJE = at.torso;
  const PANTALON = at.pantalon;

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const m = marcha.current;
    fase.current += dt * (3 + m * 7);
    const s = Math.sin(fase.current);
    const amp = 0.8 * m;
    if (piernaI.current) piernaI.current.rotation.x = s * amp;
    if (piernaD.current) piernaD.current.rotation.x = -s * amp;
    // al caminar la rodilla se dobla un poco cuando la pierna va hacia atrás
    if (rodillaI.current) rodillaI.current.rotation.x = -Math.max(0, -s) * amp * 0.7;
    if (rodillaD.current) rodillaD.current.rotation.x = -Math.max(0, s) * amp * 0.7;
    if (brazoI.current) brazoI.current.rotation.x = -s * amp * 0.85;
    if (brazoD.current) brazoD.current.rotation.x = s * amp * 0.85;
    if (sentado) {
      // sentado: muslos hacia adelante y rodillas dobladas, pies en el suelo
      if (piernaI.current) piernaI.current.rotation.x = 1.55;
      if (piernaD.current) piernaD.current.rotation.x = 1.55;
      if (rodillaI.current) rodillaI.current.rotation.x = -1.55;
      if (rodillaD.current) rodillaD.current.rotation.x = -1.55;
      if (cuerpo.current) {
        cuerpo.current.position.y = -0.45;
        cuerpo.current.rotation.z = 0;
      }
      const c = come?.current ?? 0;
      const f = fase.current * 1.4;
      if (brazoI.current) brazoI.current.rotation.x = 0.85 + Math.sin(f * 0.5) * 0.03;
      if (brazoD.current) brazoD.current.rotation.x = c > 0 ? 1.95 + Math.sin(f * 3.2) * 0.25 * c : 0.85;
      return;
    }
    const e = estira?.current ?? 0;
    if (e > 0) {
      if (brazoI.current) {
        brazoI.current.rotation.x = -Math.PI * 0.92 * e;
        brazoI.current.rotation.z = -0.25 * e;
      }
      if (brazoD.current) {
        brazoD.current.rotation.x = -Math.PI * 0.92 * e;
        brazoD.current.rotation.z = 0.25 * e;
      }
      if (cuerpo.current) cuerpo.current.rotation.x = -0.12 * e;
    } else {
      if (brazoI.current) brazoI.current.rotation.z = 0;
      if (brazoD.current) brazoD.current.rotation.z = 0;
      if (cuerpo.current) cuerpo.current.rotation.x = 0;
    }
    if (cuerpo.current) {
      cuerpo.current.position.y =
        Math.abs(Math.sin(fase.current)) * 0.035 * m + Math.sin(fase.current * 0.45) * 0.004 * (1 - m);
      cuerpo.current.rotation.z = Math.sin(fase.current) * 0.03 * m;
    }
  });

  return (
    <group ref={cuerpo}>
      {/* piernas */}
      {(
        [
          [piernaI, -1],
          [piernaD, 1],
        ] as const
      ).map(([ref, l]) => (
        <group key={l} ref={ref} position={[l * 0.11, 0.9, 0]}>
          <RoundedBox args={[0.17, 0.48, 0.2]} radius={0.065} smoothness={3} position={[0, -0.22, 0]}>
            <meshStandardMaterial color={PANTALON} roughness={0.7} />
          </RoundedBox>
          {/* rodilla: la pantorrilla y el zapato cuelgan de aquí */}
          <group ref={l < 0 ? rodillaI : rodillaD} position={[0, -0.45, 0]}>
            <RoundedBox args={[0.15, 0.4, 0.17]} radius={0.055} smoothness={3} position={[0, -0.15, 0]}>
              <meshStandardMaterial color={PANTALON} roughness={0.7} />
            </RoundedBox>
            <RoundedBox args={[0.17, 0.1, 0.29]} radius={0.04} smoothness={3} position={[0, -0.4, -0.045]}>
              <meshStandardMaterial color="#0f1117" roughness={0.6} />
            </RoundedBox>
          </group>
        </group>
      ))}

      {/* tronco con la franja de color del perfil */}
      <RoundedBox args={[0.36, 0.22, 0.24]} radius={0.08} smoothness={4} position={[0, 0.96, 0]}>
        <meshStandardMaterial color={TRAJE} roughness={0.6} />
      </RoundedBox>
      <RoundedBox args={[0.5, 0.46, 0.28]} radius={0.12} smoothness={4} position={[0, 1.27, 0]}>
        <meshStandardMaterial color={TRAJE} roughness={0.6} />
      </RoundedBox>
      <RoundedBox args={[0.52, 0.05, 0.3]} radius={0.02} smoothness={2} position={[0, 1.33, 0]}>
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.35} roughness={0.5} />
      </RoundedBox>

      {at.chaleco && (
        <RoundedBox args={[0.53, 0.38, 0.31]} radius={0.1} smoothness={3} position={[0, 1.25, 0]}>
          <meshStandardMaterial color={color} roughness={0.6} />
        </RoundedBox>
      )}
      {at.bolso && (
        <group>
          <RoundedBox args={[0.05, 0.7, 0.02]} radius={0.01} smoothness={2} position={[0, 1.24, -0.145]} rotation={[0, 0, 0.7]}>
            <meshStandardMaterial color="#2a2118" roughness={0.8} />
          </RoundedBox>
          <RoundedBox args={[0.05, 0.7, 0.02]} radius={0.01} smoothness={2} position={[0, 1.24, 0.145]} rotation={[0, 0, 0.7]}>
            <meshStandardMaterial color="#2a2118" roughness={0.8} />
          </RoundedBox>
          <RoundedBox args={[0.26, 0.2, 0.1]} radius={0.04} smoothness={3} position={[-0.3, 0.98, 0.04]}>
            <meshStandardMaterial color="#6b4a2a" roughness={0.8} />
          </RoundedBox>
        </group>
      )}

      {/* brazos */}
      {(
        [
          [brazoI, -1],
          [brazoD, 1],
        ] as const
      ).map(([ref, l]) => (
        <group key={l} ref={ref} position={[l * 0.32, 1.45, 0]}>
          <mesh>
            <sphereGeometry args={[0.07, 14, 14]} />
            <meshStandardMaterial color={TRAJE} roughness={0.65} />
          </mesh>
          <RoundedBox args={[0.12, 0.46, 0.14]} radius={0.055} smoothness={3} position={[0, -0.21, 0]}>
            <meshStandardMaterial color={TRAJE} roughness={0.65} />
          </RoundedBox>
          <mesh position={[0, -0.47, 0]}>
            <sphereGeometry args={[0.06, 14, 14]} />
            <meshStandardMaterial color={piel} roughness={0.7} />
          </mesh>
        </group>
      ))}

      {/* cuello y cabeza (misma cara que el piloto) */}
      <mesh position={[0, 1.57, 0]}>
        <cylinderGeometry args={[0.05, 0.058, 0.1, 12]} />
        <meshStandardMaterial color={piel} roughness={0.7} />
      </mesh>
      <group position={[0, 1.7, 0]}>
        <mesh>
          <sphereGeometry args={[0.14, 28, 28]} />
          <meshStandardMaterial color={piel} roughness={0.7} />
        </mesh>
        {[-1, 1].map((l) => (
          <group key={l}>
            <mesh position={[l * 0.14, 0, 0.01]} scale={[0.5, 1, 0.8]}>
              <sphereGeometry args={[0.04, 12, 12]} />
              <meshStandardMaterial color={piel} roughness={0.7} />
            </mesh>
            <mesh position={[l * 0.052, 0.025, -0.13]}>
              <sphereGeometry args={[0.017, 10, 10]} />
              <meshStandardMaterial color="#0b0d12" roughness={0.3} />
            </mesh>
            <RoundedBox args={[0.05, 0.012, 0.01]} radius={0.004} smoothness={2} position={[l * 0.052, 0.055, -0.121]}>
              <meshStandardMaterial color="#2a1a12" roughness={0.8} />
            </RoundedBox>
          </group>
        ))}
        <mesh position={[0, -0.005, -0.143]}>
          <sphereGeometry args={[0.024, 12, 12]} />
          <meshStandardMaterial color={piel} roughness={0.7} />
        </mesh>
        <RoundedBox args={[0.07, 0.014, 0.01]} radius={0.005} smoothness={2} position={[0, -0.055, -0.131]}>
          <meshStandardMaterial color="#8a3b3b" roughness={0.6} />
        </RoundedBox>
        {casco !== undefined ? (
          <Casco casco={casco} color={color} />
        ) : at.pelo === 1 ? (
          <group>
            <mesh position={[0, 0.03, 0.012]}>
              <sphereGeometry args={[0.152, 24, 14, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
              <meshStandardMaterial color={color} roughness={0.6} />
            </mesh>
            <RoundedBox args={[0.22, 0.02, 0.15]} radius={0.01} smoothness={2} position={[0, 0.05, -0.17]} rotation={[0.12, 0, 0]}>
              <meshStandardMaterial color={color} roughness={0.6} />
            </RoundedBox>
          </group>
        ) : (
          <group>
            <mesh position={[0, 0.03, 0.012]}>
              <sphereGeometry args={[0.152, 24, 14, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
              <meshStandardMaterial color={at.colorPelo} roughness={0.9} />
            </mesh>
            {at.pelo === 2 && (
              <mesh position={[0, -0.05, 0.12]} scale={[1, 1.5, 0.7]}>
                <sphereGeometry args={[0.09, 16, 14]} />
                <meshStandardMaterial color={at.colorPelo} roughness={0.9} />
              </mesh>
            )}
          </group>
        )}
      </group>
    </group>
  );
}
