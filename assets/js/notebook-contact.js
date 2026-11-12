/* =========================================================================
   NOTEBOOK de contacto — versión EMBEBIDA en una sección del sitio.
   Igual que el test C pero dentro de un contenedor (#nbStage): se dimensiona
   a la sección, el mouse/overlay son relativos al contenedor y pausa el
   render cuando la sección no está en pantalla.
   ========================================================================= */
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { createScreen } from "./notebook-core.js";

const stage = document.getElementById("nbStage");
const host = document.getElementById("nbCanvas");
const overlay = document.getElementById("nbOverlay");
const hint = stage ? stage.querySelector(".nb-hint") : null;
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const screen = createScreen();
overlay.appendChild(screen);

const sizeW = () => stage.clientWidth || 1;
const sizeH = () => stage.clientHeight || 1;

/* ------------------------------------------------------------- escena */
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
} catch (e) {
  // Sin WebGL: mostramos el formulario directo en la sección (fallback accesible).
  overlay.style.left = "0"; overlay.style.top = "0"; overlay.style.width = "100%"; overlay.style.height = "100%";
  overlay.classList.add("is-on");
  screen.dataset.stage = "form";
  if (hint) hint.remove();
  throw new Error("WebGL no disponible: formulario en modo simple.");
}
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(sizeW(), sizeH());
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
host.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(30, sizeW() / sizeH(), 0.1, 100);

scene.add(new THREE.HemisphereLight(0xffffff, 0xd7d7de, 0.8));
const key = new THREE.DirectionalLight(0xffffff, 1.5); key.position.set(3.2, 5.0, 3.8); scene.add(key);
const rim = new THREE.DirectionalLight(0xffffff, 1.25); rim.position.set(-2.4, 4.2, -3.6); scene.add(rim);
const fill = new THREE.DirectionalLight(0xffffff, 0.45); fill.position.set(-3.2, 1.2, 3.0); scene.add(fill);

renderer.setClearColor(0x000000, 0); // fondo del canvas 100% transparente (la notebook flota)
(function groundShadow() {
  const c = document.createElement("canvas"); c.width = c.height = 256;
  const g = c.getContext("2d");
  const rad = g.createRadialGradient(128, 128, 6, 128, 128, 120);
  rad.addColorStop(0, "rgba(0,0,0,.26)"); rad.addColorStop(0.55, "rgba(0,0,0,.10)"); rad.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = rad; g.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(c);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 2.4),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.position.set(0, -0.02, 0.2); m.scale.set(1, 1, 1);
  scene.add(m);
})();

/* --------------------------------------------------------- la notebook */
const W = 3.0, D = 2.1, T = 0.10;
const Hl = 2.04, TL = 0.07;
const SW = 2.52, SH = 1.74;

const bodyMat = new THREE.MeshStandardMaterial({ color: 0x0c0c0e, metalness: 0.5, roughness: 0.46 });
const bezelMat = new THREE.MeshStandardMaterial({ color: 0x040405, metalness: 0.15, roughness: 0.75 });

const laptop = new THREE.Group();
scene.add(laptop);

const base = new THREE.Mesh(new RoundedBoxGeometry(W, T, D, 6, 0.045), bodyMat);
base.position.y = T / 2; laptop.add(base);

/* teclado realista (textura dibujada con teclas + letras) */
function roundRect(g, x, y, w, h, r) {
  r = Math.min(r, h / 2, w / 2);
  g.beginPath(); g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}
