"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import { CanvasTexture, SRGBColorSpace } from "three";
import type { Group } from "three";
import { chocar, estado } from "@/lib/estado";
import { pitar } from "@/lib/pito";
import { TRAFICO_EXTRA } from "@/lib/niveles";

type Tipo = {
  ancho: number;
  alto: number;
  largo: number;
  vel: number;
  cuerpo: string;
  franja: string;
  tinta: string;
  rotulo: string;
  ejes: number[];
  cambia?: boolean;
};

const BUS = [-0.33, 0.33];
const AUTO = [-0.3, 0.3];

export const TIPOS: Tipo[] = [
  {
    ancho: 2.5, alto: 4.1, largo: 11.5, vel: 5,
    cuerpo: "#eef2f7", franja: "#2dd4bf", tinta: "#07201d",
    rotulo: "EXPRESO PILLCO", ejes: [-0.33, 0.28, 0.38],
  },
  {
    ancho: 2.5, alto: 3.2, largo: 10, vel: 6,
    cuerpo: "#1d4ed8", franja: "#fbbf24", tinta: "#241a00",
    rotulo: "TURISMO CARPISH", ejes: BUS,
  },
  {
    ancho: 2.5, alto: 3.2, largo: 10, vel: 6.5,
    cuerpo: "#15803d", franja: "#fde047", tinta: "#1f1a00",
    rotulo: "RUTA VERDE", ejes: BUS,
  },
  {
    ancho: 2.1, alto: 2.6, largo: 6.5, vel: 7.5,
    cuerpo: "#dc2626", franja: "#f8fafc", tinta: "#450a0a",
    rotulo: "LÍNEA 21", ejes: AUTO,
  },
  {
    ancho: 1.9, alto: 2.2, largo: 4.8, vel: 9,
    cuerpo: "#facc15", franja: "#111827", tinta: "#f8fafc",
    rotulo: "COMBI 7", ejes: AUTO, cambia: true,
  },
  {
    ancho: 1.9, alto: 2.2, largo: 4.8, vel: 9.5,
    cuerpo: "#f8fafc", franja: "#38bdf8", tinta: "#082f49",
    rotulo: "COMBI 12", ejes: AUTO, cambia: true,
  },
  {
    ancho: 1.8, alto: 1.4, largo: 4.2, vel: 10.5,
    cuerpo: "#fbbf24", franja: "#111827", tinta: "#f8fafc",
    rotulo: "TAXI", ejes: AUTO,
  },
  {
    ancho: 1.8, alto: 1.4, largo: 4.2, vel: 11,
    cuerpo: "#1f2937", franja: "#5eead4", tinta: "#042f2e",
    rotulo: "AQH-482", ejes: AUTO,
  },
  {
    ancho: 1.8, alto: 1.4, largo: 4.2, vel: 10,
    cuerpo: "#e5e7eb", franja: "#f43f5e", tinta: "#fff1f2",
    rotulo: "BDK-157", ejes: AUTO,
  },
];

function crearRotulo(texto: string, fondo: string, tinta: string) {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 128;
  const g = c.getContext("2d")!;
  g.fillStyle = fondo;
  g.fillRect(0, 0, 512, 128);
  g.fillStyle = tinta;
  g.textAlign = "center";
  g.textBaseline = "middle";
  let px = 62;
  do {
    g.font = `700 ${px}px sans-serif`;
    px -= 2;
  } while (g.measureText(texto).width > 470 && px > 20);
  g.fillText(texto, 256, 68);
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  return tex;
}

