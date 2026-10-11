/* js/config.js — environment presets, depth zones, shared frame state */
'use strict';
(function initConfig() {

  const reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  const DENSITY = {
    desktop: { plankton: 240, drift: 70, bubbles: 40, schools: 2, schoolFish: 38, jellies: 9, kelp: 26, coral: 20, fauna: 7 },
    tablet:  { plankton: 130, drift: 40, bubbles: 24, schools: 1, schoolFish: 24, jellies: 6, kelp: 15, coral: 12, fauna: 4 },
    mobile:  { plankton:  55, drift: 18, bubbles: 12, schools: 1, schoolFish: 14, jellies: 3, kelp:  8, coral:  6, fauna: 2 },
  };

  /* Depth zones matching the portfolio sections:
     - Surface: 0m
     - Shallow: 30m
     - Twilight: 80m
     - Midnight: 200m (Skills)
     - Abyssal: 600m (Projects) -> PITCH BLACK (darkness: 1.00)
     - Hadal: 1000m (Contact) -> PITCH BLACK (darkness: 1.00)
     Darkness progressively ramps from 0m down to 600m, becoming pitch black (1.00)
     at 600m and strictly remaining pitch black throughout the abyss and hadal trench. */
  const ZONES = [
    { id: 'surface',  name: 'Surface',     depth:    0, water: [ 22, 118, 158], fog: [140, 205, 230], life: 0.25, darkness: 0.00 },
    { id: 'shallow',  name: 'Shallow',     depth:   30, water: [ 18,  98, 138], fog: [ 96, 172, 205], life: 1.00, darkness: 0.00 },
    { id: 'twilight', name: 'Twilight',    depth:   80, water: [ 12,  72, 108], fog: [ 60, 138, 175], life: 0.85, darkness: 0.08 },
    { id: 'midnight', name: 'Midnight',    depth:  200, water: [  5,  36,  64], fog: [ 24,  70, 102], life: 0.50, darkness: 0.45 },
    { id: 'deep',     name: 'Deep Sea',    depth:  400, water: [  2,  14,  24], fog: [  8,  24,  40], life: 0.20, darkness: 0.78 },
    { id: 'abyss',    name: 'Abyss',       depth:  600, water: [  0,   0,   0], fog: [  0,   0,   0], life: 0.00, darkness: 1.00 },
    { id: 'hadal',    name: 'Hadal',       depth: 1000, water: [  0,   0,   0], fog: [  0,   0,   0], life: 0.00, darkness: 1.00 },
  ];
  const DARKNESS_CEILING = 1.00;

  function tierFor(width) {
    if (width < 640) return 'mobile';
    if (width < 1100) return 'tablet';
    return 'desktop';
  }

  const OCEAN = {
    reduceMotion: reduceQuery.matches,
    tier: tierFor(window.innerWidth),
    zones: ZONES,
    get density() { return DENSITY[this.tier]; },

    /* Live frame state, written once per frame by environment.js and read by
       every other system so nothing recomputes scroll geometry on its own. */
    frame: {
      scrollY: 0,
      progress: 0,   // 0..1 across the whole document
      dive: 0,       // 0..1 across the first viewport (above-water descent)
      submerged: 0,  // 0..1, how far past the waterline we are
      zone: 0,       // current zone index
      zoneMix: 0,    // 0..1 blend toward the next zone
      currentDepth: 0, // live meter depth matching HUD
      vw: window.innerWidth,
      vh: window.innerHeight,
      t: 0,          // seconds since load
    },

    /* Linear blend of the current zone pair for any per-zone array */
    blend(key) {
      const f = this.frame;
      const a = ZONES[f.zone][key];
      const b = ZONES[Math.min(f.zone + 1, ZONES.length - 1)][key];
      if (typeof a === 'number') return a + (b - a) * f.zoneMix;
      return [
        a[0] + (b[0] - a[0]) * f.zoneMix,
        a[1] + (b[1] - a[1]) * f.zoneMix,
        a[2] + (b[2] - a[2]) * f.zoneMix,
      ];
    },

    rgba(c, alpha) {
      return `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${alpha})`;
    },

    /* Continuous darkness target — ramps progressively down to 600m,
       and locks at 1.00 (pitch black) at and after 600m. */
    darkness() {
      const f = this.frame;
      const d = f.currentDepth !== undefined ? f.currentDepth : f.progress * 1000;
      if (d >= 600) return 1.00; // Pitch black at and after 600m

      const a = ZONES[f.zone].darkness;
      const b = f.zone < ZONES.length - 1 ? ZONES[f.zone + 1].darkness : DARKNESS_CEILING;
      return Math.min(1.0, a + (b - a) * f.zoneMix);
    },
  };

  reduceQuery.addEventListener('change', e => { OCEAN.reduceMotion = e.matches; });
  window.addEventListener('resize', () => { OCEAN.tier = tierFor(window.innerWidth); }, { passive: true });

  window.OCEAN = OCEAN;
})();
