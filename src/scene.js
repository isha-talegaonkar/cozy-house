import * as THREE from 'three';

// ---------------------------------------------------------------- renderer / camera
export const phone = matchMedia('(pointer: coarse)').matches && Math.min(screen.width, screen.height) < 820;
export const renderer = new THREE.WebGLRenderer({ antialias: !phone, powerPreference: phone ? 'low-power' : 'default' });
renderer.setPixelRatio(Math.min(devicePixelRatio, phone ? 1.25 : 2));   // lighter on phones: no antialiasing, lower resolution
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
document.body.prepend(renderer.domElement);

export const scene = new THREE.Scene();
scene.fog = new THREE.Fog('#c9b8a0', 38, 70);
export const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 140);
export let camAz = Math.PI / 4, camAzTarget = camAz;
const CAM_EL = .62, CAM_D = 45;
camera.zoom = 1.3;
export function rotateView(dir) { camAzTarget += dir * Math.PI / 2; }
export function updateCamera(dt) {
  camAz += (camAzTarget - camAz) * Math.min(1, dt * 4);
  const cd = new THREE.Vector3(Math.sin(camAz) * Math.cos(CAM_EL), Math.sin(CAM_EL), Math.cos(camAz) * Math.cos(CAM_EL));
  keyPan(dt);
  camera.position.copy(cd).multiplyScalar(CAM_D).add(camTarget); camera.lookAt(camTarget);
}
function resize() {
  const w = innerWidth, h = innerHeight, a = w / h, v = 8.2;
  renderer.setSize(w, h);
  camera.left = -v * a; camera.right = v * a; camera.top = v; camera.bottom = -v; camera.updateProjectionMatrix();
}
addEventListener('resize', resize); resize();
// ---- pan (drag / arrow keys) + zoom (scroll / pinch / buttons)
const QV = new URLSearchParams(location.search);   // optional ?zoom=&x=&z= starting view
export const camTarget = new THREE.Vector3(+(QV.get('x') ?? 0), .3, +(QV.get('z') ?? 0));
if (QV.has('zoom')) { camera.zoom = +QV.get('zoom'); camera.updateProjectionMatrix(); }
export const zoomBy = f => { camera.zoom = Math.min(3, Math.max(.5, camera.zoom * f)); camera.updateProjectionMatrix(); };
function panBy(dxPx, dyPx) {
  const k = (camera.top - camera.bottom) / camera.zoom / innerHeight;
  const right = new THREE.Vector3(Math.cos(camAz), 0, -Math.sin(camAz)), away = new THREE.Vector3(-Math.sin(camAz), 0, -Math.cos(camAz));
  camTarget.addScaledVector(right, -dxPx * k).addScaledVector(away, dyPx * k / Math.sin(CAM_EL));
  camTarget.x = Math.max(-14, Math.min(14, camTarget.x)); camTarget.z = Math.max(-14, Math.min(14, camTarget.z));
}
const cv = renderer.domElement, pointers = new Map();
cv.style.cursor = 'grab'; cv.style.touchAction = 'none';
cv.addEventListener('pointerdown', e => { cv.setPointerCapture(e.pointerId); pointers.set(e.pointerId, [e.clientX, e.clientY]); cv.style.cursor = 'grabbing'; });
cv.addEventListener('pointermove', e => {
  if (!pointers.has(e.pointerId)) return;
  const [px, py] = pointers.get(e.pointerId);
  if (pointers.size === 1) panBy(e.clientX - px, e.clientY - py);
  else if (pointers.size === 2) {
    const [a, b] = [...pointers.values()], other = a === pointers.get(e.pointerId) ? b : a;
    const before = Math.hypot(px - other[0], py - other[1]), after = Math.hypot(e.clientX - other[0], e.clientY - other[1]);
    if (before > 0) zoomBy(after / before);
  }
  pointers.set(e.pointerId, [e.clientX, e.clientY]);
});
const endPointer = e => { pointers.delete(e.pointerId); if (!pointers.size) cv.style.cursor = 'grab'; };
cv.addEventListener('pointerup', endPointer); cv.addEventListener('pointercancel', endPointer);
// zoom the house (never the browser page) on scroll or trackpad pinch (ctrlKey) anywhere on the page
// mouse wheel zooms; trackpad two-finger swipe pans; trackpad pinch (ctrlKey) zooms
const isTrackpad = e => e.deltaX !== 0 || (e.wheelDeltaY ? e.wheelDeltaY === -3 * e.deltaY : e.deltaMode === 0 && Math.abs(e.deltaY) < 40);
addEventListener('wheel', e => {
  if (e.target.closest && e.target.closest('#menu') && !e.ctrlKey) return;   // let the activity menu scroll
  e.preventDefault();
  if (e.ctrlKey) zoomBy(Math.exp(-e.deltaY * .01));
  else if (isTrackpad(e)) panBy(-e.deltaX, -e.deltaY);
  else zoomBy(Math.exp(-e.deltaY * .0015));
}, { passive: false });
cv.addEventListener('contextmenu', e => e.preventDefault());   // right-drag pans too
['gesturestart', 'gesturechange'].forEach(t => addEventListener(t, e => e.preventDefault()));
// if the browser is zoomed anyway, keep the panels pinned to the visible corners
const vv = window.visualViewport;
if (vv) { const pinUI = () => { document.getElementById('ui').style.transform = `translate(${vv.offsetLeft}px, ${vv.offsetTop}px) scale(${1 / vv.scale})`; }; vv.addEventListener('resize', pinUI); vv.addEventListener('scroll', pinUI); pinUI(); }
export const keys = new Set();
addEventListener('keydown', e => { if (e.target.tagName === 'SELECT') return; keys.add(e.key.toLowerCase()); if (e.key === '+' || e.key === '=') zoomBy(1.15); if (e.key === '-') zoomBy(1 / 1.15); });
addEventListener('keyup', e => keys.delete(e.key.toLowerCase()));
function keyPan(dt) {
  const v = 500 * dt, k = n => keys.has(n);
  panBy((k('arrowleft') || k('a') ? v : 0) - (k('arrowright') || k('d') ? v : 0), (k('arrowup') || k('w') ? v : 0) - (k('arrowdown') || k('s') ? v : 0));
}

// if the phone runs out of graphics memory and drops the 3D view, say so instead of leaving a blank page
renderer.domElement.addEventListener('webglcontextlost', e => { e.preventDefault(); window.showError?.('The 3D view was stopped by the browser (probably low graphics memory). Close other tabs and reload.'); });
