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
