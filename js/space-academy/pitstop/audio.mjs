// Pit Stop sound effects, synthesised with the Web Audio API so no audio files are needed.
// The context is created on the first pointer or key press, as browsers require.

let ctx = null;
let master = null;
let noiseBuffer = null;
let enabled = true;

export const setSound = on => {
  enabled = Boolean(on);
  if (master) master.gain.value = enabled ? 0.7 : 0;
  syncMusic();
};

// Starfield background music: a quiet looping track that starts with the first tap and pauses when the tab is hidden.
const MUSIC_URL = '/audio/starfield.wav';
const MUSIC_VOLUME = 0.22;
let music = null;
let musicWanted = false;

function syncMusic() {
  if (!music) return;
  if (enabled && musicWanted && !document.hidden) music.play().catch(() => {});
  else music.pause();
}

export function startMusic() {
  musicWanted = true;
  if (!music) {
    music = new Audio(MUSIC_URL);
    music.loop = true;
    music.volume = MUSIC_VOLUME;
    music.preload = 'auto';
    document.addEventListener('visibilitychange', syncMusic);
  }
  syncMusic();
}

export function unlock() {
  if (!ctx) {
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context) return;
    ctx = new Context();
    master = ctx.createGain();
    master.gain.value = enabled ? 0.7 : 0;
    master.connect(ctx.destination);
    noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let index = 0; index < data.length; index += 1) data[index] = Math.random() * 2 - 1;
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
}

export function armAudio() {
  const once = () => { unlock(); startMusic(); };
  window.addEventListener('pointerdown', once, { passive: true });
  window.addEventListener('keydown', once);
}

const ready = () => enabled && ctx && ctx.state === 'running';

function tone({ type = 'sine', from, to = from, at = 0, length = 0.2, gain = 0.3, attack = 0.01 }) {
  if (!ready()) return;
  const start = ctx.currentTime + at;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(from, start);
  if (to !== from) osc.frequency.exponentialRampToValueAtTime(to, start + length);
  amp.gain.setValueAtTime(0.0001, start);
  amp.gain.exponentialRampToValueAtTime(gain, start + attack);
  amp.gain.exponentialRampToValueAtTime(0.0001, start + length);
  osc.connect(amp).connect(master);
  osc.start(start);
  osc.stop(start + length + 0.05);
}

function noise({ filter = 'highpass', from = 3000, to = from, at = 0, length = 0.3, gain = 0.3, attack = 0.01, q = 1 }) {
  if (!ready()) return;
  const start = ctx.currentTime + at;
  const source = ctx.createBufferSource();
  source.buffer = noiseBuffer;
  source.loop = true;
  const biquad = ctx.createBiquadFilter();
  biquad.type = filter;
  biquad.Q.value = q;
  biquad.frequency.setValueAtTime(from, start);
  if (to !== from) biquad.frequency.exponentialRampToValueAtTime(to, start + length);
  const amp = ctx.createGain();
  amp.gain.setValueAtTime(0.0001, start);
  amp.gain.exponentialRampToValueAtTime(gain, start + attack);
  amp.gain.exponentialRampToValueAtTime(0.0001, start + length);
  source.connect(biquad).connect(amp).connect(master);
  source.start(start);
  source.stop(start + length + 0.05);
}

