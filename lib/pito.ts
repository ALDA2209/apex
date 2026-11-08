/* Bocinas de los otros vehículos y timbre: usan el sonido compartido y su volumen de "Efectos". */
import { ctxAudio, salidaEfectos } from "@/lib/audio";

export function pitar(hz: number, volumen: number, veces = 1) {
  try {
    const ctx = ctxAudio();
    const sal = salidaEfectos();
    if (!ctx || !sal || volumen <= 0.005) return;
    const filtro = ctx.createBiquadFilter();
    filtro.type = "lowpass";
    filtro.frequency.value = 1500;
    filtro.connect(sal);
    for (let k = 0; k < veces; k++) {
      const t0 = ctx.currentTime + k * 0.22;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(volumen, t0 + 0.015);
      g.gain.setValueAtTime(volumen, t0 + 0.13);
      g.gain.linearRampToValueAtTime(0, t0 + 0.17);
      g.connect(filtro);
      [hz, hz * 1.26].forEach((f) => {
        const o = ctx.createOscillator();
        o.type = "sawtooth";
        o.frequency.value = f;
        o.connect(g);
        o.start(t0);
        o.stop(t0 + 0.2);
      });
    }
  } catch {
    /* sin audio, no pasa nada */
  }
}

/* Timbre / llamado a la puerta del negocio. */
export function timbre() {
  try {
    const ctx = ctxAudio();
    const sal = salidaEfectos();
    if (!ctx || !sal) return;
    [880, 660].forEach((f, k) => {
      const t0 = ctx.currentTime + k * 0.28;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(0.12, t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.6);
      g.connect(sal);
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = f;
      o.connect(g);
      o.start(t0);
      o.stop(t0 + 0.65);
    });
  } catch {
    /* sin audio, no pasa nada */
  }
}
