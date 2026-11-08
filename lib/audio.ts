/* Sonido del juego, todo generado en el navegador (sin archivos ni costo):
   música, motor del mototaxi, ambiente, efectos (bocinas, timbre) y voces de los diálogos. */
import { estado } from "@/lib/estado";

export type Ajustes = {
  general: number;
  musica: number;
  motor: number;
  ambiente: number;
  efectos: number;
  voces: number;
  leer: boolean;
};

const CLAVE = "apex-audio";
export const AJUSTES_INICIALES: Ajustes = {
  general: 0.8,
  musica: 0.3,
  motor: 0.6,
  ambiente: 0.5,
  efectos: 0.8,
  voces: 1,
  leer: true,
};

export const ajustes: Ajustes = { ...AJUSTES_INICIALES };
const oyentes = new Set<() => void>();
export function suscribirAudio(f: () => void) {
  oyentes.add(f);
  return () => {
    oyentes.delete(f);
  };
}
let version = 0;
export const versionAudio = () => version;

export function cargarAjustes() {
  try {
    const g = localStorage.getItem(CLAVE);
    if (g) Object.assign(ajustes, JSON.parse(g));
  } catch {}
  aplicar();
  version++;
  oyentes.forEach((f) => f());
}

export function ponerAjuste<K extends keyof Ajustes>(k: K, v: Ajustes[K]) {
  ajustes[k] = v;
  try {
    localStorage.setItem(CLAVE, JSON.stringify(ajustes));
  } catch {}
  aplicar();
  if (k === "leer" && v === false) callar();
  version++;
  oyentes.forEach((f) => f());
}

/* ---------- motor de audio ---------- */
let ctx: AudioContext | null = null;
let master: GainNode;
let gMusica: GainNode;
let gMotor: GainNode;
let gAmbiente: GainNode;
let gEfectos: GainNode;
let ruido: AudioBuffer;

export function ctxAudio(): AudioContext | null {
  return ctx;
}
export function salidaEfectos(): AudioNode | null {
  return ctx ? gEfectos : null;
}

function aplicar() {
  if (!ctx) return;
  const t = ctx.currentTime;
  master.gain.setTargetAtTime(ajustes.general, t, 0.05);
  gMusica.gain.setTargetAtTime(ajustes.musica * 0.5, t, 0.05);
  gAmbiente.gain.setTargetAtTime(ajustes.ambiente * 0.6, t, 0.05);
  gEfectos.gain.setTargetAtTime(ajustes.efectos, t, 0.05);
  // el motor se ajusta en cada cuadro (ver motor())
}

export function iniciarAudio() {
  if (ctx) {
    void ctx.resume();
    return;
  }
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new Ctx();
    master = ctx.createGain();
    master.connect(ctx.destination);
    gMusica = ctx.createGain();
    gMotor = ctx.createGain();
    gAmbiente = ctx.createGain();
    gEfectos = ctx.createGain();
    [gMusica, gMotor, gAmbiente, gEfectos].forEach((g) => g.connect(master));
    gMotor.gain.value = 0;
    // ruido rosa
    const n = ctx.sampleRate * 2;
    ruido = ctx.createBuffer(1, n, ctx.sampleRate);
    const d = ruido.getChannelData(0);
    let b0 = 0,
      b1 = 0,
      b2 = 0;
    for (let i = 0; i < n; i++) {
      const w = Math.random() * 2 - 1;
      b0 = 0.99765 * b0 + w * 0.099046;
      b1 = 0.963 * b1 + w * 0.2965164;
      b2 = 0.57 * b2 + w * 1.0526913;
      d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.2;
    }
    aplicar();
    crearMotor();
    crearAmbiente();
    iniciarMusica();
  } catch {
    ctx = null;
  }
  void ctx?.resume();
}

