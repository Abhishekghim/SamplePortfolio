/* js/utils.js — shared helpers */
'use strict';

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

function clamp(val, min, max) { return Math.min(Math.max(val, min), max); }

function lerp(a, b, t) { return a + (b - a) * t; }

function rand(min, max) { return min + Math.random() * (max - min); }

function randInt(min, max) { return Math.floor(rand(min, max + 1)); }

function scrollProgress() {
  const total = document.documentElement.scrollHeight - window.innerHeight;
  return total > 0 ? clamp(window.scrollY / total, 0, 1) : 0;
}

function getActiveSectionIndex() {
  const sections = $$('section[data-depth]');
  let idx = 0;
  sections.forEach((s, i) => {
    const top = s.getBoundingClientRect().top;
    if (top <= window.innerHeight * 0.45) idx = i;
  });
  return idx;
}

function raf(fn) {
  let id;
  const loop = () => { fn(); id = requestAnimationFrame(loop); };
  id = requestAnimationFrame(loop);
  return () => cancelAnimationFrame(id);
}

// Expose
window.$ = $;
window.$$ = $$;
window.clamp = clamp;
window.lerp = lerp;
window.rand = rand;
window.randInt = randInt;
window.scrollProgress = scrollProgress;
window.getActiveSectionIndex = getActiveSectionIndex;
window.raf = raf;
