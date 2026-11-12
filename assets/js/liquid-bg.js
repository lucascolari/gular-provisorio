/* =========================================================================
   FONDO GULAR — video de moléculas (invertido) que se ONDULA con el mouse +
   TÍTULO "gularagency" con aberración en ESCALA DE GRISES (sin deformar).
   Reemplaza el starfield (space.js). No mueve ni cambia nada del sitio:
   el título se dibuja en WebGL en el MISMO lugar/tamaño que el DOM (que leemos
   en vivo, respetando fitHero), y el texto del DOM se vuelve transparente solo
   si el efecto arranca (fallback: si no hay WebGL, el título se ve normal).
   ========================================================================= */
import * as THREE from "three";

const root = document.documentElement;
const canvas = document.getElementById("space");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const VIDEO_SRC = "assets/media/video/posiblefondogular-neg.mp4";
const TEX_A = 1280 / 720;

// Shader de composición (fullscreen)
const VERT = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: "high-performance" });
} catch (e) {
  root.setAttribute("data-webgl", "off");
  if (canvas) canvas.remove();
}

/* --- Fluido liviano (1 pasada): el mouse inyecta fuerza según su velocidad --- */
class Fluid {
  constructor(renderer, opts) {
    this.renderer = renderer;
    this.o = Object.assign({ resolution: 128, dissipation: 0.93, radius: 0.0030, force: 6.0 }, opts);
    this.scene = new THREE.Scene();
    this.cam = new THREE.Camera();
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
    this.scene.add(this.quad);
    this._pending = null;
    this._build();
  }
  _target(w, h) {
    return new THREE.WebGLRenderTarget(w, h, {
      type: THREE.HalfFloatType, format: THREE.RGBAFormat,
      minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter,
      depthBuffer: false, stencilBuffer: false,
      wrapS: THREE.ClampToEdgeWrapping, wrapT: THREE.ClampToEdgeWrapping,
    });
  }
  _build() {
    const W = this.o.resolution;
    const H = Math.max(16, Math.round(W * (window.innerHeight / Math.max(1, window.innerWidth))));
    this.W = W; this.H = H;
    this.texel = new THREE.Vector2(1 / W, 1 / H);
    this.vel = [this._target(W, H), this._target(W, H)];
    this.mAdvect = new THREE.ShaderMaterial({
      uniforms: { uVelocity: { value: null }, uSource: { value: null }, uTexel: { value: this.texel }, uDt: { value: 1 }, uDiss: { value: this.o.dissipation } },
      vertexShader: VERT, depthTest: false, depthWrite: false,
      fragmentShader: `precision highp float; uniform sampler2D uVelocity,uSource; uniform vec2 uTexel; uniform float uDt,uDiss; varying vec2 vUv;
        void main(){ vec2 vel=texture2D(uVelocity,vUv).xy; vec2 c=vUv-uDt*vel*uTexel; gl_FragColor=uDiss*texture2D(uSource,c); }`,
    });
    this.mSplat = new THREE.ShaderMaterial({
      uniforms: { uTarget: { value: null }, uPoint: { value: new THREE.Vector2() }, uForce: { value: new THREE.Vector2() }, uRadius: { value: this.o.radius }, uAspect: { value: W / H } },
      vertexShader: VERT, depthTest: false, depthWrite: false,
      fragmentShader: `precision highp float; uniform sampler2D uTarget; uniform vec2 uPoint,uForce; uniform float uRadius,uAspect; varying vec2 vUv;
        void main(){ vec2 p=vUv-uPoint; p.x*=uAspect; float g=exp(-dot(p,p)/uRadius); vec2 b=texture2D(uTarget,vUv).xy; gl_FragColor=vec4(b+g*uForce,0.0,1.0); }`,
    });
  }
  _blit(mat, target) { this.quad.material = mat; this.renderer.setRenderTarget(target); this.renderer.render(this.scene, this.cam); }
  _swap() { this.vel.reverse(); }
  addForce(ux, uy, fx, fy) { this._pending = { ux, uy, fx, fy }; }
  update(dt) {
    const prev = this.renderer.getRenderTarget();
    this.mAdvect.uniforms.uVelocity.value = this.vel[0].texture;
    this.mAdvect.uniforms.uSource.value = this.vel[0].texture;
    this.mAdvect.uniforms.uDt.value = dt;
    this._blit(this.mAdvect, this.vel[1]); this._swap();
    if (this._pending) {
      const p = this._pending;
      this.mSplat.uniforms.uTarget.value = this.vel[0].texture;
      this.mSplat.uniforms.uPoint.value.set(p.ux, p.uy);
      this.mSplat.uniforms.uForce.value.set(p.fx * this.o.force, p.fy * this.o.force);
      this._blit(this.mSplat, this.vel[1]); this._swap();
      this._pending = null;
    }
    this.renderer.setRenderTarget(prev);
  }
  get texture() { return this.vel[0].texture; }
  resize() { for (const t of this.vel) t.dispose(); this._build(); }
}

