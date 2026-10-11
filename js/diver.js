/* js/diver.js — kinematic scroll-driven diver animation.
   Reliably detects scroll direction and velocity with exponential smoothing.
   - Downward Dive: Smoothly rotates head-down into a streamlined dive pose (40°–58°),
     initiates active flutter kick cycle on fins, bubbles stream upward.
   - Upward Swim: Smoothly rotates toward the surface (-38°–-54°), head pointing up,
     natural upward kick cycle, bubbles trail upward/backward.
   - Neutral Drift: Eases to relaxed horizontal trim (-4°–+8°) with ocean swell bobbing.
   - Continuous dampening prevents snapping or jitter during rapid scroll reversals. */
'use strict';
(function initDiver() {
  const diver = $('#diver');
  const trail = $('#diver-trail');
  if (!diver) return;

  const sections = $$('section[data-depth]');
  const yMap = [14, 26, 40, 56, 70, 85];
  const zoneClasses = ['zone-surface','zone-shallow','zone-mid','zone-deep','zone-abyss','zone-void'];

  // Cache SVG elements for articulated fin flutter kick
  let rootGroup = null;
  let finLeft   = null;
  let finRight  = null;

  function initDiverElements() {
    rootGroup = diver.querySelector('#diver-root');
    finLeft   = diver.querySelector('#diver-fin-l');
    finRight  = diver.querySelector('#diver-fin-r');
  }
  initDiverElements();

  let currentX       = window.innerWidth / 2;
  let targetX        = window.innerWidth / 2;
  let currentY       = window.innerHeight * 0.15;
  let targetY        = window.innerHeight * 0.15;
  let currentPitch   = 10;   // degrees
  let targetPitch    = 10;   // degrees
  let kickPhase      = 0;
  let swayAngle      = 0;
  let lastTrail      = 0;

  // Velocity tracking
  let lastScrollY    = window.scrollY;
  let lastTime       = performance.now();
  let smoothVelocity = 0;   // px / sec (positive = descending, negative = ascending)

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
    const now = performance.now();
    const dt = Math.max(0.001, Math.min(0.1, (now - lastTime) / 1000));
    lastTime = now;

    const scrollY = window.scrollY;
    const instantVelocity = (scrollY - lastScrollY) / dt;
    lastScrollY = scrollY;

    // Exponential smoothing on velocity (rejects trackpad noise and jitter)
    smoothVelocity += (instantVelocity - smoothVelocity) * 0.14;

    const { idx, inSec } = getSectionInfo();
    const nextIdx = Math.min(idx + 1, yMap.length - 1);

    // 1. Vertical position interpolation between depth zones
    const yVh = lerp(yMap[idx], yMap[nextIdx], inSec);
    targetY = (yVh / 100) * window.innerHeight;
    currentY = lerp(currentY, targetY, 0.08);

    // 2. Horizontal oceanic current sway & neutral breathing bob
    swayAngle += 0.012;
    const swellX = Math.sin(swayAngle) * 26 + Math.cos(swayAngle * 0.6) * 12;
    const swellY = Math.sin(swayAngle * 1.6) * 6; // breathing buoyancy
    targetX = window.innerWidth / 2 + swellX;
    currentX = lerp(currentX, targetX, 0.045);

    diver.style.top  = (currentY + swellY) + 'px';
    diver.style.left = currentX + 'px';

    // 3. Scroll Direction & Kinematic Pitch
    // Descending (> 30 px/s): pitch down head-first (+35° to +58°)
    // Ascending (< -30 px/s): pitch up toward surface (-35° to -54°)
    // Neutral (idle): ease to relaxed horizontal trim (-4° to +8°)
    const speed = Math.abs(smoothVelocity);
    const reduceMotion = window.OCEAN && window.OCEAN.reduceMotion;

    if (reduceMotion) {
      targetPitch = 0;
    } else if (smoothVelocity > 35) {
      const diveIntensity = clamp((smoothVelocity - 35) / 500, 0, 1);
      targetPitch = 38 + diveIntensity * 20; // 38° -> 58° downward dive
    } else if (smoothVelocity < -35) {
      const riseIntensity = clamp((-smoothVelocity - 35) / 500, 0, 1);
      targetPitch = -36 - riseIntensity * 18; // -36° -> -54° upward swim
    } else {
      // Neutral buoyancy horizontal trim with slight water current sway
      targetPitch = 4 + Math.sin(swayAngle * 0.8) * 5;
    }

    // Smooth rotational damping (prevents jarring snaps on rapid reversal)
    const rotSpeed = speed > 100 ? 0.09 : 0.06;
    currentPitch = lerp(currentPitch, targetPitch, rotSpeed);

    // 4. Articulated Flutter Kick on Fins
    if (!rootGroup) initDiverElements();

    if (rootGroup) {
      // Rotate diver around center of mass (60px, 75px)
      rootGroup.style.transformOrigin = '60px 75px';
      rootGroup.style.transform = `rotate(${currentPitch}deg)`;
    }

    // Kick frequency & amplitude scale with swimming speed
    const kickFreq = reduceMotion ? 0.02 : 0.05 + clamp(speed / 350, 0, 1) * 0.22;
    const kickAmp  = 6 + clamp(speed / 300, 0, 1) * 16; // 6° idle -> 22° active kick
    kickPhase += kickFreq;

    if (finLeft && finRight && !reduceMotion) {
      const lAngle = Math.sin(kickPhase) * kickAmp;
      const rAngle = -Math.sin(kickPhase) * kickAmp;
      finLeft.style.transform  = `rotate(${lAngle}deg)`;
      finRight.style.transform = `rotate(${rAngle}deg)`;
    }

    // 5. Zone class & Depth filtering
    zoneClasses.forEach(c => diver.classList.remove(c));
    diver.classList.add(zoneClasses[idx] || 'zone-surface');

    // 6. Waterline fade-in (diver only appears underwater)
    const submerged = (window.OCEAN && window.OCEAN.frame.submerged) || 0;
    diver.style.opacity = submerged.toFixed(3);

    // 7. Dynamic Trail Bubbles
    const prog = scrollProgress();
    const bubbleInterval = speed > 100 ? 240 : 450;
    if (now - lastTrail > bubbleInterval && prog < 0.90 && submerged > 0.08) {
      spawnTrailBubble(currentX, currentY, currentPitch, smoothVelocity);
      lastTrail = now;
    }
  }

  function spawnTrailBubble(x, y, pitch, vel) {
    if (!trail) return;
    const b = document.createElement('div');
    b.className = 'trail-b';
    const size = rand(5, 11);

    // Bubbles emerge near regulator mouth / head
    const rad = (pitch * Math.PI) / 180;
    const headOffX = Math.sin(rad) * 22;
    const headOffY = -Math.cos(rad) * 22;

    const spawnX = x + headOffX + rand(-6, 6);
    const spawnY = y + headOffY + rand(-4, 4);

    // Bubbles always rise upward with buoyant wobble
    const tx = rand(-22, 22) + (vel > 0 ? -Math.sin(rad) * 18 : 0);
    const riseDist = rand(70, 130);
    const dur = rand(1.8, 2.8);

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
