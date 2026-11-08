import { RoundedBox } from "@react-three/drei";
import { DoubleSide, Quaternion, Vector3 } from "three";
import { PIELES, type Perfil } from "@/lib/perfil";
import { useApie } from "@/lib/estado";

type Pos = [number, number, number];

function Pintura({ color }: { color: string }) {
  return <meshStandardMaterial color={color} metalness={0.55} roughness={0.3} />;
}

function Rueda({
  posicion,
  radio,
  ancho,
  acento,
}: {
  posicion: Pos;
  radio: number;
  ancho: number;
  acento: string;
}) {
  return (
    <group position={posicion} rotation={[0, 0, Math.PI / 2]}>
      <mesh>
        <cylinderGeometry args={[radio, radio, ancho, 28]} />
        <meshStandardMaterial color="#0f1117" roughness={0.85} />
      </mesh>
      <mesh>
        <cylinderGeometry args={[radio * 0.55, radio * 0.55, ancho + 0.02, 20]} />
        <meshStandardMaterial
          color="#d7deee"
          metalness={0.9}
          roughness={0.25}
          emissive={acento}
          emissiveIntensity={0.5}
        />
      </mesh>
    </group>
  );
}

/* Un miembro del cuerpo: una cápsula que une el punto A con el punto B */
function Segmento({
  a,
  b,
  radio,
  color,
}: {
  a: Pos;
  b: Pos;
  radio: number;
  color: string;
}) {
  const va = new Vector3(...a);
  const vb = new Vector3(...b);
  const dir = vb.clone().sub(va);
  const largo = dir.length();
  const giro = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), dir.normalize());
  const centro = va.clone().add(vb).multiplyScalar(0.5);

  return (
    <mesh position={centro} quaternion={giro}>
      <capsuleGeometry args={[radio, Math.max(0.001, largo - 2 * radio), 6, 12]} />
      <meshStandardMaterial color={color} roughness={0.65} />
    </mesh>
  );
}

const VISERA = "#0a0d14";

/* Casco que cubre toda la cabeza (Integral y Cresta) */
function CascoIntegral({
  cascara,
  visera,
  acento,
  cresta,
}: {
  cascara: string;
  visera: string;
  acento: string;
  cresta: boolean;
}) {
  return (
    <group position={[0, 0.015, 0]}>
      <group scale={[1, 0.96, 1.06]}>
        <mesh>
          <sphereGeometry args={[0.185, 32, 28]} />
          <meshStandardMaterial color={cascara} metalness={0.2} roughness={0.3} />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.19, 32, 12, Math.PI * 1.5 - 0.95, 1.9, Math.PI * 0.38, Math.PI * 0.2]} />
          <meshStandardMaterial color={visera} metalness={0.9} roughness={0.12} />
        </mesh>
      </group>
      {cresta ? (
        <RoundedBox args={[0.05, 0.16, 0.34]} radius={0.02} smoothness={2} position={[0, 0.2, 0.02]}>
          <meshStandardMaterial color={acento} emissive={acento} emissiveIntensity={1.2} />
        </RoundedBox>
      ) : (
        <RoundedBox args={[0.05, 0.04, 0.3]} radius={0.015} smoothness={2} position={[0, 0.19, 0]}>
          <meshStandardMaterial color={acento} emissive={acento} emissiveIntensity={0.5} />
        </RoundedBox>
      )}
    </group>
  );
}

/* Casco abierto: deja ver la cara (Abierto y Retro) */
function CascoAbierto({
  cascara,
  acento,
  retro,
}: {
  cascara: string;
  acento: string;
  retro: boolean;
}) {
  return (
    <group position={[0, 0.015, 0]}>
      <mesh>
        <sphereGeometry args={[0.175, 32, 12, 0, Math.PI * 2, 0, Math.PI * 0.36]} />
        <meshStandardMaterial color={cascara} metalness={0.25} roughness={0.4} side={DoubleSide} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.175, 32, 10, 5.56, 4.58, Math.PI * 0.36, Math.PI * 0.26]} />
        <meshStandardMaterial color={cascara} metalness={0.25} roughness={0.4} side={DoubleSide} />
      </mesh>

      {retro ? (
        <group position={[0, 0.085, -0.15]} rotation={[0.25, 0, 0]}>
          <RoundedBox args={[0.3, 0.05, 0.04]} radius={0.015} smoothness={2}>
            <meshStandardMaterial color="#1a1410" roughness={0.6} />
          </RoundedBox>
          {[-1, 1].map((l) => (
            <mesh key={`lente${l}`} position={[l * 0.07, 0, -0.02]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.045, 0.045, 0.03, 18]} />
              <meshStandardMaterial color="#0a0d14" emissive={acento} emissiveIntensity={0.8} metalness={0.8} roughness={0.2} />
            </mesh>
          ))}
        </group>
      ) : (
        <RoundedBox
          args={[0.26, 0.015, 0.12]}
          radius={0.007}
          smoothness={2}
          position={[0, 0.075, -0.19]}
          rotation={[0.25, 0, 0]}
        >
          <meshStandardMaterial color="#10131b" roughness={0.4} />
        </RoundedBox>
      )}
    </group>
  );
}

