import * as THREE from 'three';
import { keys, scene } from './scene.js';
import { canvasTex, lerpAngle, pick, rand } from './helpers.js';
import { UP, bowls, feather, paintStroke, popcorn, tmpV, wand, wandStick, yarn } from './house.js';
import { growPile, resetPile } from './yard.js';
import { makeCat, makePerson } from './characters.js';
import { GARDEN, fireLit, onSeason, season } from './season.js';

// ---------------------------------------------------------------- navigation
const ORDER = ['B', 'L', 'S', 'K'];
const DOORS = { 'B-L': { B: [-.8, -.5], L: [-.8, .5] }, 'L-S': { L: [-.5, 2.8], S: [.5, 2.8] }, 'S-K': { S: [3.0, -.1], K: [3.0, -1.1] }, 'L-Y': { L: [-1.0, 3.8], Y: [-1.0, 5.2] } };
export const roomOf = (x, z) => Math.abs(x) > 5 || z > 4.3 || z < -3.5 ? 'Y' : x < 0 ? (z < 0 ? 'B' : 'L') : (z < -.6 ? 'K' : 'S');
const ADJ = { B: ['L'], L: ['B', 'S', 'Y'], S: ['L', 'K'], K: ['S'], Y: ['L'] };
function roomRoute(a, b) {   // breadth-first search over rooms
  const prev = { [a]: null }, q = [a];
  while (q.length) { const r = q.shift(); if (r === b) break; for (const n of ADJ[r]) if (!(n in prev)) { prev[n] = r; q.push(n); } }
  const route = []; for (let r = b; r; r = prev[r]) route.unshift(r); return route;
}
function buildPath(a, tx, tz, via = [], fromVia = []) {
  const r0 = roomOf(a.x, a.z), r1 = roomOf(tx, tz), pts = [];
  if (r0 !== r1) {
    pts.push(...[...fromVia].reverse());
    const route = roomRoute(r0, r1);
    for (let i = 0; i < route.length - 1; i++) { const p = route[i], q = route[i + 1], d = DOORS[`${p}-${q}`] || DOORS[`${q}-${p}`]; pts.push(d[p], d[q]); }
    pts.push(...via);
  }
  pts.push([tx, tz]); return pts;
}
function stepPath(a, dt, speed) {
  const [tx, tz] = a.path[0], dx = tx - a.x, dz = tz - a.z, d = Math.hypot(dx, dz);
  if (d < .04) { a.path.shift(); return a.path.length === 0; }
  const s = Math.min(d, speed * dt); a.x += dx / d * s; a.z += dz / d * s;
  a.heading = lerpAngle(a.heading, Math.atan2(dx, dz), Math.min(1, dt * 8));
  a.walkPhase += dt * speed * 11;
  return false;
}

