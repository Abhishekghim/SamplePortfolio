/* js/depth.js — depth HUD readout (the ocean canvas itself is driven by
   OCEAN.frame inside environment.js; this just reflects that state in the UI) */
'use strict';
(function initDepth() {
  const fill    = $('#depth-bar-fill');
  const readout = $('#depth-readout');
  const zoneEl  = $('#depth-zone');
  const hud     = $('#depth-hud');

  const sections = $$('section[data-depth]');
  const depths   = sections.map(s => Number.parseInt(s.dataset.depth, 10));
  const zones    = sections.map(s => s.dataset.zone || '');

  function update() {
    const prog    = scrollProgress();
    const scrollY = window.scrollY;

    // Which section + local progress
    let secIdx = 0, secProg = 0;
    sections.forEach((s, i) => {
      const top = s.offsetTop;
      const h   = s.offsetHeight;
      if (scrollY + window.innerHeight * 0.4 >= top) {
        secIdx  = i;
        secProg = clamp((scrollY + window.innerHeight * 0.4 - top) / h, 0, 1);
      }
    });

    // Interpolate depth value
    const d0    = depths[secIdx] || 0;
    const d1    = depths[Math.min(secIdx + 1, depths.length - 1)] || d0;
    const depth = Math.round(d0 + (d1 - d0) * secProg);
    if (window.OCEAN && window.OCEAN.frame) window.OCEAN.frame.currentDepth = depth;

    // Update HUD
    if (fill)    fill.style.height   = (prog * 100) + '%';
    if (readout) readout.textContent = depth + ' m';
    if (zoneEl)  zoneEl.textContent  = zones[secIdx] || '';
    if (hud)     hud.setAttribute('aria-valuenow', Math.round(prog * 100));
  }

  window.addEventListener('scroll', update, { passive: true });
  update();
})();
