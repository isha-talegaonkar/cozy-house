import * as THREE from 'three';
import { scene } from './scene.js';
import { B, C, M, Sph, add, canvasTex, darkWood, fabric, frameMat, glassMat, group, lightWood, pick, rand, smooth, soft, stone, twinkle, wallMat, wood } from './helpers.js';
import { plant } from './plants.js';
import { WINTER, onSeason } from './season.js';

// ---------------------------------------------------------------- floors
function planks(c1, c2, c3, line) {
  return canvasTex(256, 256, (g) => {
    const cols = [c1, c2, c3];
    for (let r = 0; r < 8; r++) for (let s = -1; s < 3; s++) {
      g.fillStyle = cols[(r * 2 + s + 3) % 3]; g.fillRect(s * 128 + (r % 2) * 64, r * 32, 128, 32);
      g.fillStyle = line; g.fillRect(s * 128 + (r % 2) * 64, r * 32, 2, 32);
    }
    g.fillStyle = line; for (let r = 0; r < 8; r++) g.fillRect(0, r * 32, 256, 2);
  }, [2, 1.5]);
}
const floors = {
  L: planks('#9a6440', '#8f5c3a', '#a06a45', '#6a3d22'),
  S: planks('#c9a27a', '#bf9870', '#d1ab84', '#9a7450'),
  K: canvasTex(64, 64, g => { for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { g.fillStyle = (i + j) % 2 ? '#c46a4a' : '#efe2c8'; g.fillRect(i * 16, j * 16, 16, 16); } }, [5, 3.5]),
  B: canvasTex(128, 128, g => { g.fillStyle = '#c49a94'; g.fillRect(0, 0, 128, 128); for (let i = 0; i < 1400; i++) { g.fillStyle = Math.random() < .5 ? '#b98c86' : '#cfa8a2'; g.fillRect(Math.random() * 128, Math.random() * 128, 2, 2); } }, [2, 2]),
};
for (const t of Object.values(floors)) t.magFilter = THREE.NearestFilter;
floors.K.magFilter = THREE.NearestFilter;
B(10.4, .4, 8.2, stone, 0, -.25, .4);   // house runs z -3.5 .. 4.3
[['B', -2.5, -1.75, 3.5], ['L', -2.5, 2.15, 4.3], ['K', 2.5, -2.05, 2.9], ['S', 2.5, 1.85, 4.9]].forEach(([k, x, z, d]) =>
  B(5, .1, d, M('#ffffff', { map: floors[k], flatShading: false }), x, -.04, z));

