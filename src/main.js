import * as THREE from 'three';
import { camAz, camera, renderer, scene, updateCamera } from './scene.js';
import { animateHouse, feather, wand, wandStick } from './house.js';
import { animateYard } from './yard.js';
import { advanceClock, hour, simT } from './clock.js';
import { cats, people, updateCat, updateMeals, updateMovieNight, updatePerson, updatePlay } from './sim.js';
import { updateBubble } from './bubbles.js';
import { lampLevel, updateDay } from './daycycle.js';
import { fireLit, updateWeather } from './season.js';
import { updateStatus } from './ui.js';
import './plants.js';
import './characters.js';
import './audio.js';

// ---------------------------------------------------------------- main loop
const clock = new THREE.Clock();
const doing = (spot, test = () => true) => people.some(p => p.mode === 'act' && p.spot === spot && test(p));

function frame() {
  const dt = Math.min(.05, clock.getDelta()), T = clock.elapsedTime, sdt = advanceClock(dt);

  // world: time of day, weather, camera
  updateWeather(simT); updateCamera(dt); updateDay();
  animateHouse({ T, simT, camAz, lit: fireLit(hour), lamp: lampLevel, using: spot => doing(spot),
                 brewing: doing('coffee', p => p.timer > p.dur * .55), baking: doing('bake'), cooking: doing('cook') });
  animateYard(dt, T, { camAz, lamp: lampLevel });

  // life: household routines, June and Theo, the cats
  updateMeals(); updateMovieNight();
  wand.active = false; wandStick.visible = feather.visible = false;
  people.forEach(p => updatePerson(p, sdt));
  updatePlay(sdt);
  cats.forEach(c => updateCat(c, sdt));
  people.forEach(p => updateBubble(p, false, sdt)); cats.forEach(c => updateBubble(c, true, sdt));

  updateStatus();
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
frame();
