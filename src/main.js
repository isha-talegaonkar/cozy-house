import * as THREE from 'three';
import { camAz, camera, renderer, scene, updateCamera } from './scene.js';
import { rand } from './helpers.js';
import { candleFlames, coffeeCup, coffeeLight, coffeeSteam, cookieTray, drawFootball, drawGame, drawTV, feather, fireLight, flames, laptopMat, monitorMat, ovenGlow, steam, stoveGlow, tableCandle, tvLight, tvMat, walls, wand, wandStick } from './house.js';
import { dummy, fallLeaves, fireflies, fl, flies, spawnLeaf, trees, updatePile } from './yard.js';
import { CAT_ICON, CAT_LABEL, ROOM_NAME, SPOTS, advanceClock, cats, hour, people, roomOf, simT, updateBubble, updateCat, updateHouse, updatePerson, updatePlay, updateTV } from './sim.js';
import { lampLevel, updateDay } from './daycycle.js';
import { fireLit, season } from './season.js';
import './plants.js';
import './characters.js';
import './ui.js';
import './audio.js';

// ---------------------------------------------------------------- main loop
const clock = new THREE.Clock();
let lastStatus = '';
function frame() {
  const dt = Math.min(.05, clock.getDelta()), T = clock.elapsedTime, sdt = advanceClock(dt);
  updatePile();

  updateCamera(dt);
  walls.forEach(w => { const low = w.n[0] * Math.sin(camAz) + w.n[1] * Math.cos(camAz) > .1; w.tall.visible = !low; w.low.visible = low; });
  trees.forEach(t => {
    const front = t.x * Math.sin(camAz) + t.z * Math.cos(camAz), d = Math.hypot(t.x, t.z);
    t.op += ((front > 3 && d < 14 ? .18 : 1) - t.op) * Math.min(1, dt * 4);
    t.mats.forEach(m => { m.opacity = t.op; });   // keep depth writes so a faded tree reads as one shape
  });

  updateDay();
  const flick = 1 + Math.sin(T * 11) * .1 + Math.sin(T * 5.3) * .08 + (Math.random() - .5) * .06;
  const lit = fireLit(hour);   // no fire on summer days
  fireLight.intensity = lit ? (4 + lampLevel * 6) * flick : 0;
  flames.forEach(f => { f.visible = lit; const s = 1 + Math.sin(T * 10 + f.userData.k) * .18; f.scale.set(1, s, 1); f.position.y = .1 + f.userData.h * s / 2; });
  candleFlames.forEach((c, i) => c.scale.setScalar(1 + Math.sin(T * 12 + i) * .15)); tableCandle.scale.setScalar(1 + Math.sin(T * 13) * .15);
  const using = k => people.some(p => p.mode === 'act' && p.spot === k);
  const brewing = people.some(p => p.mode === 'act' && p.spot === 'coffee' && p.timer > p.dur * .55);
  coffeeLight.material.emissiveIntensity = brewing ? 2 : 0; coffeeCup.visible = brewing;
  coffeeSteam.forEach(s => { s.visible = brewing; const pr = (T * .5 + s.userData.o) % 1; s.position.set(2.8 + Math.sin(T * 2 + s.userData.o * 7) * .02, 1.07 + pr * .3, -3.1); s.material.opacity = .5 * (1 - pr); });
  const tvOn = ['tv1', 'tv2', 'games', 'football'].some(using);
  tvMat.color.set(tvOn ? '#ffffff' : '#111111'); tvLight.intensity = tvOn ? .9 + Math.sin(T * 2.3) * .25 : 0;
  if (tvOn) (using('games') ? drawGame : using('football') ? drawFootball : drawTV)(T);
  const baking = people.some(p => p.spot === 'bake' && p.mode === 'act');
  if (baking) cookieTray.userData.ready = simT + 600;   // cookies cool on the counter for a while afterwards
  cookieTray.visible = !baking && simT < (cookieTray.userData.ready || 0);
  laptopMat.color.set(using('laptop') ? '#ffffff' : '#222222'); monitorMat.color.set(using('computer') ? '#ffffff' : '#222222');
  const cooking = people.some(p => p.spot === 'cook' && p.mode === 'act');
  stoveGlow.intensity = cooking ? 1.2 : 0; ovenGlow.material.emissiveIntensity = cooking || using('bake') ? .8 : 0;
  steam.forEach(s => { s.visible = cooking; const pr = (T * .3 + s.userData.o) % 1; s.position.set(2.0 + Math.sin(T + s.userData.o * 9) * .08, 1.3 + pr, -3.15); s.scale.setScalar(1 + pr * 2); s.material.opacity = .45 * (1 - pr); });

  if (fl.visible) fallLeaves.forEach((l, i) => {
    if (!l.ground) {
      l.y -= l.vy * dt; l.x += (Math.sin(T * 1.3 + l.ph) * .3 + .12) * dt; l.z += Math.cos(T * .9 + l.ph) * .15 * dt;
      dummy.rotation.set(T * 1.7 + l.ph, T + l.ph, T * .6);
      if (l.y <= -.39) { l.y = -.39; l.ground = rand(10, 22); }
    } else {
      l.ground -= dt; dummy.rotation.set(-Math.PI / 2, 0, l.rz);
      if (l.ground < 2) l.y -= dt * .02;
      if (l.ground <= 0) spawnLeaf(l, false);
    }
    dummy.position.set(l.x, l.y, l.z); dummy.updateMatrix(); fl.setMatrixAt(i, dummy.matrix);
  });
  fl.instanceMatrix.needsUpdate = true;
  flies.visible = season === 'summer' && lampLevel > .6;   // fireflies on summer nights
  if (flies.visible) {
    fireflies.forEach((f, i) => {
      dummy.position.set(f.x + Math.sin(T * .4 + f.ph) * .6, f.y + Math.sin(T * .9 + f.ph * 2) * .25, f.z + Math.cos(T * .35 + f.ph) * .6);
      dummy.rotation.set(0, 0, 0); dummy.scale.setScalar(.5 + .5 * Math.max(0, Math.sin(T * 2 + f.ph * 3))); dummy.updateMatrix(); flies.setMatrixAt(i, dummy.matrix);
    });
    dummy.scale.setScalar(1); flies.instanceMatrix.needsUpdate = true;
  }

  updateHouse(); updateTV();
  wand.active = false; wandStick.visible = feather.visible = false;
  people.forEach(p => updatePerson(p, sdt));
  updatePlay(sdt);
  cats.forEach(c => updateCat(c, sdt));
  people.forEach(p => updateBubble(p, false, sdt)); cats.forEach(c => updateBubble(c, true, sdt));

  const st = [
    ...people.map(p => `${p.mode === 'act' ? SPOTS[p.spot].icon + ' ' + SPOTS[p.spot].label + (p.lapCat && p.lapCat.act === 'lap' && p.lapCat.mode === 'act' ? ` · ${p.lapCat.name} on lap` : '') : '🚶 heading to the ' + ROOM_NAME[roomOf(SPOTS[p.target].x, SPOTS[p.target].z)]}`),
    ...cats.map(c => `${c.mode === 'playing' || c.mode === 'playWait' || c.pendingAct === 'playWait' && c.mode === 'walk' ? '🧶 playing with ' + cats.find(o => o !== c).name
      : c.mode === 'act' ? (CAT_ICON[c.act] || '🐾') + ' ' + (c.act === 'lap' ? `curled up on ${c.lapOf ? c.lapOf.name + "'s" : 'a'} lap` : CAT_LABEL[c.act]) : '🐾 trotting around'}`)];
  const left = people.map(p => p.cmd ? `${Math.max(1, Math.ceil(p.cmd.until - simT))} min left` : '');
  const key = st.join('|') + left.join('|');
  if (key !== lastStatus) {
    lastStatus = key;
    people.forEach((p, i) => {
      document.getElementById(`st${i}`).textContent = st[i]; document.getElementById(`left${i}`).textContent = left[i];
      document.getElementById(`bar${i}`).style.width = p.cmd ? `${100 * Math.max(0, p.cmd.until - simT) / p.cmd.dur}%` : '0%';
    });
    cats.forEach((c, i) => document.getElementById(`cst${i}`).textContent = st[people.length + i]);
    document.getElementById('mini').textContent = [...people, ...cats].map((a, i) => `${a.name} ${[...st[i]][0] || ''}`).join(' · ');
  }

  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
frame();
