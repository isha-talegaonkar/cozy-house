import * as THREE from 'three';
import { scene } from './scene.js';
import { B, C, M, Sph, add, darkWood, group, pick, rand, smooth, stone, terracotta, wood } from './helpers.js';
import { chair, pointLight, shades } from './house.js';
import { plant } from './plants.js';

// ---------------------------------------------------------------- yard
const ground = add(new THREE.CircleGeometry(60, 48), '#6e6a3a', 0, -.42, 0); ground.rotation.x = -Math.PI / 2;
const lawn = add(new THREE.PlaneGeometry(24, 24), '#7d7742', 0, -.41, 0); lawn.rotation.x = -Math.PI / 2;
B(1.4, .3, .6, stone, -1.0, -.27, 4.65); B(.8, .02, .4, M('#a8432a'), -1.0, -.1, 4.7);
const stones = new THREE.InstancedMesh(new THREE.CylinderGeometry(.24, .26, .05, 7), M('#a39a8e'), 16);
export const dummy = new THREE.Object3D();
for (let i = 0; i < 14; i++) { dummy.position.set(-1.0 + rand(-.12, .12), -.39, 5.3 + i * .5); dummy.rotation.set(0, rand(0, 3), 0); dummy.updateMatrix(); stones.setMatrixAt(i, dummy.matrix); }
stones.receiveShadow = true; scene.add(stones);
// pumpkins + mums by the door
[[-1.9, 4.8, .2], [-1.6, 5.05, .14], [-.15, 4.85, .17]].forEach(([x, z, r]) => { Sph(r, M('#e07b39'), x, -.4 + r * .7, z).scale.y = .75; C(.015, .02, .08, 5, '#4a3a20', x, -.4 + r * 1.3, z); });
function mum(x, z, c) { Sph(.22, smooth(c), x, -.25, z, scene, 18).scale.y = .7; C(.14, .11, .2, 18, terracotta, x, -.32, z); }
[[-4.3, 4.7, '#e8a23a'], [-3.2, 4.7, '#b5543f'], [1.0, 4.7, '#e8c25a'], [3.2, 4.7, '#c9512c'], [4.4, 4.7, '#e8a23a']].forEach(a => mum(...a));
// lumpy "puff" shapes shared by all canopies (no textures, so no seams)
const puffGeos = [0, 1, 2].map(seed => {
  const geo = new THREE.IcosahedronGeometry(1, 2), pos = geo.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const n = 1 + .07 * Math.sin(v.x * 3.1 + seed) * Math.cos(v.y * 2.7 + seed * 2) + .05 * Math.sin(v.z * 4.3 + v.x * 2 + seed * 3);
    v.multiplyScalar(n); pos.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  const nrm = geo.attributes.normal;   // blend toward round normals so the lumps shade softly instead of faceted
  for (let i = 0; i < nrm.count; i++) { v.fromBufferAttribute(pos, i).normalize(); const nx = nrm.getX(i) * .35 + v.x * .65, ny = nrm.getY(i) * .35 + v.y * .65, nz = nrm.getZ(i) * .35 + v.z * .65, l = Math.hypot(nx, ny, nz); nrm.setXYZ(i, nx / l, ny / l, nz / l); }
  return geo;
});
// hedges
[[-5.6, -2.5], [-5.6, -.5], [-5.6, 1.0], [5.6, -2.8], [5.6, -.2], [5.6, 2.6], [-3.5, -4.1], [-1.5, -4.1], [1.0, -4.1], [3.0, -4.1]].forEach(([x, z]) =>
  { const h = add(pick(puffGeos), smooth(pick(['#4f6a3a', '#5a7040', '#6a7036'])), x, -.15, z); h.scale.set(.44, .36, .44); h.rotation.y = rand(0, 6); });
// fence
const pickets = new THREE.InstancedMesh(new THREE.BoxGeometry(.09, .7, .05), M('#e9dcc4'), 300);
let pc = 0; const F = 12;
const fenceSide = (ax, az, bx, bz, gap) => {
  const L = Math.hypot(bx - ax, bz - az), n = Math.floor(L / .32), ry = Math.atan2(-(bz - az), bx - ax);
  for (let i = 0; i <= n; i++) {
    const x = ax + (bx - ax) * i / n, z = az + (bz - az) * i / n;
    if (gap && x > gap[0] && x < gap[1]) continue;
    dummy.position.set(x, -.07, z); dummy.rotation.set(0, ry, 0); dummy.updateMatrix(); pickets.setMatrixAt(pc++, dummy.matrix);
  }
  const rail = (x0, x1, z0, z1) => { const l = Math.hypot(x1 - x0, z1 - z0); [-.2, .1].forEach(y => { const r = B(l, .05, .03, M('#d9ccb4'), (x0 + x1) / 2, y, (z0 + z1) / 2); r.rotation.y = ry; }); };
  if (gap) { rail(ax, gap[0], az, bz); rail(gap[1], bx, az, bz); } else rail(ax, bx, az, bz);
};
fenceSide(-F, -F, F, -F); fenceSide(-F, F, F, F, [-1.8, -.2]); fenceSide(-F, -F, -F, F); fenceSide(F, -F, F, F);
pickets.count = pc; pickets.castShadow = true; scene.add(pickets);
// lamp post
C(.05, .07, 2.2, 8, '#2a2624', .5, .7, 7.7); B(.22, .3, .22, M('#ffe2a0', { emissive: '#ffcf6b', emissiveIntensity: 0 }), .5, 1.9, 7.7);
export const postMat = scene.children[scene.children.length - 1].material;
const postLight = pointLight('#ffcf8a', .5, 1.7, 7.7, 5);