if (renderer) {
  if (reduceMotion) {
    // Accesibilidad: sin animación dejamos el sitio como el fallback normal
    // (título del DOM visible, fondo por CSS). No tomamos el título.
    root.setAttribute("data-webgl", "off");
    if (canvas) canvas.remove();
  } else {
    start();
  }
}

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
  renderer.setClearColor(0xffffff, 1);
  renderer.autoClear = false;

  // avisa al sitio que el efecto está activo -> transparenta el título del DOM
  root.setAttribute("data-liquid", "on");

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
    vertexShader: VERT,
    fragmentShader: `precision highp float; uniform sampler2D uTex; uniform float uViewA,uTexA; varying vec2 vUv;
      void main(){ vec2 s=(uViewA>uTexA)?vec2(1.0,uTexA/uViewA):vec2(uViewA/uTexA,1.0); vec2 uv=(vUv-0.5)*s+0.5; gl_FragColor=texture2D(uTex,clamp(uv,0.001,0.999)); }`,
    depthTest: false, depthWrite: false,
  });
  cScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), coverMat));

  function makeRT() {
    const w = Math.floor(window.innerWidth * dpr), h = Math.floor(window.innerHeight * dpr);
    return new THREE.WebGLRenderTarget(w, h, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false, stencilBuffer: false });
  }
  let contentRT = makeRT();

  /* ---------- título: dibujado en canvas, calcando el DOM en vivo -------- */
  const titleEl = document.querySelector(".hero__title");
  const tc = document.createElement("canvas");
  const tctx = tc.getContext("2d");
  const titleTex = new THREE.CanvasTexture(tc);
  titleTex.minFilter = THREE.LinearFilter; titleTex.magFilter = THREE.LinearFilter;
  let lastSig = "";

  function drawTitle(force) {
    if (tc.width !== Math.floor(window.innerWidth * dpr) || tc.height !== Math.floor(window.innerHeight * dpr)) {
      tc.width = Math.floor(window.innerWidth * dpr); tc.height = Math.floor(window.innerHeight * dpr);
      force = true;
    }
    if (!titleEl) { return; }
    const r = titleEl.getBoundingClientRect();
    const fs = parseFloat(getComputedStyle(titleEl).fontSize) || Math.min(window.innerWidth * 0.16, 220);
    const sig = [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(fs)].join(",");
    if (!force && sig === lastSig) return;
    lastSig = sig;

    tctx.clearRect(0, 0, tc.width, tc.height);
    const size = fs * dpr;
    const cxp = (r.left + r.width / 2) * dpr;
    const cyp = (r.top + r.height / 2) * dpr;
    tctx.textBaseline = "middle"; tctx.textAlign = "left";
    try { tctx.letterSpacing = `${-0.03 * size}px`; } catch (e) {}
    tctx.font = `400 ${size}px "Sahlia", Georgia, serif`;
    const wG = tctx.measureText("gular").width;
    try { tctx.letterSpacing = `${-0.015 * size}px`; } catch (e) {}
    tctx.font = `italic 400 ${size}px "Satoshi", system-ui, sans-serif`;
    const wA = tctx.measureText("agency").width;
    const startX = cxp - (wG + wA) / 2;
    // "gular" negro (Sahlia)
    try { tctx.letterSpacing = `${-0.03 * size}px`; } catch (e) {}
    tctx.fillStyle = "#000000";
    tctx.font = `400 ${size}px "Sahlia", Georgia, serif`;
    tctx.fillText("gular", startX, cyp);
    // "agency" itálica (Satoshi) con fundido a la derecha (igual que el CSS)
    try { tctx.letterSpacing = `${-0.015 * size}px`; } catch (e) {}
    tctx.font = `italic 400 ${size}px "Satoshi", system-ui, sans-serif`;
    const gx = startX + wG;
    const grad = tctx.createLinearGradient(gx, 0, gx + wA, 0);
    grad.addColorStop(0, "#000000"); grad.addColorStop(0.2, "#000000"); grad.addColorStop(1, "rgba(0,0,0,0.06)");
    tctx.fillStyle = grad;
    tctx.fillText("agency", gx, cyp);
    titleTex.needsUpdate = true;
  }

  /* ------------------------------ fluido --------------------------------- */
  const fluid = new Fluid(renderer, { resolution: isMobile ? 90 : 128, dissipation: 0.93, radius: 0.0030, force: 6.0 });

  /* ------- composición: fondo distorsionado + título gris (sin deformar) - */
  const composite = new THREE.ShaderMaterial({
    uniforms: {
      tBg: { value: contentRT.texture }, uTitle: { value: titleTex }, uVelocity: { value: fluid.texture },
      uDistort: { value: 0.14 }, uRGB: { value: 0.25 }, uChroma: { value: 0.08 },
    },
    vertexShader: VERT,
    fragmentShader: `
      precision highp float;
      uniform sampler2D tBg, uTitle, uVelocity;
      uniform float uDistort, uRGB, uChroma;
      varying vec2 vUv;
      void main(){
        vec2 v = texture2D(uVelocity, vUv).xy;
        // FONDO: distorsión + aberración
        vec2 off = v * uDistort;
        float br = texture2D(tBg, vUv + off*(1.0+uRGB)).r;
        vec4  bc = texture2D(tBg, vUv + off);
        float bb = texture2D(tBg, vUv + off*(1.0-uRGB)).b;
        vec3 col = vec3(br, bc.g, bb);
        // TÍTULO: aberración en ESCALA DE GRISES, sin desplazar
        vec2 sp = v * uChroma;
        vec4 tR = texture2D(uTitle, vUv + sp);
        vec4 tG = texture2D(uTitle, vUv);
        vec4 tB = texture2D(uTitle, vUv - sp);
        vec3 tcol = col;
        tcol.r = mix(col.r, tR.r, tR.a);
        tcol.g = mix(col.g, tG.g, tG.a);
        tcol.b = mix(col.b, tB.b, tB.a);
        float infl = max(max(tR.a, tG.a), tB.a);
        float lum = dot(tcol, vec3(0.299, 0.587, 0.114));
        col = mix(col, vec3(lum), infl);
        gl_FragColor = vec4(col, 1.0);
      }`,
    depthTest: false, depthWrite: false,
  });
  const sScene = new THREE.Scene();
  const sCam = new THREE.Camera();
  sScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), composite));

  drawTitle(true);

  /* ------------------------------ mouse ---------------------------------- */
  let ux = 0.5, uy = 0.5, pux = 0.5, puy = 0.5, moved = false;
  window.addEventListener("pointermove", (e) => {
    ux = e.clientX / window.innerWidth;
    uy = 1 - e.clientY / window.innerHeight;
    moved = true;
  }, { passive: true });

  window.addEventListener("resize", () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    coverMat.uniforms.uViewA.value = window.innerWidth / window.innerHeight;
    contentRT.dispose(); contentRT = makeRT();
    fluid.resize();
    composite.uniforms.uVelocity.value = fluid.texture;
    drawTitle(true);
  }, { passive: true });

  let running = true, firstDone = false, rafId = 0;
  document.addEventListener("visibilitychange", () => {
    running = !document.hidden;
    if (running) { video.play().catch(() => {}); ensureLoop(); }
    else { video.pause(); if (rafId) cancelAnimationFrame(rafId); rafId = 0; }
  });

  function frame() {
    drawTitle(false); // sigue al título real (fitHero, scroll, resize) sin costo si no cambió
    // 1) fondo (video) -> contentRT. Hasta que el video cargue: BLANCO
    //    (así el título negro siempre se ve; nunca pantalla negra).
    renderer.setRenderTarget(contentRT);
    renderer.setClearColor(0xffffff, 1);
    renderer.clear();
    if (video.readyState >= 2) renderer.render(cScene, cCam);
    // 2) mouse -> fluido
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
    if (!firstDone) { firstDone = true; window.dispatchEvent(new Event("space:ready")); }
  }
  // Una SOLA cadena de animación. Antes, cada vez que la pestaña se volvía visible se
  // llamaba a loop() y se ACUMULABAN loops en paralelo (se multiplicaba el trabajo de GPU
  // y el fondo terminaba trabándose/congelándose). Ahora se garantiza una sola cadena.
  function loop() {
    rafId = 0;
    if (!running) return;
    try { frame(); } catch (e) { /* un error puntual NO debe dejar el fondo congelado */ }
    rafId = requestAnimationFrame(loop);
  }
  function ensureLoop() { if (running && !rafId) rafId = requestAnimationFrame(loop); }

  ensureLoop();
}
