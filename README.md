# 🍂 The Cozy House

A slow-living, Sims-inspired little house to fall asleep to. June, Theo and their cats Biscuit and Mochi go about their day: painting, crocheting, gaming, cooking, reading by the fire and napping in sunbeams.

Runs entirely in the browser with [Three.js](https://threejs.org) and no build step. Serve the folder with any static server (e.g. VS Code Live Server) or visit the GitHub Pages site. Opening `index.html` straight from disk won't work because browsers block ES modules on `file://`.

## Code layout

| File | What it holds |
|---|---|
| `index.html` | Page markup and the Three.js import map |
| `styles.css` | Panels, buttons, activity menu, mobile layout |
| `src/main.js` | The per-frame loop: camera, fire, screens, steam, falling leaves, status panel |
| `src/scene.js` | Renderer, scene, orthographic camera, pan/zoom/rotate input |
| `src/helpers.js` | Shape helpers (boxes, soft rounded boxes, spheres), shared materials, canvas textures |
| `src/plants.js` | Leaf textures and every plant type |
| `src/house.js` | Floors, walls with cutaway versions, windows, every room's furniture and props, the TV |
| `src/yard.js` | Garden: lawn, path, fence, lamp post, bench, patio, trees, falling and fallen leaves |
| `src/characters.js` | June and Theo's models and outfits, the cats |
| `src/sim.js` | Clock, navigation, activities, daily routine, cats, player commands, per-character updates |
| `src/ui.js` | Household panel, activity picker, buttons |
| `src/daycycle.js` | Sun, sky and lamp lighting through the day |
| `src/audio.js` | Generated music and fire crackle |

Handy URL options for trying things out: `?hour=18.4` (start time), `?speed=5`, `?movie`, `?together`, `?clean`, `?do=<activity>`, `?zoom=2&x=0&z=0`.
