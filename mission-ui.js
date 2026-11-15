// mission-ui.js: the playable layer of the 10-Sol mission (Sols 2-10), the HUD, and ORBI's guidance system.
// It reuses the existing world (stations are existing props/panels/rover/robot), the existing card/say UI and the existing interaction (E / click).
// All resource changes go through mission.js (adjust / advance / startSol). Numbers are educational simulation parameters.
import * as M from './mission.js';

export function createMission(ctx) {
  const { THREE, scene, camera, W, S, T, CLK, $, say, isInside, heightAt } = ctx;
  let ms = M.newState();
  let active = false;                 // true once Sols 2-10 are running (Sol 1 uses the original scripted flow)
  let L = [];                         // objectives still to do today
  let totalToday = 0;
  const ST = {}, byObj = new Map();   // stations: id -> {obj,name}
  const G = { lvl: 0, lastProgress: 0, askUntil: 0, askLvl: 0, lastLost: -1e9, lostShow: -1e9, distHist: [] };
  const warned = {};
  let lastClk = null, hudT = 0, ending = false, cleanEnd = 0, restOpen = false, t0 = 0, wasInside = false;

  // ------------------------------------------------------------------ styles + HUD (extends the existing UI look)
  const st = document.createElement('style');
  st.textContent = `#res{position:fixed;top:70px;left:12px;width:210px;background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:6px 10px;pointer-events:none;display:none;font-size:13px}
#res .row{display:flex;align-items:center;gap:6px;margin-top:3px}#res .row b{width:52px;font-weight:600}#res .bar{flex:1;margin:0;height:8px}
#res .sol{font-weight:800;font-size:15px}#res .warn{color:#ffb36b;font-size:12px;margin-top:4px}
#ask{position:fixed;bottom:56px;right:14px;z-index:6;font:inherit;font-size:14px;padding:5px 12px;border-radius:10px;border:1px solid var(--line);background:rgba(12,14,22,.78);color:#f4f1ec;cursor:pointer;display:none}
#arrow{position:fixed;left:50%;top:92px;width:46px;height:46px;margin-left:-23px;pointer-events:none;display:none;font-size:38px;line-height:46px;text-align:center;color:#7fd4ff;text-shadow:0 0 10px #38a8ff}
#helmet{position:fixed;inset:0;pointer-events:none;display:none;box-shadow:inset 0 0 120px 40px rgba(0,0,0,.65);border-radius:40px}
.mp .big{font-size:19px;font-weight:700}.mp .row2{display:flex;gap:8px;align-items:center;margin:4px 0}.mp .row2 b{width:70px}.mp .sm{font-size:13px;color:#c9c1b6}
.mp button.opt{font:inherit;font-weight:700;font-size:17px;border:0;border-radius:10px;padding:7px 18px;margin:4px;background:#2a3044;color:#fff;cursor:pointer}
.mp button.opt:hover{background:#3a4366}.mp .term{display:inline-block;width:46px;height:46px;border-radius:50%;margin:6px 22px;border:3px solid #fff;cursor:pointer}
.mp .sel{outline:4px solid #fff}.mp img.map{width:100%;max-height:200px;object-fit:cover;border-radius:10px}
.mp input[type=range]{width:100%}.mp .morse{font-size:30px;letter-spacing:6px;min-height:40px}
.mp .slide{min-height:118px;font-size:19px;line-height:1.5}.mp .slide h3{font-size:23px;margin:2px 0 8px}.mp .dots{text-align:center;margin:8px 0 4px}
.mp .dots span{display:inline-block;width:10px;height:10px;border-radius:50%;background:#555b6e;margin:0 4px}.mp .dots span.on{background:#ffd08a}.mp .nav{text-align:center}.mp .nav .opt{padding:6px 14px}
#res .why{font-size:11.5px;color:#ffb36b;margin-top:2px}
#skipTask{position:fixed;bottom:152px;right:14px;z-index:6;font:inherit;font-size:14px;padding:5px 12px;border-radius:10px;border:1px solid #ffb36b;background:rgba(40,24,10,.85);color:#ffd9b0;cursor:pointer;display:none}`;
  document.head.appendChild(st);
  const res = document.createElement('div'); res.id = 'res'; document.body.appendChild(res);
  const askBtn = document.createElement('button'); askBtn.id = 'ask'; askBtn.textContent = 'Ask ORBI (H)'; document.body.appendChild(askBtn);
  const arrow = document.createElement('div'); arrow.id = 'arrow'; arrow.textContent = '▲'; document.body.appendChild(arrow);
  const helmet = document.createElement('div'); helmet.id = 'helmet'; document.body.appendChild(helmet);
  askBtn.onclick = () => ask();

  // ------------------------------------------------------------------ stations (existing objects)
  function reg(id, obj, name, makeInteractive) {
    if (!obj) return; ST[id] = { id, obj, name }; byObj.set(obj, id);
    if (makeInteractive) ctx.interactive(obj, { kind: 'station', id });
  }
  function setup() {
    reg('console', W.testPc, 'Mission computer'); byObj.set(W.testPad, 'console');
    reg('orbi', W.robot, 'ORBI'); reg('comm', W.rover, 'Communication antenna on the rover');
    (W.mounts || []).forEach((m, i) => reg('shield' + i, m, 'Radiation shield panel'));
    reg('planter', W.crates.lead.crate, 'Hydroponic tray'); byObj.set(W.crates.lead.stack, 'planter');
    reg('blanket', W.crates.alu.crate, 'Reflective blankets'); byObj.set(W.crates.alu.stack, 'blanket');
    reg('crateH', W.crates.hdpe.crate, 'Spare panel crate'); byObj.set(W.crates.hdpe.stack, 'crateH');
    reg('suit', W.container, 'Spacesuit locker', true);
    reg('vesselT', W.vesselT, 'Tall tank', true); reg('vessel', W.vessel, 'Small tank', true);
    reg('shelfL', W.shelfL, 'Shelf', true); reg('shelfM', W.shelfM, 'Shelf', true); reg('shelfR', W.shelfR, 'Shelf', true);
    reg('podA', W.pod1, 'Sleeping pod', true); reg('podB', W.pod2, 'Sleeping pod', true);
    reg('winW', W.winW, 'West window', true); reg('winE', W.winE, 'East windows', true);
    (W.solar || []).forEach((p, i) => reg('solar' + i, p, 'Solar panel ' + (i + 1), true));
    ST.door = { id: 'door', obj: null, pos: new THREE.Vector3(0, 0, 3.8), name: 'base door' };   // a place, not an object
    // floor ring + path dots (guidance markers; plain geometry, no new assets)
    ring = new THREE.Mesh(new THREE.RingGeometry(0.55, 0.8, 40), new THREE.MeshBasicMaterial({ color: 0x6fd0ff, transparent: true, opacity: 0.7, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2; ring.visible = false; scene.add(ring);
    for (let i = 0; i < 14; i++) { const d = new THREE.Mesh(new THREE.CircleGeometry(0.17, 16), new THREE.MeshBasicMaterial({ color: 0x8fe0ff, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending })); d.rotation.x = -Math.PI / 2; d.visible = false; scene.add(d); dots.push(d); }
  }
  let ring = null; const dots = [];
  const idOf = obj => byObj.get(obj);
  const wp = id => { if (ST[id].pos) return ST[id].pos.clone(); const o = ST[id].obj, v = new THREE.Vector3(); o.getWorldPosition(v); return v; };
  let busy = false;

  // ------------------------------------------------------------------ helpers
  const PN = s => String(s).replace(/Toby/g, (window.CANTRIC_PLAYER && window.CANTRIC_PLAYER.name) || 'Toby');   // the astronaut's name (from the intro); default Toby
  const pct = v => Math.round(v * 100);
  const bar = (v, col) => `<div class="bar" style="flex:1"><div class="fill" style="width:${pct(v)}%;background:${col || (v < 0.25 ? 'var(--bad)' : v < 0.5 ? '#e2a845' : 'var(--good)')}"></div></div>`;
  // swipeable card: a few very short slides (Back / Next); the last button closes it
  function slides(list, o = {}) {
    let i = 0;
    const render = () => { const last = i === list.length - 1; ctx.setModal(true); ctx.sfx(i === 0 ? 'card' : 'page'); const el = $('card'); el.className = 'mp';
      el.innerHTML = PN(`<div class="slide">${list[i]}</div><div class="dots">${list.map((_, k) => `<span class="${k === i ? 'on' : ''}"></span>`).join('')}</div><div class="nav">${i > 0 ? '<button class="opt" id="spBack">◀</button>' : ''}<button class="btn" id="spNext">${last ? (o.close || 'OK') : 'Next ▶'}</button></div>`);
      el.style.display = 'block'; $('spNext').onclick = () => { if (last) closePanel(o.onClose); else { i++; render(); } }; const b = $('spBack'); if (b) b.onclick = () => { i--; render(); }; };
    render();
  }
  function panel(html, o = {}) { ctx.setModal(true); ctx.sfx(o.quiet ? 'click' : 'card'); const el = $('card'); el.className = 'mp';
    el.innerHTML = PN(html + (o.noClose ? '' : `<div style="text-align:center"><button class="btn" id="mpClose">${o.close || 'OK'}</button></div>`)); el.style.display = 'block';
    if (!o.noClose) $('mpClose').onclick = () => closePanel(o.onClose); }
  function closePanel(cb) { $('card').style.display = 'none'; $('card').className = ''; ctx.setModal(false); if (cb) cb(); }
  function choice(html, opts) { panel(html + '<div style="text-align:center">' + opts.map((o, i) => `<button class="opt" data-i="${i}">${o[0]}</button>`).join('') + '</div>', { noClose: true });
    $('card').querySelectorAll('.opt').forEach(b => b.onclick = () => closePanel(opts[+b.dataset.i][1])); }
  function setHelmet(on, announce) { ms.suit = on; helmet.style.display = on ? 'block' : 'none'; if (announce) { ctx.sfx('helmet'); say(on ? 'Helmet ON: there is no air outside!' : 'Helmet OFF: the air inside is safe.', 'SUIT', 2200); } }
  const orbiSay = (t, ms2 = 7000) => say(orbiMode() === 'weak' && ms.sol >= 5 ? 'Bzzt... ' + t : t, 'ORBI', ms2);
  function orbiMode() { return ms.orbi >= 0.6 ? 'ok' : ms.orbi >= 0.2 ? 'weak' : 'off'; }
  const solStart = n => ctx.LANDING + (n - 1) * ctx.SOL_MS;
  const capMs = () => solStart(ms.sol) + ctx.SOL_MS * (11 / 24);
  const hourNow = () => ctx.lmst(CLK.ms);

  // ------------------------------------------------------------------ objectives per Sol (data driven)
  function O(id, text, stations, hints, act, extra) { return Object.assign({ id, text, stations, hints, act }, extra); }
  function done(o) {
    ms.done[o.id] = true; L = L.filter(x => x !== o); progress(true); clearGlow(); ctx.sfx('task');
    if (!L.length) allDone(); else { const nx = L[0]; setTimeout(() => { if (L[0] === nx && !ctx.modal()) orbiSay('Next: ' + nx.text + '.', 5000); }, 2400); }   // a short "new objective" line; the hints below are different sentences
    save(); hud(true);
  }
  function allDone() {
    if (ms.sol === 10 || ms.sol === 1) return;                       // Sol 10 ends with the evaluation; Sol 1 ends with its own ending scene
    orbiSay('That is everything for today! Let us rest in the sleeping pod, so the habitat can run through the night.', 8000);
    L.push(O('rest', 'Rest in the sleeping pod to end the Sol', ['podA', 'podB'], ['The sleeping pods are along the south wall inside the base.', 'Look for the glowing pod.', 'Tap a glowing sleeping pod.'], restPrompt));
  }
  function inspectCard(title, body, o, fix) {
    panel(`<div class="mp"><h3>${title}</h3>${body}</div>`, { close: fix ? 'Later' : 'OK', onClose: () => { if (o) done(o); } });
    if (fix) { const b = document.createElement('button'); b.className = 'opt'; b.textContent = fix[0]; b.onclick = () => closePanel(() => { fix[1](); if (o) done(o); }); $('card').insertBefore(b, $('mpClose').parentNode); }
  }
  const resRows = () => ['energy', 'oxygen', 'water', 'food'].map(k => `<div class="row2"><b>${k[0].toUpperCase() + k.slice(1)}</b>${bar(ms.res[k])}<span>${pct(ms.res[k])}%</span></div>`).join('');

  function roverCard(o) {
    slides([`<h3>☢ RADIATION ALERT!</h3><div class="big" style="color:#ff9a7a">A big burst from the Sun is coming!</div>`,
      `<h3>What is radiation?</h3><div>Invisible energy from the Sun.<br>A little is OK. A big burst can hurt people.</div>`,
      `<h3>Our plan</h3><div>Put a <b>SHIELD</b> on the wall to block it.<br>Go fast!</div><div class="sm">The power cable is a different problem.</div>`,
      `<h3>Real NASA data</h3>${ctx.nasaCard()}`],
      { close: 'Let us go!', onClose: () => { ctx.radiationOn(); orbiSay('Quick, Toby! Back to the base, take the shield panels from the white crate!', 7000); done(o); } });
  }
  function build(n) {
    const A = [], add = (...a) => A.push(O(...a));
    const LK = ms.flags.leakAt || 'vessel', FL = ms.flags.filterAt || 'shelfR';   // which pipe leaks / which filter clogs changes every new game (replayability)
    if (n === 1) {
      add('s1follow', 'Follow ORBI to the base door', ['door'], ['ORBI ran to the base door. Follow him!', 'The glowing circle on the ground is next to the base door.', 'Tap the floor next to the glowing circle to walk there.'], null,
        { reach: { id: 'door', r: 2.9 }, onReach: o => { busy = true; ctx.storyCut(() => { busy = false; done(o); }); } });
      add('s1rover', 'Go outside to the rover (it is beeping!)', ['comm'], ['Something is beeping outside. It is the rover!', 'The rover is outside, south of the base. Look for the glowing rover.', 'Tap the glowing rover to read its message.'], o => roverCard(o), { labels: { comm: 'Rover: tap to read its message' } });
      add('s1take', 'Take the shield panels from the white crate', ['crateH'], ['Shields stop radiation. They are in a crate inside the base.', 'The glowing crate has the white shield panels.', 'Tap the glowing white crate.'], o => { ctx.takeShields(); orbiSay('These panels are made of polyethylene, a special plastic with lots of hydrogen. It blocks radiation very well! Put them on the wall outside, quick!', 8000); done(o); }, { labels: { crateH: 'White crate: tap to take the 3 shield panels' } });
      add('s1install', 'Put the 3 shield panels on the glowing wall spots', [], ['The shield goes on the OUTSIDE wall of the base, by the door.', 'Three glowing spots are on the wall outside. Go there.', 'Tap a glowing spot to put a shield panel on it.'], (o, id) => { ctx.installMount(ST[id].obj); progress(false); if (S.installed >= 3) done(o); }, { dynamic: true, text2: () => `Put the shield panels on the wall (${S.installed}/3)` });
      add('s1home', 'Go back inside the base', ['door'], ['The shield is done! Go back to the base.', 'The glowing circle is at the door.', 'Walk through the door.'], null, {});
    }
    if (n === 2) {
      add('s2see', 'Go outside and look at the solar panels', ['solar0'], ['The storm is weaker, but our power is still low. Why?', 'The solar panels are east of the base. Go and look at them.', 'Tap the floor near the glowing solar panel.'], null,
        { reach: { id: 'solar0', r: 7.5 }, onReach: o => { busy = true; orbiSay('Look, Toby! The panels are covered in dust. They look dull, so they make less power!', 7000); setTimeout(() => { busy = false; done(o); }, 600); } });
      add('s2ride', 'Hop into the rover. It has a cleaning brush!', ['comm'], ['The rover has a big brush on its front.', 'The rover is south of the base. It is glowing.', 'Tap the glowing rover to hop in.'], o => startRide(o), { labels: { comm: 'Rover: tap to hop in' } });
      add('s2clean', 'Drive the rover over each dusty panel', [], ['Tap a dusty panel and the rover drives there and brushes it.', 'Look for the glowing panels. Tap one.', 'Tap a glowing panel. You have 60 seconds for all three.'], null, { dynamic: true, text2: () => cleanText() });
    }
    if (n === 3) {
      add('s3water', 'Check the water level on the computer', ['console'], ['The water tanks are draining faster than normal. Where can we see numbers?', 'The mission computer shows the tanks.', 'Tap the glowing computer.'], o => {
        inspectCard('Water tanks', `${resRows()}<div class="big" style="color:#ffb36b">Water is dropping fast. Something is leaking!</div><div class="sm">Water used by the crew goes down slowly. A leak makes it drop much faster, and it keeps dropping until we fix it.</div>`, o); });
      add('s3find', 'Find the leak: inspect the pipes', ['vesselT', 'vessel', 'shelfR'], ['Leaks leave wet marks. Check each pipe section near the tanks.', 'Three pipe sections are glowing. Check them one by one.', 'Tap each glowing pipe section until you find the wet one.'], (o, id) => {
        ms.flags.insp = ms.flags.insp || {}; ms.flags.insp[id] = true;
        if (id === LK) { inspectCard('Pipe section: WET!', '<div class="big" style="color:#ff9a7a">Found it! Water is leaking here.</div><div class="sm">The pipe has a crack. Let us repair it.</div>', o); }
        else { progress(false); orbiSay('This pipe is dry. Check another one.', 3500); }
      }, { labels: { vesselT: 'Pipe section A: click to inspect', vessel: 'Pipe section B: click to inspect', shelfR: 'Pipe section C: click to inspect' }, skipDone: id => ms.flags.insp && ms.flags.insp[id] && id !== LK });
      add('s3fix', 'Repair the cracked pipe (tap it several times)', [LK], ['The cracked pipe needs patching.', 'Go back to the wet pipe section and patch it.', 'Tap the glowing pipe several times to apply the patch.'], (o) => {
        ms.flags.patch = (ms.flags.patch || 0) + 1; progress(false);
        if (ms.flags.patch >= 6) { ms.leak = false; done(o); orbiSay('The patch is on! The leak has stopped. Let us verify it.', 4500); }
        else say('Patching... ' + ms.flags.patch + '/6', 'Repair', 900); }, { text2: () => `Repair the cracked pipe (${ms.flags.patch || 0}/6)`, labels: { [LK]: 'Cracked pipe: tap to patch' } });
      add('s3verify', 'Check the computer: has the leak stopped?', ['console'], ['Always check that a repair worked.', 'Look at the tanks on the computer.', 'Tap the glowing computer.'], o => {
        inspectCard('Leak check', `${resRows()}<div class="big" style="color:#8fe3b0">Good news: no more leak! Water is stable.</div>`, o); });
      add('s3rec', 'Switch on water recycling', ['shelfL'], ['Now let us save water. The recycler cleans used water so we can drink it again.', 'The recycler unit is glowing.', 'Tap the glowing unit to switch it on.'], o => { ms.recycling = true; inspectCard('Water recycler ON', '<div class="big">Used water is cleaned and returned to the tank.</div><div class="sm">The recycler needs electricity, so it uses a little energy. (Simulation values.)</div>', o); }, { labels: { shelfL: 'Water recycler: click to switch on' } });
    }
    if (n === 4) {
      add('s4learn', 'Learn about growing food on Mars', ['console'], ['We need fresh food. Let us learn how to grow it here.', 'The computer has a lesson.', 'Tap the glowing computer.'], o => {
        slides([`<h3>Why not plant in Mars soil?</h3><div>It has harmful salts (NASA's Phoenix lander found perchlorates) and few nutrients.</div>`,
          `<h3>Hydroponics!</h3><div>Roots grow in <b>water with nutrients</b>. No soil needed.</div>`,
          `<h3>Plants need</h3><div>💧 water · 💡 power · ⏳ time<br>They help a little, but never replace life support.</div>`], { close: 'Let us plant!', onClose: () => done(o) }); });
      add('s4water', 'Prepare water for the tray', ['vesselT'], ['Hydroponics starts with water. Where is it stored?', 'The tall tank is glowing.', 'Tap the glowing tank.'], o => { M.adjust(ms, 'water', -0.02); orbiSay('Water collected. It is taken from our tanks, so we must use it wisely.', 4500); done(o); }, { labels: { vesselT: 'Water tank: click to fill the tray water' } });
      add('s4medium', 'Prepare the growing medium', ['shelfM'], ['Roots need something to hold on to.', 'The middle shelf has the growing medium.', 'Tap the glowing shelf.'], o => { orbiSay('Clean, soil-free growing medium. Roots can hold on to it.', 4500); done(o); }, { labels: { shelfM: 'Growing medium: click to prepare' } });
      add('s4seeds', 'Collect the seeds', ['shelfR'], ['Now the seeds.', 'The seed shelf is glowing.', 'Tap the glowing shelf.'], o => { orbiSay('Three seeds. They need water, light and time to grow.', 4500); done(o); }, { labels: { shelfR: 'Seed shelf: click to take 3 seeds' } });
      add('s4plant', 'Plant the 3 seeds in the tray', ['planter'], ['Time to plant.', 'The hydroponic tray is glowing.', 'Tap the glowing tray, 3 times.'], o => {
        ms.flags.seeds = (ms.flags.seeds || 0) + 1; progress(false);
        if (ms.flags.seeds >= 3) { ms.plants = [0, 1, 2].map(() => ({ g: 0, h: 1 })); ms.flags.plantedSol = ms.sol; done(o); inspectCard('Growing cycle started', '<div class="big">3 seeds planted!</div><div class="sm">They will grow over the next Sols, if they get water and electricity. Check them later and harvest when they are ready.</div>', null); }
        else say('Seed planted ' + ms.flags.seeds + '/3', 'Toby', 1000); }, { text2: () => `Plant the 3 seeds (${ms.flags.seeds || 0}/3)`, labels: { planter: 'Hydroponic tray: click to plant a seed' } });
    }
    if (n === 5) {
      add('s5diag', 'Check ORBI: his battery has a fault', ['orbi'], ['Toby... my... power... something is wrong with me.', 'Look at ORBI. He is glowing.', 'Tap ORBI to open his repair panel.'], o => wirePuzzle(o), { labels: { orbi: 'ORBI: click to diagnose and repair' } });
    }
    if (n === 6) {
      add('s6learn', 'Learn about heat loss on the computer', ['console'], ['The outside is getting very cold. The computer can tell us more.', 'Tap the glowing computer.', 'Tap the glowing computer.'], o => {
        slides([`<h3>Freezing night!</h3><div>Heat escapes through windows and walls.<br>Heaters then burn more energy.</div>`,
          `<h3>How to keep heat in</h3><div><b>Shutters</b> trap a layer of air.<br><b>Shiny blankets</b> bounce heat back.</div>`], { close: 'Let us insulate', onClose: () => done(o) }); });
      add('s6winW', 'Close the west window shutter', ['winW'], ['Windows lose a lot of heat.', 'There are two window walls, west and east.', 'Tap the glowing west window.'], o => { ms.windows.w = true; recalcInsul(); orbiSay('West shutter closed.', 3000); done(o); }, { labels: { winW: 'West window: click to close the shutter' } });
      add('s6winE', 'Close the east windows', ['winE'], ['The other windows too.', 'The east wall has three windows.', 'Tap the glowing east windows.'], o => { ms.windows.e = true; recalcInsul(); orbiSay('East shutters closed.', 3000); done(o); }, { labels: { winE: 'East windows: click to close the shutters' } });
      add('s6blanket', 'Take the reflective blankets', ['blanket'], ['Shiny blankets reflect heat.', 'The silver crate is glowing.', 'Tap the glowing crate.'], o => { orbiSay('Shiny blankets. Let us hang them near the sleeping pods.', 4500); done(o); }, { labels: { blanket: 'Reflective blankets: click to take' } });
      add('s6a', 'Install the blankets by the first pod', ['podA'], ['Hang the blankets where heat escapes.', 'The sleeping pods are glowing.', 'Tap the glowing pod.'], o => { ms.blanket = 1; recalcInsul(); orbiSay('Blanket installed.', 3000); done(o); }, { labels: { podA: 'Sleeping pod: click to hang a blanket' } });
      add('s6b', 'Install the blankets by the second pod', ['podB'], ['One more.', 'The other pod is glowing.', 'Tap the glowing pod.'], o => { ms.blanket = 2; recalcInsul(); inspectCard('Insulation done', `<div class="big">Heat loss reduced.</div><div class="sm">Insulation level: ${pct(ms.insul)}%. Heaters now use less energy.</div>`, o); }, { labels: { podB: 'Sleeping pod: click to hang a blanket' } });
    }
    if (n === 7) {
      add('s7alarm', 'Check the oxygen warning on the computer', ['console'], ['An alarm! The air is not safe.', 'The computer shows the air system.', 'Tap the glowing computer.'], o => {
        inspectCard('LIFE SUPPORT ALARM', `${resRows()}<div class="big" style="color:#ff9a7a">Oxygen is dropping. The air filter system has a fault.</div><div class="sm">Life support cleans the air and makes oxygen. Plants help a little, but they cannot replace it.</div>`, o); });
      add('s7diag', 'Find the clogged air filter (inspect the units)', ['vesselT', 'vessel', 'shelfR'], ['The filter is clogged. Check the life-support units.', 'Three units are glowing. Look at each one.', 'Tap each glowing unit. One is clogged.'], (o, id) => {
        ms.flags.f7 = ms.flags.f7 || {}; ms.flags.f7[id] = true;
        if (id === FL) inspectCard('Air filter: CLOGGED', '<div class="big" style="color:#ff9a7a">Dust has clogged this filter.</div>', o); else { progress(false); orbiSay('This unit is working. Check another.', 3500); } },
        { labels: { vesselT: 'Life-support unit A: click to inspect', vessel: 'Life-support unit B: click to inspect', shelfR: 'Life-support unit C: click to inspect' }, skipDone: id => ms.flags.f7 && ms.flags.f7[id] && id !== FL });
      add('s7clean', 'Clean the filter (tap it several times)', [FL], ['It needs cleaning.', 'Back to the clogged unit.', 'Tap the glowing unit several times.'], o => {
        ms.flags.clean7 = (ms.flags.clean7 || 0) + 1; progress(false);
        if (ms.flags.clean7 >= 5) done(o); else say('Cleaning... ' + ms.flags.clean7 + '/5', 'Repair', 900); }, { text2: () => `Clean the filter (${ms.flags.clean7 || 0}/5)`, labels: { [FL]: 'Clogged filter: tap to clean' } });
      add('s7restart', 'Restart life support on the computer', ['console'], ['Now restart the system.', 'The computer controls life support.', 'Tap the glowing computer.'], o => { ms.o2Fault = false; inspectCard('Life support restarted', `<div class="big" style="color:#8fe3b0">Oxygen generation is working again.</div><div class="sm">Oxygen will rise slowly, because the air needs time to recover. Your plants add a little too.</div>`, o); });
    }
    if (n === 8) {
      const chk = (id, text, st, hints, fn, lbl) => add(id, text, st, hints, (o) => { fn(o); }, { labels: lbl });
      add('s8con', 'Inspect: resources on the computer', ['console'], ['A quiet day. Let us inspect everything.', 'Start with the computer.', 'Tap the glowing computer.'], o => inspectCard('Resource inspection', `${resRows()}<div class="sm">Crew safety: ${M.crewSafety(ms).label}. ${M.crewSafety(ms).cause}</div>`, o));
      add('s8orbi', 'Inspect: ORBI', ['orbi'], ['Check on ORBI too.', 'ORBI is glowing.', 'Tap ORBI.'], o => inspectCard('ORBI check', `<div class="row2"><b>ORBI</b>${bar(ms.orbi)}<span>${pct(ms.orbi)}%</span></div>`, o));
      add('s8solar', 'Inspect: solar panels', ['solar0'], ['The power comes from the sun.', 'Check a solar panel outside.', 'Tap the glowing solar panel.'], o => {
        const d = ms.panelDust.reduce((s, x) => s + x, 0) / 3;
        inspectCard('Solar panels', `<div class="row2"><b>Dust</b>${bar(d, d > 0.35 ? 'var(--bad)' : 'var(--good)')}<span>${pct(d)}%</span></div><div class="sm">Dust slowly comes back. Clean when it is above 35%.</div>`, o, d > 0.2 ? ['Clean now', () => { ms.panelDust = [0, 0, 0]; }] : null); });
      add('s8pipes', 'Inspect: water pipes', ['vessel'], ['Check the water system.', 'Check the pipes near the tanks.', 'Tap the glowing pipe.'], o => inspectCard('Pipes', ms.leak ? '<div class="big" style="color:#ff9a7a">Still leaking!</div>' : '<div class="big" style="color:#8fe3b0">No leaks.</div>', o, ms.leak ? ['Patch now', () => { ms.leak = false; }] : null));
      add('s8plants', 'Inspect: plants', ['planter'], ['How are the plants?', 'The hydroponic tray is glowing.', 'Tap the glowing tray.'], o => {
        const pl = ms.plants, ready = pl.filter(p => !p.dead && !p.harvested && p.g >= 1);
        inspectCard('Plants', pl.length ? pl.map((p, i) => `<div class="row2"><b>Plant ${i + 1}</b>${bar(p.dead ? 0 : p.h)}<span>${p.dead ? 'dead' : p.harvested ? 'harvested' : p.g >= 1 ? 'ready!' : pct(p.g) + '% grown'}</span></div>`).join('') : '<div>No plants were planted.</div>', o, ready.length ? ['Harvest now', () => harvest()] : null); });
      add('s8shield', 'Inspect: radiation shield', ['shield0'], ['Check the shield outside the south wall.', 'A shield panel is glowing.', 'Tap the glowing panel.'], o => {
        inspectCard('Radiation shield', `<div class="row2"><b>Shield</b>${bar(ms.shield)}<span>${pct(ms.shield)}%</span></div>${ms.shieldLoose ? '<div class="big" style="color:#ffb36b">A panel is loose.</div>' : '<div class="big" style="color:#8fe3b0">Solid.</div>'}`, o, ms.shieldLoose ? ['Tighten now', () => { ms.shieldLoose = false; ms.shield = Math.min(1, ms.shield + 0.25); }] : null); });
      add('s8ls', 'Inspect: life support', ['vesselT'], ['Last one: the air system.', 'The life-support unit is glowing.', 'Tap the glowing unit.'], o => inspectCard('Life support', `<div class="row2"><b>Oxygen</b>${bar(ms.res.oxygen)}<span>${pct(ms.res.oxygen)}%</span></div><div>${ms.o2Fault ? 'Fault!' : 'Working normally.'}</div>`, o));
    }
    if (n === 9) {
      add('s9sig', 'Check the communication status on the computer', ['console'], ['The radio is silent.', 'Look at the computer.', 'Tap the glowing computer.'], o => inspectCard('Communication', '<div class="big" style="color:#ff9a7a">NO SIGNAL from Earth.</div><div class="sm">The dish on the rover may be pointing the wrong way. Go to the rover and align it.</div>', o));
      add('s9align', 'Align the antenna at the rover', ['comm'], ['The antenna must point at Earth.', 'The rover is outside, south of the base. It is glowing.', 'Tap the glowing rover.'], o => antennaPuzzle(o), { labels: { comm: 'Rover antenna: click to align' } });
      add('s9sos', 'Send the SOS in Morse code', ['comm'], ['Morse code: short and long signals. SOS is three short, three long, three short.', 'Use the rover radio again.', 'Tap the rover and enter: short short short, long long long, short short short.'], o => morsePuzzle(o), { labels: { comm: 'Rover radio: click to send the SOS' } });
    }
    if (n === 10) {
      add('s10a', 'Final check: energy and crew safety', ['console'], ['Last day! Let us check everything is ready.', 'Start at the computer.', 'Tap the glowing computer.'], o => { const c = M.crewSafety(ms); inspectCard('Final check: systems', `${resRows()}<div class="big">Crew safety: ${c.label}</div><div class="sm">${c.cause}</div>`, o); });
      add('s10b', 'Final check: water containment', ['vessel'], ['Is any water escaping?', 'The pipe section is glowing.', 'Tap the glowing pipe.'], o => inspectCard('Water containment', ms.leak ? '<div class="big" style="color:#ff9a7a">Leak!</div>' : '<div class="big" style="color:#8fe3b0">Sealed.</div>', o, ms.leak ? ['Patch now', () => { ms.leak = false; }] : null));
      add('s10c', 'Final check: plants and food', ['planter'], ['Food reserves and plants.', 'The tray is glowing.', 'Tap the glowing tray.'], o => {
        const ready = ms.plants.filter(p => !p.dead && !p.harvested && p.g >= 1);
        inspectCard('Food and plants', `<div class="row2"><b>Food</b>${bar(ms.res.food)}<span>${pct(ms.res.food)}%</span></div>${ms.plants.map((p, i) => `<div class="sm">Plant ${i + 1}: ${p.dead ? 'dead' : p.harvested ? 'harvested' : p.g >= 1 ? 'ready' : pct(p.g) + '% grown'}</div>`).join('')}`, o, ready.length ? ['Harvest now', () => harvest()] : null); });
      add('s10d', 'Final check: life support', ['vesselT'], ['The air system.', 'The unit is glowing.', 'Tap the glowing unit.'], o => inspectCard('Life support', `<div class="row2"><b>Oxygen</b>${bar(ms.res.oxygen)}<span>${pct(ms.res.oxygen)}%</span></div><div>${ms.o2Fault ? 'Fault!' : 'Working normally.'}</div>`, o));
      add('s10e', 'Final check: ORBI', ['orbi'], ['Is ORBI ready?', 'ORBI is glowing.', 'Tap ORBI.'], o => inspectCard('ORBI', `<div class="row2"><b>ORBI</b>${bar(ms.orbi)}<span>${pct(ms.orbi)}%</span></div>`, o));
      add('s10f', 'Final check: radiation shield', ['shield0'], ['Radiation protection.', 'A shield panel is glowing.', 'Tap the glowing panel.'], o => inspectCard('Radiation shield', `<div class="row2"><b>Shield</b>${bar(ms.shield)}<span>${pct(ms.shield)}%</span></div>${ms.shieldLoose ? '<div class="big" style="color:#ffb36b">A panel is loose.</div>' : ''}`, o, ms.shieldLoose ? ['Tighten now', () => { ms.shieldLoose = false; ms.shield = Math.min(1, ms.shield + 0.25); }] : null));
      add('s10go', 'Declare the crew ready for departure', ['console'], ['Everything checked? Then it is time.', 'The computer will give the final result.', 'Tap the glowing computer.'], o => { ms.done[o.id] = true; finalEvaluation(); });
    }
    return A;
  }
  function recalcInsul() { ms.insul = Math.min(1, (ms.windows.w ? 0.2 : 0) + (ms.windows.e ? 0.2 : 0) + ms.blanket * 0.3); }
  function harvest() { ctx.sfx('harvest'); const ready = ms.plants.filter(p => !p.dead && !p.harvested && p.g >= 1); ready.forEach(p => { p.harvested = true; M.adjust(ms, 'food', M.P.yield * p.h); }); if (ready.length) orbiSay('Harvest! ' + ready.length + ' plant(s) gave us fresh food.', 5000); }
  function cleanText() { const left = ms.panelDust.filter(d => d > 0.03).length; return cleanEnd ? `Brush the panels: ${3 - left}/3 clean · ${Math.max(0, Math.ceil(cleanEnd - T.now))} s` : 'Tap a dusty panel: the rover brushes it (60 s)'; }

  // ------------------------------------------------------------------ mini-games
  function wirePuzzle(o) {
    const cols = ['#e25a45', '#4aa3ff', '#f2c744'], right = [2, 0, 1]; let pick = null, connected = 0; const link = {};
    panel(`<h3>ORBI repair panel</h3><div class="sm">ORBI's battery has 3 loose wires. Connect each wire on the left to the terminal of the same color on the right: tap the left one, then the right one.</div>
      <div id="wp" style="display:flex;justify-content:space-between;margin:10px 0"><div>${cols.map((c, i) => `<div class="term" data-l="${i}" style="background:${c}"></div>`).join('')}</div>
      <div>${right.map((ci, i) => `<div class="term" data-r="${i}" style="background:${cols[ci]}"></div>`).join('')}</div></div><div id="wpmsg" class="sm"></div>`, { close: 'Close', onClose: () => { } });
    const msg = $('wpmsg');
    $('wp').querySelectorAll('[data-l]').forEach(b => b.onclick = () => { if (link[b.dataset.l] !== undefined) return; $('wp').querySelectorAll('[data-l]').forEach(x => x.classList.remove('sel')); b.classList.add('sel'); pick = +b.dataset.l; });
    $('wp').querySelectorAll('[data-r]').forEach(b => b.onclick = () => {
      if (pick === null) { msg.textContent = 'Tap a wire on the left first.'; return; } const ri = +b.dataset.r;
      if (right[ri] === pick) { ctx.sfx('wire'); link[pick] = ri; connected++; b.style.borderStyle = 'dashed'; $('wp').querySelector(`[data-l="${pick}"]`).style.opacity = 0.4; pick = null; msg.textContent = 'Connected! ' + connected + '/3';
        if (connected === 3) { ms.orbi = 1; ms.flags.orbiFixed = true; setTimeout(() => closePanel(() => { orbiSay('Systems online! Thank you, Toby. I feel much better.', 6000); done(o); }), 600); } }
      else { ctx.sfx('error'); msg.textContent = 'Not the same color. Try again!'; pick = null; $('wp').querySelectorAll('[data-l]').forEach(x => x.classList.remove('sel')); } });
  }
  function antennaPuzzle(o) {
    const tgt = [64, 37]; let a = 20, b = 80;
    const sig = () => Math.max(0, 1 - (Math.abs(a - tgt[0]) + Math.abs(b - tgt[1])) / 90);
    panel(`<h3>Align the antenna</h3><div class="sm">Move both sliders until the signal strength is full. A dish must point exactly at Earth.</div>
      <div class="row2"><b>Turn</b><input type="range" id="al1" min="0" max="100" value="${a}"></div><div class="row2"><b>Tilt</b><input type="range" id="al2" min="0" max="100" value="${b}"></div>
      <div class="row2"><b>Signal</b><div id="sg"></div></div><div id="almsg" class="sm"></div>`, { close: 'Close' });
    const upd = () => { const s = sig(); $('sg').outerHTML = `<div id="sg" style="flex:1">${bar(s, s > 0.93 ? 'var(--good)' : '#e2a845')}</div>`; $('almsg').textContent = s > 0.93 ? 'Locked on Earth!' : s > 0.6 ? 'Getting warmer...' : 'Weak signal.';
      if (s > 0.93) { setTimeout(() => { if ($('al1')) closePanel(() => { ms.commDown = false; orbiSay('Antenna aligned! Now we can send a message.', 5000); done(o); }); }, 500); } };
    $('al1').oninput = e => { a = +e.target.value; upd(); }; $('al2').oninput = e => { b = +e.target.value; upd(); }; upd();
  }
  function morsePuzzle(o) {
    const want = 'SSSLLLSSS'; let seq = '';
    panel(`<h3>Send an SOS in Morse code</h3><div class="sm">SOS is the international distress call: 3 short, 3 long, 3 short.</div><div class="morse" id="mz"></div>
      <div style="text-align:center"><button class="opt" id="ms">● short</button><button class="opt" id="ml">▬ long</button><button class="opt" id="mr">Reset</button></div><div id="mzmsg" class="sm"></div>`, { close: 'Close' });
    const show = () => { $('mz').textContent = seq.split('').map(c => c === 'S' ? '●' : '▬').join(' '); };
    const add = c => { seq += c; show(); if (seq.length === 9) { if (seq === want) { ms.sos = true; $('mzmsg').textContent = 'SOS sent! Earth is answering...'; setTimeout(() => closePanel(() => { orbiSay('Earth confirms the rescue and return plan. We did it, Toby!', 7000); done(o); }), 800); } else { $('mzmsg').textContent = 'That is not SOS. Try again: 3 short, 3 long, 3 short.'; seq = ''; setTimeout(show, 700); } } };
    $('ms').onclick = () => { ctx.sfx('beepShort'); add('S'); }; $('ml').onclick = () => { ctx.sfx('beepLong'); add('L'); }; $('mr').onclick = () => { seq = ''; show(); };
  }

  // ------------------------------------------------------------------ rest, night, reports
  function restPrompt(o) {
    const iss = M.issues(ms); const left = L.filter(x => x.id !== 'rest').length;
    const list = (iss.length || left) ? `<div class="sm">Problems that will carry over to tomorrow:</div><ul>${left ? `<li>${left} task(s) not finished today</li>` : ''}${iss.map(i => `<li>${i.text}</li>`).join('')}</ul>` : '<div>Everything is in good shape.</div>';
    choice(`<h3>Rest and end Sol ${ms.sol}?</h3>${list}`, [['Rest now', () => endSol()], ['Not yet', () => { }]]);
  }
  function endSol() {
    if (restOpen) return; restOpen = true; ending = true; G.lvl = 0; clearGlow(); ctx.setModal(true);
    const f = $('fade'); f.style.opacity = 1;
    setTimeout(() => {
      const before = { ...ms.res }, was = { ...ms.res };
      const mins = Math.min(M.SOL_MIN, Math.max(0, (solStart(ms.sol + 1) - CLK.ms) / 60000));
      M.advance(ms, mins, hourNow(), false); M.sunriseAdjust(ms);
      CLK.ms = solStart(ms.sol + 1); lastClk = CLK.ms; ms.suit = false; helmet.style.display = 'none';
      if (ms.sol >= 2) ms.sol = ms.sol; // unchanged; beginSol sets the next one
      const iss = M.issues(ms), cs = M.crewSafety(ms);
      const rows = ['energy', 'oxygen', 'water', 'food'].map(k => { const d = Math.round((ms.res[k] - was[k]) * 100); const why = d < 0 ? whyFor(k) : ''; return `<div class="row2"><b>${k[0].toUpperCase() + k.slice(1)}</b>${bar(ms.res[k])}<span>${d >= 0 ? '▲' : '▼'} ${Math.abs(d)}</span></div>${why ? `<div class="sm" style="margin:-2px 0 4px 78px;color:#ffb36b">because: ${why}</div>` : ''}`; }).join('');
      const next = ms.sol + 1;
      f.style.opacity = 0; restOpen = false; ctx.sfx('night');
      ms.flags.reportSol = ms.sol; saveForce();
      slides([`<h3>Night report · Sol ${ms.sol}</h3>${rows}`,
        iss.length ? `<h3>Still unsolved</h3><ul style="margin:0;padding-left:20px">${iss.slice(0, 4).map(i => `<li>${i.text}</li>`).join('')}</ul><div class="sm">They will keep hurting us tomorrow!</div>` : `<h3>No problems left!</h3><div>Great work, Toby.</div><div class="sm">Crew safety: ${cs.label}</div>`],
        { close: 'Start Sol ' + next, onClose: () => beginSol(next) });
    }, 700);
  }
  function finalEvaluation() {
    const ev = M.evaluate(ms); M.clear(); active = false; hudHide();
    const col = ev.outcome === 'SUCCESS' ? '#8fe3b0' : ev.outcome === 'FAILURE' ? '#ff9a7a' : '#ffd08a';
    ctx.sfx(ev.outcome === 'FAILURE' ? 'lose' : 'win');
    slides([`<h1 style="font-size:30px;margin:0;color:${col}">MISSION ${ev.outcome}</h1><div class="big">Score ${ev.score}/100</div><div class="sm">Crew safety: ${ev.crewSafety.label}</div>`,
      `<h3>How you did</h3>${ev.parts.map(p => `<div class="row2"><b style="width:130px;font-size:14px">${p[0]}</b>${bar(p[1])}</div>`).join('')}`,
      `<h3>Why?</h3><ul style="margin:0;padding-left:20px">${ev.why.slice(0, 5).map(w => `<li>${w}</li>`).join('')}</ul>`,
      `<div class="big">${ev.outcome === 'SUCCESS' ? 'The crew is ready to go home! Every choice you made kept us alive.' : ev.outcome === 'PARTIAL SUCCESS' ? 'We can leave, but some systems were weak. Fix problems early next time!' : 'Problems that were not fixed kept growing every Sol. Try again!'}</div><div class="sm">All numbers are game values for learning.</div>`],
      { close: 'Play again', onClose: () => location.reload() });
  }

  // ------------------------------------------------------------------ Sol flow
  function save() { if (ms.sol >= 2 || ms.flags.sol1Done) { ms.lastClk = CLK.ms; M.save(ms); } }
  function saveForce() { ms.lastClk = CLK.ms; M.save(ms); }
  function beginSol1() {   // called when the opening scenes end: Sol 1 now runs on the same objective engine as the other Sols
    active = true; ending = false; busy = false; ms.sol = 1; ms.done = {}; L = build(1); totalToday = L.length; CLK.onMars = true; lastClk = CLK.ms;
    S.phase = 'play'; S.act = 'mission'; S.step = 0; ctx.setDust(true); ctx.setLight(undefined); wasInside = isInside(camera.position); setHelmet(!wasInside, true); progress(true); hud(true); orbiSay('Follow me, Toby! To the base!', 6000);
  }
  function beginSol(n, resume) {
    S.hot = false; active = true; ending = false; restOpen = false; ms.sol = n; if (!resume) M.startSol(ms, n);
    const emerg = (!resume && n >= 3) ? M.emergencyFix(ms) : [];   // a danger left unsolved for days is repaired by ORBI in an emergency (it costs score)
    ms.done = resume ? ms.done : {}; if (!resume) { ms.flags.insp = {}; ms.flags.f7 = {}; ms.flags.patch = 0; ms.flags.clean7 = 0; }
    if (!ms.flags.leakAt) { const P3 = ['vesselT', 'vessel', 'shelfR']; ms.flags.leakAt = P3[Math.floor(Math.random() * 3)]; ms.flags.filterAt = P3.filter(x => x !== ms.flags.leakAt)[Math.floor(Math.random() * 2)]; }
    CLK.onMars = true; CLK.ms = (resume && ms.lastClk >= solStart(n) && ms.lastClk <= capMs()) ? ms.lastClk : solStart(n); lastClk = CLK.ms; cleanEnd = 0;
    S.phase = 'play'; S.act = 'mission'; S.step = 5; S.ended = true; S.radOn = false; $('meter').style.display = 'none';
    $('overlay').style.display = 'none'; ctx.renderer.toneMappingExposure = 1; S.flicker = false; ctx.setDust(n === 2 && ms.panelDust.some(d => d > 0.4));
    if (!resume || !isInside(camera.position)) { camera.position.set(-1, 1.7, 0.8); camera.lookAt(0, 1.5, -3); }
    W.robot.position.set(-1.2, 0, -1.4); ctx.robotPlay('Idle'); S.robotPath = null; W.astro.visible = false;
    L = build(n).filter(o => !ms.done[o.id]); totalToday = build(n).length; if (!L.length && n < 10) allDone();
    M.save && saveForce(); ctx.drawClocks(); ctx.lockPointer();
    const title = M.SOL_TITLES[n];
    const intro = { 2: 'Dust is blocking our solar panels.', 3: 'Water is draining too fast.', 4: 'Food is running low. Let us grow some!', 5: 'ORBI is glitching. His battery is broken.', 6: 'A freezing night is coming.', 7: 'The air filter is failing.', 8: 'A quiet day: inspect everything.', 9: 'No signal from Earth!', 10: 'Last day: is everyone ready to leave?' }[n];
    const carried = M.issues(ms).filter(i => !(n === 2 && i.id === 'dust'));
    wasInside = isInside(camera.position); setHelmet(!wasInside, false); ctx.sfx('ui');
    const list = [`<h3>SOL ${n} of 10</h3><div class="big">${title}</div><div>${intro}</div>`];
    if (emerg.length) { const nm = { leak: 'the water leak', o2: 'the air filter', insul: 'the insulation', dust: 'the dusty panels', recycling: 'the water recycler', shield: 'the loose shield' }; list.push(`<h3>🚨 Emergency repair</h3><div>Too many days passed, so ORBI fixed <b>${emerg.map(k => nm[k]).join(', ')}</b> using the emergency reserves.</div><div class="sm">It saved us, but it costs points. Fix problems yourself next time!</div>`); }
    if (carried.length && n > 2) list.push(`<h3>Still unsolved</h3><ul style="margin:0;padding-left:20px">${carried.slice(0, 4).map(i => `<li>${i.text}</li>`).join('')}</ul><div class="sm">Nothing resets: yesterday's problems are still here.</div>`);
    slides(list, { close: 'Start Sol ' + n, onClose: () => { progress(true); hud(true); orbiSay(L[0] ? 'First: ' + L[0].text + '.' : 'Let us see what today brings.', 7000); } });
  }

  // ------------------------------------------------------------------ ORBI guidance
  function progress(real) { G.lastProgress = T.now; G.lvl = 0; G.askLvl = 0; G.shown = null; if (real) { clearGuideVisuals(); } }
  let glowing = [];
  function curTargets() {
    const o = L[0]; if (!o) return []; const ids = o.dynamic ? dynTargets(o) : o.stations;
    return ids.filter(id => ST[id] && !(o.skipDone && o.skipDone(id)));
  }
  function dynTargets(o) { if (o.id === 's1install') return S.held ? ['shield0', 'shield1', 'shield2'].filter((id, i) => W.mounts[i] && !W.mounts[i].userData.it.filled) : [];
    if (o.id === 's2clean') return cleanEnd && T.now > cleanEnd ? [] : ['solar0', 'solar1', 'solar2'].filter((id, i) => ms.panelDust[i] > 0.03); return []; }
  function setGlow(ids) {
    clearGlow(); glowing = ids.map(id => { const mats = []; if (!ST[id].obj) return { id, mats }; ST[id].obj.traverse(ob => { if (ob.isMesh && ob.material && ob.material.emissive) mats.push({ m: ob.material, e: ob.material.emissive.clone(), i: ob.material.emissiveIntensity }); }); return { id, mats }; });
  }
  function clearGlow() { for (const g of glowing) for (const x of g.mats) { x.m.emissive.copy(x.e); x.m.emissiveIntensity = x.i; } glowing = []; }
  function clearGuideVisuals() { ring.visible = false; dots.forEach(d => d.visible = false); arrow.style.display = 'none'; }
  function guideThreshold() { return orbiMode() === 'ok' ? 20 : orbiMode() === 'weak' ? 36 : 1e9; }
  function hintText(n) { const o = L[0]; if (!o) return ''; const h = o.hints[Math.min(n, 3) - 1]; return h; }
  function giveHint(n, fromAsk) {
    const o = L[0]; if (!o) return; if (orbiMode() === 'off') { say('ORBI is offline. Fix his battery first.', 'ORBI (offline)', 4000); return; }
    G.lvl = Math.max(G.lvl, n); orbiSay(hintText(n), 8000); G.shown = n;
  }
  function ask() {
    if (!active || S.phase !== 'play') return; const o = L[0]; if (!o) { orbiSay('Everything is done for now.', 3000); return; }
    G.askLvl = Math.min(3, G.askLvl + 1); G.lastProgress = Math.max(G.lastProgress, T.now - guideThreshold() + 10); giveHint(G.askLvl, true);
  }
  function guide(dt) {
    const o = L[0]; const targets = curTargets();
    // soft glow always on for the current objective; pulse stronger after a hint
    const k = 0.25 + 0.15 * Math.sin(T.now * 4) + (G.lvl >= 1 ? 0.3 : 0);
    const key = targets.join(',');
    if (key !== (setGlow._k || '')) { setGlow(targets); setGlow._k = key; }
    const hot = !!S.hot;   // danger = red/orange glow, normal guidance = blue
    for (const g of glowing) for (const x of g.mats) { if (hot) x.m.emissive.setRGB(1, 0.32, 0.12); else x.m.emissive.setRGB(0.15, 0.55, 1); x.m.emissiveIntensity = k; }
    ring.material.color.setHex(hot ? 0xff6a4a : 0x6fd0ff); dots.forEach(d => d.material.color.setHex(hot ? 0xff9a7a : 0x8fe0ff));
    // inactivity -> hints (progress, not walking, resets the timer)
    const idle = T.now - G.lastProgress, thr = guideThreshold();
    skipBtn.style.display = (o && o.id !== 'rest' && !ctx.modal() && !busy && idle > Math.min(thr, 40) + 50) ? 'block' : 'none';   // never a dead end: after the hints, ORBI offers to finish the task
    if (o && !ctx.modal()) {
      if (idle >= thr && G.lvl < 1) giveHint(1); else if (idle >= thr + 18 && G.lvl < 2) giveHint(2); else if (idle >= thr + 36 && G.lvl < 3) giveHint(3);
    } else G.lastProgress += dt;   // do not count time spent in cards
    // markers: ring at the nearest target, floor dots + arrow when hinted or when the player is far / lost
    const p = camera.position; let near = null, nd = 1e9;
    for (const id of targets) { const w = wp(id), d = Math.hypot(w.x - p.x, w.z - p.z); if (d < nd) { nd = d; near = w; } }
    const lost = near && nd > 11 && T.now - G.lostShow < 12;
    G.distHist.push([T.now, nd]); while (G.distHist.length && T.now - G.distHist[0][0] > 6) G.distHist.shift();
    if (near && nd > 12 && T.now - G.lastLost > 28 && G.distHist.length > 3 && nd - G.distHist[0][1] > 2.5 && T.now - G.lastProgress > 6 && orbiMode() !== 'off') {
      G.lastLost = T.now; G.lostShow = T.now; orbiSay(`Toby, I think we should check ${/^(orbi|the )/.test(placeName(targets[0])) ? '' : 'the '}${placeName(targets[0])}.`, 6000);
    }
    const showRing = near && (G.lvl >= 1 || nd > 7), showPath = near && (G.lvl >= 2 || lost);
    ring.visible = !!showRing; if (showRing) { ring.position.set(near.x, 0.05, near.z); const s = 1 + 0.12 * Math.sin(T.now * 4); ring.scale.set(s, s, 1); }
    if (showPath) {
      const pts = route(p, near); let n = 0, acc = 0; let prev = pts[0];
      for (let i = 1; i < pts.length; i++) { const a = prev, b = pts[i], len = Math.hypot(b.x - a.x, b.z - a.z); let t = (1.6 - (acc % 1.6)) % 1.6;
        for (; t < len && n < dots.length; t += 1.6) { dots[n].position.set(a.x + (b.x - a.x) * t / len, 0.05, a.z + (b.z - a.z) * t / len); dots[n].visible = true; n++; } acc += len; prev = b; }
      for (; n < dots.length; n++) dots[n].visible = false;
      const nxt = pts[1], fwd = new THREE.Vector3(); camera.getWorldDirection(fwd); const want = Math.atan2(nxt.x - p.x, nxt.z - p.z), have = Math.atan2(fwd.x, fwd.z); let d = want - have; d = Math.atan2(Math.sin(d), Math.cos(d));
      arrow.style.display = 'block'; arrow.style.transform = `rotate(${(-d * 180 / Math.PI).toFixed(0)}deg)`;
    } else { dots.forEach(d => d.visible = false); arrow.style.display = 'none'; }
  }
  const placeName = id => (L[0] && L[0].labels && L[0].labels[id]) ? L[0].labels[id].split(':')[0].toLowerCase() : (ST[id] ? ST[id].name.toLowerCase() : 'there');
  function route(p, t) { const A = new THREE.Vector3(p.x, 0, p.z), B = new THREE.Vector3(t.x, 0, t.z); const ia = isInside(p), ib = isInside(t);
    if (ia === ib) return [A, B]; return ia ? [A, new THREE.Vector3(0, 0, 0.8), new THREE.Vector3(0, 0, 3.6), B] : [A, new THREE.Vector3(0, 0, 3.6), new THREE.Vector3(0, 0, 0.8), B]; }

  // ------------------------------------------------------------------ HUD
  function hudHide() { res.style.display = 'none'; askBtn.style.display = 'none'; skipBtn.style.display = 'none'; }
  function hud(force) {
    if (S.phase !== 'play') { res.style.display = 'none'; askBtn.style.display = 'none'; return; }
    const cs = M.crewSafety(ms), tot = Math.max(totalToday, 1), n = active ? Math.max(0, tot - L.filter(x => x.id !== 'rest').length) : 0;
    res.style.display = 'block'; askBtn.style.display = active ? 'block' : 'none';
    // every bar shows its trend (▲ rising / ▼ falling) and, when it falls, the CAUSE, so the player sees how the systems are connected
    // only 3 bars (energy, oxygen, water) as the challenge asks; food is a small line, not a 4th meter
    const foodTr = trendOf('food'), foodLine = `<div class="sm">🍎 Food ${pct(ms.res.food)}% <span style="color:${foodTr < -TR ? '#ff9a7a' : foodTr > TR ? '#8fe3b0' : '#c9c1b6'}">${foodTr < -TR ? '▼' : foodTr > TR ? '▲' : ''}</span></div>`;
    const row = (k, key) => { const tr = trendOf(key); const a = tr < -TR ? '▼' : tr > TR ? '▲' : '•'; const col = tr < -TR ? '#ff9a7a' : tr > TR ? '#8fe3b0' : '#c9c1b6'; return `<div class="row"><b>${k}</b>${bar(ms.res[key])}<span style="color:${col};width:14px">${a}</span></div>`; };
    const whys = ['energy', 'oxygen', 'water', 'food'].filter(k => trendOf(k) < -TR).slice(0, 2).map(k => `<div class="why">▼ ${k[0].toUpperCase() + k.slice(1)}: ${whyFor(k)}</div>`).join('');
    res.innerHTML = `<div class="sol">SOL ${ms.sol} / 10 ${active ? `<span class="sm" style="font-weight:400">· ${n}/${tot} tasks</span>` : ''}</div>${row('Energy', 'energy')}${row('Oxygen', 'oxygen')}${row('Water', 'water')}${foodLine}${whys}
      <div class="row"><b>Safety</b><span style="color:${['#8fe3b0', '#ffd08a', '#ffb36b', '#ff7a66'][cs.level]}">${cs.label}</span></div>${active ? `<div class="sm">ORBI: ${orbiMode() === 'ok' ? 'OK' : orbiMode() === 'weak' ? 'damaged' : 'offline'}</div>` : ''}${cs.level ? `<div class="warn">⚠ ${cs.cause}</div>` : ''}`;
    if (active) renderObjective();
  }
  function renderObjective() {
    const o = $('objective'); if (S.phase !== 'play') return; const c = L[0];
    o.style.display = 'block'; o.innerHTML = `<div class="k">Sol ${ms.sol} · ${M.SOL_TITLES[ms.sol]}</div>${c ? PN(c.text2 ? c.text2() : c.text) : 'All done'}`;
  }
  // ------- cause and effect: trends, reasons, and visible consequences in the world
  const TR = 0.004;                     // per game hour
  const hist = [];
  function sampleHist() { if (!hist.length || T.now - hist[hist.length - 1].t >= 4) { hist.push({ t: T.now, e: CLK.ms, r: { ...ms.res } }); while (hist.length > 10) hist.shift(); } }
  function trendOf(k) { if (hist.length < 3) return 0; const a = hist[0], dtm = (CLK.ms - a.e) / 60000; if (dtm <= 1) return 0; return (ms.res[k] - a.r[k]) / dtm * 60; }
  function whyFor(k) {
    const h = hourNow(), day = h >= 6 && h <= 18, iss = M.issues(ms).map(i => i.id);
    if (k === 'energy') return !day ? 'night: no sunlight' : iss.includes('dust') ? 'dusty solar panels' : iss.includes('insul') ? 'heaters work hard (cold)' : ms.res.energy < 0.1 ? 'low battery' : 'running the base';
    if (k === 'water') return ms.leak ? 'a LEAK!' : (!ms.recycling && ms.sol >= 3) ? 'recycler is OFF' : 'drinking';
    if (k === 'oxygen') return ms.o2Fault ? 'air filter fault' : ms.res.energy < 0.05 ? 'no power for life support' : 'breathing';
    if (k === 'food') return ms.plants.some(p => !p.dead) ? 'eating (plants still growing)' : 'eating, no plants yet';
    return '';
  }
  const DUSTC = new THREE.Color(0x8a5a35); let dripOn = false;
  function tintPanels() { (W.solar || []).forEach((p, i) => { const d = ms.panelDust[i] || 0; p.traverse(ob => { if (ob.isMesh && ob.material && ob.material.color) { if (!ob.userData.c0) ob.userData.c0 = ob.material.color.clone(); ob.material.color.copy(ob.userData.c0).lerp(DUSTC, Math.min(0.85, d * 0.9)); } }); }); }
  function lightLevel() { const e = ms.res.energy; if (e >= 0.35) return 1; let v = 0.58 + 0.42 * (e / 0.35); if (e < 0.12) v *= 0.88 + 0.12 * Math.sin(T.now * 18); return v; }   // low battery = dim, flickering lights
  const explained = {};
  function explainFalls() {
    for (const k of ['energy', 'oxygen', 'water', 'food']) { const tr = trendOf(k); if (tr < -TR * 2) { const w = whyFor(k); const key = k + w; if (!explained[key] && w !== 'drinking' && w !== 'breathing' && w !== 'eating, no plants yet' && w !== 'running the base') { explained[key] = 1; orbiSay(`${k[0].toUpperCase() + k.slice(1)} is going down because: ${w}!`, 6500); ctx.sfx('error'); break; } } }
  }
  function checkWarnings() {
    const r = ms.res; const w = (k, cond, msg) => { if (cond && !warned[k]) { warned[k] = 1; orbiSay('⚠ ' + msg, 6000); } if (!cond && warned[k] && r[k] !== undefined && r[k] > 0.4) warned[k] = 0; };
    if (r.energy < 0.2 && !crisisAsked && active && ms.sol >= 3 && !ctx.modal() && S.phase === 'play' && SW.some(s => s[0] !== 'air' && s[3]() && ms.alloc[s[0]])) { crisisAsked = true; energyCrisis(); } else if (r.energy > 0.45) crisisAsked = false;
    w('energy', r.energy < 0.2, 'Energy is low! Life support may stop. Check the solar panels.'); w('oxygen', r.oxygen < 0.35, 'Oxygen is getting low!');
    w('water', r.water < 0.2, 'Water is running low!'); w('food', r.food < 0.15, 'Food is running low!');
  }

  // ------------------------------------------------------------------ per-frame update + interaction
  function tick() {
    if (lastClk === null) lastClk = CLK.ms; const dm = (CLK.ms - lastClk) / 60000; lastClk = CLK.ms;
    if (dm > 0 && dm < 30) { M.advance(ms, dm, hourNow(), !isInside(camera.position), 5); }
  }
  function update(dt) {
    if (S.phase !== 'play') { lastClk = CLK.ms; return; }
    tick(); sampleHist(); hudT += dt; if (hudT > 0.3) { hudT = 0; hud(); checkWarnings(); if (active) { explainFalls(); tintPanels(); const lk = !!ms.leak && ms.sol >= 3; if (lk !== dripOn) { dripOn = lk; ctx.drip(lk); } } }
    if (!active) return;
    ctx.setLight(ms.sol >= 2 ? lightLevel() : undefined);
    if (ms.sol === 1 && S.robotPath && S.robotPath.length) ctx.walkOrbi(dt, camera.position);   // ORBI runs ahead to the base door
    { const c = L[0]; if (c && c.reach && !busy && ST[c.reach.id]) { const w = wp(c.reach.id); if (Math.hypot(camera.position.x - w.x, camera.position.z - w.z) < c.reach.r) c.onReach(c); } }
    guide(dt);
    const insideNow = isInside(camera.position);   // the suit is taken off again when you come back in from outside
    if (insideNow !== wasInside) { wasInside = insideNow; setHelmet(!insideNow, true); }   // helmet on outside, off inside, automatically
    rideUpdate(dt); if (ride.on && !(L[0] && L[0].id === 's2clean')) endRide();
    if (cleanEnd && T.now > cleanEnd && L[0] && L[0].id === 's2clean') endClean();
    if (!ending && CLK.ms >= capMs() - 2000 && ms.sol < 10) { ending = true; orbiSay('It is getting dark and very cold outside. Let us rest, Toby.', 6000); if (!L.some(x => x.id === 'rest')) L.push(O('rest', 'Rest in the sleeping pod to end the Sol', ['podA', 'podB'], ['The pods are along the south wall.', 'The pods are glowing.', 'Tap a glowing pod.'], restPrompt)); }
  }
  function endClean() {
    const left = ms.panelDust.filter(d => d > 0.03).length; const o = L[0];
    orbiSay(left ? `Time is up! ${3 - left} of 3 panels are clean. The dust left on the others will keep reducing our power.` : 'All three panels are clean! Power will come back.', 7000);
    if (left === 0) ctx.setDust(false); cleanEnd = 0; endRide(); done(o);
  }
  // ---- Sol 2: the rover has a cleaning brush on its front; tap a dusty panel and it drives there and brushes it
  let brush = null; const ride = { on: false, i: -1, phase: 'idle', t: 0 };
  function startRide(o) {
    if (!brush) { brush = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 2.2, 14), new THREE.MeshStandardMaterial({ color: 0xff7a2a, roughness: 0.9 })); brush.rotation.z = Math.PI / 2; brush.position.set(0, 0.35, 1.8); W.rover.add(brush); }
    ride.on = true; ride.phase = 'idle'; ride.i = -1; S.riding = true; brush.visible = true; ctx.sfx('helmet');
    orbiSay('Brush ON! Tap a dusty panel and the rover will drive there.', 6000); done(o); chaseCam();
  }
  function chaseCam() { const r = W.rover.position, f = W.rover.rotation.y; camera.position.set(r.x - Math.sin(f) * 4.2, 3.2, r.z - Math.cos(f) * 4.2); camera.lookAt(r.x + Math.sin(f) * 2, 0.9, r.z + Math.cos(f) * 2); }
  function endRide() { if (!ride.on) return; ride.on = false; S.riding = false; if (brush) brush.visible = false; W.rover.position.x = 6; W.rover.position.z = 9; W.rover.rotation.y = -2.5; camera.position.set(3.4, 1.7, 11.6); camera.lookAt(9, 1.6, -8); }
  function rideUpdate(dt) {
    if (!ride.on) return; const r = W.rover;
    if (ride.phase === 'go') { const p = wp('solar' + ride.i), dx = p.x - r.position.x, dz = p.z - r.position.z, d = Math.hypot(dx, dz); G.lastProgress = T.now;
      if (d < 3.2) { ride.phase = 'clean'; ride.t = 0; } else { const st = Math.min(5.5 * dt, d - 3.1); r.position.x += dx / d * st; r.position.z += dz / d * st; r.rotation.y = Math.atan2(dx, dz); if (Math.random() < 0.15) ctx.sfx('step'); } }
    else if (ride.phase === 'clean') { ride.t += dt; G.lastProgress = T.now; ms.panelDust[ride.i] = Math.max(0, ms.panelDust[ride.i] - 0.4 * dt);
      if (Math.floor(ride.t * 3) !== Math.floor((ride.t - dt) * 3)) { ctx.sfx('scrub'); ctx.burst('install', ST['solar' + ride.i].obj); }
      if (ms.panelDust[ride.i] <= 0.03) { ms.panelDust[ride.i] = 0; say('Panel ' + (ride.i + 1) + ' is clean!', 'Toby', 1500); ctx.sfx('good'); ride.phase = 'idle'; if (ms.panelDust.every(d => d <= 0.03)) endClean(); } }
    else if (ride.phase === 'idle') {   // the rover turns to face the dusty panels so they are easy to tap
      const dirty = ['solar0', 'solar1', 'solar2'].filter((id, i) => ms.panelDust[i] > 0.03); if (dirty.length) { let cx = 0, cz = 0; dirty.forEach(id => { const q = wp(id); cx += q.x; cz += q.z; }); cx /= dirty.length; cz /= dirty.length;
        let d = Math.atan2(cx - r.position.x, cz - r.position.z) - r.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d)); r.rotation.y += d * Math.min(1, dt * 3); } }
    if (brush) brush.rotation.x += dt * (ride.phase === 'clean' ? 16 : 2);
    if (ride.on) chaseCam();
  }
  // safety net: if a child is stuck, ORBI can finish the task (costs a little score at the end)
  function forceComplete(o) {
    if (!o) return; ms.flags.assisted = (ms.flags.assisted || 0) + 1; ctx.sfx('good'); orbiSay('I did that one for you. Next time you can try it yourself!', 5000);
    switch (o.id) {
      case 's1follow': busy = true; ctx.storyCut(() => { busy = false; done(o); }); return;
      case 's1rover': ctx.radiationOn(); break;
      case 's1take': ctx.takeShields(); break;
      case 's1install': if (!S.held) ctx.takeShields(); W.mounts.forEach(m => { if (!m.userData.it.filled && S.installed < 3) ctx.installMount(m); }); break;
      case 's2ride': startRide(o); return;
      case 's2clean': ms.panelDust = ms.panelDust.map(() => 0.04); cleanEnd = 0; endRide(); ctx.setDust(false); break;
      case 's3fix': ms.leak = false; ms.flags.patch = 6; break;
      case 's3rec': ms.recycling = true; break;
      case 's4plant': ms.plants = [0, 1, 2].map(() => ({ g: 0, h: 1 })); break;
      case 's5diag': ms.orbi = 1; ms.flags.orbiFixed = true; break;
      case 's6winW': ms.windows.w = true; recalcInsul(); break;
      case 's6winE': ms.windows.e = true; recalcInsul(); break;
      case 's6a': ms.blanket = Math.max(ms.blanket, 1); recalcInsul(); break;
      case 's6b': ms.blanket = 2; recalcInsul(); break;
      case 's7restart': ms.o2Fault = false; break;
      case 's9align': ms.commDown = false; break;
      case 's9sos': ms.sos = true; ms.commDown = false; break;
      case 's10go': ms.done[o.id] = true; finalEvaluation(); return;
    }
    done(o);
  }
  const skipBtn = document.createElement('button'); skipBtn.id = 'skipTask'; skipBtn.textContent = 'Stuck? Let ORBI help'; document.body.appendChild(skipBtn);
  skipBtn.onclick = () => { skipBtn.style.display = 'none'; forceComplete(L[0]); };
  function onUse(target) {
    if (!active) return false; const id = idOf(target); if (!id) return false;
    // station-specific information when it is not part of the current objective
    const o = L[0];
    if (o && o.id === 's2clean' && id === 'comm' && !ride.on) { startRide({ id: 'tmp' }); return true; }
    if (o && curTargets().includes(id)) {
      // Sol 2 cleaning needs the suit and has a 60-second timer that starts on the first scrub
      if (o.id === 's2clean') { if (!ride.on) { startRide({ id: 'tmp' }); } if (!cleanEnd) { cleanEnd = T.now + 60; } ride.i = +id.slice(5); ride.phase = 'go'; ctx.sfx('doorOpen'); progress(false); return true; }
      if (o.act) { o.act(o, id); progress(o.id !== 's3find' && o.id !== 's7diag' ? false : false); } return true;
    }
    if (ms.sol === 1 && (id === 'planter' || id === 'blanket')) { orbiSay('Those are heavy metal panels. The white plastic panels in the other crate block radiation best!', 5000); return true; }
    if (id === 'orbi') { orbiMode() === 'off' ? say('Bzzt... (ORBI is offline)', 'ORBI', 3000) : ask(); return true; }
    if (id === 'console') { statusCard(); return true; }
    if (id === 'podA' || id === 'podB') { restPrompt(); return true; }
    if (id.startsWith('solar')) { const i = +id.slice(5); say(`Solar panel ${i + 1}: dust ${pct(ms.panelDust[i])}%`, 'Info', 3000); return true; }
    if (id === 'planter') { const p = ms.plants; say(p.length ? `Plants: ${p.filter(x => !x.dead).length} alive, ${p.filter(x => !x.dead && x.g >= 1 && !x.harvested).length} ready` : 'No plants yet.', 'Info', 3500); if (p.some(x => !x.dead && !x.harvested && x.g >= 1)) harvest(); return true; }
    if (id.startsWith('shield')) { say(ms.shieldLoose ? 'A shield panel is loose here.' : `Radiation shield: ${pct(ms.shield)}%`, 'Info', 3000); return true; }
    say('Nothing to do here right now.', 'Info', 1800); return true;
  }
  // ---- resources compete: every power switch that is ON uses energy, every one that is OFF costs something else
  const SW = [['air', '💨 Air maker', 'OFF: oxygen falls', () => true], ['rec', '💧 Water recycler', 'OFF: water is not saved', () => ms.recycling], ['light', '💡 Plant lights', 'OFF: plants stop growing', () => ms.plants.length > 0], ['heat', '🔥 Heater', 'OFF: the base freezes', () => ms.cold > 0]];
  function powerHtml() {
    const r = M.rates(ms, hourNow()), net = r.gen - r.load;
    return `<h3>Power control</h3><div class="row2"><b style="width:auto">☀ making ${Math.round(r.gen * 100)}% · using ${Math.round(r.load * 100)}% per hour</b><span style="color:${net < 0 ? '#ff9a7a' : '#8fe3b0'}">${net < 0 ? '▼ battery falling' : '▲ battery charging'}</span></div>`
      + SW.filter(s => s[3]()).map(s => `<div class="row2"><b style="width:150px;font-size:15px">${s[1]}</b><button class="opt pw" data-k="${s[0]}" style="background:${ms.alloc[s[0]] ? '#2f6b4a' : '#6b2f2f'}">${ms.alloc[s[0]] ? 'ON' : 'OFF'}</button><span class="sm">${s[2]}</span></div>`).join('');
  }
  function statusCard() {
    const render = quiet => { const cs = M.crewSafety(ms), iss = M.issues(ms);
      panel(`<h3>Mission computer · Sol ${ms.sol}</h3>${resRows()}<div class="row2"><b>ORBI</b>${bar(ms.orbi)}<span>${pct(ms.orbi)}%</span></div><div class="big">Crew safety: ${cs.label}</div><div class="sm">${cs.cause}</div>${powerHtml()}
        ${iss.length ? '<ul style="margin:4px 0">' + iss.slice(0, 3).map(i => `<li>${i.text}</li>`).join('') + '</ul>' : ''}`, { quiet });
      $('card').querySelectorAll('.pw').forEach(b => b.onclick = () => { ms.alloc[b.dataset.k] = !ms.alloc[b.dataset.k]; ctx.sfx(ms.alloc[b.dataset.k] ? 'good' : 'power'); saveForce(); render(true); }); };
    render(false);
  }
  let crisisAsked = false;
  function energyCrisis() {   // a real trade-off: saving energy now costs something later
    const opts = SW.filter(s => s[3]() && ms.alloc[s[0]] && s[0] !== 'air').map(s => [`Switch OFF ${s[1]} (${s[2].replace('OFF: ', '')})`, () => { ms.alloc[s[0]] = false; ctx.sfx('power'); saveForce(); orbiSay(`${s[1]} is OFF. We save energy now, but: ${s[2].replace('OFF: ', '')}. You can switch it back ON on the mission computer.`, 8000); }]);
    opts.push(['Keep everything ON', () => orbiSay('Okay! But the battery may run out. Fix the cause of the problem fast!', 5000)]);
    choice(`<h3>⚠ Energy is low!</h3><div>Everything uses energy. What do you switch OFF to save it?</div><div class="sm">There is no free choice: every OFF has a price.</div>`, opts);
  }
  function hintFor(it, target) {
    if (!active) return undefined; const id = idOf(target); if (!id) return undefined;
    const o = L[0]; if (o && o.labels && o.labels[id] && curTargets().includes(id)) return o.labels[id];
    if (o && curTargets().includes(id)) return id === 'orbi' ? 'Click: talk to ORBI' : id === 'console' ? 'Click: use the mission computer' : id.startsWith('solar') ? 'Click: scrub the panel' : 'Click: ' + (o.text.charAt(0).toLowerCase() + o.text.slice(1));
    if (id === 'console') return 'Mission computer: check status'; if (id === 'orbi') return 'Click: ask ORBI for help';
    if (id === 'podA' || id === 'podB') return 'Sleeping pod: end the Sol'; return ST[id] ? ST[id].name : '';
  }

  // ------------------------------------------------------------------ hooks used by the original Day 1 flow
  function reset() { ms = M.newState(); ms.res.energy = 0.5; active = false; L = []; lastClk = null; M.clear(); }
  function onShield(n) { ms.shield = n / 3; }
  function onPowerRestored() { M.adjust(ms, 'energy', 0.2); }   // scripted emergency reroute, not an effect of the HDPE shield
  function afterSol1() {
    ms.flags.sol1Done = true; ms.hdpe = true; ms.shield = Math.max(ms.shield, 1);
    const was = { ...ms.res }; const mins = Math.max(0, (ctx.SOL_END - (lastClk || CLK.ms)) / 60000); lastClk = null;
    if (mins > 0 && mins < 1500) M.advance(ms, mins, hourNow(), false); M.sunriseAdjust(ms); CLK.ms = ctx.SOL_END;
    saveForce(); $('overlay').style.display = 'none';
    const rows = ['energy', 'oxygen', 'water', 'food'].map(k => `<div class="row2"><b>${k[0].toUpperCase() + k.slice(1)}</b>${bar(ms.res[k])}<span>${pct(ms.res[k])}%</span></div>`).join('');
    slides([`<h1 style="font-size:30px;margin:0;color:#8fe3b0">✔ SOL 1 COMPLETE</h1><div class="big">You protected the base from radiation!</div>`,
      `<h3>What we learned</h3><div>🛡 HDPE plastic blocks radiation.<br>🌪 A dust storm and radiation are <b>different</b> dangers.</div><div class="sm">The power came back by a separate repair: the shield only blocks radiation.</div>`,
      `<h3>Tomorrow starts like this</h3>${rows}<div class="sm">Nothing resets.</div>`,
      `<h3>Real NASA science</h3>${ctx.nasaFinal()}`], { close: 'Start Sol 2', onClose: () => beginSol(2) });
  }
  function continueGame() { const o = M.load(); if (!o) return false; ms = o; ctx.restoreSol1World(); lastClk = null; beginSol(ms.sol, true); return true; }
  const hasSave = () => !!M.load();

  const qaClean = () => { ms.panelDust = [0, 0, 0]; const o = L[0]; if (o && o.id === 's2ride') done(o); const c = L[0]; if (c && c.id === 's2clean') { cleanEnd = 0; endRide(); done(c); } };
  return { qaClean, forceComplete, beginSol1, pos: id => (ST[id] ? wp(id) : null), targets: () => curTargets(), setup, update, onUse, hintFor, ask, reset, onShield, onPowerRestored, afterSol1, continueGame, hasSave, capMs, active: () => active, renderObjective,
    get ms() { return ms; }, get objectives() { return L; }, beginSol, endSol, G, giveHint, finalEvaluation, harvest, M };
}