// ---------------------------------------------------------------- walls (tall + cutaway versions)
const WALL_H = 2.6, LOW_H = .5, WT = .15;
function buildWall(ax, az, bx, bz, h, openings, decorate) {
  const g = new THREE.Group(), dx = bx - ax, dz = bz - az, L = Math.hypot(dx, dz);
  g.position.set(ax, 0, az); g.rotation.y = Math.atan2(-dz, dx); scene.add(g);
  const piece = (x0, x1, y0, y1) => { if (x1 - x0 > .001 && y1 - y0 > .001) B(x1 - x0, y1 - y0, WT, wallMat, (x0 + x1) / 2, (y0 + y1) / 2, 0, g); };
  let cur = 0;
  for (const o of [...openings].sort((a, b) => a.s - b.s)) {
    piece(cur, o.s, 0, h); piece(o.s, o.s + o.w, 0, Math.min(o.y0, h)); if (o.y1 < h) piece(o.s, o.s + o.w, o.y1, h);
    if (h > 1 && o.y0 > 0) {   // window frame + glass
      const cx = o.s + o.w / 2, cy = (o.y0 + o.y1) / 2, hh = o.y1 - o.y0;
      B(o.w + .12, .07, WT + .1, frameMat, cx, o.y0, 0, g); B(o.w + .12, .07, WT + .06, frameMat, cx, o.y1, 0, g);
      B(.07, hh, WT + .06, frameMat, o.s, cy, 0, g); B(.07, hh, WT + .06, frameMat, o.s + o.w, cy, 0, g);
      B(.04, hh, WT + .02, frameMat, cx, cy, 0, g); B(o.w, .04, WT + .02, frameMat, cx, cy, 0, g);
      add(new THREE.PlaneGeometry(o.w, hh), glassMat, cx, cy, 0, g).castShadow = false;
    }
    cur = o.s + o.w;
  }
  piece(cur, L, 0, h);
  if (decorate) decorate(g);
  return g;
}
const win = (s, w = 1.6, y0 = .8, y1 = 2.3) => ({ s, w, y0, y1 });   // big windows for lots of light
const door = (s, w = .8) => ({ s, w, y0: 0, y1: 2.15 });
// in each wall's local frame: x runs along the wall, +z is inside (sign given)
const EXT = [
  { n: [0, -1], a: [-5.075, -3.5], b: [5.075, -3.5], inside: 1, open: [win(1.775), win(7.775, 1.6, 1.0)] },  // north: bedroom + kitchen windows
  { n: [0, 1], a: [-5.075, 4.3], b: [5.075, 4.3], inside: -1, open: [win(.975), door(3.675), win(6.825)] }, // south: living window, front door, studio window
  { n: [-1, 0], a: [-5, -3.575], b: [-5, 4.375], inside: -1, open: [win(1.125, 1.3)] },              // west: bedroom window
  { n: [1, 0], a: [5, -3.575], b: [5, 4.375], inside: 1, open: [win(1.375, 1.4, 1.0), win(5.025, 1.1)] },  // east: kitchen + studio windows
];
const sillPlant = (g, s, inside, kind, y = .84) => { const p = plant(kind, 0, 0, .8, g); p.position.set(s, y, inside * .12); };
const tvTex = canvasTex(160, 90, () => {}), tvCtx = tvTex.userData.canvas.getContext('2d');
export const tvMat = new THREE.MeshBasicMaterial({ map: tvTex, color: '#111111' });
const TV_SCENES = [['#f4ad6c', '#c96a68', '#2f5a7a', '#1f3f5a'], ['#cfe6da', '#8fbf9a', '#4f7a43', '#2f4f2f'], ['#dfe6f2', '#9fb0cf', '#f4f6fa', '#b9c4d6']];
export function drawGame(t) {   // a little pixel platformer
  const g = tvCtx; g.fillStyle = '#7ec4f0'; g.fillRect(0, 0, 160, 90);
  g.fillStyle = '#fff'; [[20, 15], [90, 22], [140, 12]].forEach(([x, y]) => { const cx = (x - t * 8) % 180 + 10; g.fillRect(cx, y, 18, 5); g.fillRect(cx + 4, y - 3, 10, 3); });
  for (let x = -16; x < 176; x += 16) { const gx = x - (t * 30) % 16; g.fillStyle = '#6ab04c'; g.fillRect(gx, 70, 16, 4); g.fillStyle = '#a0522d'; g.fillRect(gx, 74, 16, 16); }
  g.fillStyle = '#c0703a'; for (let i = 0; i < 3; i++) g.fillRect((90 + i * 50 - t * 30) % 190 + 10, 46 - (i % 2) * 8, 14, 8);
  g.fillStyle = '#f5d142'; for (let i = 0; i < 4; i++) g.fillRect((60 + i * 40 - t * 30) % 180 + 10, 36 + Math.sin(t * 4 + i) * 2, 4, 6);
  const jy = Math.max(0, Math.sin(t * 3)) * 22; g.fillStyle = '#e74c3c'; g.fillRect(40, 58 - jy, 9, 12); g.fillStyle = '#f2c79c'; g.fillRect(41, 52 - jy, 7, 6);
  tvTex.needsUpdate = true;
}
export function drawFootball(t) {   // a match from above: striped pitch, two teams, the ball
  const g = tvCtx;
  for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#3f8f3f' : '#4a9d48'; g.fillRect(i * 20, 0, 20, 90); }
  g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 1; g.strokeRect(6, 6, 148, 78); g.beginPath(); g.moveTo(80, 6); g.lineTo(80, 84); g.stroke();
  g.beginPath(); g.arc(80, 45, 12, 0, 7); g.stroke(); g.strokeRect(6, 28, 14, 34); g.strokeRect(140, 28, 14, 34);
  const bx = 80 + Math.sin(t * .7) * 55, by = 45 + Math.sin(t * 1.3) * 25;
  for (let i = 0; i < 10; i++) {
    const team = i % 2, px = bx + Math.sin(t * .9 + i * 1.7) * (18 + i * 3) + (team ? 12 : -12), py = by + Math.cos(t * .8 + i * 2.1) * (14 + i * 2);
    g.fillStyle = team ? '#e8e8f0' : '#d94a3a'; g.beginPath(); g.arc(Math.max(8, Math.min(152, px)), Math.max(8, Math.min(82, py)), 2.6, 0, 7); g.fill();
  }
  g.fillStyle = '#fff'; g.beginPath(); g.arc(bx, by, 1.6, 0, 7); g.fill();
  g.fillStyle = 'rgba(20,20,30,.75)'; g.fillRect(4, 3, 36, 9); g.fillStyle = '#fff'; g.font = '7px sans-serif'; g.fillText(`RED ${Math.floor(t / 40) % 3} - ${Math.floor(t / 55) % 3} WHT`, 6, 10);
  tvTex.needsUpdate = true;
}
export function drawTV(t) {   // a slow nature film: sky, drifting sun, parallax hills, birds
  const g = tvCtx, [a, b, c, d] = TV_SCENES[Math.floor(t / 14) % 3];
  const gr = g.createLinearGradient(0, 0, 0, 90); gr.addColorStop(0, b); gr.addColorStop(1, a); g.fillStyle = gr; g.fillRect(0, 0, 160, 90);
  g.fillStyle = 'rgba(255,240,200,.9)'; g.beginPath(); g.arc((t * 6) % 200 - 20, 30, 9, 0, 7); g.fill();
  [[c, 55, .5, 12], [d, 68, 1.2, 9]].forEach(([col, base, sp, amp]) => { g.fillStyle = col; g.beginPath(); g.moveTo(0, 90); for (let x = 0; x <= 160; x += 4) g.lineTo(x, base + Math.sin((x + t * sp * 20) / 25) * amp); g.lineTo(160, 90); g.fill(); });
  g.strokeStyle = 'rgba(40,30,30,.7)'; g.lineWidth = 1;
  for (let i = 0; i < 3; i++) { const bx = (t * 14 + i * 22) % 190 - 15, by = 20 + i * 6 + Math.sin(t * 3 + i) * 2; g.beginPath(); g.moveTo(bx - 3, by - 2); g.lineTo(bx, by); g.lineTo(bx + 3, by - 2); g.stroke(); }
  tvTex.needsUpdate = true;
}
function hangingPlant(g, s, inside, y = 1.8) {   // pothos in a hanging pot on a wall bracket
  B(.04, .04, .34, darkWood, s, y + .5, inside * .17, g);
  C(.004, .004, .46, 4, '#8a7a60', s, y + .27, inside * .32, g);
  const p = plant('hanging', 0, 0, .85, g); p.position.set(s, y, inside * .32);
}
const wallDecor = [
  g => { // north: shelf + trailing pothos + herbs on kitchen sill, frame above bed side
    B(1.7, .05, .28, darkWood, 6.1, 1.9, .2, g);   // ends well short of the kitchen window
    [['#c9a36b', .2], ['#8e3b2f', .15], ['#e6c48a', .17]].forEach(([c, h], i) => C(.07, .07, h, 8, c, 5.9 + i * .45, 1.93 + h / 2, .2, g));
    const p1 = plant('pothos', 0, 0, .8, g); p1.position.set(5.45, 1.93, .2);
    const p2 = plant('pothos', 0, 0, .7, g); p2.position.set(6.75, 1.93, .2);
    sillPlant(g, 8.6, 1, 'small', 1.04); sillPlant(g, 2.3, 1, 'succulent'); sillPlant(g, 3.0, 1, 'small');
    hangingPlant(g, 4.2, 1); hangingPlant(g, 9.75, 1, 2.05);
    B(.5, .6, .04, frameMat, .9, 1.7, .08, g); B(.42, .52, .02, M('#e6b77a'), .9, 1.7, .1, g); Sph(.12, M('#c9763f'), .9, 1.68, .11, g).scale.z = .2;
  },
  g => { sillPlant(g, 1.5, -1, 'succulent'); sillPlant(g, 1.95, -1, 'small'); sillPlant(g, 8.1, -1, 'small'); hangingPlant(g, 2.7, -1); hangingPlant(g, 9.2, -1); },
  g => { // west: chimney breast, mantel art, hanging planter, bedroom sill
    B(1.2, 1.4, .4, stone, 5.325, 1.9, -.25, g);
    B(1.05, .62, .05, M('#1a1614'), 5.325, 1.95, -.47, g);
    const scr = add(new THREE.PlaneGeometry(.97, .55), tvMat, 5.325, 1.95, -.5, g); scr.rotation.y = Math.PI; scr.castShadow = false;
    sillPlant(g, 1.7, -1, 'small'); sillPlant(g, 2.1, -1, 'succulent'); hangingPlant(g, 4.3, -1);
    B(.04, .04, .35, darkWood, 3.0, 2.25, -.2, g); add(new THREE.CylinderGeometry(.003, .003, .4), M('#3a2418'), 3.0, 2.05, -.37, g);
    const hp = plant('pothos', 0, 0, .75, g); hp.position.set(3.0, 1.75, -.37);
  },
  g => { // east: kitchen + studio sills, pin board
    sillPlant(g, 2.07, 1, 'small', 1.04); sillPlant(g, 5.55, 1, 'succulent'); hangingPlant(g, 4.0, 1); hangingPlant(g, 6.6, 1);
    B(.9, .6, .04, M('#b98a5e'), 4.1, 1.75, .09, g);
    ['#f6efe2', '#e6c48a', '#c9763f', '#8fa07a'].forEach((c, i) => B(.22, .26, .01, M(c), 3.8 + (i % 2) * .38, 1.62 + Math.floor(i / 2) * .28, .12, g));
  },
];
export const walls = EXT.map((w, i) => ({
  n: w.n,
  tall: buildWall(...w.a, ...w.b, WALL_H, w.open, wallDecor[i]),
  low: buildWall(...w.a, ...w.b, LOW_H, w.open),
}));
// interior walls are always cut away (Sims-style)
buildWall(0, -3.5, 0, 4.3, LOW_H, [door(5.9)]);
buildWall(-5, 0, 0, 0, LOW_H, [door(3.8)]);
buildWall(0, -.6, 5, -.6, LOW_H, [door(2.6)]);

