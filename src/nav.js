import { BEDROOM_WALL_Z, KITCHEN_WALL_Z, MIDDLE_WALL_X, nearHouse } from './layout.js';
import { lerpAngle } from './helpers.js';
import { speed } from './clock.js';

// Getting around the house: which room a point is in, the doors between rooms, and walking a path.
// ---------------------------------------------------------------- navigation
export const ORDER = ['B', 'L', 'S', 'K'];
const DOORS = { 'B-L': { B: [-.8, -.5], L: [-.8, .5] }, 'L-S': { L: [-.5, 2.8], S: [.5, 2.8] }, 'S-K': { S: [3.0, -.1], K: [3.0, -1.1] }, 'L-Y': { L: [-1.0, 3.8], Y: [-1.0, 5.2] } };
// which room a point is in: B(edroom), L(iving), S(tudio / hobby room), K(itchen), or Y(ard)
export const roomOf = (x, z) => !nearHouse(x, z) ? 'Y' : x < MIDDLE_WALL_X ? (z < BEDROOM_WALL_Z ? 'B' : 'L') : (z < KITCHEN_WALL_Z ? 'K' : 'S');
const ADJ = { B: ['L'], L: ['B', 'S', 'Y'], S: ['L', 'K'], K: ['S'], Y: ['L'] };
function roomRoute(a, b) {   // breadth-first search over rooms
  const prev = { [a]: null }, q = [a];
  while (q.length) { const r = q.shift(); if (r === b) break; for (const n of ADJ[r]) if (!(n in prev)) { prev[n] = r; q.push(n); } }
  const route = []; for (let r = b; r; r = prev[r]) route.unshift(r); return route;
}
export function buildPath(a, tx, tz, via = [], fromVia = []) {
  const r0 = roomOf(a.x, a.z), r1 = roomOf(tx, tz), pts = [];
  if (r0 !== r1) {
    pts.push(...[...fromVia].reverse());
    const route = roomRoute(r0, r1);
    for (let i = 0; i < route.length - 1; i++) { const p = route[i], q = route[i + 1], d = DOORS[`${p}-${q}`] || DOORS[`${q}-${p}`]; pts.push(d[p], d[q]); }
    pts.push(...via);
  }
  pts.push([tx, tz]); return pts;
}
export function stepPath(a, dt, speed) {
  const [tx, tz] = a.path[0], dx = tx - a.x, dz = tz - a.z, d = Math.hypot(dx, dz);
  if (d < .04) { a.path.shift(); return a.path.length === 0; }
  const s = Math.min(d, speed * dt); a.x += dx / d * s; a.z += dz / d * s;
  a.heading = lerpAngle(a.heading, Math.atan2(dx, dz), Math.min(1, dt * 8));
  a.walkPhase += dt * speed * 11;
  return false;
}
export const ROOM_NAME = { B: 'bedroom', L: 'living room', S: 'studio', K: 'kitchen', Y: 'garden' };
