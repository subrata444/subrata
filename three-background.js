/* Three.js fixed page background (stays in place while scrolling): a floating network of glowing points and lines,
   drifting particles and two wireframe shapes, with mouse parallax.
   Exposes only window.SJBackground.destroy() for cleanup. */
(function () {
  var canvas = document.getElementById('bg3d');
  var hero = document.getElementById('home');
  if (!canvas || !hero) return;

  // 1. Fallback: no Three.js (CDN blocked) or no WebGL -> CSS gradient takes over
  function hasWebGL() {
    try { var c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl'))); }
    catch (e) { return false; }
  }
  if (!window.THREE || !hasWebGL()) { document.documentElement.classList.add('no-webgl'); return; }

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isMobile = window.innerWidth < 768 || window.matchMedia('(pointer: coarse)').matches;
  var NODES = isMobile ? 40 : 85;          // network points
  var DUST = isMobile ? 150 : 450;         // small drifting particles

  var renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: !isMobile, powerPreference: 'low-power' }); }
  catch (e) { document.documentElement.classList.add('no-webgl'); return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2));
  renderer.setClearColor(0x000000, 0);     // transparent, blends with the page

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
  camera.position.z = 14;
  var world = new THREE.Group();
  scene.add(world);

  // 2. Network: random points inside a sphere, joined when they are close
  var pts = [], pos = new Float32Array(NODES * 3), i, j;
  for (i = 0; i < NODES; i++) {
    var r = 5.5 * Math.cbrt(Math.random()), th = Math.random() * 6.283, ph = Math.acos(2 * Math.random() - 1);
    var p = new THREE.Vector3(r * Math.sin(ph) * Math.cos(th), r * Math.sin(ph) * Math.sin(th), r * Math.cos(ph));
    pts.push(p); pos[i * 3] = p.x; pos[i * 3 + 1] = p.y; pos[i * 3 + 2] = p.z;
  }
  var linePos = [];
  for (i = 0; i < NODES; i++) for (j = i + 1; j < NODES; j++)
    if (pts[i].distanceTo(pts[j]) < 2.6) linePos.push(pts[i].x, pts[i].y, pts[i].z, pts[j].x, pts[j].y, pts[j].z);
  var nodeGeo = new THREE.BufferGeometry(); nodeGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  var lineGeo = new THREE.BufferGeometry(); lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePos, 3));
  var nodeMat = new THREE.PointsMaterial({ size: 0.16, transparent: true, depthWrite: false });
  var lineMat = new THREE.LineBasicMaterial({ transparent: true, depthWrite: false });
  world.add(new THREE.Points(nodeGeo, nodeMat));
  world.add(new THREE.LineSegments(lineGeo, lineMat));

  // 3. Dust: faint particles filling the depth of the scene
  var dustPos = new Float32Array(DUST * 3);
  for (i = 0; i < DUST * 3; i++) dustPos[i] = (Math.random() - 0.5) * 30;
  var dustGeo = new THREE.BufferGeometry(); dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  var dustMat = new THREE.PointsMaterial({ size: 0.05, transparent: true, depthWrite: false });
  var dust = new THREE.Points(dustGeo, dustMat); scene.add(dust);

  // 4. Wireframe shapes
  var icoMat = new THREE.MeshBasicMaterial({ wireframe: true, transparent: true });
  var knotMat = new THREE.MeshBasicMaterial({ wireframe: true, transparent: true });
  var ico = new THREE.Mesh(new THREE.IcosahedronGeometry(2.2, 1), icoMat);
  var knot = new THREE.Mesh(new THREE.TorusKnotGeometry(0.9, 0.28, isMobile ? 64 : 110, 10), knotMat);
  ico.position.set(4.5, 1, -2); knot.position.set(-5, -2.5, -1);
  scene.add(ico); scene.add(knot);

  var running = false;
  function render() { renderer.render(scene, camera); }

  // 5. Theme colours come from the CSS variables, so both themes look right
  function applyTheme() {
    var cs = getComputedStyle(document.documentElement);
    var a = cs.getPropertyValue('--accent').trim(), v = cs.getPropertyValue('--violet').trim();
    var light = document.documentElement.getAttribute('data-theme') === 'light';
    var blend = light ? THREE.NormalBlending : THREE.AdditiveBlending;   // additive glow only works on dark
    nodeMat.color.set(a); lineMat.color.set(v); dustMat.color.set(light ? v : '#ffffff');
    icoMat.color.set(v); knotMat.color.set(a);
    nodeMat.opacity = light ? 0.9 : 1; lineMat.opacity = light ? 0.35 : 0.45; dustMat.opacity = 0.5;
    icoMat.opacity = light ? 0.28 : 0.35; knotMat.opacity = light ? 0.3 : 0.4;
    [nodeMat, lineMat, dustMat].forEach(function (m) { m.blending = blend; m.needsUpdate = true; });
    if (!running) render();
  }

  // 6. Sizing follows the browser window
  function resize() {
    var w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    // Move the whole scene to the right so the text on the left stays clear.
    // Make the numbers bigger to push it further right (0 = centred).
    scene.position.x = w > 1100 ? 3.5 : (w > 768 ? 2 : 0);
    if (!running) render();
  }
  window.addEventListener('resize', resize);

  // Dim the scene a little once you scroll past the hero, so the text below stays easy to read
  function onScrollFade() {
    var f = Math.min(window.scrollY / (hero.offsetHeight * 0.8), 1);
    canvas.style.opacity = (1 - f * 0.5).toFixed(2);        // 1 at the top, 0.5 further down
  }
  window.addEventListener('scroll', onScrollFade, { passive: true }); onScrollFade();

  // 7. Mouse parallax
  var mx = 0, my = 0, tx = 0, ty = 0;
  function onMove(e) { tx = (e.clientX / window.innerWidth - 0.5) * 2; ty = (e.clientY / window.innerHeight - 0.5) * 2; }
  if (!reduceMotion && !isMobile) window.addEventListener('pointermove', onMove, { passive: true });

  // 8. Animation loop, paused when the tab is hidden
  var clock = new THREE.Clock(), raf = 0;
  function frame() {
    raf = requestAnimationFrame(frame);
    var t = clock.getElapsedTime();
    mx += (tx - mx) * 0.05; my += (ty - my) * 0.05;
    world.rotation.y = t * 0.06 + mx * 0.25; world.rotation.x = Math.sin(t * 0.2) * 0.1 + my * 0.15;
    dust.rotation.y = t * 0.015;
    ico.rotation.x = t * 0.15; ico.rotation.y = t * 0.2; ico.position.y = 1 + Math.sin(t * 0.7) * 0.4;
    knot.rotation.x = t * 0.25; knot.rotation.y = t * 0.12; knot.position.y = -2.5 + Math.cos(t * 0.6) * 0.4;
    camera.position.x = mx * 0.8; camera.position.y = -my * 0.5; camera.lookAt(0, 0, 0);
    render();
  }
  function start() { if (!running && !reduceMotion && !document.hidden) { running = true; clock.start(); frame(); } }
  function stop() { running = false; cancelAnimationFrame(raf); }
  function onVisibility() { if (document.hidden) stop(); else start(); }
  document.addEventListener('visibilitychange', onVisibility);
  document.addEventListener('themechange', applyTheme);

  resize(); applyTheme();
  if (reduceMotion) render(); else start();   // reduced motion: one still frame, no loop

  // 9. Cleanup: remove listeners and free GPU memory
  function destroy() {
    stop();
    window.removeEventListener('resize', resize);
    window.removeEventListener('scroll', onScrollFade);
    window.removeEventListener('pointermove', onMove);
    document.removeEventListener('visibilitychange', onVisibility);
    document.removeEventListener('themechange', applyTheme);
    [nodeGeo, lineGeo, dustGeo, ico.geometry, knot.geometry].forEach(function (g) { g.dispose(); });
    [nodeMat, lineMat, dustMat, icoMat, knotMat].forEach(function (m) { m.dispose(); });
    renderer.dispose();
  }
  window.addEventListener('pagehide', destroy, { once: true });
  window.SJBackground = { destroy: destroy };
})();