// ---------------------------------------------------------------- furniture
export function chair(x, z, h, col = '#7a4a2c') {
  const g = group(x, 0, z, h);
  B(.45, .05, .45, col, 0, .43, 0, g); B(.45, .55, .05, col, 0, .7, -.2, g);
  [[-.18, -.18], [.18, -.18], [-.18, .18], [.18, .18]].forEach(([a, b]) => B(.04, .42, .04, darkWood, a, .21, b, g));
  return g;
}
function lampShade(x, y, z, parent, col = '#ecc27a') {
  const m = M(col, { emissive: '#ffb860', emissiveIntensity: 0, side: THREE.DoubleSide });
  add(new THREE.CylinderGeometry(.13, .2, .24, 12, 1, true), m, x, y, z, parent).castShadow = false;
  return m;
}
export const shades = [];
export const lights = [];
export function pointLight(col, x, y, z, base) { const l = new THREE.PointLight(col, 0, 0, 1.8); l.position.set(x, y, z); l.userData.base = base; scene.add(l); lights.push(l); return l; }

// --- living room: fireplace, rug, sofa, armchair, bookshelf, lamp
B(.25, 1.3, 1.6, stone, -4.83, .65, 1.75);
B(.45, 1.3, .38, stone, -4.6, .65, 1.11); B(.45, 1.3, .38, stone, -4.6, .65, 2.39);
B(.45, .5, .9, stone, -4.6, 1.05, 1.75);
B(.02, .8, .9, M('#140b08'), -4.69, .4, 1.75);
B(.8, .06, 1.9, M('#6a625b'), -4.5, .03, 1.75);
B(.75, .1, 1.95, wood, -4.55, 1.35, 1.75);
const fire = group(-4.5, .06, 1.75);
[-.4, .4].forEach(r => { const l = C(.05, .05, .5, 6, '#4a2e1e', 0, .05, 0, fire); l.rotation.set(Math.PI / 2, r, 0); });
export const flames = [['#c2401f', .16, .45], ['#f07b2a', .12, .34], ['#ffd05a', .07, .22]].flatMap(([c, r, h], k) =>
  [-.12, 0, .12].map(dz => { const f = add(new THREE.ConeGeometry(r, h, 6), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: .9 }), .02 * k, .1 + h / 2, dz, fire); f.castShadow = false; f.userData = { h, k: k * 3 + dz * 10 }; return f; }));
export const tvLight = new THREE.PointLight('#a8c4ff', 0, 0, 2); tvLight.position.set(-4.0, 1.8, 1.75); scene.add(tvLight);
export const popcorn = group(-2.25, .43, 1.65); popcorn.visible = false;
C(.11, .07, .08, 12, '#c9512c', 0, .04, 0, popcorn); for (let i = 0; i < 9; i++) Sph(.03, '#f6e7a8', Math.cos(i) * .06, .09 + (i % 3) * .015, Math.sin(i) * .06, popcorn, 5);
export const fireLight = new THREE.PointLight('#ff8a3d', 6, 0, 1.6); fireLight.position.set(-4.0, .7, 1.75); scene.add(fireLight);
export const candleFlames = [1.2, 1.4].map(z => { C(.035, .035, .2, 8, '#efe2c4', -4.5, 1.5, z); const f = Sph(.028, new THREE.MeshBasicMaterial({ color: '#ffcf6b' }), -4.5, 1.63, z, scene, 6); f.castShadow = false; return f; });
plant('small', -4.5, 0, 1, scene, 1.4).position.z = 2.3;

const rug = C(1.1, 1.1, .02, 32, '#8e3b2f', -3.25, .01, 1.75); rug.scale.z = .8;
C(.9, .9, .025, 32, '#c46a4a', -3.25, .01, 1.75).scale.z = .8;

