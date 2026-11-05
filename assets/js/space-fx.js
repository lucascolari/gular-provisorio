/* =========================================================================
   Fondo INTERACTIVO y GENERATIVO con las imágenes del video.
   - Usa recortes reales de las moléculas del video (sprites) + una capa de
     polvo fino. Fondo blanco, partículas oscuras con leve color.
   - El movimiento NO está grabado: cada partícula flota con oscilaciones
     propias no periódicas (frecuencias incon­mensurables) + rotación, así
     nunca se repite ni se siente un video en loop.
   - Interacción: parallax con el mouse + viaje por scroll (como el fondo
     anterior de gular).
   ========================================================================= */
import * as THREE from "three";

const root = document.documentElement;
const canvas = document.getElementById("space");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const MOLS = [
  "assets/media/fx/mol1.png", "assets/media/fx/mol2.png", "assets/media/fx/mol3.png",
  "assets/media/fx/mol4.png", "assets/media/fx/mol5.png",
];

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
  const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2);
  renderer.setPixelRatio(dpr);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0); // transparente: el blanco lo pone el body

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 500);
  camera.position.z = 1;

  const materials = []; // materiales a actualizar uTime cada frame

  const SPREAD = 95, DEPTH = 260;
  const CL = 11;
  const clusters = [];
  for (let c = 0; c < CL; c++) clusters.push([(Math.random()-0.5)*SPREAD*1.05, (Math.random()-0.5)*SPREAD*1.05, -Math.random()*DEPTH]);
  const g = (s) => (Math.random()+Math.random()+Math.random()-1.5) * s;
  function place(clustered, zMin, zMax) {
    if (clustered && Math.random() < 0.6) {
      const c = clusters[(Math.random()*CL)|0];
      return [c[0]+g(12), c[1]+g(12), Math.max(zMin, Math.min(zMax, c[2]+g(26)))];
    }
    return [(Math.random()-0.5)*SPREAD, (Math.random()-0.5)*SPREAD, zMin + Math.random()*(zMax-zMin)];
  }

  const uniforms = () => ({ uTime:{value:0}, uDpr:{value:dpr}, uH:{value:window.innerHeight}, uSway:{value:1.3} });
  const SWAY_VS = `
    vec3 swayPos(vec3 p, vec3 ph, float t, float amp){
      return p + vec3(
        sin(t*0.10 + ph.x) + 0.55*sin(t*0.21 + ph.y),
        cos(t*0.08 + ph.y) + 0.55*sin(t*0.17 + ph.z),
        sin(t*0.06 + ph.z)
      ) * amp;
    }`;

  /* ---------------- Capa de polvo (procedural) ---------------------------- */
  const PALETTE = [[0.12,0.46,0.44],[0.52,0.33,0.44],[0.55,0.46,0.22],[0.26,0.37,0.55],[0.30,0.47,0.27]];
  const DUST = isMobile ? 3800 : 8200;
  {
    const pos = new Float32Array(DUST*3), siz = new Float32Array(DUST), ph = new Float32Array(DUST*3), col = new Float32Array(DUST*3);
    for (let i=0;i<DUST;i++){
      const p = place(true, -DEPTH, -4);
      pos[i*3]=p[0]; pos[i*3+1]=p[1]; pos[i*3+2]=p[2];
      siz[i] = Math.pow(Math.random(),2)*2.2 + 0.7;
      ph[i*3]=Math.random()*6.28; ph[i*3+1]=Math.random()*6.28; ph[i*3+2]=Math.random()*6.28;
      if (Math.random() < 0.14) { const c=PALETTE[(Math.random()*PALETTE.length)|0], k=0.6+Math.random()*0.4; col[i*3]=c[0]*k; col[i*3+1]=c[1]*k; col[i*3+2]=c[2]*k; }
      else { const b=0.03+Math.random()*0.07; col[i*3]=b; col[i*3+1]=b; col[i*3+2]=b+0.01; }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos,3));
    geo.setAttribute("aSize", new THREE.BufferAttribute(siz,1));
    geo.setAttribute("aPh", new THREE.BufferAttribute(ph,3));
    geo.setAttribute("aColor", new THREE.BufferAttribute(col,3));
    const mat = new THREE.ShaderMaterial({
      transparent:true, depthWrite:false, depthTest:false, blending:THREE.NormalBlending,
      uniforms: uniforms(),
      vertexShader: `
        attribute float aSize; attribute vec3 aPh; attribute vec3 aColor;
        uniform float uTime,uDpr,uH,uSway; varying vec3 vColor; varying float vTw;
        ${SWAY_VS}
        void main(){
          vTw = 0.6 + 0.4*sin(uTime*1.1 + aPh.x); vColor = aColor;
          vec3 p = swayPos(position, aPh, uTime, uSway);
          vec4 mv = modelViewMatrix*vec4(p,1.0);
          gl_Position = projectionMatrix*mv;
          gl_PointSize = aSize*uDpr*(uH*0.085)/max(-mv.z,0.001);
        }`,
      fragmentShader: `
        precision mediump float; varying vec3 vColor; varying float vTw;
        void main(){
          float d=length(gl_PointCoord-0.5)*2.0;
          float a=pow(max(0.0,1.0-d),1.5)*vTw;
          if(a<0.01)discard;
          gl_FragColor=vec4(vColor,a*0.9);
        }`,
    });
    const pts = new THREE.Points(geo, mat); pts.frustumCulled=false; scene.add(pts);
    materials.push(mat);
  }

  /* ---------------- Moléculas (sprites reales del video) ------------------ */
  const PER = isMobile ? 12 : 20;
  const loader = new THREE.TextureLoader();
  MOLS.forEach((url, idx) => {
    const tex = loader.load(url);
    tex.minFilter = THREE.LinearFilter; tex.magFilter = THREE.LinearFilter;
    tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping; tex.generateMipmaps = false;
    const N = PER;
    const pos = new Float32Array(N*3), siz = new Float32Array(N), ph = new Float32Array(N*3), rot = new Float32Array(N);
    for (let i=0;i<N;i++){
      const p = place(true, -150, -28);
      pos[i*3]=p[0]; pos[i*3+1]=p[1]; pos[i*3+2]=p[2];
      siz[i] = 42 + Math.random()*46;           // moléculas: visibles (tamaño del video)
      ph[i*3]=Math.random()*6.28; ph[i*3+1]=Math.random()*6.28; ph[i*3+2]=Math.random()*6.28;
      rot[i] = (Math.random()-0.5)*0.12;        // rotación lenta propia
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos,3));
    geo.setAttribute("aSize", new THREE.BufferAttribute(siz,1));
    geo.setAttribute("aPh", new THREE.BufferAttribute(ph,3));
    geo.setAttribute("aRot", new THREE.BufferAttribute(rot,1));
    const u = uniforms(); u.uSway.value = 1.7; u.uTex = { value: tex };
    const mat = new THREE.ShaderMaterial({
      transparent:true, depthWrite:false, depthTest:false, blending:THREE.NormalBlending,
      uniforms: u,
      vertexShader: `
        attribute float aSize; attribute vec3 aPh; attribute float aRot;
        uniform float uTime,uDpr,uH,uSway; varying float vAng; varying float vFade;
        ${SWAY_VS}
        void main(){
          vAng = uTime*aRot + aPh.x;
          vFade = 0.82 + 0.18*sin(uTime*0.6 + aPh.y);
          vec3 p = swayPos(position, aPh, uTime, uSway);
          vec4 mv = modelViewMatrix*vec4(p,1.0);
          gl_Position = projectionMatrix*mv;
          gl_PointSize = aSize*uDpr*(uH*0.085)/max(-mv.z,0.001);
        }`,
      fragmentShader: `
        precision mediump float; uniform sampler2D uTex; varying float vAng; varying float vFade;
        void main(){
          vec2 uv = gl_PointCoord-0.5;
          float c=cos(vAng), s=sin(vAng);
          uv = mat2(c,-s,s,c)*uv + 0.5;
          vec4 t = texture2D(uTex, uv);
          if(t.a<0.02)discard;
          gl_FragColor = vec4(t.rgb, t.a*vFade);
        }`,
    });
    const pts = new THREE.Points(geo, mat); pts.frustumCulled=false; pts.renderOrder=2; scene.add(pts);
    materials.push(mat);
  });

  /* ---------------- Interacción + loop ----------------------------------- */
  let scrollP=0, tX=0, tY=0, cX=0, cY=0;
  function onScroll(){ const m=document.documentElement.scrollHeight-window.innerHeight; scrollP = m>0?window.scrollY/m:0; }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive:true });
  window.addEventListener("pointermove", (e)=>{ tX=(e.clientX/window.innerWidth-0.5)*2; tY=(e.clientY/window.innerHeight-0.5)*2; }, { passive:true });
  window.addEventListener("resize", ()=>{ camera.aspect=window.innerWidth/window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth,window.innerHeight); materials.forEach(m=>{ if(m.uniforms.uH) m.uniforms.uH.value=window.innerHeight; }); }, { passive:true });

  const clock = new THREE.Clock();
  let running=true, first=false;
  document.addEventListener("visibilitychange", ()=>{ running=!document.hidden; if(running){ clock.start(); loop(); } });

  function loop(){
    if(!running) return;
    const t = clock.getElapsedTime();
    cX += (tX-cX)*0.045; cY += (tY-cY)*0.045;
    camera.position.x = cX*1.5;
    camera.position.y = -cY*1.1;
    camera.position.z = 1 - scrollP*150;
    camera.lookAt(0,0,camera.position.z-10);
    for (const m of materials) m.uniforms.uTime.value = t;
    renderer.render(scene, camera);
    if(!first){ first=true; window.dispatchEvent(new Event("space:ready")); }
    requestAnimationFrame(loop);
  }
  loop();
}
