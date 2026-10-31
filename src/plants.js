import * as THREE from 'three';
import { scene } from './scene.js';
import { C, add, canvasTex, creamPot, group, pick, rand, sagePot, smooth, soft, terracotta } from './helpers.js';

// monstera leaf: heart shape with midrib, veins, edge splits and holes cut out (alpha), gently cupped
const monsteraTex = canvasTex(256, 256, (g) => {
  g.translate(128, 0);
  const leaf = () => { g.beginPath(); g.moveTo(0, 12); g.bezierCurveTo(70, 18, 122, 70, 120, 140); g.bezierCurveTo(118, 200, 80, 246, 40, 246);
    g.bezierCurveTo(18, 246, 6, 230, 0, 214); g.bezierCurveTo(-6, 230, -18, 246, -40, 246); g.bezierCurveTo(-80, 246, -118, 200, -120, 140); g.bezierCurveTo(-122, 70, -70, 18, 0, 12); };
  const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#5f9450'); gr.addColorStop(1, '#3f7238');
  leaf(); g.fillStyle = gr; g.fill();
  g.strokeStyle = 'rgba(190,225,160,.55)'; g.lineCap = 'round';
  g.lineWidth = 5; g.beginPath(); g.moveTo(0, 214); g.lineTo(0, 20); g.stroke();                              // midrib
  g.lineWidth = 2;
  for (let i = 0; i < 6; i++) { const y = 50 + i * 30; [-1, 1].forEach(sd => { g.beginPath(); g.moveTo(0, y + 12); g.quadraticCurveTo(sd * 50, y, sd * 108, y - 6 + i * 4); g.stroke(); }); }
  g.globalCompositeOperation = 'destination-out';                                                              // fenestrations
  g.lineWidth = 9;
  for (let i = 0; i < 5; i++) { const y = 64 + i * 32; [-1, 1].forEach(sd => { g.beginPath(); g.moveTo(sd * 130, y - 4 + i * 4); g.quadraticCurveTo(sd * 80, y + 6, sd * 52, y + 20); g.stroke(); }); }
  for (let i = 0; i < 4; i++) [-1, 1].forEach(sd => { g.beginPath(); g.ellipse(sd * 26, 70 + i * 34, 5, 9, sd * .4, 0, 7); g.fill(); });
});
monsteraTex.anisotropy = 4;
const monsteraGeo = new THREE.PlaneGeometry(.46, .46, 8, 8);
{ const pos = monsteraGeo.attributes.position; for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), y = pos.getY(i); pos.setZ(i, -x * x * 1.4 - y * y * .4); } monsteraGeo.computeVertexNormals(); }
const monsteraMats = ['#ffffff', '#e6f0dc', '#d4e4c4'].map(c => new THREE.MeshStandardMaterial({ color: c, map: monsteraTex, alphaTest: .5, side: THREE.DoubleSide, roughness: .7 }));