export function Vehiculo({ t }: { t: Tipo }) {
  const rotulo = useMemo(() => crearRotulo(t.rotulo, t.franja, t.tinta), [t]);
  const h = t.alto - 0.45;
  const y0 = 0.45;
  const zt = t.largo / 2;

  return (
    <group>
      <RoundedBox args={[t.ancho, h, t.largo]} radius={0.18} smoothness={3} position={[0, y0 + h / 2, 0]}>
        <meshStandardMaterial color={t.cuerpo} roughness={0.45} metalness={0.25} />
      </RoundedBox>
      <RoundedBox
        args={[t.ancho + 0.04, h * 0.32, t.largo - 0.9]}
        radius={0.05}
        smoothness={2}
        position={[0, y0 + h * 0.68, 0]}
      >
        <meshStandardMaterial color="#0b1220" roughness={0.2} metalness={0.6} />
      </RoundedBox>
      <RoundedBox
        args={[t.ancho + 0.05, 0.1, t.largo - 0.4]}
        radius={0.03}
        smoothness={2}
        position={[0, y0 + h * 0.4, 0]}
      >
        <meshStandardMaterial color={t.franja} emissive={t.franja} emissiveIntensity={1.2} />
      </RoundedBox>

      <mesh position={[0, y0 + h * 0.7, zt + 0.012]}>
        <planeGeometry args={[t.ancho * 0.8, h * 0.26]} />
        <meshStandardMaterial color="#0b1220" roughness={0.2} metalness={0.6} />
      </mesh>
      <mesh position={[0, y0 + h * 0.18, zt + 0.012]}>
        <planeGeometry args={[t.ancho * 0.7, 0.42]} />
        <meshBasicMaterial map={rotulo} toneMapped={false} />
      </mesh>

      {[-1, 1].map((l) => (
        <RoundedBox
          key={`stop${l}`}
          args={[0.34, 0.14, 0.05]}
          radius={0.02}
          smoothness={2}
          position={[l * (t.ancho / 2 - 0.3), y0 + h * 0.4, zt + 0.02]}
        >
          <meshStandardMaterial color="#000000" emissive="#ff2a3d" emissiveIntensity={3} />
        </RoundedBox>
      ))}

      {t.ejes.flatMap((e) =>
        [-1, 1].map((l) => (
          <mesh
            key={`r${e}${l}`}
            position={[l * (t.ancho / 2 - 0.12), 0.42, e * t.largo]}
            rotation={[0, 0, Math.PI / 2]}
          >
            <cylinderGeometry args={[0.42, 0.42, 0.28, 16]} />
            <meshStandardMaterial color="#0f1117" roughness={0.8} />
          </mesh>
        )),
      )}
    </group>
  );
}

