/* =========================================================================
   LIQUID — versión LIVIANA sobre el FONDO C (video de moléculas)
   - El fondo (video invertido) se ONDULA con el mouse (fluido liviano), igual
     que antes.
   - El TÍTULO "gularagency" recibe el MISMO efecto del fluido PERO solo como
     aberración cromática (tornasolado) donde pasa el mouse: las letras NO se
     deforman (el canal verde queda fijo; rojo/azul se separan según el fluido).
   ========================================================================= */
import * as THREE from "three";
import { Fluid, COMPOSITE_VERT } from "./fluid-core.js";

const root = document.documentElement;
const canvas = document.getElementById("space");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const VIDEO_SRC = "assets/media/video/posiblefondogular-neg.mp4";
const TEX_A = 1280 / 720;

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: "high-performance" });
} catch (e) { root.setAttribute("data-webgl", "off"); if (canvas) canvas.remove(); }

if (renderer) start();

async function start() {
  try {
    await Promise.all([
      document.fonts.load('400 120px "Sahlia"'),
      document.fonts.load('italic 400 40px "Satoshi"'),
      document.fonts.ready,
    ]);
  } catch (e) {}
  init();
}

function init() {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2);
  renderer.setPixelRatio(dpr);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.autoClear = false;

  /* ---------- fondo: video (cover) -> contentRT (se distorsiona) --------- */
  const video = document.createElement("video");
  video.src = VIDEO_SRC; video.loop = true; video.muted = true; video.autoplay = true;
  video.playsInline = true; video.setAttribute("playsinline", "");
  video.setAttribute("webkit-playsinline", ""); video.crossOrigin = "anonymous";
  const pl = video.play(); if (pl && pl.catch) pl.catch(() => {});
  const vtex = new THREE.VideoTexture(video);
  vtex.minFilter = THREE.LinearFilter; vtex.magFilter = THREE.LinearFilter; vtex.generateMipmaps = false;

  const cScene = new THREE.Scene();
  const cCam = new THREE.Camera();
  const coverMat = new THREE.ShaderMaterial({
    uniforms: { uTex: { value: vtex }, uViewA: { value: window.innerWidth / window.innerHeight }, uTexA: { value: TEX_A } },
    vertexShader: COMPOSITE_VERT,
    fragmentShader: `
      precision highp float;
      uniform sampler2D uTex; uniform float uViewA, uTexA; varying vec2 vUv;
      void main(){
        vec2 scale = (uViewA > uTexA) ? vec2(1.0, uTexA/uViewA) : vec2(uViewA/uTexA, 1.0);
        vec2 uv = (vUv - 0.5) * scale + 0.5;
        gl_FragColor = texture2D(uTex, clamp(uv, 0.001, 0.999));
      }`,
    depthTest: false, depthWrite: false,
  });
  cScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), coverMat));

  function makeRT() {
    const w = Math.floor(window.innerWidth * dpr), h = Math.floor(window.innerHeight * dpr);
    return new THREE.WebGLRenderTarget(w, h, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false, stencilBuffer: false });
  }
  let contentRT = makeRT();

  /* ---------- título: dibujado en canvas, ubicado donde el DOM ----------- */
  const titleEl = document.querySelector(".hero__title");
  const tc = document.createElement("canvas");
  const tctx = tc.getContext("2d");
  const titleTex = new THREE.CanvasTexture(tc);
  titleTex.minFilter = THREE.LinearFilter; titleTex.magFilter = THREE.LinearFilter;

  function drawTitle() {
    tc.width = Math.floor(window.innerWidth * dpr);
    tc.height = Math.floor(window.innerHeight * dpr);
    tctx.clearRect(0, 0, tc.width, tc.height);
    if (!titleEl) { titleTex.needsUpdate = true; return; }
    const r = titleEl.getBoundingClientRect();
    const fs = parseFloat(getComputedStyle(titleEl).fontSize) || Math.min(window.innerWidth * 0.16, 220);
    const size = fs * dpr;
    const cxp = (r.left + r.width / 2) * dpr;
    const cyp = (r.top + r.height / 2) * dpr;
    tctx.textBaseline = "middle"; tctx.textAlign = "left";
    try { tctx.letterSpacing = `${-0.03 * size}px`; } catch (e) {}
    tctx.font = `400 ${size}px "Sahlia", Georgia, serif`;
    const wG = tctx.measureText("gular").width;
    try { tctx.letterSpacing = `${-0.015 * size}px`; } catch (e) {}
    tctx.font = `italic 400 ${size * 0.92}px "Satoshi", system-ui, sans-serif`;
    const wA = tctx.measureText("agency").width;
    const startX = cxp - (wG + wA) / 2;
    // "gular" negro
    try { tctx.letterSpacing = `${-0.03 * size}px`; } catch (e) {}
    tctx.fillStyle = "#050507";
    tctx.font = `400 ${size}px "Sahlia", Georgia, serif`;
    tctx.fillText("gular", startX, cyp);
    // "agency" itálica con fundido a la derecha
    try { tctx.letterSpacing = `${-0.015 * size}px`; } catch (e) {}
    tctx.font = `italic 400 ${size * 0.92}px "Satoshi", system-ui, sans-serif`;
    const gx = startX + wG;
    const grad = tctx.createLinearGradient(gx, 0, gx + wA, 0);
    grad.addColorStop(0, "#050507"); grad.addColorStop(0.22, "#050507"); grad.addColorStop(1, "rgba(5,5,7,0.12)");
    tctx.fillStyle = grad;
    tctx.fillText("agency", gx, cyp);
    titleTex.needsUpdate = true;
  }
  drawTitle();

  /* ------------------------------ fluido --------------------------------- */
  const fluid = new Fluid(renderer, {
    resolution: isMobile ? 90 : 128,
    iterations: 0,            // LIVIANO (igual que antes en el fondo)
    dissipation: 0.93,
    radius: 0.0030,
    force: 6.0,
  });

  /* ------- composición: fondo distorsionado + título solo cromático ------ */
  const composite = new THREE.ShaderMaterial({
    uniforms: {
      tBg: { value: contentRT.texture },
      uTitle: { value: titleTex },
      uVelocity: { value: fluid.texture },
      uDistort: { value: 0.14 },   // deformación del FONDO
      uRGB: { value: 0.25 },       // aberración del FONDO
      uChroma: { value: 0.08 },    // aberración del TÍTULO (sin deformar) — más suave
    },
    vertexShader: COMPOSITE_VERT,
    fragmentShader: `
      precision highp float;
      uniform sampler2D tBg, uTitle, uVelocity;
      uniform float uDistort, uRGB, uChroma;
      varying vec2 vUv;
      void main(){
        vec2 v = texture2D(uVelocity, vUv).xy;
        // --- FONDO: distorsión + aberración (como antes) ---
        vec2 off = v * uDistort;
        float br = texture2D(tBg, vUv + off*(1.0+uRGB)).r;
        vec4  bc = texture2D(tBg, vUv + off);
        float bb = texture2D(tBg, vUv + off*(1.0-uRGB)).b;
        vec3 col = vec3(br, bc.g, bb);
        // --- TÍTULO: aberración en ESCALA DE GRISES, SIN desplazar las letras ---
        vec2 sp = v * uChroma;
        vec4 tR = texture2D(uTitle, vUv + sp);
        vec4 tG = texture2D(uTitle, vUv);
        vec4 tB = texture2D(uTitle, vUv - sp);
        // composición cromática temporal (sobre el fondo) para extraer su gris
        vec3 tcol = col;
        tcol.r = mix(col.r, tR.r, tR.a);
        tcol.g = mix(col.g, tG.g, tG.a);
        tcol.b = mix(col.b, tB.b, tB.a);
        float infl = max(max(tR.a, tG.a), tB.a);            // dónde influye el título
        float lum = dot(tcol, vec3(0.299, 0.587, 0.114));   // su luminancia (gris)
        col = mix(col, vec3(lum), infl);                    // fondo colorido / título gris
        gl_FragColor = vec4(col, 1.0);
      }`,
    depthTest: false, depthWrite: false,
  });
  const sScene = new THREE.Scene();
  const sCam = new THREE.Camera();
  sScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), composite));

  /* ------------------------------ mouse ---------------------------------- */
  const DEMO = new URLSearchParams(location.search).has("demo");
  let ux = 0.5, uy = 0.5, pux = 0.5, puy = 0.5, moved = false;
  window.addEventListener("pointermove", (e) => {
    ux = e.clientX / window.innerWidth;
    uy = 1 - e.clientY / window.innerHeight;
    moved = true;
  }, { passive: true });

  window.addEventListener("scroll", drawTitle, { passive: true });
  window.addEventListener("resize", () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    coverMat.uniforms.uViewA.value = window.innerWidth / window.innerHeight;
    contentRT.dispose(); contentRT = makeRT();
    fluid.resize();
    composite.uniforms.uVelocity.value = fluid.texture;
    drawTitle();
  }, { passive: true });

  let running = true;
  document.addEventListener("visibilitychange", () => {
    running = !document.hidden;
    if (running) { video.play().catch(() => {}); if (!reduceMotion) loop(); }
    else video.pause();
  });

  function frame() {
    // 1) fondo (video) -> contentRT
    renderer.setRenderTarget(contentRT);
    renderer.render(cScene, cCam);
    // 2) mouse -> fluido
    if (DEMO) {
      const tt = performance.now() * 0.001;
      // barrido horizontal justo sobre el título, para previsualizar/testear
      let ty = 0.56;
      if (titleEl) { const r = titleEl.getBoundingClientRect(); ty = 1 - (r.top + r.height / 2) / window.innerHeight; }
      ux = 0.5 + 0.34 * Math.sin(tt * 1.6);
      uy = ty;
      moved = true;
    }
    if (moved) {
      const fx = (ux - pux), fy = (uy - puy);
      if (fx || fy) fluid.addForce(ux, uy, fx, fy);
      pux = ux; puy = uy; moved = false;
    }
    fluid.update(1.0);
    // 3) composición -> pantalla
    composite.uniforms.tBg.value = contentRT.texture;
    composite.uniforms.uVelocity.value = fluid.texture;
    renderer.setRenderTarget(null);
    renderer.render(sScene, sCam);
  }
  function loop() { if (!running) return; frame(); requestAnimationFrame(loop); }

  loop();
}
