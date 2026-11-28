# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running

No build step, package manager, linter or test suite. It's vanilla ES modules plus Three.js (0.164, from unpkg via the import map in `index.html`). Serve the folder statically:

```bash
python3 -m http.server 8000   # then open http://localhost:8000
```

Opening `index.html` from `file://` won't work because browsers block modules there. The site deploys to GitHub Pages straight from `main`.

The only way to test is to load the page. These query params get you to a specific state quickly:

| Param | Effect |
|---|---|
| `season=spring\|summer\|fall\|winter`, `weather=auto\|clear\|rain` | override the saved season/weather |
| `hour=18.5`, `day=0..6` (0 = Monday), `speed=5` | start time, weekday, sim speed |
| `do=<SPOTS key>` | send the first person straight to that activity |
| `movie`, `together`, `clean` | force movie night, cooking together, cleaning day |
| `zoom=`, `x=`, `z=` | starting camera view |
| `debug` | exposes `window.cozy = { renderer, scene }` and logs the static-merge count |

Startup errors show up on screen through `showError` in `index.html`, which helps on phones.

## Architecture

`src/main.js` runs the frame loop. Each module builds its own part of the scene when it's imported (as a side effect) and exports an update/animate function that `main.js` calls every frame. Shared state lives in exported `let` bindings, such as `hour`/`simT` in `clock.js` and `season`/`raining` in `season.js`. Other modules read these through live imports and change them only through the owning module's setters.

- **Time** (`clock.js`): 1 in-game minute is 1 real second at 1×. `advanceClock` returns sim seconds (`sdt`), and simulation code uses that rather than the real `dt`. Activity durations and `timer`s are in in-game minutes, which means sim seconds. `onNewDay` fires at midnight.
- **Season/weather** (`season.js`): subscribe with `onSeason(fn)` / `onWeather(fn)`. The callback runs once right away and again on every change, and this is how decor, outfits, labels and music swap. Use the `SPRING`/`SUMMER`/... and `AUTO`/`CLEAR`/`RAIN` constants rather than bare strings. Choices persist in localStorage (`cozy-season`, `cozy-weather`, plus `cozy-names` for character names).
- **Activities** (`activities.js`): `SPOTS` is the catalogue of person activities. Each entry has a position, heading `h`, `pose` (stand/sit/lie/floor), `anim` (handled in `sim.js`/`characters.js`), icon and label. It can also have `via` waypoints, `share` (spots that physically overlap, so they can't both be taken) and `loop` (walking circuits). `CAT_SPOTS`, `TOGETHER` (pairs of spots for joint activities) and `LAP` heights are defined there too. Labels and icons are changed at runtime by meals, movie night, season and the hour.
- **Simulation** (`sim.js`): `people` and `cats` are plain objects with a `rig` (the Three.js model from `characters.js`) and a `mode` of idle, walk or act. The `taken` map reserves spots. Household routines (meals, movie night, bedtime, rain) interrupt activities with `cut()`, but only after `MIN_ACT` minutes. Player commands from `ui.js` go through `command()`, and `p.cmd` locks a person into a chosen activity. `DISLIKES`/`FAVS` and the daily `mood` drive autonomous choices.
- **Navigation** (`nav.js` + `layout.js`): there are four rooms (`B` bedroom, `L` living, `S` studio, `K` kitchen) plus `Y` yard, split by the wall constants in `layout.js`. `buildPath` routes through doorways in `ORDER`. Moving a wall means updating `layout.js`.
- **World** (`house.js`, `yard.js`, `plants.js`, `characters.js`): geometry is built with the terse helpers in `helpers.js` (`B` box, `C` cylinder, `Sph`, `soft` rounded box, `group`, `M`/`fabric`/`smooth` materials, `canvasTex`). `animateHouse` gets a context object from `main.js` describing which spots are in use (TV, stove, oven glow and so on).
- **Daycycle/lighting** (`daycycle.js`): sun, sky and lamp levels from the hour and season. Wall cutaway follows camera azimuth (`scene.js` `camAz`).
- **Audio** (`audio.js`): all music and ambient sound is generated with the Web Audio API. There are no audio files.

### Static-mesh freezing (important when adding objects)

`freeze.js` runs once at startup and merges every mesh that never moves into one mesh per material, which keeps phones fast. Anything you add to the scene gets merged and can no longer be moved, hidden or recoloured, unless you register it with the `FREEZE` helpers in `helpers.js`:

- `animated(mesh)`: meshes that move, blink or toggle visibility
- `keepGroup(group)`: a group whose transform or visibility changes. Its contents are merged inside it, not across it (seasonal `decor` groups are an example).
- `excludeTree(obj)`: leave the whole subtree alone (characters, fire)
- `mutableMat(mat)`: materials whose colour or emissive changes at runtime

Meshes that are invisible at freeze time are skipped. Lights, sprites and InstancedMeshes are never merged.

### Phones

`scene.js` exports `phone` (coarse pointer and small screen). Phone mode turns off antialiasing, uses a low-power renderer and hides extra point lights (`lights.slice(3)`). Keep per-pixel cost (lights, transparency) in mind.

## Conventions

- Code is deliberately dense: one-liners, short helper names, and comments that explain *why* at the end of the line. Match the existing style.
- `style-previews/` is gitignored scratch work and not part of the app.