const sofaMat = fabric('#6f7d4e'), sofaBase = fabric('#5d6840');
// L-shaped sofa: main run faces the fireplace, the return wraps around toward it at the far end
soft(.86, .26, 1.82, .07, sofaBase, -2.15, .13, 1.85);                                  // main base
[1.35, 1.95].forEach(z => soft(.74, .17, .6, .08, sofaMat, -2.19, .335, z));           // main seat cushions
soft(.74, .17, .5, .08, sofaMat, -2.19, .335, 2.5);                                     // corner cushion
soft(.26, .96, 1.82, .1, sofaBase, -1.84, .48, 1.85);                                   // main back
[1.35, 1.95, 2.5].forEach(z => soft(.2, .44, .58, .09, sofaMat, -1.99, .62, z).rotation.z = -.12);
soft(.88, .56, .22, .1, sofaBase, -2.15, .28, .96);                                     // arm by the window
soft(.8, .26, .82, .07, sofaBase, -2.95, .13, 2.35);                                    // return base
soft(.74, .17, .76, .08, sofaMat, -2.95, .335, 2.35);                                   // return cushion (a backless chaise)
soft(.22, .56, .82, .1, sofaBase, -3.37, .28, 2.35);                                    // return arm
soft(.16, .3, .36, .08, fabric('#c9763f'), -2.02, .66, 1.12).rotation.set(.2, 0, -.15);
soft(.32, .3, .16, .08, fabric('#e6c48a'), -2.15, .66, 2.48).rotation.set(-.15, .7, 0);
soft(.6, .04, .5, .02, fabric('#e6c48a'), -2.85, .44, 2.25);                            // throw blanket on the return

const arm = group(-3.85, 0, .55, -.6);
soft(.72, .26, .72, .07, fabric('#a04a37'), 0, .13, 0, arm); soft(.56, .16, .58, .08, fabric('#b5543f'), 0, .34, .04, arm);
soft(.74, .92, .2, .1, fabric('#a04a37'), 0, .46, -.3, arm); soft(.5, .38, .14, .07, fabric('#b5543f'), 0, .62, -.18, arm).rotation.x = -.15;
soft(.17, .58, .72, .08, fabric('#a04a37'), -.35, .29, 0, arm); soft(.17, .58, .72, .08, fabric('#a04a37'), .35, .29, 0, arm);

const bookCols = ['#8e3b2f', '#3f6a6a', '#c9a36b', '#7d8a58', '#5a4a6a', '#b5543f', '#e6c48a'];
// open bookcase; local +z faces the room, `gap` leaves half of one shelf free for decor
function bookcase(x, z, ry, w, gap = -1, h = 1.8) {
  const g = group(x, 0, z, ry);
  B(w, h, .03, darkWood, 0, h / 2, -.16, g);
  B(.04, h, .34, darkWood, -w / 2, h / 2, 0, g); B(.04, h, .34, darkWood, w / 2, h / 2, 0, g);
  B(w + .04, .04, .34, darkWood, 0, h, 0, g);
  [.06, .5, .94, 1.38].forEach((y, r) => {
    B(w, .04, .34, wood, 0, y, 0, g);
    for (let bx = -w / 2 + .06, k = r * 5; bx < (r === gap ? 0 : w / 2 - .05); bx += .072, k++) {
      if (k % 9 === 4) { bx += .05; continue; }
      const bh = .26 + (k % 3) * .04;
      const b = B(.064, bh, .24, bookCols[k % 7], bx, y + .02 + bh / 2, -.02, g);
      if (k % 13 === 7) b.rotation.z = .18;
    }
  });
  return g;
}
const shelf = bookcase(-4.78, 3.75, Math.PI / 2, .9, 2);
plant('pothos', 0, 0, .9, shelf, 1.82).position.x = -.2;
plant('small', 0, 0, .8, shelf, .96).position.x = .25;

C(.14, .16, .03, 12, '#3a2418', -4.6, .02, .05); C(.012, .012, 1.5, 6, '#3a2418', -4.6, .75, .05);
shades.push(lampShade(-4.6, 1.55, .05));
pointLight('#ffc27a', -4.5, 1.4, .2, 2.5);

C(.3, .3, .06, 24, smooth('#8e6a8e'), -3.4, .03, 3.75); add(new THREE.TorusGeometry(.26, .07, 12, 28), smooth('#8e6a8e'), -3.4, .09, 3.75).rotation.x = Math.PI / 2;
C(.24, .24, .05, 24, fabric('#e6c48a'), -3.4, .09, 3.75);
plant('monstera', -0.3, 1.5, 1.1);
plant('fiddle', -2.0, 3.95, 1);
plant('fern', -3.9, 4.1, .8);

// --- bedroom
const screenTex = canvasTex(64, 40, (g) => { g.fillStyle = '#2b2f3a'; g.fillRect(0, 0, 64, 40); ['#e6c48a', '#8fbf9a', '#c9a6e8', '#9fc3e8'].forEach((c, i) => { for (let r = 0; r < 3; r++) { g.fillStyle = c; g.fillRect(4 + (r % 2) * 6, 4 + (i * 3 + r) * 3, 18 + ((i + r) * 7) % 30, 1.5); } }); });
// soft fabric: rounded boxes with smooth shading
const linenTex = canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#ece0cc'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 9000; i++) { g.fillStyle = Math.random() < .5 ? 'rgba(255,255,255,.18)' : 'rgba(150,120,90,.08)'; g.fillRect(Math.random() * w, Math.random() * h, 2, 1); }
  g.strokeStyle = 'rgba(170,140,105,.35)'; g.lineWidth = 2;                 // soft quilted channels
  for (let y = 32; y < h; y += 64) { g.setLineDash([6, 5]); g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
}, [1.5, 1.5]);
const knitTex = canvasTex(128, 64, (g, w, h) => {
  g.fillStyle = '#c99333'; g.fillRect(0, 0, w, h);
  g.strokeStyle = '#e3b552'; g.lineWidth = 3;
  for (let y = 4; y < h; y += 10) for (let x = 0; x < w; x += 10) { g.beginPath(); g.moveTo(x, y); g.lineTo(x + 5, y + 7); g.lineTo(x + 10, y); g.stroke(); }
}, [5, 1]);
soft(1.84, .36, 2.24, .05, wood, -2.5, .18, -2.3);
soft(1.95, 1.15, .14, .05, darkWood, -2.5, .56, -3.39);
soft(1.72, .24, 2.1, .06, fabric('#f7f2e8'), -2.5, .46, -2.3);                          // mattress + fitted sheet
[-2.85, -2.15].forEach((x, i) => {
  const sham = soft(.66, .48, .14, .07, fabric('#9aab8a'), x, .82, -3.24); sham.rotation.x = -.18;   // sage shams
  soft(.64, .17, .4, .08, fabric('#fbf8f1'), x + (i ? -.02 : .02), .66, -3.0);                        // sleeping pillows
});
soft(.5, .16, .14, .07, fabric('#c46a4a'), -2.5, .74, -2.82).rotation.x = -.3;          // accent cushion
soft(1.9, .47, 1.42, .09, fabric('#ffffff', { map: linenTex }), -2.5, .69, -1.83);    // duvet draped over the sides
soft(1.92, .07, .24, .035, fabric('#fbf8f1'), -2.5, .91, -2.46);                         // folded-back top sheet
soft(1.98, .5, .46, .04, fabric('#ffffff', { map: knitTex }), -2.5, .7, -1.43);         // chunky knit throw across the foot
[-3.75, -1.25].forEach(x => {
  B(.5, .5, .45, wood, x, .25, -3.1);
  C(.05, .07, .22, 8, '#efe2c8', x, .61, -3.15); shades.push(lampShade(x, .82, -3.15));
});
pointLight('#ffc27a', -2.5, 1.3, -2.8, 2.2);
plant('succulent', -1.15, -3.0, 1, scene, .5);
B(.55, 1.9, 1.1, darkWood, -4.7, .95, -.7); B(.02, 1.7, .02, M('#3a2418'), -4.42, .95, -.7);
B(2.6, .02, 1.0, M('#e6c48a'), -2.5, .01, -.65);
plant('snake', -0.4, -3.1, 1.1);
plant('fern', -4.6, -1.85, .9);
plant('monstera', -4.55, -3.1, .9);

