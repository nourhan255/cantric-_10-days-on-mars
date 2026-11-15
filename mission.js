// mission.js: the ONE shared mission state and the simulation rules for the 10-Sol mission (no 3D, no DOM).
// Every number here is an EDUCATIONAL SIMULATION PARAMETER chosen for game balance. None of them is a NASA measurement.
// Rates are per game-minute; 1 Sol = 1479 game-minutes (24 h 39 m 35 s). Resources are fractions 0..1.
//
// Centralised functions (the mini-games in mission-ui.js never touch resources directly; they call these):
//   newState / startSol (daily events) / advance (consumption, production, consequences) / complete (objective bookkeeping)
//   crewSafety (derived) / issues (unresolved problems) / evaluate (final result) / save, load, clear (local persistence)

export const KEY = 'mars10:v1';
export const SOL_MIN = 1479;
export const P = {
  solarMax: 0.0019,                       // output of the 3-panel array at full sun when clean
  baseLoad: 0.00026, lsLoad: 0.00012, recLoad: 0.00006, lightLoad: 0.00004, orbiLoad: 0.00003,
  heatLoad: 0.00024,                      // extra heating load at full cold with no insulation
  crewO2: 0.00010, lsO2: 0.00010, faultO2Loss: 0.00020, plantO2: 0.000004,
  crewWater: 0.00006, recoverFrac: 0.88, leakWater: 0.00010, plantWater: 0.000006,
  crewFood: 0.00003, grow: 0.00035, yield: 0.12,
  dustPerSol: 0.05, dustHit: 0.6,         // dust slowly returns; fully dusty panels lose 60% of their output
  bgRad: 0.00002, shieldCut: 0.75, outsideRad: 3,
};
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const mean = a => a.reduce((s, x) => s + x, 0) / a.length;

export function newState() {
  return { v: 1, sol: 1, res: { energy: 0.5, oxygen: 0.9, water: 0.9, food: 0.6 },
    shield: 0, habitat: 1, orbi: 1, exposure: 0, panelDust: [0, 0, 0],
    leak: false, recycling: false, o2Fault: false, cold: 0, insul: 0, windows: { w: false, e: false }, blanket: 0,
    plants: [], commDown: false, sos: false, shieldLoose: false, suit: false,
    done: {}, log: [], flags: {}, lastClk: 0,
    alloc: { air: true, rec: true, light: true, heat: true } };   // power switches: every ON costs energy, every OFF costs something else
}