// ---- leaf textures (drawn once, shared): alpha-cut shapes with veins
function leafTex(w, h, draw) { const t = canvasTex(w, h, draw); t.anisotropy = 4; return t; }
const leafMat = (tex, tints = ['#ffffff', '#e2eed6']) => tints.map(c => new THREE.MeshStandardMaterial({ color: c, map: tex, alphaTest: .5, side: THREE.DoubleSide, roughness: .75 }));
function leafGeo(w, h, cup = 1.2) {   // plane bent into a gentle trough; +y runs from stem to tip
  const geo = new THREE.PlaneGeometry(w, h, 6, 6), pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) { const x = pos.getX(i) / w, y = pos.getY(i) / h; pos.setZ(i, (-x * x * cup - y * y * .3) * w); }
  geo.translate(0, h / 2, 0); geo.computeVertexNormals(); return geo;
}
const veins = (g, cx, y0, y1, n, spread, col = 'rgba(200,230,170,.55)') => {
  g.strokeStyle = col; g.lineCap = 'round'; g.lineWidth = 3; g.beginPath(); g.moveTo(cx, y0); g.lineTo(cx, y1); g.stroke(); g.lineWidth = 1.4;
  for (let i = 1; i <= n; i++) { const y = y0 + (y1 - y0) * i / (n + 1); [-1, 1].forEach(sd => { g.beginPath(); g.moveTo(cx, y); g.quadraticCurveTo(cx + sd * spread * .5, y - 6, cx + sd * spread, y - 14); g.stroke(); }); }
};
const ovalTex = leafTex(64, 128, g => {   // generic pointed oval leaf (small plants)
  g.beginPath(); g.moveTo(32, 124); g.bezierCurveTo(-6, 90, 4, 30, 32, 4); g.bezierCurveTo(60, 30, 70, 90, 32, 124);
  const gr = g.createLinearGradient(0, 128, 0, 0); gr.addColorStop(0, '#3f7238'); gr.addColorStop(1, '#6a9e52'); g.fillStyle = gr; g.fill();
  veins(g, 32, 122, 10, 5, 22);
});
const fiddleTex = leafTex(96, 128, g => {   // violin-shaped fiddle-leaf fig leaf
  g.beginPath(); g.moveTo(48, 126); g.bezierCurveTo(26, 120, 20, 96, 26, 80); g.bezierCurveTo(30, 66, 4, 50, 8, 26); g.bezierCurveTo(12, 6, 40, 2, 48, 6);
  g.bezierCurveTo(56, 2, 84, 6, 88, 26); g.bezierCurveTo(92, 50, 66, 66, 70, 80); g.bezierCurveTo(76, 96, 70, 120, 48, 126);
  const gr = g.createLinearGradient(0, 128, 0, 0); gr.addColorStop(0, '#2f5a2c'); gr.addColorStop(1, '#4f7f3c'); g.fillStyle = gr; g.fill();
  veins(g, 48, 124, 8, 6, 36, 'rgba(190,220,150,.6)');
});
const heartTex = leafTex(64, 64, g => {   // pothos: heart leaf with cream variegation
  g.beginPath(); g.moveTo(32, 62); g.bezierCurveTo(10, 50, 2, 26, 12, 12); g.bezierCurveTo(20, 2, 30, 8, 32, 14); g.bezierCurveTo(34, 8, 44, 2, 52, 12); g.bezierCurveTo(62, 26, 54, 50, 32, 62);
  g.fillStyle = '#4f8a3a'; g.fill(); g.save(); g.clip();
  g.strokeStyle = 'rgba(240,230,150,.55)'; g.lineWidth = 3; for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(32, 60); g.quadraticCurveTo(10 + i * 11, 34, 6 + i * 13, 4); g.stroke(); }
  g.restore(); g.strokeStyle = 'rgba(200,230,170,.6)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(32, 60); g.lineTo(32, 14); g.stroke();
});
heartTex.flipY = false;   // the heart's point should sit at the stem
const fernTex = leafTex(64, 256, g => {   // fern frond: stem with tapering leaflets
  g.strokeStyle = '#4f7a3a'; g.lineWidth = 3; g.beginPath(); g.moveTo(32, 254); g.lineTo(32, 6); g.stroke();
  for (let y = 246; y > 10; y -= 9) {
    const len = 26 * Math.sin((254 - y) / 250 * Math.PI) + 3;
    [-1, 1].forEach(sd => { g.fillStyle = (y / 9) % 2 < 1 ? '#5a8f45' : '#4f8240'; g.beginPath(); g.ellipse(32 + sd * len / 2, y - 3, len / 2, 3.6, sd * -.35, 0, 7); g.fill(); });
  }
});
const snakeTex = leafTex(32, 128, g => {   // snake plant: dark bands, yellow edges
  g.fillStyle = '#3f6a3a'; g.fillRect(0, 0, 32, 128);
  g.strokeStyle = '#6f9a5a'; g.lineWidth = 3; for (let y = 6; y < 128; y += 11) { g.beginPath(); g.moveTo(4, y); for (let x = 4; x <= 28; x += 4) g.lineTo(x, y + Math.sin(x * .5 + y) * 2.5); g.stroke(); }
  g.fillStyle = '#d9c25a'; g.fillRect(0, 0, 3, 128); g.fillRect(29, 0, 3, 128);
});
const MAT = { oval: leafMat(ovalTex), fiddle: leafMat(fiddleTex, ['#ffffff', '#dfe9d2']), heart: leafMat(heartTex, ['#ffffff', '#e8f2d8', '#cfe3bf']), fern: leafMat(fernTex), snake: [new THREE.MeshStandardMaterial({ map: snakeTex, roughness: .7 })] };
const GEO = { oval: leafGeo(.07, .14), fiddle: leafGeo(.2, .26, .8), heart: leafGeo(.075, .075, .9), fern: leafGeo(.15, .55, 1.6) };
// a leaf on a little pivot: `yaw` around the stem, `tilt` from upright (0) to horizontal (PI/2)
function leaf(kind, parent, x, y, z, yaw, tilt, s = 1) {
  const pv = group(x, y, z, yaw, parent); const m = add(GEO[kind], pick(MAT[kind]), 0, 0, 0, pv); m.rotation.x = tilt; m.scale.setScalar(s); m.castShadow = true; return pv;
}   // kitchen / hobby room wall, set back to give the hobby room more space