// --- kitchen
const cab = M('#7a8a6a');
B(3.7, .9, .6, cab, 2.15, .45, -3.15); B(3.8, .06, .66, M('#e9e1d2'), 2.15, .93, -3.15);
for (let x = .5; x < 4; x += .62) B(.56, .7, .02, M('#6a7a5a'), x + .28, .45, -2.84);
B(.6, .02, .5, M('#2a2624'), 2.0, .97, -3.15);
B(.55, .4, .03, M('#3a3432'), 2.0, .45, -2.83);
export const ovenGlow = B(.35, .15, .02, M('#a85a2a', { emissive: '#ff7a2a', emissiveIntensity: 0 }), 2.0, .5, -2.81);
C(.15, .13, .2, 12, '#8a8f94', 2.0, 1.08, -3.15); C(.16, .16, .02, 12, '#b8bcc0', 2.0, 1.19, -3.15);
B(.55, .03, .4, M('#b8bcc0'), 3.6, .96, -3.15);
B(.4, .025, .26, lightWood, 1.05, .97, -3.12);
const mixingBowl = group(1.5, .96, -3.15); C(.13, .08, .1, 16, smooth('#efe2c8'), 0, .05, 0, mixingBowl); C(.11, .11, .01, 16, smooth('#e8d2a0'), 0, .09, 0, mixingBowl); mixingBowl.visible = false;
export const cookieTray = group(1.55, .96, -3.15); B(.36, .015, .26, M('#9aa0a6'), 0, .01, 0, cookieTray);
for (let i = 0; i < 6; i++) C(.035, .035, .012, 10, smooth('#c98a4a'), -.11 + (i % 3) * .11, .025, -.06 + Math.floor(i / 3) * .12, cookieTray);
cookieTray.visible = false;
[[.95, '#e07b39'], [1.02, '#e07b39'], [1.15, '#7d9a58']].forEach(([x, c], i) => { const v = C(.022, .015, .14, 6, c, x, 1.0, -3.1 + i * .04); v.rotation.z = Math.PI / 2; });
B(.16, .01, .03, M('#b8bcc0'), 1.2, .99, -3.2); B(.03, .25, .03, M('#b8bcc0'), 3.6, 1.08, -3.38);
[3.25, 0.55].forEach((x, i) => plant(i ? 'small' : 'succulent', x, -3.2, i ? .9 : 1.1, scene, .96));
// coffee machine
B(.28, .4, .3, M('#2f2a28'), 2.8, 1.16, -3.27); B(.29, .06, .31, M('#b8bcc0'), 2.8, 1.39, -3.27);
B(.2, .16, .1, M('#1a1614'), 2.8, 1.04, -3.1); B(.04, .04, .06, M('#b8bcc0'), 2.8, 1.14, -3.1);
B(.22, .02, .14, M('#b8bcc0'), 2.8, .97, -3.08);
export const coffeeLight = Sph(.015, M('#ff9a3a', { emissive: '#ff7a1a', emissiveIntensity: 0 }), 2.72, 1.3, -3.115, scene, 6);
export const coffeeCup = C(.035, .03, .07, 10, '#efe2c4', 2.8, 1.015, -3.1); coffeeCup.visible = false;
C(.12, .12, .2, 10, '#c9a36b', 3.05, 1.06, -3.3);   // coffee bean jar
export const coffeeSteam = Array.from({ length: 3 }, (_, i) => { const s = Sph(.025, new THREE.MeshBasicMaterial({ color: '#f3e9da', transparent: true, depthWrite: false }), 2.8, 1.1, -3.1, scene, 6); s.castShadow = false; s.userData.o = i / 3; return s; });
B(.7, 1.8, .65, M('#e8dfd0'), 4.6, .9, -3.12); B(.03, .5, .03, M('#b8bcc0'), 4.3, 1.2, -2.78);
export const steam = Array.from({ length: 5 }, (_, i) => { const s = Sph(.06, new THREE.MeshBasicMaterial({ color: '#f3e9da', transparent: true, depthWrite: false }), 2.0, 1.3, -3.15, scene, 6); s.castShadow = false; s.userData.o = i / 5; return s; });
C(.5, .5, .05, 18, wood, 1.6, .75, -1.65); C(.06, .1, .75, 8, darkWood, 1.6, .37, -1.65);
chair(.95, -1.65, Math.PI / 2); chair(2.25, -1.65, -Math.PI / 2);
export const bowls = [1.27, 1.93].map(x => { C(.1, .07, .06, 12, '#efe2c4', x, .81, -1.65); return C(.085, .085, .01, 12, '#c9763f', x, .84, -1.65); });
C(.03, .03, .18, 8, '#efe2c4', 1.6, .87, -1.5); export const tableCandle = Sph(.028, new THREE.MeshBasicMaterial({ color: '#ffcf6b' }), 1.6, .99, -1.5, scene, 6);
plant('succulent', 1.6, -1.82, 1.2, scene, .78);
add(new THREE.CylinderGeometry(.005, .005, .8), '#3a2418', 1.6, 2.2, -1.65);
shades.push(lampShade(1.6, 1.75, -1.65, scene, '#e6c48a'));
pointLight('#ffc27a', 1.6, 1.6, -1.65, 2.5);
export const stoveGlow = new THREE.PointLight('#ffb070', 0, 0, 2); stoveGlow.position.set(2.0, 1.4, -2.8); scene.add(stoveGlow);
[[-1.2, '#6a8aa8'], [-1.65, '#c98a9a']].forEach(([z, c]) => { C(.1, .08, .06, 12, c, 4.62, .03, z); C(.08, .08, .01, 12, '#8a5a3a', 4.62, .06, z); });
B(.35, .01, .8, M('#c9a36b'), 4.62, .005, -1.42);
plant('fiddle', .35, -1.05, .95);