// ---------- the simulation step (the only place where resources change) ----------
const daylight = h => (h >= 6 && h <= 18) ? Math.sin(Math.PI * (h - 6) / 12) : 0;   // simple sun curve over local Mars time
export function step(ms, dt, hour, outside = false) {
  const r = ms.res, day = daylight(hour), on = r.energy > 0.02;
  const gen = P.solarMax / 3 * ms.panelDust.reduce((s, d) => s + (1 - P.dustHit * d), 0) * day;
  const alive = ms.plants.filter(p => !p.dead && !p.harvested), A = ms.alloc || { air: true, rec: true, light: true, heat: true };
  let load = P.baseLoad + (ms.orbi > 0.15 ? P.orbiLoad : 0);
  if (on) { if (A.air) load += P.lsLoad; if (ms.recycling && A.rec) load += P.recLoad; if (A.light) load += P.lightLoad * alive.length; }
  if (ms.cold > 0 && A.heat) load += P.heatLoad * ms.cold * (1 - ms.insul) * (day > 0.05 ? 1 : 1.4);
  r.energy = clamp(r.energy + (gen - load) * dt);
  const lsGen = (on && A.air) ? (ms.o2Fault ? P.lsO2 * 0.1 : P.lsO2) : 0;
  const plantO2 = alive.reduce((s, p) => s + P.plantO2 * clamp(p.g) * p.h, 0);
  r.oxygen = clamp(r.oxygen + (lsGen + plantO2 - P.crewO2 - (ms.o2Fault ? P.faultO2Loss : 0)) * dt);
  const rec = (on && ms.recycling && A.rec) ? P.crewWater * P.recoverFrac : 0;
  r.water = clamp(r.water + (rec - P.crewWater - alive.length * P.plantWater - (ms.leak ? P.leakWater : 0)) * dt);
  r.food = clamp(r.food - P.crewFood * ((ms.cold > 0.5 && A.heat === false) ? 1.8 : 1) * dt);   // a freezing crew burns more food
  for (const p of alive) {                                                   // plants need water and light power over time
    const ok = on && A.light && r.water > 0.1, frozen = ms.cold > 0.5 && !A.heat;
    p.g = Math.min(1, p.g + (ok ? P.grow * (0.4 + 0.6 * p.h) * dt : 0));
    p.h = clamp(p.h + (ok ? 0.0002 : -0.0004) * dt - (frozen ? 0.0003 * dt : 0));
    if (p.h <= 0) p.dead = true;
  }
  ms.exposure = clamp(ms.exposure + P.bgRad * (1 - P.shieldCut * ms.shield) * (outside ? P.outsideRad : 1) * dt);
  for (let i = 0; i < 3; i++) ms.panelDust[i] = clamp(ms.panelDust[i] + P.dustPerSol / SOL_MIN * dt);
  return { gen, load };
}
// instantaneous energy numbers per game hour (for the power-control screen)
export function rates(ms, hour) { const c = JSON.parse(JSON.stringify(ms)); const r = step(c, 0.0001, hour); return { gen: r.gen * 60, load: r.load * 60 }; }
export function advance(ms, minutes, startHour, outside = false, stepMin = 5) {
  let t = 0; while (t < minutes) { const d = Math.min(stepMin, minutes - t); step(ms, d, (startHour + (t + d / 2) / 60) % 24, outside); t += d; }
}

// The only way a task may change a resource (so mini-games never contain their own resource logic).
export function adjust(ms, res, delta) { ms.res[res] = clamp(ms.res[res] + delta); return ms.res[res]; }

// ---------- daily events: what happens when a Sol begins (problems stay until they are fixed) ----------
export const SOL_TITLES = ['', 'Emergency Landing & Radiation Protection', 'Dust & Energy', 'Water Leak', 'Food Production', 'ORBI Repair',
  'Extreme Cold', 'Oxygen System', 'Full Resource Inspection', 'Communication Failure', 'Final Mission Checklist'];
export function startSol(ms, n) {
  ms.sol = n; ms.suit = false;
  if (n === 2) ms.panelDust = ms.panelDust.map(d => Math.max(d, 0.7));
  if (n === 3) ms.leak = true;
  if (n === 5) ms.orbi = Math.min(ms.orbi, 0.25);
  if (n === 6) ms.cold = 1;
  if (n === 7) ms.o2Fault = true;
  if (n === 8) { ms.shieldLoose = true; ms.shield = clamp(ms.shield - 0.25); }
  if (n === 9) ms.commDown = true;
  if (n > 6) ms.cold = n === 7 ? 0.7 : n === 8 ? 0.55 : 0.4;   // the cold spell eases off after Sol 6 but never disappears   // after Sol 6 the nights stay cold, so insulation keeps mattering
}
export function sunriseAdjust(ms) {   // overnight consequences that are not in the per-minute rules
  const bad = issues(ms).length;
  ms.habitat = clamp(ms.habitat - 0.04 * bad + (bad === 0 ? 0.02 : 0) - ((ms.cold > 0.5 && ms.alloc && ms.alloc.heat === false) ? 0.12 : 0));
  if (ms.cold > 0.5 && ms.alloc && ms.alloc.heat === false) ms.flags.freezeSols = (ms.flags.freezeSols || 0) + 1;
  if (ms.orbi < 0.9 && ms.orbi > 0 && !(ms.flags.orbiFixed)) ms.orbi = clamp(ms.orbi - 0.06, 0.05, 1);
}

