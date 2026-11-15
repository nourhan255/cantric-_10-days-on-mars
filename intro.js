// CANTRIC cinematic intro (isolated module). It only draws its own full-screen overlay (#cantric) and never touches the 3D game world.
// Scenes: 1 Welcome -> 2 Registration -> 3 Launch -> 4 Journey -> 5 Briefing -> 6 Emergency landing. Scene 7/8 (ORBI rescue + Sol 1) is the existing game cut.
// startIntro({audio, hasSave, onDone})  ->  onDone({mode:'new'|'continue', skipped, name, age})
const IMG = './assets/cantric-welcome.webp', IW = 1672, IH = 941, BTN = { x: 836, y: 607, w: 360, h: 90 };   // the START button baked into the welcome image
const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), sm = k => { k = clamp(k, 0, 1); return k * k * (3 - 2 * k); }, lerp = (a, b, k) => a + (b - a) * k;
const reduce = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };

export function startIntro(opt) {
  if (window.__cantricIntro) return; window.__cantricIntro = true;   // never start twice
  const AUDIO = opt.audio || { play() {}, speak() {}, alarm() {}, unlock() {}, toggleMute() { return false; } };
  const css = document.createElement('style'); css.id = 'cantric-css';
  css.textContent = `
#cantric{position:fixed;inset:0;z-index:100;background:#04060f;color:#eaf0ff;font-family:"Segoe UI",system-ui,-apple-system,sans-serif;overflow:hidden;transition:opacity 1.2s ease}
#cantric *{box-sizing:border-box}
#cantric .layer{position:absolute;inset:0;opacity:0;pointer-events:none;transition:opacity .9s ease}
#cantric .layer.on{opacity:1;pointer-events:auto}
#ci-bg{position:absolute;inset:0;background:#04060f center/cover no-repeat;transform-origin:50% 55%;animation:ciDrift 38s ease-in-out infinite alternate}
@keyframes ciDrift{from{transform:scale(1.0) translate3d(0,0,0)}to{transform:scale(1.06) translate3d(-1.2%,.8%,0)}}
#ci-fill{position:absolute;inset:0;background:center/cover no-repeat;filter:blur(18px) brightness(.55);transform:scale(1.1);display:none}
#ci-glow{position:absolute;inset:0;background:radial-gradient(60% 50% at 50% 62%,rgba(255,170,110,.10),transparent 70%);animation:ciPulse 9s ease-in-out infinite alternate}
@keyframes ciPulse{from{opacity:.35}to{opacity:1}}
#cantric:not(.ready) #ci-welcome{opacity:0!important}
#cantric:not(.ready) *{animation-play-state:paused!important}
#ci-zoom{position:absolute;inset:0;transform-origin:50% 55%;transition:transform 1s cubic-bezier(.55,0,.25,1),opacity .9s ease}
#ci-welcome.leave #ci-zoom{transform:scale(1.5);opacity:0}
#ci-welcome.leave #ci-brand{opacity:0;transform:scale(1.12);transition:opacity .5s,transform .8s}
#ci-brand{position:absolute;left:50%;top:0;transform:translateX(-50%);width:calc(var(--s,.6)*820px);text-align:center;pointer-events:none;font-size:calc(var(--s,.6)*100px)}
#ci-brand>*{pointer-events:auto}
#ci-swoosh{position:absolute;left:calc(50% + var(--s,.6)*34px);top:var(--by,200px);width:calc(var(--s,.6)*330px);transform:translateX(-50%);overflow:visible;filter:drop-shadow(0 0 8px rgba(255,170,110,.45))}
#ci-arc{stroke-dasharray:420;stroke-dashoffset:420;animation:ciDraw 1.6s .2s cubic-bezier(.3,.1,.2,1) forwards}
@keyframes ciDraw{to{stroke-dashoffset:0}}
#ci-star{opacity:0;transform-box:fill-box;transform-origin:center;animation:ciTw 3.6s 1.6s ease-in-out infinite}
@keyframes ciTw{0%{opacity:0;transform:scale(.3) rotate(0)}18%{opacity:1;transform:scale(1.15) rotate(45deg)}40%,100%{opacity:.0;transform:scale(.4) rotate(90deg)}}
#ci-word{position:absolute;left:0;right:0;top:calc(var(--by,200px) + var(--s,.6)*105px);margin:0;font-weight:500;font-size:1em;line-height:1;letter-spacing:.05em;white-space:nowrap;color:#f4f7ff;filter:drop-shadow(0 4px 22px rgba(120,150,255,.28));direction:ltr}
#ci-word span{display:inline-block;opacity:0;transform:translateY(.28em) scale(.9);filter:blur(10px);animation:ciLet .9s calc(.55s + var(--i)*.09s) cubic-bezier(.2,.8,.2,1) forwards,ciGlint 7s calc(2.4s + var(--i)*.12s) ease-in-out infinite}
@keyframes ciLet{to{opacity:1;transform:none;filter:blur(0)}}
@keyframes ciGlint{0%,88%,100%{color:#f4f7ff;text-shadow:none}93%{color:#fff;text-shadow:0 0 .35em rgba(255,200,150,.95),0 0 .9em rgba(255,150,90,.55)}}
#ci-sub{position:absolute;left:0;right:0;top:calc(var(--by,200px) + var(--s,.6)*215px);display:flex;align-items:center;justify-content:center;gap:1.2em;font-size:calc(var(--s,.6)*30px);color:#cfd8ff;opacity:0;animation:ciFade 1.4s 1.5s ease forwards}
#ci-sub span{letter-spacing:.55em;margin-right:-.55em;animation:ciSp 2.2s 1.5s cubic-bezier(.2,.7,.2,1) backwards;font-weight:400}
@keyframes ciSp{from{letter-spacing:.1em;opacity:0}}
#ci-sub i{display:block;height:1px;width:calc(var(--s,.6)*140px);background:linear-gradient(90deg,transparent,rgba(190,205,255,.75));transform-origin:right;animation:ciGrow 1.6s 1.7s ease backwards}
#ci-sub i:last-child{background:linear-gradient(270deg,transparent,rgba(190,205,255,.75));transform-origin:left}
@keyframes ciGrow{from{transform:scaleX(0)}}@keyframes ciFade{to{opacity:1}}
#ci-start{position:absolute;left:50%;top:calc(var(--by,200px) + var(--s,.6)*350px);transform:translateX(-50%);display:flex;align-items:center;gap:.7em;font:600 calc(var(--s,.6)*36px)/1 "Segoe UI",system-ui,sans-serif;letter-spacing:.25em;color:#fff;padding:calc(var(--s,.6)*26px) calc(var(--s,.6)*70px);border-radius:999px;border:2px solid transparent;background:linear-gradient(rgba(10,14,34,.55),rgba(10,14,34,.55)) padding-box,linear-gradient(120deg,#ffb98a,#ff8a50,#ffd2b0) border-box;cursor:pointer;opacity:0;animation:ciFade 1s 2.3s ease forwards,ciBtn 3.2s 3.3s ease-in-out infinite;backdrop-filter:blur(4px)}
#ci-start b{font-size:1.5em;line-height:.6;transition:transform .25s}
#ci-start:hover{background:linear-gradient(rgba(60,34,26,.6),rgba(60,34,26,.6)) padding-box,linear-gradient(120deg,#ffd2b0,#ff9a60,#fff) border-box}
#ci-start:hover b,#ci-start:focus-visible b{transform:translateX(.25em)}
#ci-start:focus-visible{outline:2px solid #ffd2b0;outline-offset:5px}
@keyframes ciBtn{0%,100%{box-shadow:0 0 0 0 rgba(255,150,90,.0),0 0 18px rgba(255,150,90,.18)}50%{box-shadow:0 0 0 10px rgba(255,150,90,.07),0 0 34px rgba(255,150,90,.4)}}
.ci-shoot{position:absolute;height:2px;width:calc(var(--s,.6)*180px);background:linear-gradient(90deg,transparent,rgba(255,235,215,.95));border-radius:2px;opacity:0;pointer-events:none;transform:rotate(18deg);animation:ciShoot 1.5s ease-out forwards}
@keyframes ciShoot{0%{opacity:0;transform:translate(0,0) rotate(18deg)}15%{opacity:.9}100%{opacity:0;transform:translate(calc(var(--s,.6)*520px),calc(var(--s,.6)*170px)) rotate(18deg)}}
@keyframes ciCardIn{from{opacity:0;transform:translateY(26px) scale(.96)}to{opacity:1;transform:none}}
.ci-card{animation:ciCardIn .8s .25s cubic-bezier(.2,.8,.2,1) backwards}
html[dir=rtl] #cantric :not(#ci-word):not(#ci-word *):not(#ci-sub span){letter-spacing:0!important}
html[dir=rtl] #ci-sub span{letter-spacing:.1em;margin-right:0}
@media (prefers-reduced-motion:reduce){#ci-word span,#ci-arc,#ci-sub,#ci-sub span,#ci-sub i,#ci-start{animation:none;opacity:1;transform:none;filter:none;stroke-dashoffset:0}#ci-start{transform:translateX(-50%)}.ci-shoot{display:none}}
#ci-reg{display:flex;align-items:center;justify-content:center;padding:16px;background:linear-gradient(180deg,rgba(6,9,22,.78),rgba(6,9,22,.9))}
#ci-regbg{position:absolute;inset:0;background:center/cover no-repeat;filter:blur(14px) brightness(.5) saturate(.9);transform:scale(1.08)}
.ci-card{position:relative;width:min(460px,100%);padding:26px 26px 22px;border-radius:20px;background:rgba(14,19,40,.78);border:1px solid rgba(150,170,255,.22);backdrop-filter:blur(8px);box-shadow:0 20px 60px rgba(0,0,0,.45)}
.ci-card h2{margin:0 0 4px;font-size:13px;letter-spacing:.32em;font-weight:600;color:#ffb98a;text-transform:uppercase}
.ci-card h3{margin:0 0 18px;font-size:24px;font-weight:600}
.ci-card label{display:block;font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:#a9b6e6;margin:14px 0 6px}
.ci-card input[type=text]{width:100%;padding:12px 14px;font-size:19px;border-radius:12px;border:1px solid rgba(150,170,255,.3);background:rgba(5,8,20,.7);color:#fff;outline:none}
.ci-card input[type=text]:focus{border-color:#ffb98a}
.ci-ages{display:flex;gap:6px}
.ci-age{flex:1;min-width:0;padding:10px 0;text-align:center;border-radius:12px;border:1px solid rgba(150,170,255,.3);background:rgba(5,8,20,.6);color:#dfe6ff;font-size:18px;cursor:pointer}
.ci-age.on{background:linear-gradient(180deg,#f0a36e,#c9733f);color:#1a0d05;border-color:transparent;font-weight:700}
.ci-btn{display:block;width:100%;margin-top:22px;padding:13px;font-size:16px;letter-spacing:.22em;text-transform:uppercase;border-radius:999px;border:1px solid rgba(255,185,138,.75);background:rgba(255,150,90,.12);color:#fff;cursor:pointer}
.ci-btn:disabled{opacity:.35;cursor:default}.ci-btn:not(:disabled):hover{background:rgba(255,150,90,.28)}
.ci-btn.alt{margin-top:10px;border-color:rgba(150,170,255,.45);background:transparent}
#ci-cv{position:absolute;inset:0;width:100%;height:100%;display:block}
#ci-orbi{position:absolute;left:50%;bottom:6.5%;transform:translateX(-50%);width:min(640px,calc(100% - 28px));display:flex;gap:12px;align-items:flex-start;padding:12px 16px;border-radius:16px;background:rgba(10,14,32,.74);border:1px solid rgba(150,170,255,.25);backdrop-filter:blur(6px);opacity:0;transition:opacity .6s}
#ci-orbi.on{opacity:1}
#ci-orbi .av{flex:none;width:38px;height:38px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#bfe0ff,#4b78d6 60%,#1c2c66);box-shadow:0 0 14px rgba(110,160,255,.45)}
#ci-orbi .who{font-size:12px;letter-spacing:.25em;color:#8fb2ff;margin-bottom:3px}
#ci-orbi .tx{font-size:18px;line-height:1.5}
#ci-cap{position:absolute;left:0;right:0;top:9%;text-align:center;font-size:13px;letter-spacing:.38em;text-transform:uppercase;color:#cdd8ff;opacity:0;transition:opacity .6s;padding:0 16px}
#ci-cap.on{opacity:.9}
#ci-count{position:absolute;left:0;right:0;top:34%;text-align:center;font-size:min(22vw,170px);font-weight:200;letter-spacing:.05em;opacity:0;color:#fff;text-shadow:0 0 40px rgba(255,170,110,.35)}
#ci-holo{position:absolute;left:50%;top:14%;transform:translateX(-50%);width:min(560px,calc(100% - 28px));padding:16px 18px;border-radius:14px;border:1px solid rgba(120,170,255,.45);background:linear-gradient(180deg,rgba(40,70,140,.22),rgba(20,30,70,.28));box-shadow:0 0 40px rgba(90,140,255,.16) inset;opacity:0;transition:opacity .8s}
#ci-holo.on{opacity:1}
#ci-holo h4{margin:0 0 10px;font-size:12px;letter-spacing:.35em;color:#ffb98a;font-weight:600}
.ci-row{display:flex;gap:12px;align-items:baseline;padding:7px 0;border-top:1px solid rgba(120,170,255,.18);opacity:0;transform:translateY(6px);transition:opacity .7s,transform .7s}
.ci-row.on{opacity:1;transform:none}
.ci-row b{flex:none;width:84px;font-size:12px;letter-spacing:.2em;color:#8fb2ff;font-weight:600}
.ci-row span{font-size:17px;line-height:1.4}
.ci-sols{display:inline-flex;gap:5px;margin-left:8px;vertical-align:middle}.ci-sols i{width:9px;height:9px;border-radius:50%;background:rgba(150,170,255,.25);transition:background .3s}.ci-sols i.on{background:#ffb98a}
#ci-warn{position:absolute;inset:0;pointer-events:none;opacity:0;background:radial-gradient(ellipse at center,transparent 45%,rgba(190,40,30,.55));}
#ci-ctrl{position:absolute;right:14px;bottom:14px;display:flex;gap:8px;z-index:3}
#ci-ctrl button{font:inherit;font-size:14px;padding:8px 14px;border-radius:999px;border:1px solid rgba(180,195,255,.4);background:rgba(8,12,28,.6);color:#e6ecff;cursor:pointer}
#ci-ctrl button:hover{background:rgba(40,60,120,.55)}
#ci-fade{position:absolute;inset:0;background:#000;opacity:0;pointer-events:none}
@media (max-width:560px){#ci-orbi .tx{font-size:16px}.ci-row b{width:64px}.ci-row span{font-size:15px}}
@media (prefers-reduced-motion:reduce){#ci-bg,#ci-glow{animation:none}}
`;
  document.head.appendChild(css);
  const root = document.createElement('div'); root.id = 'cantric';
  root.innerHTML = `
<div class="layer on" id="ci-welcome"><div id="ci-zoom"><div id="ci-fill"></div><div id="ci-bg"></div><div id="ci-glow"></div>
  <div id="ci-brand"><svg id="ci-swoosh" viewBox="0 0 300 110" aria-hidden="true"><path id="ci-arc" d="M8 104 C 70 40, 170 6, 262 12 C 280 14, 284 40, 270 58" fill="none" stroke="url(#ciG)" stroke-width="3.2" stroke-linecap="round"/><defs><linearGradient id="ciG" x1="0" x2="1"><stop offset="0" stop-color="#ffb98a" stop-opacity="0"/><stop offset=".6" stop-color="#ffd2b0"/><stop offset="1" stop-color="#fff"/></linearGradient></defs><path id="ci-star" d="M214 28 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3z" fill="#ffd9bd"/></svg>
    <h1 id="ci-word" aria-label="CANTRIC">${[...'CANTRIC'].map((c, i) => `<span style="--i:${i}">${c}</span>`).join('')}</h1>
    <div id="ci-sub"><i></i><span>SPACE PROGRAM</span><i></i></div>
    <button id="ci-start" type="button"><span>START</span><b>›</b></button></div></div></div>
<div class="layer" id="ci-reg"><div id="ci-regbg"></div>
  <div class="ci-card" id="ci-card0" style="display:none"><h2>CANTRIC</h2><h3>Welcome back</h3><button class="ci-btn" id="ci-cont">Continue saved mission</button><button class="ci-btn alt" id="ci-new">New mission</button></div>
  <div class="ci-card" id="ci-card1"><h2>Astronaut registration</h2><h3>Who is boarding today?</h3>
    <label for="ci-name">Enter your name</label><input type="text" id="ci-name" maxlength="12" autocomplete="off" spellcheck="false" placeholder="Your name">
    <label for="ci-age">Enter your age</label><input type="text" id="ci-age" inputmode="numeric" pattern="[0-9]*" maxlength="2" autocomplete="off" placeholder="Your age">
    <button class="ci-btn" id="ci-go" disabled>Continue</button></div></div>
<div class="layer" id="ci-scene"><canvas id="ci-cv"></canvas><div id="ci-warn"></div><div id="ci-cap"></div><div id="ci-count"></div>
  <div id="ci-holo"><h4>MISSION BRIEFING</h4>
    <div class="ci-row"><b>WHERE</b><span>Mars Research Base</span></div>
    <div class="ci-row"><b>WHY</b><span>The base needs help</span></div>
    <div class="ci-row"><b>WHAT</b><span>Repair systems · manage power, oxygen, water and food · keep the crew safe</span></div>
    <div class="ci-row"><b>HOW LONG</b><span>10 Sols (Martian days)<span class="ci-sols">${'<i></i>'.repeat(10)}</span></span></div></div>
  <div id="ci-orbi"><div class="av"></div><div><div class="who">ORBI</div><div class="tx" id="ci-tx"></div></div></div></div>
<div id="ci-fade"></div>
<div id="ci-ctrl"><button id="ci-snd" aria-label="Sound">Sound: on</button><button id="ci-skip" aria-label="Skip Intro">Skip Intro ▶</button></div>`;
  document.body.appendChild(root);
  const $ = id => root.querySelector('#' + id);
  // The supplied image has the CANTRIC logo and START button baked in. We repaint those two areas (smooth sky between the left and right edge of each area)
  // so the real, animated wordmark and button can sit on top of the same picture.
  const setBg = url => { const bg = `url("${url}")`; $('ci-bg').style.backgroundImage = bg; $('ci-regbg').style.backgroundImage = bg; $('ci-fill').style.backgroundImage = bg; root.classList.add('ready'); };
  (function prepareBg() {
    const im = new Image(); im.onerror = () => setBg(IMG);
    im.onload = () => { try {
      const c = document.createElement('canvas'); c.width = IW; c.height = IH; const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(im, 0, 0, IW, IH);
      for (const [rx, ry, rw, rh, ro] of [[425, 205, 745, 222], [425, 418, 800, 72], [640, 546, 400, 126, 1]]) {   // 5th value: take the colour from the right side only (Earth's glow is on the left of the button)
        const d = x.getImageData(rx - 12, ry - 6, rw + 24, rh + 12), W2 = rw + 24, px = (xx, yy) => ((yy - ry + 6) * W2 + (xx - rx + 12)) * 4;
        const avg = (xx, yy) => { let r = 0, g2 = 0, b = 0, n = 0; for (let j = -3; j <= 3; j++) for (let i = -4; i <= 0; i++) { const k = px(Math.max(rx - 12, Math.min(rx + rw + 11, xx + i)), Math.max(ry - 6, Math.min(ry + rh + 5, yy + j))); r += d.data[k]; g2 += d.data[k + 1]; b += d.data[k + 2]; n++; } return [r / n, g2 / n, b / n]; };
        const out = x.createImageData(rw, rh);
        for (let yy = 0; yy < rh; yy++) { const R = avg(rx + rw + 10, ry + yy), L = ro ? R : avg(rx - 6, ry + yy); for (let xx = 0; xx < rw; xx++) { const t = xx / (rw - 1), k = (yy * rw + xx) * 4, w = Math.min(1, Math.min(xx, rw - 1 - xx, yy, rh - 1 - yy) / 10); for (let q = 0; q < 3; q++) out.data[k + q] = L[q] + (R[q] - L[q]) * t; out.data[k + 3] = 255 * w; } }
        const tmp = document.createElement('canvas'); tmp.width = rw; tmp.height = rh; tmp.getContext('2d').putImageData(out, 0, 0); x.drawImage(tmp, rx, ry);
        let sd = rx * 7 + ry; const r2 = () => (sd = (sd * 16807) % 2147483647) / 2147483647; x.fillStyle = 'rgba(210,222,255,.55)'; for (let i = 0; i < rw * rh / 5200; i++) x.fillRect(rx + 10 + r2() * (rw - 20), ry + 10 + r2() * (rh - 20), 1.4, 1.4);   // a few stars so the repaint is not flat
      }
      c.toBlob(b => setBg(b ? URL.createObjectURL(b) : IMG), 'image/jpeg', 0.92);
    } catch (e) { console.warn('[intro] bg', e); setBg(IMG); } };
    im.src = IMG;
  })();

  // ---------------------------------------------------------------- state
  const P = { name: '', age: null }; let done = false, raf = 0, sc = -1, t0 = 0, last = 0, mode = 'new'; const timers = []; const off = [];
  const later = (fn, ms) => { const id = setTimeout(fn, ms); timers.push(id); return id; };
  const on = (el, ev, fn) => { el.addEventListener(ev, fn); off.push(() => el.removeEventListener(ev, fn)); };
  const layer = id => { for (const l of root.querySelectorAll('.layer')) l.classList.toggle('on', l.id === id); };
  const cv = $('ci-cv'), g = cv.getContext('2d'); let W = 0, H = 0, DPR = 1, U = 1;
  function resize() {
    DPR = Math.min(2, window.devicePixelRatio || 1); W = innerWidth; H = innerHeight; cv.width = W * DPR; cv.height = H * DPR; g.setTransform(DPR, 0, 0, DPR, 0, 0); U = Math.min(W, H * 1.6) / 100;
    const tall = W / H < 1.25, s = tall ? W / IW : Math.max(W / IW, H / IH);   // portrait phones: fit the whole image width (logo + START stay visible) over a blurred copy
    $('ci-bg').style.backgroundSize = tall ? '100% auto' : 'cover'; $('ci-bg').style.backgroundPosition = 'center'; $('ci-fill').style.display = tall ? 'block' : 'none';
    const oy = (H - IH * s) / 2, br = $('ci-brand'); br.style.setProperty('--s', s.toFixed(4)); br.style.setProperty('--by', (oy + 208 * s).toFixed(1) + 'px');   // the animated logo/button follow the picture (same place as the original ones)
  }
  on(window, 'resize', resize); resize();

  // sound
  const snd = $('ci-snd'); const syncSnd = () => { snd.textContent = 'Sound: ' + (AUDIO.muted ? 'off' : 'on'); };
  on(snd, 'click', () => { AUDIO.unlock(); AUDIO.toggleMute(); syncSnd(); }); syncSnd();

  // ---------------------------------------------------------------- stars + drawing helpers
  const rnd = (() => { let s = 1234567; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
  const stars = Array.from({ length: 220 }, () => ({ x: rnd(), y: rnd(), r: 0.4 + rnd() * 1.3, l: rnd() < 0.5 ? 0 : rnd() < 0.6 ? 1 : 2, tw: rnd() * 6 }));
  function drawStars(t, dx, dy, streak = 0, alpha = 1) {
    for (const s of stars) { const sp = [0.25, 0.6, 1][s.l]; let x = (s.x * W + dx * sp) % W, y = (s.y * H + dy * sp) % H; if (x < 0) x += W; if (y < 0) y += H;
      const a = (0.45 + 0.35 * Math.sin(t * 0.6 + s.tw)) * alpha * (0.5 + s.l * 0.25); g.fillStyle = `rgba(215,225,255,${a})`;
      if (streak > 0) g.fillRect(x, y, s.r, s.r + streak * sp * 14); else g.fillRect(x, y, s.r, s.r); } }
  function sky(top, bot) { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, top); gr.addColorStop(1, bot); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
  const IMG_E = new Image(), IMG_M = new Image(); IMG_E.src = './assets/nasa/earth-1280.jpg'; IMG_M.src = './assets/nasa/mars-viking-PIA00407.jpg';   // NASA photos, bundled locally (work offline)
  function photo(img, cx, cy, r, rad) {   // draw the photo so its planet disc (radius = rad of the image width) matches radius r, with soft edge shading
    const s = r / rad; g.save(); g.beginPath(); g.arc(cx, cy, r, 0, 7); g.clip(); g.drawImage(img, cx - s / 2, cy - s / 2, s, s);
    const sh = g.createRadialGradient(cx - r * 0.45, cy - r * 0.45, r * 0.25, cx, cy, r * 1.02); sh.addColorStop(0, 'rgba(0,0,10,0)'); sh.addColorStop(0.7, 'rgba(0,0,10,.18)'); sh.addColorStop(1, 'rgba(0,0,10,.62)'); g.fillStyle = sh; g.fillRect(cx - r, cy - r, r * 2, r * 2); g.restore(); }
  function earth(cx, cy, r, a = 1) {
    g.save(); g.globalAlpha = a; const atm = g.createRadialGradient(cx, cy, r * 0.96, cx, cy, r * 1.08); atm.addColorStop(0, 'rgba(90,150,255,.55)'); atm.addColorStop(1, 'rgba(90,150,255,0)'); g.fillStyle = atm; g.beginPath(); g.arc(cx, cy, r * 1.08, 0, 7); g.fill();
    if (IMG_E.complete && IMG_E.naturalWidth) { photo(IMG_E, cx, cy, r, 0.457); g.restore(); return; }   // real NASA Blue Marble photo
    const gr = g.createRadialGradient(cx - r * 0.35, cy - r * 0.4, r * 0.1, cx, cy, r); gr.addColorStop(0, '#4f86d8'); gr.addColorStop(0.55, '#1c3f87'); gr.addColorStop(1, '#070f2c'); g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.fill();
    g.save(); g.beginPath(); g.arc(cx, cy, r, 0, 7); g.clip(); g.fillStyle = 'rgba(235,242,255,.16)'; for (let i = 0; i < 9; i++) { g.beginPath(); g.ellipse(cx + (rnd2(i) - 0.5) * r * 1.6, cy + (rnd2(i + 9) - 0.6) * r * 1.2, r * (0.18 + rnd2(i + 3) * 0.2), r * 0.05, rnd2(i + 5) - 0.5, 0, 7); g.fill(); }
    g.fillStyle = 'rgba(255,196,120,.7)'; for (let i = 0; i < 40; i++) g.fillRect(cx + (rnd2(i + 20) - 0.5) * r * 1.4, cy + (rnd2(i + 60) - 0.1) * r * 0.9, 1.4, 1.4); g.restore(); g.restore(); }
  const rnd2 = i => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  function mars(cx, cy, r, a = 1) {
    g.save(); g.globalAlpha = a; const atm = g.createRadialGradient(cx, cy, r * 0.97, cx, cy, r * 1.07); atm.addColorStop(0, 'rgba(255,150,100,.4)'); atm.addColorStop(1, 'rgba(255,150,100,0)'); g.fillStyle = atm; g.beginPath(); g.arc(cx, cy, r * 1.07, 0, 7); g.fill();
    if (IMG_M.complete && IMG_M.naturalWidth) { photo(IMG_M, cx, cy, r, 0.5); g.restore(); return; }   // real NASA/JPL Viking photo
    const gr = g.createRadialGradient(cx - r * 0.4, cy - r * 0.4, r * 0.1, cx, cy, r); gr.addColorStop(0, '#e08a5c'); gr.addColorStop(0.6, '#a24d2c'); gr.addColorStop(1, '#2b110c'); g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.fill();
    g.save(); g.beginPath(); g.arc(cx, cy, r, 0, 7); g.clip(); for (let i = 0; i < 14; i++) { g.fillStyle = `rgba(60,22,14,${0.12 + rnd2(i) * 0.18})`; g.beginPath(); g.ellipse(cx + (rnd2(i + 30) - 0.5) * r * 1.5, cy + (rnd2(i + 50) - 0.5) * r * 1.5, r * (0.04 + rnd2(i + 7) * 0.1), r * (0.03 + rnd2(i + 8) * 0.08), rnd2(i), 0, 7); g.fill(); } g.restore(); g.restore(); }
  function ship(x, y, s, ang = 0, flame = 0, dmg = 0, t = 0) {   // simple shaded capsule-style spacecraft (nose up)
    g.save(); g.translate(x, y); g.rotate(ang); g.scale(s, s);
    if (flame > 0) { const L = 60 * flame * (0.92 + 0.08 * Math.sin(t * 22)); const f = g.createLinearGradient(0, 50, 0, 50 + L); f.addColorStop(0, 'rgba(255,240,210,.95)'); f.addColorStop(0.25, 'rgba(255,170,90,.8)'); f.addColorStop(1, 'rgba(255,120,60,0)'); g.fillStyle = f; g.beginPath(); g.moveTo(-9, 48); g.quadraticCurveTo(0, 50 + L * 1.1, 9, 48); g.closePath(); g.fill(); }
    const body = g.createLinearGradient(-16, 0, 16, 0); body.addColorStop(0, '#6d7898'); body.addColorStop(0.45, '#e3e9f8'); body.addColorStop(1, '#4b5578'); g.fillStyle = body;
    g.beginPath(); g.moveTo(0, -62); g.bezierCurveTo(14, -40, 17, -18, 16, 40); g.lineTo(-16, 40); g.bezierCurveTo(-17, -18, -14, -40, 0, -62); g.fill();
    g.fillStyle = '#3a4468'; g.beginPath(); g.moveTo(-16, 22); g.lineTo(-30, 50); g.lineTo(-16, 42); g.fill(); g.beginPath(); g.moveTo(16, 22); g.lineTo(30, 50); g.lineTo(16, 42); g.fill();
    g.fillStyle = '#20284a'; g.fillRect(-9, 40, 18, 9);
    g.fillStyle = '#16315f'; g.beginPath(); g.ellipse(0, -20, 7, 9, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(160,200,255,.55)'; g.beginPath(); g.ellipse(-2, -23, 2.5, 3.5, 0, 0, 7); g.fill();
    g.fillStyle = '#c9733f'; g.fillRect(-16, 6, 32, 3);
    if (dmg > 0) { g.fillStyle = `rgba(20,14,12,${0.55 * dmg})`; g.beginPath(); g.ellipse(6, 10, 7, 14, 0.4, 0, 7); g.fill(); }
    g.restore(); }
  function dustFx(t, amt, speed = 1) {   // wind-blown dust streaks (soft, no flashing)
    g.save(); g.lineCap = 'round'; for (let i = 0; i < 70 * amt; i++) { const y = rnd2(i) * H, sp = 0.4 + rnd2(i + 1) * 1.2, x = ((rnd2(i + 2) * W * 1.4 - t * 300 * sp * speed) % (W * 1.4) + W * 1.4) % (W * 1.4) - W * 0.2, l = (30 + rnd2(i + 3) * 120) * speed; g.strokeStyle = `rgba(224,150,100,${0.05 + rnd2(i + 4) * 0.12 * amt})`; g.lineWidth = 1 + rnd2(i + 5) * 3; g.beginPath(); g.moveTo(x, y); g.lineTo(x + l, y + l * 0.12); g.stroke(); } g.restore(); }

  // ---------------------------------------------------------------- ORBI dialogue + captions
  const tx = $('ci-tx'), box = $('ci-orbi'), cap = $('ci-cap'), count = $('ci-count'), holo = $('ci-holo'), warn = $('ci-warn'), fade = $('ci-fade');
  let said = '';
  const orbi = text => { if (text === said) return; said = text; if (!text) { box.classList.remove('on'); return; } tx.textContent = text; box.classList.add('on'); try { AUDIO.speak(text.length, 'ORBI'); } catch (e) { } };
  const caption = text => { if (text) { cap.textContent = text; cap.classList.add('on'); } else cap.classList.remove('on'); };
  const rows = [...root.querySelectorAll('.ci-row')], dots = [...root.querySelectorAll('.ci-sols i')];

  // ---------------------------------------------------------------- scenes (3..6) drawn on the canvas; t = seconds inside the scene
  const shake = (amp) => reduce() ? 0 : amp;
  const SCENES = [
    { dur: 18, init() { orbi(''); }, draw(t) {   // SCENE 3: launch
      const lights = sm(t / 3); let sx = 0, sy = 0;
      if (t < 11.2) {   // inside the cabin, looking through the window
        if (t > 9.6) { const a = shake(2.2 * Math.exp(-(t - 9.6) * 0.5)); sx = (Math.random() - 0.5) * a; sy = (Math.random() - 0.5) * a; }
        g.save(); g.translate(sx, sy); sky('#070b1f', '#2a1a35');
        const wx = W * 0.14, wy = H * 0.14, ww = W * 0.72, wh = H * 0.56;
        g.save(); g.beginPath(); g.roundRect(wx, wy, ww, wh, 28); g.clip(); const sk = g.createLinearGradient(0, wy, 0, wy + wh); sk.addColorStop(0, '#0a1230'); sk.addColorStop(0.55, '#3a2a5a'); sk.addColorStop(0.85, '#c07a52'); sk.addColorStop(1, '#f0b078'); g.fillStyle = sk; g.fillRect(wx, wy, ww, wh);
        drawStars(t, 0, 0, 0, 0.6); g.fillStyle = '#10142a'; g.fillRect(wx, wy + wh * 0.86, ww, wh * 0.2); g.fillStyle = '#0b0f20'; g.fillRect(wx + ww * 0.78, wy + wh * 0.35, ww * 0.025, wh * 0.55);
        if (t > 9.5) { const gl = g.createRadialGradient(W / 2, wy + wh, 0, W / 2, wy + wh, wh * 0.9); const a = sm((t - 9.5) / 1.6) * 0.8; gl.addColorStop(0, `rgba(255,190,120,${a})`); gl.addColorStop(1, 'rgba(255,120,60,0)'); g.fillStyle = gl; g.fillRect(wx, wy, ww, wh); } g.restore();
        g.lineWidth = 6; g.strokeStyle = '#1b2244'; g.beginPath(); g.roundRect(wx, wy, ww, wh, 28); g.stroke();
        for (const [x, y, w] of [[0.3, 0.06, 0.4], [0.3, 0.9, 0.4]]) { g.fillStyle = `rgba(255,190,140,${0.85 * lights})`; g.shadowColor = 'rgba(255,170,110,.6)'; g.shadowBlur = 14 * lights; g.beginPath(); g.roundRect(W * x, H * y, W * w, 5, 3); g.fill(); g.shadowBlur = 0; }
        g.fillStyle = `rgba(0,0,6,${0.75 * (1 - lights)})`; g.fillRect(0, 0, W, H); g.restore();
        if (t < 3) caption('Cabin lights online'); else if (t < 6.6) { caption('Launch systems'); g.save(); g.font = `${Math.max(13, U * 1.7)}px "Segoe UI",sans-serif`; g.textAlign = 'center'; const items = ['Power', 'Fuel', 'Guidance', 'Crew secured']; items.forEach((s, i) => { const a = sm((t - 3 - i * 0.8) / 0.5); g.fillStyle = `rgba(210,225,255,${a * 0.9})`; g.fillText((window.CANTRIC_I18N && window.CANTRIC_I18N.getLang() === 'ar' ? window.CANTRIC_I18N.translate(s) : s) + '   ✓', W / 2, H * 0.78 + i * U * 2.8); }); g.restore(); } else if (t < 9.6) caption('Countdown'); else caption('Engines on');
        const n = t >= 6.7 && t < 9.7 ? 3 - Math.floor(t - 6.7) : 0; if (n && n !== this.n) { this.n = n; AUDIO.play('ui'); } const ph = (t - 6.7) % 1; count.textContent = n || ''; count.style.opacity = n ? (sm(ph / 0.25) * (1 - sm((ph - 0.75) / 0.25))).toFixed(2) : 0; if (!n) count.style.opacity = 0;
        if (t > 9.5 && !this.ig) { this.ig = 1; AUDIO.play('whoosh'); AUDIO.play('crash'); }
      } else {   // outside: the camera pulls back as the spacecraft climbs (acceleration ~ t^2)
        const tt = t - 11.2, alt = 2.2 * tt * tt * tt * 0.16 + tt * tt * 1.4, fade0 = sm(tt / 0.9); count.style.opacity = 0; caption('Liftoff');
        if (tt > 0.3 && !this.w) { this.w = 1; AUDIO.play('whoosh'); } if (tt > 3.2 && !this.w2) { this.w2 = 1; AUDIO.play('whoosh'); }
        const h = sm(alt / 70); sky(`rgb(${lerp(20, 2, h) | 0},${lerp(34, 4, h) | 0},${lerp(80, 12, h) | 0})`, `rgb(${lerp(190, 8, h) | 0},${lerp(112, 12, h) | 0},${lerp(90, 30, h) | 0})`);
        drawStars(t, 0, tt * 6, Math.min(1.2, tt * 0.25) * 0.5, 0.35 + h * 0.65);
        const scr = alt * U * 1.15, shipY = Math.max(H * 0.46, H * 0.66 - scr), ground = H * 0.78 + Math.max(0, scr - H * 0.2) * 1.0;
        earth(W / 2, H + W * 0.9 - sm((tt - 1.5) / 4.5) * W * 0.5, W * 1.0, sm((tt - 1) / 2));
        if (ground < H * 1.4) { g.fillStyle = '#0c1020'; g.fillRect(0, ground, W, H * 1.4 - ground); g.fillStyle = '#161c36'; g.fillRect(W * 0.62, ground - U * 14, U * 1.6, U * 14); g.fillRect(W * 0.2, ground - U * 6, U * 3, U * 6); }
        const sc2 = lerp(U * 0.2, U * 0.11, sm(tt / 6)); const rot = shake(1) * Math.sin(tt * 9) * 0.004;
        const sm2 = g.createRadialGradient(W / 2, shipY + sc2 * 60, 0, W / 2, shipY + sc2 * 60, sc2 * 120); sm2.addColorStop(0, `rgba(255,170,110,${0.28 * fade0})`); sm2.addColorStop(1, 'rgba(255,120,60,0)'); g.fillStyle = sm2; g.fillRect(0, 0, W, H);
        ship(W / 2, shipY, sc2, rot, 0.6 + Math.min(1, tt / 3) * 1.1, 0, t); }
    } },
    { dur: 10, init() { this.said = 0; }, draw(t) {   // SCENE 4: journey to Mars
      sky('#03050f', '#0b1030'); drawStars(t, -t * 14, -t * 1.5);
      earth(W * 0.12 - t * 4, H * 0.9 + t * 3, lerp(W * 0.42, W * 0.3, sm(t / 10)), 1 - sm((t - 5) / 5) * 0.4);
      mars(W * 0.86, H * 0.3, lerp(U * 5, U * 12, sm(t / 10)), 1);
      ship(W * lerp(0.4, 0.52, sm(t / 10)), H * 0.55 + Math.sin(t * 0.8) * 5, U * 0.1, Math.PI / 2 + 0.04, 0.4, 0, t);
      caption(t < 1 ? '' : 'Earth to Mars'); if (t > 0.8) orbi(`Welcome aboard, ${P.name || 'Astronaut'}! We're on our way to Mars.`); } },
    { dur: 29, init() { }, draw(t) {   // SCENE 5: mission briefing (hologram)
      sky('#03050f', '#0e1034'); drawStars(t, -t * 6, 0); mars(W * 0.78, H * 0.68, U * (W < H ? 16 : 20), 1);
      const px = W * 0.78, py = H * 0.68; if (t > 1) { const a = sm((t - 1) / 1.5); g.save(); g.strokeStyle = `rgba(255,190,140,${0.8 * a})`; g.lineWidth = 2; const pr = 12 + Math.sin(t * 2) * 3; g.beginPath(); g.arc(px - U * 3, py - U * 5, pr, 0, 7); g.stroke(); g.fillStyle = `rgba(255,190,140,${a})`; g.beginPath(); g.arc(px - U * 3, py - U * 5, 4, 0, 7); g.fill(); g.restore(); }
      holo.classList.toggle('on', t > 0.6); caption('');
      const show = [1.2, 6, 10, 16]; rows.forEach((r, i) => r.classList.toggle('on', t > show[i])); const nd = clamp(Math.floor((t - 16.5) * 3), 0, 10); dots.forEach((d, i) => d.classList.toggle('on', i < nd));
      const lines = [[0.8, 'Our destination is the Mars Research Base.'], [5.8, 'The base needs help! We must repair its systems, manage power, oxygen, water and food, and keep the crew safe.'], [16, 'We have 10 Martian days, called Sols, to complete our mission.'], [22.5, 'I need your help, Astronaut!']];
      let cur = ''; for (const [s, l] of lines) if (t >= s) cur = l; orbi(cur); } },
    { dur: 15, init() { this.imp = 0; }, draw(t) {   // SCENE 6: emergency landing
      let sx = 0, sy = 0; if (t > 9.6) { const a = shake(7 * Math.exp(-(t - 9.6) * 1.8)); sx = (Math.random() - 0.5) * a; sy = (Math.random() - 0.5) * a; }
      g.save(); g.translate(sx, sy); sky('#150a14', '#5a2a1c'); drawStars(t, 0, 0, 0, 0.5 * (1 - sm(t / 8)));
      mars(W * 0.5, H + W * 0.9 - sm(t / 9) * W * 0.55, W * 1.05, 1);
      const k = sm(t / 9.6); const x = lerp(W * 0.25, W * 0.58, k), y = lerp(H * 0.12, H * 0.6, k * k); const loss = sm((t - 2.5) / 3); const spin = loss * (Math.sin(t * 1.5) * 0.7 + t * 0.12) ;
      if (t < 9.7) ship(x, y, U * 0.16, -0.5 + spin, 1.0, loss * 0.5, t); else { ship(W * 0.58, H * 0.66, U * 0.16, 1.1, 0, 1, t); }
      dustFx(t, 0.25 + sm((t - 1) / 6) * 1.0, 1 + sm(t / 8) * 1.2);
      const hz = g.createLinearGradient(0, 0, 0, H); const ha = sm((t - 2) / 6) * 0.45 + sm((t - 10) / 3.5) * 0.55; hz.addColorStop(0, `rgba(150,92,60,${ha})`); hz.addColorStop(1, `rgba(190,120,78,${ha})`); g.fillStyle = hz; g.fillRect(-20, -20, W + 40, H + 40); g.restore();
      const w = t > 2.2 && t < 9.7 ? 0.14 + 0.14 * (0.5 + 0.5 * Math.sin(t * 4.4)) : 0; warn.style.opacity = w.toFixed(3);   // slow pulse, never a strobe
      if (t > 2.2 && !this.al) { this.al = 1; AUDIO.alarm(true); } if (t > 9.6 && this.al === 1) { this.al = 2; AUDIO.alarm(false); AUDIO.play('crash'); }
      caption(t > 2.4 && t < 9.7 ? 'Warning' : '');
      if (t > 3) orbi(t < 10.5 ? "Warning! We're losing control! Brace for landing!" : '');
      fade.style.background = '#6a4630'; fade.style.opacity = sm((t - 11.5) / 3).toFixed(3); } }
  ];

  // ---------------------------------------------------------------- flow
  function begin(i) {
    sc = i; t0 = performance.now(); last = t0; said = ''; box.classList.remove('on'); caption(''); count.style.opacity = 0; holo.classList.remove('on'); rows.forEach(r => r.classList.remove('on')); warn.style.opacity = 0;
    fade.style.opacity = 0; fade.style.background = '#000'; layer('ci-scene'); const s = SCENES[i]; s.n = s.ig = s.w = s.w2 = s.al = 0; s.init && s.init();
    cancelAnimationFrame(raf); raf = requestAnimationFrame(frame);
  }
  function frame(now) {
    if (done) return; const t = (now - t0) / 1000, s = SCENES[sc]; g.clearRect(0, 0, W, H);
    try { s.draw(t); } catch (e) { console.warn('[intro] draw', e); }
    if (t >= s.dur) { if (sc + 1 < SCENES.length) { const nx = sc + 1; fade.style.background = '#000'; fade.style.opacity = 1; later(() => begin(nx), 450); cancelAnimationFrame(raf); setTimeout(() => { fade.style.opacity = 0; }, 520); return; } finish(false); return; }
    // soft cross-fade between scenes
    if (sc > 0 && t < 0.9) fade.style.opacity = (1 - sm(t / 0.9)).toFixed(3); else if (sc < 3 && t > s.dur - 0.5) fade.style.opacity = sm((t - (s.dur - 0.5)) / 0.5).toFixed(3);
    raf = requestAnimationFrame(frame);
  }
  function finish(skipped) {
    if (done) return; done = true; cancelAnimationFrame(raf); timers.forEach(clearTimeout); AUDIO.alarm(false);
    const res = { mode, skipped, name: P.name || '', age: P.age };
    root.style.pointerEvents = 'none'; fade.style.background = skipped ? '#04060f' : '#6a4630'; fade.style.opacity = 1;
    try { opt.onDone && opt.onDone(res); } catch (e) { console.error(e); }
    setTimeout(() => { root.style.opacity = 0; }, 80);
    setTimeout(() => { off.forEach(f => f()); root.remove(); css.remove(); }, 1500);
  }
  // scene 1
  const start = $('ci-start');
  on(start, 'click', () => { AUDIO.unlock(); AUDIO.play('ui'); toRegistration(); });
  // life on the welcome screen: parallax with the pointer + a rare, soft shooting star
  on(window, 'pointermove', e => { if (sc >= 0) return; const dx = (e.clientX / innerWidth - 0.5), dy = (e.clientY / innerHeight - 0.5); $('ci-bg').style.translate = `${(-dx * 14).toFixed(1)}px ${(-dy * 9).toFixed(1)}px`; $('ci-brand').style.translate = `${(dx * 6).toFixed(1)}px ${(dy * 4).toFixed(1)}px`; });
  const shoot = () => { if (done || sc >= 0 || leaving) return; if (!reduce()) { const e = document.createElement('i'); e.className = 'ci-shoot'; e.style.left = (8 + Math.random() * 45) + '%'; e.style.top = (6 + Math.random() * 22) + '%'; $('ci-zoom').appendChild(e); later(() => e.remove(), 1700); } later(shoot, 5200 + Math.random() * 4000); };
  later(shoot, 3500);
  let leaving = false;
  function toRegistration() {
    if (leaving) return; leaving = true; const wl = $('ci-welcome'); wl.classList.add('leave'); AUDIO.play('whoosh');   // soft zoom-through, then the registration card glides in
    later(() => { layer('ci-reg'); if (opt.hasSave) { $('ci-card0').style.display = 'block'; $('ci-card1').style.display = 'none'; } else $('ci-name').focus({ preventScroll: true }); }, 650);
    return;
    layer('ci-reg'); if (opt.hasSave) { $('ci-card0').style.display = 'block'; $('ci-card1').style.display = 'none'; } else $('ci-name').focus({ preventScroll: true });
  }
  on($('ci-cont'), 'click', () => { AUDIO.play('ui'); mode = 'continue'; finish(true); });
  on($('ci-new'), 'click', () => { AUDIO.play('ui'); $('ci-card0').style.display = 'none'; $('ci-card1').style.display = 'block'; $('ci-name').focus({ preventScroll: true }); });
  // scene 2
  const ageEl = $('ci-age'), nameEl = $('ci-name'), go = $('ci-go');
  const clean = v => v.replace(/[^\p{L}\p{N} \-]/gu, '').replace(/\s+/g, ' ').slice(0, 12);
  const digits = v => v.replace(/[٠-٩]/g, d => d.charCodeAt(0) - 0x660).replace(/[۰-۹]/g, d => d.charCodeAt(0) - 0x6F0).replace(/\D/g, '').slice(0, 2);   // Arabic-Indic digits work too
  const check = () => { const a = +ageEl.value; P.age = a >= 3 && a <= 99 ? a : null; go.disabled = !(clean(nameEl.value).trim() && P.age); };
  on(nameEl, 'input', () => { const c = clean(nameEl.value); if (c !== nameEl.value) nameEl.value = c; check(); });
  on(ageEl, 'input', () => { const c = digits(ageEl.value); if (c !== ageEl.value) ageEl.value = c; check(); });
  for (const el of [nameEl, ageEl]) on(el, 'keydown', e => { e.stopPropagation(); if (e.key === 'Enter' && !go.disabled) go.click(); else if (e.key === 'Enter' && el === nameEl) ageEl.focus(); });
  on(go, 'click', () => {
    if (go.disabled) return; P.name = clean(nameEl.value).trim(); window.CANTRIC_PLAYER = { name: P.name, age: P.age };   // saved for this session only
    try { sessionStorage.setItem('cantric:player', JSON.stringify(window.CANTRIC_PLAYER)); } catch (e) { }
    AUDIO.play('ui'); layer('ci-scene'); begin(0);
  });
  // skip
  const skip = () => { AUDIO.play('click'); if (opt.hasSave && sc < 0) { toRegistration(); return; } finish(true); };   // with a saved game, skipping the first two screens asks Continue / New instead of wiping the save
  on($('ci-skip'), 'click', skip);
  on(root, 'keydown', e => { e.stopPropagation(); if (e.key === 'Escape') skip(); });
  root.addEventListener('keyup', e => e.stopPropagation());
  window.__cantric = { skip: () => finish(true), scene: i => { if (i >= 0 && !done) begin(i); }, player: P };   // debug / test hooks
}
