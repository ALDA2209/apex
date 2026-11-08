import { RoundedBox } from "@react-three/drei";
import { DoubleSide } from "three";

const MARCO = "#14161c";

/* Lentes y barba, listos para colocar sobre una cabeza de radio ~0,14 que mira hacia -z */
export default function Accesorios({
  lentes = 0,
  barba = 0,
  colorBarba = "#2a1a12",
  adelante = 0.125,
  k = 1,
  dy = 0,
}: {
  lentes?: number;
  barba?: number;
  colorBarba?: string;
  /** qué tan adelante (hacia -z) está la cara */
  adelante?: number;
  /** tamaño relativo (1 = cabeza de radio 0,14) */
  k?: number;
  /** ajuste vertical */
  dy?: number;
}) {
  return (
    <group scale={k} position={[0, dy, 0]}>
      {lentes === 1 && (
        <group position={[0, 0.03, -adelante]}>
          {[-1, 1].map((l) => (
            <mesh key={l} position={[l * 0.055, 0, 0]}>
              <torusGeometry args={[0.036, 0.006, 8, 24]} />
              <meshStandardMaterial color={MARCO} metalness={0.6} roughness={0.35} />
            </mesh>
          ))}
          <RoundedBox args={[0.03, 0.006, 0.006]} radius={0.002} position={[0, 0.006, 0]}>
            <meshStandardMaterial color={MARCO} />
          </RoundedBox>
          {[-1, 1].map((l) => (
            <RoundedBox key={`sien${l}`} args={[0.006, 0.006, 0.12]} radius={0.002} position={[l * 0.092, 0, 0.06]}>
              <meshStandardMaterial color={MARCO} />
            </RoundedBox>
          ))}
        </group>
      )}
      {lentes === 2 && (
        <group position={[0, 0.03, -adelante - 0.003]}>
          {[-1, 1].map((l) => (
            <RoundedBox key={l} args={[0.075, 0.048, 0.012]} radius={0.014} smoothness={3} position={[l * 0.055, 0, 0]}>
              <meshStandardMaterial color="#05060a" metalness={0.8} roughness={0.12} />
            </RoundedBox>
          ))}
          <RoundedBox args={[0.04, 0.008, 0.008]} radius={0.003} position={[0, 0.012, 0]}>
            <meshStandardMaterial color={MARCO} />
          </RoundedBox>
          {[-1, 1].map((l) => (
            <RoundedBox key={`sien${l}`} args={[0.007, 0.012, 0.12]} radius={0.003} position={[l * 0.095, 0.005, 0.06]}>
              <meshStandardMaterial color="#05060a" />
            </RoundedBox>
          ))}
        </group>
      )}

      {/* barba: una cáscara que sigue la mandíbula, sin cubrir la boca */}
      {barba === 1 && (
        <group>
          <mesh rotation={[0, 0, 0]}>
            <sphereGeometry args={[0.1445, 28, 12, Math.PI * 1.5 - 0.95 * Math.PI * 0.5 * 1, Math.PI * 0.95, Math.PI * 0.64, Math.PI * 0.22]} />
            <meshStandardMaterial color={colorBarba} roughness={0.95} side={DoubleSide} />
          </mesh>
          <RoundedBox args={[0.075, 0.014, 0.014]} radius={0.006} smoothness={2} position={[0, -0.046, -adelante + 0.004]}>
            <meshStandardMaterial color={colorBarba} roughness={0.95} />
          </RoundedBox>
        </group>
      )}
      {barba === 2 && (
        <group>
          <mesh>
            <sphereGeometry args={[0.1465, 28, 14, Math.PI * 1.5 - Math.PI * 0.62, Math.PI * 1.24, Math.PI * 0.56, Math.PI * 0.3]} />
            <meshStandardMaterial color={colorBarba} roughness={0.95} side={DoubleSide} />
          </mesh>
          <mesh position={[0, -0.12, -adelante + 0.03]} scale={[1, 1.1, 0.8]}>
            <sphereGeometry args={[0.05, 14, 12]} />
            <meshStandardMaterial color={colorBarba} roughness={0.95} />
          </mesh>
          <RoundedBox args={[0.1, 0.02, 0.016]} radius={0.008} smoothness={2} position={[0, -0.042, -adelante + 0.004]}>
            <meshStandardMaterial color={colorBarba} roughness={0.95} />
          </RoundedBox>
        </group>
      )}
    </group>
  );
}

