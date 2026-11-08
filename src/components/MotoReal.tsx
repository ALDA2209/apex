"use client";

import { useEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { Color, Mesh, MeshStandardMaterial } from "three";

export const RUTA_MOTO = "/models/mototaxi2.glb";

/* Escala y posición: el frente del modelo (-x) pasa a mirar hacia -z */
const ESCALA = 1.5;
const ALTO = 0.6937 * ESCALA;
export const DESPLAZA_Z = 0.405;

/* Color de azul que trae la textura (en lineal) para que el tono elegido conserve las sombras */
const LUZ_AZUL = 0.17;

export default function MotoReal({ color }: { color: string }) {
  const { scene } = useGLTF(RUTA_MOTO);

  const { geo, mat, uColor } = useMemo(() => {
    let malla: Mesh | null = null;
    scene.traverse((o) => {
      if (!malla && (o as Mesh).isMesh) malla = o as Mesh;
    });
    const m = malla as unknown as Mesh;
    const original = m.material as MeshStandardMaterial;
    const mat = original.clone();
    mat.metalness = Math.min(mat.metalness, 0.25);
    const uColor = { value: new Color("#3aa8f0") };
    /* Cambia solo las partes azules de la textura por el color elegido; blanco, negro y vidrios no se tocan */
    mat.onBeforeCompile = (sh) => {
      sh.uniforms.uColor = uColor;
      sh.fragmentShader = sh.fragmentShader
        .replace("#include <common>", "#include <common>\nuniform vec3 uColor;")
        .replace(
          "#include <map_fragment>",
          `#include <map_fragment>
          {
            vec3 t = diffuseColor.rgb;
            float azul = smoothstep(0.03, 0.2, t.b - max(t.r, t.g));
            float lum = dot(t, vec3(0.2126, 0.7152, 0.0722));
            vec3 nuevo = uColor * clamp(lum / ${LUZ_AZUL.toFixed(2)}, 0.0, 1.6);
            diffuseColor.rgb = mix(t, nuevo, azul);
          }`,
        );
    };
    mat.customProgramCacheKey = () => "moto-color";
    return { geo: m.geometry, mat, uColor };
  }, [scene]);

  useEffect(() => {
    uColor.value.set(color);
  }, [color, uColor]);

  return (
    <group rotation={[0, -Math.PI / 2, 0]} scale={ESCALA} position={[0, ALTO, DESPLAZA_Z]}>
      <mesh geometry={geo} material={mat} />
    </group>
  );
}

useGLTF.preload(RUTA_MOTO);
