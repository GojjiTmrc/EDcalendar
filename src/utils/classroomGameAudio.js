// Small synthesized sounds for the classroom games (no audio files needed).

let sharedCtx = null;

function getCtx() {
  if (typeof window === 'undefined') return null;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!sharedCtx) sharedCtx = new AC();
  if (sharedCtx.state === 'suspended') sharedCtx.resume().catch(() => {});
  return sharedCtx;
}

function tone(freq, start, duration, gainValue, type = 'sine') {
  const ctx = getCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const t0 = ctx.currentTime + start;
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, gainValue), t0 + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.05);
}

/** Wheel "tick" while spinning. volumePercent: 0..100 (0 = silent) */
export function playTick(volumePercent = 60) {
  const v = Math.max(0, Math.min(100, volumePercent)) / 100;
  if (v <= 0) return;
  try {
    tone(1100, 0, 0.05, 0.12 * v, 'square');
  } catch {
    // audio not available
  }
}

/** Winner fanfare. */
export function playWinFanfare(volumePercent = 60) {
  const v = Math.max(0, Math.min(100, volumePercent)) / 100;
  if (v <= 0) return;
  try {
    tone(523.25, 0, 0.2, 0.2 * v, 'triangle');
    tone(659.25, 0.12, 0.2, 0.2 * v, 'triangle');
    tone(783.99, 0.24, 0.22, 0.22 * v, 'triangle');
    tone(1046.5, 0.4, 0.7, 0.25 * v, 'triangle');
  } catch {
    // audio not available
  }
}

/** Short pop for reveals / groups. */
export function playPop(volumePercent = 60) {
  const v = Math.max(0, Math.min(100, volumePercent)) / 100;
  if (v <= 0) return;
  try {
    tone(740, 0, 0.12, 0.15 * v, 'sine');
  } catch {
    // audio not available
  }
}
