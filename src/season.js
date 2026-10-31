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
  if (weather === 'auto' && s === 'winter') setRain(false);   // winter snows instead
  try { localStorage.setItem('cozy-season', s); } catch {}
  listeners.forEach(fn => fn(s));
}

// Is the fireplace lit at this hour? Never in summer; only on cool mornings and evenings in spring.
export const fireLit = hour => season === 'summer' ? false : season === 'spring' ? hour >= 18 || hour < 8 : true;
// How inviting the garden is this season.
export const GARDEN = { spring: 1.3, summer: 1.6, fall: 1, winter: .3 };

// ---- weather: Auto (rainy spells come and go), Clear, or Rain
export const WEATHER = { auto: { name: 'Auto', icon: '🎲' }, clear: { name: 'Clear', icon: '☀️' }, rain: { name: 'Rain', icon: '🌧️' } };
const savedW = (() => { try { return localStorage.getItem('cozy-weather'); } catch { return null; } })();
const askedW = new URLSearchParams(location.search).get('weather');
export let weather = [askedW, savedW].find(w => w && w in WEATHER) || 'auto';
export let raining = weather === 'rain';
const weatherListeners = [];
export function onWeather(fn) { weatherListeners.push(fn); fn(); }   // fn() reads `weather` and `raining`
function setRain(v) { if (raining === v) return; raining = v; weatherListeners.forEach(fn => fn()); }
export function setWeather(w) {
  if (!(w in WEATHER)) return;
  weather = w;
  try { localStorage.setItem('cozy-weather', w); } catch {}
  if (w !== 'auto') setRain(w === 'rain');
  weatherListeners.forEach(fn => fn());
}
const RAIN_CHANCE = { spring: .12, summer: .06, fall: .12, winter: 0 };   // chance per in-game hour on Auto
let spellUntil = 0, nextCheck = 0;
export function updateWeather(simT) {
  if (weather !== 'auto' || simT < nextCheck) return;
  nextCheck = simT + 60;
  if (raining) { if (simT > spellUntil) setRain(false); }
  else if (Math.random() < RAIN_CHANCE[season]) { spellUntil = simT + 60 * (2 + Math.random() * 3); setRain(true); }
}
