// The current season, shared by every part of the house.
// Other modules subscribe with onSeason(fn): fn runs once right away and again whenever the season changes.
export const SEASONS = {
  spring: { name: 'Spring', icon: '🌸' },
  summer: { name: 'Summer', icon: '☀️' },
  fall: { name: 'Fall', icon: '🍂' },
  winter: { name: 'Winter', icon: '❄️' },
};
const saved = (() => { try { return localStorage.getItem('cozy-season'); } catch { return null; } })();
const asked = new URLSearchParams(location.search).get('season');
export let season = [asked, saved].find(s => s && s in SEASONS) || 'fall';

const listeners = [];
export function onSeason(fn) { listeners.push(fn); fn(season); }
export function setSeason(s) {
  if (!(s in SEASONS) || s === season) return;
  season = s;
  try { localStorage.setItem('cozy-season', s); } catch {}
  listeners.forEach(fn => fn(s));
}

// Is the fireplace lit at this hour? Never in summer; only on cool mornings and evenings in spring.
export const fireLit = hour => season === 'summer' ? false : season === 'spring' ? hour >= 18 || hour < 8 : true;
// How inviting the garden is this season.
export const GARDEN = { spring: 1.3, summer: 1.6, fall: 1, winter: .3 };
