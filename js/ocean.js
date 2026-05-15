/* js/ocean.js — ambient environment */
'use strict';
(function initOcean() {

  /* ── Light rays ── */
  function buildRays() {
    const container = $('#layer-rays');
    if (!container) return;
    for (let i = 0; i < 12; i++) {
      const el = document.createElement('div');
      el.className = 'ray';
      const angle = -52 + i * 9;
      const h = rand(280, 500);
      const w = rand(28, 70);
      el.style.cssText = `
        left:${3 + i * 8.2}%;
        width:${w}px; height:${h}px;
        --a:${angle}deg;
        --op:${rand(0.08, 0.2)};
        transform: rotate(${angle}deg);
        animation-duration:${rand(5,9)}s;
        animation-delay:${-rand(0,8)}s;
      `;
      container.appendChild(el);
    }
  }

  /* ── Rising bubbles ── */
  function buildBubbles() {
    const container = $('#layer-bubbles');
    if (!container) return;
    function spawn() {
      const el = document.createElement('div');
      el.className = 'bubble';
      const size = rand(4, 22);
      const drift = rand(-80, 80);
      el.style.cssText = `
        width:${size}px; height:${size}px;
        left:${Math.random()*100}%;
        --bx:${drift}px;
        animation-duration:${rand(9,20)}s;
        animation-delay:${-rand(0,10)}s;
      `;
      container.appendChild(el);
      setTimeout(() => el.remove(), 22000);
    }
    for (let i = 0; i < 32; i++) spawn();
    setInterval(spawn, 800);
  }

  /* ── Ambient particles ── */
  function buildParticles() {
    const container = $('#layer-particles');
    if (!container) return;
    for (let i = 0; i < 50; i++) {
      const el = document.createElement('div');
      el.className = 'particle';
      const size = rand(1.5, 3.5);
      el.style.cssText = `
        width:${size}px; height:${size}px;
        left:${Math.random()*100}%;
        top:${Math.random()*200}%;
        --px:${rand(-20,20)}px;
        animation-duration:${rand(4,8)}s;
        animation-delay:${-rand(0,6)}s;
      `;
      container.appendChild(el);
    }
  }

  /* ── Fish schools ── */
  function buildFishSchools() {
    const schools = [
      { id: 'school1', count: 28, top: 35, left: 10 },
      { id: 'school2', count: 18, top: 62, left: 55 },
    ];
    schools.forEach(cfg => {
      const el = document.getElementById(cfg.id);
      if (!el) return;
      el.style.top  = cfg.top + '%';
      el.style.left = cfg.left + '%';
      for (let i = 0; i < cfg.count; i++) {
        const dot = document.createElement('div');
        dot.className = 'fish-dot';
        const angle = rand(0, Math.PI * 2);
        const radius = rand(0, 60);
        dot.style.cssText = `
          left:${Math.cos(angle)*radius + rand(-8,8)}px;
          top:${Math.sin(angle)*radius*0.4 + rand(-5,5)}px;
          width:${rand(4,8)}px;
          height:${rand(2,4)}px;
          opacity:${rand(0.3,0.65)};
          animation-duration:${rand(3,7)}s;
          animation-delay:${-rand(0,4)}s;
          transform: rotate(${rand(-15,15)}deg);
        `;
        el.appendChild(dot);
      }
    });
  }

  /* ── Bioluminescent field ── */
  function buildBiolumeField() {
    const field = $('#biolume-field');
    if (!field) return;
    const colors = [
      'rgba(0,212,255,0.9)',
      'rgba(0,255,190,0.9)',
      'rgba(180,80,255,0.9)',
      'rgba(255,200,0,0.9)',
      'rgba(0,240,160,0.9)',
    ];
    for (let i = 0; i < 45; i++) {
      const el = document.createElement('div');
      el.className = 'bio-dot';
      const size = rand(2, 6);
      const color = colors[randInt(0, colors.length - 1)];
      el.style.cssText = `
        width:${size}px; height:${size}px;
        left:${Math.random()*100}%;
        top:${Math.random()*100}%;
        background:${color};
        box-shadow:0 0 ${size*3}px ${color};
        animation-duration:${rand(2,5)}s;
        animation-delay:${-rand(0,4)}s;
      `;
      field.appendChild(el);
    }
  }

  /* ── Void creatures ── */
  function buildVoidCreatures() {
    const wrap = $('#void-creatures');
    if (!wrap) return;
    const creatures = ['🦑','🐙','🦐','🐡','🦀'];
    creatures.forEach((c, i) => {
      const el = document.createElement('div');
      el.className = 'void-creature';
      el.textContent = c;
      el.style.cssText = `
        ${i % 2 === 0 ? `left:${rand(2,15)}%` : `right:${rand(2,15)}%`};
        ${i < 3 ? `bottom:${rand(5,30)}%` : `top:${rand(10,40)}%`};
        font-size:${rand(50,90)}px;
        animation-duration:${rand(14,26)}s;
        animation-delay:${-rand(0,12)}s;
      `;
      wrap.appendChild(el);
    });
  }

  /* ── Spotlight (mouse in dark zones) ── */
  const spotlight = $('#layer-spotlight');
  document.addEventListener('mousemove', e => {
    if (!spotlight) return;
    const pct = scrollProgress();
    if (pct > 0.45) {
      spotlight.classList.add('active');
      spotlight.style.setProperty('--mx', e.clientX + 'px');
      spotlight.style.setProperty('--my', e.clientY + 'px');
    } else {
      spotlight.classList.remove('active');
    }
  });

  // Init all
  buildRays();
  buildBubbles();
  buildParticles();
  buildFishSchools();
  buildBiolumeField();
  buildVoidCreatures();
})();