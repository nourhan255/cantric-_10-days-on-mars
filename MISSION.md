# 10-Sol mission layer (Version 2)

One persistent mission: Sol 1 is the original scripted Day 1 (crash, rescue, 30 s exploration, rover message, HDPE challenge). Sols 2-10 run on the same world and the same shared state.

## Files
- `mission.js`: the shared state and ALL simulation rules (no 3D, no DOM): `newState`, `startSol` (daily events), `advance`/`step` (consumption, production, consequences), `adjust` (the only way a task changes a resource), `issues` (unresolved problems), `crewSafety` (derived), `evaluate` (final result), `save`/`load`/`clear`.
- `mission-ui.js`: stations (existing props), the objectives of each Sol, the mini-games (wire puzzle, antenna alignment, Morse), the HUD, the rest/night report, ORBI's guidance system.
- `index.html`: hooks only (`use`, `hintFor`, `objective`, loop, Sol 1 events, start screen).
- `tools/qa_driver.js`: debug helper used for the automatic playthrough (`eval(await (await fetch('tools/qa_driver.js')).text())` in the page console, `?debug=1`).

## How the state connects the days
Energy (battery), Oxygen, Water, Food, shield, habitat, ORBI, radiation exposure, panel dust, leak, recycling, life-support fault, insulation, plants and the SOS flag live in one object. Nothing resets between Sols. When the player rests, the habitat simulates the rest of the day and the night (1 Sol = 1479 game minutes) and shows a report. Problems that were not fixed (`issues()`) keep acting every minute and are listed at the start of the next Sol.

## Persistence
There is no backend in this project, so progress is saved in the browser (`localStorage`, key `mars10:v1`) after every completed task, at the start of each Sol and after the night report. The start screen offers "Continue saved mission". Sol 1 is not saved mid-way (it restarts). The save is cleared when the final result is shown.

## Numbers
Every number (`P` in `mission.js`, thresholds in `crewSafety`, scoring in `evaluate`) is an EDUCATIONAL SIMULATION PARAMETER for game balance, not a NASA measurement. Qualitative statements shown to the player (dust blocks sunlight, Phoenix found perchlorates in Martian soil, SOS = 3 short, 3 long, 3 short, reflective insulation reduces heat loss) still need the usual source check before final submission.

## ORBI guidance
Soft glow on the current objective always; after 20 s without meaningful progress (walking does not count) hint 1, +18 s hint 2 (ring + floor dots + arrow), +18 s hint 3 (the exact interaction, never auto-completed). "Ask ORBI" (key H or the button) gives the next hint on demand. If the player walks far away from the objective, ORBI points the way. If ORBI is damaged (Sol 5) hints come slower, and at 0 he is offline.
