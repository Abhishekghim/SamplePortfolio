/* js/reveals.js — enriched scroll-triggered reveals */
'use strict';
(function initReveals() {

  /* ── Assign richer reveal classes based on element/section context ── */
  function assignRevealClasses() {
    // Section headers — float animation once revealed
    $$('.section-header').forEach(h => {
      h.querySelectorAll('.section-title').forEach(t => {
        // Will add line-revealed class when title appears
      });
    });

    // Timeline cards: alternate left/right already in HTML
    // Project cards: scale-in
    $$('.proj-card').forEach((card, i) => {
      card.classList.remove('reveal-up');
      card.classList.add('reveal-scale');
      card.style.setProperty('--d', (i % 3 * 0.12) + 's');
    });

    // Skill cats: stagger up
    $$('.skill-cat').forEach((cat, i) => {
      cat.style.setProperty('--d', (i * 0.14) + 's');
    });

    // Contact quote: drop in
    const quote = $('.contact-quote');
    if (quote) {
      quote.classList.remove('reveal-left');
      quote.classList.add('reveal-drop');
    }
  }

  /* ── Generic IntersectionObserver reveal ── */
  function observeReveals() {
    const els = $$('.reveal-up,.reveal-left,.reveal-right,.reveal-scale,.reveal-fade,.reveal-drop');

    const obs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el    = entry.target;
        const delay = parseFloat(el.style.getPropertyValue('--d') || '0') * 1000;

        setTimeout(() => {
          el.classList.add('revealed');
          // Trigger section-title underline
          const title = el.querySelector('.section-title') || (el.classList.contains('section-title') ? el : null);
          if (title) {
            setTimeout(() => title.classList.add('line-revealed'), 200);
          }
          // Float animation on section headers
          const hdr = el.classList.contains('section-header') ? el : el.closest('.section-header');
          if (hdr) setTimeout(() => hdr.classList.add('float-anim'), 1000);
        }, delay);

        obs.unobserve(el);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    els.forEach(el => obs.observe(el));

    // Also observe section-title directly for underline
    $$('.section-title').forEach(t => {
      const titleObs = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting) {
          setTimeout(() => t.classList.add('line-revealed'), 400);
          titleObs.disconnect();
        }
      }, { threshold: 0.6 });
      titleObs.observe(t);
    });
  }

  /* ── Skill bar fills ── */
  function observeSkills() {
    const fills = $$('.skill-fill');
    const obs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const w  = el.dataset.w;
        setTimeout(() => {
          el.style.width = w + '%';
          setTimeout(() => el.classList.add('filled'), 1400);
        }, 350);
        obs.unobserve(el);
      });
    }, { threshold: 0.5 });
    fills.forEach(el => obs.observe(el));
  }

  /* ── Stat counters ── */
  function observeStats() {
    const nums = $$('.stat-n[data-target]');
    const obs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el     = entry.target;
        const target = parseInt(el.dataset.target);
        let current  = 0;
        const step   = target / 55;
        const timer  = setInterval(() => {
          current = Math.min(current + step, target);
          el.textContent = Math.round(current);
          if (current >= target) clearInterval(timer);
        }, 20);
        obs.unobserve(el);
      });
    }, { threshold: 0.7 });
    nums.forEach(el => obs.observe(el));
  }

  /* ── Project card mouse shimmer ── */
  function initCardShimmer() {
    $$('.proj-card').forEach(card => {
      card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', ((e.clientX - r.left) / r.width  * 100).toFixed(1) + '%');
        card.style.setProperty('--my', ((e.clientY - r.top)  / r.height * 100).toFixed(1) + '%');
      });
    });
  }

  /* ── Staggered hero reveal ── */
  function heroReveal() {
    const els = $$('#home .reveal-up, #home .reveal-left, #home .hero-actions .btn');
    els.forEach((el, i) => {
      setTimeout(() => {
        el.classList.add('revealed');
      }, 280 + i * 160);
    });
  }

  /* ── Init ── */
  assignRevealClasses();
  observeReveals();
  observeSkills();
  observeStats();
  initCardShimmer();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', heroReveal);
  } else {
    setTimeout(heroReveal, 100);
  }

})();