// ---------- unresolved problems (they carry over to the next Sol) ----------
export function issues(ms) {
  const L = [], sol = ms.sol;
  if (sol >= 2 && mean(ms.panelDust) > 0.35) L.push({ id: 'dust', text: 'Dust on the solar panels is cutting electricity.' });
  if (ms.leak) L.push({ id: 'leak', text: 'A water leak keeps draining the tanks.' });
  if (sol >= 3 && !ms.recycling) L.push({ id: 'recycling', text: 'Water recycling is OFF, so every drink is lost.' });
  if (sol >= 5 && ms.orbi < 0.6) L.push({ id: 'orbi', text: 'ORBI is damaged and helps less.' });
  if (ms.cold > 0.5 && ms.insul < 0.4) L.push({ id: 'insul', text: 'The habitat loses heat, so heaters burn extra energy.' });
  if (ms.o2Fault) L.push({ id: 'o2', text: 'The air filter fault keeps oxygen falling.' });
  if (sol >= 8 && ms.shieldLoose) L.push({ id: 'shield', text: 'A radiation-shield panel is loose.' });
  if (sol >= 9 && ms.commDown) L.push({ id: 'comm', text: 'No contact with Earth.' });
  const A = ms.alloc || {};
  if (A.air === false) L.push({ id: 'air', text: 'The air maker is switched OFF, so oxygen is falling.' });
  if (ms.recycling && A.rec === false) L.push({ id: 'rec', text: 'The water recycler is OFF, so water is not saved.' });
  if (ms.plants.length && A.light === false) L.push({ id: 'light', text: 'Plant lights are OFF, so plants are not growing.' });
  if (ms.cold > 0.5 && A.heat === false) L.push({ id: 'heat', text: 'The heater is OFF, so the base is freezing and plants suffer.' });
  if (sol >= 6 && ms.plants.length === 0) L.push({ id: 'plants', text: 'No plants growing, so food only goes down.' });
  return L;
}


// Safety net for children: a dangerous problem that stays unsolved for 3 Sol starts is repaired by ORBI in an emergency.
// The damage already done stays, and every emergency repair costs score, so the consequence is kept but the mission stays recoverable.
export function emergencyFix(ms) {
  const age = (ms.flags.age = ms.flags.age || {}), ids = issues(ms).map(i => i.id), done = [];
  for (const k of Object.keys(age)) if (!ids.includes(k)) delete age[k];
  ids.forEach(k => { age[k] = (age[k] || 0) + 1; });
  const fx = { leak: m => { m.leak = false; adjust(m, 'water', 0.15); }, o2: m => { m.o2Fault = false; adjust(m, 'oxygen', 0.2); }, insul: m => { m.windows = { w: true, e: true }; m.blanket = 2; m.insul = 1; adjust(m, 'energy', 0.05); },
    dust: m => { m.panelDust = [0.08, 0.08, 0.08]; adjust(m, 'energy', 0.05); }, recycling: m => { m.recycling = true; }, shield: m => { m.shieldLoose = false; m.shield = Math.min(1, m.shield + 0.25); } };   // each repair also draws a little from the emergency reserves
  const LIMIT = { dust: 2 };
  for (const k of Object.keys(fx)) if (age[k] >= (LIMIT[k] || 3)) { fx[k](ms); delete age[k]; ms.flags.assisted = (ms.flags.assisted || 0) + 1; done.push(k); }
  return done;
}
// ---------- crew safety: derived (not a resource). Each factor has its own thresholds (gameplay values) ----------
const LV = ['Safe', 'Caution', 'Warning', 'Critical'];
export function crewSafety(ms) {
  const r = ms.res, f = [];
  const lv = (v, c, w, k) => v < k ? 3 : v < w ? 2 : v < c ? 1 : 0;
  f.push([lv(r.oxygen, 0.5, 0.35, 0.2), 'Oxygen is low']);
  f.push([lv(r.water, 0.35, 0.2, 0.1), 'Water is low']);
  f.push([lv(r.food, 0.3, 0.15, 0.05), 'Food is low']);
  f.push([r.energy < 0.02 ? 3 : r.energy < 0.08 ? 2 : r.energy < 0.2 ? 1 : 0, 'Power is low, life support may stop']);
  f.push([ms.exposure > 0.85 ? 3 : ms.exposure > 0.6 ? 2 : ms.exposure > 0.4 ? 1 : 0, 'Radiation exposure is high']);
  f.push([ms.habitat < 0.3 ? 2 : ms.habitat < 0.55 ? 1 : 0, 'The habitat is damaged']);
  f.push([(ms.cold > 0.5 && ms.alloc && ms.alloc.heat === false) ? 2 : 0, 'The heater is OFF: the base is freezing']);
  let worst = f[0]; for (const x of f) if (x[0] > worst[0]) worst = x;
  return { level: worst[0], label: LV[worst[0]], cause: worst[0] ? worst[1] : 'All systems normal' };
}

