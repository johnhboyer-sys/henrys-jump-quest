/**
 * Tiny WebAudio blip generator. No audio files, no asset loading — just short
 * synthesised tones so actions have a sound.
 */
type Voice = 'jump' | 'hop' | 'coin' | 'fire' | 'stomp' | 'hurt' | 'power' | 'block' | 'die' | 'win' | 'roar';

const RECIPES: Record<Voice, { freq: number; to: number; ms: number; type: OscillatorType; gain: number }> = {
  jump:  { freq: 380, to: 700,  ms: 130, type: 'square',   gain: 0.16 },
  hop:   { freq: 520, to: 900,  ms: 150, type: 'sine',     gain: 0.16 },
  coin:  { freq: 900, to: 1500, ms: 90,  type: 'square',   gain: 0.12 },
  fire:  { freq: 620, to: 220,  ms: 140, type: 'sawtooth', gain: 0.13 },
  stomp: { freq: 260, to: 90,   ms: 130, type: 'square',   gain: 0.18 },
  hurt:  { freq: 320, to: 110,  ms: 230, type: 'sawtooth', gain: 0.2 },
  power: { freq: 440, to: 1200, ms: 260, type: 'triangle', gain: 0.18 },
  block: { freq: 200, to: 320,  ms: 80,  type: 'square',   gain: 0.14 },
  die:   { freq: 400, to: 70,   ms: 620, type: 'sawtooth', gain: 0.22 },
  win:   { freq: 520, to: 1250, ms: 520, type: 'triangle', gain: 0.2 },
  roar:  { freq: 150, to: 55,   ms: 700, type: 'sawtooth', gain: 0.25 },
};

let ctx: AudioContext | null = null;
let muted = false;

function context(): AudioContext | null {
  if (muted) return null;
  if (!ctx) {
    try {
      ctx = new AudioContext();
    } catch {
      return null;
    }
  }
  // Browsers suspend audio until the first gesture; resuming is harmless.
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

export function play(voice: Voice): void {
  const audio = context();
  if (!audio) return;

  const r = RECIPES[voice];
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  const now = audio.currentTime;

  osc.type = r.type;
  osc.frequency.setValueAtTime(r.freq, now);
  osc.frequency.exponentialRampToValueAtTime(Math.max(20, r.to), now + r.ms / 1000);

  gain.gain.setValueAtTime(r.gain, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + r.ms / 1000);

  osc.connect(gain).connect(audio.destination);
  osc.start(now);
  osc.stop(now + r.ms / 1000 + 0.02);
}

export function toggleMute(): boolean {
  muted = !muted;
  if (muted && ctx) void ctx.suspend();
  if (!muted && ctx) void ctx.resume();
  return muted;
}

export function isMuted(): boolean {
  return muted;
}
