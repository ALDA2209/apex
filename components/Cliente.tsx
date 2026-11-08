"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import Avatar from "@/components/Avatar";
import { GARAJE } from "@/components/Garaje";
import { clienteLlego, estado } from "@/lib/estado";
import { SERVICIOS } from "@/lib/ruta";
import { timbre } from "@/lib/pito";
import type { Perfil } from "@/lib/perfil";

const T_LLAMADO = 1.5; // segundos hasta que abren
const T_CAMINA = 2.4; // segundos que tarda en llegar a ti

/* El dueño del negocio: sale cuando lo llamas, viene hacia ti y al final vuelve a entrar. */
export default function Cliente() {
  const raiz = useRef<Group>(null);
  const marcha = useRef(0);
  const parada = useRef({ x: 6.5, z: 0 });
  const sono = useRef(0);
  const pos = useRef({ x: 0, z: 0, giro: 0 });
  const n = estado.servicio;
  const datos = SERVICIOS[n]?.entrega;
  const perfil: Perfil = useMemo(
    () => ({ nombre: "", color: datos?.color ?? "#f8fafc", casco: 0, piel: datos?.piel ?? 2 }),
    [datos],
  );

  useFrame(() => {
    const g = raiz.current;
    if (!g) return;
    const e = estado.cliente;
    if (e === "" || !estado.apie) {
      g.visible = false;
      sono.current = 0;
      return;
    }
    const t = (performance.now() - estado.clienteT) / 1000;
    const puertaX = GARAJE.puertaX - 0.3;
    const puertaZ = GARAJE.puertaZ + estado.base;
    let mueve = false;

    if (e === "llamando") {
      g.visible = false;
      if (sono.current === 0) {
        sono.current = 1;
        timbre();
      }
      if (t > T_LLAMADO) {
        // dónde se va a parar: frente a ti, dentro de la vereda
        const px = estado.ax;
        const pz = estado.az;
        const dx = puertaX - px;
        const dz = puertaZ - pz;
        const d = Math.hypot(dx, dz) || 1;
        let sx = px + (dx / d) * 1.7;
        let sz = pz + (dz / d) * 1.7;
        if (sx > 7.0 || d < 1.8) {
          sx = Math.min(px, 6.9);
          sz = pz + (pz > puertaZ ? -1.4 : 1.4);
        }
        parada.current = { x: Math.max(5.1, Math.min(7.0, sx)), z: sz };
        estado.cliente = "sale";
        estado.clienteT = performance.now();
      }
      return;
    }

    const p = parada.current;
    let x = p.x;
    let z = p.z;
    let mirax = estado.ax - x;
    let miraz = estado.az - z;
    if (e === "sale") {
      const u = Math.min(1, t / T_CAMINA);
      const k = u * u * (3 - 2 * u);
      x = puertaX + (p.x - puertaX) * k;
      z = puertaZ + (p.z - puertaZ) * k;
      mueve = u < 1;
      if (mueve) {
        mirax = p.x - puertaX;
        miraz = p.z - puertaZ;
      }
      if (u >= 1) clienteLlego();
    } else if (e === "vuelve") {
      const u = Math.min(1, t / (T_CAMINA * 0.8));
      const k = u * u * (3 - 2 * u);
      x = p.x + (puertaX - p.x) * k;
      z = p.z + (puertaZ - p.z) * k;
      mueve = u < 1;
      mirax = puertaX - p.x;
      miraz = puertaZ - p.z;
      if (u >= 1) {
        estado.cliente = "";
        g.visible = false;
        return;
      }
    }
    g.visible = true;
    const meta = Math.atan2(-mirax, -miraz);
    let dg = meta - pos.current.giro;
    while (dg > Math.PI) dg -= Math.PI * 2;
    while (dg < -Math.PI) dg += Math.PI * 2;
    pos.current.giro += dg * 0.2;
    g.position.set(x, x > 4.95 ? GARAJE.altura : 0, z);
    g.rotation.y = pos.current.giro;
    marcha.current += ((mueve ? 0.8 : 0) - marcha.current) * 0.2;
  });

  return (
    <group ref={raiz} visible={false}>
      <Avatar perfil={perfil} marcha={marcha} />
    </group>
  );
}
