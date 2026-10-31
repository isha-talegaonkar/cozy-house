// In-game time: the clock, play speed, weekdays and the midnight rollover.
export const Q = new URLSearchParams(location.search);
export let simT = 0, hour = +(Q.get('hour') ?? 6.97), speed = +(Q.get('speed') ?? 1);
const dayListeners = [];
export const onNewDay = fn => dayListeners.push(fn);   // runs at midnight, after the day counter moves on
export function advanceClock(dt) {   // 1 in-game minute = 1 second at 1x; returns sim seconds elapsed
  const sdt = dt * speed; simT += sdt; hour += sdt / 60;
  if (hour >= 24) { hour -= 24; dayIdx++; dayListeners.forEach(fn => fn()); }
  return sdt;
}
export function cycleSpeed() { const steps = [1, 2, 5, 20]; speed = steps[(steps.indexOf(speed) + 1) % steps.length]; return speed; }
export const night = () => hour >= 22 || hour < 6.5;
export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
export let dayIdx = +(Q.get('day') ?? 4);   // start on a Friday
export const weekend = () => dayIdx % 7 >= 5;
