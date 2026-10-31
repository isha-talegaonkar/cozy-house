import * as THREE from 'three';
import { scene } from './scene.js';
import { lights, shades } from './house.js';
import { lantern, postMat } from './yard.js';
import { DAYS, dayIdx, hour, night } from './clock.js';
import { FALL, SEASONS, SPRING, SUMMER, WINTER, raining, season } from './season.js';

// ---------------------------------------------------------------- lighting + day cycle
const hemi = new THREE.HemisphereLight('#c8d0e8', '#5a4030', .8); scene.add(hemi);
const sun = new THREE.DirectionalLight('#ffd9a8', 2.4);
sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -.0005;
Object.assign(sun.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16, near: 1, far: 80 });
scene.add(sun, sun.target);
const KEYS = [
  [0, '#151a33', '#6f86c8', .2, .3, 1], [5.5, '#1c2340', '#6f86c8', .2, .32, 1], [7, '#f2b38a', '#ffb37a', 1.4, .6, .5],
  [10, '#b9cfd9', '#fff0d8', 2.6, .9, 0], [15.5, '#d9c9b0', '#ffd9a8', 2.4, .85, 0], [17.5, '#f0a070', '#ff9a5a', 1.8, .65, .6],
  [19, '#6a4a6a', '#ff7a5a', .6, .4, 1], [20.5, '#1f2140', '#6f86c8', .22, .3, 1], [24, '#151a33', '#6f86c8', .2, .3, 1]];
const cA = new THREE.Color(), cB = new THREE.Color();
const TINT = { [SPRING]: ['#e6ffee', .12], [SUMMER]: ['#fff2d4', .1], [FALL]: ['#ffffff', 0], [WINTER]: ['#dce8ff', .3] };   // sky tint per season
export let lampLevel = 0;
export function updateDay() {
  let i = 0; while (i < KEYS.length - 2 && KEYS[i + 1][0] <= hour) i++;
  const [h0, s0, u0, si0, hi0, l0] = KEYS[i], [h1, s1, u1, si1, hi1, l1] = KEYS[i + 1], k = (hour - h0) / (h1 - h0);
  const sky = cA.set(s0).lerp(cB.set(s1), k).lerp(cB.set(TINT[season][0]), TINT[season][1]);
  if (raining) sky.lerp(cB.set('#7d8794'), .45);   // grey, rainy sky (fog distance unchanged so the house stays crisp)
  scene.background = sky.clone(); scene.fog.color.copy(sky);
  sun.color.set(u0).lerp(cB.set(u1), k); sun.intensity = (si0 + (si1 - si0) * k) * (raining ? .3 : 1);
  hemi.intensity = (hi0 + (hi1 - hi0) * k) * (season === WINTER ? 1.25 : 1);   // snow bounces light around
  hemi.color.copy(sky).lerp(cB.set('#ffffff'), .5);
  lampLevel = l0 + (l1 - l0) * k; if (raining) lampLevel = Math.max(lampLevel, .45);   // lamps on early on rainy days
  let dir;
  if (hour > 6 && hour < 19.5) { const a = (hour - 6) / 13.5 * Math.PI; dir = new THREE.Vector3(Math.cos(a), Math.sin(a) * .9 + .12, .55); }
  else dir = new THREE.Vector3(-.4, .9, .5);
  sun.position.copy(dir.normalize().multiplyScalar(40));
  lights.forEach(l => l.intensity = l.userData.base * lampLevel);
  shades.forEach(m => m.emissiveIntensity = lampLevel * .9);
  postMat.emissiveIntensity = lampLevel * 1.5; lantern.material.emissiveIntensity = lampLevel * 2;
  const hh = Math.floor(hour), mm = Math.floor((hour % 1) * 60);
  document.getElementById('clock').textContent = `${(hh % 12) || 12}:${String(mm).padStart(2, '0')} ${hh < 12 ? 'am' : 'pm'} · ${DAYS[dayIdx % 7]} · ${SEASONS[season].name}${raining ? ' · 🌧️ rainy' : ''} · ${night() ? 'night' : hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'}`;
}