// ---------------------------------------------------------------- activities
const LIV = [[-1.3, .6], [-2.9, .8]];
export const SPOTS = {
  cook:   { x: 2.0, z: -2.55, h: Math.PI, pose: 'stand', anim: 'stir', icon: '🍲', label: 'cooking soup' },
  coffee: { x: 2.8, z: -2.55, h: Math.PI, pose: 'stand', anim: 'coffee', icon: '☕', label: 'making morning coffee' },
  prep:   { x: 1.05, z: -2.55, h: Math.PI, pose: 'stand', anim: 'chop', icon: '🥕', label: 'chopping veggies', share: ['bake'] },
  bake:   { x: 1.05, z: -2.55, h: Math.PI, pose: 'stand', anim: 'mix', icon: '🧁', label: 'baking cookies', share: ['prep'] },
  wash:   { x: 3.6, z: -2.55, h: Math.PI, pose: 'stand', anim: 'wash', icon: '🫧', label: 'washing up' },
  eat1:   { x: .95, z: -1.65, h: Math.PI / 2, pose: 'sit', anim: 'eat', icon: '🥣', label: 'eating together', via: [[.95, -1.1]] },
  eat2:   { x: 2.25, z: -1.65, h: -Math.PI / 2, pose: 'sit', anim: 'eat', icon: '🥣', label: 'eating together' },
  paint:  { x: 1.75, z: 1.8, h: -Math.PI / 2, pose: 'stand', anim: 'brush', icon: '🎨', label: 'painting' },
  crochet: { x: .53, z: -.09, h: Math.PI / 4, pose: 'sit', anim: 'crochet', icon: '🧶', label: 'crocheting a blanket' },
  draw:   { x: 3.95, z: 2.75, h: Math.PI / 2, pose: 'sit', anim: 'draw', icon: '✏️', label: 'sketching', share: ['laptop'] },
  laptop: { x: 3.95, z: 2.75, h: Math.PI / 2, pose: 'sit', anim: 'type', icon: '💻', label: 'on the laptop', share: ['draw'] },
  computer: { x: 3.95, z: 1.1, h: Math.PI / 2, pose: 'sit', anim: 'type', icon: '🖥️', label: 'working on the computer' },
  playcats: { x: -1.6, z: -.65, h: -Math.PI / 2, pose: 'floor', anim: 'wand', icon: '🪶', label: 'playing with the cats' },
  tv1:    { x: -2.2, z: 1.35, h: -Math.PI / 2, pose: 'sit', anim: 'watch', icon: '📺', label: 'watching TV', via: LIV, share: ['knit', 'games'] },
  tv2:    { x: -2.2, z: 1.95, h: -Math.PI / 2, pose: 'sit', anim: 'watch', icon: '📺', label: 'watching TV', via: LIV, share: ['tea', 'football', 'sofa'] },
  games:  { x: -2.2, z: 1.35, h: -Math.PI / 2, pose: 'sit', anim: 'gamepad', icon: '🎮', label: 'playing video games', via: LIV, share: ['knit', 'tv1'] },
  football: { x: -2.2, z: 1.95, h: -Math.PI / 2, pose: 'sit', anim: 'football', icon: '⚽', label: 'watching football', via: LIV, share: ['tea', 'tv2', 'sofa'] },
  read:   { x: -3.82, z: .6, h: -.6, pose: 'sit', anim: 'read', icon: '📖', label: 'reading by the fire', via: [[-1.3, .6]] },
  knit:   { x: -2.2, z: 1.35, h: -Math.PI / 2, pose: 'sit', anim: 'knit', icon: '🧶', label: 'knitting', via: LIV, share: ['tv1', 'games'] },
  tea:    { x: -2.2, z: 1.95, h: -Math.PI / 2, pose: 'sit', anim: 'tea', icon: '☕', label: 'sipping tea', via: LIV, share: ['tv2', 'football', 'sofa'] },
  warm:   { x: -3.75, z: 1.75, h: -Math.PI / 2, pose: 'stand', anim: 'warm', icon: '🔥', label: 'warming up by the fire', via: LIV },
  patio1: { x: -4.75, z: 8.0, h: Math.PI / 2, pose: 'sit', anim: 'tea', icon: '☕', label: 'tea on the patio' },
  patio2: { x: -3.65, z: 8.0, h: -Math.PI / 2, pose: 'sit', anim: 'tea', icon: '☕', label: 'tea on the patio' },
  rake:   { x: 2.2, z: 7.1, h: .9, pose: 'stand', anim: 'rake', icon: '🍂', label: 'raking leaves in the garden' },
  bench1: { x: 4.3, z: 7.2, h: 0, pose: 'sit', anim: 'tea', icon: '🍵', label: 'enjoying the garden' },
  bench2: { x: 3.7, z: 7.2, h: 0, pose: 'sit', anim: 'tea', icon: '🍵', label: 'enjoying the garden' },
  mums:   { x: -3.7, z: 5.35, h: Math.PI, pose: 'stand', anim: 'water', icon: '🌼', label: 'watering the mums', via: [[-2.0, 5.7]] },
  stroll1: { x: 0, z: 6.8, h: Math.PI / 2, pose: 'stand', anim: 'stroll', icon: '🚶', label: 'going for a walk', loop: { cx: 0, cz: .4, rx: 7.5, rz: 6.4, speed: .8, laps: 1 } },
  stroll2: { x: 0, z: 7.2, h: Math.PI / 2, pose: 'stand', anim: 'stroll', icon: '🚶', label: 'going for a walk', loop: { cx: 0, cz: .4, rx: 7.9, rz: 6.8, speed: .8, laps: 1 } },
  jog:    { x: 0, z: 6.5, h: Math.PI / 2, pose: 'stand', anim: 'jog', icon: '🏃', label: 'going for a run', loop: { cx: 0, cz: .4, rx: 7.3, rz: 6.1, speed: 2.2, laps: 2 } },
  sweep:  { x: 1.6, z: -1.05, h: Math.PI / 2, pose: 'stand', anim: 'sweep', icon: '🧹', label: 'sweeping the kitchen', loop: { cx: 1.6, cz: -1.65, rx: 1.1, rz: .6, speed: .35, laps: 2 } },
  vacuum: { x: -3.35, z: 1.9, h: Math.PI / 2, pose: 'stand', anim: 'vacuum', icon: '✨', label: 'vacuuming the living room', via: LIV, loop: { cx: -3.35, cz: 1.45, rx: .45, rz: .45, speed: .25, laps: 3 } },
  dust:   { x: -4.25, z: 2.95, h: -Math.PI / 2, pose: 'stand', anim: 'dust', icon: '🪶', label: 'dusting the bookshelf', via: LIV },
  makebed: { x: -2.5, z: -.95, h: Math.PI, pose: 'stand', anim: 'makebed', icon: '🛏️', label: 'making the bed' },
  plants: { x: -.75, z: 1.5, h: Math.PI / 2, pose: 'stand', anim: 'water', icon: '🪴', label: 'watering the plants' },
  nook:   { x: 2.3, z: 4.0, h: Math.PI, pose: 'sit', anim: 'read', icon: '📖', label: 'curled up in the reading nook' },
  browse: { x: 2.1, z: .3, h: Math.PI, pose: 'stand', anim: 'browse', icon: '📚', label: 'browsing the bookshelf' },
  sleep1: { x: -2.95, z: -1.3, h: 0, pose: 'lie', anim: 'sleep', icon: '💤', label: 'sleeping' },
  sleep2: { x: -2.05, z: -1.3, h: 0, pose: 'lie', anim: 'sleep', icon: '💤', label: 'sleeping' },
};
const CAT_SPOTS = {
  catbed:  { x: -3.4, z: 3.75, y: .1, h: .8, act: 'nap', via: LIV },
  bedfoot: { x: -2.5, z: -1.5, y: .95, h: Math.PI / 2, act: 'nap' },
  sofa:    { x: -2.95, z: 2.3, y: .44, h: -Math.PI / 2, act: 'nap', via: LIV },   // curled up on the sofa's return
  nookcat: { x: 2.9, z: 4.0, y: .5, h: -Math.PI / 2, act: 'nap' },
  bowl1:   { x: 4.25, z: -1.2, y: 0, h: Math.PI / 2, act: 'eat' },
  bowl2:   { x: 4.25, z: -1.65, y: 0, h: Math.PI / 2, act: 'eat' },
  beg:     { x: 2.55, z: -2.3, y: 0, h: -Math.PI / 2, act: 'beg' },
};
const OPEN = { B: [[-1.0, -1.0], [-3.5, -.6], [-3.6, -1.0]], L: [[-1.2, 1.2], [-3.0, 1.2], [-1.2, 3.0], [-2.5, 3.3], [-1.6, 3.8]],
               S: [[2.5, 1.0], [3.0, 2.2], [2.0, 2.6], [3.2, .8], [2.0, .6]], K: [[3.4, -1.4], [.9, -2.5], [2.8, -2.2], [.5, -1.1]] };
const PLAY = { x: 2.5, z: 1.85 }, PLAY_SPOTS = [PLAY, { x: -1.15, z: 2.0 }];
const LAP = { crochet: .56, knit: .56, tea: .56, tv1: .56, tv2: .56, games: .56, football: .56, read: .56, nook: .64 };   // lap height per seat
const WAND_AT = { x: -2.95, z: -.65 };
export const ROOM_NAME = { B: 'bedroom', L: 'living room', S: 'studio', K: 'kitchen', Y: 'garden' };

const ICON = {};
function bubbleMat(emoji) {
  if (!ICON[emoji]) {
    const t = canvasTex(128, 128, g => {
      g.fillStyle = 'rgba(255,248,234,.95)'; g.beginPath(); g.roundRect(10, 8, 108, 92, 34); g.fill();
      g.beginPath(); g.arc(52, 110, 9, 0, 7); g.fill(); g.beginPath(); g.arc(40, 123, 5, 0, 7); g.fill();
      g.font = '58px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(emoji, 64, 58);
    });
    ICON[emoji] = new THREE.SpriteMaterial({ map: t, depthTest: false, transparent: true });
  }
  return ICON[emoji];
}
function bubbleSprite() { const s = new THREE.Sprite(bubbleMat('💤')); s.scale.set(.55, .55, 1); s.renderOrder = 10; s.visible = false; scene.add(s); return s; }