export default function Piloto({
  perfil,
  cajas = 5,
}: {
  perfil: Perfil;
  cajas?: number;
}) {
  const { color, casco } = perfil;
  const apie = useApie();
  const piel = (PIELES[perfil.piel] ?? PIELES[0]).valor;
  const traje = "#222838";
  const guante = "#10131b";
  const metal = "#1b1f2b";

  const carton = ["#c9a26b", "#b98a52", "#d6b27c"];
  const posCajas: Pos[] = [
    [-0.32, 0.79, 0.88],
    [0.32, 0.79, 0.88],
    [-0.32, 0.79, 1.36],
    [0.32, 0.79, 1.36],
    [-0.32, 0.79, 1.84],
    [0.32, 0.79, 1.84],
  ];

  return (
    <group>
      {/* rueda delantera, horquilla y manubrio */}
      <Rueda posicion={[0, 0.33, -1.45]} radio={0.33} ancho={0.16} acento={color} />
      <Segmento a={[0, 0.33, -1.45]} b={[0, 1.08, -0.72]} radio={0.03} color={metal} />
      <RoundedBox args={[0.8, 0.05, 0.05]} radius={0.02} smoothness={2} position={[0, 1.1, -0.7]}>
        <meshStandardMaterial color={metal} metalness={0.6} roughness={0.35} />
      </RoundedBox>

      {/* carenado delantero y faro */}
      <RoundedBox args={[0.55, 0.38, 0.7]} radius={0.12} smoothness={4} position={[0, 0.66, -1.25]}>
        <Pintura color={color} />
      </RoundedBox>
      <mesh position={[0, 0.74, -1.62]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color="#000000" emissive="#ffe2a8" emissiveIntensity={4} />
      </mesh>

      {/* piso y costados */}
      <RoundedBox args={[0.95, 0.1, 1.35]} radius={0.04} smoothness={3} position={[0, 0.4, -0.2]}>
        <Pintura color={color} />
      </RoundedBox>
      {[-1, 1].map((l) => (
        <RoundedBox
          key={`flanco${l}`}
          args={[0.06, 0.28, 1.2]}
          radius={0.02}
          smoothness={2}
          position={[l * 0.47, 0.54, -0.1]}
        >
          <Pintura color={color} />
        </RoundedBox>
      ))}

      {/* asiento y respaldo */}
      <RoundedBox args={[0.62, 0.14, 0.5]} radius={0.04} smoothness={3} position={[0, 0.62, 0.15]}>
        <meshStandardMaterial color="#161a24" roughness={0.7} />
      </RoundedBox>
      <RoundedBox args={[0.66, 0.5, 0.1]} radius={0.04} smoothness={3} position={[0, 0.95, 0.46]}>
        <meshStandardMaterial color="#161a24" roughness={0.7} />
      </RoundedBox>

      {/* plataforma de carga */}
      <RoundedBox args={[1.3, 0.12, 1.5]} radius={0.04} smoothness={3} position={[0, 0.5, 1.36]}>
        <Pintura color={color} />
      </RoundedBox>
      {[-1, 1].map((l) => (
        <RoundedBox
          key={`baranda${l}`}
          args={[0.06, 0.18, 1.5]}
          radius={0.02}
          smoothness={2}
          position={[l * 0.62, 0.65, 1.36]}
        >
          <Pintura color={color} />
        </RoundedBox>
      ))}
      <RoundedBox args={[1.3, 0.18, 0.06]} radius={0.02} smoothness={2} position={[0, 0.65, 2.1]}>
        <Pintura color={color} />
      </RoundedBox>
      <Rueda posicion={[-0.8, 0.34, 1.4]} radio={0.34} ancho={0.26} acento={color} />
      <Rueda posicion={[0.8, 0.34, 1.4]} radio={0.34} ancho={0.26} acento={color} />

      {/* cajas de mercadería */}
      {posCajas.slice(0, Math.max(0, Math.min(6, cajas))).map((p, i) => (
        <RoundedBox key={`caja${i}`} args={[0.55, 0.45, 0.42]} radius={0.02} smoothness={2} position={p}>
          <meshStandardMaterial color={carton[i % 3]} roughness={0.85} />
        </RoundedBox>
      ))}

      {/* luces traseras y luz inferior */}
      {[-1, 1].map((l) => (
        <RoundedBox
          key={`stop${l}`}
          args={[0.2, 0.07, 0.04]}
          radius={0.02}
          smoothness={2}
          position={[l * 0.45, 0.65, 2.14]}
        >
          <meshStandardMaterial color="#000000" emissive="#ff2a3d" emissiveIntensity={3} />
        </RoundedBox>
      ))}
      {[-1, 1].map((l) => (
        <RoundedBox
          key={`luz${l}`}
          args={[0.04, 0.04, 1.4]}
          radius={0.015}
          smoothness={2}
          position={[l * 0.66, 0.4, 1.36]}
        >
          <meshStandardMaterial color="#000000" emissive={color} emissiveIntensity={3} />
        </RoundedBox>
      ))}

      {/* armazón y techo semitransparente */}
      {[-1, 1].map((l) => (
        <group key={`arco${l}`}>
          <Segmento a={[l * 0.5, 0.6, 0.5]} b={[l * 0.5, 2.05, 0.5]} radio={0.028} color={color} />
          <Segmento a={[l * 0.5, 0.7, -0.62]} b={[l * 0.5, 2.05, -0.62]} radio={0.028} color={color} />
          <Segmento a={[l * 0.5, 2.05, 0.5]} b={[l * 0.5, 2.05, -0.62]} radio={0.028} color={color} />
        </group>
      ))}
      <Segmento a={[-0.5, 2.05, -0.62]} b={[0.5, 2.05, -0.62]} radio={0.028} color={color} />
      <Segmento a={[-0.5, 2.05, 0.5]} b={[0.5, 2.05, 0.5]} radio={0.028} color={color} />
      <mesh position={[0, 2.06, -0.06]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.0, 1.12]} />
        <meshStandardMaterial color={color} transparent opacity={0.25} side={DoubleSide} />
      </mesh>

      <group visible={!apie}>
      {/* piloto: tronco */}
      <RoundedBox args={[0.36, 0.22, 0.24]} radius={0.08} smoothness={4} position={[0, 0.84, 0.2]}>
        <meshStandardMaterial color={traje} roughness={0.6} />
      </RoundedBox>
      <RoundedBox args={[0.5, 0.4, 0.28]} radius={0.12} smoothness={4} position={[0, 1.13, 0.2]}>
        <meshStandardMaterial color={traje} roughness={0.6} />
      </RoundedBox>
      <RoundedBox args={[0.52, 0.05, 0.3]} radius={0.02} smoothness={2} position={[0, 1.17, 0.2]}>
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.35} roughness={0.5} />
      </RoundedBox>

      {/* piloto: brazos y piernas */}
      {[-1, 1].map((l) => (
        <group key={`miembros${l}`}>
          <mesh position={[l * 0.27, 1.25, 0.22]}>
            <sphereGeometry args={[0.065, 16, 16]} />
            <meshStandardMaterial color={traje} roughness={0.65} />
          </mesh>
          <Segmento a={[l * 0.27, 1.25, 0.22]} b={[l * 0.34, 1.07, -0.14]} radio={0.06} color={traje} />
          <Segmento a={[l * 0.34, 1.07, -0.14]} b={[l * 0.36, 1.1, -0.7]} radio={0.05} color={traje} />
          <mesh position={[l * 0.36, 1.1, -0.7]}>
            <sphereGeometry args={[0.06, 16, 16]} />
            <meshStandardMaterial color={guante} roughness={0.5} />
          </mesh>

          <Segmento a={[l * 0.14, 0.75, 0.15]} b={[l * 0.15, 0.78, -0.35]} radio={0.075} color={traje} />
          <Segmento a={[l * 0.15, 0.78, -0.35]} b={[l * 0.16, 0.5, -0.5]} radio={0.06} color={traje} />
          <RoundedBox
            args={[0.12, 0.09, 0.24]}
            radius={0.03}
            smoothness={3}
            position={[l * 0.16, 0.5, -0.58]}
          >
            <meshStandardMaterial color="#0f1117" roughness={0.6} />
          </RoundedBox>
        </group>
      ))}

      {/* piloto: cuello y cabeza */}
      <Segmento a={[0, 1.33, 0.2]} b={[0, 1.46, 0.2]} radio={0.055} color={piel} />
      <group position={[0, 1.58, 0.2]}>
        <mesh>
          <sphereGeometry args={[0.14, 28, 28]} />
          <meshStandardMaterial color={piel} roughness={0.7} />
        </mesh>
        {[-1, 1].map((l) => (
          <group key={`rostro${l}`}>
            <mesh position={[l * 0.14, 0, 0.01]} scale={[0.5, 1, 0.8]}>
              <sphereGeometry args={[0.04, 12, 12]} />
              <meshStandardMaterial color={piel} roughness={0.7} />
            </mesh>
            <mesh position={[l * 0.052, 0.025, -0.13]}>
              <sphereGeometry args={[0.017, 10, 10]} />
              <meshStandardMaterial color="#0b0d12" roughness={0.3} />
            </mesh>
            <RoundedBox
              args={[0.05, 0.012, 0.01]}
              radius={0.004}
              smoothness={2}
              position={[l * 0.052, 0.055, -0.121]}
            >
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

        {casco === 0 && <CascoIntegral cascara="#f4f6fb" visera={VISERA} acento={color} cresta={false} />}
        {casco === 1 && <CascoAbierto cascara={color} acento={color} retro={false} />}
        {casco === 2 && <CascoIntegral cascara="#171a24" visera={color} acento={color} cresta />}
        {casco === 3 && <CascoAbierto cascara="#a8703f" acento={color} retro />}
      </group>
      </group>
    </group>
  );
}