/* Lentes y barba hechos a la medida de la cara del personaje realista.
   Se colocan en las unidades del modelo y la cara mira hacia +z. */
export function AccesoriosReal({
  lentes = 0,
  barba = 0,
  colorBarba = "#17120f",
}: {
  lentes?: number;
  barba?: number;
  colorBarba?: string;
}) {
  const pelo = <meshStandardMaterial color={colorBarba} roughness={0.95} />;
  return (
    <group>
      {lentes === 1 &&
        [-1, 1].map((l) => (
          <group key={l}>
            <mesh position={[l * 0.04, 0.768, 0.113]} rotation={[0, -l * 0.3, 0]}>
              <torusGeometry args={[0.025, 0.0032, 8, 28]} />
              <meshStandardMaterial color={MARCO} metalness={0.6} roughness={0.35} />
            </mesh>
            <RoundedBox args={[0.004, 0.004, 0.115]} radius={0.001} position={[l * 0.0715, 0.768, 0.052]} rotation={[0, l * 0.12, 0]}>
              <meshStandardMaterial color={MARCO} />
            </RoundedBox>
          </group>
        ))}
      {lentes === 1 && (
        <RoundedBox args={[0.02, 0.004, 0.004]} radius={0.0015} position={[0, 0.774, 0.116]}>
          <meshStandardMaterial color={MARCO} />
        </RoundedBox>
      )}
      {lentes === 2 &&
        [-1, 1].map((l) => (
          <group key={l}>
            <RoundedBox args={[0.052, 0.032, 0.006]} radius={0.01} smoothness={3} position={[l * 0.04, 0.768, 0.114]} rotation={[0, -l * 0.3, 0]}>
              <meshStandardMaterial color="#05060a" metalness={0.8} roughness={0.12} />
            </RoundedBox>
            <RoundedBox args={[0.005, 0.009, 0.115]} radius={0.002} position={[l * 0.0715, 0.772, 0.052]} rotation={[0, l * 0.12, 0]}>
              <meshStandardMaterial color="#05060a" />
            </RoundedBox>
          </group>
        ))}
      {lentes === 2 && (
        <RoundedBox args={[0.024, 0.006, 0.005]} radius={0.002} position={[0, 0.778, 0.117]}>
          <meshStandardMaterial color="#05060a" />
        </RoundedBox>
      )}

      {barba >= 1 && (
        <group>
          {/* mentón */}
          <mesh position={[0, barba === 2 ? 0.672 : 0.675, barba === 2 ? 0.074 : 0.094]} scale={barba === 2 ? [0.045, 0.03, 0.036] : [0.032, 0.02, 0.026]}>
            <sphereGeometry args={[1, 18, 14]} />
            {pelo}
          </mesh>
          {/* bigote */}
          <mesh position={[0, 0.712, 0.112]} scale={barba === 2 ? [0.034, 0.009, 0.014] : [0.026, 0.006, 0.01]}>
            <sphereGeometry args={[1, 14, 10]} />
            {pelo}
          </mesh>
        </group>
      )}
      {barba === 2 &&
        [-1, 1].map((l) => (
          <mesh key={l} position={[l * 0.06, 0.7, 0.03]} rotation={[0, 0, l * 0.25]} scale={[0.011, 0.034, 0.03]}>
            <sphereGeometry args={[1, 12, 12]} />
            {pelo}
          </mesh>
        ))}
    </group>
  );
}