function drawKey(g, x, y, w, h, label) {
  const rr = Math.min(9, h * 0.26);
  const grd = g.createLinearGradient(0, y, 0, y + h);
  grd.addColorStop(0, "#212125"); grd.addColorStop(1, "#141417");
  g.fillStyle = grd; roundRect(g, x, y, w, h, rr); g.fill();
  g.strokeStyle = "rgba(0,0,0,.55)"; g.lineWidth = 1; roundRect(g, x + 0.5, y + 0.5, w - 1, h - 1, rr); g.stroke();
  g.fillStyle = "rgba(255,255,255,.05)"; roundRect(g, x + 2, y + 2, w - 4, h * 0.38, rr * 0.7); g.fill();
  const t = label.trim();
  if (t) {
    g.fillStyle = "#cdcdd4";
    const fs = t.length > 2 ? Math.min(h * 0.32, 13) : Math.min(h * 0.46, 24);
    g.font = `600 ${fs}px Arial, Helvetica, sans-serif`;
    g.textAlign = "center"; g.textBaseline = "middle";
    g.fillText(t, x + w / 2, y + h / 2 + 1);
  }
}
function makeKeyboardTexture() {
  const cv = document.createElement("canvas"); cv.width = 1024; cv.height = 648;
  const g = cv.getContext("2d");
  g.fillStyle = "#0c0c0e"; g.fillRect(0, 0, cv.width, cv.height);
  const gap = 8, KX = 48, KW = cv.width - KX * 2, kbTop = 26, kbBottom = 468;
  const rows = [
    [0.6, ["esc", "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12", "⏻"].map((l) => [l, 1])],
    [1, [["`", 1], ["1", 1], ["2", 1], ["3", 1], ["4", 1], ["5", 1], ["6", 1], ["7", 1], ["8", 1], ["9", 1], ["0", 1], ["-", 1], ["=", 1], ["⌫", 1.6]]],
    [1, [["⇥", 1.5], ["Q", 1], ["W", 1], ["E", 1], ["R", 1], ["T", 1], ["Y", 1], ["U", 1], ["I", 1], ["O", 1], ["P", 1], ["[", 1], ["]", 1], ["\\", 1]]],
    [1, [["⇪", 1.8], ["A", 1], ["S", 1], ["D", 1], ["F", 1], ["G", 1], ["H", 1], ["J", 1], ["K", 1], ["L", 1], [";", 1], ["'", 1], ["⏎", 1.9]]],
    [1, [["⇧", 2.3], ["Z", 1], ["X", 1], ["C", 1], ["V", 1], ["B", 1], ["N", 1], ["M", 1], [",", 1], [".", 1], ["/", 1], ["⇧", 2.3]]],
    [1, [["ctrl", 1.3], ["fn", 1], ["⌥", 1], ["⌘", 1.2], [" ", 6], ["⌘", 1.2], ["⌥", 1], ["ctrl", 1.3]]],
  ];
  const totalRel = rows.reduce((s, r) => s + r[0], 0);
  const unitH = (kbBottom - kbTop - gap * (rows.length - 1)) / totalRel;
  let y = kbTop;
  for (const [hrel, keys] of rows) {
    const h = unitH * hrel;
    const totU = keys.reduce((s, k) => s + k[1], 0);
    const unitW = (KW - gap * (keys.length - 1)) / totU;
    let x = KX;
    for (const [label, wu] of keys) { const w = unitW * wu; drawKey(g, x, y, w, h, label); x += w + gap; }
    y += h + gap;
  }
  g.strokeStyle = "rgba(255,255,255,.13)"; g.lineWidth = 2;
  roundRect(g, cv.width / 2 - 155, 505, 310, 118, 14); g.stroke();
  return cv;
}
const deckTex = new THREE.CanvasTexture(makeKeyboardTexture());
deckTex.anisotropy = 8;
const deckTop = new THREE.Mesh(
  new THREE.PlaneGeometry(W * 0.95, D * 0.9),
  new THREE.MeshStandardMaterial({ map: deckTex, metalness: 0.25, roughness: 0.66 })
);
deckTop.rotation.x = -Math.PI / 2; deckTop.position.set(0, T + 0.002, 0);
laptop.add(deckTop);

/* bisagra + tapa */
const lid = new THREE.Group(); lid.position.set(0, T, -D / 2); laptop.add(lid);
const lidMesh = new THREE.Mesh(new RoundedBoxGeometry(W, Hl, TL, 6, 0.04), bodyMat);
lidMesh.position.y = Hl / 2; lid.add(lidMesh);
const bezel = new THREE.Mesh(new THREE.PlaneGeometry(SW + 0.16, SH + 0.16), bezelMat);
bezel.position.set(0, Hl / 2, TL / 2 + 0.002); lid.add(bezel);
const glass = new THREE.Mesh(new THREE.PlaneGeometry(SW, SH), new THREE.MeshBasicMaterial({ color: 0x0a0a0c }));
glass.position.set(0, Hl / 2, TL / 2 + 0.004); lid.add(glass);

const SZ = TL / 2 + 0.006, SY = Hl / 2;
const corners = [
  new THREE.Vector3(-SW / 2, SY + SH / 2, SZ),
  new THREE.Vector3(SW / 2, SY + SH / 2, SZ),
  new THREE.Vector3(SW / 2, SY - SH / 2, SZ),
  new THREE.Vector3(-SW / 2, SY - SH / 2, SZ),
];

/* sticker con el logo de Gular en la tapa */
const stickerTex = new THREE.CanvasTexture(document.createElement("canvas"));
stickerTex.anisotropy = 4;
function drawSticker() {
  const c = stickerTex.image; c.width = 640; c.height = 300;
  const g = c.getContext("2d");
  g.clearRect(0, 0, c.width, c.height);
  g.fillStyle = "#ffffff";
  const x = 70, y = 70, w = 500, h = 160, r = 26;
  g.beginPath();
  g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
  g.shadowColor = "rgba(0,0,0,.25)"; g.shadowBlur = 24; g.shadowOffsetY = 10; g.fill();
  g.shadowColor = "transparent";
  g.fillStyle = "#0a0a0c"; g.font = '400 118px "Sahlia", Georgia, serif';
  g.textAlign = "center"; g.textBaseline = "middle";
  g.fillText("gular", x + w / 2, y + h / 2 + 6);
  stickerTex.needsUpdate = true;
}
drawSticker();
const sticker = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.70),
  new THREE.MeshBasicMaterial({ map: stickerTex, transparent: true }));
