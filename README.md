# 🍂 The Cozy House

A slow-living, Sims-inspired 3D house that runs in the browser. Izzy, Nik and their cats go about their day on their own: cooking, painting, gaming, reading by the fire and sleeping.

**Live demo:** https://isha-talegaonkar.github.io/cozy-house/

## Features

- Autonomous characters with their own interests, daily routines and cats
- Pick activities for each character, including together activities
- Four seasons and a weather setting (Auto, Clear, Rain)
- Day/night cycle with Sims-style cutaway walls and rotatable view
- Generated ambient music and sounds (no audio files)
- Editable character names

## Tech stack

- [Three.js](https://threejs.org) via an import map
- Vanilla JavaScript ES modules (no framework or build step)
- Web Audio API
- Hosted on GitHub Pages

## Getting started

Serve the project folder with any static server:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000. VS Code Live Server also works. Opening `index.html` directly from disk won't work, because browsers block ES modules on `file://`.

### URL options

| Option | Example |
|---|---|
| Season | `?season=winter` |
| Weather | `?weather=rain` |
| Start time | `?hour=18.5` |
| Speed | `?speed=5` |

## Project structure

```
index.html        page markup and import map
styles.css        UI styles
src/
  main.js         frame loop
  scene.js        renderer, camera, input
  house.js        rooms and furniture
  yard.js         garden, trees, weather effects
  characters.js   character and cat models
  sim.js          routines and behaviour
  activities.js   activity definitions
  season.js       season and weather state
  ui.js           panels and controls
  audio.js        generated music and sounds
  ...             helpers, layout, clock, nav, wardrobe, bubbles, plants, daycycle
```

## Credits

Built with AI assistance (Claude Code).