// --- studio: easel, crochet chair, drawing desk
const paintTex = canvasTex(96, 128, (g, w, h) => { g.fillStyle = '#f6efe2'; g.fillRect(0, 0, w, h); });
const paintCtx = paintTex.userData.canvas.getContext('2d');
let strokes = 0;
export function paintStroke() {
  const g = paintCtx, n = strokes++ % 160;
  if (n === 0) { g.fillStyle = '#f6efe2'; g.fillRect(0, 0, 96, 128); }
  let y, cols;
  if (n < 45) { y = rand(0, 60); cols = ['#f4ad6c', '#e88b5e', '#f8cf8a', '#c96a68']; }
  else if (n < 80) { y = rand(60, 128); cols = ['#7a6a3a', '#8a7a40', '#6b5a30']; }
  else { y = rand(25, 95); cols = ['#c9512c', '#e07b39', '#f0a640', '#a8432a', '#3b2418']; }
  g.strokeStyle = pick(cols); g.lineWidth = rand(3, 7); g.lineCap = 'round';
  const x = rand(0, 96); g.beginPath(); g.moveTo(x, y); g.lineTo(x + rand(-14, 14), y + rand(-6, 6)); g.stroke();
  paintTex.needsUpdate = true;
}
const easel = group(1.0, 0, 1.8, Math.PI / 2);
[[-.25, .15], [.25, -.15]].forEach(([x, r]) => B(.04, 1.6, .04, lightWood, x, .8, -.05, easel).rotation.z = r);
B(.04, 1.5, .04, lightWood, 0, .75, -.3, easel).rotation.x = -.25;
B(.6, .04, .1, lightWood, 0, .8, .02, easel);
B(.58, .74, .03, M('#e9e1d2'), 0, 1.2, 0, easel);
add(new THREE.PlaneGeometry(.55, .7), new THREE.MeshStandardMaterial({ map: paintTex }), 0, 1.2, .02, easel);
B(.4, .55, .4, darkWood, 1.0, .275, 2.55); B(.25, .02, .18, M('#efe2c8'), 1.0, .56, 2.55);
['#c9512c', '#3f6a6a', '#f0a640', '#7d8a58'].forEach((c, i) => C(.02, .02, .01, 8, c, .93 + (i % 2) * .1, .58, 2.5 + Math.floor(i / 2) * .08));
for (let i = 0; i < 3; i++) B(.04, .6 - i * .08, .5, M(['#e9e1d2', '#c9763f', '#7d8a58'][i]), 1.0 + i * .06, .3 - i * .04, 4.0).rotation.z = .2;

// crochet corner: a soft armchair facing into the room, yarn basket and a granny-square throw
const cro = group(.5, 0, -.12, Math.PI / 4);
soft(.68, .26, .68, .07, fabric('#c98a8a'), 0, .13, 0, cro); soft(.54, .16, .56, .08, fabric('#d9a0a0'), 0, .34, .04, cro);
soft(.7, .88, .2, .1, fabric('#c98a8a'), 0, .44, -.29, cro); soft(.16, .56, .68, .08, fabric('#c98a8a'), -.33, .28, 0, cro); soft(.16, .56, .68, .08, fabric('#c98a8a'), .33, .28, 0, cro);
const granny = canvasTex(64, 64, g => { const cs = ['#efe2c8', '#c9763f', '#7d9a8a', '#e6c48a', '#b5543f']; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) for (let r = 0; r < 3; r++) { g.fillStyle = cs[(i + j + r) % 5]; g.fillRect(i * 16 + r * 2.5, j * 16 + r * 2.5, 16 - r * 5, 16 - r * 5); } });
granny.magFilter = THREE.NearestFilter;
soft(.5, .03, .55, .015, M('#ffffff', { map: granny, flatShading: false }), .05, .62, -.2, cro).rotation.x = .9;
C(.18, .15, .2, 14, '#b98a5e', 1.15, .1, -.35);
[['#c96a68', 1.1, -.39], ['#7d9a8a', 1.21, -.35], ['#e6c48a', 1.13, -.27]].forEach(([c, x, z]) => Sph(.06, fabric(c), x, .22, z, scene, 12));

