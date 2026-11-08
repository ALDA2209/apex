"use client";

import { useEffect, useState } from "react";
import Menu from "@/components/Menu";
import Escena from "@/components/Escena";
import Intro from "@/components/Intro";
import Briefing from "@/components/Briefing";
import Marcador from "@/components/Marcador";
import Capa from "@/components/Capa";
import Controles from "@/components/Controles";
import Tienda from "@/components/Tienda";
import Objetivo from "@/components/Objetivo";
import Orbita from "@/components/Orbita";
import Tactil from "@/components/Tactil";
import Ajustes, { Sonido } from "@/components/Sonido";
import { prepararNivel, type Nivel } from "@/lib/niveles";
import { estado, prepararPartida, salirDeTienda, useDentro, useObjetivo, type Genero } from "@/lib/estado";
import { PERFIL_INICIAL, type Perfil } from "@/lib/perfil";

type Fase = "intro" | "menu" | "briefing" | "tienda" | "carrera";
const CLAVE = "apex-perfil";
const CLAVE_GENERO = "apex-genero";
const CLAVE_NIVEL = "apex-nivel";
const JET = "var(--font-jetbrains)";

export default function Juego() {
  const [fase, setFase] = useState<Fase>("intro");
  const [perfil, setPerfil] = useState<Perfil>(PERFIL_INICIAL);
  const [cargado, setCargado] = useState(false);
  const [genero, setGenero] = useState<Genero | null>("el");
  const [nivel, setNivel] = useState<Nivel>(1);
  const dentro = useDentro();
  const objetivo = useObjetivo();

  useEffect(() => {
    try {
      const nv = Number(localStorage.getItem(CLAVE_NIVEL));
      if (nv === 1 || nv === 2 || nv === 3) {
        setNivel(nv);
        estado.nivel = nv;
      }
      const guardado = localStorage.getItem(CLAVE);
      if (guardado) setPerfil({ ...PERFIL_INICIAL, ...JSON.parse(guardado) });
    } catch {}
    setCargado(true);
  }, []);

  useEffect(() => {
    if (!cargado) return;
    try {
      localStorage.setItem(CLAVE, JSON.stringify(perfil));
    } catch {}
  }, [perfil, cargado]);

  const elegirNivel = (n: Nivel) => {
    estado.nivel = n;
    setNivel(n);
    try {
      localStorage.setItem(CLAVE_NIVEL, String(n));
    } catch {}
  };

  const elegirGenero = (g: Genero) => {
    estado.genero = g;
    setGenero(g);
    try {
      localStorage.setItem(CLAVE_GENERO, g);
    } catch {}
  };

  useEffect(() => {
    estado.activo = fase === "carrera";
    if (fase === "tienda") {
      prepararNivel(estado.nivel);
      prepararPartida();
    }
    if (fase === "carrera") estado.velocidad = 1;
  }, [fase]);

  useEffect(() => {
    if (fase === "tienda" && objetivo === "listo") setFase("carrera");
  }, [fase, objetivo]);

  if (fase === "intro") {
    return (
      <>
        <Sonido />
        <Intro alTerminar={() => setFase("menu")} />
      </>
    );
  }

  if (fase === "menu") {
    return (
      <>
        <Sonido />
        <Ajustes />
        <Menu
          perfil={perfil}
          alCambiar={setPerfil}
          nivel={nivel}
          alNivel={elegirNivel}
          alJugar={() => {
            estado.velocidad = 0;
            setFase("briefing");
          }}
        />
      </>
    );
  }

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-black">
      <Sonido />
      <Ajustes derecha={fase === "carrera" ? "right-24" : "right-5"} />
      <div className="absolute inset-0">
        <Escena perfil={perfil} />
      </div>

      {fase === "briefing" && (
        <Briefing
          nombre={perfil.nombre}
          genero={genero}
          alElegir={elegirGenero}
          alTerminar={() => setFase("tienda")}
        />
      )}

      {(fase === "tienda" || fase === "carrera") && <Orbita />}

      {fase === "tienda" && (
        <>
          <Marcador />
          <Objetivo />
          <Tactil />
          {dentro && <Tienda alTerminar={salirDeTienda} />}
        </>
      )}

      {fase === "carrera" && (
        <>
          <Marcador />
          <Capa
            alSalir={() => {
              setNivel(estado.nivel);
              setFase("menu");
            }}
          />

          <div
            className="absolute left-5 top-5 z-10 flex items-center gap-3 rounded-full border border-white/10 bg-black/40 px-4 py-2 backdrop-blur"
            style={{ fontFamily: JET }}
          >
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: perfil.color, boxShadow: `0 0 10px ${perfil.color}` }}
            />
            <span className="text-[11px] uppercase tracking-[0.25em] text-white">
              {perfil.nombre || "Piloto"}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setFase("menu")}
            className="absolute right-5 top-5 z-10 rounded-full border border-white/10 bg-black/40 px-4 py-2 text-[11px] uppercase tracking-[0.25em] text-white/90 backdrop-blur hover:text-white"
            style={{ fontFamily: JET }}
          >
            Menú
          </button>

          <Controles />
          <Tactil />
        </>
      )}
    </main>
  );
}