const fallCols = ['#e07b39', '#c9512c', '#f0a640', '#a8432a', '#d9893a', '#b8862a'];
// garden bench + raked leaf pile
const bench = group(4.0, -.4, 7.2, Math.PI);   // faces out over the garden
B(1.3, .06, .45, wood, 0, .45, 0, bench); B(1.3, .4, .06, wood, 0, .72, .22, bench);
[[-.55, -.18], [.55, -.18], [-.55, .18], [.55, .18]].forEach(([x, z]) => B(.06, .45, .06, darkWood, x, .22, z, bench));
B(.4, .04, .4, wood, 1.0, .5, 0, bench); B(.05, .5, .05, darkWood, 1.0, .25, 0, bench);
C(.06, .05, .1, 8, '#efe2c4', 1.0, .57, .05, bench); C(.03, .03, .06, 8, '#b5543f', .9, .55, -.08, bench);
const leafPile = group(2.65, -.4, 7.45);
for (let i = 0; i < 40; i++) { const a = rand(0, 6.28), r = Math.sqrt(Math.random()) * .45; const l = Sph(.07, pick(fallCols.map(c => M(c))), Math.cos(a) * r, .05 + (.45 - r) * .35, Math.sin(a) * r, leafPile, 5); l.scale.set(1, .35, .8); }
let pileLevel = .15;
export const growPile = dt => { pileLevel = Math.min(1, pileLevel + dt / 60); };
export const resetPile = () => { pileLevel = .15; };
export const updatePile = () => leafPile.scale.set(1, pileLevel, 1).multiplyScalar(.5 + pileLevel * .5);
const patio = group(-4.2, -.4, 8.0);
C(1.25, 1.25, .04, 32, smooth('#b9ad9c'), 0, .02, 0, patio);
for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; C(.16, .17, .045, 7, smooth('#a39a8e'), Math.cos(a) * 1.05, .025, Math.sin(a) * 1.05, patio); }
C(.36, .36, .03, 24, smooth('#3a3a3a'), 0, .73, 0, patio); C(.025, .025, .7, 8, '#3a3a3a', 0, .37, 0, patio); C(.2, .22, .03, 16, '#3a3a3a', 0, .02, 0, patio);
B(.1, .14, .1, M('#2a2624'), .1, .82, -.08, patio); export const lantern = Sph(.035, M('#ffcf6b', { emissive: '#ffb347', emissiveIntensity: 0 }), .1, .82, -.08, patio, 8);
C(.05, .04, .07, 10, smooth('#efe2c4'), -.12, .78, .1, patio); C(.05, .04, .07, 10, smooth('#efe2c4'), .14, .78, .12, patio);
plant('small', -.9, -.75, 1.2, patio); plant('fern', .95, -.8, .9, patio);
[[-.55, Math.PI / 2], [.55, -Math.PI / 2]].forEach(([x, h]) => { const ch = chair(-4.2 + x, 8.0, h, '#3a3a3a'); ch.position.y = -.4; });
const patioLight = pointLight('#ffcf8a', -4.1, .6, 7.9, 1.5);

