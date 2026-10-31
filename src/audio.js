import { pick, rand } from './helpers.js';

// ---------------------------------------------------------------- music (generated in the browser, no files)
let audio = null, musicOn = false;
function makeAudio() {
  const ctx = new AudioContext(), master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
  const conv = ctx.createConvolver(), len = ctx.sampleRate * 3.5, ir = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.5); }
  conv.buffer = ir;
  const wet = ctx.createGain(); wet.gain.value = .55; conv.connect(wet).connect(master);
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1800; lp.connect(master); lp.connect(conv);
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
  const pad = (m, t, d) => {
    [0, 6].forEach(det => { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'triangle'; o.frequency.value = mtof(m); o.detune.value = det;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.022, t + 2); g.gain.linearRampToValueAtTime(0, t + d); o.connect(g).connect(lp); o.start(t); o.stop(t + d + .1); });
  };
  const pluck = (m, t) => {
    const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.value = mtof(m);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.07, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + 2.5);
    o.connect(g).connect(lp); o.start(t); o.stop(t + 2.6);
  };
  const chords = [[48, 55, 64, 71], [45, 52, 60, 67], [41, 48, 57, 64], [43, 50, 59, 62]];
  const scale = [60, 62, 64, 67, 69, 72, 74, 76, 79];
  let next = ctx.currentTime + .2, ci = 0;
  setInterval(() => {
    while (next < ctx.currentTime + 1.5) {
      const ch = chords[ci++ % chords.length];
      ch.forEach(m => pad(m, next, 8.5));
      for (let b = 0; b < 8; b++) if (Math.random() < .42) pluck(Math.random() < .5 ? pick(ch) + 12 : pick(scale), next + b + rand(0, .08));
      next += 8;
    }
  }, 300);
  // fire crackle loop
  const cl = ctx.sampleRate * 6, cb = ctx.createBuffer(1, cl, ctx.sampleRate), cd = cb.getChannelData(0);
  let brown = 0;
  for (let i = 0; i < cl; i++) { brown = (brown + (Math.random() * 2 - 1) * .02) * .995; cd[i] = brown * .6; }
  for (let k = 0; k < 140; k++) { const s = Math.floor(Math.random() * (cl - 400)), amp = rand(.1, .6); for (let i = 0; i < 300; i++) cd[s + i] += (Math.random() * 2 - 1) * amp * Math.exp(-i / 40); }
  const src = ctx.createBufferSource(); src.buffer = cb; src.loop = true;
  const cg = ctx.createGain(); cg.gain.value = .25; const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 300;
  src.connect(hp).connect(cg).connect(master); src.start();
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
