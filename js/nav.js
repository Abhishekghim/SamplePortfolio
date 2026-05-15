/* js/nav.js */
'use strict';
(function initNav() {
  const nav    = $('#navbar');
  const burger = $('#navBurger');
  const list   = $('#navList');

  if (!nav) return;

  // Scrolled style
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 50);
    updateActiveLink();
  }, { passive: true });

  // Hamburger toggle
  burger?.addEventListener('click', () => {
    const open = list.classList.toggle('open');
    burger.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', String(open));
  });

  // Close on link click
  $$('.nav-link').forEach(a => {
    a.addEventListener('click', () => {
      list.classList.remove('open');
      burger?.classList.remove('open');
      burger?.setAttribute('aria-expanded', 'false');
    });
  });

  function updateActiveLink() {
    const sections = $$('section[id]');
    let current = '';
    sections.forEach(s => {
      if (s.getBoundingClientRect().top <= window.innerHeight * 0.42) {
        current = s.id;
      }
    });
    $$('.nav-link').forEach(a => {
      a.classList.toggle('active', a.dataset.sec === current);
    });
  }

  updateActiveLink();
})();
