/* =========================================================================
   FLUID CORE — simulación de fluido en GPU (estilo unseen.co), con Three.js.
   El mouse inyecta fuerza según su velocidad; devuelve una textura de
   velocidad que después se usa como mapa de distorsión del contenido.

   Modo liviano  -> iterations: 0  (solo advección + splat + disipación)
   Modo "tal cual" -> iterations: 2..8 (resuelve presión: swirl tipo Unseen)
   ========================================================================= */
import * as THREE from "three";

const VERT = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

// Shader de composición (reutilizado por las páginas): desplaza el contenido
// según la velocidad del fluido, con leve separación RGB (aberración).
export const COMPOSITE_FRAG = `
  precision highp float;
  uniform sampler2D tContent;
  uniform sampler2D uVelocity;
  uniform float uDistort;
  uniform float uRGB;
  varying vec2 vUv;
  void main(){
    vec2 v = texture2D(uVelocity, vUv).xy;
    vec2 off = v * uDistort;
    float r = texture2D(tContent, vUv + off * (1.0 + uRGB)).r;
    vec4 c  = texture2D(tContent, vUv + off);
    float b = texture2D(tContent, vUv + off * (1.0 - uRGB)).b;
    gl_FragColor = vec4(r, c.g, b, c.a);
  }
`;
export const COMPOSITE_VERT = VERT;

export class Fluid {
  constructor(renderer, opts = {}) {
    this.renderer = renderer;
    this.o = Object.assign(
      { resolution: 128, iterations: 3, dissipation: 0.94, radius: 0.0022, force: 1.0, curl: 0.0 },
      opts
    );
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
    this.div = this._target(W, H);
    this.prs = [this._target(W, H), this._target(W, H)];

    const U = (o) => ({ uniforms: o, vertexShader: VERT, depthTest: false, depthWrite: false });

    this.mAdvect = new THREE.ShaderMaterial(U({
      uVelocity: { value: null }, uSource: { value: null },
      uTexel: { value: this.texel }, uDt: { value: 1.0 }, uDiss: { value: this.o.dissipation },
    }));
    this.mAdvect.fragmentShader = `
      precision highp float;
      uniform sampler2D uVelocity, uSource; uniform vec2 uTexel; uniform float uDt, uDiss;
      varying vec2 vUv;
      void main(){
        vec2 vel = texture2D(uVelocity, vUv).xy;
        vec2 coord = vUv - uDt * vel * uTexel;
        gl_FragColor = uDiss * texture2D(uSource, coord);
      }`;

    this.mSplat = new THREE.ShaderMaterial(U({
      uTarget: { value: null }, uPoint: { value: new THREE.Vector2() },
      uForce: { value: new THREE.Vector2() }, uRadius: { value: this.o.radius },
      uAspect: { value: W / H },
    }));
    this.mSplat.fragmentShader = `
      precision highp float;
      uniform sampler2D uTarget; uniform vec2 uPoint, uForce; uniform float uRadius, uAspect;
      varying vec2 vUv;
      void main(){
        vec2 p = vUv - uPoint; p.x *= uAspect;
        float g = exp(-dot(p, p) / uRadius);
        vec2 base = texture2D(uTarget, vUv).xy;
        gl_FragColor = vec4(base + g * uForce, 0.0, 1.0);
      }`;

    this.mDiv = new THREE.ShaderMaterial(U({ uVelocity: { value: null }, uTexel: { value: this.texel } }));
    this.mDiv.fragmentShader = `
      precision highp float;
      uniform sampler2D uVelocity; uniform vec2 uTexel; varying vec2 vUv;
      void main(){
        float L = texture2D(uVelocity, vUv - vec2(uTexel.x,0.0)).x;
        float R = texture2D(uVelocity, vUv + vec2(uTexel.x,0.0)).x;
        float B = texture2D(uVelocity, vUv - vec2(0.0,uTexel.y)).y;
        float T = texture2D(uVelocity, vUv + vec2(0.0,uTexel.y)).y;
        gl_FragColor = vec4(0.5*(R-L+T-B), 0.0, 0.0, 1.0);
      }`;

    this.mPrs = new THREE.ShaderMaterial(U({
      uPressure: { value: null }, uDivergence: { value: null }, uTexel: { value: this.texel },
    }));
    this.mPrs.fragmentShader = `
      precision highp float;
      uniform sampler2D uPressure, uDivergence; uniform vec2 uTexel; varying vec2 vUv;
      void main(){
        float L = texture2D(uPressure, vUv - vec2(uTexel.x,0.0)).x;
        float R = texture2D(uPressure, vUv + vec2(uTexel.x,0.0)).x;
        float B = texture2D(uPressure, vUv - vec2(0.0,uTexel.y)).x;
        float T = texture2D(uPressure, vUv + vec2(0.0,uTexel.y)).x;
        float d = texture2D(uDivergence, vUv).x;
        gl_FragColor = vec4((L+R+B+T - d) * 0.25, 0.0, 0.0, 1.0);
      }`;

    this.mGrad = new THREE.ShaderMaterial(U({
      uPressure: { value: null }, uVelocity: { value: null }, uTexel: { value: this.texel },
    }));
    this.mGrad.fragmentShader = `
      precision highp float;
      uniform sampler2D uPressure, uVelocity; uniform vec2 uTexel; varying vec2 vUv;
      void main(){
        float L = texture2D(uPressure, vUv - vec2(uTexel.x,0.0)).x;
        float R = texture2D(uPressure, vUv + vec2(uTexel.x,0.0)).x;
        float B = texture2D(uPressure, vUv - vec2(0.0,uTexel.y)).x;
        float T = texture2D(uPressure, vUv + vec2(0.0,uTexel.y)).x;
        vec2 vel = texture2D(uVelocity, vUv).xy;
        vel -= 0.5 * vec2(R-L, T-B);
        gl_FragColor = vec4(vel, 0.0, 1.0);
      }`;
  }

