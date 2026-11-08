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
import Tactil, { PantallaCompleta } from "@/components/Tactil";
import Ajustes, { Sonido } from "@/components/Sonido";
import { prepararNivel } from "@/lib/niveles";
import Billetera from "@/components/Billetera";
import { cargarProgreso, nivelDelDia, useProgreso } from "@/lib/semana";
import { despertarIA } from "@/lib/ia";
import { estado, prepararPartida, salirDeTienda, useDentro, useObjetivo, type Genero } from "@/lib/estado";
import { perfilPermitido } from "@/lib/tienda";
import { AVATAR_REAL, PERFIL_INICIAL, type Perfil } from "@/lib/perfil";

type Fase = "intro" | "menu" | "briefing" | "tienda" | "carrera";
const CLAVE = "apex-perfil";
const CLAVE_GENERO = "apex-genero";
const JET = "var(--font-jetbrains)";

export default function Juego() {
  const [fase, setFase] = useState<Fase>("intro");
  const [perfil, setPerfil] = useState<Perfil>(PERFIL_INICIAL);
  const [cargado, setCargado] = useState(false);
  const [genero, setGenero] = useState<Genero | null>("el");
  const [partida, setPartida] = useState(0);
  const progreso = useProgreso();
  const dentro = useDentro();
  const objetivo = useObjetivo();

  useEffect(() => {
    try {
      const guardado = localStorage.getItem(CLAVE);
      // personaje y mototaxi: solo el modelo real
      if (guardado) setPerfil({ ...PERFIL_INICIAL, ...JSON.parse(guardado), avatar: AVATAR_REAL, moto: 0 });
    } catch {}
    cargarProgreso();
    setCargado(true);
  }, []);

  /* La dificultad la da el día de la semana (lunes fácil, viernes difícil). */
  useEffect(() => {
    estado.nivel = nivelDelDia(progreso.dia);
  }, [progreso.dia]);

  /* Solo puedes llevar lo que es gratis o que compraste en la tienda. */
  useEffect(() => {
    if (!cargado) return;
    const ok = perfilPermitido(perfil, progreso.compras);
    if (JSON.stringify(ok) !== JSON.stringify(perfil)) setPerfil(ok);
  }, [cargado, perfil, progreso.compras]);

  useEffect(() => {
    if (!cargado) return;
    try {
      localStorage.setItem(CLAVE, JSON.stringify(perfil));
    } catch {}
  }, [perfil, cargado]);

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

  /* El servidor de IA se duerme si nadie lo usa: lo despertamos apenas se abre el juego. */
  useEffect(() => {
    despertarIA();
  }, []);

  /* Alto real de la pantalla: en el celular, al entrar o salir de pantalla completa,
     el navegador tarda en avisar el tamaño nuevo y los botones quedaban fuera de vista. */
  useEffect(() => {
    const medir = () => {
      const alto = window.visualViewport?.height ?? window.innerHeight;
      document.documentElement.style.setProperty("--alto", `${Math.round(alto)}px`);
    };
    const medirVarias = () => {
      medir();
      [80, 300, 800, 1500].forEach((ms) => window.setTimeout(medir, ms));
    };
    medir();
    window.addEventListener("resize", medir);
    window.addEventListener("orientationchange", medirVarias);
    document.addEventListener("fullscreenchange", medirVarias);
    window.visualViewport?.addEventListener("resize", medir);
    return () => {
      window.removeEventListener("resize", medir);
      window.removeEventListener("orientationchange", medirVarias);
      document.removeEventListener("fullscreenchange", medirVarias);
      window.visualViewport?.removeEventListener("resize", medir);
    };
  }, []);

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
          alJugar={() => {
            estado.velocidad = 0;
            setFase("briefing");
          }}
        />
      </>
    );
  }

  return (
    <main key={partida} className="fixed left-0 top-0 w-full overflow-hidden bg-black" style={{ height: "var(--alto, 100dvh)" }}>
      <Sonido />
      <Ajustes derecha={fase === "carrera" ? "right-24 [@media(max-height:480px)]:right-20 [@media(max-width:640px)_and_(orientation:portrait)]:right-[5.2rem]" : "right-5"} />
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

      {(fase === "tienda" || fase === "carrera") && (
        <PantallaCompleta derecha={fase === "carrera" ? "right-[8.5rem] [@media(max-height:480px)]:right-[7.2rem] [@media(max-width:640px)_and_(orientation:portrait)]:right-[7.6rem]" : "right-16"} />
      )}

      {fase === "tienda" && (
        <>
          <Marcador />
          <Billetera conMapa={false} />
          <Objetivo />
          <Tactil />
          {dentro && <Tienda alTerminar={salirDeTienda} />}
        </>
      )}

      {fase === "carrera" && (
        <>
          <Marcador />
          <Capa
            alSalir={() => setFase("menu")}
            alReintentar={() => {
              // mismo día, enseguida: se rearma la escena desde cero
              estado.objetivo = "";
              setPartida((p) => p + 1);
              setFase("tienda");
            }}
          />

          <div
            className="absolute left-5 top-5 z-10 flex items-center gap-3 rounded-full [@media(max-width:640px)_and_(orientation:portrait)]:left-2 [@media(max-width:640px)_and_(orientation:portrait)]:top-2 [@media(max-width:640px)_and_(orientation:portrait)]:gap-2 [@media(max-width:640px)_and_(orientation:portrait)]:px-3 [@media(max-width:640px)_and_(orientation:portrait)]:py-1 [@media(max-width:640px)_and_(orientation:portrait)]:max-w-[7.5rem] [@media(max-width:640px)_and_(orientation:portrait)]:overflow-hidden border border-white/10 bg-black/40 px-4 py-2 backdrop-blur [@media(max-height:480px)]:left-2 [@media(max-height:480px)]:top-2 [@media(max-height:480px)]:gap-2 [@media(max-height:480px)]:px-3 [@media(max-height:480px)]:py-1"
            style={{ fontFamily: JET }}
          >
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: perfil.color, boxShadow: `0 0 10px ${perfil.color}` }}
            />
            <span className="truncate text-[11px] uppercase tracking-[0.25em] text-white">
              {perfil.nombre || "Piloto"}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setFase("menu")}
            className="absolute right-5 top-5 z-10 rounded-full border border-white/10 bg-black/40 px-4 py-2 [@media(max-width:640px)_and_(orientation:portrait)]:right-2 [@media(max-width:640px)_and_(orientation:portrait)]:top-2 [@media(max-width:640px)_and_(orientation:portrait)]:px-3 [@media(max-width:640px)_and_(orientation:portrait)]:py-1 [@media(max-height:480px)]:right-2 [@media(max-height:480px)]:top-2 [@media(max-height:480px)]:px-3 [@media(max-height:480px)]:py-1 text-[11px] uppercase tracking-[0.25em] text-white/90 backdrop-blur hover:text-white"
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
