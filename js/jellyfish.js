'use strict';
(function initJellyfish() {
  const layer = $('#layer-jellyfish');
  if (!layer) return;

  const ZONE_LEVELS    = { 'skills': 0, 'projects': 1, 'contact': 2 };
  const MAX_JELLIES    = { 0: 3, 1: 5, 2: 7 };
  const SPAWN_INTERVAL = 3200;
  const JELLY_SIZE     = 120;

  const activeJellies  = [];
  let spawnTimer       = null;
  let animRunning      = false;
  let lastLevel        = -2;

  // ── Key change: jellyfish live in PAGE space (absolute), not viewport (fixed)
  // j.x and j.y are page coordinates (scrollY included)
  // We convert to viewport coords only for the light marker

  function getDeepLevel() {
    let level = -1;
    $$('section[id]').forEach(s => {
      const rect = s.getBoundingClientRect();
      const inV  = rect.top < window.innerHeight * 0.65 && rect.bottom > window.innerHeight * 0.15;
      if (inV && ZONE_LEVELS[s.id] !== undefined)
        level = Math.max(level, ZONE_LEVELS[s.id]);
    });
    return level;
  }

  function buildJellyEl(level) {
    const wrapper = document.createElement('div');
    wrapper.className     = 'jelly';
    wrapper.dataset.level = level;
    wrapper.dataset.id    = Date.now() + '_' + Math.random().toString(36).slice(2);
    wrapper.setAttribute('role', 'img');
    wrapper.setAttribute('aria-label', 'Jellyfish — drag near content to illuminate it');
    wrapper.tabIndex = 0;
    wrapper.style.cssText = `width:${JELLY_SIZE}px; height:${JELLY_SIZE}px;`;

    lottie.loadAnimation({
      container: wrapper,
      renderer:  'svg',
      loop:      true,
      autoplay:  true,
      path:      'lottie/lottie.json',
    });

    return wrapper;
  }

  function buildLightMarker(level) {
    const light = document.createElement('div');
    light.className      = 'jelly-light';
    light.dataset.level  = level;
    light.dataset.active = '0';
    light.style.cssText  = 'position:fixed;opacity:0;pointer-events:none;left:-9999px;top:-9999px;';
    return light;
  }

  function spawnJelly(level) {
    const vw    = window.innerWidth;
    const vh    = window.innerHeight;
    const scrollY = window.scrollY;
    const speed = rand(0.28, 0.75);
    const edge  = randInt(0, 2); // 0=left, 1=right, 2=bottom — no top spawn, all go upward
    let startX, startY, vx, vy;

    switch (edge) {
    case 0: startX = -JELLY_SIZE-20; startY = scrollY + rand(vh*0.1, vh*0.9); vx=speed; vy=rand(-0.25, 0.25); break;
    case 1: startX = vw+JELLY_SIZE+20; startY = scrollY + rand(vh*0.1, vh*0.9); vx=-speed; vy=rand(-0.25, 0.25); break;
      default: // from bottom of viewport
        startX = rand(vw * 0.1, vw * 0.9);
        startY = scrollY + vh + JELLY_SIZE + 20;
        vx = rand(-0.2, 0.2); vy = -speed * 0.65;
    }

    const el    = buildJellyEl(level);
    const light = buildLightMarker(level);
    layer.appendChild(el);
    document.body.appendChild(light);

    const jelly = {
      el, light, level,
      x: startX, y: startY, vx, vy,
      phase: rand(0, Math.PI * 2), phaseSpeed: rand(0.007, 0.016),
      dragging: false, dragOX: 0, dragOY: 0,
      exiting: false,
    };

    requestAnimationFrame(() => el.classList.add('visible'));
    setupDrag(jelly);
    activeJellies.push(jelly);
    if (!animRunning) startLoop();
  }

  function exitJelly(jelly) {
    if (jelly.exiting) return;
    jelly.exiting  = true;
    jelly.dragging = false;
    const vw = window.innerWidth;
    const scrollY = window.scrollY;
    // viewport x is same as page x, viewport y = page y - scrollY
    const viewportY = jelly.y - scrollY;
    const toLeft  = jelly.x;
    const toRight = vw - jelly.x;
    const toTop   = viewportY;
    const min = Math.min(toLeft, toRight, toTop);
    const spd = rand(1.2, 2.2);
    if      (min === toLeft)  { jelly.vx = -spd; jelly.vy = rand(-0.2, 0); }
    else if (min === toRight) { jelly.vx =  spd; jelly.vy = rand(-0.2, 0); }
    else                      { jelly.vy = -spd; jelly.vx = rand(-0.2, 0.2); }
    jelly.el.classList.remove('visible');
  }

  function startLoop() {
    animRunning = true;
    (function tick() {
      if (activeJellies.length === 0) { animRunning = false; return; }

      const scrollY = window.scrollY;
      const vw = window.innerWidth, vh = window.innerHeight;

      for (let i = activeJellies.length - 1; i >= 0; i--) {
        const j = activeJellies[i];

        if (!j.dragging) {
          j.phase += j.phaseSpeed;
          const wx = Math.sin(j.phase * 1.1)  * 0.38;
          const wy = Math.cos(j.phase * 0.85) * 0.22 + Math.sin(j.phase * 0.5) * 0.16;

          j.x += j.vx + wx;
          j.y += j.vy + wy - 0.05;

         if (!j.exiting) {
          j.vx += (vw / 2 - j.x) * 0.00007;
          j.vy += (scrollY + vh / 2 - j.y) * 0.00007;
          j.vx *= 0.999;
         j.vy *= 0.999;
}
          // Position is absolute in page — set top/left directly
          j.el.style.left = j.x + 'px';
          j.el.style.top  = j.y + 'px';

          const angle = Math.atan2(j.vy, j.vx) * (180 / Math.PI) + 90;
          j.el.style.transform = `rotate(${angle}deg)`;
        }

        // Light marker needs VIEWPORT coordinates for the canvas
        const viewportX = j.x;                 // x is same in both spaces
        const viewportY = j.y - scrollY;        // convert page Y to viewport Y
        j.light.style.left     = (viewportX + JELLY_SIZE / 2) + 'px';
        j.light.style.top      = (viewportY + JELLY_SIZE / 2) + 'px';
        j.light.dataset.level  = j.level;
        const op = parseFloat(window.getComputedStyle(j.el).opacity) || 0;

        // Only show light if jellyfish is visible in viewport
        const inViewport = viewportY > -JELLY_SIZE && viewportY < vh + JELLY_SIZE;
        j.light.dataset.active = (op > 0.05 && inViewport) ? '1' : '0';

        // Remove if too far off screen horizontally or far above viewport
        const m = 300;
        if (j.x < -m || j.x > vw + m || viewportY < -(vh * 2)) {
          j.el.remove(); j.light.remove();
          activeJellies.splice(i, 1);
        }
      }
      requestAnimationFrame(tick);
    })();
  }

  function setupDrag(jelly) {
    const el = jelly.el;

    const onStart = e => {
      jelly.dragging = true;
      el.classList.add('dragging');
      const evt    = e.touches ? e.touches[0] : e;
      // dragOX/OY relative to page position
      jelly.dragOX = evt.clientX - jelly.x;
      jelly.dragOY = (evt.clientY + window.scrollY) - jelly.y;
      el.style.transform = 'rotate(0deg)';
      e.preventDefault();
    };

    const onMove = e => {
      if (!jelly.dragging) return;
      const evt = e.touches ? e.touches[0] : e;
      jelly.x = evt.clientX - jelly.dragOX;
      jelly.y = (evt.clientY + window.scrollY) - jelly.dragOY;
      el.style.left = jelly.x + 'px';
      el.style.top  = jelly.y + 'px';
      e.preventDefault();
    };

    const onEnd = () => {
      if (!jelly.dragging) return;
      jelly.dragging = false;
      el.classList.remove('dragging');
      jelly.vx = rand(-0.35, 0.35);
      jelly.vy = rand(-0.25, 0.25);
    };

    el.addEventListener('mousedown',  onStart, { passive: false });
    el.addEventListener('touchstart', onStart, { passive: false });
    document.addEventListener('mousemove', onMove, { passive: false });
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('mouseup',   onEnd);
    document.addEventListener('touchend',  onEnd);

    el.addEventListener('keydown', e => {
      const s = 22;
      if (e.key === 'ArrowLeft')  { jelly.x -= s; el.style.left = jelly.x + 'px'; }
      if (e.key === 'ArrowRight') { jelly.x += s; el.style.left = jelly.x + 'px'; }
      if (e.key === 'ArrowUp')    { jelly.y -= s; el.style.top  = jelly.y + 'px'; }
      if (e.key === 'ArrowDown')  { jelly.y += s; el.style.top  = jelly.y + 'px'; }
    });
  }

  function manageSpawning() {
    const level = getDeepLevel();
    if (level === lastLevel) return;
    lastLevel = level;

    if (level >= 0) {
      if (!spawnTimer) {
        spawnJelly(level);
        spawnTimer = setInterval(() => {
          const cur = getDeepLevel();
          if (cur < 0) { clearInterval(spawnTimer); spawnTimer = null; activeJellies.forEach(j => exitJelly(j)); return; }
          const maxJ = MAX_JELLIES[cur] ?? 3;
          if (activeJellies.filter(j => !j.exiting).length < maxJ) spawnJelly(cur);
          activeJellies.forEach(j => { j.level = cur; j.el.dataset.level = cur; j.light.dataset.level = cur; });
        }, SPAWN_INTERVAL);
      }
    } else {
      if (spawnTimer) { clearInterval(spawnTimer); spawnTimer = null; }
      activeJellies.forEach(j => exitJelly(j));
    }
  }

  window.addEventListener('scroll', manageSpawning, { passive: true });
  manageSpawning();
})();