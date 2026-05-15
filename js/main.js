/* js/main.js — orchestration and misc init */
'use strict';
(function main() {

  /* ── Initial hero entrance ── */
  function heroEntrance() {
    const els = $$('#home .reveal-up, #home .reveal-left');
    els.forEach((el, i) => {
      setTimeout(() => el.classList.add('revealed'), 300 + i * 150);
    });
  }

  /* ── Scroll cue hides after first scroll ── */
  function initScrollCue() {
    const cue = $('#scrollCue');
    if (!cue) return;
    const hide = () => { cue.style.opacity = '0'; cue.style.pointerEvents = 'none'; };
    window.addEventListener('scroll', hide, { passive: true, once: true });
  }

  /* ── Fish school parallax nudge on mouse move ── */
  let lastMX = 0;
  document.addEventListener('mousemove', e => {
    const dx = e.clientX - lastMX;
    lastMX = e.clientX;
    if (Math.abs(dx) > 12) {
      $$('.fish-dot').forEach(f => {
        const cur = parseFloat(f.style.left) || 0;
        f.style.left = (cur + dx * 0.08) + 'px';
      });
    }
  });

  /* ── Nav scrolled init ── */
  const nav = $('#navbar');
  if (nav && window.scrollY > 50) nav.classList.add('scrolled');

  /* ── Keyboard accessible jellyfish nudge ── */
  $$('.jelly').forEach(jelly => {
    jelly.addEventListener('keydown', e => {
      const step = 20;
      const left = parseFloat(jelly.style.left) || 0;
      const top  = parseFloat(jelly.style.top)  || 0;
      if (e.key === 'ArrowLeft')  jelly.style.left = (left - step) + 'px';
      if (e.key === 'ArrowRight') jelly.style.left = (left + step) + 'px';
      if (e.key === 'ArrowUp')    jelly.style.top  = (top  - step) + 'px';
      if (e.key === 'ArrowDown')  jelly.style.top  = (top  + step) + 'px';
    });
  });

  /* ── Run on DOM ready ── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { heroEntrance(); initScrollCue(); });
  } else {
    heroEntrance();
    initScrollCue();
  }

})();
