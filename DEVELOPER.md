# 10 Days on Mars — developer notes

A first-person browser game for kids aged 7–12, made for the NASA Space Apps 2026 challenge
"Build a Junior Astronaut Mission Trainer". **Only Day 1 (Solar Storm) is built so far.** Days 2–10 are still to do.
The in-game text is Egyptian Arabic.

## Run it
The game must be served over HTTP. If you open `index.html` straight from disk, the browser blocks the model files from loading. It also needs internet, because three.js and three.quarks load from jsDelivr.

| OS | How |
|---|---|
| macOS | double-click `run-mac.command` (or `شغّل_اللعبة.command`) |
| Windows | double-click `run-windows.bat` |
| Linux / any | `python3 tools/dev_server.py 8779`, then open http://localhost:8779/index.html |

Any static server works, for example `npx serve` or VS Code Live Server. `tools/dev_server.py` only adds a POST endpoint that saves debug screenshots.

## Stack
- **three.js 0.187.0** and **three.quarks 0.17.1** (+ quarks.core 0.17.1), via an import map in `index.html`. There is no build step.
- Everything is in **one file: `index.html`** (HTML + CSS + one ES module).

## Map of `index.html` (search for these headings)
| Section | What's there |
|---|---|
| `SETTINGS & REAL FACTS` | `MISSION_SOLS`, `TRIP_DAYS` (203 = Perseverance's trip), `TIME_SCALE` (1 real s = 1 game min), and `PANELS` (lead / aluminium / HDPE: colour, thickness, strength, result text, robot hint). |
| `MARS & EARTH CLOCKS` | NASA GISS **Mars24** formulas: `marsSolDate`, `lmst` (Jezero local mean solar time), `LANDING` (the next real 07:00 at Jezero), `SOL_END`, and `drawClocks()`. |
| `READY-MADE LIGHTING` | Poly Haven HDRI used as both environment and background. `?sky=pure` switches to the sky-only HDRI. There are **no light objects on purpose**. |
| `REAL MARS TERRAIN` | Loads `assets/terrain/jezero_height.bin` (Float32 257×257, metres, row 0 = north) and `jezero_ortho.jpg`. `heightAt(x,z)` samples it. |
| `MODELS` | `normalize()` scales/centres a model. `kitClone()`/`kit()` take pieces out of the Quaternius **Sci-Fi Kit** (`scifi_kit.glb`) by node name. The kit's pieces sit under a rotated parent, which `kitClone()` handles. |
| `COLLISION` | Simple wall boxes (`wallBox`) and circles (`circ`). |
| `PARTICLES` | `makeFX({...})` wraps a three.quarks `ParticleSystem` with Kenney textures. `setRate()` and `burst()` control it. |
| `WORLD` | `buildWorld()` places the rover, ship, solar panels, dome, rocks, astronaut and robot. `buildBase()` assembles the base from kit pieces (12 × 8 m room, door on the south wall, 3 panel mounts outside). `makePanel()` builds the shield panels. `buildParticles()` sets up the effects. |
| `GAME STATE` | `S` (state), `STEPS` (objectives), plus the `objective()`, `meter()`, `say()` (robot or radio line) and `card()` (popup) UI helpers. |
| `FIRST-PERSON PLAYER` | PointerLockControls. There is a fallback to drag-to-look when pointer lock is refused (embedded viewers, touch). Also `findTarget()` (walls block reach) and `use()`. |
| `DAY 1 STORY` | `roverScreen()`, `robotTalk()`, `testPanel()`, `installPanel()`. |
| `CUTSCENES` | `runCut(shots, onEnd)`: each shot has `dur`, `text` (subtitle), `from`/`to` camera `[[pos],[lookAt]]`, and optional `start()`/`update(k)`. `openingCut()`, `endingCut()`, `finalCard()`. Space or the button skips. |
| `FLOW` / `LOOP` / `BOOT` | `startPlay()` and `checkTriggers()` (enter-base triggers, robot faces the player, idle hints), the render loop, and loading. |

## NASA data (`nasa-live.js`)
The game calls `NASA.init()` at boot (it never waits for it), and reads `NASA.cardHtml()` (rover screen), `NASA.finalHtml()` (end card), `NASA.stormRate()` (particle intensity, 40 when no data) and `NASA.radiationBase()` (where the radiation meter starts, 0.9 when no data).
- **Live:** DONKI (`CME`, `WSAEnlilSimulations` for CMEs predicted to reach Mars, `GST`) through api.nasa.gov, which needs an API key (`?key=...`, saved in localStorage; DEMO_KEY gets rate-limited). Perseverance photo from the mars.nasa.gov raw-images feed (no key). Answers are cached 30-60 min in localStorage.
- **Live through the middleman:** RadLab and OSDR do not send CORS headers, so `tools/dev_server.py` calls them for the page: `GET /proxy/radlab-latest` (RadLab is not real time: its ISS data ends 4 Nov 2024, so the server probes backwards for the newest day and averages DosTel absorbed_dose_rate) and `GET /proxy/osdr?term=...&size=...`. Only those two NASA addresses can be requested. Answers are cached (12 h and 1 h). On a plain web host deploy `proxy/nasa-proxy-worker.js` (Cloudflare Workers) and set `window.NASA_PROXY` before `nasa-live.js` loads. The worker was tested in Node only, not deployed.
- **Archived (`data/nasa_snapshot.json`, rebuilt with `tools/fetch_nasa_snapshot.ps1`):** the fallback for everything when live data is not reachable.
- Every value is tagged `live` or `archived` on screen. Press `I` for the sources panel. `_nasa_test.html` renders the cards without the game.
- The Enlil response shape (`impactList[].location`, `cmeInputs[0].speed`) follows the DONKI docs and was tested with a mocked response only, because DEMO_KEY was rate-limited during testing. Check it once with a real key.

## Rebuilding the assets (done on 14 Nov 2026 because `assets/` was missing)
- `tools/build_kit.html` (needs `tools/dev_server.py` running): loads the 26 OBJ/MTL pieces in `tools/kit_src/` (Quaternius Ultimate Modular Sci-Fi, CC0) and saves them as one `assets/models/scifi_kit.glb` whose node names are the piece names the code asks for.
- `tools/bake_terrain.py` (needs numpy and opencv-python-headless): reads only a 600 m window around the landing site from the USGS Mars 2020 HiRISE DTM and orthoimage through HTTP range requests (both files are uncompressed, one row per strip). It writes `jezero_height.bin` and `jezero_ortho.jpg`. The old `tools/bake_terrain.html` described above is not in this folder; this script replaces it.
- Other models are renamed copies from Quaternius Ultimate Space Kit (`Astronaut`, `Rover`, `Spaceship`, `Base Large`, `Solar Panel`, `Rock`, `Rock Large`). `robot.glb` is three.js RobotExpressive (animations Idle, Wave, ThumbsUp, No).
- DONKI refuses date ranges over 60 days (HTTP 400): the Mars-impact check in `nasa-live.js` uses 30 days.

## Adding Day 2
1. Add the day's objectives (like `STEPS`) and an event function next to `DAY 1 STORY`.
2. Make `finalCard()` go to the next day instead of reloading, and keep `CLK.ms` running so the Mars clock shows "اليوم 2".
3. Reuse `runCut()` for that day's opening and ending.
4. Keep every in-game number tied to a real source, and list it in README.md. The challenge judges score scientific accuracy.

## Debug
- `index.html?debug=1` keeps the game running in a hidden tab and exposes `window.__M` (`tp(x,z,lookX,lookY,lookZ)`, `findTarget()`, `use()`, `skipCut()`, `snap(name)`, which saves to `tools/shots/` through `dev_server.py`).
- `tools/inspect.html` prints model sizes, animation names and the kit's piece list.
- `tools/bake_terrain.html` rebuilds the terrain files from USGS HiRISE data (Jezero, 600 m around the Perseverance landing site). Open it at http://localhost:8779/tools/bake_terrain.html while `dev_server.py` is running, and the server writes the results into `assets/terrain/`. To use a different place on Mars, change `LAT`/`LON` and the DTM URL in that file.

## Known limitations
- No shadows, because lighting comes only from the HDRI.
- No sound. No touch joystick: on tablets you can look around by dragging, but walking needs a keyboard.
- Arabic only.
- Needs internet for the CDN libraries. To work offline, vendor `three`, `three.quarks` and `quarks.core` into a `lib/` folder and update the import map.

## Assets and licences
All models: **Quaternius (CC0)**. Particles: **Kenney Particle Pack (CC0)**. HDRIs: **Poly Haven (CC0)**.
Terrain: **NASA/JPL/University of Arizona HiRISE via USGS Astrogeology** (public NASA data). Full list in `README.md`.