// ---------- final evaluation ----------
export function evaluate(ms) {
  const r = ms.res, cs = crewSafety(ms), iss = issues(ms), alive = ms.plants.filter(p => !p.dead);
  const parts = [
    ['Energy', Math.min(1, r.energy / 0.6), 0.15], ['Oxygen', Math.min(1, r.oxygen / 0.6), 0.2], ['Water', Math.min(1, r.water / 0.6), 0.15], ['Food', Math.min(1, r.food / 0.6), 0.15],
    ['Radiation protection', clamp(1 - ms.exposure) * (0.5 + 0.5 * ms.shield), 0.1], ['Habitat condition', ms.habitat, 0.1],
    ['ORBI condition', ms.orbi, 0.05], ['Plants', alive.length ? mean(alive.map(p => p.h)) : 0, 0.05], ['Contact with Earth', ms.sos ? 1 : 0, 0.05]];
  const assisted = (ms.flags && ms.flags.assisted) || 0;
  const score = Math.round(100 * parts.reduce((s, p) => s + p[1] * p[2], 0) - 4 * iss.length - 8 * assisted - 5 * ((ms.flags && ms.flags.freezeSols) || 0));
  const crit = r.oxygen < 0.1 || r.water < 0.05 || r.energy < 0.02 || cs.level === 3;
  const outcome = (!crit && score >= 80 && ms.sos) ? 'SUCCESS' : (crit || score < 40) ? 'FAILURE' : 'PARTIAL SUCCESS';
  const why = [];
  if (crit) why.push('A life-critical system is out of range: ' + cs.cause + '.');
  for (const i of iss) why.push(i.text);
  if (ms.flags && ms.flags.freezeSols) why.push('The heater was OFF for ' + ms.flags.freezeSols + ' cold Sol(s): saving energy cost us comfort and health.');
  if (assisted) why.push('ORBI had to finish ' + assisted + ' task(s) for you.');
  if (!ms.sos) why.push('The SOS was never sent, so Earth could not confirm the return plan.');
  if (!iss.length && ms.sos && !crit) why.push('Every system was maintained and Earth confirmed the return plan.');
  return { outcome, score: Math.max(0, score), parts, why, crewSafety: cs };
}

// ---------- local persistence (no backend exists in this project; this is the reliable fallback) ----------
export function save(ms) { try { localStorage.setItem(KEY, JSON.stringify(ms)); return true; } catch (e) { return false; } }
export function load() { try { const o = JSON.parse(localStorage.getItem(KEY)); return (o && o.v === 1 && o.sol >= 1) ? (o.alloc = o.alloc || { air: true, rec: true, light: true, heat: true }, o) : null; } catch (e) { return null; } }
export function clear() { try { localStorage.removeItem(KEY); } catch (e) { } }













