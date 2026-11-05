/* =========================================================================
   Fondo INTERACTIVO con las VISUALES DEL VIDEO (partículas/moléculas).
   - El video (negativo: blanco + partículas negras) va como textura WebGL
     sobre un quad a pantalla completa → visuales idénticas al video.
   - Interacción tipo el fondo actual: parallax con el mouse + leve
     desplazamiento alrededor del cursor + zoom por scroll. No es un loop
     "plano": reacciona a lo que hace el usuario.
   - Fallback: si no hay WebGL, el <video> queda como fondo por CSS.
   ========================================================================= */
import * as THREE from "three";

const root = document.documentElement;
const canvas = document.getElementById("space");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const VIDEO_SRC = "assets/media/video/posiblefondogular-neg.mp4";
const TEX_A = 1280 / 720; // relación de aspecto del video

function fallbackVideo() {
  // Sin WebGL: ponemos el video como fondo fijo por CSS (al menos se ve).
  root.setAttribute("data-webgl", "off");
  if (canvas) canvas.remove();
  const v = document.createElement("video");
  v.src = VIDEO_SRC; v.loop = true; v.muted = true; v.autoplay = true;
  v.playsInline = true; v.setAttribute("playsinline", "");
  v.style.cssText = "position:fixed;inset:0;width:100vw;height:100vh;object-fit:cover;z-index:0;pointer-events:none;background:#fff";
  v.setAttribute("aria-hidden", "true");
  document.body.prepend(v);
  v.play().catch(() => {});
}

init();

function init() {
  // Elemento de video (fuente de la textura)
  const video = document.createElement("video");
  video.src = VIDEO_SRC;
  video.loop = true; video.muted = true; video.autoplay = true;
  video.playsInline = true; video.setAttribute("playsinline", "");
  video.setAttribute("webkit-playsinline", "");
  video.crossOrigin = "anonymous";
  const playing = video.play();
  if (playing && playing.catch) playing.catch(() => {});

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: "high-performance" });
  } catch (e) { fallbackVideo(); return; }
  if (!renderer.getContext()) { fallbackVideo(); return; }

  const maxDPR = window.matchMedia("(max-width: 860px)").matches ? 1.5 : 2;
  const dpr = Math.min(window.devicePixelRatio || 1, maxDPR);
  renderer.setPixelRatio(dpr);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0xffffff, 1);

  const tex = new THREE.VideoTexture(video);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTex:   { value: tex },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uViewA: { value: window.innerWidth / window.innerHeight },
      uTexA:  { value: TEX_A },
      uTime:  { value: 0 },
      uScroll:{ value: 0 },
      uRipple:{ value: reduceMotion ? 0.0 : 1.0 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main(){ vUv = uv; gl_Position = vec4(position, 1.0); }
    `,
    fragmentShader: `
      precision highp float;
      uniform sampler2D uTex;
      uniform vec2 uMouse;            // -1..1 (suavizado)
      uniform float uViewA, uTexA, uTime, uScroll, uRipple;
      varying vec2 vUv;
      void main(){
        // "cover": la textura llena la pantalla recortando el sobrante
        vec2 scale = (uViewA > uTexA) ? vec2(1.0, uTexA / uViewA) : vec2(uViewA / uTexA, 1.0);
        float zoom = 0.94 - uScroll * 0.07;         // leve zoom (deja aire para el parallax) + scroll
        vec2 uv = (vUv - 0.5) * scale * zoom + 0.5;

        // parallax: el campo se desplaza con el mouse
        uv += uMouse * 0.03;

        // desplazamiento suave alrededor del cursor (sensación interactiva)
        vec2 m = uMouse * 0.5 + 0.5;
        vec2 d = (vUv - m) * vec2(uViewA, 1.0);
        float dist = length(d);
        float infl = smoothstep(0.5, 0.0, dist);
        uv += normalize(d + 1e-4) * infl * uRipple * 0.012 * sin(uTime * 1.3 - dist * 9.0);

        gl_FragColor = texture2D(uTex, clamp(uv, 0.0015, 0.9985));
      }
    `,
  });

  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));

  /* ---------------- Interacción: mouse + scroll --------------------------- */
  let scrollP = 0, tX = 0, tY = 0, cX = 0, cY = 0;
  function onScroll(){
    const max = document.documentElement.scrollHeight - window.innerHeight;
    scrollP = max > 0 ? window.scrollY / max : 0;
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("pointermove", (e) => {
    tX = (e.clientX / window.innerWidth - 0.5) * 2;
    tY = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  window.addEventListener("resize", () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    mat.uniforms.uViewA.value = window.innerWidth / window.innerHeight;
  }, { passive: true });

  /* ---------------- Loop -------------------------------------------------- */
  const clock = new THREE.Clock();
  let running = true, first = false;
  document.addEventListener("visibilitychange", () => {
    running = !document.hidden;
    if (running) { video.play().catch(() => {}); clock.start(); loop(); }
    else { video.pause(); }
  });

  function loop(){
    if (!running) return;
    const t = clock.getElapsedTime();
    // suavizado del mouse (estela)
    cX += (tX - cX) * 0.05; cY += (tY - cY) * 0.05;
    mat.uniforms.uMouse.value.set(cX, -cY);
    mat.uniforms.uScroll.value += (scrollP - mat.uniforms.uScroll.value) * 0.06;
    mat.uniforms.uTime.value = t;

    renderer.render(scene, camera);
    if (!first) { first = true; window.dispatchEvent(new Event("space:ready")); }
    requestAnimationFrame(loop);
  }
  loop();
}