const Q = new URLSearchParams(location.search);
export let simT = 0, hour = +(Q.get('hour') ?? 6.97), speed = +(Q.get('speed') ?? 1);
export function advanceClock(dt) {   // 1 in-game minute = 1 second at 1x; returns sim seconds elapsed
  const sdt = dt * speed; simT += sdt; hour += sdt / 60;
  if (hour >= 24) { hour -= 24; newDay(); }
  return sdt;
}
export function cycleSpeed() { const steps = [1, 2, 5, 20]; speed = steps[(steps.indexOf(speed) + 1) % steps.length]; return speed; }
export const night = () => hour >= 22 || hour < 6.5;
const MIN_ACT = 20;   // in-game minutes an activity runs before routines (meals, movie, walk invites) may interrupt it
const settled = p => simT - (p.startedAt ?? -1e9) >= MIN_ACT;
const cut = (p, t) => { p.timer = Math.min(p.timer, Math.max(t, (p.startedAt ?? -1e9) + MIN_ACT - simT)); };
const bedtime = p => hour >= p.bed || hour < p.wake;   // each person has their own bed/wake time
// household routine: someone cooks at each mealtime, then both sit down and eat together
const MEALS = [[7.75, 'breakfast', '🥞'], [12.5, 'lunch', '🥪'], [18.5, 'dinner', '🍲']];
const house = { meal: null, lastMeal: null };
function startTV() { house.tv = { until: rand(21.2, 21.6) }; SPOTS.tv1.label = SPOTS.tv2.label = 'movie night together'; SPOTS.tv1.icon = SPOTS.tv2.icon = '🍿'; popcorn.visible = true; }
function endTV() { house.tv = null; SPOTS.tv1.label = SPOTS.tv2.label = 'watching TV'; SPOTS.tv1.icon = SPOTS.tv2.icon = '📺'; popcorn.visible = false; }
const TEA = { winter: ['sipping hot cocoa', '🍫'] };
onSeason(s => { const [label, icon] = TEA[s] || ['sipping tea', '☕']; Object.assign(SPOTS.tea, { label, icon }); });
const FLOWER_JOB = { spring: 'watering the tulips', summer: 'watering the sunflowers', fall: 'watering the mums', winter: 'checking on the garden' };
onSeason(s => { SPOTS.mums.label = FLOWER_JOB[s]; });
function updateBenchMood() {
  const [label, icon] = hour < 17 ? ['enjoying the garden', '🍵'] : hour < 19.3 ? ['watching the sunset', '🌅'] : ['stargazing in the garden', '✨'];
  Object.assign(SPOTS.bench1, { label, icon }); Object.assign(SPOTS.bench2, { label, icon });
}
export function updateTV() {   // most evenings after dinner they curl up on the sofa for a movie
  updateBenchMood();
  if (hour < 19 || hour >= 23) { house.tvDecided = false; if (house.tv) endTV(); return; }
  if (!house.tvDecided && hour >= 19.8) { house.tvDecided = true; if (Q.has('movie') || Math.random() < (weekend() ? .9 : .6)) startTV(); }
  if (house.tv && hour >= house.tv.until) endTV();
}
export function updateHouse() {
  const m = MEALS.find(([h]) => hour >= h && hour < h + .5);
  if (!m) { house.lastMeal = null; return; }
  if (house.meal || house.lastMeal === m[1]) return;
  house.lastMeal = m[1];
  const awake = people.filter(p => !bedtime(p));
  if (!awake.length) return;
  const cook = pick(awake), others = awake.filter(p => p !== cook);
  const helper = others.length && (Q.has('together') || Math.random() < .5) ? others[0] : null;   // sometimes they cook together
  house.meal = { name: m[1], stage: 'cook', cook, helper, ate: new Set() };
  Object.assign(SPOTS.cook, { label: helper ? `cooking ${m[1]} together` : `cooking ${m[1]}`, icon: m[2] });
  SPOTS.prep.label = `chopping veggies for ${m[1]}`;
  SPOTS.eat1.label = SPOTS.eat2.label = `having ${m[1]} together`;
}

export const people = [
  { name: 'June', rig: makePerson({ skin: '#c98e69', hair: '#2b1a12', style: 'long', bigSmile: true, oversized: true, collar: 'turtle', sweater: '#d9a0a0', rib: '#c48a8a', pants: '#26242a', shoes: '#f6eee2' }), x: 0, z: 0 },
  { name: 'Theo', rig: makePerson({ skin: '#b98060', hair: '#1e1510', style: 'short', glasses: true, collar: 'crew', sweater: '#2f6a6a', rib: '#285a5a', band: ['#efe2c8', '#c9763f'], pants: '#4a4a52', shoes: '#8a6a4a' }), x: 0, z: 0 },
];
export const cats = [
  { name: 'Biscuit', rig: makeCat('#e0913f', '#f7e8d4'), x: -1.2, z: 1.2 },
  { name: 'Mochi', rig: makeCat('#8d8a86', '#f2efe9'), x: -3.4, z: 2.95 },
];
export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
export let dayIdx = +(Q.get('day') ?? 4);   // start on a Friday
const weekend = () => dayIdx % 7 >= 5;
const FAVS = ['paint', 'crochet', 'draw', 'laptop', 'computer', 'read', 'nook', 'knit', 'tea', 'playcats', 'rake', 'bench1', 'mums', 'browse', 'bake', 'games', 'football'];
// things each person never chooses (and that don't appear in their menu)
const DISLIKES = { June: ['games', 'football'], Theo: ['paint', 'crochet', 'draw', 'knit', 'bake'] };
export const likes = (p, k) => !(DISLIKES[p.name] || []).includes(k);
function mood(p) {   // each day everyone fancies different things
  const m = {}; for (const k in SPOTS) m[k] = rand(.4, 1.6);
  m.fav = pick(FAVS.filter(k => likes(p, k))); m[m.fav] *= 3.5; m.bench2 = m.bench1; m.patio2 = m.patio1; return m;
}
function planDay(p, i) {
  Object.assign(p, { mood: mood(p), recent: [], wake: 6.2 + i * .4 + rand(0, .4) + (weekend() ? 1.2 : 0), bed: 21.6 + i * .4 + rand(0, .4) + (weekend() ? .6 : 0) });
}
function newDay() { dayIdx++; house.gardenDay = Math.random() < .5; house.cleanDay = dayIdx % 7 === 5 || Math.random() < .2; resetPile(); people.forEach(planDay); }
house.gardenDay = Math.random() < .5; house.cleanDay = Q.has('clean') || dayIdx % 7 === 5 || Math.random() < .2;
people.forEach(planDay);
if (!Q.has('hour')) people.forEach((p, i) => p.wake = 7.0 + i * .2);   // first visit: watch them wake up at 7
for (const a of [...people, ...cats]) Object.assign(a, { heading: 0, y: 0, path: [], mode: 'idle', timer: 0, spot: null, walkPhase: 0, ph: rand(0, 6), bubble: bubbleSprite(), bubbleT: 0, last: null });

