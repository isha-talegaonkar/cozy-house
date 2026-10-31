import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { scene } from './scene.js';

// ---------------------------------------------------------------- helpers
export const rand = (a, b) => a + Math.random() * (b - a);
export const pick = arr => arr[Math.floor(Math.random() * arr.length)];
export const M = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: .85, flatShading: true, ...o });
export function add(geo, mat, x, y, z, parent = scene) {
  const m = new THREE.Mesh(geo, typeof mat === 'string' ? M(mat) : mat);
  m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; parent.add(m); return m;
}
export const B = (w, h, d, mat, x, y, z, parent) => add(new THREE.BoxGeometry(w, h, d), mat, x, y, z, parent);
export const C = (rt, rb, h, seg, mat, x, y, z, parent) => add(new THREE.CylinderGeometry(rt, rb, h, seg), mat, x, y, z, parent);
// soft fabric / rounded shapes with smooth shading
export const soft = (w, h, d, r, mat, x, y, z, parent) => add(new RoundedBoxGeometry(w, h, d, 4, r), mat, x, y, z, parent);
export const fabric = (c, o = {}) => M(c, { flatShading: false, roughness: 1, ...o });
export const smooth = c => M(c, { flatShading: false });
export const Sph = (r, mat, x, y, z, parent, seg = 10) => add(new THREE.SphereGeometry(r, seg, Math.max(6, seg - 2)), mat, x, y, z, parent);
export function group(x, y, z, ry = 0, parent = scene) { const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; parent.add(g); return g; }
export function canvasTex(w, h, draw, repeat) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
  t.userData.canvas = c; return t;
}
export const lerpAngle = (a, b, k) => { let d = ((b - a + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI; return a + d * k; };

// ---------------------------------------------------------------- materials
export const wood = M('#8a5634'), darkWood = M('#5e371f'), lightWood = M('#b98a5e');
export const stone = M('#8f857c'), wallMat = M('#ecdcc0'), frameMat = M('#5a3624');
export const terracotta = smooth('#c2683f'), creamPot = smooth('#efe2c8'), sagePot = smooth('#8fa07a');
export const glassMat = new THREE.MeshStandardMaterial({ color: '#cfe3ef', transparent: true, opacity: .22, roughness: .1, depthWrite: false, side: THREE.DoubleSide });

// fairy lights: cycle warm, white, blue, green and pink bulbs, each pulsing at its own pace
export const twinkle = (bulbs, T) => bulbs.forEach((b, i) =>
  b.material.color.setHSL([.12, 0, .55, .33, .95][i % 5], [.9, .9, .7, .7, .7][i % 5], .45 + .25 * Math.max(0, Math.sin(T * 2.2 + i * 1.7))));
