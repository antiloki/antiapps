// Sound for the site, synthesised live with the Web Audio API (no audio files).
// Music: a D-minor drone, slow pads cycling Dm - Bb - Gm - A, sparse lute-like plucks,
// a faint heartbeat and a distant bell, all through one long reverb. Effects: a wind
// whoosh that follows scroll speed, a tone for each app section as it arrives, notes
// of the scale when you hover the cards, and a low thud on click. Off by default; the
// nav toggle starts it (browsers require a gesture) and remembers the choice.
(function () {
  const btn = document.querySelector('.snd');
  if (!btn) return;
  if (!(window.AudioContext || window.webkitAudioContext)) { btn.hidden = true; return; }

  const KEY = 'antiapps-sound';
  // Sound is on for every new visit. Turning it off is remembered for this session only, so an
  // old "off" (or a different version of the site) can never leave a first-time visitor in silence.
  const store = {
    get() { try { return sessionStorage.getItem(KEY); } catch (e) { return null; } },
    set(v) { try { sessionStorage.setItem(KEY, v); } catch (e) {} }
  };
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
  const rnd = (a, b) => a + Math.random() * (b - a);
  const SCALE = [62, 64, 65, 67, 69, 70, 73];            // D harmonic minor from D4
  const CHORDS = [
    { notes: [50, 53, 57, 62], root: 38 },               // Dm
    { notes: [46, 50, 53, 58], root: 34 },               // Bb
    { notes: [43, 46, 50, 55], root: 31 },               // Gm
    { notes: [45, 49, 52, 57], root: 33 }                // A
  ];
  const CHORD_DUR = 6.4, ARP_STEP = .64, BEAT_EVERY = 2.6;

  let ctx, master, music, sfx, verb, noiseBuf, windGain, windBP, timer, raf;
  let on = false, t0 = 0, nextArp = 0, nextChord = 0, nextBeat = 0, nextBell = 0, chordIdx = 0;
  let lastY = 0, lastT = 0, wind = 0, nearest = -1, cooldown = 0;

  // ---------- graph ----------
  function init() {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC();
    ctx.onstatechange = ui;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18; comp.ratio.value = 3;
    comp.connect(ctx.destination);
    master = ctx.createGain(); master.gain.value = 0; master.connect(comp);
    music = ctx.createGain(); music.gain.value = .9; music.connect(master);
    sfx = ctx.createGain(); sfx.gain.value = .9; sfx.connect(master);

    // reverb: decaying stereo noise, softened
    const len = Math.floor(ctx.sampleRate * 3.4), ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = ir.getChannelData(c); let lp = 0;
      for (let i = 0; i < len; i++) {
        lp += (Math.random() * 2 - 1 - lp) * .35;
        d[i] = lp * Math.pow(1 - i / len, 3.2);
      }
    }
    verb = ctx.createConvolver(); verb.buffer = ir;
    const verbOut = ctx.createGain(); verbOut.gain.value = .85;
    verb.connect(verbOut); verbOut.connect(master);

    // noise for the whoosh and swells
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const nd = noiseBuf.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;

    // scroll wind: looping noise, band-passed, gain and pitch follow scroll speed
    const ns = ctx.createBufferSource(); ns.buffer = noiseBuf; ns.loop = true;
    windBP = ctx.createBiquadFilter(); windBP.type = 'bandpass'; windBP.Q.value = .9; windBP.frequency.value = 300;
    windGain = ctx.createGain(); windGain.gain.value = 0;
    ns.connect(windBP); windBP.connect(windGain); windGain.connect(sfx);
    ns.start();

    // drone: D1 + D2, low-passed, slowly breathing
    const dl = ctx.createBiquadFilter(); dl.type = 'lowpass'; dl.frequency.value = 150;
    const dg = ctx.createGain(); dg.gain.value = .085;
    [[26, 'sawtooth', -5], [38, 'sawtooth', 6], [26, 'sine', 0]].forEach(([m, type, det]) => {
      const o = ctx.createOscillator(); o.type = type; o.frequency.value = mtof(m); o.detune.value = det;
      o.connect(dl); o.start();
    });
    const lfo = ctx.createOscillator(), lg = ctx.createGain();
    lfo.frequency.value = .05; lg.gain.value = .03; lfo.connect(lg); lg.connect(dg.gain); lfo.start();
    dl.connect(dg); dg.connect(music);
    const dsend = ctx.createGain(); dsend.gain.value = .3; dg.connect(dsend); dsend.connect(verb);
  }

  // ---------- voices ----------
  const out = (node, wet, pan) => {
    let n = node;
    if (pan && ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = pan; n.connect(p); n = p; }
    n.connect(music);
    if (wet) { const s = ctx.createGain(); s.gain.value = wet; n.connect(s); s.connect(verb); }
  };
  function pluck(t, m, v, wet, bus) {
    const f = mtof(m), o = ctx.createOscillator(), o2 = ctx.createOscillator(), lp = ctx.createBiquadFilter(), g = ctx.createGain(), g2 = ctx.createGain();
    o.type = 'triangle'; o.frequency.value = f;
    o2.type = 'sine'; o2.frequency.value = f * 2; o2.detune.value = 4; g2.gain.value = .35;
    lp.type = 'lowpass'; lp.Q.value = .5;
    lp.frequency.setValueAtTime(3400, t); lp.frequency.exponentialRampToValueAtTime(700, t + .9);
    o.connect(lp); o2.connect(g2); g2.connect(lp); lp.connect(g);
    g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(.17 * v, t + .004);
    g.gain.exponentialRampToValueAtTime(.0001, t + 1.7);
    if (bus === 'sfx') { g.connect(sfx); const s = ctx.createGain(); s.gain.value = wet; g.connect(s); s.connect(verb); }
    else out(g, wet, rnd(-.5, .5));
    o.start(t); o2.start(t); o.stop(t + 1.9); o2.stop(t + 1.9);
  }
  function pad(t, chord) {
    const lp = ctx.createBiquadFilter(), g = ctx.createGain(), lfo = ctx.createOscillator(), lg = ctx.createGain();
    lp.type = 'lowpass'; lp.Q.value = .6; lp.frequency.value = 650;
    lfo.frequency.value = .09; lg.gain.value = 260; lfo.connect(lg); lg.connect(lp.frequency);
    const end = t + CHORD_DUR;
    g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(.05, t + 2.4);
    g.gain.setValueAtTime(.05, end - .4); g.gain.linearRampToValueAtTime(.0001, end + 3);
    chord.notes.forEach((m, i) => [-7, 7].forEach((det, k) => {
      const o = ctx.createOscillator(); o.type = k ? 'sawtooth' : 'triangle';
      o.frequency.value = mtof(m); o.detune.value = det + i;
      o.connect(lp); o.start(t); o.stop(end + 3.2);
    }));
    lfo.start(t); lfo.stop(end + 3.2);
    lp.connect(g); out(g, .6);
    const b = ctx.createOscillator(), bg = ctx.createGain();
    b.type = 'sine'; b.frequency.value = mtof(chord.root);
    bg.gain.setValueAtTime(.0001, t); bg.gain.linearRampToValueAtTime(.13, t + 1.2);
    bg.gain.setValueAtTime(.13, end - .5); bg.gain.linearRampToValueAtTime(.0001, end + 1.8);
    b.connect(bg); out(bg, .15); b.start(t); b.stop(end + 2);
  }
  function beat(t) {
    [[0, .2, 62], [.3, .13, 52]].forEach(([dt, lvl, f]) => {
      const o = ctx.createOscillator(), g = ctx.createGain(), lp = ctx.createBiquadFilter();
      o.type = 'sine'; o.frequency.setValueAtTime(f, t + dt); o.frequency.exponentialRampToValueAtTime(34, t + dt + .16);
      lp.type = 'lowpass'; lp.frequency.value = 140;
      g.gain.setValueAtTime(.0001, t + dt); g.gain.linearRampToValueAtTime(lvl, t + dt + .012);
      g.gain.exponentialRampToValueAtTime(.0001, t + dt + .22);
      o.connect(lp); lp.connect(g); g.connect(music); o.start(t + dt); o.stop(t + dt + .3);
    });
  }
  function bell(t) {
    const base = mtof([74, 77, 81, 86][Math.floor(Math.random() * 4)]);
    [[1, 1], [2.76, .5], [5.4, .22], [8.93, .1]].forEach(([r, a]) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = base * r;
      g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(.045 * a, t + .006);
      g.gain.exponentialRampToValueAtTime(.0001, t + 5.5 / r + .6);
      o.connect(g); out(g, .95, rnd(-.6, .6)); o.start(t); o.stop(t + 6.5);
    });
  }
  function boom(t, lvl) {
    const o = ctx.createOscillator(), g = ctx.createGain(), lp = ctx.createBiquadFilter();
    o.type = 'sine'; o.frequency.setValueAtTime(95, t); o.frequency.exponentialRampToValueAtTime(40, t + .55);
    lp.type = 'lowpass'; lp.frequency.value = 220;
    g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(lvl, t + .015);
    g.gain.exponentialRampToValueAtTime(.0001, t + .8);
    o.connect(lp); lp.connect(g); g.connect(sfx); o.start(t); o.stop(t + .9);
  }
  function swell(t, dur, lvl) {
    const s = ctx.createBufferSource(), bp = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf; bp.type = 'bandpass'; bp.Q.value = 1.1;
    bp.frequency.setValueAtTime(350, t); bp.frequency.exponentialRampToValueAtTime(3200, t + dur);
    g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(lvl, t + dur);
    g.gain.linearRampToValueAtTime(.0001, t + dur + .14);
    s.connect(bp); bp.connect(g); g.connect(sfx);
    const w = ctx.createGain(); w.gain.value = .5; g.connect(w); w.connect(verb);
    s.start(t, Math.random()); s.stop(t + dur + .2);
  }

  // ---------- music scheduler ----------
  function arpAt(t) {
    const ch = CHORDS[Math.floor(Math.max(0, t - t0) / CHORD_DUR) % CHORDS.length];
    const m = Math.random() < .22 ? SCALE[Math.floor(Math.random() * 7)] + 12
      : ch.notes[Math.floor(Math.random() * ch.notes.length)] + (Math.random() < .55 ? 12 : 24);
    pluck(t, m, rnd(.5, 1), .55);
  }
  function tick() {
    const now = ctx.currentTime;
    while (nextChord < now + 1.5) { pad(nextChord, CHORDS[chordIdx++ % CHORDS.length]); nextChord += CHORD_DUR; }
    while (nextArp < now + .5) { if (Math.random() < .62) arpAt(nextArp); nextArp += ARP_STEP * (Math.random() < .12 ? .5 : 1); }
    while (nextBeat < now + .5) { beat(nextBeat); nextBeat += BEAT_EVERY; }
    if (nextBell < now + 1) { bell(Math.max(now, nextBell)); nextBell = now + rnd(15, 30); }
  }

  // ---------- effects ----------
  const apps = [...document.querySelectorAll('.app')];
  function arrive(i) {
    const t = ctx.currentTime;
    swell(t, .55, .07); boom(t + .5, .2);
    pluck(t + .5, SCALE[i % 7] - 12, 1.2, .9, 'sfx');
    pluck(t + .62, SCALE[(i + 2) % 7], .7, .9, 'sfx');
  }
  function hoverNote(el) {
    const strip = el.closest('.strip');
    const i = strip ? [...strip.querySelectorAll('a')].indexOf(el) : Math.floor(Math.random() * 7);
    pluck(ctx.currentTime, SCALE[((i % 7) + 7) % 7] + 12, .55, .7, 'sfx');
  }
  function thud() {
    const t = ctx.currentTime; boom(t, .3);
    pluck(t, SCALE[0] - 12, 1, .8, 'sfx');
  }
  let lastHover = 0, lastEl = null;
  document.addEventListener('mouseover', e => {
    if (!on) return;
    const el = e.target.closest && e.target.closest('.strip a, .btn, .navcta, .snd, .logo');
    if (!el || el === lastEl) return;
    lastEl = el; const n = performance.now();
    if (n - lastHover < 70) return; lastHover = n;
    if (el.closest('.strip')) hoverNote(el);
    else pluck(ctx.currentTime, SCALE[4] + 24, .3, .6, 'sfx');
  });
  document.addEventListener('mouseout', e => { if (e.target.closest && e.target.closest('a,button')) lastEl = null; });
  document.addEventListener('click', e => {
    if (!on || (e.target.closest && e.target.closest('.snd'))) return;
    if (e.target.closest && e.target.closest('a,button')) thud();
  });

  // per-frame: wind follows scroll speed; announce the section that reaches the centre
  function loop(ts) {
    raf = requestAnimationFrame(loop);
    const dt = Math.max(.001, (ts - lastT) / 1000); lastT = ts;
    const sp = Math.abs(scrollY - lastY) / dt; lastY = scrollY;
    wind += (Math.min(1, sp / 2600) - wind) * .12;
    windGain.gain.setTargetAtTime(wind * wind * .3, ctx.currentTime, .06);
    windBP.frequency.setTargetAtTime(260 + wind * 2400, ctx.currentTime, .06);
    let best = -1, bd = 1e9;
    apps.forEach((a, i) => { const r = a.getBoundingClientRect(), d = Math.abs(r.top + r.height / 2 - innerHeight / 2); if (d < bd) { bd = d; best = i; } });
    if (best !== nearest && bd < innerHeight * .3 && ts > cooldown) { if (nearest !== -1) arrive(best); nearest = best; cooldown = ts + 500; }
    else if (best !== nearest && bd < innerHeight * .3) nearest = best;
  }

  // ---------- on / off ----------
  function ui() {
    const waiting = on && ctx && ctx.state !== 'running' && !document.hidden;
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    btn.querySelector('span').textContent = !on ? 'Sound off' : waiting ? 'Click to hear' : 'Sound on';
    btn.classList.toggle('on', on && !waiting);
    btn.classList.toggle('ping', !!waiting);
  }
  function enable() {
    init();
    ctx.resume();
    on = true; ui(); store.set('1');
    const now = ctx.currentTime;
    if (!t0) { t0 = now + .15; nextChord = t0; nextArp = t0 + 1.2; nextBeat = t0 + 2; nextBell = t0 + 9; }
    else { nextChord = Math.max(nextChord, now); nextArp = Math.max(nextArp, now); nextBeat = Math.max(nextBeat, now); }
    master.gain.cancelScheduledValues(now); master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(.55, now + 1.6);
    clearInterval(timer); timer = setInterval(tick, 110); tick();
    lastY = scrollY; lastT = performance.now(); cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
    nearest = -1;
  }
  function disable() {
    on = false; ui(); store.set('0');
    clearInterval(timer); cancelAnimationFrame(raf);
    const now = ctx.currentTime;
    master.gain.cancelScheduledValues(now); master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(0, now + .6);
    setTimeout(() => { if (!on && ctx) ctx.suspend(); }, 800);
  }
  btn.addEventListener('click', () => {
    if (on && ctx && ctx.state !== 'running' && !document.hidden) { ctx.resume(); return; }
    on ? disable() : enable();
  });
  document.addEventListener('visibilitychange', () => {
    if (!ctx || !on) return;
    if (document.hidden) ctx.suspend(); else ctx.resume();
  });
  // On by default (only an explicit "off" is remembered). Browsers refuse audio until the
  // visitor interacts, so: try now, and unlock on the first click, tap or key anywhere.
  if (store.get() !== '0') {
    enable();
    const unlock = e => {
      if (e.target.closest && e.target.closest('.snd')) return;       // the pill handles its own click
      if (on && ctx && ctx.state !== 'running') ctx.resume();
      if (!on || (ctx && ctx.state === 'running')) ['pointerdown', 'keydown', 'touchend', 'click'].forEach(t => removeEventListener(t, unlock, true));
    };
    ['pointerdown', 'keydown', 'touchend', 'click'].forEach(t => addEventListener(t, unlock, true));
  }
  ui();
})();
