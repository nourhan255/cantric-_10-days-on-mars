// sim-core.js — headless simulation layer (SHADOW MODE).
// It only READS what the game hands it and COMPUTES. It never writes to the game state S, the scene, the DOM or any asset, and draws nothing.
// Three core resources (challenge rule: max 2-3): energy, oxygen, water (all 0..1 = fraction of capacity).
// ALL NUMBERS in CFG ARE GAMEPLAY PLACEHOLDERS, NOT NASA-DERIVED VALUES. Each `src` note says what must be sourced before a final build.
// Persistence is intentionally DEFERRED (no localStorage use here); add save/restore in a later phase.
//
// Energy input: the number of solar-panel objects that exist in the scene (W.solar, passed in by the game as ctx.solarPanels).
// The radiation-shield (HDPE) panels counted by S.installed have NO influence on energy.

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const INIT = { energy: 0.8, oxygen: 0.9, water: 0.9 };   // placeholders

const CFG = {
  // per game-minute rates (1 real second = 1 game minute, TIME_SCALE in index.html)
  energyUse: { base: 0.0006,     src: 'PLACEHOLDER: base load, to be sourced' },
  energyGen: { perSolarPanel: 0.0003, src: 'PLACEHOLDER: output of one solar panel object, to be sourced' },
  oxygenUse: { perCrew: 0.0004,  src: 'PLACEHOLDER: later replace with a sourced per-person figure' },
  waterUse:  { perCrew: 0.0003,  src: 'PLACEHOLDER: to be sourced' },
  lowThreshold: 0.2,
  crew: 1,
};

// Descriptive map: existing game object -> simulation system. Nothing reads it yet.
const ADAPTER = {
  solar: { system: 'energy',      role: 'producer',  gameObject: 'W.solar (array of solar-panel objects, no per-panel state)' },
  dome:  { system: 'lifeSupport', role: 'habitat',   gameObject: 'W.dome' },
  rover: { system: 'missionOps',  role: 'info',      gameObject: 'W.rover (no logic yet)' },
  robot: { system: 'missionOps',  role: 'assistant', gameObject: 'W.robot (no logic yet)' },
  hdpeShield: { system: 'protection', role: 'shield', gameObject: 'S.installed (radiation shielding only; does NOT affect energy)' },
};

const handlers = {};
const log = [];
const R = { ...INIT };
const low = { energy: false, oxygen: false, water: false };   // resource-warning flags
let started = false, simMinutes = 0, solarWorking = 0;

function on(type, fn) { (handlers[type] ||= []).push(fn); return () => { handlers[type] = (handlers[type] || []).filter(f => f !== fn); }; }
function emit(type, data = {}) {
  try {
    const ev = { type, data, t: simMinutes };
    log.push(ev); if (log.length > 200) log.shift();
    for (const fn of (handlers[type] || []).concat(handlers['*'] || [])) {
      try { fn(ev); } catch (e) { console.warn('[sim] handler error', e); }
    }
    return ev;
  } catch (e) { console.warn('[sim] emit error', e); return null; }
}

export const SIM = {
  resources: R,
  config: CFG,
  adapter: ADAPTER,
  log,
  shadow: true,                       // while true, nothing here may influence the game
  persistence: 'deferred',
  on, emit,
  get minutes() { return simMinutes; },
  get started() { return started; },
  start() { if (started) return; started = true; emit('sim_start', { resources: { ...R } }); },
  // Called every frame during play with real dt (s) and a small read-only context from the game: { solarPanels: n }.
  tick(dt, ctx) {
    if (!started || !(dt > 0)) return;
    const gm = dt;                                  // 1 real s = 1 game min
    simMinutes += gm;
    const n = ctx && Number.isFinite(ctx.solarPanels) ? Math.max(0, ctx.solarPanels) : 0;
    solarWorking = n;
    R.energy = clamp(R.energy + (CFG.energyGen.perSolarPanel * n - CFG.energyUse.base) * gm);
    R.oxygen = clamp(R.oxygen - CFG.oxygenUse.perCrew * CFG.crew * gm * (R.energy > 0.05 ? 1 : 1.5));
    R.water  = clamp(R.water  - CFG.waterUse.perCrew  * CFG.crew * gm);
    for (const k of Object.keys(R)) {
      const isLow = R[k] < CFG.lowThreshold;
      if (isLow && !low[k]) { low[k] = true; emit('resource_low', { resource: k, value: R[k] }); }
      else if (!isLow) low[k] = false;
    }
  },
  snapshot() { return { shadow: SIM.shadow, started, minutes: simMinutes, resources: { ...R }, solarPanels: solarWorking, lowFlags: { ...low } }; },
  // Back to the intended initial state, ready for start().
  reset() {
    Object.assign(R, INIT);
    for (const k of Object.keys(low)) low[k] = false;
    started = false; simMinutes = 0; solarWorking = 0; log.length = 0;
  },
};
