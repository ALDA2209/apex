"use client";
import Puente from "@/components/Puente";
import Hitos from "@/components/Hitos";
import Trafico from "@/components/Trafico";
import Monedas from "@/components/Monedas";
import Mundo from "@/components/Mundo";
import Comedor from "@/components/Comedor";
import Cliente from "@/components/Cliente";
import Transito from "@/components/Transito";

import { Canvas } from "@react-three/fiber";
import { Bloom, EffectComposer, ToneMapping, Vignette } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import Kart from "./Kart";
import Entorno from "./Entorno";
import type { Perfil } from "@/lib/perfil";

export default function Escena({ perfil }: { perfil: Perfil }) {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 2.6, 5.5], fov: 62, near: 0.1, far: 1200 }}
    >
      <fog attach="fog" args={["#7b3560", 35, 200]} />
      <hemisphereLight args={["#9a7bff", "#2a1233", 0.9]} />
      <directionalLight position={[-30, 14, -60]} intensity={2.2} color="#ffa56b" />
      <directionalLight position={[6, 9, 12]} intensity={0.9} color="#8fb4ff" />

      <Kart perfil={perfil} />
      <Mundo perfil={perfil} />
      <Comedor perfil={perfil} />
      <Cliente />
      <Entorno />
        <Puente />
        <Hitos />
        <Trafico />
        <Transito />
        <Monedas />

      <EffectComposer>
        <Bloom intensity={0.8} luminanceThreshold={0.7} luminanceSmoothing={0.25} mipmapBlur />
        <Vignette eskil={false} offset={0.25} darkness={0.65} />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      </EffectComposer>
    </Canvas>
  );
}
