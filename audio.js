// audio.js: the whole sound system, made with the browser's Web Audio (no audio files, so nothing to download and no licences).
// ambience (Mars wind, muffled inside), generative music with moods (calm / tense / win), and sound effects for every interaction.
// Browsers only allow sound after a click or tap, so call unlock() from the Start button.
export function createAudio() {
  let ac = null, master, sfxBus, musBus, windGain, windFilter, noiseBuf, muted = false, mood = 'calm', outside = true;
  let alarmOn = false, geigerOn = false, dripOn = false, nextNote = 0, timers = [];
  try { muted = localStorage.getItem('mars10:mute') === '1'; } catch (e) { }
  const now = () => ac.currentTime;

  function unlock() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    master = ac.createGain(); master.gain.value = muted ? 0 : 0.9; master.connect(ac.destination);
    sfxBus = ac.createGain(); sfxBus.gain.value = 0.8; sfxBus.connect(master);
    musBus = ac.createGain(); musBus.gain.value = 0.55; musBus.connect(master);
    noiseBuf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    // Mars wind: looped noise through a moving band-pass filter
    const src = ac.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
    windFilter = ac.createBiquadFilter(); windFilter.type = 'bandpass'; windFilter.frequency.value = 420; windFilter.Q.value = 0.6;
    windGain = ac.createGain(); windGain.gain.value = 0.05; src.connect(windFilter); windFilter.connect(windGain); windGain.connect(master); src.start();
    const lfo = ac.createOscillator(), lg = ac.createGain(); lfo.frequency.value = 0.12; lg.gain.value = 160; lfo.connect(lg); lg.connect(windFilter.frequency); lfo.start();
    timers.push(setInterval(music, 450), setInterval(loops, 220));
    nextNote = now() + 0.5;
  }

  // ---------- helpers
  function tone(f, dur, type = 'sine', vol = 0.2, slideTo = null, delay = 0, bus = sfxBus) {
    if (!ac) return; const t = now() + delay, o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t); if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(bus || sfxBus); o.start(t); o.stop(t + dur + 0.05);
  }
  function noise(dur, type = 'lowpass', f0 = 800, f1 = null, vol = 0.2, delay = 0) {
    if (!ac) return; const t = now() + delay, s = ac.createBufferSource(), fl = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = noiseBuf; fl.type = type; fl.frequency.setValueAtTime(f0, t); if (f1) fl.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(fl); fl.connect(g); g.connect(sfxBus); s.start(t, Math.random()); s.stop(t + dur + 0.05);
  }

  // ---------- sound effects
  const FX = {
    click: () => { tone(680, 0.06, 'triangle', 0.16, 900); },
    ui: () => { tone(520, 0.08, 'triangle', 0.14); tone(780, 0.1, 'triangle', 0.12, null, 0.06); },
    card: () => { tone(660, 0.12, 'sine', 0.12); tone(990, 0.18, 'sine', 0.1, null, 0.07); },
    page: () => { tone(560, 0.05, 'triangle', 0.1, 700); },
    pickup: () => { tone(420, 0.12, 'square', 0.07, 840); tone(840, 0.1, 'triangle', 0.1, null, 0.08); },
    place: () => { noise(0.08, 'lowpass', 900, 300, 0.2); tone(180, 0.12, 'sine', 0.22, 90); tone(900, 0.1, 'triangle', 0.08, null, 0.04); },
    good: () => { [523, 659, 784].forEach((f, i) => tone(f, 0.22, 'triangle', 0.14, null, i * 0.09)); },
    task: () => { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.25, 'triangle', 0.15, null, i * 0.08)); },
    error: () => { tone(220, 0.22, 'sawtooth', 0.12, 120); },
    win: () => { [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => tone(f, 0.35, 'triangle', 0.17, null, i * 0.13)); },
    lose: () => { [392, 330, 262, 196].forEach((f, i) => tone(f, 0.4, 'sawtooth', 0.1, null, i * 0.2)); },
    doorOpen: () => { noise(0.7, 'bandpass', 300, 1800, 0.22); tone(140, 0.5, 'sawtooth', 0.07, 260); tone(900, 0.12, 'square', 0.05, null, 0.65); },
    doorClose: () => { noise(0.6, 'bandpass', 1800, 300, 0.22); tone(260, 0.4, 'sawtooth', 0.07, 120); tone(90, 0.25, 'sine', 0.3, 50, 0.55); },
    crash: () => { noise(2.2, 'lowpass', 2400, 80, 0.5); tone(70, 1.4, 'sine', 0.5, 30); tone(55, 1.0, 'sawtooth', 0.12, 25, 0.1); },
    whoosh: () => { noise(1.4, 'bandpass', 200, 2400, 0.14); },
    alarm: () => { tone(620, 0.32, 'sawtooth', 0.09, 880); tone(880, 0.32, 'sawtooth', 0.09, 620, 0.34); },
    geiger: () => { noise(0.012, 'highpass', 3000, null, 0.35); },
    step: () => { noise(0.07, 'lowpass', 520, 200, outside ? 0.18 : 0.12); },
    scrub: () => { noise(0.14, 'bandpass', 2400, 1400, 0.16); },
    drip: () => { tone(1500, 0.09, 'sine', 0.1, 600); },
    power: () => { tone(160, 0.9, 'sawtooth', 0.12, 40); noise(0.5, 'lowpass', 900, 100, 0.12); },
    zap: () => { noise(0.18, 'highpass', 2000, 6000, 0.25); tone(1800, 0.1, 'square', 0.06, 400); },
    beepShort: () => tone(700, 0.11, 'square', 0.1), beepLong: () => tone(700, 0.34, 'square', 0.1),
    wire: () => { tone(900, 0.06, 'square', 0.08); tone(1300, 0.09, 'square', 0.08, null, 0.05); },
    rover: () => { tone(980, 0.12, 'square', 0.09); tone(980, 0.12, 'square', 0.09, null, 0.2); },
    night: () => { [784, 659, 523, 392].forEach((f, i) => tone(f, 0.5, 'sine', 0.12, null, i * 0.25)); },
    helmet: () => { tone(300, 0.12, 'triangle', 0.14, 600); noise(0.25, 'bandpass', 1200, 500, 0.12, 0.05); },
    harvest: () => { tone(500, 0.1, 'triangle', 0.14, 900); tone(750, 0.14, 'triangle', 0.14, 1200, 0.1); },
  };
  function play(name, a) { if (!ac || muted && name !== 'ui') return; try { (FX[name] || FX.click)(a); } catch (e) { } }
  // ORBI's / Toby's voice: short blips like a talking robot (one per ~3 letters, at most 12)
  function speak(len, who) { if (!ac || muted) return; const n = Math.min(12, Math.max(2, Math.round(len / 4))); const base = who === 'Toby' ? 330 : who && /BASE|ALERT/.test(who) ? 220 : 520;
    for (let i = 0; i < n; i++) tone(base * (0.8 + Math.random() * 0.6), 0.05, who === 'Toby' ? 'triangle' : 'square', 0.04, null, i * 0.07); }

  // ---------- loops (alarm siren, radiation ticks, water drips)
  let lastAlarm = 0, lastDrip = 0;
  function loops() {
    if (!ac || muted) return; const t = performance.now();
    if (alarmOn && t - lastAlarm > 1400) { lastAlarm = t; FX.alarm(); }
    if (geigerOn && Math.random() < 0.55) FX.geiger();
    if (dripOn && t - lastDrip > 1300) { lastDrip = t; FX.drip(); }
  }

  // ---------- generative music: slow pad notes; calm = soft minor pentatonic, tense = low drone + uneasy pulse, win = bright major
  const SC = { calm: [220, 262, 294, 330, 392, 440], tense: [110, 116.5, 165, 174.6, 220, 233], win: [262, 330, 392, 523, 659, 784] };
  function music() {
    return;   // generative music removed (it did not fit the game); wind, alarms, door, footsteps and UI sounds stay
    if (!ac || muted) return; if (now() < nextNote - 0.4) return; const sc = SC[mood], f = sc[Math.floor(Math.random() * sc.length)], t = Math.max(now(), nextNote);
    const dur = mood === 'tense' ? 1.4 : 3.2, vol = mood === 'tense' ? 0.09 : 0.07;
    for (const [m, ty] of [[1, 'sine'], [2, 'triangle']]) { const o = ac.createOscillator(), g = ac.createGain(); o.type = ty; o.frequency.value = f * m / (m === 2 ? 2 : 1);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol / m, t + dur * 0.35); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(g); g.connect(musBus); o.start(t); o.stop(t + dur + 0.1); }
    if (mood === 'tense') { const o = ac.createOscillator(), g = ac.createGain(); o.type = 'sine'; o.frequency.value = 55; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.12, t + 0.2); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.2); o.connect(g); g.connect(musBus); o.start(t); o.stop(t + 1.3); }
    nextNote = t + (mood === 'tense' ? 0.9 : mood === 'win' ? 0.55 : 1.8 + Math.random() * 1.2);
  }

  return {
    unlock, play, speak,
    mood: m => { if (SC[m]) mood = m; },
    env: out => { if (out === outside) return; outside = out; if (ac) { windFilter.frequency.setTargetAtTime(out ? 420 : 160, now(), 0.4); windGain.gain.setTargetAtTime(out ? 0.07 : 0.02, now(), 0.4); } },
    alarm: on => { alarmOn = !!on; }, geiger: on => { geigerOn = !!on; }, drip: on => { dripOn = !!on; },
    toggleMute: () => { muted = !muted; try { localStorage.setItem('mars10:mute', muted ? '1' : '0'); } catch (e) { } if (master) master.gain.setTargetAtTime(muted ? 0 : 0.9, now(), 0.05); return muted; },
    get muted() { return muted; }, get ready() { return !!ac && ac.state === 'running'; },
  };
}