// ---------------------------------------------------------------- plants
export function plant(kind, x, z, s = 1, parent = scene, y = 0) {
  const g = group(x, y, z, rand(0, 6), parent); g.scale.setScalar(s);
  const pot = pick([terracotta, creamPot, sagePot]);
  if (kind === 'monstera') {
    C(.2, .15, .32, 18, pot, 0, .16, 0, g);
    for (let i = 0; i < 7; i++) {
      const a = i / 7 * Math.PI * 2, h = .5 + (i % 3) * .18, L = new THREE.Group(); L.position.set(0, .3, 0); L.rotation.y = a; g.add(L);
      add(new THREE.CylinderGeometry(.01, .01, h), '#4a6a3a', 0, h / 2, .05, L).rotation.x = .3;
      const lf = add(monsteraGeo, pick(monsteraMats), 0, h, .2, L); lf.rotation.set(Math.PI / 2 + .3, 0, rand(-.2, .2));
    }
  } else if (kind === 'snake') {
    C(.14, .12, .28, 18, pot, 0, .14, 0, g);
    for (let i = 0; i < 7; i++) { const h = rand(.5, .8), b = soft(.075, h, .025, .012, MAT.snake[0], rand(-.06, .06), .26 + h / 2, rand(-.06, .06), g); b.rotation.set(rand(-.15, .15), rand(0, 3), rand(-.15, .15)); }
  } else if (kind === 'fern') {
    C(.18, .14, .26, 18, pot, 0, .13, 0, g);
    for (let i = 0; i < 14; i++) leaf('fern', g, 0, .26, 0, i / 14 * Math.PI * 2 + rand(-.1, .1), rand(.75, 1.15), rand(.8, 1.05));
  } else if (kind === 'fiddle') {
    C(.18, .14, .34, 18, pot, 0, .17, 0, g);
    C(.025, .03, 1.3, 6, '#5a3d28', 0, .95, 0, g);
    [[.5, .9], [-.6, 1.05]].forEach(([tilt, yy], b) => { const br = group(0, yy, 0, b * 2.6, g); C(.012, .016, .35, 5, '#5a3d28', 0, .16, 0, br).rotation.z = tilt;
      for (let i = 0; i < 5; i++) leaf('fiddle', br, -Math.sin(tilt) * .3, .28 + i * .03, 0, i * 1.3, rand(.5, 1.0), rand(1.0, 1.25)); });
    for (let i = 0; i < 20; i++) leaf('fiddle', g, 0, .6 + i * .05, 0, i * 2.4, rand(.45, 1.05), rand(1.05, 1.35));
  } else if (kind === 'pothos' || kind === 'hanging') {   // trailing vines of heart leaves
    C(.1, .08, .14, 18, pot, 0, .07, 0, g);
    for (let i = 0; i < 7; i++) leaf('heart', g, 0, .13, 0, i / 7 * Math.PI * 2, rand(.6, 1.1), 1.2);
    const vines = kind === 'hanging' ? 6 : 4, len = kind === 'hanging' ? 11 : 6;
    for (let v = 0; v < vines; v++) {
      const a = v / vines * Math.PI * 2 + .4, n = len - (v % 3) * 2;
      for (let k = 0; k < n; k++) {
        const r = .11 + k * .01, yy = .1 - k * .085, sway = Math.sin(k * .9 + v) * .03;
        if (k % 2 === 0) C(.004, .004, .1, 4, '#4f7a3a', Math.cos(a) * r, yy, Math.sin(a) * r, g);
        leaf('heart', g, Math.cos(a) * r + sway, yy, Math.sin(a) * r, a + Math.PI / 2 + (k % 2 ? .9 : -.9), Math.PI - .4, rand(.9, 1.2));
      }
    }
  } else if (kind === 'succulent') {
    C(.07, .06, .08, 18, pot, 0, .04, 0, g);
    for (let i = 0; i < 6; i++) { const c = add(new THREE.ConeGeometry(.03, .1, 10), smooth('#8fae7a'), Math.cos(i) * .03, .12, Math.sin(i) * .03, g); c.rotation.set(Math.cos(i) * .5, 0, Math.sin(i) * .5); }
  } else { // small leafy: a bushy cluster of oval leaves
    C(.1, .08, .14, 18, pot, 0, .07, 0, g);
    for (let i = 0; i < 16; i++) leaf('oval', g, rand(-.03, .03), .13 + (i % 4) * .03, rand(-.03, .03), i * 2.39, rand(.2, 1.1), rand(.9, 1.3));
  }
  return g;
}
