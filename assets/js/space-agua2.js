/* =========================================================================
   Efecto AGUA sobre TODA la página (como unseen.co).
   - Toma una "foto" del contenido (html2canvas: título, texto y fondo),
     la mete como textura en WebGL y la distorsiona con un campo de fluido
     reactivo al mouse. Así TODO se ondula como agua, texto incluido.
   - El contenido real se oculta y se muestra solo la versión distorsionada.
   ========================================================================= */
import * as THREE from "three";

const root = document.documentElement;
const stage = document.getElementById("stage");
const oldCanvas = document.getElementById("space");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function fail(why) {
  console.warn("[agua2] fail:", why);
  root.setAttribute("data-webgl", "off");
  if (stage) stage.style.visibility = "visible";
}

async function start() {
  if (reduceMotion) return fail("reduceMotion");
  if (!window.html2canvas) return fail("no html2canvas");
  if (!stage) return fail("no stage");

  // Sacamos el canvas de WebGL del DOM para que html2canvas no le tome un
  // contexto 2D (si no, Three no puede crear el contexto WebGL después).
  if (oldCanvas) oldCanvas.remove();

  try { await document.fonts.ready; } catch (e) {}
  await new Promise(r => setTimeout(r, 120));

  let shot;
  try {
    shot = await window.html2canvas(stage, {
      backgroundColor: "#ffffff",
      scale: Math.min(window.devicePixelRatio || 1, 2),
      width: window.innerWidth, height: window.innerHeight,
      windowWidth: window.innerWidth, windowHeight: window.innerHeight,
      logging: false, useCORS: true,
    });
  } catch (e) { return fail("html2canvas: " + e); }

  stage.style.visibility = "hidden"; // solo se ve la versión distorsionada
  init(shot);
}

function init(shotCanvas) {
  // canvas nuevo y limpio para WebGL
  const glc = document.createElement("canvas");
  glc.className = "space-canvas"; glc.setAttribute("aria-hidden", "true");
  document.body.insertBefore(glc, document.body.firstChild);

  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas: glc, antialias: false, alpha: false, powerPreference: "high-performance" }); }
  catch (e) { return fail("renderer ctor: " + e); }
  if (!renderer.getContext()) return fail("no gl context");

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  renderer.setPixelRatio(dpr);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0xffffff, 1);

  const tex = new THREE.CanvasTexture(shotCanvas);
  tex.minFilter = THREE.LinearFilter; tex.magFilter = THREE.LinearFilter; tex.generateMipmaps = false;

  function rtSize() { return [Math.max(2, Math.round(window.innerWidth * 0.5)), Math.max(2, Math.round(window.innerHeight * 0.5))]; }
  let [sw, sh] = rtSize();
  const rtOpts = { type: THREE.UnsignedByteType, format: THREE.RGBAFormat, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false, stencilBuffer: false, wrapS: THREE.ClampToEdgeWrapping, wrapT: THREE.ClampToEdgeWrapping };
  let rtA = new THREE.WebGLRenderTarget(sw, sh, rtOpts);
  let rtB = new THREE.WebGLRenderTarget(sw, sh, rtOpts);

  const fsScene = new THREE.Scene();
  const fsCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), null);
  fsScene.add(quad);
  const VS = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position,1.0); }`;

  const simMat = new THREE.ShaderMaterial({
    uniforms: {
      uPrev:{value:null}, uTexel:{value:new THREE.Vector2(1/sw,1/sh)},
      uMouse:{value:new THREE.Vector2(-9,-9)}, uVel:{value:new THREE.Vector2(0,0)},
      uAspect:{value:window.innerWidth/window.innerHeight},
      uDecay:{value:0.958}, uRadius:{value:0.08}, uStrength:{value:7.5}, uDiffuse:{value:0.16},
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
        disp = mix(disp, n, uDiffuse);
        disp *= uDecay;
        vec2 d = (vUv - uMouse) * vec2(uAspect, 1.0);
        float infl = exp(-dot(d,d)/(uRadius*uRadius));
        disp += uVel * infl * uStrength;
        disp = clamp(disp, -1.0, 1.0);
        gl_FragColor = vec4(disp*0.5 + 0.5, 0.0, 1.0);
      }`,
  });

  const dispMat = new THREE.ShaderMaterial({
    uniforms: { uTex:{value:tex}, uDisp:{value:null}, uAmp:{value:0.16} },
    vertexShader: VS,
    fragmentShader: `
      precision highp float;
      uniform sampler2D uTex, uDisp; uniform float uAmp;
      varying vec2 vUv;
      void main(){
        vec2 disp = (texture2D(uDisp, vUv).xy - 0.5) * 2.0;
        vec2 uv = clamp(vUv + disp * uAmp, 0.0, 1.0);
        gl_FragColor = texture2D(uTex, uv);
      }`,
  });

  let mx=-9, my=-9, pmx=-9, pmy=-9, vx=0, vy=0, moved=false;
  window.addEventListener("pointermove", (e)=>{
    const nx = e.clientX/window.innerWidth, ny = 1.0 - e.clientY/window.innerHeight;
    if (pmx < -1) { pmx = nx; pmy = ny; }
    mx = nx; my = ny; moved = true;
  }, { passive:true });

  let running=true, first=false;
  document.addEventListener("visibilitychange", ()=>{ running=!document.hidden; if(running) loop(); });

  function loop(){
    if(!running) return;
    if (moved) { vx = (mx-pmx); vy = (my-pmy); pmx = mx; pmy = my; moved = false; }
    else { vx *= 0.82; vy *= 0.82; }
    simMat.uniforms.uMouse.value.set(mx, my);
    simMat.uniforms.uVel.value.set(vx, vy);

    quad.material = simMat;
    simMat.uniforms.uPrev.value = rtA.texture;
    renderer.setRenderTarget(rtB);
    renderer.render(fsScene, fsCam);
    const tmp = rtA; rtA = rtB; rtB = tmp;

    quad.material = dispMat;
    dispMat.uniforms.uDisp.value = rtA.texture;
    renderer.setRenderTarget(null);
    renderer.render(fsScene, fsCam);

    if(!first){ first=true; window.dispatchEvent(new Event("space:ready")); }
    requestAnimationFrame(loop);
  }
  loop();
}

start();
