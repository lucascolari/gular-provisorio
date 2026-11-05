/* =========================================================================
   Fondo de partículas INTERACTIVO (Three.js) — estilo "video de partículas"
   - Fondo blanco, partículas negras (con leve detalle de color), tipo polvo
     orgánico + blobs/moléculas suaves (bokeh), distribuidas en cúmulos.
   - Interacción con el mouse igual que antes: parallax de cámara + deriva +
     viaje por scroll + titileo. El mouse además genera una leve estela.
   - Respeta prefers-reduced-motion y hace fallback si no hay WebGL.
   ========================================================================= */
import * as THREE from "three";

const root = document.documentElement;
const canvas = document.getElementById("space");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function disableWebGL() {
  root.setAttribute("data-webgl", "off");
  if (canvas) canvas.remove();
}

if (reduceMotion) disableWebGL();
else init();

function init() {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  } catch (e) { disableWebGL(); return; }
  if (!renderer.getContext()) { disableWebGL(); return; }

  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const maxDPR = isMobile ? 1.5 : 2;
  const dpr = Math.min(window.devicePixelRatio || 1, maxDPR);
  renderer.setPixelRatio(dpr);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0); // transparente: el blanco lo pone el body
  renderer.autoClear = true;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 400);
  camera.position.z = 1;

  /* ---------------- Distribución en cúmulos (como el video) --------------- */
  const COUNT = isMobile ? 4200 : 8800;
  const SPREAD = 92;
  const DEPTH = 260;

  // Centros de cúmulo = da la estructura de "corrientes/filamentos" del video.
  const CL = 11;
  const clusters = [];
  for (let c = 0; c < CL; c++) {
    clusters.push([
      (Math.random() - 0.5) * SPREAD * 1.05,
      (Math.random() - 0.5) * SPREAD * 1.05,
      -Math.random() * DEPTH,
    ]);
  }
  // reparto gaussiano barato
  const g = (s) => (Math.random() + Math.random() + Math.random() - 1.5) * s;

  // Paleta tenue (detalles de color opcionales): teal, malva, ámbar, azul, verde
  const PALETTE = [
    [0.10, 0.46, 0.44], [0.52, 0.32, 0.44], [0.55, 0.45, 0.20],
    [0.24, 0.36, 0.55], [0.28, 0.46, 0.26],
  ];

  const pos = new Float32Array(COUNT * 3);
  const siz = new Float32Array(COUNT);
  const pha = new Float32Array(COUNT);
  const col = new Float32Array(COUNT * 3);
  const sof = new Float32Array(COUNT); // suavidad/bokeh 0..1

  for (let i = 0; i < COUNT; i++) {
    // posición: 66% en cúmulos (corrientes mas definidas), resto disperso
    if (Math.random() < 0.66) {
      const c = clusters[(Math.random() * CL) | 0];
      pos[i*3+0] = c[0] + g(9);
      pos[i*3+1] = c[1] + g(9);
      pos[i*3+2] = c[2] + g(24);
    } else {
      pos[i*3+0] = (Math.random() - 0.5) * SPREAD;
      pos[i*3+1] = (Math.random() - 0.5) * SPREAD;
      pos[i*3+2] = -Math.random() * DEPTH;
    }
    pha[i] = Math.random() * Math.PI * 2;

    const r = Math.random();
    // Mayoría: polvo chico. Más medianas y más "moléculas" (bokeh grande) que antes.
    if (r < 0.72) { siz[i] = Math.random() * 1.5 + 0.5; sof[i] = Math.random() * 0.3; }
    else if (r < 0.94) { siz[i] = Math.random() * 3.6 + 2.2; sof[i] = 0.42 + Math.random() * 0.30; }
    else { siz[i] = Math.random() * 8.5 + 6.0; sof[i] = 0.76 + Math.random() * 0.24; } // moléculas/bokeh

    // color: polvo casi todo negro; las medianas/grandes llevan mas tinte.
    const colored = Math.random() < (r > 0.94 ? 0.62 : (r > 0.72 ? 0.24 : 0.07));
    if (colored) {
      const p = PALETTE[(Math.random() * PALETTE.length) | 0];
      const k = 0.68 + Math.random() * 0.42; // tinte mas visible
      col[i*3+0] = p[0] * k; col[i*3+1] = p[1] * k; col[i*3+2] = p[2] * k;
    } else {
      const base = 0.03 + Math.random() * 0.07; // casi negro
      col[i*3+0] = base; col[i*3+1] = base; col[i*3+2] = base + 0.01;
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("aSize", new THREE.BufferAttribute(siz, 1));
  geo.setAttribute("aPhase", new THREE.BufferAttribute(pha, 1));
  geo.setAttribute("aColor", new THREE.BufferAttribute(col, 3));
  geo.setAttribute("aSoft", new THREE.BufferAttribute(sof, 1));

  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, depthTest: false,
    blending: THREE.NormalBlending,
    uniforms: { uTime: { value: 0 }, uDpr: { value: dpr }, uH: { value: window.innerHeight } },
    vertexShader: `
      attribute float aSize; attribute float aPhase; attribute vec3 aColor; attribute float aSoft;
      uniform float uTime, uDpr, uH;
      varying float vTw; varying vec3 vColor; varying float vSoft;
      void main(){
        vTw = 0.6 + 0.4 * sin(uTime * 1.2 + aPhase); // titileo suave
        vColor = aColor; vSoft = aSoft;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = aSize * uDpr * (uH * 0.085) / max(-mv.z, 0.001);
      }
    `,
    fragmentShader: `
      precision mediump float;
      varying float vTw; varying vec3 vColor; varying float vSoft;
      void main(){
        float d = length(gl_PointCoord - 0.5) * 2.0;      // 0 centro .. 1 borde
        // caída radial suave; mas difusa cuanto mayor es vSoft (bokeh)
        float a = pow(max(0.0, 1.0 - d), mix(1.3, 2.6, vSoft));
        a *= mix(0.94, 0.5, vSoft);  // los bokeh grandes, algo mas presentes
        a *= vTw;
        if (a < 0.01) discard;
        gl_FragColor = vec4(vColor, a);
      }
    `,
  });

  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  scene.add(points);

  /* ---------------- Scroll + parallax (igual que antes) + estela ---------- */
  let scrollP = 0, tX = 0, tY = 0, cX = 0, cY = 0, mX = 0, mY = 0, mmX = 0, mmY = 0;
  function onScroll(){
    const max = document.documentElement.scrollHeight - window.innerHeight;
    scrollP = max > 0 ? window.scrollY / max : 0;
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("pointermove", (e) => {
    tX = (e.clientX / window.innerWidth - 0.5) * 2;
    tY = (e.clientY / window.innerHeight - 0.5) * 2;
    mX = tX; mY = tY;
  }, { passive: true });

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    mat.uniforms.uH.value = window.innerHeight;
  }, { passive: true });

  /* ---------------- Loop -------------------------------------------------- */
  const clock = new THREE.Clock();
  let running = true, first = false;
  document.addEventListener("visibilitychange", () => {
    running = !document.hidden;
    if (running) { clock.start(); loop(); }
  });

  function loop(){
    if (!running) return;
    const t = clock.getElapsedTime();

    cX += (tX - cX) * 0.04; cY += (tY - cY) * 0.04;
    // estela suave del mouse (empuje adicional del campo)
    mmX += (mX - mmX) * 0.08; mmY += (mY - mmY) * 0.08;

    camera.position.x = cX * 1.5 + mmX * 0.6;
    camera.position.y = -cY * 1.1 - mmY * 0.5;
    camera.position.z = 1 - scrollP * 150; // viaje por el campo con el scroll
    points.rotation.z = t * 0.006;
    camera.lookAt(0, 0, camera.position.z - 10);

    mat.uniforms.uTime.value = t;

    renderer.render(scene, camera);
    if (!first) { first = true; window.dispatchEvent(new Event("space:ready")); }
    requestAnimationFrame(loop);
  }
  loop();
}