const taken = {};
const free = (k, a) => (!taken[k] || taken[k] === a) && !((SPOTS[k] && SPOTS[k].share) || []).some(o => taken[o] && taken[o] !== a);
function release(a) { for (const k in taken) if (taken[k] === a) delete taken[k]; }
function goTo(a, key, table, speedMul = 1) {
  const sp = table[key], from = a.spot && table[a.spot] ? table[a.spot].via : (a.spot && SPOTS[a.spot] ? SPOTS[a.spot].via : []);
  release(a); taken[key] = a;
  a.path = buildPath(a, sp.x, sp.z, sp.via || [], from || []);
  a.target = key; a.mode = 'walk'; a.spot = null;
}
function weighted(w) { const keys = Object.keys(w).filter(k => w[k] > 0); let r = Math.random() * keys.reduce((s, k) => s + w[k], 0); for (const k of keys) if ((r -= w[k]) <= 0) return k; return keys[0]; }

function choosePerson(p) {
  if (p.cmd) { if (simT < p.cmd.until) return goTo(p, p.cmd.key, SPOTS); endCommand(p); }   // the player asked for this
  if (Q.has('do') && p === people[0] && !p.didForce) { p.didForce = true; return goTo(p, Q.get('do'), SPOTS); }   // testing aid: ?do=<activity>
  if (bedtime(p)) { p.hadCoffee = false; const k = ['sleep1', 'sleep2'].find(k => free(k, p)); if (p.spot !== k) return goTo(p, k, SPOTS); p.timer = 5; return; }
  const hm = house.meal;
  if (hm && hm.stage === 'cook' && p === hm.cook) return goTo(p, 'cook', SPOTS);
  if (hm && hm.stage === 'cook' && p === hm.helper) return goTo(p, 'prep', SPOTS);
  if (hm && hm.stage === 'eat' && !hm.ate.has(p)) { const k = ['eat1', 'eat2'].find(k => free(k, p)); if (k) return goTo(p, k, SPOTS); }
  if (house.tv && !hm) { const k = ['tv1', 'tv2'].find(k => free(k, p)); if (k) return goTo(p, k, SPOTS); }
  if (house.walkInvite === p) { house.walkInvite = null; return goTo(p, 'stroll2', SPOTS); }
  if (hour < 11 && !p.hadCoffee && free('coffee', p)) return goTo(p, 'coffee', SPOTS);   // one coffee every morning
  const evening = hour > 17 || hour < 9;
  const w = { paint: 3, crochet: 3, draw: 2.5, laptop: 2, computer: 2.5, bake: weekend() ? 3 : 2, games: 3, football: weekend() && hour > 12 ? 4 : 1.2, read: 2, nook: 3, browse: 1, knit: 2, tea: 2, plants: 1.2, warm: fireLit(hour) ? (evening ? 2 : .5) * (season === 'winter' ? 1.8 : 1) : 0, wash: .2,
              playcats: cats.some(wandReady) ? 2.5 : 0, tv1: .5 };
  if (season === 'winter') { w.tea *= 1.5; w.read *= 1.4; w.nook *= 1.3; w.tv1 *= 1.6; w.bake *= 1.3; }        // cosy indoor days
  const g = (house.gardenDay ? 2 : 1) * (weekend() ? 1.5 : 1) * GARDEN[season], partnerOnBench = people.some(q => q !== p && q.mode === 'act' && /^bench/.test(q.spot));
  if (hour >= 9 && hour < 17.5) Object.assign(w, { rake: season === 'fall' ? 1.2 * g : 0, mums: season === 'winter' ? 0 : .8 * g, stroll1: 1.2 * g });            // garden time on nice afternoons
  if (hour >= 9 && hour < 21) w.bench1 = w.bench2 = (partnerOnBench ? 6 : hour >= 17.5 ? 1.8 : 1) * g;          // incl. sunset + stargazing
  const partnerOnPatio = people.some(q => q !== p && q.mode === 'act' && /^patio/.test(q.spot));
  if (hour >= 8 && hour < 20.5) w.patio1 = w.patio2 = (partnerOnPatio ? 6 : 1) * g;
  if ((hour >= 7 && hour < 10) || (hour >= 16 && hour < 18)) w.jog = (hour < 10 ? 1.6 : .8) * (season === 'winter' ? .4 : 1);                    // morning / late-afternoon runs
  const c = house.cleanDay ? 4 : .35;                                                                            // cleaning, mostly on cleaning days
  Object.assign(w, { sweep: c, vacuum: c, dust: c * .8, makebed: hour < 12 ? 1 + c : 0 });
  for (const k in w) w[k] *= (likes(p, k) ? 1 : 0) * (p.mood[k] ?? 1) * (p.recent.includes(k) ? .25 : 1);
  if (p.last === 'eat1' || p.last === 'eat2') w.wash = 6;
  if (p.last) w[p.last] = 0;
  for (const k in w) if (!free(k, p)) w[k] = 0;
  goTo(p, weighted(w), SPOTS);
}
function startPersonAct(p) {
  const sp = SPOTS[p.target]; p.spot = p.target; p.last = p.target; p.mode = 'act';
  p.x = sp.x; p.z = sp.z; p.heading = sp.h; p.timer = sp.pose === 'lie' ? 9e9 : p.target === 'cook' || p.target === 'prep' || sp.anim === 'eat' ? rand(25, 35) : p.target === 'coffee' ? rand(18, 24) : rand(45, 75); p.callT = 0; p.bubbleT = 0; p.dur = p.timer; p.startedAt = simT; if (p.target === 'coffee') p.hadCoffee = true;
  p.recent = [p.target, ...(p.recent || [])].slice(0, 4);
  if (p.target === 'bake') SPOTS.bake.label = pick(['baking cookies', 'baking banana bread', 'baking an apple pie', 'baking cinnamon rolls']);
  if (sp.loop) { p.loopA = Math.PI / 2; p.timer = p.dur = sp.loop.laps * 2 * Math.PI * (sp.loop.rx + sp.loop.rz) / 2 / sp.loop.speed; }
  if (p.target === 'stroll1' && p.cmd && p.cmd.together === 'walk') { const q = people.find(o => o !== p); p.waitFor = q; p.waitT = 60; }
  else if (p.target === 'stroll1' && !p.cmd) {   // sometimes ask the other one to come along
    SPOTS.stroll1.label = SPOTS.stroll2.label = 'going for a walk';
    const q = people.find(o => o !== p);
    if (Math.random() < .55 && !bedtime(q) && !house.meal && !house.tv && q.mode === 'act' && SPOTS[q.spot].pose !== 'lie' && settled(q)) {
      house.walkInvite = q; cut(q, 1.5); p.waitFor = q; p.waitT = 40;
    }
  }
  if (p.target === 'eat1' || p.target === 'eat2') bowls[p.target === 'eat1' ? 0 : 1].visible = true;
  if (p.target === 'playcats') cats.filter(wandReady).forEach((c, i) => { if (i === 0 || Math.random() < .65) joinWand(c, i); });
}

