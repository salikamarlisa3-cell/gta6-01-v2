// Procedural WebAudio for Solstice Bay: a sunny synth loop plus engine, horn, siren,
// gunshot, punch, pickup and UI sounds — all synthesized, zero audio files.
export function createAudio() {
  let ctx = null, unlocked = false, muted = false;
  let engineOsc = null, engineGain = null, sirenOsc = null, sirenGain = null;
  let musicTimer = 0, noteIdx = 0;
  const CHORDS = [220, 261.63, 329.63, 196, 174.61, 220, 246.94, 293.66];

  function ensure() {
    if (!unlocked) return null;
    if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { ctx = null; } }
    if (ctx && ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function tone(freq, dur, type, vol, slideTo) {
    const c = ensure(); if (!c || muted) return;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type || 'square'; o.frequency.setValueAtTime(freq, c.currentTime);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), c.currentTime + dur);
    g.gain.setValueAtTime(vol || 0.08, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
    o.connect(g).connect(c.destination); o.start(); o.stop(c.currentTime + dur);
  }
  function noiseBurst(dur, vol, freq) {
    const c = ensure(); if (!c || muted) return;
    const len = Math.floor(c.sampleRate * dur);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = c.createBufferSource(); src.buffer = buf;
    const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = freq || 1200;
    const g = c.createGain(); g.gain.value = vol || 0.2;
    src.connect(f).connect(g).connect(c.destination); src.start();
  }
  function loopNodes() {
    const c = ensure(); if (!c) return;
    if (!engineOsc) {
      engineOsc = c.createOscillator(); engineGain = c.createGain();
      engineOsc.type = 'sawtooth'; engineGain.gain.value = 0;
      engineOsc.connect(engineGain).connect(c.destination); engineOsc.start();
    }
    if (!sirenOsc) {
      sirenOsc = c.createOscillator(); sirenGain = c.createGain();
      sirenOsc.type = 'triangle'; sirenGain.gain.value = 0;
      sirenOsc.connect(sirenGain).connect(c.destination); sirenOsc.start();
    }
  }
  return {
    unlock() { unlocked = true; ensure(); },
    toggleMute() { muted = !muted; return muted; },
    get muted() { return muted; },
    shot() { noiseBurst(0.12, 0.25, 2600); tone(160, 0.08, 'square', 0.12, 60); },
    punch() { noiseBurst(0.07, 0.18, 700); },
    pickup() { tone(660, 0.09, 'sine', 0.12); setTimeout(() => tone(990, 0.12, 'sine', 0.12), 70); },
    cash() { tone(880, 0.08, 'triangle', 0.14); setTimeout(() => tone(1320, 0.14, 'triangle', 0.14), 80); },
    horn() { tone(370, 0.28, 'square', 0.07); tone(466, 0.28, 'square', 0.05); },
    crash() { noiseBurst(0.3, 0.3, 500); },
    ui() { tone(520, 0.06, 'sine', 0.08); },
    complete() { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, 0.16, 'triangle', 0.12), i * 90)); },
    update(dt, drivingSpeed, sirenNear) {
      const c = ensure(); if (!c) return;
      loopNodes(); if (!engineOsc) return;
      const target = drivingSpeed != null ? 0.035 : 0;
      engineGain.gain.value += (target - engineGain.gain.value) * 0.2;
      if (drivingSpeed != null) engineOsc.frequency.value = 55 + Math.abs(drivingSpeed) * 0.55;
      const sTarget = sirenNear ? 0.022 : 0;
      sirenGain.gain.value += (sTarget - sirenGain.gain.value) * 0.1;
      if (sirenNear) sirenOsc.frequency.value = 620 + Math.sin(c.currentTime * 5.2) * 190;
      musicTimer -= dt;
      if (musicTimer <= 0 && !muted) {
        musicTimer = 0.42;
        const base = CHORDS[noteIdx % CHORDS.length];
        tone(base, 0.4, 'triangle', 0.028);
        tone(base * 1.5, 0.3, 'sine', 0.02);
        if (noteIdx % 2 === 0) tone(base / 2, 0.42, 'sine', 0.035);
        noteIdx++;
      }
    },
  };
}
