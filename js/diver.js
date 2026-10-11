/* js/diver.js — kinematic scroll-driven scuba diver.
   - Always stays centered in the middle of the viewport.
   - No glowing halos or fuzzy drop-shadows.
   - Scroll Down: smoothly rotates 180° into a head-first downward dive pose with active fin kicking.
   - Stopped: smoothly rotates back to normal (0° upright trim).
   - Dynamic trail bubbles emerge naturally from the regulator and float upward. */
'use strict';
(function initDiver() {
  const diver = $('#diver');
  const trail = $('#diver-trail');
  if (!diver) return;

  const sections = $$('section[data-depth]');
  const zoneClasses = ['zone-surface','zone-shallow','zone-mid','zone-deep','zone-abyss','zone-void'];

  // Cache SVG elements for articulated fin kick and body rotation
  let rootGroup = null;
  let finLeft   = null;
  let finRight  = null;

  function initDiverElements() {
    rootGroup = diver.querySelector('#diver-root');
    finLeft   = diver.querySelector('#diver-fin-l');
    finRight  = diver.querySelector('#diver-fin-r');
  }
  initDiverElements();

  let currentPitch   = 0;     // degrees: 0 = upright (normal), 180 = diving down
  let targetPitch    = 0;
  let kickPhase      = 0;
  let lastTrail      = 0;

  // Real scroll tracking: detect downward scroll vs stopped
  let isScrollingDown = false;
  let scrollStopTimer = null;
  let lastScrollY = window.scrollY;
  let scrollSpeed = 0;

  window.addEventListener('scroll', () => {
    const sy = window.scrollY;
    const diff = sy - lastScrollY;
    scrollSpeed = Math.abs(diff);

    if (diff > 1) {
      // Actively scrolling down: rotate 180°
      isScrollingDown = true;
      clearTimeout(scrollStopTimer);
      // Delay for 0.35s (350ms) after downward scroll ceases before rotating back
      scrollStopTimer = setTimeout(() => {
        isScrollingDown = false;
        scrollSpeed = 0;
      }, 350);
    } else if (diff < -2) {
      // Explicitly scrolling up: return to normal (0°)
      isScrollingDown = false;
      clearTimeout(scrollStopTimer);
    }

    lastScrollY = sy;
  }, { passive: true });

  function getActiveSectionIndex() {
    let idx = 0;
    const vh = window.innerHeight;
    sections.forEach((s, i) => {
      const rect = s.getBoundingClientRect();
      if (rect.top <= vh * 0.5) idx = i;
    });
    return idx;
  }

  let lastTime = performance.now();

  function update() {
    const now = performance.now();
    const dt = Math.max(0.001, Math.min(0.08, (now - lastTime) / 1000));
    lastTime = now;

    const reduceMotion = window.OCEAN && window.OCEAN.reduceMotion;

    // 1. Target pitch: 180° when scrolling down, 0° (normal) when stopped
    if (reduceMotion) {
      targetPitch = 0;
    } else if (isScrollingDown) {
      targetPitch = 180;
    } else {
      targetPitch = 0;
    }

    // Time-based smooth rotation (consistent across all refresh rates & devices):
    // - Fast responsive flip to 180° while scrolling down (k = 16, ~0.15s)
    // - Slow, graceful glide back to 0° after the 0.35s delay (k = 4.2, ~0.8s smooth rotation)
    const k = isScrollingDown ? 16 : 4.2;
    const factor = 1 - Math.exp(-k * dt);
    currentPitch += (targetPitch - currentPitch) * factor;

    if (!isScrollingDown && currentPitch < 2.5) currentPitch = 0;
    if (isScrollingDown && currentPitch > 179.5) currentPitch = 180;

    // 2. Center diver permanently in the middle of the viewport
    diver.style.left = '50%';
    diver.style.top  = '50%';
    diver.style.transform = 'translate(-50%, -50%)';

    // 3. Rotate diver around its exact geometric center (60px, 90px in 120x180 viewBox)
    if (!rootGroup) initDiverElements();
    if (rootGroup) {
      rootGroup.style.transformOrigin = '60px 90px';
      rootGroup.style.transform = `rotate(${currentPitch}deg)`;
    }

    // 4. Articulated flutter kick on fins: active during dive, gentle during slow return
    const isReturning = Math.abs(currentPitch - targetPitch) > 2;
    const isMoving = isScrollingDown || isReturning || scrollSpeed > 2;
    const kickFreq = reduceMotion ? 0.02 : (isScrollingDown ? 0.22 : (isReturning ? 0.09 : 0.04));
    const kickAmp  = isScrollingDown ? 18 : (isReturning ? 10 : 5);
    kickPhase += kickFreq;

    if (finLeft && finRight && !reduceMotion) {
      const lAngle = Math.sin(kickPhase) * kickAmp;
      const rAngle = -Math.sin(kickPhase) * kickAmp;
      finLeft.style.transform  = `rotate(${lAngle}deg)`;
      finRight.style.transform = `rotate(${rAngle}deg)`;
    }

    // 5. Zone class & Depth filtering
    const secIdx = getActiveSectionIndex();
    zoneClasses.forEach(c => diver.classList.remove(c));
    diver.classList.add(zoneClasses[secIdx] || 'zone-surface');

    // 6. Waterline fade-in (diver appears smoothly when submerged below surface)
    const submerged = (window.OCEAN && window.OCEAN.frame.submerged) || 0;
    diver.style.opacity = submerged.toFixed(3);

    // 7. Dynamic trail bubbles
    const bubbleInterval = isMoving ? 240 : 500;
    if (now - lastTrail > bubbleInterval && submerged > 0.08) {
      spawnTrailBubble(currentPitch, isMoving);
      lastTrail = now;
    }
  }

  function spawnTrailBubble(pitch, isMoving) {
    if (!trail) return;
    const b = document.createElement('div');
    b.className = 'trail-b';
    const size = rand(5, 10);

    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;

    // Bubbles emerge near regulator mouth / head
    // Head is ~38px from center along rotation vector
    const rad = (pitch * Math.PI) / 180;
    const headOffX = Math.sin(rad) * 38;
    const headOffY = -Math.cos(rad) * 38;

    const spawnX = cx + headOffX + rand(-5, 5);
    const spawnY = cy + headOffY + rand(-3, 3);

    // Bubbles always float upward to surface
    const tx = rand(-18, 18);
    const riseDist = rand(70, 120);
    const dur = rand(1.6, 2.6);

    b.style.cssText = `
      position:fixed;
      width:${size}px; height:${size}px;
      left:${spawnX}px;
      top:${spawnY}px;
      --tx:${tx}px;
      --rise:${riseDist}px;
      animation-duration:${dur}s;
    `;
    document.body.appendChild(b);
    setTimeout(() => b.remove(), dur * 1000 + 100);
  }

  raf(update);
})();
