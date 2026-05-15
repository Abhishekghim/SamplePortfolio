/* js/depth.js — depth HUD, parallax, darkness overlay */
'use strict';
(function initDepth() {
  const fill     = $('#depth-bar-fill');
  const readout  = $('#depth-readout');
  const zoneEl   = $('#depth-zone');
  const skyLayer = $('#layer-sky');
  const raysEl   = $('#layer-rays');
  const hud      = $('#depth-hud');
  const darknessOverlay = $('#full-darkness-overlay');

  const sections  = $$('section[data-depth]');
  const depths    = sections.map(s => parseInt(s.dataset.depth));
  const zones     = sections.map(s => s.dataset.zone || '');

  let lastScrollTime = 0;
  const SCROLL_THROTTLE = 16; // ~60fps

  function update() {
    const now = performance.now();
    if (now - lastScrollTime < SCROLL_THROTTLE) return;
    lastScrollTime = now;

    const prog    = scrollProgress();
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const scrollY   = window.scrollY;

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
    const d0   = depths[secIdx] || 0;
    const d1   = depths[Math.min(secIdx + 1, depths.length - 1)] || d0;
    const depth = Math.round(d0 + (d1 - d0) * secProg);

    // Debug depth calculation
    if (Math.random() < 0.01) { // Log occasionally to avoid spam
      console.log(`Current depth: ${depth}, section: ${secIdx}, progress: ${secProg.toFixed(2)}`);
    }

    // Update HUD
    if (fill)    fill.style.height    = (prog * 100) + '%';
    if (readout) readout.textContent  = depth + ' m';
    if (zoneEl)  zoneEl.textContent   = zones[secIdx] || '';
    if (hud)     hud.setAttribute('aria-valuenow', Math.round(prog * 100));

    // Darkness overlay - very aggressive to hide content without jellyfish
    const darkness = Math.pow(prog, 0.42) * 0.98;
    if (skyLayer) skyLayer.style.background = `rgba(0,0,0,${darkness})`;

    // Full page darkness overlay - covers everything
    const fullDarkness = Math.max(0, (prog - 0.25) * 1.2); // Starts darkening at 25% scroll
    if (darknessOverlay) darknessOverlay.style.background = `rgba(0,0,0,${fullDarkness})`;

    // Content darkness - text and elements get darker in deep sections
    const contentDarkness = Math.max(0, (prog - 0.6) * 2.5); // Starts darkening at 60% scroll
    document.documentElement.style.setProperty('--content-darkness', contentDarkness);

    // Apply darkness to all text elements in deep sections
    $$('section[data-depth]').forEach(section => {
      const depth = parseInt(section.dataset.depth);
      if (depth >= 200) { // Only deep sections get content darkness
        const sectionDarkness = Math.max(0, (depth - 200) / 800); // 200m = 0 darkness, 1000m = 1 darkness
        section.style.setProperty('--section-darkness', sectionDarkness);
      }
    });
  }

  window.addEventListener('scroll', update, { passive: true });
  update();
})();
