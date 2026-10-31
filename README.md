# 🍂 The Cozy House

A slow-living, Sims-inspired little house to fall asleep to. June, Theo and their cats Biscuit and Mochi go about their day: painting, crocheting, gaming, cooking, reading by the fire and napping in sunbeams.

Runs entirely in the browser with [Three.js](https://threejs.org) and no build step. Serve the folder with any static server (e.g. VS Code Live Server) or visit the GitHub Pages site. Opening `index.html` straight from disk won't work because browsers block ES modules on `file://`.

## Code layout

| File | What it holds |
|---|---|
| `index.html` | Page markup, the Three.js import map, and the on-screen error note |
| `styles.css` | Panels, buttons, activity menu, mobile layout |
| `src/main.js` | The frame loop: advances time and calls each module's update in order |
| `src/scene.js` | Renderer, scene, orthographic camera, pan/zoom/rotate input |
| `src/helpers.js` | Shape helpers, shared materials, canvas textures, fairy-light twinkle |
| `src/layout.js` | House footprint and inner-wall positions |
| `src/season.js` | Current season and weather (with SPRING… and AUTO/CLEAR/RAIN constants), fire and garden rules |
| `src/clock.js` | In-game time, speed, weekdays and the midnight rollover |
| `src/plants.js` | Leaf textures and every plant type |
| `src/house.js` | Floors, cutaway walls, every room's furniture, the TV, Christmas decor, and `animateHouse` |
| `src/yard.js` | Garden, trees, flowers, leaves, snow, rain, fireflies, and `animateYard` |
| `src/characters.js` | June and Theo's models (faces, hair, outfits, props) and the cats |
| `src/wardrobe.js` | Seasonal outfits and pyjamas |
| `src/activities.js` | Where each activity happens and how it's labelled; the cats' spots |
| `src/nav.js` | Rooms, doors and path-finding |
| `src/bubbles.js` | Thought bubbles over heads |
| `src/sim.js` | Daily routines, choosing what to do, cats' behaviour, player commands, per-character animation |
| `src/ui.js` | Household panel, activity picker, season/weather pickers, buttons |
| `src/daycycle.js` | Sun, sky and lamp lighting through the day |
| `src/audio.js` | Generated seasonal music, birdsong, crickets, rain and fire crackle |

Handy URL options for trying things out: `?season=winter`, `?weather=rain`, `?hour=18.4` (start time), `?speed=5`, `?movie`, `?together`, `?clean`, `?do=<activity>`, `?zoom=2&x=0&z=0`.