/* ---------- motor del mototaxi ---------- */
let mOsc1: OscillatorNode, mOsc2: OscillatorNode, mLfo: OscillatorNode, mFiltro: BiquadFilterNode, mAmp: GainNode, mTraqueteo: GainNode;
function crearMotor() {
  const c = ctx!;
  mOsc1 = c.createOscillator();
  mOsc1.type = "sawtooth";
  mOsc2 = c.createOscillator();
  mOsc2.type = "square";
  mFiltro = c.createBiquadFilter();
  mFiltro.type = "lowpass";
  mFiltro.Q.value = 2;
  mAmp = c.createGain();
  mAmp.gain.value = 0.5;
  const mezcla = c.createGain();
  mezcla.gain.value = 0.35;
  mOsc1.connect(mezcla);
  const g2 = c.createGain();
  g2.gain.value = 0.5;
  mOsc2.connect(g2);
  g2.connect(mezcla);
  mezcla.connect(mFiltro);
  mFiltro.connect(mAmp);
  mAmp.connect(gMotor);
  // cada "toc" del pistón: la amplitud pulsa
  mLfo = c.createOscillator();
  mLfo.type = "triangle";
  const lg = c.createGain();
  lg.gain.value = 0.45;
  mLfo.connect(lg);
  lg.connect(mAmp.gain);
  // traqueteo metálico
  const fuente = c.createBufferSource();
  fuente.buffer = ruido;
  fuente.loop = true;
  const bp = c.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 1700;
  bp.Q.value = 0.8;
  mTraqueteo = c.createGain();
  mTraqueteo.gain.value = 0.0;
  fuente.connect(bp);
  bp.connect(mTraqueteo);
  mTraqueteo.connect(gMotor);
  const lg2 = c.createGain();
  lg2.gain.value = 0.02;
  mLfo.connect(lg2);
  lg2.connect(mTraqueteo.gain);
  mOsc1.start();
  mOsc2.start();
  mLfo.start();
  fuente.start();
}

/* ---------- ambiente ---------- */
let aVia: GainNode;
let aFiltroVia: BiquadFilterNode;
function crearAmbiente() {
  const c = ctx!;
  // viento / ciudad lejana
  const f1 = c.createBufferSource();
  f1.buffer = ruido;
  f1.loop = true;
  f1.playbackRate.value = 0.8;
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 650;
  const g1 = c.createGain();
  g1.gain.value = 0.35;
  f1.connect(lp);
  lp.connect(g1);
  g1.connect(gAmbiente);
  const lento = c.createOscillator();
  lento.frequency.value = 0.11;
  const lg = c.createGain();
  lg.gain.value = 0.15;
  lento.connect(lg);
  lg.connect(g1.gain);
  lento.start();
  f1.start();
  // ruido de la pista según la velocidad
  const f2 = c.createBufferSource();
  f2.buffer = ruido;
  f2.loop = true;
  f2.playbackRate.value = 1.3;
  aFiltroVia = c.createBiquadFilter();
  aFiltroVia.type = "lowpass";
  aFiltroVia.frequency.value = 300;
  aVia = c.createGain();
  aVia.gain.value = 0;
  f2.connect(aFiltroVia);
  aFiltroVia.connect(aVia);
  aVia.connect(gAmbiente);
  f2.start();
  programarPajaro();
}

function pajaro() {
  if (!ctx) return;
  const c = ctx;
  const t0 = c.currentTime + 0.02;
  const veces = 2 + Math.floor(Math.random() * 3);
  const base = 2400 + Math.random() * 1600;
  for (let k = 0; k < veces; k++) {
    const t = t0 + k * 0.13;
    const o = c.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(base, t);
    o.frequency.exponentialRampToValueAtTime(base * (1.3 + Math.random() * 0.4), t + 0.07);
    const g = c.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.08, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    o.connect(g);
    g.connect(gAmbiente);
    o.start(t);
    o.stop(t + 0.12);
  }
}
function programarPajaro() {
  window.setTimeout(
    () => {
      // solo cuando estás a pie o parado: con el motor a tope no se oyen
      if (estado.apie || estado.velocidad < 0.3) pajaro();
      programarPajaro();
    },
    4000 + Math.random() * 7000,
  );
}