  _blit(mat, target) {
    this.quad.material = mat;
    this.renderer.setRenderTarget(target);
    this.renderer.render(this.scene, this.cam);
  }
  _swapVel() { this.vel.reverse(); }
  _swapPrs() { this.prs.reverse(); }

  // uv en 0..1, force en unidades de pantalla (delta del mouse * fuerza)
  addForce(ux, uy, fx, fy) { this._pending = { ux, uy, fx, fy }; }

  update(dt) {
    const r = this.renderer;
    const prevTarget = r.getRenderTarget();

    // 1) advección de la velocidad
    this.mAdvect.uniforms.uVelocity.value = this.vel[0].texture;
    this.mAdvect.uniforms.uSource.value = this.vel[0].texture;
    this.mAdvect.uniforms.uDt.value = dt;
    this._blit(this.mAdvect, this.vel[1]); this._swapVel();

    // 2) splat del mouse
    if (this._pending) {
      const p = this._pending;
      this.mSplat.uniforms.uTarget.value = this.vel[0].texture;
      this.mSplat.uniforms.uPoint.value.set(p.ux, p.uy);
      this.mSplat.uniforms.uForce.value.set(p.fx * this.o.force, p.fy * this.o.force);
      this._blit(this.mSplat, this.vel[1]); this._swapVel();
      this._pending = null;
    }

    // 3) proyección (presión) — solo en modo "tal cual"
    if (this.o.iterations > 0) {
      this.mDiv.uniforms.uVelocity.value = this.vel[0].texture;
      this._blit(this.mDiv, this.div);
      for (let i = 0; i < this.o.iterations; i++) {
        this.mPrs.uniforms.uPressure.value = this.prs[0].texture;
        this.mPrs.uniforms.uDivergence.value = this.div.texture;
        this._blit(this.mPrs, this.prs[1]); this._swapPrs();
      }
      this.mGrad.uniforms.uPressure.value = this.prs[0].texture;
      this.mGrad.uniforms.uVelocity.value = this.vel[0].texture;
      this._blit(this.mGrad, this.vel[1]); this._swapVel();
    }

    r.setRenderTarget(prevTarget);
  }

  get texture() { return this.vel[0].texture; }

  resize() {
    for (const t of this.vel) t.dispose();
    for (const t of this.prs) t.dispose();
    this.div.dispose();
    this._build();
  }
}
