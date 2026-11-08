"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { CanvasTexture, InstancedMesh, Object3D, SRGBColorSpace } from "three";
import { estado, sumarSoles } from "@/lib/estado";

const GRUPOS = 5;
const POR_GRUPO = 6;
const TOTAL = GRUPOS * POR_GRUPO;
const LARGO_GRUPO = 80;
const SEPARACION = 2.4;
const VALOR = 5;

function carrilDe(g: number) {
  const h = Math.imul(g + 7, 2654435761) >>> 0;
  return (h % 3) - 1;
}

function crearCara() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const g = c.getContext("2d")!;
  g.translate(128, 128);
  g.rotate(-Math.PI / 2);
  g.translate(-128, -128);

  const plata = g.createRadialGradient(128, 128, 90, 128, 128, 128);
  plata.addColorStop(0, "#eef2f8");
  plata.addColorStop(1, "#a9b3c2");
  g.fillStyle = plata;
  g.fillRect(-40, -40, 336, 336);

  const oro = g.createRadialGradient(108, 100, 8, 128, 128, 96);
  oro.addColorStop(0, "#fff0a8");
  oro.addColorStop(1, "#d99a14");
  g.fillStyle = oro;
  g.beginPath();
  g.arc(128, 128, 92, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = "#8a5a00";
  g.lineWidth = 5;
  g.stroke();

  g.fillStyle = "#6e4600";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.font = "800 74px sans-serif";
  g.fillText("S/", 128, 98);
  g.font = "800 78px sans-serif";
  g.fillText("5", 128, 170);

  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

export default function Monedas() {
  const malla = useRef<InstancedMesh>(null);
  const recogidas = useRef(new Set<number>());
  const cara = useMemo(() => crearCara(), []);
  const mano = useMemo(() => {
    const o = new Object3D();
    o.rotation.order = "YXZ";
    return o;
  }, []);

  useFrame(({ clock }) => {
    const m = malla.current;
    if (!m) return;
    const t = clock.elapsedTime;
    const d = -estado.z;
    const gmin = Math.max(0, Math.floor((d - 15) / LARGO_GRUPO));

    for (let k = 0; k < GRUPOS; k++) {
      const g = gmin + ((((k - gmin) % GRUPOS) + GRUPOS) % GRUPOS);
      const x = carrilDe(g) * 3;

      for (let j = 0; j < POR_GRUPO; j++) {
        const i = k * POR_GRUPO + j;
        const z = -(g * LARGO_GRUPO + 20 + j * SEPARACION);
        const clave = g * 10 + j;

        if (
          estado.activo &&
          !recogidas.current.has(clave) &&
          Math.abs(z - estado.z) < 0.9 &&
          Math.abs(x - estado.x) < 1.4
        ) {
          recogidas.current.add(clave);
          sumarSoles(VALOR);
        }

        const visible = !recogidas.current.has(clave);
        mano.position.set(x, 1.0 + Math.sin(t * 3 + j) * 0.08, z);
        mano.rotation.set(Math.PI / 2, t * 2.5 + j * 0.4, 0);
        mano.scale.setScalar(visible ? 1 : 0);
        mano.updateMatrix();
        m.setMatrixAt(i, mano.matrix);
      }
    }
    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={malla} args={[undefined, undefined, TOTAL]} frustumCulled={false}>
      <cylinderGeometry args={[0.42, 0.42, 0.09, 40]} />
      <meshStandardMaterial
        attach="material-0"
        color="#cfd6e0"
        emissive="#8a93a3"
        emissiveIntensity={0.5}
        metalness={0.8}
        roughness={0.3}
      />
      <meshStandardMaterial
        attach="material-1"
        map={cara}
        emissiveMap={cara}
        emissive="#ffffff"
        emissiveIntensity={0.6}
        metalness={0.4}
        roughness={0.4}
      />
      <meshStandardMaterial
        attach="material-2"
        map={cara}
        emissiveMap={cara}
        emissive="#ffffff"
        emissiveIntensity={0.6}
        metalness={0.4}
        roughness={0.4}
      />
    </instancedMesh>
  );
}