export const sounds = {
  right() {
    tone({ type: 'triangle', from: 660, length: 0.12, gain: 0.22 });
    tone({ type: 'triangle', from: 990, at: 0.09, length: 0.18, gain: 0.22 });
  },
  wrong() {
    tone({ type: 'sine', from: 260, to: 190, length: 0.22, gain: 0.2 });
  },
  tap() {
    tone({ type: 'square', from: 520, length: 0.05, gain: 0.08 });
  },
  // Side thruster: a short gas puff.
  rcs() {
    noise({ filter: 'bandpass', from: 2400, to: 900, length: 0.22, gain: 0.18, q: 0.8 });
  },
  // One weld: the torch fizzes, a spark crackle follows and the plate clunks into place.
  weld() {
    noise({ filter: 'bandpass', from: 5200, to: 2600, length: 0.55, gain: 0.32, q: 0.8 });
    for (let index = 0; index < 5; index += 1) noise({ filter: 'highpass', from: 6000, at: 0.08 + index * 0.09, length: 0.05, gain: 0.35 });
    tone({ type: 'square', from: 140, to: 70, at: 0.02, length: 0.16, gain: 0.3 });
    noise({ filter: 'bandpass', from: 1400, to: 900, at: 0.3, length: 0.5, gain: 0.1, q: 0.5 });
  },
  // A bad weld: the torch sputters, buzzes down and hisses smoke.
  badWeld() {
    tone({ type: 'sawtooth', from: 210, to: 70, length: 0.5, gain: 0.22 });
    tone({ type: 'square', from: 95, to: 55, at: 0.05, length: 0.4, gain: 0.14 });
    for (let index = 0; index < 4; index += 1) noise({ filter: 'bandpass', from: 3800, to: 1800, at: index * 0.11, length: 0.07, gain: 0.3, q: 1.2 });
    noise({ filter: 'highpass', from: 2500, at: 0.25, length: 0.9, gain: 0.18, attack: 0.15 });
  },
  // A part arrives on the line: whoosh in, then a heavy clunk as it lands on the ship.
  partIn() {
    noise({ filter: 'bandpass', from: 400, to: 2400, length: 0.7, gain: 0.25, attack: 0.3, q: 0.7 });
    tone({ type: 'sawtooth', from: 110, to: 45, at: 0.7, length: 0.28, gain: 0.4 });
    noise({ filter: 'lowpass', from: 900, to: 200, at: 0.7, length: 0.3, gain: 0.35 });
  },
  // Every part welded: a bright chime.
  partDone() {
    [523, 659, 784, 1047].forEach((freq, index) => tone({ type: 'triangle', from: freq, at: index * 0.1, length: 0.5, gain: 0.22 }));
  },
  // The assembly arm moving: a servo whirr.
  servo() {
    tone({ type: 'sawtooth', from: 180, to: 320, length: 0.22, gain: 0.07 });
  },
  stars() {
    [784, 988, 1175].forEach((freq, index) => tone({ type: 'sine', from: freq, at: index * 0.13, length: 0.35, gain: 0.2 }));
  },
  count(final = false) {
    tone({ type: 'square', from: final ? 880 : 440, length: final ? 0.5 : 0.18, gain: 0.2 });
  },
  launch() {
    noise({ filter: 'lowpass', from: 140, to: 1400, length: 3.4, gain: 0.7, attack: 0.5, q: 1.4 });
    noise({ filter: 'bandpass', from: 300, to: 3500, at: 0.4, length: 3, gain: 0.25, attack: 0.9, q: 0.6 });
    tone({ type: 'sawtooth', from: 55, to: 160, length: 3.2, gain: 0.25, attack: 0.6 });
  },
  arrive() {
    [523, 659, 784, 1047, 1319].forEach((freq, index) => tone({ type: 'triangle', from: freq, at: index * 0.11, length: 0.45, gain: 0.22 }));
    tone({ type: 'sine', from: 392, at: 0.6, length: 0.9, gain: 0.18 });
  },
  print() {
    for (let index = 0; index < 6; index += 1) {
      noise({ filter: 'bandpass', from: 1800, to: 2200, at: index * 0.16, length: 0.12, gain: 0.16, q: 2 });
    }
    tone({ type: 'triangle', from: 880, at: 1.1, length: 0.25, gain: 0.2 });
  },
  // Free roam: turret shots (soft, they come often), enemy pops, ship hits, shield blocks and finds.
  shoot(kind = 'single') {
    if (kind === 'missile') noise({ filter: 'bandpass', from: 900, to: 500, length: 0.25, gain: 0.12, q: 0.8 });
    else if (kind === 'beam') tone({ type: 'sawtooth', from: 1400, to: 300, length: 0.12, gain: 0.07 });
    else tone({ type: 'square', from: kind === 'big' ? 220 : 900, to: kind === 'big' ? 90 : 380, length: 0.1, gain: 0.05 });
  },
  boom() {
    noise({ filter: 'lowpass', from: 1800, to: 200, length: 0.35, gain: 0.3 });
    tone({ type: 'square', from: 180, to: 50, length: 0.25, gain: 0.18 });
  },
  hurt() {
    tone({ type: 'sawtooth', from: 220, to: 90, length: 0.3, gain: 0.2 });
    noise({ filter: 'bandpass', from: 700, to: 300, length: 0.25, gain: 0.2, q: 0.7 });
  },
  block() {
    tone({ type: 'sine', from: 1200, to: 700, length: 0.18, gain: 0.16 });
    tone({ type: 'triangle', from: 1800, at: 0.04, length: 0.12, gain: 0.1 });
  },
  pickup() {
    [784, 1175, 1568].forEach((freq, index) => tone({ type: 'triangle', from: freq, at: index * 0.07, length: 0.22, gain: 0.2 }));
  },
};

export const play = (name, ...args) => {
  try { sounds[name]?.(...args); } catch { /* sound must never break the game */ }
};