sticker.position.set(0, Hl * 0.5, -TL / 2 - 0.003);
sticker.rotation.set(0, Math.PI, Math.PI);
lid.add(sticker);
try { document.fonts.load('400 120px "Sahlia"').then(drawSticker).catch(() => {}); document.fonts.ready.then(drawSticker); } catch (e) {}

/* -------------------------------------------------- estado / animación */
const LID_CLOSED = 1.52, LID_OPEN = 0.0;
let open = false, booted = false, lidX = LID_CLOSED;
const camClosed = { pos: new THREE.Vector3(0, 3.7, 4.5), at: new THREE.Vector3(0, 0.05, -0.2) };
const SCREEN_CY = T + Hl / 2;
/* abierta: de frente y ALEJADA, para ver la notebook COMPLETA (pantalla + teclado) flotando */
const camOpen = { pos: new THREE.Vector3(0, 1.02, 5.35), at: new THREE.Vector3(0, 1.02, -D / 2) };
const camPos = camClosed.pos.clone(), camAt = camClosed.at.clone();
let px = 0, py = 0;

function openLaptop() {
  if (open) return;
  open = true;
  if (hint) hint.classList.add("is-gone");
  if (reduce) { lidX = LID_OPEN; }
}

const ray = new THREE.Raycaster();
const ndc = new THREE.Vector2();
renderer.domElement.addEventListener("pointerdown", (e) => {
  if (open) return;
  const r = renderer.domElement.getBoundingClientRect();
  ndc.x = ((e.clientX - r.left) / r.width) * 2 - 1;
  ndc.y = -((e.clientY - r.top) / r.height) * 2 + 1;
  ray.setFromCamera(ndc, camera);
  if (ray.intersectObjects([base, lidMesh], true).length) openLaptop();
});
stage.addEventListener("pointermove", (e) => {
  const r = renderer.domElement.getBoundingClientRect();
  px = (e.clientX - r.left) / r.width - 0.5;
  py = (e.clientY - r.top) / r.height - 0.5;
}, { passive: true });
stage.addEventListener("pointerleave", () => { px = 0; py = 0; }, { passive: true });

/* overlay: relativo al contenedor (no al viewport) */
const v = new THREE.Vector3();
function placeOverlay() {
  lid.updateWorldMatrix(true, false);
  let minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9;
  const w = sizeW(), h = sizeH();
  for (const corner of corners) {
    v.copy(corner).applyMatrix4(lid.matrixWorld).project(camera);
    const x = (v.x * 0.5 + 0.5) * w;
    const y = (-v.y * 0.5 + 0.5) * h;
    minX = Math.min(minX, x); maxX = Math.max(maxX, x);
    minY = Math.min(minY, y); maxY = Math.max(maxY, y);
  }
  const mx = (maxX - minX) * 0.012, my = (maxY - minY) * 0.012;
  overlay.style.left = (minX + mx) + "px";
  overlay.style.top = (minY + my) + "px";
  overlay.style.width = (maxX - minX - mx * 2) + "px";
  overlay.style.height = (maxY - minY - my * 2) + "px";
}

/* redimensionar con el contenedor (no solo con la ventana) */
function resize() {
  const w = sizeW(), h = sizeH();
  camera.aspect = w / h; camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  if (open) placeOverlay();
}
if (window.ResizeObserver) new ResizeObserver(resize).observe(stage);
else window.addEventListener("resize", resize);

/* pausar el render cuando la sección no está en pantalla */
let onScreen = true;
if (window.IntersectionObserver) {
  new IntersectionObserver((ents) => { onScreen = ents[0].isIntersecting; }, { threshold: 0.01 })
    .observe(stage);
}

function tick() {
  requestAnimationFrame(tick);
  lidX += ((open ? LID_OPEN : LID_CLOSED) - lidX) * (reduce ? 1 : 0.07);
  lid.rotation.x = lidX;

  const k = reduce ? 1 : 0.06;
  camPos.lerp(open ? camOpen.pos : camClosed.pos, k);
  camAt.lerp(open ? camOpen.at : camClosed.at, k);
  const pxT = open ? 0 : px * 0.7, pyT = open ? 0 : py * 0.4;
  camera.position.set(camPos.x + pxT, camPos.y - pyT, camPos.z);
  camera.lookAt(camAt);

  const prog = (LID_CLOSED - lidX) / (LID_CLOSED - LID_OPEN);
  if (open && prog > 0.6) {
    overlay.classList.add("is-on");
    placeOverlay();
    if (!booted) { booted = true; screen.boot(); }
  } else {
    overlay.classList.remove("is-on");
  }

  if (onScreen) renderer.render(scene, camera);
}
resize();
tick();