let play = null;
const walkingTo = (c, ...acts) => c.mode === 'walk' && acts.includes(c.pendingAct);
const catBusy = c => c.mode === 'playing' || c.mode === 'playWait' || walkingTo(c, 'playWait', 'wand', 'lap') || (c.mode === 'act' && ['nap', 'lap', 'wand', 'eat'].includes(c.act));
const wandReady = c => !(c.mode === 'playing' || c.mode === 'playWait' || walkingTo(c, 'playWait', 'wand', 'lap') || (c.mode === 'act' && ['lap', 'wand'].includes(c.act))) && !night();
function leaveCatSpot(c) {
  if (c.lapOf) { if (c.lapOf.lapCat === c) c.lapOf.lapCat = null; c.lapOf = null; }
  const from = c.spot && CAT_SPOTS[c.spot] ? CAT_SPOTS[c.spot].via || [] : [];
  release(c); c.spot = null; c.target = null; return from;
}
function joinWand(c, i) {
  const from = leaveCatSpot(c);
  c.path = buildPath(c, WAND_AT.x + (i ? .2 : -.2), WAND_AT.z, [], from); c.mode = 'walk'; c.pendingAct = 'wand';
}
function chooseCat(c) {
  if (c.lapOf) { if (c.lapOf.lapCat === c) c.lapOf.lapCat = null; c.lapOf = null; }
  const other = cats.find(o => o !== c), cooking = people.some(p => (p.spot === 'cook' || p.spot === 'bake') && p.mode === 'act');
  const laps = people.filter(p => p.mode === 'act' && LAP[p.spot] !== undefined && !p.lapCat);
  const w = { nap: night() ? 8 : 3, eat: house.meal && house.meal.stage === 'eat' ? 5 : 1.5, wander: 2.5, groom: 1.5, play: !night() && !play && !catBusy(other) ? 3 : 0,
              beg: cooking && free('beg', c) ? 4 : 0, lap: laps.length ? 3 : 0 };
  if (c.last === 'lap') w.lap = 0;
  if (w.lap && weighted(w) === 'lap') {   // climb into someone's lap
    const p = pick(laps), sp = SPOTS[p.spot], from = leaveCatSpot(c);
    c.lapOf = p; p.lapCat = c; c.lapSpot = p.spot;
    c.lapPos = { x: sp.x + Math.sin(sp.h) * .25, z: sp.z + Math.cos(sp.h) * .25, y: LAP[p.spot], h: sp.h + Math.PI / 2 };
    c.path = buildPath(c, c.lapPos.x, c.lapPos.z, sp.via || [], from); c.mode = 'walk'; c.pendingAct = 'lap'; return;
  }
  w.lap = 0;
  if (c.last === 'eat') w.eat = 0; if (c.last === 'play') w.play = 0; if (c.last === 'beg') w.beg = 0;
  const choice = weighted(w);
  if (choice === 'play') return startPlay(c, other, pick(PLAY_SPOTS));
  if (choice === 'wander' || choice === 'groom') {
    release(c); const [x, z] = pick(OPEN[pick(ORDER)]);
    const from = c.spot && CAT_SPOTS[c.spot] ? CAT_SPOTS[c.spot].via : [];
    c.path = buildPath(c, x, z, [], from || []); c.mode = 'walk'; c.target = null; c.spot = null; c.pendingAct = choice === 'groom' ? 'groom' : 'idle'; return;
  }
  const keys = Object.keys(CAT_SPOTS).filter(k => CAT_SPOTS[k].act === choice && free(k, c) && !(CAT_SPOTS[k].blockedBy || []).some(b => taken[b]));
  if (!keys.length) { c.mode = 'act'; c.act = 'groom'; c.timer = 8; return; }
  const key = night() && choice === 'nap' && free('bedfoot', c) ? 'bedfoot' : pick(keys);
  goTo(c, key, CAT_SPOTS); c.pendingAct = null;
}
function startCatAct(c) {
  if (c.target) { const sp = CAT_SPOTS[c.target]; c.spot = c.target; c.x = sp.x; c.z = sp.z; c.heading = sp.h; c.act = sp.act; c.last = sp.act; }
  else { c.act = c.pendingAct; c.last = c.act === 'idle' ? 'wander' : c.act; }
  if (c.act === 'lap') { c.x = c.lapPos.x; c.z = c.lapPos.z; c.heading = c.lapPos.h; }
  c.mode = 'act'; c.bubbleT = 0;
  c.timer = { nap: rand(70, 140), eat: rand(15, 25), groom: rand(10, 16), idle: rand(4, 9), beg: rand(15, 25), lap: rand(60, 110), wand: 9e9 }[c.act];
}
function startPlay(a, b, at) {
  play = { cats: [a, b], start: null, at };
  [a, b].forEach((c, i) => {
    const from = leaveCatSpot(c);
    c.path = buildPath(c, at.x + (i ? .5 : -.5), at.z, [], from); c.mode = 'walk'; c.pendingAct = 'playWait';
  });
}
const TOGETHER = { cook: ['cook', 'prep'], eat: ['eat1', 'eat2'], movie: ['tv1', 'tv2'], walk: ['stroll1', 'stroll2'], bench: ['bench1', 'bench2'], patio: ['patio1', 'patio2'], sleep: ['sleep1', 'sleep2'] };
export const hooks = { showPick: (p, value) => {} };   // the UI fills this in to mirror commands on each character's picker
function interrupt(p) {   // stop whatever they're doing right now
  if (p.spot === 'eat1' || p.spot === 'eat2') bowls[p.spot === 'eat1' ? 0 : 1].visible = false;
  release(p); p.waitFor = null; p.mode = 'idle'; p.spot = null;
}
function endCommand(p) {
  const together = p.cmd && p.cmd.together; p.cmd = null; hooks.showPick(p, '');
  if (together) for (const q of people) if (q.cmd && q.cmd.together === together) { q.cmd = null; hooks.showPick(q, ''); q.timer = Math.min(q.timer, 0); }
}
function shooCats(key) {   // a napping cat hops off when someone is sent to sit there
  for (const k of [key, ...(SPOTS[key].share || [])]) { const c = taken[k]; if (c && cats.includes(c)) { release(c); c.timer = 0; } }
}
export function command(p, value, dur) {   // dur in in-game minutes (= sim seconds)
  if (p.cmd && p.cmd.together) { const t = p.cmd.together; people.forEach(q => { if (q.cmd && q.cmd.together === t) { q.cmd = null; hooks.showPick(q, ''); if (q !== p) q.timer = 0; } }); }
  p.cmd = null;
  if (!value) { p.timer = Math.min(p.timer, 0); return; }
  if (value.startsWith('T:')) {   // together: lock both characters into the pair of spots
    const t = value.slice(2), pair = TOGETHER[t], q = people.find(o => o !== p);
    [p, q].forEach((who, i) => { if (who.cmd && who.cmd.together !== t) who.cmd = null; interrupt(who); who.cmd = { key: pair[i], until: simT + dur, dur, together: t }; hooks.showPick(who, value); });
    shooCats(pair[0]); shooCats(pair[1]); goTo(p, pair[0], SPOTS); goTo(q, pair[1], SPOTS);
    return;
  }
  const sp = SPOTS[value];
  for (const k of [value, ...(sp.share || [])]) {   // bump the other person off this spot (unless the player put them there)
    const q = taken[k];
    if (q && q !== p && people.includes(q)) { if (q.cmd) { q.cmd = null; hooks.showPick(q, ''); } interrupt(q); }
  }
  shooCats(value); interrupt(p); p.cmd = { key: value, until: simT + dur, dur }; goTo(p, value, SPOTS);
}

