// One continuous tape of app cards. It runs flat across the hero strip, curls off
// the right edge, and from the left end bends down and descends the whole page
// behind the content, then bends again into the "whole family" strip at the bottom.
// Cards flow along it without a break. Where it bends it lifts toward the camera
// and smears with colour split; in the flat parts it is one crisp texture sample.
// Raw WebGL, no dependencies. The ribbon is built once in page coordinates; each
// frame only moves the texture and the scroll offset.
(function () {
  const strips = [...document.querySelectorAll('.strip')];
  const s1 = strips[0], s2 = strips[1];
  if (!s1 || !s2) return;

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canvas = document.createElement('canvas');
  canvas.className = 'glf';
  canvas.setAttribute('aria-hidden', 'true');
  const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: true });
  if (!gl) return; // the plain <img> rows stay as the fallback

  const GAP = 12, RATIO = 4 / 3, SPEED = 36;
  const imgEls = [...s1.querySelectorAll('img')];
  const srcs = imgEls.map(i => i.currentSrc || i.src), names = imgEls.map(i => i.alt);
  const links1 = [...s1.querySelectorAll('a')], links2 = [...s2.querySelectorAll('a')];
  if (!srcs.length) return;

  // ---------- shaders ----------
  // aP is the distance along the tape; aV runs across it (0 = card top on the "up" side).
  // Two image orientations are blended through the bottom bend (aFlip) so that cards are
  // upright in both strips even though the tape has turned 180 degrees by then.
  const VS = `
    attribute vec3 aPos; attribute vec2 aOrg; attribute float aP, aV, aCurl, aDim, aFlip; attribute vec3 aN;
    uniform vec2 uRes; uniform float uD, uScrollY;
    varying float vP, vV, vCurl, vDim, vFlip; varying vec3 vN;
    void main(){
      float w = uD - aPos.z, k = uD / w;
      vec2 pg = aOrg + (aPos.xy - aOrg) * k;
      vec2 sc = vec2(pg.x, pg.y - uScrollY);
      gl_Position = vec4((sc.x / uRes.x * 2. - 1.) * w, (1. - sc.y / uRes.y * 2.) * w, (-aPos.z / 4000.) * w, w);
      vP = aP; vV = aV; vCurl = aCurl; vDim = aDim; vFlip = aFlip; vN = aN;
    }`;
  const FS = `
    precision highp float;
    uniform sampler2D uTex; uniform float uScroll, uPeriod, uVel, uTime;
    varying float vP, vV, vCurl, vDim, vFlip; varying vec3 vN;
    vec4 tap(float p){
      vec4 a = vec4(0.), b = vec4(0.);
      if (vFlip < .999) a = texture2D(uTex, vec2(fract((-p + uScroll) / uPeriod), vV));
      if (vFlip > .001) b = texture2D(uTex, vec2(fract((p - uScroll) / uPeriod), 1. - vV));
      return mix(a, b, vFlip);
    }
    void main(){
      float c = clamp(vCurl, 0., 1.);
      float f = abs(normalize(vN).z);
      float blur = c * min(abs(uVel), 600.) * .1 + c * c * 70. + (1. - f) * 30.;
      float ca = c * 20. + (1. - f) * 12.;
      vec3 col = vec3(0.); float a = 0.;
      if (blur < .3 && ca < .3) {
        vec4 g = tap(vP); col = g.rgb; a = g.a;      // flat parts: one clean sample
      } else {
        for (int i = 0; i < 9; i++){
          float o = (float(i) / 8. - .5) * blur;
          col.r += tap(vP + o + ca).r;
          vec4 g = tap(vP + o); col.g += g.g; a += g.a;
          col.b += tap(vP + o - ca).b;
        }
        col /= 9.; a /= 9.;
      }
      if (a < .01) discard;
      float shade = mix(1., .35 + .65 * f, c) * (1. - .5 * vDim);
      if (vN.z < 0.) shade *= .5;
      vec3 rb = .5 + .5 * cos(6.2832 * (vec3(0., .33, .67) + vV * .8 + c * 1.4 + uTime * .03));
      float keep = 1. - .3 * vDim;
      col = (col * shade + rb * pow(c, 1.4) * (1. - f) * .5 * a) * keep;
      gl_FragColor = vec4(col, a * keep);
    }`;
  function sh(type, src) {
    const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(s)); return null; }
    return s;
  }
  const vs = sh(gl.VERTEX_SHADER, VS), fs = sh(gl.FRAGMENT_SHADER, FS);
  if (!vs || !fs) return;
  const prog = gl.createProgram();
  gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);
  const U = n => gl.getUniformLocation(prog, n), A = n => gl.getAttribLocation(prog, n);
  const uRes = U('uRes'), uD = U('uD'), uScrollY = U('uScrollY'), uScroll = U('uScroll'),
        uPeriod = U('uPeriod'), uVel = U('uVel'), uTime = U('uTime');
  const vbo = gl.createBuffer(), ibo = gl.createBuffer(), tex = gl.createTexture();

  let W = 0, H = 0, cardH = 0, count = 0, period = 1, images = [], atlasKey = '', built = '', indexType = 0;
  let pc1 = 0, pc2 = 0, xc = 0, flatR = 0; // anchors need: path position of each strip's centre, clickable x range

  // ---------- atlas: one period of cards, premultiplied ----------
  function buildAtlas(ch, dpr) {
    const cw = Math.round(ch * RATIO);
    period = srcs.length * (cw + GAP);
    const maxT = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    const s = Math.min(Math.max(dpr, 2), maxT / period); // supersampled: stays crisp at sub-pixel offsets
    const cv = document.createElement('canvas');
    cv.width = Math.round(period * s); cv.height = Math.round(ch * s);
    const x = cv.getContext('2d');
    x.scale(s, s);
    images.forEach((img, i) => {
      const px = i * (cw + GAP), r = Math.max(6, ch * .06);
      x.save();
      x.beginPath(); x.roundRect(px, 0, cw, ch, r); x.clip();
      if (img && img.naturalWidth) {
        const k = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
        const w = img.naturalWidth * k, h = img.naturalHeight * k;
        x.drawImage(img, px + (cw - w) / 2, (ch - h) / 2, w, h);
      } else { x.fillStyle = '#1a1a1e'; x.fillRect(px, 0, cw, ch); }
      const bh = ch * .2;
      x.fillStyle = '#d2302c'; x.fillRect(px, ch - bh, cw, bh);
      x.fillStyle = '#111'; x.textBaseline = 'middle';
      x.font = '800 ' + (ch * .115) + 'px "Playfair Display", serif';
      x.fillText(names[i], px + ch * .07, ch - bh / 2 + ch * .005);
      x.restore();
    });
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cv);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }

  // ---------- the path ----------
  const FINE = 3, COARSE = 24, ROWS = 6, rad = Math.PI / 180;
  const sstep = t => t * t * (3 - 2 * t);

  // the lift-and-twist curl at a strip's right end, in a local frame (x right, y up, z to camera)
  function walk(half, D) {
    const s0 = half * .66, span = half * .42, maxArc = half * 1.7, zMax = D * .72, n = Math.ceil(maxArc / FINE);
    const out = [];
    let cx = 0, cy = 0, cz = 0, ux = 0, uy = 1, uz = 0, stopped = false;
    for (let i = 0; i <= n; i++) {
      const arc = i * FINE, d = Math.max(0, (arc - s0) / span), g = Math.pow(d, 1.55);
      const yaw = Math.min(g * 88, 125) * rad, pitch = Math.min(g * 60, 80) * rad;
      const tx = Math.cos(pitch) * Math.cos(yaw), ty = Math.sin(pitch), tz = Math.cos(pitch) * Math.sin(yaw);
      if (i > 0 && !stopped) {
        cx += tx * FINE; cy += ty * FINE; cz += tz * FINE;
        const dot = ux * tx + uy * ty + uz * tz;
        ux -= dot * tx; uy -= dot * ty; uz -= dot * tz;
        const l = Math.hypot(ux, uy, uz) || 1; ux /= l; uy /= l; uz /= l;
        const dr = (g - Math.pow(Math.max(0, (arc - FINE - s0) / span), 1.55)) * 38 * rad;
        const cr = Math.cos(dr), sr = Math.sin(dr);
        const kx = ty * uz - tz * uy, ky = tz * ux - tx * uz, kz = tx * uy - ty * ux;
        ux = ux * cr + kx * sr; uy = uy * cr + ky * sr; uz = uz * cr + kz * sr;
        if (cz > zMax) stopped = true;
      }
      out.push({ cx, cy, cz, ux, uy, uz, nx: ty * uz - tz * uy, ny: tz * ux - tx * uz, nz: tx * uy - ty * ux, d });
      if (stopped) break;
    }
    return out;
  }

  function build(Y1, Y2) {
    const w = cardH, half = W / 2, D = W * 1.1;
    const XL = w / 2 + 8, R = w * 1.05, Zb = R * .62, DIM = .7;
    xc = XL + R;
    flatR = half + half * .66;

    const S = []; let p = 0, prev = null;
    // x, y, z (page px, y down), up vector, normal, curl, dim, flip, projection origin.
    // The last argument is a nominal step kept for readability; the texture position p advances by
    // the real distance between samples. (Using the nominal step left a ~1px jump wherever the
    // spacing was shorter than nominal, e.g. at the exact middle of the bottom strip.)
    const push = (x, y, z, ux, uy, uz, nx, ny, nz, curl, dim, flip, ox, oy, _nominalStep) => {
      if (prev) p += Math.hypot(x - prev[0], y - prev[1], z - prev[2]);
      prev = [x, y, z];
      const l = Math.hypot(nx, ny, nz) || 1;
      S.push([x, y, z, ux, uy, uz, nx / l, ny / l, nz / l, p, curl, dim, flip, ox, oy]);
      return p;
    };

    // 1. the hero strip's right curl, travelled inward so the flow runs right to left
    const right = walk(half, D);
    for (let i = right.length - 1; i >= 0; i--) {
      const q = right[i];
      const pp = push(half + q.cx, Y1 - q.cy, q.cz, q.ux, -q.uy, q.uz, q.nx, -q.ny, q.nz, q.d, 0, 0, half, Y1, FINE);
      if (i === 0) pc1 = pp;
    }
    // 2. flat leftward to the start of the first bend
    for (let x = half - COARSE; x > xc; x -= COARSE) push(x, Y1, 0, 0, -1, 0, 0, 0, 1, 0, 0, 0, half, Y1, COARSE);
    // 3. first bend: left -> down, lifting toward the camera and back
    const n1 = Math.ceil(R * Math.PI / 2 / FINE);
    for (let i = 0; i <= n1; i++) {
      const t = i / n1, th = t * Math.PI / 2, sn = Math.sin(th), cs = Math.cos(th);
      const tz = 2 * Zb * Math.cos(Math.PI * t) / R;
      const Tx = -cs, Ty = sn, Ux = -sn, Uy = -cs;
      push(xc - R * sn, Y1 + R - R * cs, Zb * Math.sin(Math.PI * t), Ux, Uy, 0,
        -tz * Uy, tz * Ux, Tx * Uy - Ty * Ux,
        .7 * Math.sin(Math.PI * t), DIM * sstep(t), 0, xc, Y1 + R, i ? R * Math.PI / 2 / n1 : COARSE);
    }
    // 4. down the left side of the page: a travelling wave, so the tape keeps rippling toward
    //    the camera (smear, colour split, prism) the whole way down instead of lying flat
    const yTop = Y1 + R, yBot = Y2 - R, len = yBot - yTop, TAU = Math.PI * 2;
    let yLast = yTop;
    for (let y = yTop + FINE; y < yBot; y += FINE) {
      const sy = y - yTop;
      const a = sstep(Math.max(0, Math.min(1, Math.min(sy, len - sy) / 180))); // eases in/out of the bends
      const ph = TAU * sy / 640;
      const z = 100 * a * Math.sin(ph), dzdy = 100 * a * Math.cos(ph) * TAU / 640;
      const x = XL + 10 * a * Math.sin(TAU * sy / 900 + 1);
      const curl = a * (.5 + .3 * Math.sin(TAU * sy / 380 + 2));
      push(x, y, z, -1, 0, 0, 0, -dzdy, 1, curl, DIM, 0, x, y, FINE);
      yLast = y;
    }
    // 5. second bend: down -> right, turning the images upright through the blend
    const n2 = Math.ceil(R * Math.PI / 2 / FINE);
    for (let i = 0; i <= n2; i++) {
      const t = i / n2, ps = t * Math.PI / 2, sn = Math.sin(ps), cs = Math.cos(ps);
      const tz = 2 * Zb * Math.cos(Math.PI * t) / R;
      const Tx = sn, Ty = cs, Ux = -cs, Uy = sn;
      push(XL + R - R * cs, yBot + R * sn, Zb * Math.sin(Math.PI * t), Ux, Uy, 0,
        -tz * Uy, tz * Ux, Tx * Uy - Ty * Ux,
        .7 * Math.sin(Math.PI * t), DIM * (1 - sstep(t)), sstep(Math.max(0, Math.min(1, (t - .2) / .6))),
        XL + R, yBot, i ? R * Math.PI / 2 / n2 : Math.max(0, yBot - yLast));
    }
    // 6. flat rightward across the whole-family strip, then its right curl
    for (let x = xc + COARSE; x < half; x += COARSE) push(x, Y2, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, half, Y2, COARSE);
    pc2 = push(half, Y2, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, half, Y2, COARSE);
    for (let i = 1; i < right.length; i++) {
      const q = right[i];
      push(half + q.cx, Y2 - q.cy, q.cz, -q.ux, q.uy, -q.uz, q.nx, -q.ny, q.nz, q.d, 0, 1, half, Y2, FINE);
    }

    // vertices: ROWS+1 across the tape width. Layout: pos3 org2 p v n3 curl dim flip
    const F = 13, nv = S.length * (ROWS + 1), verts = new Float32Array(nv * F);
    let o = 0;
    for (const s of S) for (let r = 0; r <= ROWS; r++) {
      const v = r / ROWS - .5;
      verts[o++] = s[0] + s[3] * v * w; verts[o++] = s[1] + s[4] * v * w; verts[o++] = s[2] + s[5] * v * w;
      verts[o++] = s[13]; verts[o++] = s[14];
      verts[o++] = s[9]; verts[o++] = .5 - v;
      verts[o++] = s[6]; verts[o++] = s[7]; verts[o++] = s[8];
      verts[o++] = s[10]; verts[o++] = s[11]; verts[o++] = s[12];
    }
    const big = nv > 65000;
    if (big && !gl.getExtension('OES_element_index_uint')) return false;
    const idx = big ? new Uint32Array((S.length - 1) * ROWS * 6) : new Uint16Array((S.length - 1) * ROWS * 6);
    let q = 0;
    for (let i = 0; i < S.length - 1; i++) for (let r = 0; r < ROWS; r++) {
      const a = i * (ROWS + 1) + r, b = a + 1, c = a + ROWS + 1, d = c + 1;
      idx[q++] = a; idx[q++] = b; idx[q++] = c; idx[q++] = b; idx[q++] = d; idx[q++] = c;
    }
    count = idx.length; indexType = big ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT;
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo); gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);
    const B = 4, STRIDE = F * B;
    [['aPos', 3, 0], ['aOrg', 2, 3], ['aP', 1, 5], ['aV', 1, 6], ['aN', 3, 7], ['aCurl', 1, 10], ['aDim', 1, 11], ['aFlip', 1, 12]]
      .forEach(([nm, sz, off]) => { const l = A(nm); gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, sz, gl.FLOAT, false, STRIDE, off * B); });
    gl.uniform1f(uD, D);
    return true;
  }

  // ---------- layout ----------
  const sig = () => [Math.round(s1.getBoundingClientRect().top + scrollY), Math.round(s2.getBoundingClientRect().top + scrollY),
    Math.round(s1.offsetHeight), innerWidth, innerHeight].join(':');
  function layout() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const r1 = s1.getBoundingClientRect(), r2 = s2.getBoundingClientRect();
    W = innerWidth; H = innerHeight; cardH = r1.height;
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
    const key = Math.round(cardH) + ':' + dpr;
    if (key !== atlasKey) { atlasKey = key; buildAtlas(Math.round(cardH), dpr); }
    gl.uniform2f(uRes, W, H); gl.uniform1f(uPeriod, period);
    const ok = build(r1.top + scrollY + r1.height / 2, r2.top + scrollY + r2.height / 2);
    built = sig();
    return ok;
  }

  // ---------- clickable cards: the <a>s ride on the flat part of each strip ----------
  const mod = (a, m) => ((a % m) + m) % m;
  function place(links, strip, off, xmin, xmax) {
    const c = Math.round(cardH * RATIO), pt = c + GAP, left = strip.getBoundingClientRect().left;
    links.forEach((a, j) => {
      let x = mod(j * pt + off, period);
      x += period * Math.ceil((xmin - x) / period);
      if (x + c <= xmax) {
        a.style.width = c + 'px'; a.style.height = cardH + 'px';
        a.style.transform = 'translate3d(' + (x - left).toFixed(1) + 'px,0,0)';
        a.style.visibility = 'visible';
      } else a.style.visibility = 'hidden';
    });
  }
  function updateLinks() {
    const half = W / 2;
    place(links1, s1, pc1 + half - scroll, xc, flatR);
    place(links2, s2, -pc2 + half + scroll, xc, flatR);
  }

  // ---------- loop ----------
  let scroll = 0, vel = SPEED, last = 0, running = false, lastY = scrollY, boost = 0;
  function draw(t) {
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.uniform1f(uScrollY, scrollY); gl.uniform1f(uScroll, scroll);
    gl.uniform1f(uVel, vel); gl.uniform1f(uTime, t / 1000);
    gl.drawElements(gl.TRIANGLES, count, indexType, 0);
    updateLinks();
  }
  function frame(t) {
    if (!running) return;
    const dt = Math.min(.05, (t - last) / 1000 || 0); last = t;
    const dy = scrollY - lastY; lastY = scrollY;
    boost += (Math.max(-900, Math.min(900, dy / Math.max(dt, .001))) * .5 - boost) * .12;
    vel = SPEED + boost;
    scroll = mod(scroll + vel * dt, period);
    if (sig() !== built) layout();
    draw(t);
    requestAnimationFrame(frame);
  }
  function setRunning() {
    const want = !document.hidden && !reduce;
    if (want && !running) { running = true; last = performance.now(); lastY = scrollY; requestAnimationFrame(frame); }
    else if (!want) running = false;
  }

  // the card labels use Playfair; wait for it, but never stall the carousel on a slow font request
  const fontReady = document.fonts && document.fonts.load
    ? Promise.race([document.fonts.load('800 20px "Playfair Display"').catch(() => {}), new Promise(r => setTimeout(r, 1200))])
    : Promise.resolve();
  Promise.all([fontReady].concat(srcs.map(s => new Promise(res => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = s; }))))
    .then(res => {
      images = res.slice(1);
      document.body.appendChild(canvas);
      if (!layout()) { canvas.remove(); return; }
      draw(0);
      document.documentElement.classList.add('gl');
      setRunning();
      let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { layout(); draw(performance.now()); }, 120); });
      if (reduce) addEventListener('scroll', () => { if (sig() !== built) layout(); draw(performance.now()); }, { passive: true });
      document.addEventListener('visibilitychange', setRunning);
    });
})();