const desk = group(4.55, 0, 2.75);
B(.6, .05, 1.0, lightWood, 0, .74, 0, desk); [[-.25, -.45], [.25, -.45], [-.25, .45], [.25, .45]].forEach(([a, b]) => B(.04, .72, .04, darkWood, a, .36, b, desk));
B(.24, .005, .3, M('#fbf6ec'), -.12, .77, -.22, desk);
export const laptopMat = new THREE.MeshBasicMaterial({ map: screenTex, color: '#222222' });
B(.26, .015, .34, M('#b8bcc0'), .08, .775, .1, desk);
const lid = group(.21, .78, .1, 0, desk); lid.rotation.z = -.22;
B(.012, .22, .34, M('#b8bcc0'), 0, .11, 0, lid);
add(new THREE.PlaneGeometry(.31, .19), laptopMat, -.008, .115, 0, lid).rotation.y = -Math.PI / 2;
C(.04, .04, .1, 8, '#c9763f', .15, .82, .35, desk);
C(.01, .01, .35, 6, '#3a2418', .18, .93, -.35, desk); shades.push(lampShade(.1, 1.1, -.3, desk, '#e6c48a'));
pointLight('#ffc27a', 4.3, 1.2, 2.5, 1.8);
chair(3.95, 2.75, Math.PI / 2, '#b98a5e');
const hobbyRug = canvasTex(256, 256, (g) => {   // round woven rug: sage field, cream and terracotta rings, little dots
  const ring = (r, c) => { g.fillStyle = c; g.beginPath(); g.arc(128, 128, r, 0, 7); g.fill(); };
  ring(128, '#efe2c8'); ring(118, '#8fa58a'); ring(104, '#efe2c8'); ring(98, '#c97a5a'); ring(90, '#9fb39a'); ring(56, '#efe2c8'); ring(50, '#d9a46a'); ring(20, '#efe2c8');
  for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2; g.fillStyle = i % 2 ? '#c97a5a' : '#efe2c8'; g.beginPath(); g.arc(128 + Math.cos(a) * 74, 128 + Math.sin(a) * 74, 6, 0, 7); g.fill(); }
  for (let i = 0; i < 2500; i++) { g.fillStyle = `rgba(${Math.random() < .5 ? '255,255,255' : '60,40,30'},.06)`; g.fillRect(Math.random() * 256, Math.random() * 256, 2, 2); }
});
add(new THREE.CylinderGeometry(1.3, 1.3, .02, 56), new THREE.MeshStandardMaterial({ map: hobbyRug, roughness: 1 }), 2.5, .01, 1.85).scale.z = .85;   // centred in the hobby room
C(.22, .18, .2, 12, '#b98a5e', 1.45, .1, 4.0);
export const yarn = Sph(.08, M('#c96a68', { flatShading: false }), 2.5, .08, 1.85, scene, 12);
Sph(.06, M('#7d8a58', { flatShading: false }), 1.4, .22, 3.97); Sph(.06, M('#e6c48a', { flatShading: false }), 1.51, .22, 4.03);
plant('monstera', .4, .85, .85);   // between the easel and the crochet chair
export const wand = { active: false, pos: new THREE.Vector3() }, UP = new THREE.Vector3(0, 1, 0), tmpV = new THREE.Vector3();
export const wandStick = add(new THREE.CylinderGeometry(.007, .007, 1, 4), '#8a5634', 0, 0, 0); wandStick.castShadow = false;
export const feather = add(new THREE.ConeGeometry(.04, .17, 5), M('#e85d8a'), 0, 0, 0);
wandStick.visible = feather.visible = false;
plant('snake', 4.65, .35, 1);
plant('monstera', 4.6, -.25, .85);
plant('fiddle', 3.8, -.3, .8);

// studio bookshelf (against the kitchen-side wall)
const sShelf = bookcase(2.1, -.38, 0, 1.1, 1);
// computer desk (moved here from the bedroom)
const pcDesk = group(4.55, 0, 1.1, -Math.PI / 2);   // local +z faces the person at the desk
B(1.0, .05, .55, lightWood, 0, .74, 0, pcDesk); [[-.46, -.23], [.46, -.23], [-.46, .23], [.46, .23]].forEach(([x, z]) => B(.04, .72, .04, darkWood, x, .36, z, pcDesk));
export const monitorMat = new THREE.MeshBasicMaterial({ map: screenTex, color: '#222222' });
C(.1, .08, .02, 10, '#2a2624', 0, .775, -.17, pcDesk); B(.04, .2, .03, M('#2a2624'), 0, .88, -.18, pcDesk);
B(.64, .38, .04, M('#2a2624'), 0, 1.1, -.21, pcDesk); add(new THREE.PlaneGeometry(.6, .34), monitorMat, 0, 1.1, -.187, pcDesk);
B(.44, .02, .16, M('#e9e1d2'), 0, .775, .11, pcDesk); B(.06, .02, .09, M('#e9e1d2'), .32, .775, .11, pcDesk);
C(.04, .035, .09, 8, '#8fa07a', -.4, .81, -.14, pcDesk); plant('succulent', .38, -.17, 1.1, pcDesk, .765);
chair(3.95, 1.1, Math.PI / 2, '#b98a5e');
plant('pothos', 0, 0, .9, sShelf, 1.82).position.x = -.3;
plant('small', 0, 0, .8, sShelf, 1.82).position.x = .3;
plant('succulent', 0, 0, 1.1, sShelf, .52).position.x = .3;

// reading nook: a window seat under the studio's south window
B(1.4, .42, .42, lightWood, 2.55, .21, 4.01);
soft(1.36, .1, .4, .04, fabric('#7d8a58'), 2.55, .46, 4.01);
[[2.03, '#c9763f'], [2.33, '#e6c48a'], [3.09, '#b5543f']].forEach(([x, c]) => Sph(.14, M(c, { flatShading: false }), x, .62, 4.13, scene, 12).scale.set(1, .9, .45));
B(.5, .03, .42, M('#c96a68'), 2.9, .515, 4.01);
[0, 1, 2].forEach(i => B(.22, .05, .16, M(bookCols[i + 2]), 1.97, .525 + i * .05, 3.92).rotation.y = i * .3);
C(.14, .16, .03, 12, '#3a2418', 3.5, .02, 4.1); C(.012, .012, 1.4, 6, '#3a2418', 3.5, .7, 4.1);
shades.push(lampShade(3.5, 1.45, 4.1));
pointLight('#ffc27a', 3.25, 1.3, 3.8, 1.8);

