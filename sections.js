// Scroll transition between the numbered app sections: the same bend-toward-the-camera
// as the carousel tape, run vertically. A section that is away from the viewport centre
// tilts in 3D, lifts toward the viewer, streaks vertically and splits into red/blue
// fringes on the artwork, then fades; the next one arrives the same way in reverse.
// It is all driven by distance from the centre, so it plays on scroll in both directions.
(function () {
  const apps = [...document.querySelectorAll('.app')];
  if (!apps.length || matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const bgs = apps.map(a => a.querySelector('.bg')), inners = apps.map(a => a.querySelector('.inner'));
  const arts = apps.map(a => a.querySelector('.bg img'));

  // one filter per section (the offsets differ per section): vertical streak + R/B split
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('width', '0'); svg.setAttribute('height', '0');
  svg.style.cssText = 'position:absolute;width:0;height:0;pointer-events:none';
  const fx = apps.map((_, i) => {
    svg.insertAdjacentHTML('beforeend',
      '<filter id="sx' + i + '" x="-20%" y="-40%" width="140%" height="180%" color-interpolation-filters="sRGB">' +
      '<feGaussianBlur in="SourceGraphic" stdDeviation="0 0" result="b"/>' +
      '<feColorMatrix in="b" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r"/>' +
      '<feColorMatrix in="b" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g"/>' +
      '<feColorMatrix in="b" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="u"/>' +
      '<feOffset in="r" dx="0" dy="0" result="r2"/><feOffset in="u" dx="0" dy="0" result="u2"/>' +
      '<feBlend in="r2" in2="g" mode="screen" result="rg"/><feBlend in="rg" in2="u2" mode="screen"/></filter>');
    const f = svg.lastElementChild;
    return { blur: f.children[0], r: f.children[4], u: f.children[5] };
  });
  document.body.appendChild(svg);

  const sm = (a, b, v) => { const t = Math.max(0, Math.min(1, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
  let H = innerHeight, lastY = -1, hot = true;
  addEventListener('resize', () => { H = innerHeight; hot = true; });

  function reset(i) {
    for (const el of [bgs[i], inners[i]]) if (el && el.style.transform) { el.style.transform = ''; el.style.opacity = ''; el.style.filter = ''; el.style.transformOrigin = ''; }
    if (arts[i]) arts[i].style.filter = '';
  }

  function frame() {
    requestAnimationFrame(frame);
    if (scrollY === lastY && !hot) return;
    lastY = scrollY; hot = false;
    const D = H * 1.25;
    apps.forEach((a, i) => {
      const rc = a.getBoundingClientRect();
      if (rc.bottom < -H * .5 || rc.top > H * 1.5) return reset(i);
      const e = (rc.top + rc.height / 2 - H / 2) / H;      // 0 when centred, +-1 a full screen away
      const c = sm(.06, .7, Math.abs(e)), sgn = e < 0 ? -1 : 1;
      if (c < .003) return reset(i);

      const th = sgn * Math.pow(c, 1.25) * 58;               // deg: top/bottom edge comes toward the viewer
      const z = Math.pow(c, 1.4) * 170;                      // px toward the viewer
      const oy = H / 2 - rc.top;                              // viewport centre, in section coordinates
      const op = (1 - .85 * sm(.6, 1, c)).toFixed(3);
      // pivot on each element's own centre; vanishing point at the viewport centre
      const put = el => {
        const o = oy - el.offsetTop, cy = el.offsetHeight / 2;
        el.style.transformOrigin = '50% ' + o.toFixed(1) + 'px';
        el.style.transform = 'perspective(' + D + 'px) translate3d(0,' + (cy - o).toFixed(1) + 'px,' + z.toFixed(1) +
          'px) rotateX(' + th.toFixed(2) + 'deg) translate3d(0,' + (o - cy).toFixed(1) + 'px,0)';
        el.style.opacity = op;
      };
      const inn = inners[i], bg = bgs[i];
      if (inn) { put(inn); inn.style.filter = c > .12 ? 'blur(' + (c * c * 6).toFixed(1) + 'px)' : ''; }
      if (bg) put(bg);
      if (arts[i]) {
        if (c > .04) {
          const k = fx[i];
          k.blur.setAttribute('stdDeviation', '0 ' + (c * c * 16).toFixed(1));
          k.r.setAttribute('dy', (-c * 16).toFixed(1)); k.u.setAttribute('dy', (c * 16).toFixed(1));
          arts[i].style.filter = 'url(#sx' + i + ')';
        } else arts[i].style.filter = '';
      }
    });
  }
  requestAnimationFrame(frame);
})();