/* Se llama en cada cuadro: el motor sigue a tu velocidad. */
export function actualizarSonido() {
  if (!ctx) return;
  const t = ctx.currentTime;
  const manejando = estado.activo && !estado.apie && estado.fase === "libre";
  const parado = estado.activo && !estado.apie && estado.fase !== "libre" && estado.fase !== "meta";
  const aPie = estado.apie;
  const kmh = Math.max(0, estado.kmh || 0);
  const r = manejando ? Math.min(1.4, kmh / 45 + (estado.turbo > 1.2 ? 0.15 : 0)) : 0;
  const pulso = 8 + 24 * r; // golpes por segundo
  let vol = 0;
  if (manejando) vol = 0.55 + 0.35 * Math.min(1, r);
  else if (parado) vol = 0.28;
  else if (aPie) vol = 0.14;
  mLfo.frequency.setTargetAtTime(pulso, t, 0.08);
  mOsc1.frequency.setTargetAtTime(pulso * 3.5, t, 0.08);
  mOsc2.frequency.setTargetAtTime(pulso * 1.75, t, 0.08);
  mFiltro.frequency.setTargetAtTime(260 + 900 * r, t, 0.1);
  mTraqueteo.gain.setTargetAtTime(0.04 + 0.06 * r, t, 0.1);
  gMotor.gain.setTargetAtTime(vol * ajustes.motor, t, 0.12);
  aVia.gain.setTargetAtTime(manejando ? Math.min(1, kmh / 50) * 0.55 : 0, t, 0.2);
  aFiltroVia.frequency.setTargetAtTime(220 + kmh * 14, t, 0.2);
}

/* ---------- música (pentatónica andina con pulso suave) ---------- */
const NOTA = (n: number) => 440 * Math.pow(2, (n - 69) / 12);
const ACORDES = [
  { raiz: 57, notas: [69, 72, 76] }, // Am
  { raiz: 53, notas: [65, 69, 72] }, // F
  { raiz: 48, notas: [67, 72, 76] }, // C
  { raiz: 55, notas: [67, 71, 74] }, // G
];
const PENTA = [69, 72, 74, 76, 79, 81, 84]; // La menor pentatónica
const BPM = 96;
let proxima = 0;
let paso = 0;

function nota(freq: number, t: number, dur: number, tipo: OscillatorType, vol: number, destino: AudioNode, ataque = 0.01) {
  const c = ctx!;
  const o = c.createOscillator();
  o.type = tipo;
  o.frequency.value = freq;
  const g = c.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + ataque);
  g.gain.exponentialRampToValueAtTime(0.0005, t + dur);
  o.connect(g);
  g.connect(destino);
  o.start(t);
  o.stop(t + dur + 0.05);
}

let filtroMusica: BiquadFilterNode;
function iniciarMusica() {
  const c = ctx!;
  filtroMusica = c.createBiquadFilter();
  filtroMusica.type = "lowpass";
  filtroMusica.frequency.value = 2400;
  filtroMusica.connect(gMusica);
  proxima = c.currentTime + 0.3;
  window.setInterval(() => {
    if (!ctx) return;
    while (proxima < ctx.currentTime + 0.5) {
      programarPaso(paso, proxima);
      proxima += 60 / BPM / 2; // corchea
      paso++;
    }
  }, 120);
}

function programarPaso(n: number, t: number) {
  const corchea = 60 / BPM / 2;
  const pos = n % 32; // 4 compases de 8 corcheas = 4 acordes
  const ac = ACORDES[Math.floor(pos / 8) % 4];
  const enAcorde = pos % 8;
  // colchón (pad) al empezar cada acorde
  if (enAcorde === 0) {
    ac.notas.forEach((m) => nota(NOTA(m - 12), t, corchea * 8.5, "triangle", 0.09, filtroMusica, 0.6));
  }
  // bajo
  if (enAcorde === 0 || enAcorde === 4) nota(NOTA(ac.raiz - 12), t, corchea * 3.5, "sine", 0.3, filtroMusica, 0.02);
  // arpegio tipo charango: notas del acorde y la pentatónica
  if (enAcorde % 2 === 0 || Math.random() < 0.35) {
    const pool = Math.random() < 0.65 ? ac.notas : PENTA;
    const m = pool[Math.floor(Math.random() * pool.length)];
    nota(NOTA(m), t, corchea * 2.2, "triangle", 0.11, filtroMusica);
  }
  // pulso suave
  if (enAcorde % 4 === 0) {
    const c = ctx!;
    const o = c.createOscillator();
    o.frequency.setValueAtTime(120, t);
    o.frequency.exponentialRampToValueAtTime(40, t + 0.12);
    const g = c.createGain();
    g.gain.setValueAtTime(0.25, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
    o.connect(g);
    g.connect(gMusica);
    o.start(t);
    o.stop(t + 0.2);
  }
}

/* ---------- efectos de la cinemática ---------- */
export function tic() {
  try {
    if (!ctx) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = "square";
    o.frequency.value = 1500 + Math.random() * 500;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.012, t);
    g.gain.exponentialRampToValueAtTime(0.0005, t + 0.03);
    o.connect(g);
    g.connect(gEfectos);
    o.start(t);
    o.stop(t + 0.04);
  } catch {}
}