// trees (leaves fall from these)
export const trees = [];
const TREE_PALETTES = [['#a8432a', '#c4552f', '#d9693c'], ['#c9612c', '#dc7a3a', '#eb9550'], ['#d0852f', '#e29d3e', '#efb85a'], ['#c09a2e', '#d6b23e', '#e8c95a']];
function tree(x, z, s, kind = 'fall') {
  const g = group(x, -.4, z, rand(0, 6)), mats = [];
  const mm = c => { const m = M(c, { transparent: true, flatShading: false }); mats.push(m); return m; };
  if (kind === 'pine') {   // soft layered fir
    add(new THREE.CylinderGeometry(.1 * s, .17 * s, 1.2 * s, 10), mm('#4a3020'), 0, .6 * s, 0, g);
    const greens = [mm('#2f4a30'), mm('#3a5a38'), mm('#46683f')];
    [[1.35, 1.2, 1.2], [1.1, 1.1, 1.9], [.85, 1.0, 2.55], [.55, .9, 3.15]].forEach(([r, h, y], i) => {
      const c = add(new THREE.ConeGeometry(r * s, h * s, 20, 1), greens[Math.min(2, i)], 0, y * s, 0, g); c.rotation.y = i * .5;
    });
  } else {   // fluffy autumn tree: trunk, branches and a cloud of puffs (darker underneath, lighter on top)
    const bark = mm('#4a3020'), pal = pick(TREE_PALETTES), shades = pal.map(mm);
    add(new THREE.CylinderGeometry(.12 * s, .22 * s, 2.1 * s, 12), bark, 0, 1.05 * s, 0, g);
    [[-.7, .3], [.6, 2.4], [.5, 4.4]].forEach(([tilt, yaw]) => {
      const b = group(0, 1.6 * s, 0, yaw, g); const br = add(new THREE.CylinderGeometry(.04 * s, .08 * s, .9 * s, 6), bark, 0, .4 * s, 0, b); br.rotation.z = tilt; br.position.x = -Math.sin(tilt) * .4 * s;
    });
    const cy = 2.65, far = Math.hypot(x, z) > 14;
    add(puffGeos[0], shades[0], 0, cy * s, 0, g).scale.setScalar(.95 * s);   // dense core
    const n = far ? 9 : 15;
    for (let i = 0; i < n; i++) {
      const a = i * 2.399 + rand(-.3, .3), el = rand(-.5, 1.0), r = rand(.38, .56);
      const px = Math.cos(a) * Math.cos(el) * 1.0, py = Math.sin(el) * .8, pz = Math.sin(a) * Math.cos(el) * 1.0;
      const shade = shades[py > .35 ? 2 : py > -.1 ? 1 : 0];
      const p = add(puffGeos[i % 3], shade, px * s, (cy + py) * s, pz * s, g); p.scale.setScalar(r * s); p.rotation.set(rand(0, 6), rand(0, 6), 0);
    }
  }
  trees.push({ g, mats, x, z, top: 2.6 * s - .4, r: 1.0 * s, decid: kind !== 'pine', op: 1 });
}
[[-7.5, -7.5, 1.3], [-2.5, -7.8, 1.1, 'pine'], [3.5, -8.2, 1.4], [8.5, -6.5, 1.2], [-9.5, -1.5, 1.2], [9.2, 1.0, 1.3],
 [-8.6, 5.8, 1.1], [8.6, 6.8, 1.0, 'pine'], [-5.8, 9.4, 1.2], [5.5, 9.8, 1.3], [-10.4, -10, 1.1, 'pine'], [10.6, -10.4, 1.2]].forEach(a => tree(...a));
for (let i = 0; i < 26; i++) { const a = i / 26 * Math.PI * 2 + rand(-.1, .1), r = rand(16, 22); tree(Math.cos(a) * r, Math.sin(a) * r, rand(1.1, 1.6), Math.random() < .3 ? 'pine' : 'fall'); }
const leafTrees = trees.filter(t => t.decid && Math.hypot(t.x, t.z) < 14);

// fallen leaves on the ground (piles under trees + scattered)
const gl = new THREE.InstancedMesh(new THREE.PlaneGeometry(.14, .09), new THREE.MeshStandardMaterial({ side: THREE.DoubleSide }), 1400);
const tmpC = new THREE.Color();
for (let i = 0; i < 1400; i++) {
  let x, z;
  if (i < 900) { const t = pick(leafTrees), a = rand(0, 6.28), r = Math.abs(rand(0, 1) + rand(0, 1) - 1) * 2.6; x = t.x + Math.cos(a) * r; z = t.z + Math.sin(a) * r; }
  else { x = rand(-12, 12); z = rand(-12, 12); }
  if (Math.abs(x) < 5.4 && z > -3.9 && z < 4.7) { x += x < 0 ? -6 : 6; }
  dummy.position.set(x, -.395 + Math.random() * .01, z); dummy.rotation.set(-Math.PI / 2, 0, rand(0, 6)); dummy.updateMatrix();
  gl.setMatrixAt(i, dummy.matrix); gl.setColorAt(i, tmpC.set(pick(fallCols)));
}
gl.receiveShadow = true; scene.add(gl);

// falling leaves (spawn from tree canopies)
const LN = 180;
export const fl = new THREE.InstancedMesh(new THREE.PlaneGeometry(.15, .1), new THREE.MeshStandardMaterial({ side: THREE.DoubleSide }), LN);
export const fallLeaves = Array.from({ length: LN }, (_, i) => { fl.setColorAt(i, tmpC.set(pick(fallCols))); const l = {}; spawnLeaf(l, true); return l; });
export function spawnLeaf(l, anywhere) {
  const t = pick(leafTrees), a = rand(0, 6.28), r = rand(0, t.r * 1.1);
  l.x = t.x + Math.cos(a) * r; l.z = t.z + Math.sin(a) * r;
  l.y = anywhere ? rand(-.4, t.top) : t.top - rand(0, t.r * .6);
  l.vy = rand(.25, .5); l.ph = rand(0, 6); l.ground = 0; l.rz = rand(0, 6);
}
scene.add(fl);
