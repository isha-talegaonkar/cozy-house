import { pick, rand } from './helpers.js';
import { FALL, SPRING, SUMMER, WINTER, fireLit, raining, season } from './season.js';
import { hour } from './clock.js';

// ---------------------------------------------------------------- music (generated in the browser, no files)
let audio = null, musicOn = false;
// each season has its own chords, melody notes, tempo and timbre; changes take effect at the next chord
const STYLE = {
  [SPRING]: { chords: [[48, 55, 64, 67], [43, 50, 59, 62], [45, 52, 60, 64], [41, 48, 57, 60]], scale: [60, 62, 64, 67, 69, 72, 74, 76, 79], beat: .9, prob: .5, voice: 'soft', decay: 1.8, bright: 2400, pad: .02 },
  [SUMMER]: { chords: [[41, 48, 57, 64], [40, 47, 55, 62], [38, 45, 53, 60], [36, 43, 52, 59]], scale: [57, 60, 62, 64, 67, 69, 72, 74], beat: 1.15, prob: .38, voice: 'sine', decay: 3.2, bright: 1500, pad: .024 },
  [FALL]:   { chords: [[48, 55, 64, 71], [45, 52, 60, 67], [41, 48, 57, 64], [43, 50, 59, 62]], scale: [60, 62, 64, 67, 69, 72, 74, 76, 79], beat: 1, prob: .42, voice: 'sine', decay: 2.5, bright: 1800, pad: .022 },
  [WINTER]: { chords: [[45, 52, 60, 64], [41, 48, 57, 60], [48, 55, 64, 67], [43, 50, 55, 62]], scale: [69, 71, 72, 74, 76, 79, 81, 84], beat: 1.2, prob: .5, voice: 'bell', decay: 2.4, bright: 3200, pad: .016 },
};
function makeAudio() {
  const ctx = new AudioContext(), master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
  const conv = ctx.createConvolver(), len = ctx.sampleRate * 3.5, ir = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.5); }
  conv.buffer = ir;
  const wet = ctx.createGain(); wet.gain.value = .55; conv.connect(wet).connect(master);
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1800; lp.connect(master); lp.connect(conv);
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
  const pad = (m, t, d, vol) => {
    [0, 6].forEach(det => { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'triangle'; o.frequency.value = mtof(m); o.detune.value = det;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 2); g.gain.linearRampToValueAtTime(0, t + d); o.connect(g).connect(lp); o.start(t); o.stop(t + d + .1); });
  };
  const pluck = (m, t, st) => {   // 'sine' = soft piano-ish, 'soft' = rounder triangle, 'bell' = music box (adds a quiet two-octave overtone)
    const partials = st.voice === 'bell' ? [[1, .06], [4, .018]] : [[1, .07]];
    partials.forEach(([mult, vol]) => {
      const o = ctx.createOscillator(), g = ctx.createGain(); o.type = st.voice === 'soft' ? 'triangle' : 'sine'; o.frequency.value = mtof(m) * mult;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + st.decay);
      o.connect(g).connect(lp); o.start(t); o.stop(t + st.decay + .1);
    });
  };
  const chirp = t => {   // a little bird: two or three quick upward whistles
    for (let i = 0, n = 2 + Math.floor(Math.random() * 2); i < n; i++) {
      const o = ctx.createOscillator(), g = ctx.createGain(), t0 = t + i * .13, f = rand(2600, 3400);
      o.frequency.setValueAtTime(f, t0); o.frequency.exponentialRampToValueAtTime(f * 1.35, t0 + .07);
      g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(.012, t0 + .01); g.gain.exponentialRampToValueAtTime(.0001, t0 + .09);
      o.connect(g).connect(master); o.connect(g).connect(conv); o.start(t0); o.stop(t0 + .1);
    }
  };
  let next = ctx.currentTime + .2, ci = 0;
  setInterval(() => {
    const st = STYLE[season];
    lp.frequency.setTargetAtTime(st.bright, ctx.currentTime, 2);
    while (next < ctx.currentTime + 1.5) {
      const ch = st.chords[ci++ % st.chords.length], bar = st.beat * 8;
      ch.forEach(m => pad(m, next, bar + .5, st.pad));
      for (let b = 0; b < 8; b++) if (Math.random() < st.prob) pluck(Math.random() < .5 ? pick(ch) + 12 : pick(st.scale), next + b * st.beat + rand(0, .08), st);
      next += bar;
    }
    const day = hour > 6 && hour < 19.5, night = hour >= 20.5 || hour < 5.5;
    if (season === SPRING && day && Math.random() < .035) chirp(ctx.currentTime + rand(.1, 1));
    crackleGain.gain.setTargetAtTime(fireLit(hour) ? .25 : 0, ctx.currentTime, 1.5);
    cricketGain.gain.setTargetAtTime(season === SUMMER && night && !raining ? .035 : 0, ctx.currentTime, 2);
    rainGain.gain.setTargetAtTime(raining ? .45 : 0, ctx.currentTime, 4);
    if (raining && Math.random() < .004) thunder(ctx.currentTime + rand(.2, 1.5));
  }, 300);
  // fire crackle loop
  const cl = ctx.sampleRate * 6, cb = ctx.createBuffer(1, cl, ctx.sampleRate), cd = cb.getChannelData(0);
  let brown = 0;
  for (let i = 0; i < cl; i++) { brown = (brown + (Math.random() * 2 - 1) * .02) * .995; cd[i] = brown * .6; }
  for (let k = 0; k < 140; k++) { const s = Math.floor(Math.random() * (cl - 400)), amp = rand(.1, .6); for (let i = 0; i < 300; i++) cd[s + i] += (Math.random() * 2 - 1) * amp * Math.exp(-i / 40); }
  const src = ctx.createBufferSource(); src.buffer = cb; src.loop = true;
  const crackleGain = ctx.createGain(); crackleGain.gain.value = 0; const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 300;
  src.connect(hp).connect(crackleGain).connect(master); src.start();
  // summer-night crickets: a high tone pulsed in little bursts, looped
  const kl = ctx.sampleRate * 2, kb = ctx.createBuffer(1, kl, ctx.sampleRate), kd = kb.getChannelData(0);
  for (let i = 0; i < kl; i++) { const t = i / ctx.sampleRate, burst = Math.floor(t * 3.5) % 2 === 0 ? 1 : 0, pulse = Math.sin(2 * Math.PI * 28 * t) > 0 ? 1 : 0; kd[i] = Math.sin(2 * Math.PI * 4400 * t) * burst * pulse * .3; }
  const crickets = ctx.createBufferSource(); crickets.buffer = kb; crickets.loop = true;
  const cricketGain = ctx.createGain(); cricketGain.gain.value = 0; crickets.connect(cricketGain).connect(master); crickets.start();
  // rain: a soft, steady wash (pink-ish noise, gently swelling) heard from inside a cosy room
  const rl = ctx.sampleRate * 8, rb = ctx.createBuffer(2, rl, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = rb.getChannelData(ch); let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < rl; i++) {
      const w = Math.random() * 2 - 1; b0 = .99765 * b0 + w * .099; b1 = .963 * b1 + w * .2965; b2 = .57 * b2 + w * 1.0527;
      const swell = .8 + .2 * Math.sin(i / rl * Math.PI * 2 * 2 + ch);   // slow loudness drift (two cycles per loop, so it joins seamlessly)
      d[i] = (b0 + b1 + b2 + w * .1848) * .12 * swell;
    }
  }
  const rsrc = ctx.createBufferSource(); rsrc.buffer = rb; rsrc.loop = true;
  const rlp = ctx.createBiquadFilter(); rlp.type = 'lowpass'; rlp.frequency.value = 1100;
  const rhp = ctx.createBiquadFilter(); rhp.type = 'highpass'; rhp.frequency.value = 160;
  const rainGain = ctx.createGain(); rainGain.gain.value = 0; rsrc.connect(rlp).connect(rhp).connect(rainGain).connect(master); rsrc.start();
  function thunder(t) {   // a low, far-away rumble
    const tl = ctx.sampleRate * 4, tb = ctx.createBuffer(1, tl, ctx.sampleRate), td = tb.getChannelData(0);
    let b = 0; for (let i = 0; i < tl; i++) { b = (b + (Math.random() * 2 - 1) * .05) * .99; td[i] = b * Math.min(1, i / (ctx.sampleRate * .3)) * Math.exp(-i / (ctx.sampleRate * 1.2)); }
    const s = ctx.createBufferSource(); s.buffer = tb; const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 160;
    const g = ctx.createGain(); g.gain.value = 1.4; s.connect(f).connect(g).connect(master); s.start(t);
  }
  return { ctx, master };
}
// iPhones mute Web Audio unless the page is in the "playback" audio category:
// ask for it directly (newer Safari) and also play a silent looping clip, which does the same on older versions.
let unlockClip = null;
function silentWavURL() {
  const sr = 8000, n = sr, b = new ArrayBuffer(44 + n * 2), v = new DataView(b), w = (o, str) => [...str].forEach((ch, i) => v.setUint8(o + i, ch.charCodeAt(0)));
  w(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); w(8, 'WAVE'); w(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, sr, true); v.setUint32(28, sr * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, n * 2, true);
  return URL.createObjectURL(new Blob([b], { type: 'audio/wav' }));
}
document.getElementById('music').onclick = e => {
  if (navigator.audioSession) try { navigator.audioSession.type = 'playback'; } catch {}
  if (!unlockClip) { unlockClip = new Audio(silentWavURL()); unlockClip.loop = true; unlockClip.setAttribute('playsinline', ''); }
  if (!audio) audio = makeAudio();
  musicOn = !musicOn;
  if (musicOn) unlockClip.play().catch(() => {}); else unlockClip.pause();
  const { ctx, master } = audio; ctx.resume();
  master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
  master.gain.linearRampToValueAtTime(musicOn ? .7 : 0, ctx.currentTime + 2);
  document.getElementById('music').innerHTML = `♪<span class="txt"> Music: ${musicOn ? 'on' : 'off'}</span>`;
};
