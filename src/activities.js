import { FALL, SPRING, SUMMER, WINTER, onSeason } from './season.js';
import { hour } from './clock.js';

// The catalogue of things to do: where each activity happens, how it looks, and the cats' favourite spots.
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
export const CAT_SPOTS = {
  catbed:  { x: -3.4, z: 3.75, y: .1, h: .8, act: 'nap', via: LIV },
  bedfoot: { x: -2.5, z: -1.5, y: .95, h: Math.PI / 2, act: 'nap' },
  sofa:    { x: -2.95, z: 2.3, y: .44, h: -Math.PI / 2, act: 'nap', via: LIV },   // curled up on the sofa's return
  nookcat: { x: 2.9, z: 4.0, y: .5, h: -Math.PI / 2, act: 'nap' },
  bowl1:   { x: 4.25, z: -1.2, y: 0, h: Math.PI / 2, act: 'eat' },
  bowl2:   { x: 4.25, z: -1.65, y: 0, h: Math.PI / 2, act: 'eat' },
  beg:     { x: 2.55, z: -2.3, y: 0, h: -Math.PI / 2, act: 'beg' },
};
export const OPEN = { B: [[-1.0, -1.0], [-3.5, -.6], [-3.6, -1.0]], L: [[-1.2, 1.2], [-3.0, 1.2], [-1.2, 3.0], [-2.5, 3.3], [-1.6, 3.8]],
               S: [[2.5, 1.0], [3.0, 2.2], [2.0, 2.6], [3.2, .8], [2.0, .6]], K: [[3.4, -1.4], [.9, -2.5], [2.8, -2.2], [.5, -1.1]] };
export const PLAY = { x: 2.5, z: 1.85 }, PLAY_SPOTS = [PLAY, { x: -1.15, z: 2.0 }];
export const LAP = { crochet: .56, knit: .56, tea: .56, tv1: .56, tv2: .56, games: .56, football: .56, read: .56, nook: .64 };   // lap height per seat
export const WAND_AT = { x: -2.95, z: -.65 };
const TEA = { [WINTER]: ['sipping hot cocoa', '🍫'] };
onSeason(s => { const [label, icon] = TEA[s] || ['sipping tea', '☕']; Object.assign(SPOTS.tea, { label, icon }); });
const FLOWER_JOB = { [SPRING]: 'watering the tulips', [SUMMER]: 'watering the sunflowers', [FALL]: 'watering the mums', [WINTER]: 'checking on the garden' };
onSeason(s => { SPOTS.mums.label = FLOWER_JOB[s]; });
export function updateBenchMood() {
  const [label, icon] = hour < 17 ? ['enjoying the garden', '🍵'] : hour < 19.3 ? ['watching the sunset', '🌅'] : ['stargazing in the garden', '✨'];
  Object.assign(SPOTS.bench1, { label, icon }); Object.assign(SPOTS.bench2, { label, icon });
}
export const TOGETHER = { cook: ['cook', 'prep'], eat: ['eat1', 'eat2'], movie: ['tv1', 'tv2'], walk: ['stroll1', 'stroll2'], bench: ['bench1', 'bench2'], patio: ['patio1', 'patio2'], sleep: ['sleep1', 'sleep2'] };
export const CAT_ICON = { nap: '💤', eat: '🐟', groom: '✨', beg: '❤️', lap: '💕', wand: '🪶' };
export const CAT_LABEL = { nap: 'napping', eat: 'eating', groom: 'grooming', beg: 'begging for a treat', idle: 'exploring', wand: 'chasing the feather toy' };
