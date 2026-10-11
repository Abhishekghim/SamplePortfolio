/* js/surface.js — the above-water scene and waterline dive transition.
   Precisely proportioned assets: subtle soaring seabirds high in the sky,
   small distant exploration sailboat resting on the left waterline,
   soft ethereal background clouds, and harmonic water reflections. */
'use strict';
(function initSurface() {

  const O = window.OCEAN;

  // Preload genuine visual assets
  const imgCloud1    = new Image(); imgCloud1.src    = 'assets/svg/cloud-volumetric-1.svg';
  const imgCloud2    = new Image(); imgCloud2.src    = 'assets/svg/cloud-volumetric-2.svg';
  const imgBirdGlide = new Image(); imgBirdGlide.src = 'assets/svg/seabird-glide.svg';
  const imgBirdFlap  = new Image(); imgBirdFlap.src  = 'assets/svg/seabird-flap.svg';
  const imgBoat      = new Image(); imgBoat.src      = 'assets/svg/sailboat.svg';

  let clouds = [], birds = [], glitter = [];
  let built = false, builtW = 0;

  function build(W, H) {
    const tierMul = O.tier === 'mobile' ? 0.5 : O.tier === 'tablet' ? 0.75 : 1;

    // Distant soft clouds — subtle, floating high in the sky
    clouds = [];
    const cloudCount = Math.round(5 * tierMul);
    for (let i = 0; i < cloudCount; i++) {
      clouds.push({
        x: rand(-0.1, 1.1) * W,
        y: rand(0.03, 0.22) * H,
        w: rand(180, 280),
        speed: rand(2.5, 5.5),
        layer: i % 2,
        variant: i % 2,
        a: rand(0.18, 0.32), // Ethereal, non-distracting
      });
    }

    // Small, distant soaring seabirds — high in upper sky, far above hero title
    birds = [];
    const birdCount = Math.round(4 * tierMul);
    for (let i = 0; i < birdCount; i++) {
      birds.push({
        x: rand(0, W),
        y: rand(0.04, 0.16) * H, // High in upper sky (4%–16% viewport height)
        w: rand(22, 32),          // Compact, realistic distant gulls (22px–32px)
        speed: rand(10, 18),
        phase: rand(0, Math.PI * 2),
        flapSpeed: rand(3.5, 5.0),
        a: rand(0.45, 0.65),     // Soft natural silhouette
      });
    }

    glitter = [];
    const glitterCount = Math.round(55 * tierMul);
    for (let i = 0; i < glitterCount; i++) {
      glitter.push({
        x: rand(0, W),
        band: rand(0, 1),
        phase: rand(0, Math.PI * 2),
        speed: rand(1.6, 3.8),
        w: rand(3, 6),
      });
    }

    built = true;
    builtW = W;
  }

  function drawCloud(ctx, c, x, y, alpha) {
    const img = c.variant === 0 ? imgCloud1 : imgCloud2;
    if (!img.complete) return;
    const cw = c.w;
    const ch = cw * 0.4;
    ctx.save();
    ctx.translate(x, y);
    ctx.globalAlpha = alpha * c.a;
    ctx.drawImage(img, -cw * 0.5, -ch * 0.5, cw, ch);
    ctx.restore();
  }

  function drawBird(ctx, b, x, y, t, alpha) {
    const isFlapping = Math.sin(t * b.flapSpeed + b.phase) > 0.18;
    const img = isFlapping ? imgBirdFlap : imgBirdGlide;
    if (!img.complete) return;

    const bw = b.w;
    const bh = isFlapping ? bw * 0.5 : bw * 0.4;

    ctx.save();
    ctx.translate(x, y);
    ctx.globalAlpha = alpha * b.a;
    // Subtle aerodynamic banking tilt
    const tilt = Math.sin(t * 1.4 + b.phase) * 0.08;
    ctx.rotate(tilt);
    ctx.drawImage(img, -bw * 0.5, -bh * 0.5, bw, bh);
    ctx.restore();
  }

  function drawBoat(ctx, x, y, alpha, t) {
    if (!imgBoat.complete) return;

    // Small, charming vessel on the horizon (78px x 62px)
    const bw = 78;
    const bh = 62;

    ctx.save();
    ctx.translate(x, y);
    // Gentle pitch oscillation with waterline swell
    const pitch = Math.sin(t * 0.95) * 0.04 + Math.cos(t * 1.4) * 0.02;
    ctx.rotate(pitch);
    ctx.globalAlpha = alpha * 0.92;
    // Anchored at waterline draft
    ctx.drawImage(imgBoat, -bw * 0.5, -bh * 0.88, bw, bh);
    ctx.restore();
  }

  /* ────────────────────────────────────────────
     UPDATE / DRAW — Called once per frame by environment.js while submerged < 1
  ──────────────────────────────────────────── */
  function update(F, ctx) {
    const W = F.vw, H = F.vh;
    if (!built || builtW !== W) build(W, H);

    const alpha = clamp(1 - F.submerged, 0, 1);
    if (alpha <= 0.005) return;

    const dive = F.dive; // 0..1 across the first viewport
    const slow = O.reduceMotion ? 0.2 : 1;
    const t = F.t * slow;

    // Waterline rises up the screen as camera descends, then exits
    const waterlineY = H * (0.6 - dive * 1.28);
    const camZoom = 1 + dive * 0.16;
    const camPanY = dive * H * 0.05;

    ctx.save();
    ctx.globalAlpha = alpha;

    // Camera pivot around current waterline
    ctx.translate(W / 2, waterlineY);
    ctx.scale(camZoom, camZoom);
    ctx.translate(-W / 2, -waterlineY + camPanY);

    /* ── SKY ── */
    const skyBottom = Math.max(waterlineY, -20);
    if (skyBottom > -50) {
      const sky = ctx.createLinearGradient(0, -H * 0.3, 0, skyBottom);
      sky.addColorStop(0,    'rgba(120,190,232,1)');
      sky.addColorStop(0.55, 'rgba(150,210,235,1)');
      sky.addColorStop(1,    'rgba(206,236,242,1)');
      ctx.fillStyle = sky;
      ctx.fillRect(0, -H * 0.3, W, skyBottom + H * 0.3);

      // Warm ambient sun
      const sunX = W * 0.80, sunY = H * 0.15 - dive * H * 0.1;
      const sg = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, H * 0.45);
      sg.addColorStop(0,    'rgba(255,250,225,0.85)');
      sg.addColorStop(0.08, 'rgba(255,245,210,0.50)');
      sg.addColorStop(0.30, 'rgba(255,240,200,0.12)');
      sg.addColorStop(1,    'rgba(255,240,200,0)');
      ctx.fillStyle = sg;
      ctx.beginPath();
      ctx.arc(sunX, sunY, H * 0.45, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(255,252,235,0.95)';
      ctx.beginPath();
      ctx.arc(sunX, sunY, 24, 0, Math.PI * 2);
      ctx.fill();

      // Soft background clouds (high in the sky, low opacity)
      clouds.forEach(c => {
        const speedMul = c.layer === 0 ? 1 : 1.5;
        let x = (c.x + t * c.speed * speedMul) % (W + 400) - 200;
        const y = c.y - dive * H * 0.05;
        drawCloud(ctx, c, x, y, alpha);
      });

      // Small, graceful seabirds (high in the sky, above hero text)
      birds.forEach(b => {
        let x = (b.x + t * b.speed) % (W + 60) - 30;
        const y = b.y + Math.sin(t * 1.4 + b.phase) * 4;
        drawBird(ctx, b, x, y, t, alpha);
      });
    }

    /* ── OCEAN SURFACE & WATERLINE ── */
    const seaTop = waterlineY;
    if (seaTop < H + 40) {
      const sea = ctx.createLinearGradient(0, seaTop, 0, H);
      sea.addColorStop(0,    'rgba(58,150,182,1)');
      sea.addColorStop(0.42, 'rgba(24,104,140,1)');
      sea.addColorStop(1,    'rgba(10,60,92,1)');
      ctx.fillStyle = sea;
      ctx.fillRect(0, seaTop, W, H - seaTop + 20);

      // Subtle wave ripple bands
      ctx.strokeStyle = 'rgba(220,246,252,0.18)';
      ctx.lineWidth = 1.4;
      for (let r = 0; r < 6; r++) {
        const ry = seaTop + 16 + r * 20;
        if (ry > H) break;
        ctx.beginPath();
        for (let x = -20; x <= W + 20; x += 18) {
          const wave1 = Math.sin(x * 0.018 + t * 0.95 + r) * 3.2;
          const yy = ry + wave1;
          if (x === -20) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
        }
        ctx.stroke();
      }

      // Specular sun glitter
      ctx.fillStyle = 'rgba(255,254,240,0.85)';
      glitter.forEach(g => {
        const gy = seaTop + g.band * Math.min(70, H - seaTop);
        if (gy > H) return;
        const flick = Math.sin(t * g.speed + g.phase) * 0.5 + 0.5;
        if (flick < 0.55) return;
        ctx.globalAlpha = alpha * (flick - 0.55) * 2.0;
        ctx.fillRect(g.x, gy, g.w, 1.4);
      });
      ctx.globalAlpha = alpha;

      // Realistic waterline foam
      ctx.strokeStyle = 'rgba(255,255,255,0.60)';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      for (let x = -20; x <= W + 20; x += 16) {
        const yy = waterlineY + Math.sin(x * 0.024 + t * 1.1) * 2.6;
        if (x === -20) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
      }
      ctx.stroke();

      // Small exploration sailboat resting gracefully at the waterline on the left side
      // Kept well outside the centered hero text column
      if (O.tier !== 'mobile') {
        const boatX = Math.max(70, W * 0.11);
        const bob = Math.sin(t * 0.95) * 3.6;
        drawBoat(ctx, boatX, waterlineY + bob - 4, Math.min(1, alpha * 1.1), t);
      }
    }

    ctx.restore();
  }

  window.Surface = { update };
})();
