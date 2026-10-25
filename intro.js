// Onboarding: a short title sequence that plays itself once per session and carries
// straight into the site. Two messages only, each given room to be read: the title card
// ("Seven apps. One enemy each.") and the wordmark with the tagline. Letterbox bars open
// on black, a red hairline draws across, film grain sits over everything, and the wordmark
// zooms through into the hero. Skippable (button or Esc); reduced motion skips it. The
// hero's own intro and smooth scrolling are held until it ends.
(function () {
  const root = document.documentElement;
  if (!root.classList.contains('intro')) return;
  window.__introReady = true;

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const g = window.gsap;

  let done = false, tl, grainTimer;
  function finish() {
    clearInterval(grainTimer);
    const ov = document.querySelector('.io'); if (ov) ov.remove();
    root.classList.remove('intro');
    if (window.__lenis) { window.__lenis.start(); window.__lenis.resize(); }
    if (window.__heroIntro) window.__heroIntro();
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  }
  if (!g || reduce) {
    try { sessionStorage.setItem('antiapps-intro', '1'); } catch (e) {}
    return finish();
  }

  const ov = document.createElement('div');
  ov.className = 'io';
  ov.setAttribute('role', 'presentation');
  ov.innerHTML =
    '<div class="io-bg"><img alt="" src="img/antiloki-plate.webp"></div><div class="io-vig"></div>' +
    '<div class="io-lb t"></div><div class="io-lb b"></div><div class="io-hair"></div>' +
    '<div class="io-stage"><h2 class="io-word">Seven apps. One <em>enemy</em> each.</h2></div>' +
    '<div class="io-final" hidden><div class="io-mark">anti<b>Apps</b></div>' +
    '<p class="io-tag">Get back to <strong>owning</strong>, <em>freedom</em> and <strong>privacy.</strong></p></div>' +
    '<div class="io-flash"></div><canvas class="io-grain"></canvas>' +
    '<button type="button" class="io-skip">Skip ›</button>';
  document.body.appendChild(ov);
  if (window.__lenis) window.__lenis.stop();

  const $ = s => ov.querySelector(s);
  const word = $('.io-word'), stage = $('.io-stage'), fin = $('.io-final'),
        flash = $('.io-flash'), hair = $('.io-hair'), lbs = ov.querySelectorAll('.io-lb'), plate = $('.io-bg img');

  // film grain: a tiny noise canvas restirred a few times a second, stretched over the screen
  const gc = $('.io-grain'), gx = gc.getContext('2d');
  gc.width = 192; gc.height = 108;
  const gd = gx.createImageData(192, 108);
  const stir = () => { for (let i = 0; i < gd.data.length; i += 4) { const v = Math.random() * 255; gd.data[i] = gd.data[i + 1] = gd.data[i + 2] = v; gd.data[i + 3] = 255; } gx.putImageData(gd, 0, 0); };
  stir(); grainTimer = setInterval(stir, 80);

  // the title card is deliberately restrained; the wordmark gets the giant treatment
  function fit() {
    word.style.fontSize = '100px';
    const w = word.getBoundingClientRect().width || 1;
    word.style.fontSize = Math.min(100 * innerWidth * .78 / w, 124, innerHeight * .5) + 'px';
  }
  fit();
  addEventListener('resize', () => { if (!done && !stage.hidden) fit(); });

  const finale = () => {
    stage.hidden = true; fin.hidden = false;
    g.fromTo(plate, { opacity: 0, scale: 1.18 }, { opacity: .35, scale: 1, duration: 3, ease: 'power1.out' });
    g.fromTo(flash, { opacity: .7 }, { opacity: 0, duration: .8, ease: 'power2.out' });
    g.to(lbs, { height: 0, duration: .9, ease: 'power3.inOut' });
    g.from('.io-mark', { yPercent: 30, opacity: 0, scale: .9, duration: .9, ease: 'power4.out' });
    g.from('.io-tag', { y: 20, opacity: 0, duration: .7, delay: .55 });
  };

  function exit() {
    if (done) return; done = true;
    if (tl) tl.kill();
    try { sessionStorage.setItem('antiapps-intro', '1'); } catch (e) {}
    g.killTweensOf([word, stage, flash, plate]);
    const out = g.timeline({ onComplete: finish });
    if (!fin.hidden) out.to($('.io-mark'), { scale: 4.5, opacity: 0, duration: .8, ease: 'power3.in' })
                         .to([$('.io-tag'), $('.io-skip')], { opacity: 0, y: 16, duration: .3 }, 0);
    else out.to([stage, $('.io-skip')], { opacity: 0, duration: .25 });
    out.add(() => { if (window.__heroIntro) window.__heroIntro(); }, '-=.45')
       .to(ov, { opacity: 0, duration: .5, ease: 'power1.inOut' }, '-=.4');
  }
  $('.io-skip').addEventListener('click', exit);
  addEventListener('keydown', e => { if (e.key === 'Escape' && !done) exit(); });

  // the cut sheet: ~5.5s to the hand-off
  tl = g.timeline({ delay: .15 });
  tl.to(lbs, { height: '11vh', duration: 1, ease: 'power3.inOut' }, 0)
    .to(hair, { scaleX: 1, duration: .6, ease: 'power3.inOut' }, .05)
    .to(hair, { opacity: 0, duration: .25 }, .65)
    .fromTo(word, { opacity: 0, letterSpacing: '.03em' }, { opacity: 1, letterSpacing: '-.05em', duration: 1.1, ease: 'power2.out' }, .6)
    .to(word, { opacity: 0, duration: .3 }, 2.45)
    .call(finale, null, 2.8)
    .call(exit, null, 2.8 + 2.2);
})();