// initial state
// start asleep in bed if the page opens at night, otherwise painting and on the laptop
people.forEach((p, i) => {
  if (i === 0 && Q.has('do')) { p.x = 1.5; p.z = 1.5; p.didForce = true; return goTo(p, Q.get('do'), SPOTS); }   // testing aid: ?do=<activity>
  const k = bedtime(p) ? ['sleep1', 'sleep2'][i] : ['paint', 'laptop'][i]; p.target = k; taken[k] = p; startPersonAct(p);
});
Object.assign(cats[1], { target: 'catbed' }); taken.catbed = cats[1]; startCatAct(cats[1]);
chooseCat(cats[0]);
bowls.forEach(b => b.visible = false);

// ---------------------------------------------------------------- per-frame updates
export function updatePerson(p, dt) {
  if (p.mode === 'walk') { if (stepPath(p, dt, .75)) startPersonAct(p); }
  else if (p.mode === 'act') {
    p.timer -= dt;
    const hm = house.meal, sp = SPOTS[p.spot], eating = p.spot === 'eat1' || p.spot === 'eat2';
    if (sp.pose === 'lie' && !bedtime(p) && !p.cmd) p.timer = 0;
    if (bedtime(p) && sp.pose !== 'lie' && !p.cmd) cut(p, 2);
    if (hm && hm.stage === 'cook' && p === hm.cook && p.spot !== 'cook' && p.spot !== 'coffee') cut(p, 1.5);
    if (hm && hm.stage === 'cook' && p === hm.helper && p.spot !== 'coffee') { if (p.spot === 'prep') p.timer = Math.max(p.timer, 1); else cut(p, 1.5); }
    if (hm && hm.stage === 'eat' && !hm.ate.has(p) && !eating && sp.pose !== 'lie' && p.spot !== 'coffee') cut(p, 1.5);
    const atTV = p.spot === 'tv1' || p.spot === 'tv2';
    if (house.tv && !hm && atTV) p.timer = Math.max(p.timer, 1);
    if (house.tv && !hm && !atTV && sp.pose !== 'lie') cut(p, 1.5);
    if (p.cmd) {   // player's choice overrides the routine until its time is up
      if (simT >= p.cmd.until) { endCommand(p); p.timer = 0; }
      else if (p.spot === p.cmd.key) p.timer = Math.max(p.timer, 1);
    }
    if (p.spot === 'playcats' && !cats.some(c => c.mode === 'act' && c.act === 'wand')) {
      p.callT += dt;
      if (p.callT < 20) p.timer += dt;   // calling "here kitty kitty" while they trot over
      else p.timer = Math.min(p.timer, 1);
    }
    if (sp.loop) {
      if (p.waitFor) {   // waiting at the start for the partner to join the walk
        const q = p.waitFor; p.timer += dt;
        if (q.mode === 'act' && q.spot === 'stroll2') { p.waitFor = null; q.loopA = p.loopA; q.timer = p.timer; SPOTS.stroll1.label = SPOTS.stroll2.label = 'going for a walk together'; }
        else if ((p.waitT -= dt) < 0 || house.walkInvite !== q && !(q.mode === 'walk' && q.target === 'stroll2')) p.waitFor = null;
      } else {
        const L = sp.loop; p.loopA += L.speed * dt / ((L.rx + L.rz) / 2);
        p.x = L.cx + L.rx * Math.cos(p.loopA); p.z = L.cz + L.rz * Math.sin(p.loopA);
        p.heading = Math.atan2(-L.rx * Math.sin(p.loopA), L.rz * Math.cos(p.loopA)); p.walkPhase += dt * L.speed * (L.speed > 1 ? 7 : 11);
      }
    }
    if (p.spot === 'paint' && Math.random() < dt * 1.2) paintStroke();
    if (p.timer <= 0) {
      if (hm && p.spot === 'cook' && hm.stage === 'cook') hm.stage = 'eat';
      if (eating) { bowls[p.spot === 'eat1' ? 0 : 1].visible = false; if (hm) { hm.ate.add(p); if (people.every(q => hm.ate.has(q) || bedtime(q))) house.meal = null; } }
      choosePerson(p);
    }
  } else choosePerson(p);

  const r = p.rig, sp = p.mode === 'act' ? SPOTS[p.spot] : null, T = simT + p.ph;
  let hipY = .76, th = [0, 0], kn = [0, 0], ax = [0, 0], az = [0, 0], hx = 0, bob = 0, lie = false;
  r.book.visible = r.mug.visible = r.can.visible = r.rake.visible = r.broom.visible = r.vac.visible = r.duster.visible = r.pad.visible = r.bowl.visible = r.yarn.visible = false;
  if (p.mode === 'walk') { const s = Math.sin(p.walkPhase); th = [s * .45, -s * .45]; kn = [Math.max(0, -s) * .6, Math.max(0, s) * .6]; ax = [-s * .35, s * .35]; bob = Math.abs(Math.cos(p.walkPhase)) * .025; }
  else if (sp) {
    if (sp.loop && !p.waitFor) {
      const s = Math.sin(p.walkPhase), amp = sp.anim === 'jog' ? .8 : sp.anim === 'stroll' ? .45 : .25;
      th = [s * amp, -s * amp]; kn = [Math.max(0, -s) * amp * 1.4, Math.max(0, s) * amp * 1.4]; ax = [-s * amp * .8, s * amp * .8];
      bob = Math.abs(Math.cos(p.walkPhase)) * (sp.anim === 'jog' ? .06 : .025);
      if (sp.anim === 'jog') ax = [-.6 - s * .6, -.6 + s * .6];
    }
    if (sp.pose === 'sit') { hipY = .48; th = [-Math.PI / 2, -Math.PI / 2]; kn = [Math.PI / 2, Math.PI / 2]; }
    if (sp.pose === 'lie') lie = true;
    if (sp.pose === 'floor') { hipY = .14; th = [-Math.PI / 2, -Math.PI / 2]; kn = [0, 0]; }
    switch (sp.anim) {
      case 'stir': ax = [-.3, -1.1]; az = [0, Math.sin(T * 3) * .35]; hx = .25; break;
      case 'chop': ax = [-.9, -1.0 + Math.abs(Math.sin(T * 7)) * .35]; az = [.2, -.1]; hx = .4; break;
      case 'wash': ax = [-1.0, -1.0]; az = [Math.sin(T * 4) * .15, -Math.sin(T * 4) * .15]; hx = .3; break;
      case 'eat': ax = [-.6, -1.0 - (Math.sin(T * 1.6) * .5 + .5) * .9]; hx = .15; break;
      case 'brush': ax = [-.3, -1.5 + Math.sin(T * 1.3) * .25]; az = [0, Math.sin(T * 2.1) * .3]; hx = Math.sin(T * .4) * .08; break;
      case 'crochet': ax = [-1.0, -1.05 + Math.sin(T * 6) * .08]; az = [.32, -.3 + Math.sin(T * 6 + 1) * .08]; hx = .35; r.yarn.visible = true; break;
      case 'draw': ax = [-.9, -1.0 + Math.sin(T * 4) * .06]; az = [.2, Math.sin(T * 2.3) * .12 - .1]; hx = .4; break;
      case 'read': ax = [-1.1, -1.1]; az = [.35, -.35]; hx = .3; r.book.visible = true; break;
      case 'knit': ax = [-1.0, -1.0]; az = [.3 + Math.sin(T * 5) * .08, -.3 + Math.sin(T * 5 + 1.5) * .08]; hx = .3; break;
      case 'tea': ax = [0, -1.0 - Math.max(0, Math.sin(T * .6)) * .9]; r.mug.visible = true; break;
      case 'warm': ax = [-1.3, -1.3]; az = [.15, -.15]; break;
      case 'browse': ax = [0, -2.3 + Math.sin(T * .8) * .25]; az = [0, -.1]; hx = -.15; break;
      case 'coffee':   // brew at the machine, then sip
        if (p.timer > p.dur * .55) { ax = [0, -1.25]; hx = .2; }
        else { ax = [0, -1.0 - Math.max(0, Math.sin(T * .9)) * .9]; r.mug.visible = true; p.heading = sp.h + .6; }
        break;
      case 'gamepad': ax = [-1.0 + Math.sin(T * 7) * .03, -1.0 - Math.sin(T * 8) * .03]; az = [.38, -.38]; hx = -.05; r.pad.visible = true; break;
      case 'football': { const goal = Math.sin(T * .35) > .93; ax = goal ? [-2.8, -2.8] : [-.35, -.35]; az = goal ? [-.2, .2] : [.15, -.15]; break; }
      case 'mix': ax = [-.9, -1.0]; az = [.3, Math.sin(T * 5) * .25 - .1]; hx = .4; r.bowl.visible = true; break;
      case 'type': ax = [-1.05 + Math.sin(T * 9) * .04, -1.05 - Math.sin(T * 9 + 1) * .04]; az = [.22, -.22]; hx = .1; break;
      case 'watch': ax = [-.35, -.35]; az = [.15, -.15]; hx = -.05; break;
      case 'wand': ax = [0, -1.0 + Math.sin(T * 2.6) * .2]; az = [0, Math.sin(T * 1.3) * .35]; hx = .25; break;
      case 'sweep': ax = [-.5 + Math.sin(T * 3) * .25, -.55 + Math.sin(T * 3) * .25]; az = [.2, -.2]; hx = .3; r.broom.visible = true; break;
      case 'vacuum': ax = [0, -.65 + Math.sin(T * 2) * .15]; hx = .25; r.vac.visible = true; break;
      case 'dust': ax = [0, -2.3 + Math.sin(T * 4) * .2]; az = [0, Math.sin(T * 3) * .3]; hx = -.2; r.duster.visible = true; break;
      case 'makebed': ax = [-1.3 + Math.sin(T * 2) * .15, -1.3 - Math.sin(T * 2) * .15]; hx = .45; break;
      case 'water': ax = [0, -1.2]; r.can.visible = true; hx = .2; p.heading = sp.h + Math.sin(T * .3) * .8; break;
      case 'rake': { const sw = Math.sin(T * 1.5) * .25; ax = [-.55 + sw, -.6 + sw]; az = [.15, -.15]; hx = .35; r.rake.visible = true; growPile(dt); break; }
    }
  }
  if (p.lapCat && p.lapCat.mode === 'act' && p.lapCat.act === 'lap') {   // petting the cat on their lap
    ax = [-.6, -.75 + Math.sin(T * 1.8) * .15]; az = [.35, -.25]; hx = .4; r.book.visible = r.mug.visible = false;
  }
  const breathe = Math.sin(T * (lie ? 1.2 : 2)) * .012;
  r.body.position.y = hipY + bob; r.body.scale.set(1, 1 + breathe, 1);
  r.thighs.forEach((t, i) => { t.position.y = hipY + bob; t.rotation.x = th[i]; r.knees[i].rotation.x = kn[i]; });
  r.arms.forEach((a, i) => { a.rotation.x = ax[i]; a.rotation.z = az[i]; });
  r.head.rotation.x = hx;
  r.head.rotation.y = sp && sp.anim === 'chop' && Math.sin(T * .5) > .7 ? -.6 : 0;
  p.gy = (p.gy || 0) + ((roomOf(p.x, p.z) === 'Y' ? -.4 : 0) - (p.gy || 0)) * Math.min(1, dt * 6);
  r.root.position.set(p.x, (lie ? .72 : 0) + p.gy, p.z); r.root.rotation.set(lie ? -Math.PI / 2 : 0, p.heading, 0);
  if (sp && sp.anim === 'wand') {   // feather toy dances in front of them; stick runs from hand to toy
    wand.active = true; wandStick.visible = feather.visible = true;
    wand.pos.set(WAND_AT.x + Math.sin(T * 1.3) * .45, .06 + Math.abs(Math.sin(T * 2.6)) * .3, WAND_AT.z + Math.sin(T * .9) * .3);
    r.arms[1].children[1].getWorldPosition(tmpV);
    const dir = wand.pos.clone().sub(tmpV), len = dir.length();
    wandStick.position.copy(tmpV).addScaledVector(dir, .5); wandStick.scale.y = len; wandStick.quaternion.setFromUnitVectors(UP, dir.normalize());
    feather.position.copy(wand.pos); feather.rotation.set(Math.sin(T * 5) * .6, 0, Math.PI + Math.sin(T * 3) * .5);
  }
}