export default function Trafico() {
  const grupos = useRef<(Group | null)[]>([]);
  const datos = useRef(
    TIPOS.map(() => ({ vivo: false, x: 0, z: 0, carril: 0, actual: 0, cambio: 0, reac: 0, resp: 0, apura: 0, orilla: 0 })),
  );
  const inicio = useRef(0);
  const antes = useRef(false);
  const inmune = useRef(0);
  const ultimaBocina = useRef(0);

  useFrame(({ clock }, delta) => {
    const dt = Math.min(delta, 0.05);
    const ahora = clock.elapsedTime;
    const d = datos.current;
    const act = estado.activo;

    if (act && !antes.current) {
      inicio.current = estado.z;
      inmune.current = 0;
    }
    antes.current = act;
    if (!act) d.forEach((v) => (v.vivo = false));

    // siempre debe quedar al menos un carril abierto para pasar
    const libre = (carril: number, z: number, quien: number) => {
      const otros = new Set<number>();
      for (let j = 0; j < d.length; j++) {
        const w = d[j];
        if (!w.vivo || j === quien) continue;
        const sep = Math.abs(w.z - z);
        if (w.carril === carril && sep < 36) return false;
        if (w.carril !== carril && sep < 34) otros.add(w.carril);
      }
      return otros.size < 2;
    };

    // ¿cabe un vehículo en ese carril a esa altura?
    const cabeEn = (c: number, z: number, quien: number) => {
      for (let j = 0; j < d.length; j++) {
        const w = d[j];
        if (j === quien || !w.vivo || w.carril !== c) continue;
        if (Math.abs(w.z - z) < (TIPOS[quien].largo + TIPOS[j].largo) / 2 + 6) return false;
      }
      return c !== Math.round(estado.x / 3) || Math.abs(z - estado.z) > 12;
    };

    // los demás escuchan tu bocina
    if (act && estado.bocinaT !== ultimaBocina.current) {
      ultimaBocina.current = estado.bocinaT;
      for (let i = 0; i < d.length; i++) {
        const v = d[i];
        if (!v.vivo) continue;
        const ad = estado.z - v.z; // metros por delante de ti
        const mismo = Math.abs(v.x - estado.x) < 2.2;
        if (ad > 0 && ad < 55 && mismo) {
          v.reac = ahora + 0.35 + Math.random() * 0.5; // se hace a un lado
          if (Math.random() < 0.45) v.resp = ahora + 0.7 + Math.random() * 0.6; // y te responde pitando
        } else if (ad > -15 && ad < 45 && TIPOS[i].largo < 9 && Math.random() < 0.35) {
          v.resp = ahora + 0.5 + Math.random() * 1.0; // contagia a los demás
        }
      }
    }

    const extra = TRAFICO_EXTRA[estado.nivel];
    const maxVivos = Math.min(6 + extra, 3 + extra + Math.floor((inicio.current - estado.z) / 350));
    let vivos = d.filter((v) => v.vivo).length;

    for (let i = 0; i < d.length; i++) {
      const v = d[i];
      const t = TIPOS[i];

      if (!v.vivo) {
        if (act && vivos < maxVivos) {
          const z = estado.z - (120 + Math.random() * 60);
          const orden = [-1, 0, 1].sort(() => Math.random() - 0.5);
          for (const c of orden) {
            if (libre(c, z, i)) {
              v.vivo = true;
              v.carril = c;
              v.x = c * 3;
              v.z = z;
              v.actual = t.vel;
              v.cambio = ahora + 3 + Math.random() * 4;
              vivos++;
              break;
            }
          }
        }
        continue;
      }

      let vel = t.vel;
      if (v.reac > 0 && ahora >= v.reac) {
        v.reac = 0;
        const opciones = [v.carril - 1, v.carril + 1].filter((c) => c >= -1 && c <= 1 && cabeEn(c, v.z, i));
        if (opciones.length) {
          v.carril = opciones[Math.floor(Math.random() * opciones.length)];
          v.orilla = ahora + 5;
        } else {
          v.apura = ahora + 3; // no puede correrse: acelera para despejarte el paso
        }
      }
      if (v.resp > 0 && ahora >= v.resp) {
        v.resp = 0;
        const dist = Math.hypot(v.x - estado.x, v.z - estado.z);
        pitar(t.largo > 9 ? 300 : t.largo > 5 ? 400 : 520, Math.max(0, 0.07 * (1 - dist / 90)), Math.random() < 0.4 ? 2 : 1);
      }
      if (ahora < v.apura) vel *= 1.35;
      for (let j = 0; j < d.length; j++) {
        const w = d[j];
        if (j === i || !w.vivo || w.carril !== v.carril) continue;
        const hueco = v.z - w.z - (t.largo + TIPOS[j].largo) / 2;
        if (hueco > 0 && hueco < 7) vel = Math.min(vel, w.actual);
      }
      if (act && estado.apie && estado.tipoLugar === "puente") vel = 0; // en el control todos esperan
      // con el mototaxi detenido (parada, puente, servicio, meta) nadie lo atraviesa
      const quieto = act && estado.fase !== "libre";
      const ocupado = estado.fase === "parada" ? estado.berma : Math.round(estado.x / 3);
      if (quieto && v.carril === ocupado) {
        const dz = v.z - estado.z;
        if (dz > -(t.largo / 2 + 2.6) && dz < 40) {
          let movido = false;
          for (const c of [0, -1, 1]) {
            if (c === ocupado || movido) continue;
            let cabe = true;
            for (let j = 0; j < d.length; j++) {
              const w = d[j];
              if (j === i || !w.vivo || w.carril !== c) continue;
              if (Math.abs(w.z - v.z) < (t.largo + TIPOS[j].largo) / 2 + 4) cabe = false;
            }
            if (cabe) {
              v.carril = c;
              movido = true;
            }
          }
          if (!movido && dz > 0 && dz - (t.largo / 2 + 2.6) < 8) vel = 0;
        }
      }
      v.actual = vel;
      v.z -= vel * dt;

      if (t.cambia && ahora > v.cambio && ahora > v.orilla && Math.abs(v.z - estado.z) > 45) {
        v.cambio = ahora + 4 + Math.random() * 4;
        const nuevo = Math.max(-1, Math.min(1, v.carril + (Math.random() < 0.5 ? -1 : 1)));
        if (nuevo !== v.carril && libre(nuevo, v.z, i)) v.carril = nuevo;
      }
      v.x += (v.carril * 3 - v.x) * Math.min(1, dt * 2.2);

      if (v.z > estado.z + 45 || v.z < estado.z - 260) v.vivo = false;
    }

    if (act && estado.fase === "libre" && estado.golpe <= 0 && ahora > inmune.current) {
      for (let i = 0; i < d.length; i++) {
        const v = d[i];
        if (!v.vivo) continue;
        const t = TIPOS[i];
        const choca =
          Math.abs(v.x - estado.x) < t.ancho / 2 + 0.8 &&
          Math.abs(v.z - (estado.z + 0.25)) < t.largo / 2 + 2.0;
        if (!choca) continue;

        inmune.current = ahora + 2.4;
        estado.golpe = 1.0;
        const lado = Math.sign(estado.x - v.x);
        if (Math.abs(estado.x - v.x) > 0.7) {
          estado.nuevoCarril = Math.max(-1, Math.min(1, Math.round((v.x + lado * 3) / 3)));
        }
        chocar(20);
        break;
      }
    }

    for (let i = 0; i < d.length; i++) {
      const g = grupos.current[i];
      if (!g) continue;
      const v = d[i];
      g.visible = v.vivo;
      g.position.set(v.x, 0, v.z);
      g.rotation.y = -(v.carril * 3 - v.x) * 0.1;
    }
  });

  return (
    <group>
      {TIPOS.map((t, i) => (
        <group
          key={i}
          visible={false}
          ref={(g) => {
            grupos.current[i] = g;
          }}
        >
          <Vehiculo t={t} />
        </group>
      ))}
    </group>
  );
}
