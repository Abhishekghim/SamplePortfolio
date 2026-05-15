/* js/diver.js — scroll-driven diver animation */
'use strict';
(function initDiver() {
  const diver = $('#diver');
  const trail = $('#diver-trail');
  if (!diver) return;

  const sections = $$('section[data-depth]');

  // % of viewport height where diver sits at each section
  const yMap = [14, 26, 40, 56, 70, 85];
  const zoneClasses = ['zone-surface','zone-shallow','zone-mid','zone-deep','zone-abyss','zone-void'];

  let currentX   = window.innerWidth / 2;
  let targetX    = window.innerWidth / 2;
  let swayAngle  = 0;
  let lastTrail  = 0;
  let lastY      = 0;

  function getSectionInfo() {
    let idx = 0, inSec = 0;
    sections.forEach((s, i) => {
      const rect = s.getBoundingClientRect();
      const progress = clamp(-rect.top / rect.height, 0, 1);
      if (rect.top <= window.innerHeight * 0.45) {
        idx = i;
        inSec = progress;
      }
    });
    return { idx, inSec };
  }

  function update() {
    const { idx, inSec } = getSectionInfo();
    const nextIdx = Math.min(idx + 1, yMap.length - 1);

    // Vertical: interpolate between section depths
    const yVh = lerp(yMap[idx], yMap[nextIdx], inSec);
    const yPx = (yVh / 100) * window.innerHeight;

    // Horizontal sway
    swayAngle += 0.008;
    const sway = Math.sin(swayAngle) * 28 + Math.cos(swayAngle * 0.6) * 14;
    targetX = window.innerWidth / 2 + sway;
    currentX = lerp(currentX, targetX, 0.04);

    // Apply position
    diver.style.top  = yPx + 'px';
    diver.style.left = currentX + 'px';

    // Tilt: rotate when actively diving
    const dy = yPx - lastY;
    const tilt = clamp(dy * 1.8 + Math.sin(swayAngle * 1.3) * 4, -20, 30);
    lastY = lerp(lastY, yPx, 0.06);

    // Depth-based transforms
    const prog = scrollProgress();
    const depthShrink = 1 - prog * 0.22;
    diver.querySelector('svg').style.transform =
      `rotate(${tilt}deg) scale(${depthShrink})`;

    // Zone class
    zoneClasses.forEach(c => diver.classList.remove(c));
    diver.classList.add(zoneClasses[idx] || 'zone-surface');

    // Trail bubbles
    const now = Date.now();
    if (now - lastTrail > 420 && prog < 0.88) {
      spawnTrailBubble(currentX, yPx);
      lastTrail = now;
    }
  }

  function spawnTrailBubble(x, y) {
    if (!trail) return;
    const b = document.createElement('div');
    b.className = 'trail-b';
    const size = rand(4, 9);
    const tx   = rand(-18, 18);
    b.style.cssText = `
      position:fixed;
      width:${size}px; height:${size}px;
      left:${x + rand(-8,8)}px;
      top:${y + rand(20,40)}px;
      --tx:${tx}px;
      animation-duration:${rand(1.8,3)}s;
    `;
    document.body.appendChild(b);
    setTimeout(() => b.remove(), 3200);
  }

  raf(update);
})();
