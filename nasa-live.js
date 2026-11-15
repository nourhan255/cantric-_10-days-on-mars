// nasa-live.js
// Live NASA data for "10 أيام على المريخ".
// Every value shown in the game comes with a status: "live" (fetched right now) or "archived" (a saved copy with its date).
// Nothing here is invented. If a service is down, blocked or rate-limited, the game falls back to data/nasa_snapshot.json
// and says so on screen.
//
//   Live from the browser:  DONKI (needs a NASA API key, free), Perseverance raw images (no key)
//   Live through the local middleman (tools/dev_server.py): RadLab and OSDR (their servers do not allow browser calls: no CORS).
//   Without the middleman they fall back to the saved copy and say "archived".
//
// NASA API key: add ?key=YOUR_KEY to the page address once (it is saved in this browser), or paste it in the sources panel.
// Without a key the shared DEMO_KEY is used. It is rate limited, so the game caches answers for one hour.

const DAY = 864e5;
const HOUR = 36e5;
const STORY_DOSE_UGY = 8100;   // 20 May 2024 solar storm, measured by Curiosity RAD (NASA). Same number the game already shows.

const S = { key: 'DEMO_KEY', snap: null, weather: null, photo: null, iss: null, osdr: [], loaded: false };

// ---------- small helpers ----------
const store = {
  get(k, ttl) { try { const o = JSON.parse(localStorage.getItem('nasa:' + k)); if (o && Date.now() - o.t < ttl) return o.v; } catch (e) {} return null; },
  set(k, v) { try { localStorage.setItem('nasa:' + k, JSON.stringify({ t: Date.now(), v })); } catch (e) {} }
};
function readKey() {
  const q = new URLSearchParams(location.search).get('key');
  if (q) { try { localStorage.setItem('nasaKey', q); } catch (e) {} return q; }
  try { return localStorage.getItem('nasaKey') || 'DEMO_KEY'; } catch (e) { return 'DEMO_KEY'; }
}
async function getJson(url, ms = 9000) {
  const c = new AbortController(); const t = setTimeout(() => c.abort(), ms);
  try { const r = await fetch(url, { signal: c.signal }); if (!r.ok) throw new Error('HTTP ' + r.status); return await r.json(); }
  finally { clearTimeout(t); }
}
const iso10 = d => d.toISOString().slice(0, 10);
const nf = n => Number(n).toLocaleString('en-US');
const fmtDate = (s, withTime = false) => {
  try { return new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Cairo', day: 'numeric', month: 'long', year: 'numeric', ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}) }).format(new Date(s)); }
  catch (e) { return String(s); }
};
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// ---------- snapshot (saved copy) ----------
async function loadSnapshot() {
  try { const r = await fetch('data/nasa_snapshot.json'); if (r.ok) return await r.json(); } catch (e) {}
  return null;
}

// ---------- DONKI: space weather ----------
function bestSpeed(cme) {
  const a = (cme.cmeAnalyses || []).find(x => x.isMostAccurate) || (cme.cmeAnalyses || [])[0];
  return a && a.speed ? Math.round(a.speed) : null;
}
function summariseCME(list) {
  const rows = [];
  for (const c of list || []) { const sp = bestSpeed(c); if (sp) rows.push({ speed: sp, time: c.startTime, id: c.activityID }); }
  if (!rows.length) return null;
  const byTime = [...rows].sort((a, b) => (a.time < b.time ? 1 : -1));
  const byFast = [...rows].sort((a, b) => b.speed - a.speed);
  return { count: list.length, withSpeed: rows.length, fastest: byFast[0], latest: byTime[0] };
}
function marsImpact(sims) {
  // DONKI WSA-Enlil simulations list which planets/spacecraft a CME is predicted to reach. We look for Mars.
  const hits = [];
  for (const s of sims || []) {
    for (const im of s.impactList || []) {
      if (String(im.location).toLowerCase() === 'mars') {
        const inp = (s.cmeInputs || [])[0] || {};
        hits.push({ arrival: im.arrivalTime, glancing: !!im.isGlancingBlow, speed: inp.speed ? Math.round(inp.speed) : null, modelTime: s.modelCompletionTime });
      }
    }
  }
  hits.sort((a, b) => (a.arrival < b.arrival ? 1 : -1));
  return hits[0] || null;
}
function makeIntensity(w) { const sp = w && w.fastest ? w.fastest.speed : 1000; return clamp(sp / 1000, 0.5, 1.5); }

async function loadWeather() {
  // DONKI refuses ranges longer than 60 days (HTTP 400), so the Mars check uses the last 30 days.
  const end = new Date(), start30 = new Date(end - 30 * DAY), start90 = start30;
  const ck = 'donki:' + iso10(end);
  const cached = store.get(ck, HOUR);
  if (cached) return { ...cached, status: 'live', cached: true };
  try {
    const k = S.key;
    const [cme, sim, gst] = await Promise.allSettled([
      getJson(`https://api.nasa.gov/DONKI/CME?startDate=${iso10(start30)}&endDate=${iso10(end)}&api_key=${k}`),
      getJson(`https://api.nasa.gov/DONKI/WSAEnlilSimulations?startDate=${iso10(start90)}&endDate=${iso10(end)}&api_key=${k}`),
      getJson(`https://api.nasa.gov/DONKI/GST?startDate=${iso10(start30)}&endDate=${iso10(end)}&api_key=${k}`)
    ]);
    if (cme.status !== 'fulfilled') throw cme.reason;
    const sum = summariseCME(cme.value);
    if (!sum) throw new Error('no CME data');
    let kp = null;
    if (gst.status === 'fulfilled') for (const g of gst.value || []) for (const x of g.allKpIndex || []) kp = Math.max(kp ?? 0, Number(x.kpIndex) || 0);
    const w = { windowDays: 30, ...sum, mars: sim.status === 'fulfilled' ? marsImpact(sim.value) : null, marsChecked: sim.status === 'fulfilled', kpMax: kp, when: new Date().toISOString() };
    w.intensity = makeIntensity(w);
    store.set(ck, w);
    return { ...w, status: 'live' };
  } catch (e) {
    const a = S.snap && S.snap.weather;
    if (a) return { ...a, intensity: makeIntensity(a), status: 'archived', why: String(e.message || e) };
    return null;
  }
}

// ---------- Perseverance: latest real photo from Jezero (no key) ----------
const GOOD_CAMS = /NAVCAM|MCZ|HAZCAM|SKYCAM/;
async function loadPhoto() {
  const ck = 'photo';
  const cached = store.get(ck, 30 * 60e3);
  if (cached) return { ...cached, status: 'live', cached: true };
  try {
    const j = await getJson('https://mars.nasa.gov/rss/api/?feed=raw_images&category=mars2020&feedtype=json&num=40&page=0&order=sol+desc&search=&condition_1=&condition_2=');
    const imgs = (j.images || []).filter(i => i.image_files && i.image_files.medium);
    const pick = imgs.find(i => GOOD_CAMS.test(i.camera && i.camera.instrument || '') && i.sample_type === 'Full') || imgs[0];
    if (!pick) throw new Error('no images');
    const p = { url: pick.image_files.medium, large: pick.image_files.large || pick.image_files.medium, sol: pick.sol, utc: pick.date_taken_utc, camera: pick.camera.instrument, credit: pick.credit, id: pick.imageid, when: new Date().toISOString() };
    store.set(ck, p);
    return { ...p, status: 'live' };
  } catch (e) {
    const a = S.snap && S.snap.photo;
    if (a) return { ...a, status: 'archived', why: String(e.message || e) };
    return null;
  }
}

// ---------- RadLab and OSDR ----------
// Their servers block browser calls from other sites (no CORS), so the page asks the local middleman instead
// (tools/dev_server.py: /proxy/radlab-latest and /proxy/osdr). If the middleman is not there (for example the game is
// on a plain web host), the saved copy from data/nasa_snapshot.json is used and marked "archived".
function loadArchivedExtras() {
  const r = S.snap && S.snap.radlab;
  S.iss = r ? { ...r, status: 'archived', daysEquivalent: STORY_DOSE_UGY / (r.avgUGyPerHour * 24) } : null;
  S.osdr = (S.snap && S.snap.osdr) || [];
  S.osdrStatus = 'archived';
}
// On a plain web host there is no local middleman: deploy proxy/nasa-proxy-worker.js and set  window.NASA_PROXY = 'https://your-worker.workers.dev'  before this file loads.
const PROXY = (typeof window !== 'undefined' && window.NASA_PROXY) || '';
async function loadIssLive() {
  try {
    const j = await getJson(PROXY + '/proxy/radlab-latest', 60000);
    if (!j || !j.avgUGyPerHour) throw new Error('empty');
    S.iss = { avgUGyPerHour: j.avgUGyPerHour, n: j.n, window: fmtDate(j.date) + ' (latest day of data in RadLab)', status: 'live', daysEquivalent: STORY_DOSE_UGY / (j.avgUGyPerHour * 24), fetchedAt: j.fetchedAt };
  } catch (e) { /* keep the saved copy */ }
}
async function loadOsdrLive() {
  try {
    const j = await getJson(PROXY + '/proxy/osdr?term=space%20radiation&size=12', 30000);
    const list = [];
    for (const h of (j.hits && j.hits.hits) || []) {
      const t = h._source && h._source['Study Title'], a = h._source && h._source['Accession'];
      if (t && a && /^OSD-/.test(a) && /radiation/i.test(t)) list.push({ accession: a, title: t });
    }
    if (list.length) { S.osdr = list.slice(0, 3); S.osdrStatus = 'live'; }
  } catch (e) { /* keep the saved copy */ }
}

// ---------- public API ----------
async function init() {
  S.key = readKey();
  S.snap = await loadSnapshot();
  loadArchivedExtras();
  const [w, p] = await Promise.all([loadWeather(), loadPhoto()]);
  S.weather = w; S.photo = p; S.loaded = true;
  updateBadge();
  // the middleman answers more slowly (RadLab can take ~10 s the first time), so these update in the background
  Promise.all([loadIssLive(), loadOsdrLive()]).then(updateBadge);
  return S;
}
const overall = () => (S.weather && S.weather.status === 'live') || (S.photo && S.photo.status === 'live') ? 'live' : (S.weather || S.photo || S.iss) ? 'archived' : 'none';
const stormIntensity = () => (S.weather ? S.weather.intensity : 1);
// how strong the particle storm looks (the game's old fixed value was 40)
const stormRate = () => Math.round(clamp(24 + (stormIntensity() - 0.5) * 40, 24, 64));
// where the radiation meter inside the base starts (the game's old fixed value was 0.9)
const radiationBase = () => clamp(0.7 + (stormIntensity() - 0.5) * 0.25, 0.7, 0.95);

const tag = st => st === 'live' ? '<span class="nl-tag nl-live">LIVE</span>' : st === 'archived' ? '<span class="nl-tag nl-arch">SAVED</span>' : '<span class="nl-tag nl-none">NOT USED</span>';
function cardHtml() {
  if (!S.loaded) return '<div class="nl-block">Loading NASA data...</div>';
  const w = S.weather, p = S.photo, r = S.iss;
  let h = '<div class="nl-block">';
  if (p) h += `<div class="nl-h">A real photo from Jezero ${tag(p.status)}</div><img class="nl-img" src="${p.url}" alt="Perseverance"><div class="nl-cap">Latest image from the Perseverance rover · sol ${p.sol} on Mars · camera ${p.camera} · ${fmtDate(p.utc)}${p.status === 'archived' ? ' (saved photo)' : ''}</div>`;
  if (w) {
    h += `<div class="nl-h">Space weather (NASA DONKI) ${tag(w.status)}</div>`;
    h += `<div>In the last ${w.windowDays} days NASA recorded <b>${nf(w.count)}</b> coronal mass ejections (CMEs) from the Sun. The fastest was <b>${nf(w.fastest.speed)}</b> km/s on ${fmtDate(w.fastest.time)}.</div>`;
    if (w.mars) h += `<div>A NASA model predicted that a CME would reach <b>Mars</b> on ${fmtDate(w.mars.arrival, true)}${w.mars.glancing ? ' (a glancing blow)' : ''}.</div>`;
    else if (w.marsChecked) h += '<div class="nl-small">Last 30 days: NASA models predict no CME reaching Mars.</div>';
    if (w.kpMax != null) h += `<div class="nl-small">Highest geomagnetic storm index at Earth: Kp ${w.kpMax}</div>`;
    h += `<div class="nl-small">The strength of the radiation event in the game is based on the fastest CME (${nf(w.fastest.speed)} km/s).</div>`;
  }
  if (r) h += `<div class="nl-h">Radiation on the space station (RadLab) ${tag(r.status)}</div><div>Average dose on the station: <b>${r.avgUGyPerHour.toFixed(1)}</b> micrograys per hour (${r.window}). The 20 May 2024 storm next to Curiosity = about <b>${r.daysEquivalent.toFixed(0)}</b> days of dose on the station.</div><div class="nl-small">The average changes from day to day (the station's orbit passes through areas with more radiation), so this comparison is approximate.</div>`;
  h += '</div>';
  return h;
}
function finalHtml() {
  const o = S.osdr && S.osdr[0];
  if (!o) return '';
  return `<div class="nl-block"><div class="nl-h">Real NASA science (OSDR) ${tag(S.osdrStatus || 'archived')}</div><div>NASA studies how deep-space radiation affects the body. Example: <b>${o.title}</b> (${o.accession}).</div></div>`;
}

// very short versions for the swipeable cards: one photo and one line each
function cardShort() {
  if (!S.loaded) return '<div class="nl-small">Loading NASA data...</div>';
  const w = S.weather, p = S.photo; let h = '';
  if (p) h += `<img class="nl-img" style="max-height:140px" src="${p.url}" alt="Perseverance"><div class="nl-cap">A real photo from Jezero · Perseverance rover ${tag(p.status)}</div>`;
  if (w) h += `<div>NASA saw <b>${nf(w.count)}</b> solar eruptions in ${w.windowDays} days. The fastest: <b>${nf(w.fastest.speed)}</b> km/s. ${tag(w.status)}</div>`;
  return h;
}
function finalShort() {
  const o = S.osdr && S.osdr[0]; if (!o) return '';
  return `<div class="nl-small">Real NASA science (${o.accession}): ${o.title} ${tag(S.osdrStatus || 'archived')}</div>`;
}

// ---------- on-screen status badge + sources panel ----------
const css = `
.nl-block{margin-top:10px;padding-top:8px;border-top:1px solid rgba(255,255,255,.14);font-size:15px;line-height:1.7;text-align:left}
.nl-h{font-weight:700;margin:6px 0 2px;color:#ffd08a}
.nl-img{width:100%;max-height:210px;object-fit:cover;border-radius:10px;margin:4px 0;background:#0b0b10}
.nl-cap,.nl-small{font-size:12px;color:#c9c1b6}
.nl-tag{display:inline-block;font-size:11px;font-weight:700;border-radius:99px;padding:0 8px;margin-right:6px;vertical-align:middle}
.nl-live{background:#58c98b;color:#06210f}.nl-arch{background:#e2a845;color:#2b1a00}.nl-none{background:#555b6e;color:#fff}
#nl-badge{position:fixed;bottom:14px;right:14px;z-index:6;font:inherit;font-size:14px;padding:5px 12px;border-radius:10px;border:1px solid rgba(255,255,255,.14);background:rgba(12,14,22,.78);color:#f4f1ec;cursor:pointer}
#nl-panel{position:fixed;inset:0;z-index:30;display:none;align-items:center;justify-content:center;background:rgba(8,5,3,.65);padding:14px}
#nl-panel .nl-box{background:rgba(12,14,22,.96);border:1px solid rgba(255,255,255,.14);border-radius:18px;padding:14px 18px;width:min(640px,100%);max-height:92vh;overflow:auto;line-height:1.6;color:#f4f1ec}
#nl-panel h3{margin:0 0 6px;font-size:20px}
#nl-panel table{width:100%;border-collapse:collapse;font-size:14px}
#nl-panel td{border-top:1px solid rgba(255,255,255,.12);padding:5px 4px;vertical-align:top}
#nl-panel input{font:inherit;width:100%;padding:5px 8px;border-radius:8px;border:1px solid rgba(255,255,255,.25);background:#1b2030;color:#fff;direction:ltr}
#nl-panel button{font:inherit;font-weight:700;padding:6px 16px;border-radius:10px;border:0;background:#d8693a;color:#fff;cursor:pointer;margin-top:8px}
`;
function injectUI() {
  if (document.getElementById('nl-badge')) return;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  const b = document.createElement('button'); b.id = 'nl-badge'; b.onclick = openSources; document.body.appendChild(b);
  const p = document.createElement('div'); p.id = 'nl-panel'; document.body.appendChild(p);
  p.addEventListener('click', e => { if (e.target === p) p.style.display = 'none'; });
  addEventListener('keydown', e => { if (e.code === 'KeyI' && !e.repeat && !/INPUT|TEXTAREA/.test(document.activeElement && document.activeElement.tagName)) togglePanel(); if (e.code === 'Escape') p.style.display = 'none'; });
  updateBadge();
}
function updateBadge() {
  const b = document.getElementById('nl-badge'); if (!b) return;
  const o = overall();
  b.textContent = !S.loaded ? 'NASA data: loading...' : o === 'live' ? 'NASA data: LIVE ● (I)' : o === 'archived' ? 'NASA data: saved copy (I)' : 'NASA data: unavailable (I)';
}
function row(name, st, note) { return `<tr><td>${name}</td><td>${tag(st)}</td><td>${note}</td></tr>`; }
function togglePanel() { const p = document.getElementById('nl-panel'); if (p.style.display === 'flex') p.style.display = 'none'; else openSources(); }
function openSources() {
  const p = document.getElementById('nl-panel'); if (!p) return;
  const w = S.weather, ph = S.photo, when = x => (x && x.when ? fmtDate(x.when, true) : '');
  const rows = [
    row('DONKI (NASA Open APIs): space weather', w ? w.status : 'none', w ? `Solar eruptions (CMEs) + predictions of their arrival at Mars. ${w.status === 'live' ? 'Fetched ' + when(w) : 'Saved copy ' + fmtDate((S.snap && S.snap.fetchedAt) || '')}${w.why ? ' (reason: ' + w.why + ')' : ''}` : 'Not available'),
    row('Perseverance raw images (mars.nasa.gov)', ph ? ph.status : 'none', ph ? `Latest real photo from Jezero crater. ${ph.status === 'live' ? 'Fetched ' + when(ph) : 'Saved copy'}` : 'Not available'),
    row('RadLab (OSDR): space station radiation doses', S.iss ? S.iss.status : 'none', S.iss ? (S.iss.status === 'live' ? 'Fetched now through the local helper server (play-mars.bat). RadLab is not real time: its latest ISS data stops in November 2024.' : 'The RadLab server does not let web pages call it directly. Without the helper server we use saved measurements with their dates.') : 'Not available'),
    row('OSDR: NASA life-science research', S.osdr.length ? (S.osdrStatus || 'archived') : 'none', S.osdrStatus === 'live' ? 'Fetched now through the helper server. Shown on the final card.' : 'Saved copy (no helper server). Shown on the final card.'),
    row('Mars Trek / HiRISE: Jezero crater terrain', 'archived', 'The 3D ground is built from the HiRISE elevation map (NASA/JPL/Univ. of Arizona via USGS), the same data family as Mars Trek. Converted once.'),
    row('NASA GISS Mars24: the Mars clock', 'live', 'A formula calculated inside the game, no internet needed.'),
    row('Curiosity RAD: solar storm of 20 May 2024', 'archived', 'A fixed number from NASA (8,100 micrograys).'),
    row('APOD and Mars Rover Photos API', 'none', 'Not used. We used the official Perseverance image feed instead.'),
    row('CSA: food in space', 'none', 'Will be used in the farming days (Day 2 and later).')
  ].join('');
  p.innerHTML = `<div class="nl-box"><h3>Data sources in the game</h3><table>${rows}</table>
    <div style="margin-top:10px" class="nl-small">NASA API key (free from api.nasa.gov): ${S.key === 'DEMO_KEY' ? 'currently using the shared DEMO_KEY, which gets blocked if it is asked too often.' : 'saved in this browser.'}</div>
    <input id="nl-key" placeholder="Paste your key here" value="${S.key === 'DEMO_KEY' ? '' : S.key}">
    <button id="nl-save">Save and reload</button> <button id="nl-close" style="background:#2a3044">Close</button></div>`;
  p.style.display = 'flex';
  document.getElementById('nl-close').onclick = () => { p.style.display = 'none'; };
  document.getElementById('nl-save').onclick = () => { const v = document.getElementById('nl-key').value.trim(); try { if (v) localStorage.setItem('nasaKey', v); else localStorage.removeItem('nasaKey'); Object.keys(localStorage).filter(k => k.startsWith('nasa:')).forEach(k => localStorage.removeItem(k)); } catch (e) {} location.reload(); };
}

export const NASA = { state: S, init, injectUI, cardHtml, finalHtml, cardShort, finalShort, openSources, stormRate, radiationBase, stormIntensity, overall };