export function updateCat(c, dt) {
  if (c.mode === 'walk') { c.y += (0 - c.y) * Math.min(1, dt * 8); if (stepPath(c, dt, c.pendingAct === 'playWait' ? 1.1 : .8)) { if (c.pendingAct === 'playWait') { c.mode = 'playWait'; } else startCatAct(c); } }
  else if (c.mode === 'act') {
    const sp = c.spot && CAT_SPOTS[c.spot]; c.y += ((c.act === 'lap' ? c.lapPos.y : sp ? sp.y : 0) - c.y) * Math.min(1, dt * 6);
    c.timer -= dt;
    if (c.act === 'lap' && (!c.lapOf || c.lapOf.mode !== 'act' || c.lapOf.spot !== c.lapSpot)) c.timer = 0;
    if (c.act === 'wand') {
      if (!wand.active) c.timer = 0;
      else {   // chase the feather
        const i = cats.indexOf(c), tx = wand.pos.x + (i ? .17 : -.17), tz = wand.pos.z + (i ? .1 : -.1), dx = tx - c.x, dz = tz - c.z, d = Math.hypot(dx, dz);
        if (d > .04) { const st = Math.min(d, 1.6 * dt); c.x += dx / d * st; c.z += dz / d * st; c.walkPhase += dt * 16; }
        c.heading = lerpAngle(c.heading, Math.atan2(wand.pos.x - c.x, wand.pos.z - c.z), Math.min(1, dt * 10));
        c.wandMoving = d > .12;
      }
    }
    if (c.act === 'beg' && !people.some(p => p.spot === 'cook' && p.mode === 'act')) c.timer = Math.min(c.timer, 1);
    if (c.act === 'nap' && night()) c.timer = Math.max(c.timer, 5);
    if (c.timer <= 0) chooseCat(c);
  } else if (c.mode === 'idle') chooseCat(c);

  const r = c.rig, T = simT + c.ph;
  let bodyY = .2, bodyRX = 0, headRX = 0, headY = .1, legS = 1, tailRX = -.7, tailRZ = Math.sin(T * 1.5) * .3, ts = [.85, .8, 1.55], swing = 0, hop = 0;
  const walking = c.mode === 'walk' || (c.mode === 'playing' && play && play.phase === 0);
  if (walking) { swing = Math.sin(c.walkPhase) * .6; bodyY += Math.abs(Math.sin(c.walkPhase)) * .012; tailRX = -1.0; }
  if (c.mode === 'playing' && play.phase === 1) { hop = Math.max(0, Math.sin(T * 5 + (c === play.cats[0] ? 0 : Math.PI))) * .22; bodyRX = -hop; tailRZ = Math.sin(T * 9) * .6; }
  if (c.mode === 'act') {
    if (c.act === 'nap' || c.act === 'lap') { legS = .01; bodyY = .1; ts = [.95, .72 + Math.sin(T * 1.1) * .02, 1.25]; headY = .02; headRX = .5; tailRX = -1.55; tailRZ = 1.3; }
    if (c.act === 'eat') { headRX = .75 + Math.sin(T * 7) * .08; bodyRX = .15; }
    if (c.act === 'groom' || c.act === 'beg') { bodyRX = -.55; bodyY = .23; tailRX = -1.5; headRX = c.act === 'groom' ? (Math.sin(T * 4) > .2 ? .55 : .1) : -.25 + Math.sin(T * 2) * .1; }
  }
  if (c.mode === 'act' && c.act === 'wand') {
    if (c.wandMoving) { swing = Math.sin(c.walkPhase) * .7; tailRX = -1.0; }
    else { hop = Math.max(0, Math.sin(T * 5)) * .2; bodyRX = -hop * 1.5; }
    tailRZ = Math.sin(T * 8) * .6;
  }
  r.body.position.y = bodyY + hop; r.body.rotation.x = bodyRX;
  r.torso.scale.set(...ts); r.head.position.y = headY; r.head.rotation.x = headRX;
  r.tail.rotation.set(tailRX, 0, tailRZ);
  r.legs.forEach((l, i) => { l.scale.y = legS; l.rotation.x = (i === 0 || i === 3 ? swing : -swing); });
  r.root.position.set(c.x, c.y, c.z); r.root.rotation.y = c.heading;
}

