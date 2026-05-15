/* js/cursor.js */
'use strict';
(function initCursor() {
  const dot  = $('#cursor-dot');
  const ring = $('#cursor-glow');
  if (!dot || !ring) return;

  let mx = 0, my = 0;

  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    dot.style.left  = mx + 'px';
    dot.style.top   = my + 'px';
    // Ring lags slightly
    setTimeout(() => {
      ring.style.left = mx + 'px';
      ring.style.top  = my + 'px';
    }, 80);
  });

  // Hover state on interactive elements
  document.addEventListener('mouseover', e => {
    const t = e.target.closest('a, button, .proj-card, .c-card, .skill-cat, .tl-card, .jelly');
    document.body.classList.toggle('cursor-hover', !!t);
  });
  document.addEventListener('mouseout', () => {
    document.body.classList.remove('cursor-hover');
  });
})();
