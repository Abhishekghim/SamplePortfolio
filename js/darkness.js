'use strict';
(function() {

  const TORCH_R      = { 0: 120, 1: 170, 2: 250 };
  const BRIGHTNESS   = {
    0: [1.00, 1.00, 1.00, 1.00, 0.50, 0.00],
    1: [1.00, 1.00, 1.00, 1.00, 0.50, 0.00],
    2: [1.00, 1.00, 1.00, 1.00, 0.50, 0.00],
  };

  // Smoothly animated radius per jellyfish id
  const currentR = {};

  const cv  = document.createElement('canvas');
  cv.id     = 'darkness-canvas';
  cv.style.cssText = 'position:fixed;top:0;left:0;pointer-events:none;z-index:800;';
  document.body.appendChild(cv);
  const ctx = cv.getContext('2d');

  const mc  = document.createElement('canvas');
  const mct = mc.getContext('2d');

  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    cv.width = mc.width = w;
    cv.height= mc.height= h;
    cv.style.width = w + 'px'; cv.style.height = h + 'px';
  }
  resize();
  window.addEventListener('resize', resize);

  let opacity = 0;

  function draw() {
    // Continuous darkness driven by scroll depth — ramps down to 600m
    // and becomes strictly pitch black (1.00) after 600m.
    const target = window.OCEAN ? window.OCEAN.darkness() : 0;
    opacity += (target - opacity) * 0.08;
    if (Math.abs(target - opacity) < 0.004) opacity = target;

    const W = cv.width, H = cv.height;
    ctx.clearRect(0, 0, W, H);
    if (opacity < 0.01) return;

    const jellies = [...document.querySelectorAll('.jelly')]
      .map(j => {
        const r  = j.getBoundingClientRect();
        const op = parseFloat(window.getComputedStyle(j).opacity) || 0;
        return {
          x:     r.left + r.width  / 2,
          y:     r.top  + r.height / 2,
          r:     TORCH_R[+j.dataset.level || 0] || 160,
          op,
          level: +j.dataset.level || 0,
          id:    j.dataset.id,
        };
      })
      .filter(j => j.op > 0.05);

    if (jellies.length === 0) {
      ctx.fillStyle  = 'rgb(0,0,0)';
      ctx.globalAlpha = opacity;
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
      return;
    }

    ctx.globalAlpha = opacity;
    ctx.fillStyle   = 'rgb(0,0,0)';
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;

    mct.clearRect(0, 0, W, H);

    jellies.forEach(j => {
      // Smooth radius animation — lerps toward target size
      const targetR = j.r * Math.min(j.op * 2, 1);
      if (currentR[j.id] === undefined) currentR[j.id] = targetR * 0.4;
      currentR[j.id] += (targetR - currentR[j.id]) * 0.08; // responsive light blooming
      const r = currentR[j.id];

      const b = BRIGHTNESS[j.level] || BRIGHTNESS[0];
      const g = mct.createRadialGradient(j.x, j.y, 0, j.x, j.y, r);
      g.addColorStop(0.00, `rgba(255,255,255,${b[0]})`);
      g.addColorStop(0.25, `rgba(255,255,255,${b[1]})`);
      g.addColorStop(0.48, `rgba(255,255,255,${b[2]})`);
      g.addColorStop(0.63, `rgba(255,255,255,${b[3]})`);
      g.addColorStop(0.84, `rgba(255,255,255,${b[4]})`);
      g.addColorStop(1.00, `rgba(255,255,255,${b[5]})`);
      mct.fillStyle = g;
      mct.beginPath();
      mct.arc(j.x, j.y, r, 0, Math.PI * 2);
      mct.fill();
    });

    ctx.globalCompositeOperation = 'destination-out';
    ctx.drawImage(mc, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
  }

  (function loop() { draw(); requestAnimationFrame(loop); })();

})();