// ---------------------------------------------------------------- Christmas (winter only)
export const xmas = group(0, 0, 0);
export const xmasBulbs = [];   // twinkled in main.js
export const xmasStar = new THREE.MeshStandardMaterial({ color: '#ffd76a', emissive: '#ffc53a', emissiveIntensity: 1.2, flatShading: true });
{
  const g = group(-4.15, 0, 2.95, 0, xmas);   // tree in the living room corner by the fireplace
  C(.38, .38, .02, 28, smooth('#b5343a'), 0, .01, 0, g);                                      // tree skirt
  C(.05, .06, .3, 8, '#5a3d28', 0, .15, 0, g);
  const greens = [smooth('#2f5a34'), smooth('#3a6a3c'), smooth('#447644')];
  const tiers = [[.5, .55, .5], [.4, .5, .85], [.3, .45, 1.17], [.19, .38, 1.45]];
  tiers.forEach(([r, h, y], i) => add(new THREE.ConeGeometry(r, h, 22), greens[Math.min(2, i)], 0, y, 0, g).rotation.y = i * .7);
  const star = add(new THREE.OctahedronGeometry(.07, 0), xmasStar, 0, 1.7, 0, g); star.scale.set(1, 1.3, .5);
  const ornCols = ['#c0392b', '#e8b84a', '#d9dde2', '#3f6aa8', '#c96a8a'];
  for (let i = 0; i < 34; i++) {   // ornaments on the cone surfaces
    const [r, h, y] = tiers[i % 4], t = Math.random() * .8, a = Math.random() * Math.PI * 2, rr = r * (1 - t) * .95, yy = y - h / 2 + h * t;
    Sph(.032, smooth(pick(ornCols)), Math.cos(a) * rr, yy, Math.sin(a) * rr, g, 10);
  }
  for (let i = 0; i < 60; i++) {   // a spiral of fairy lights
    const f = i / 60, y = .3 + f * 1.25, rr = .52 * (1 - f) + .05, a = f * Math.PI * 9;
    const b = Sph(.018, new THREE.MeshBasicMaterial({ color: '#ffd27a' }), Math.cos(a) * rr, y, Math.sin(a) * rr, g, 6); b.castShadow = false; xmasBulbs.push(b);
  }
  [[.42, .25, '#b5343a', '#efe2c8'], [-.38, .32, '#2f6a6a', '#e8b84a'], [.1, .5, '#e8c25a', '#b5343a'], [-.1, -.42, '#efe2c8', '#2f6a6a']].forEach(([x, z, c, rib], i) => {
    const sz = .14 + (i % 2) * .05, p = group(x, 0, z, i * .6, g);   // presents
    B(sz, sz * .8, sz, M(c), 0, sz * .4, 0, p); B(sz + .005, sz * .8 + .005, .025, M(rib), 0, sz * .4, 0, p); B(.025, sz * .8 + .005, sz + .005, M(rib), 0, sz * .4, 0, p);
  });
  const glow = new THREE.PointLight('#ffcf8a', 1.4, 4, 2); glow.position.set(.15, 1.0, -.05); g.add(glow);   // hidden with the rest of the decorations
}
// garland with little lights along the mantel, and three stockings
add(new THREE.CapsuleGeometry(.05, 1.8, 6, 12), smooth('#2f5a34'), -4.16, 1.33, 1.75, xmas).rotation.x = Math.PI / 2;
for (let i = 0; i < 12; i++) { const b = Sph(.016, new THREE.MeshBasicMaterial({ color: '#ffd27a' }), -4.1, 1.33, .85 + i * .165, xmas, 6); b.castShadow = false; xmasBulbs.push(b); }
[[1.35, '#b5343a'], [1.75, '#2f6a6a'], [2.15, '#b5343a']].forEach(([z, c]) => {
  soft(.07, .26, .12, .03, fabric(c), -4.12, 1.12, z, xmas); soft(.07, .08, .18, .03, fabric(c), -4.12, .98, z + .04, xmas);
  soft(.075, .06, .13, .02, fabric('#f3ead9'), -4.12, 1.26, z, xmas);
});
onSeason(s => xmas.visible = s === WINTER);

// ---------------------------------------------------------------- per-frame effects
// `now` describes this frame: { T (real seconds), simT, camAz, lit (fire), lamp (0..1), using(spot), brewing, baking, cooking }
export function animateHouse({ T, simT, camAz, lit, lamp, using, brewing, baking, cooking }) {
  // cutaway: walls facing the camera drop to stubs
  walls.forEach(w => { const low = w.n[0] * Math.sin(camAz) + w.n[1] * Math.cos(camAz) > .1; w.tall.visible = !low; w.low.visible = low; });
  // fire and candles
  const flick = 1 + Math.sin(T * 11) * .1 + Math.sin(T * 5.3) * .08 + (Math.random() - .5) * .06;
  fireLight.intensity = lit ? (4 + lamp * 6) * flick : 0;
  flames.forEach(f => { f.visible = lit; const s = 1 + Math.sin(T * 10 + f.userData.k) * .18; f.scale.set(1, s, 1); f.position.y = .1 + f.userData.h * s / 2; });
  candleFlames.forEach((c, i) => c.scale.setScalar(1 + Math.sin(T * 12 + i) * .15)); tableCandle.scale.setScalar(1 + Math.sin(T * 13) * .15);
  // coffee machine
  coffeeLight.material.emissiveIntensity = brewing ? 2 : 0; coffeeCup.visible = brewing;
  coffeeSteam.forEach(s => { s.visible = brewing; const pr = (T * .5 + s.userData.o) % 1; s.position.set(2.8 + Math.sin(T * 2 + s.userData.o * 7) * .02, 1.07 + pr * .3, -3.1); s.material.opacity = .5 * (1 - pr); });
  // screens: TV shows a game, a match or a film; laptop and computer light up when used
  const tvOn = ['tv1', 'tv2', 'games', 'football'].some(using);
  tvMat.color.set(tvOn ? '#ffffff' : '#111111'); tvLight.intensity = tvOn ? .9 + Math.sin(T * 2.3) * .25 : 0;
  if (tvOn) (using('games') ? drawGame : using('football') ? drawFootball : drawTV)(T);
  laptopMat.color.set(using('laptop') ? '#ffffff' : '#222222'); monitorMat.color.set(using('computer') ? '#ffffff' : '#222222');
  // baking leaves cookies cooling on the counter for a while
  if (baking) cookieTray.userData.ready = simT + 600;
  cookieTray.visible = !baking && simT < (cookieTray.userData.ready || 0);
  // stove
  stoveGlow.intensity = cooking ? 1.2 : 0; ovenGlow.material.emissiveIntensity = cooking || baking ? .8 : 0;
  steam.forEach(s => { s.visible = cooking; const pr = (T * .3 + s.userData.o) % 1; s.position.set(2.0 + Math.sin(T + s.userData.o * 9) * .08, 1.3 + pr, -3.15); s.scale.setScalar(1 + pr * 2); s.material.opacity = .45 * (1 - pr); });
  // Christmas lights
  if (xmas.visible) { twinkle(xmasBulbs, T); xmasStar.emissiveIntensity = 1 + .4 * Math.sin(T * 1.5); }
}