export function whoosh() {
  try {
    if (!ctx) return;
    const t = ctx.currentTime;
    const f = ctx.createBufferSource();
    f.buffer = ruido;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.Q.value = 1.2;
    bp.frequency.setValueAtTime(300, t);
    bp.frequency.exponentialRampToValueAtTime(3200, t + 0.5);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.25, t + 0.18);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
    f.connect(bp);
    bp.connect(g);
    g.connect(gEfectos);
    f.start(t);
    f.stop(t + 0.75);
  } catch {}
}

/* ---------- voces de los diálogos ---------- */
export type Quien = "oficial" | "cliente" | "vendedor" | "narrador";
let voces: SpeechSynthesisVoice[] = [];
function cargarVoces() {
  try {
    voces = window.speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith("es"));
  } catch {
    voces = [];
  }
}
if (typeof window !== "undefined" && "speechSynthesis" in window) {
  cargarVoces();
  window.speechSynthesis.addEventListener?.("voiceschanged", cargarVoces);
}
const MUJER = /(female|mujer|camila|sabina|helena|paulina|monica|mónica|lucia|lucía|elena|laura|maria|maría|sofia|sofía|paloma|dalia)/i;
const HOMBRE = /(male|alonso|jorge|diego|pablo|raul|raúl|enrique|carlos|alvaro|álvaro|juan|miguel|jaime)/i;

/* Prefiere voces de español de Perú (en Edge: "Alonso" y "Camila"), luego Latinoamérica. */
function puntaje(v: SpeechSynthesisVoice) {
  const l = v.lang.replace("_", "-").toLowerCase();
  if (l === "es-pe") return 4;
  if (/^es-(419|us|mx|co|ar|cl|ve|ec|bo|uy|py)/.test(l)) return 3;
  return 1;
}

function elegirVoz(mujer: boolean) {
  const lista = [...voces].sort((a, b) => puntaje(b) - puntaje(a));
  const re = mujer ? MUJER : HOMBRE;
  const nat = (v: SpeechSynthesisVoice) => (/natural|online/i.test(v.name) ? 1 : 0);
  const mejores = lista.filter((v) => re.test(v.name)).sort((a, b) => puntaje(b) - puntaje(a) || nat(b) - nat(a));
  return mejores[0] ?? lista[0] ?? null;
}

export function callar() {
  try {
    window.speechSynthesis?.cancel();
  } catch {}
}

export function hablar(texto: string, quien: Quien, fin?: () => void) {
  try {
    if (!ajustes.leer || ajustes.voces <= 0.01 || !("speechSynthesis" in window)) {
      fin?.();
      return;
    }
    const limpio = texto
      .replace(/Información de ejemplo\.?[^.]*\./gi, "")
      .replace(/[«»]/g, "")
      .replace(/S\//g, "soles ")
      .replace(/\s+/g, " ")
      .trim();
    if (!limpio) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(limpio);
    const mujer = quien === "cliente";
    const v = elegirVoz(mujer);
    if (v) {
      u.voice = v;
      u.lang = v.lang;
    } else u.lang = "es-PE";
    u.rate = quien === "oficial" ? 0.95 : quien === "narrador" ? 0.98 : 1.02;
    u.pitch = quien === "oficial" ? 0.75 : quien === "narrador" ? 0.9 : quien === "cliente" ? 1.2 : 1;
    u.volume = Math.min(1, ajustes.voces * ajustes.general);
    if (fin) {
      u.onend = fin;
      u.onerror = fin;
    }
    window.speechSynthesis.speak(u);
  } catch {}
}
