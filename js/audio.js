/* js/audio.js — procedural ambient soundscape (no audio files: filtered noise
   + oscillators), gated behind an explicit user toggle. Starts muted and never
   autoplays, per browser autoplay policy and the brief's sound guidance. */
'use strict';
(function initAudio() {
  const toggle = $('#soundToggle');
  if (!toggle) return;

  const O = window.OCEAN;
  let ctx = null, master = null, nodes = null, raf = null;
  let on = false;

  function build() {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);

    // Pink-ish noise bed via filtered white noise
    const bufLen = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const data = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < bufLen; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.2;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    noise.loop = true;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.value = 500;
    noiseFilter.Q.value = 0.6;

    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.5;

    noise.connect(noiseFilter).connect(noiseGain).connect(master);
    noise.start();

    // Slow sub-bass swell for depth
    const sub = ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.value = 54;
    const subGain = ctx.createGain();
    subGain.gain.value = 0.05;
    sub.connect(subGain).connect(master);
    sub.start();

    nodes = { noiseFilter, subGain, sub };
  }

  function tick() {
    raf = requestAnimationFrame(tick);
    if (!on || !nodes) return;
    // Filter darkens and the sub-swell grows as we descend, tracking OCEAN.frame
    const p = O.frame.progress;
    const sub = O.frame.submerged;
    const now = ctx.currentTime;
    nodes.noiseFilter.frequency.setTargetAtTime(720 - p * 560, now, 0.6);
    nodes.subGain.gain.setTargetAtTime(0.04 + p * 0.09, now, 0.8);
    master.gain.setTargetAtTime(on ? 0.22 * Math.max(0.15, sub) : 0, now, 0.5);
  }

  toggle.addEventListener('click', async () => {
    if (!ctx) build();
    if (ctx.state === 'suspended') await ctx.resume();

    on = !on;
    toggle.classList.toggle('on', on);
    toggle.setAttribute('aria-pressed', String(on));
    const now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setTargetAtTime(on ? 0.22 : 0, now, 0.5);

    if (on && raf === null) tick();
  });
})();
