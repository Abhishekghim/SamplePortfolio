/* js/three-environment.js — Selective Three.js WebGL Ocean Engine
   Delicate spatial depth, soft underwater light shafts, 3D marine snow,
   and physical light attenuation fog. Completely unobtrusive to text. */
'use strict';
(function initThreeEnvironment() {

  function isWebGLAvailable() {
    try {
      const canvas = document.createElement('canvas');
      return !!(window.WebGLRenderingContext &&
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch (e) {
      return false;
    }
  }

  if (!isWebGLAvailable() || typeof THREE === 'undefined') {
    window.ThreeEnv = { isAvailable: false, update() {}, resize() {} };
    return;
  }

  const oceanCanvas = document.getElementById('ocean-canvas');
  if (!oceanCanvas) return;

  const canvas = document.createElement('canvas');
  canvas.id = 'three-ocean-canvas';
  canvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:0;';
  oceanCanvas.insertBefore(canvas, oceanCanvas.firstChild);

  let W = window.innerWidth;
  let H = window.innerHeight;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, W / H, 1, 3500);
  camera.position.set(0, 0, 400);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance',
  });
  renderer.setSize(W, H);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setClearColor(0x000000, 0);

  // Depth-based physical fog
  scene.fog = new THREE.FogExp2(0x1a6b8a, 0.0016);

  /* ────────────────────────────────────────────
     1. SUBTLE UNDERWATER LIGHT SHAFTS (Only active underwater)
  ──────────────────────────────────────────── */
  const rayGroup = new THREE.Group();
  const rayCount = 5;
  const rays = [];

  for (let i = 0; i < rayCount; i++) {
    const topR = 8 + Math.random() * 10;
    const botR = topR * 3.2;
    const len = 500 + Math.random() * 250;
    const geo = new THREE.CylinderGeometry(topR, botR, len, 12, 1, true);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x5cd6f5,
      transparent: true,
      opacity: 0.025, // Extremely soft, delicate shimmer
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const ray = new THREE.Mesh(geo, mat);
    ray.position.set(
      (Math.random() - 0.5) * 650,
      -80 - len * 0.4,
      -180 - Math.random() * 150
    );
    ray.rotation.z = (Math.random() - 0.5) * 0.25;
    ray.userData = {
      baseAngle: ray.rotation.z,
      swaySpeed: 0.25 + Math.random() * 0.35,
      swayAmp: 0.05 + Math.random() * 0.04,
      phase: Math.random() * Math.PI * 2,
      baseOpacity: 0.02 + Math.random() * 0.02,
    };
    rayGroup.add(ray);
    rays.push(ray);
  }
  rayGroup.visible = false; // Hidden at surface, only fades in underwater!
  scene.add(rayGroup);

  /* ────────────────────────────────────────────
     2. 3D MARINE SNOW & PARTICULATE DEPTH FIELD
  ──────────────────────────────────────────── */
  const particleCount = 450;
  const pGeo = new THREE.BufferGeometry();
  const pPositions = new Float32Array(particleCount * 3);
  const pVelocities = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3;
    pPositions[i3]     = (Math.random() - 0.5) * 1200;
    pPositions[i3 + 1] = (Math.random() - 0.5) * 3000;
    pPositions[i3 + 2] = -350 + Math.random() * 500;

    pVelocities[i3]     = (Math.random() - 0.5) * 0.15;
    pVelocities[i3 + 1] = 0.12 + Math.random() * 0.25;
    pVelocities[i3 + 2] = (Math.random() - 0.5) * 0.08;
  }

  pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));

  function createParticleTexture() {
    const cv = document.createElement('canvas');
    cv.width = 24; cv.height = 24;
    const ctx = cv.getContext('2d');
    const g = ctx.createRadialGradient(12, 12, 0, 12, 12, 12);
    g.addColorStop(0, 'rgba(255,255,255,0.9)');
    g.addColorStop(0.4, 'rgba(120,230,255,0.45)');
    g.addColorStop(1, 'rgba(0,180,240,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 24, 24);
    return new THREE.CanvasTexture(cv);
  }

  const pMat = new THREE.PointsMaterial({
    size: 3.5,
    map: createParticleTexture(),
    transparent: true,
    opacity: 0.45,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });

  const particleSystem = new THREE.Points(pGeo, pMat);
  scene.add(particleSystem);

  /* ────────────────────────────────────────────
     3. ABYSSAL BIOLUMINESCENT ACCENT
  ──────────────────────────────────────────── */
  const bioLight = new THREE.PointLight(0x00e5ff, 0, 400);
  bioLight.position.set(0, -1800, -60);
  scene.add(bioLight);

  const FOG_PALETTE = [
    { p: 0.00, hex: 0x1a6b8a, density: 0.0012 },
    { p: 0.15, hex: 0x0d4a68, density: 0.0016 },
    { p: 0.35, hex: 0x082440, density: 0.0022 },
    { p: 0.48, hex: 0x03101e, density: 0.0028 },
    { p: 0.58, hex: 0x010408, density: 0.0035 },
    { p: 0.60, hex: 0x000000, density: 0.0045 },
    { p: 1.00, hex: 0x000000, density: 0.0050 },
  ];

  function getFogColor(prog) {
    prog = Math.max(0, Math.min(1, prog));
    let i = 0;
    while (i < FOG_PALETTE.length - 1 && FOG_PALETTE[i + 1].p < prog) i++;
    const a = FOG_PALETTE[i];
    const b = FOG_PALETTE[Math.min(i + 1, FOG_PALETTE.length - 1)];
    const t = (prog - a.p) / ((b.p - a.p) || 1);

    const c1 = new THREE.Color(a.hex);
    const c2 = new THREE.Color(b.hex);
    c1.lerp(c2, t);
    return { color: c1, density: a.density + (b.density - a.density) * t };
  }

  /* ────────────────────────────────────────────
     UPDATE
  ──────────────────────────────────────────── */
  let lastCameraY = 0;

  function update(F) {
    if (document.hidden) return;

    const prog = F.progress || 0;
    const t = F.t || 0;
    const slow = (window.OCEAN && window.OCEAN.reduceMotion) ? 0.25 : 1;

    // Smooth camera depth tracking
    const targetCameraY = -prog * 2200 + 80;
    lastCameraY += (targetCameraY - lastCameraY) * 0.08;
    camera.position.y = lastCameraY;
    camera.position.x = Math.sin(t * 0.35) * 8;

    // Depth fog
    const fogState = getFogColor(prog);
    scene.fog.color.copy(fogState.color);
    scene.fog.density = fogState.density;

    // Underwater light shafts: ONLY visible when submerged (> 0.25) and shallow (< 0.55)
    const submerged = F.submerged || 0;
    if (submerged > 0.25 && prog < 0.55) {
      rayGroup.visible = true;
      const rayFade = clamp((submerged - 0.25) / 0.3, 0, 1) * clamp(1 - (prog - 0.2) / 0.35, 0, 1);
      rays.forEach(r => {
        const ud = r.userData;
        r.rotation.z = ud.baseAngle + Math.sin(t * ud.swaySpeed + ud.phase) * ud.swayAmp;
        r.material.opacity = ud.baseOpacity * rayFade;
      });
    } else {
      rayGroup.visible = false;
    }

    // Marine snow particles
    const posAttr = pGeo.attributes.position;
    const arr = posAttr.array;
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      arr[i3 + 1] += pVelocities[i3 + 1] * slow;
      arr[i3]     += Math.sin(t * 0.6 + i) * 0.12;

      const relY = arr[i3 + 1] - camera.position.y;
      if (relY > 750) {
        arr[i3 + 1] = camera.position.y - 750;
        arr[i3] = (Math.random() - 0.5) * 1200;
      } else if (relY < -750) {
        arr[i3 + 1] = camera.position.y + 750;
        arr[i3] = (Math.random() - 0.5) * 1200;
      }
    }
    posAttr.needsUpdate = true;

    // Abyssal bioluminescence
    if (prog > 0.65) {
      bioLight.intensity = (prog - 0.65) * 2.8;
      bioLight.position.y = camera.position.y + Math.sin(t) * 24;
      bioLight.position.x = Math.sin(t * 0.7) * 60;
    } else {
      bioLight.intensity = 0;
    }

    renderer.render(scene, camera);
  }

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  }

  window.addEventListener('resize', resize, { passive: true });

  window.ThreeEnv = {
    isAvailable: true,
    update,
    resize,
  };

})();
