/* js/creatures.js — marine life: boid schools, drifting fauna, bioluminescence.
   Proportionate, elegant marine silhouettes and animations. */
'use strict';
(function initCreatures() {

  const O = window.OCEAN;

  // Preload genuine marine life assets
  const imgTurtle = new Image(); imgTurtle.src = 'assets/svg/sea-turtle.svg';
  const imgRay    = new Image(); imgRay.src    = 'assets/svg/manta-ray.svg';
  const imgWhale  = new Image(); imgWhale.src  = 'assets/svg/humpback-whale.svg';
  const imgShark  = new Image(); imgShark.src  = 'assets/svg/reef-shark.svg';
  const imgAngler = new Image(); imgAngler.src = 'assets/svg/anglerfish.svg';

  /* Depth windows in page-progress (0..1) */
  const WINDOW = {
    school:  [0.04, 0.28, 0.52],
    turtle:  [0.08, 0.25, 0.48],
    ray:     [0.22, 0.45, 0.68],
    whale:   [0.34, 0.58, 0.84],
    shark:   [0.48, 0.68, 0.88],
    deepFish:[0.62, 0.84, 1.01],
    jelly:   [0.42, 0.74, 1.01],
    mote:    [0.55, 0.86, 1.01],
  };

  let schools = [];
  let fauna   = [];
  let jellies = [];
  let motes   = [];

  function vis(p, w) {
    const [a, b, c] = w;
    if (p <= a || p >= c) return 0;
    if (p < b) return smooth((p - a) / (b - a));
    return smooth(1 - (p - b) / (c - b));
  }
  function smooth(t) { t = Math.min(Math.max(t, 0), 1); return t * t * (3 - 2 * t); }

  /* ────────────────────────────────────────────
     SPAWNING (With balanced, natural proportions)
  ──────────────────────────────────────────── */
  function spawnSchool(index) {
    const d = O.density;
    const vh = window.innerHeight;
    const fish = [];
    const size = rand(0.7, 1.1);
    for (let i = 0; i < d.schoolFish; i++) {
      fish.push({
        x: rand(-50, 50), y: rand(-35, 35),
        vx: rand(-0.4, 0.4), vy: rand(-0.2, 0.2),
        len: rand(7, 12) * size, // Small, natural school fish
        phase: rand(0, Math.PI * 2),
      });
    }
    return {
      fish,
      cx: rand(0, window.innerWidth),
      cy: window.scrollY + vh * (0.3 + index * 0.35),
      vx: rand(0.35, 0.65) * (Math.random() < 0.5 ? -1 : 1),
      vy: rand(-0.07, 0.07),
      parallax: rand(0.86, 0.98),
      wander: rand(0, Math.PI * 2),
      alpha: rand(0.5, 0.75),
    };
  }

  function spawnFauna(kind) {
    const vh = window.innerHeight, vw = window.innerWidth;
    const dir = Math.random() < 0.5 ? 1 : -1;
    const base = {
      kind, dir,
      y: window.scrollY + rand(-0.2, 1.2) * vh,
      phase: rand(0, Math.PI * 2),
      flap: rand(0.015, 0.035),
    };
    switch (kind) {
    case 'turtle':
      return { ...base, x: dir > 0 ? -120 : vw + 120, speed: rand(0.28, 0.52) * dir,
        scale: rand(0.75, 1.0), parallax: rand(0.88, 0.96), alpha: 0.85, w: 92, h: 74 };
    case 'ray':
      return { ...base, x: dir > 0 ? -160 : vw + 160, speed: rand(0.35, 0.60) * dir,
        scale: rand(0.80, 1.1), parallax: rand(0.8, 0.92), alpha: 0.8, w: 110, h: 82, flap: rand(0.012, 0.024) };
    case 'whale':
      return { ...base, x: dir > 0 ? -450 : vw + 450, speed: rand(0.16, 0.28) * dir,
        scale: rand(0.9, 1.25), parallax: rand(0.62, 0.74), alpha: 0.35, w: 220, h: 94, flap: 0.007 }; // Distant silhouette
    case 'shark':
      return { ...base, x: dir > 0 ? -180 : vw + 180, speed: rand(0.32, 0.55) * dir,
        scale: rand(0.80, 1.1), parallax: rand(0.72, 0.86), alpha: 0.82, w: 125, h: 54, flap: 0.022 };
    default: // deepFish (Anglerfish)
      return { ...base, x: dir > 0 ? -120 : vw + 120, speed: rand(0.20, 0.38) * dir,
        scale: rand(0.75, 1.0), parallax: rand(0.84, 0.95), alpha: 0.9, w: 78, h: 62, flap: 0.04 };
    }
  }

  function spawnJelly() {
    const vh = window.innerHeight;
    return {
      x: rand(0, window.innerWidth),
      y: window.scrollY + rand(-0.1, 1.3) * vh,
      rise: rand(0.18, 0.42),
      drift: rand(-0.14, 0.14),
      size: rand(20, 44),
      phase: rand(0, Math.PI * 2),
      pulse: rand(0.022, 0.042),
      parallax: rand(0.78, 0.98),
      alpha: rand(0.22, 0.48),
      hue: Math.random() < 0.3 ? 'violet' : 'cyan',
    };
  }

  function spawnMote() {
    const vh = window.innerHeight;
    return {
      x: rand(0, window.innerWidth),
      y: window.scrollY + rand(-0.1, 1.2) * vh,
      r: rand(0.8, 2.2),
      phase: rand(0, Math.PI * 2),
      speed: rand(0.006, 0.018),
      drift: rand(-0.1, 0.1),
      rise: rand(0.03, 0.14),
      parallax: rand(0.85, 1),
      hue: ['cyan', 'violet', 'teal'][randInt(0, 2)],
    };
  }

  function build() {
    const d = O.density;
    schools = [];
    for (let i = 0; i < d.schools; i++) schools.push(spawnSchool(i));

    fauna = [];
    const kinds = ['turtle', 'ray', 'whale', 'shark', 'deepFish', 'ray', 'deepFish'];
    for (let i = 0; i < d.fauna; i++) fauna.push(spawnFauna(kinds[i % kinds.length]));

    jellies = [];
    for (let i = 0; i < d.jellies; i++) jellies.push(spawnJelly());

    motes = [];
    const moteCount = Math.round(d.plankton * 0.35);
    for (let i = 0; i < moteCount; i++) motes.push(spawnMote());
  }

  function drawSchoolFish(ctx, len, bend) {
    const h = len * 0.32;
    ctx.beginPath();
    ctx.moveTo(len * 0.5, 0);
    ctx.quadraticCurveTo(0, -h, -len * 0.35, bend * h * 0.6);
    ctx.quadraticCurveTo(0, h, len * 0.5, 0);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(-len * 0.3, bend * h * 0.5);
    ctx.lineTo(-len * 0.62, -h * 0.85 + bend * h * 1.1);
    ctx.lineTo(-len * 0.62,  h * 0.85 + bend * h * 1.1);
    ctx.closePath();
    ctx.fill();
  }

  function drawAtmosphericJelly(ctx, size, t, color, alpha) {
    const squeeze = 1 + Math.sin(t) * 0.16;
    const w = size * (1 / squeeze), h = size * 0.80 * squeeze;

    const g = ctx.createRadialGradient(0, -h * 0.25, 0, 0, 0, w * 1.35);
    g.addColorStop(0,   color.replace('%A%', alpha * 1.15));
    g.addColorStop(0.55, color.replace('%A%', alpha * 0.45));
    g.addColorStop(1,   color.replace('%A%', 0));
    ctx.fillStyle = g;

    ctx.beginPath();
    ctx.moveTo(-w, h * 0.12);
    ctx.quadraticCurveTo(-w, -h * 1.3, 0, -h * 1.3);
    ctx.quadraticCurveTo(w, -h * 1.3, w, h * 0.12);
    ctx.quadraticCurveTo(0, h * 0.55, -w, h * 0.12);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = color.replace('%A%', alpha * 0.6);
    ctx.lineWidth = Math.max(0.7, size * 0.035);
    for (let i = -2; i <= 2; i++) {
      const ox = (i / 2) * w * 0.68;
      ctx.beginPath();
      ctx.moveTo(ox, h * 0.18);
      ctx.quadraticCurveTo(
        ox + Math.sin(t * 1.35 + i) * size * 0.30, h * 0.95 + size * 0.50,
        ox + Math.sin(t + i * 0.85) * size * 0.42, h * 0.45 + size * 1.7
      );
      ctx.stroke();
    }
  }

  const GLOW = {
    cyan:   'rgba(120,225,255,%A%)',
    violet: 'rgba(186,140,255,%A%)',
    teal:   'rgba(110,255,220,%A%)',
  };

  function draw(ctx, F) {
    const fog = O.blend('fog');
    const vh = F.vh, vw = F.vw;
    const slow = O.reduceMotion ? 0.25 : 1;

    const order = { whale: 0, shark: 1, ray: 2, turtle: 3, deepFish: 4 };
    fauna.sort((a, b) => order[a.kind] - order[b.kind]);

    fauna.forEach(c => {
      const v = vis(F.progress, WINDOW[c.kind]);
      if (v <= 0.01) { recycleFauna(c, F); return; }

      c.x += c.speed * slow;
      c.phase += c.flap * slow;

      const sy = c.y - F.scrollY * c.parallax;
      if (c.x < -600 || c.x > vw + 600 || sy < -vh * 1.5 || sy > vh * 2.5) {
        recycleFauna(c, F);
        return;
      }
      if (sy < -220 || sy > vh + 220) return;

      const bob = Math.sin(c.phase * 0.75) * 6;
      const pitch = Math.sin(c.phase * 0.5) * 0.04;

      ctx.save();
      ctx.translate(c.x, sy + bob);
      ctx.rotate(pitch);
      if (c.speed < 0) ctx.scale(-1, 1);

      ctx.globalAlpha = c.alpha * v;

      let img = null;
      switch (c.kind) {
        case 'turtle':   img = imgTurtle; break;
        case 'ray':      img = imgRay; break;
        case 'whale':    img = imgWhale; break;
        case 'shark':    img = imgShark; break;
        case 'deepFish': img = imgAngler; break;
      }

      if (img && img.complete) {
        const renderW = c.w * c.scale;
        const renderH = c.h * c.scale;

        // Abyssal Anglerfish bioluminescent esca glow
        if (c.kind === 'deepFish') {
          const glowR = 26 * c.scale * (1 + Math.sin(c.phase * 3.5) * 0.25);
          const escaX = renderW * 0.35, escaY = -renderH * 0.16;
          const eg = ctx.createRadialGradient(escaX, escaY, 0, escaX, escaY, glowR);
          eg.addColorStop(0,   'rgba(255,255,255,0.95)');
          eg.addColorStop(0.3, 'rgba(0,255,255,0.70)');
          eg.addColorStop(0.7, 'rgba(0,180,255,0.25)');
          eg.addColorStop(1,   'rgba(0,120,255,0)');
          ctx.fillStyle = eg;
          ctx.beginPath();
          ctx.arc(escaX, escaY, glowR, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.drawImage(img, -renderW * 0.5, -renderH * 0.5, renderW, renderH);
      }

      ctx.restore();
    });

    /* ── Boid schools ── */
    const schoolVis = vis(F.progress, WINDOW.school);
    if (schoolVis > 0.01) {
      schools.forEach(s => updateSchool(s, F, slow));
      schools.forEach(s => {
        const sy = s.cy - F.scrollY * s.parallax;
        if (sy < -vh * 0.8 || sy > vh * 1.8) return;
        ctx.save();
        ctx.translate(s.cx, sy);
        ctx.fillStyle = O.rgba(fog, s.alpha * schoolVis);
        s.fish.forEach(f => {
          ctx.save();
          ctx.translate(f.x, f.y);
          ctx.rotate(Math.atan2(f.vy, f.vx));
          drawSchoolFish(ctx, f.len, Math.sin(f.phase));
          ctx.restore();
        });
        ctx.restore();
      });
    }

    /* ── Atmospheric jellyfish ── */
    const jellyVis = vis(F.progress, WINDOW.jelly);
    if (jellyVis > 0.01) {
      jellies.forEach(j => {
        j.y -= j.rise * slow;
        j.x += j.drift * slow;
        j.phase += j.pulse * slow;
        const sy = j.y - F.scrollY * j.parallax;
        if (sy < -vh * 0.7 || sy > vh * 2.2 || j.x < -140 || j.x > vw + 140) {
          Object.assign(j, spawnJelly());
          j.y = F.scrollY + vh * 1.25;
          return;
        }
        if (sy < -120 || sy > vh + 120) return;
        ctx.save();
        ctx.translate(j.x, sy);
        drawAtmosphericJelly(ctx, j.size, j.phase, GLOW[j.hue], j.alpha * jellyVis);
        ctx.restore();
      });
    }

    /* ── Bioluminescent motes ── */
    const moteVis = vis(F.progress, WINDOW.mote);
    if (moteVis > 0.01) {
      ctx.globalCompositeOperation = 'lighter';
      motes.forEach(m => {
        m.phase += m.speed * slow;
        m.y -= m.rise * slow;
        m.x += m.drift * slow;
        const sy = m.y - F.scrollY * m.parallax;
        if (sy < -80 || sy > vh + 80) {
          if (sy < -80) { m.y = F.scrollY + vh + 60; m.x = rand(0, vw); }
          return;
        }
        const pulse = Math.sin(m.phase) * 0.5 + 0.5;
        const a = pulse * pulse * 0.85 * moteVis;
        if (a < 0.02) return;
        const r = m.r * (1 + pulse * 0.7);
        const g = ctx.createRadialGradient(m.x, sy, 0, m.x, sy, r * 4);
        g.addColorStop(0, GLOW[m.hue].replace('%A%', a));
        g.addColorStop(1, GLOW[m.hue].replace('%A%', 0));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(m.x, sy, r * 4, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalCompositeOperation = 'source-over';
    }
  }

  function recycleFauna(c, F) {
    const fresh = spawnFauna(c.kind);
    fresh.y = F.scrollY + rand(-0.1, 1.1) * F.vh;
    Object.assign(c, fresh);
  }

  function updateSchool(s, F, slow) {
    s.wander += 0.004 * slow;
    s.cx += (s.vx + Math.sin(s.wander) * 0.25) * slow;
    s.cy += (s.vy + Math.cos(s.wander * 0.7) * 0.12) * slow;

    if (s.cx < -160) s.cx = F.vw + 160;
    if (s.cx > F.vw + 160) s.cx = -160;
    const sy = s.cy - F.scrollY * s.parallax;
    if (sy > F.vh * 1.9) s.cy = F.scrollY - F.vh * 0.5;
    if (sy < -F.vh * 0.9) s.cy = F.scrollY + F.vh * 1.4;

    const fish = s.fish;
    for (let i = 0; i < fish.length; i++) {
      const f = fish[i];
      let sepX = 0, sepY = 0, aliX = 0, aliY = 0, cohX = 0, cohY = 0, n = 0;

      for (let k = 0; k < fish.length; k++) {
        if (k === i) continue;
        const o = fish[k];
        const dx = f.x - o.x, dy = f.y - o.y;
        const d2 = dx * dx + dy * dy;
        if (d2 > 4500) continue;
        n++;
        if (d2 < 250 && d2 > 0.01) { sepX += dx / d2 * 12; sepY += dy / d2 * 12; }
        aliX += o.vx; aliY += o.vy;
        cohX += o.x;  cohY += o.y;
      }

      if (n > 0) {
        f.vx += (aliX / n - f.vx) * 0.05 + (cohX / n - f.x) * 0.0016 + sepX * 0.02;
        f.vy += (aliY / n - f.vy) * 0.05 + (cohY / n - f.y) * 0.0016 + sepY * 0.02;
      }
      f.vx += -f.x * 0.0011;
      f.vy += -f.y * 0.0022;

      const sp = Math.hypot(f.vx, f.vy) || 0.001;
      const target = 0.85;
      f.vx = f.vx / sp * target;
      f.vy = f.vy / sp * target;

      f.x += f.vx * slow;
      f.y += f.vy * slow;
      f.phase += 0.22 * slow;
    }
  }

  build();
  window.addEventListener('resize', build, { passive: true });

  window.Creatures = { draw };
})();
