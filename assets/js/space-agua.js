/* =========================================================================
   Efecto AGUA / fluido reactivo al mouse (estilo unseen.co).
   - Un campo de desplazamiento (ping-pong FBO) acumula el "arrastre" del
     mouse: donde movés el cursor, el fondo fluye en esa dirección y se va
     calmando como agua (decae + difunde).
   - Se aplica sobre un fondo (acá: el video de partículas) pero sirve para
     cualquier textura. El contenido del DOM queda nítido por encima.
   ========================================================================= */
import * as THREE from "three";

const root = document.documentElement;
const canvas = document.getElementById("space");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const BG_SRC = "assets/media/video/posiblefondogular-neg.mp4";
const TEX_A = 1280 / 720;

function fail() { root.setAttribute("data-webgl", "off"); if (canvas) canvas.remove(); }

if (reduceMotion) fail();
else init();

function init() {
  // --- fondo: video ---
  const video = document.createElement("video");
  video.src = BG_SRC; video.loop = true; video.muted = true; video.autoplay = true;
  video.playsInline = true; video.setAttribute("playsinline", "");
  const pl = video.play(); if (pl && pl.catch) pl.catch(() => {});

  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: "high-performance" }); }
  catch (e) { fail(); return; }
  if (!renderer.getContext()) { fail(); return; }

  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2);
  renderer.setPixelRatio(dpr);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0xffffff, 1);

  const tex = new THREE.VideoTexture(video);
  tex.minFilter = THREE.LinearFilter; tex.magFilter = THREE.LinearFilter; tex.generateMipmaps = false;

  // --- render targets (campo de desplazamiento, media resolución) ---
  const simScale = 0.5;
  function rtSize() { return [Math.max(2, Math.round(window.innerWidth * simScale)), Math.max(2, Math.round(window.innerHeight * simScale))]; }
  let [sw, sh] = rtSize();
  const rtOpts = { type: THREE.UnsignedByteType, format: THREE.RGBAFormat, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false, stencilBuffer: false, wrapS: THREE.ClampToEdgeWrapping, wrapT: THREE.ClampToEdgeWrapping };
  let rtA = new THREE.WebGLRenderTarget(sw, sh, rtOpts);
  let rtB = new THREE.WebGLRenderTarget(sw, sh, rtOpts);

  const fsScene = new THREE.Scene();
  const fsCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), null);
  fsScene.add(quad);

  const VS = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position,1.0); }`;

  // Simulación: decae + difunde + inyecta el arrastre del mouse
  const simMat = new THREE.ShaderMaterial({
    uniforms: {
      uPrev:{value:null}, uTexel:{value:new THREE.Vector2(1/sw,1/sh)},
      uMouse:{value:new THREE.Vector2(-9,-9)}, uVel:{value:new THREE.Vector2(0,0)},
      uAspect:{value:window.innerWidth/window.innerHeight},
      uDecay:{value:0.955}, uRadius:{value:0.075}, uStrength:{value:7.0}, uDiffuse:{value:0.16},
    },
    vertexShader: VS,
    fragmentShader: `
      precision highp float;
      uniform sampler2D uPrev; uniform vec2 uTexel, uMouse, uVel;
      uniform float uAspect, uDecay, uRadius, uStrength, uDiffuse;
      varying vec2 vUv;
      vec2 dec(vec2 uv){ return (texture2D(uPrev, uv).xy - 0.5) * 2.0; }
      void main(){
        vec2 disp = dec(vUv);
        vec2 n = (dec(vUv+vec2(uTexel.x,0.)) + dec(vUv-vec2(uTexel.x,0.))
                + dec(vUv+vec2(0.,uTexel.y)) + dec(vUv-vec2(0.,uTexel.y))) * 0.25;
        disp = mix(disp, n, uDiffuse);     // difusión (se esparce como agua)
        disp *= uDecay;                    // se calma con el tiempo
        vec2 d = (vUv - uMouse) * vec2(uAspect, 1.0);
        float infl = exp(-dot(d,d)/(uRadius*uRadius));
        disp += uVel * infl * uStrength;   // arrastre del mouse
        disp = clamp(disp, -1.0, 1.0);
        gl_FragColor = vec4(disp*0.5 + 0.5, 0.0, 1.0);
      }`,
  });

  // Display: muestra el video desplazado por el campo
  const dispMat = new THREE.ShaderMaterial({
    uniforms: {
      uVideo:{value:tex}, uDisp:{value:null},
      uViewA:{value:window.innerWidth/window.innerHeight}, uTexA:{value:TEX_A}, uAmp:{value:0.16},
    },
    vertexShader: VS,
    fragmentShader: `
      precision highp float;
      uniform sampler2D uVideo, uDisp; uniform float uViewA, uTexA, uAmp;
      varying vec2 vUv;
      void main(){
        vec2 disp = (texture2D(uDisp, vUv).xy - 0.5) * 2.0;
        vec2 scale = (uViewA > uTexA) ? vec2(1.0, uTexA/uViewA) : vec2(uViewA/uTexA, 1.0);
        vec2 uv = (vUv - 0.5) * scale * 0.97 + 0.5;
        uv += disp * uAmp;
        gl_FragColor = texture2D(uVideo, clamp(uv, 0.001, 0.999));
      }`,
  });

  // --- mouse: posición + velocidad (arrastre) ---
  let mx=-9, my=-9, pmx=-9, pmy=-9, vx=0, vy=0, moved=false;
  window.addEventListener("pointermove", (e)=>{
    const nx = e.clientX/window.innerWidth, ny = 1.0 - e.clientY/window.innerHeight;
    if (pmx < -1) { pmx = nx; pmy = ny; }
    mx = nx; my = ny; moved = true;
  }, { passive:true });

  window.addEventListener("resize", ()=>{
    renderer.setSize(window.innerWidth, window.innerHeight);
    [sw, sh] = rtSize();
    rtA.setSize(sw, sh); rtB.setSize(sw, sh);
    simMat.uniforms.uTexel.value.set(1/sw, 1/sh);
    simMat.uniforms.uAspect.value = window.innerWidth/window.innerHeight;
    dispMat.uniforms.uViewA.value = window.innerWidth/window.innerHeight;
  }, { passive:true });

  let running=true, first=false;
  document.addEventListener("visibilitychange", ()=>{ running=!document.hidden; if(running){ video.play().catch(()=>{}); loop(); } else video.pause(); });

  function loop(){
    if(!running) return;
    // velocidad del mouse (con suavizado y decaimiento si se queda quieto)
    if (moved) { vx = (mx-pmx); vy = (my-pmy); pmx = mx; pmy = my; moved = false; }
    else { vx *= 0.82; vy *= 0.82; }
    const sp = Math.min(1, Math.hypot(vx,vy)*8.0);
    simMat.uniforms.uMouse.value.set(mx, my);
    simMat.uniforms.uVel.value.set(vx, vy);

    // paso de simulación: rtA -> rtB
    quad.material = simMat;
    simMat.uniforms.uPrev.value = rtA.texture;
    renderer.setRenderTarget(rtB);
    renderer.render(fsScene, fsCam);
    const tmp = rtA; rtA = rtB; rtB = tmp;

    // display a pantalla
    quad.material = dispMat;
    dispMat.uniforms.uDisp.value = rtA.texture;
    renderer.setRenderTarget(null);
    renderer.render(fsScene, fsCam);

    if(!first){ first=true; window.dispatchEvent(new Event("space:ready")); }
    requestAnimationFrame(loop);
  }
  loop();
}
