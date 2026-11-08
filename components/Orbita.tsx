"use client";

import { useEffect } from "react";
import { estado } from "@/lib/estado";

/* Vista 360: arrastra con el mouse (o el dedo) para girar la cámara alrededor. */
export default function Orbita() {
  useEffect(() => {
    let x = 0;
    let y = 0;
    let id = -1;

    const bloqueado = () => estado.dentro || estado.fase === "dialogo" || estado.fase === "parada";

    const abajo = (e: PointerEvent) => {
      if (e.button !== 0 || bloqueado()) return;
      const t = e.target as HTMLElement | null;
      if (t?.closest("button, input, a, label, [data-no-orbita]")) return;
      id = e.pointerId;
      x = e.clientX;
      y = e.clientY;
      estado.orbita.arrastrando = true;
      document.body.style.cursor = "grabbing";
    };
    const mover = (e: PointerEvent) => {
      if (!estado.orbita.arrastrando || e.pointerId !== id) return;
      estado.orbita.yaw -= (e.clientX - x) * 0.006;
      estado.orbita.pitch = Math.max(-0.3, Math.min(1.0, estado.orbita.pitch + (e.clientY - y) * 0.004));
      x = e.clientX;
      y = e.clientY;
    };
    const soltar = () => {
      if (!estado.orbita.arrastrando) return;
      estado.orbita.arrastrando = false;
      id = -1;
      document.body.style.cursor = "";
    };

    window.addEventListener("pointerdown", abajo);
    window.addEventListener("pointermove", mover);
    window.addEventListener("pointerup", soltar);
    window.addEventListener("pointercancel", soltar);
    window.addEventListener("blur", soltar);
    return () => {
      window.removeEventListener("pointerdown", abajo);
      window.removeEventListener("pointermove", mover);
      window.removeEventListener("pointerup", soltar);
      window.removeEventListener("pointercancel", soltar);
      window.removeEventListener("blur", soltar);
      estado.orbita.arrastrando = false;
      document.body.style.cursor = "";
    };
  }, []);

  return null;
}
