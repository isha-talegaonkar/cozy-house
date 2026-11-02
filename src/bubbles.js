import { canvasTex } from './helpers.js';
import * as THREE from 'three';
import { scene } from './scene.js';
import { simT } from './clock.js';
import { CAT_ICON, SPOTS } from './activities.js';

// Thought bubbles: the little emoji clouds that pop up over Izzy, Nik and the cats.
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
export function bubbleSprite() { const s = new THREE.Sprite(bubbleMat('💤')); s.scale.set(.55, .55, 1); s.renderOrder = 10; s.visible = false; scene.add(s); return s; }

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
