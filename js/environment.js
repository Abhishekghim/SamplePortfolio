/* js/environment.js — the underwater canvas engine.
   Central rAF loop, publishes frame state to OCEAN.frame, drives Three.js WebGL,
   draws fog, caustics, kelp forest, coral reefs, shipwreck, particles, and bubbles. */
'use strict';
(function initEnvironment() {

  const O = window.OCEAN;
  const F = O.frame;

  // Preload genuine environmental assets
  const imgKelp     = new Image(); imgKelp.src     = 'assets/svg/kelp-forest.svg';
  const imgCoralFan = new Image(); imgCoralFan.src = 'assets/svg/coral-fan.svg';
  const imgCoralBrn = new Image(); imgCoralBrn.src = 'assets/svg/coral-brain.svg';
  const imgCoralStg = new Image(); imgCoralStg.src = 'assets/svg/coral-staghorn.svg';
  const imgWreck    = new Image(); imgWreck.src    = 'assets/svg/shipwreck-detailed.svg';

  const cv  = document.createElement('canvas');
  cv.id = 'env-canvas';
  cv.setAttribute('aria-hidden', 'true');
  const ctx = cv.getContext('2d', { alpha: true });

  const oceanCanvas = document.getElementById('ocean-canvas');
  (oceanCanvas || document.body).appendChild(cv);

  let dpr = 1, W = 0, H = 0;
  let plankton = [], drift = [], bubbles = [];
  let kelp = [], coral = [], ridges = [], wreck = null;
  let anchors = {};
  const t0 = performance.now();

  /* ────────────────────────────────────────────
     SIZING
  ──────────────────────────────────────────── */
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    W = window.innerWidth;
    H = window.innerHeight;
    cv.width  = Math.round(W * dpr);
    cv.height = Math.round(H * dpr);
    cv.style.width  = W + 'px';
    cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    F.vw = W; F.vh = H;
    computeAnchors();
    buildParticles();
    buildTerrain();
    if (window.ThreeEnv && window.ThreeEnv.resize) window.ThreeEnv.resize();
  }

  let sectionList = [];
  function computeAnchors() {
    anchors = {};
    sectionList = $$('section[data-depth]').map(s => ({
      id: s.id,
      top: s.offsetTop,
      h: s.offsetHeight,
      depth: Number.parseInt(s.dataset.depth, 10) || 0
    }));
    sectionList.forEach(s => {
      anchors[s.id] = { top: s.top, h: s.h };
    });
  }

  /* ────────────────────────────────────────────
     PARTICLES
  ──────────────────────────────────────────── */
  function buildParticles() {
    const d = O.density;

    plankton = [];
    for (let i = 0; i < d.plankton; i++) {
      plankton.push({
        x: rand(0, W), y: rand(0, H * 2),
        r: rand(0.6, 2.0),
        a: rand(0.15, 0.45),
        parallax: rand(0.82, 1.04),
        drift: rand(-0.16, 0.16),
        rise: rand(-0.06, 0.14),
        phase: rand(0, Math.PI * 2),
        wob: rand(0.004, 0.014),
      });
    }

    drift = [];
    for (let i = 0; i < d.drift; i++) {
      drift.push({
        x: rand(0, W), y: rand(0, H * 2),
        r: rand(3, 9),
        a: rand(0.05, 0.14),
        parallax: rand(1.08, 1.35),
        dx: rand(-0.2, 0.2),
        dy: rand(-0.14, 0.06),
        phase: rand(0, Math.PI * 2),
      });
    }

    bubbles = [];
    for (let i = 0; i < d.bubbles; i++) bubbles.push(newBubble(rand(0, H)));
  }

  function newBubble(y) {
    return {
      x: rand(0, W),
      y: y != null ? y : H + rand(10, 120),
      r: rand(2.0, 7.0),
      speed: rand(0.6, 1.8),
      wobble: rand(0.012, 0.035),
      amp: rand(5, 18),
      phase: rand(0, Math.PI * 2),
      a: rand(0.22, 0.55),
    };
  }

  /* ────────────────────────────────────────────
     TERRAIN — Kelp forest, coral reefs, seabed ridges, shipwreck
  ──────────────────────────────────────────── */
  function buildTerrain() {
    const d = O.density;
    const doc = document.documentElement.scrollHeight;

    const reefTop  = anchors.education ? anchors.education.top : doc * 0.35;
    const reefH    = anchors.education ? anchors.education.h   : H;
    const skillTop = anchors.skills ? anchors.skills.top : doc * 0.55;
    const projTop  = anchors.projects ? anchors.projects.top : doc * 0.72;

    /* Kelp Forest — slender, natural proportions */
    kelp = [];
    for (let i = 0; i < d.kelp; i++) {
      const band = Math.random();
      const baseY = band < 0.6
        ? reefTop + reefH * rand(0.55, 1.05)
        : skillTop + rand(-0.1, 0.5) * H;
      kelp.push({
        x: rand(-30, W + 30),
        baseY,
        h: rand(H * 0.32, H * 0.65),
        w: rand(45, 75), // Proportionate width
        sway: rand(0.35, 0.85),
        phase: rand(0, Math.PI * 2),
        parallax: rand(0.82, 1.0),
        a: rand(0.30, 0.55),
      });
    }

    /* Coral Reef Beds — natural scale */
    coral = [];
    for (let i = 0; i < d.coral; i++) {
      coral.push({
        x: rand(-20, W + 20),
        baseY: reefTop + reefH * rand(0.75, 1.08),
        s: rand(0.65, 1.1),
        kind: randInt(0, 2), // 0: fan, 1: brain, 2: staghorn
        parallax: rand(0.86, 1.0),
        a: rand(0.38, 0.65),
        phase: rand(0, Math.PI * 2),
      });
    }

    /* Seabed Ridges */
    ridges = [];
    const ridgeAnchors = [
      { y: reefTop + reefH * 1.02, a: 0.50, parallax: 0.94, amp: 0.16 },
      { y: skillTop + H * 0.85,    a: 0.42, parallax: 0.84, amp: 0.22 },
      { y: projTop + H * 0.95,     a: 0.55, parallax: 0.9,  amp: 0.28 },
    ];
    ridgeAnchors.forEach(cfg => {
      const pts = [];
      const n = 14;
      let h = rand(0.3, 0.7);
      for (let i = 0; i <= n; i++) {
        h = clamp(h + rand(-0.22, 0.22), 0.12, 1);
        pts.push({ x: (i / n) * (W + 120) - 60, y: -h * H * cfg.amp });
      }
      ridges.push({ ...cfg, pts });
    });

    /* Sunken Shipwreck — tasteful background landmark */
    wreck = {
      y: projTop + H * 0.68,
      x: W * rand(0.60, 0.74),
      s: Math.min(W, H) / 1200 * rand(0.75, 0.95), // Well-proportioned
      parallax: 0.82,
      a: 0.70,
    };
  }

  function drawKelp(scrollY, tint, life) {
    if (life <= 0.02 || !imgKelp.complete) return;
    kelp.forEach(k => {
      const sy = k.baseY - scrollY * k.parallax;
      if (sy < -k.h || sy > H + 60) return;
      const swayT = F.t * k.sway + k.phase;
      const swayAngle = Math.sin(swayT) * 0.07;

      ctx.save();
      ctx.translate(k.x, sy);
      ctx.rotate(swayAngle);
      ctx.globalAlpha = k.a * life;
      ctx.drawImage(imgKelp, -k.w * 0.5, -k.h, k.w, k.h);
      ctx.restore();
    });
  }

  function drawCoral(scrollY, tint, life) {
    if (life <= 0.02) return;
    coral.forEach(c => {
      const sy = c.baseY - scrollY * c.parallax;
      if (sy < -140 || sy > H + 60) return;

      let img = null;
      let cw = 70, ch = 70;
      if (c.kind === 0 && imgCoralFan.complete) {
        img = imgCoralFan; cw = 75; ch = 75;
      } else if (c.kind === 1 && imgCoralBrn.complete) {
        img = imgCoralBrn; cw = 80; ch = 60;
      } else if (c.kind === 2 && imgCoralStg.complete) {
        img = imgCoralStg; cw = 75; ch = 75;
      }

      if (!img) return;

      ctx.save();
      ctx.translate(c.x, sy);
      ctx.scale(c.s, c.s);
      ctx.globalAlpha = c.a * life;
      ctx.drawImage(img, -cw * 0.5, -ch, cw, ch);
      ctx.restore();
    });
  }

  function drawRidges(scrollY, water) {
    ridges.forEach(r => {
      const sy = r.y - scrollY * r.parallax;
      if (sy < -H * 0.6 || sy > H + H * 0.6) return;
      ctx.fillStyle = `rgba(${water[0] * 0.35 | 0},${water[1] * 0.4 | 0},${water[2] * 0.45 | 0},${r.a})`;
      ctx.beginPath();
      ctx.moveTo(r.pts[0].x, sy + r.pts[0].y);
      for (let i = 1; i < r.pts.length; i++) {
        const p = r.pts[i], prev = r.pts[i - 1];
        const mx = (prev.x + p.x) / 2;
        ctx.quadraticCurveTo(prev.x, sy + prev.y, mx, sy + (prev.y + p.y) / 2);
      }
      ctx.lineTo(W + 60, sy + 400);
      ctx.lineTo(-60, sy + 400);
      ctx.closePath();
      ctx.fill();
    });
  }

  function drawWreck(scrollY, tint) {
    if (!wreck || !imgWreck.complete) return;
    const sy = wreck.y - scrollY * wreck.parallax;
    if (sy < -H * 0.9 || sy > H + H * 0.9) return;

    ctx.save();
    ctx.translate(wreck.x, sy);
    ctx.rotate(-0.06);
    const ww = 250 * wreck.s;
    const wh = 142 * wreck.s;
    ctx.globalAlpha = wreck.a * 0.65;
    ctx.drawImage(imgWreck, -ww * 0.5, -wh * 0.75, ww, wh);
    ctx.restore();
  }

  function drawCaustics(strength) {
    if (strength <= 0.02 || O.tier === 'mobile') return;
    const rows = 3;
    const t = F.t * 0.45;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = `rgba(200,248,255,${0.05 * strength})`;
    ctx.lineWidth = 1.3;
    for (let r = 0; r < rows; r++) {
      const cy = (r + 1) * (H * 0.25);
      ctx.beginPath();
      for (let x = -40; x <= W + 40; x += 38) {
        const y = cy + Math.sin(x * 0.02 + t + r) * 12 + Math.cos(x * 0.014 - t * 0.8) * 6;
        if (x === -40) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawPlankton(scrollY, fog, slow) {
    ctx.fillStyle = O.rgba(fog, 0.35);
    plankton.forEach(p => {
      p.x += p.drift * slow;
      p.y -= p.rise * slow;
      p.phase += p.wob * slow;
      const sy = p.y - scrollY * p.parallax;
      if (sy < -20 || sy > H + 20 || p.x < -20 || p.x > W + 20) {
        if (sy < -20) p.y = scrollY + H + 20;
        if (sy > H + 20) p.y = scrollY - 20;
        p.x = rand(0, W);
        return;
      }
      const a = p.a * (0.6 + Math.sin(p.phase) * 0.4);
      ctx.fillStyle = `rgba(220,245,255,${a * 0.45})`;
      ctx.beginPath();
      ctx.arc(p.x, sy, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawBubbles(slow, sub) {
    if (sub <= 0.01) return;
    bubbles.forEach(b => {
      b.y -= b.speed * slow;
      b.phase += b.wobble * slow;
      const bx = b.x + Math.sin(b.phase) * b.amp;

      if (b.y < -30) {
        Object.assign(b, newBubble());
        return;
      }

      ctx.save();
      ctx.strokeStyle = `rgba(255,255,255,${b.a * 0.55})`;
      ctx.lineWidth = 1.1;

      const bg = ctx.createRadialGradient(
        bx - b.r * 0.35, b.y - b.r * 0.35, b.r * 0.1,
        bx, b.y, b.r
      );
      bg.addColorStop(0,   `rgba(255,255,255,${b.a * 0.75})`);
      bg.addColorStop(0.4, `rgba(180,240,255,${b.a * 0.22})`);
      bg.addColorStop(1,   'rgba(100,200,240,0.04)');

      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.arc(bx, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.beginPath();
      ctx.arc(bx - b.r * 0.32, b.y - b.r * 0.32, b.r * 0.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    });
  }

  function drawDrift(scrollY, fog, slow) {
    drift.forEach(d => {
      d.x += d.dx * slow;
      d.y += d.dy * slow;
      const sy = d.y - scrollY * d.parallax;
      if (sy < -40 || sy > H + 40 || d.x < -40 || d.x > W + 40) {
        d.y = scrollY + rand(0, H);
        d.x = rand(0, W);
        return;
      }
      ctx.fillStyle = O.rgba(fog, d.a * 0.5);
      ctx.beginPath();
      ctx.arc(d.x, sy, d.r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  /* ────────────────────────────────────────────
     CENTRAL FRAME LOOP
  ──────────────────────────────────────────── */
  function frame(now) {
    const t = (now - t0) * 0.001;
    F.t = t;

    const scrollY = window.scrollY;
    const docH = Math.max(1, document.documentElement.scrollHeight - H);
    F.scrollY  = scrollY;
    F.progress = clamp(scrollY / docH, 0, 1);
    F.dive     = clamp(scrollY / Math.max(1, H * 1.1), 0, 1);

    const subStart = H * 0.22;
    const subEnd   = H * 0.78;
    F.submerged    = clamp((scrollY - subStart) / (subEnd - subStart), 0, 1);

    // Calculate live depth in meters
    if (sectionList.length === 0) computeAnchors();
    let secIdx = 0, secProg = 0;
    for (let i = 0; i < sectionList.length; i++) {
      const s = sectionList[i];
      if (scrollY + H * 0.4 >= s.top) {
        secIdx  = i;
        secProg = clamp((scrollY + H * 0.4 - s.top) / s.h, 0, 1);
      }
    }
    const d0 = sectionList[secIdx]?.depth || 0;
    const d1 = sectionList[Math.min(secIdx + 1, sectionList.length - 1)]?.depth || d0;
    F.currentDepth = Math.round(d0 + (d1 - d0) * secProg);

    const zones = O.zones;
    let zi = 0;
    while (zi < zones.length - 1 && F.currentDepth > zones[zi + 1].depth) zi++;
    F.zone = zi;
    const curD  = zones[zi].depth;
    const nextD = zones[Math.min(zi + 1, zones.length - 1)].depth;
    F.zoneMix   = curD === nextD ? 0 : clamp((F.currentDepth - curD) / (nextD - curD), 0, 1);

    // 1. Update Three.js selective WebGL layer
    if (window.ThreeEnv && window.ThreeEnv.isAvailable) {
      window.ThreeEnv.update(F);
    }

    // 2. Clear & draw 2D Canvas layers
    ctx.clearRect(0, 0, W, H);

    const sub = F.submerged;

    if (window.Surface && sub < 0.999) {
      window.Surface.update(F, ctx);
    }

    if (sub >= 0.02) {
      const water = O.blend('water');
      const fog   = O.blend('fog');
      const life  = O.blend('life');
      const slow  = O.reduceMotion ? 0.25 : 1;
      const p     = F.progress;

      ctx.globalAlpha = sub;

      // When depth reaches 600m and beyond, water is 100% pitch black
      if (F.currentDepth >= 600) {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, W, H);
      } else {
        const hazeStrength = 0.08 + (F.currentDepth / 600) * 0.45;
        const hg = ctx.createLinearGradient(0, 0, 0, H);
        hg.addColorStop(0,    O.rgba(fog, hazeStrength * 0.45));
        hg.addColorStop(0.55, O.rgba(fog, hazeStrength * 0.14));
        hg.addColorStop(1,    O.rgba(water, hazeStrength * 0.55));
        ctx.fillStyle = hg;
        ctx.fillRect(0, 0, W, H);
      }

      // Subtle caustics in shallow waters
      drawCaustics(clamp(1 - p / 0.18, 0, 1) * sub);

      // Terrain & Benthic Environment
      drawRidges(F.scrollY, water);
      drawWreck(F.scrollY, fog);
      drawKelp(F.scrollY, fog, life);
      drawCoral(F.scrollY, fog, life);

      // Marine Life
      if (window.Creatures) window.Creatures.draw(ctx, F);

      // Suspended Particles & Bubbles
      drawPlankton(F.scrollY, fog, slow);
      drawBubbles(slow, sub);
      drawDrift(F.scrollY, fog, slow);

      ctx.globalAlpha = 1;
    }

    requestAnimationFrame(frame);
  }

  resize();
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 180);
  }, { passive: true });

  window.addEventListener('load', () => { computeAnchors(); buildTerrain(); });

  requestAnimationFrame(frame);

  window.Environment = { resize };
})();