export function updatePlay(dt) {
  if (!play) return;
  const [a, b] = play.cats;
  if (!play.start) { if (a.mode === 'playWait' && b.mode === 'playWait') { play.start = simT; a.mode = b.mode = 'playing'; a.bubbleT = b.bubbleT = 0; } return; }
  const e = simT - play.start; play.phase = Math.floor(e / 4) % 2;
  if (play.phase === 0) {
    const ang = e * 1.3;
    const at = play.at;
    [[a, ang], [b, ang - 1.0]].forEach(([c, t]) => { c.x = at.x + Math.cos(t) * .5; c.z = at.z + Math.sin(t) * .4; c.heading = Math.atan2(-Math.sin(t) * .5, Math.cos(t) * .4); c.walkPhase += dt * 14; });
    if (at === PLAY) { yarn.position.set(PLAY.x + Math.cos(ang + .5) * .5, .08, PLAY.z + Math.sin(ang + .5) * .4); yarn.rotation.x += dt * 6; }
  } else {
    a.heading = Math.atan2(b.x - a.x, b.z - a.z); b.heading = Math.atan2(a.x - b.x, a.z - b.z);
  }
  if (e > 40) { play = null; [a, b].forEach(c => { c.mode = 'idle'; c.last = 'play'; }); yarn.position.set(PLAY.x, .08, PLAY.z); }
}
export const CAT_ICON = { nap: '💤', eat: '🐟', groom: '✨', beg: '❤️', lap: '💕', wand: '🪶' };
export const CAT_LABEL = { nap: 'napping', eat: 'eating', groom: 'grooming', beg: 'begging for a treat', idle: 'exploring', wand: 'chasing the feather toy' };

export function updateBubble(a, isCat, dt) {
  a.bubbleT += dt;
  let icon = null;
  if (isCat) icon = a.mode === 'playing' ? '🧶' : a.mode === 'act' ? CAT_ICON[a.act] : null;
  else icon = a.mode === 'act' ? SPOTS[a.spot].icon : null;
  const show = icon && (a.bubbleT % 18) < 5;
  a.bubble.visible = !!show;
  if (show) {
    a.bubble.material = bubbleMat(icon);
    const hp = new THREE.Vector3(); (isCat ? a.rig.head : a.rig.head).getWorldPosition(hp);
    a.bubble.position.set(hp.x, hp.y + (isCat ? .4 : .55) + Math.sin(simT * 1.5 + a.ph) * .04, hp.z);
    const k = Math.min(1, (a.bubbleT % 18) * 3, (5 - a.bubbleT % 18) * 3); a.bubble.scale.setScalar((isCat ? .42 : .55) * Math.max(.01, k));
  }
}
