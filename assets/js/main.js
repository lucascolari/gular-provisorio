/* =========================================================================
   Interacción de la landing de Gular (rediseño editorial)
   - Navegación (menú), año, reveals, formulario (mailto provisorio).
   - Índice de proyectos: cada fila abre su caso (uno por vez).
   - Caso abierto = scroll horizontal pineado (el scroll vertical lo recorre
     de derecha a izquierda). En móvil / reduce-motion: apilado vertical.
   (La intro/ceremonia se maneja en intro.js.)
   ========================================================================= */

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isTouch = window.matchMedia("(max-width: 860px)").matches;
const useNative = isTouch || reduceMotion;

/* ---------- Catálogo de proyectos ---------- */
function gallery(folder, from, to) {
  const items = [];
  for (let n = from; n <= to; n++) {
    const num = String(n).padStart(2, "0");
    items.push({ type: "image", src: `assets/media/proyectos/${folder}/${folder}-${num}.webp` });
  }
  return items;
}

const PROJECTS = [
  {
    slug: "triumph", name: "Triumph Rider Academy", cat: "Universo construido",
    desc: "Dirección, edición y posproducción de la campaña Rider Academy.",
    kicker: "Triumph · 2025",
    services: "Concepto creativo · Producción audiovisual · Edición y posproducción",
    text: "Transmitir la experiencia de la Rider Academy con la energía de la marca. Realización integral de la campaña: dirección, edición y posproducción.",
    sign: "Una incorporación. Una historia compartida.",
    media: [{ type: "video", src: "assets/media/video/triumph.mp4", poster: "assets/media/video/triumph.jpg" }],
  },
  {
    slug: "yuze", name: "Yuze", cat: "Universo construido",
    desc: "Producción audiovisual y contenido de marca.",
    kicker: "Yuze",
    services: "Concepto creativo · Producción audiovisual",
    text: "Una pieza con el pulso de la marca: realización y postproducción pensadas para su público.",
    sign: "Marca en movimiento.",
    media: [{ type: "video", src: "assets/media/video/yuze.mp4", poster: "assets/media/video/yuze.jpg" }],
  },
  {
    slug: "jolly", name: "Jolly Hygge", cat: "Universo construido",
    desc: "Sistema de identidad de marca y manual de uso.",
    kicker: "Jolly · Branding",
    services: "Estrategia · Sistema visual · Manual de marca",
    text: "Construir una identidad cálida y consistente para una marca de lifestyle. Sistema visual completo: logo, tipografías, paleta, usos y aplicaciones.",
    sign: "Una identidad con calidez.",
    media: gallery("jolly", 1, 10),
  },
  {
    slug: "team-uniforms", name: "Team Uniforms", cat: "Solución digital",
    desc: "Diseño y desarrollo del sitio web de la marca.",
    kicker: "Team Uniforms · Digital",
    services: "Diseño · Desarrollo web",
    text: "Una presencia digital a la altura de una marca que desarrolla, produce e importa con estándares internacionales.",
    sign: "Estándares internacionales.",
    media: [{ type: "image", src: "assets/media/proyectos/team-uniforms.png" }],
  },
  {
    slug: "envision", name: "Envision", cat: "Universo construido",
    desc: "Showreel de marca y campaña audiovisual integral.",
    kicker: "Envision · 2025",
    services: "Dirección · Producción audiovisual · Postproducción",
    text: "Mostrar la ambición de la marca en movimiento, con un lenguaje audiovisual a la altura. Dirección, edición y postproducción de showreel y campaña.",
    sign: "La marca, en movimiento.",
    media: [{ type: "video", src: "assets/media/video/envision.mp4", poster: "assets/media/video/envision.jpg" }],
  },
  {
    slug: "aperol", name: "Aperol", cat: "Universo construido",
    desc: "Activación y pieza audiovisual de marca.",
    kicker: "Aperol · Ultra 2025",
    services: "Producción audiovisual · Postproducción",
    text: "Una pieza con el espíritu y el color de la marca, pensada para el contexto del evento.",
    sign: "El color de la marca.",
    media: [{ type: "video", src: "assets/media/video/aperol.mp4", poster: "assets/media/video/aperol.jpg" }],
  },
  {
    slug: "sky", name: "Sky", cat: "Universo construido",
    desc: "Pieza audiovisual de marca.",
    kicker: "Sky · Ultra 2025",
    services: "Producción audiovisual · Postproducción",
    text: "Una pieza que respira la identidad de la marca: realización y postproducción.",
    sign: "Identidad en pantalla.",
    media: [{ type: "video", src: "assets/media/video/skyy.mp4", poster: "assets/media/video/skyy.jpg" }],
  },
  {
    slug: "turismo", name: "FIT 2025", cat: "Solución digital",
    desc: "Video institucional para la Feria Internacional de Turismo.",
    kicker: "Turismo · FIT 2025",
    services: "Guion · Producción audiovisual · Postproducción",
    text: "Comunicar valor y confianza en una pieza institucional clara y cálida para pantallas en stand.",
    sign: "Una historia institucional.",
    media: [{ type: "video", src: "assets/media/video/turismo.mp4", poster: "assets/media/video/turismo.jpg" }],
  },
  {
    slug: "motorola", name: "Motorola", cat: "Universo construido",
    desc: "Dirección de arte y propuesta creativa con CGI.",
    kicker: "Motorola · CGI",
    services: "Dirección de arte · CGI · Diseño",
    text: "Proponer un universo visual con impacto y ambición. Dirección de arte y desarrollo de la propuesta con CGI.",
    sign: "Un universo con impacto.",
    media: gallery("motorola", 1, 6),
  },
  {
    slug: "megaled", name: "Megaled", cat: "Solución digital",
    desc: "Propuesta creativa y de contenido.",
    kicker: "Megaled",
    services: "Dirección de arte · Diseño",
    text: "Dar forma a una propuesta clara y con impacto visual. Dirección de arte y desarrollo de la propuesta.",
    sign: "Propuesta con impacto.",
    media: gallery("megaled-hbo", 1, 7),
  },
];

/* ---------- Render del índice ---------- */
const indexEl = document.getElementById("proyectos");

function mediaPanel(m) {
  if (m.type === "video") {
    return `<div class="case__panel case__panel--media">
      <div class="case__media">
        <video data-src="${m.src}" poster="${m.poster}" muted loop playsinline preload="none"></video>
      </div></div>`;
  }
  return `<div class="case__panel case__panel--media">
    <div class="case__media"><img data-src="${m.src}" alt="" loading="lazy" /></div></div>`;
}

function renderProject(p) {
  const panels = [
    `<div class="case__panel case__panel--intro">
       <span class="case__kicker">${p.kicker}</span>
       <h3 class="case__title">${p.name}</h3>
       <p class="case__services">${p.services}</p>
       <p class="case__text">${p.text}</p>
     </div>`,
    ...p.media.map(mediaPanel),
    `<div class="case__panel case__panel--outro">
       <p class="case__sign">${p.sign}</p>
       <span class="case__kicker">gular — ${p.cat}</span>
     </div>`,
  ].join("");

  return `<article class="proj" data-slug="${p.slug}">
    <button class="proj__row" aria-expanded="false" aria-controls="case-${p.slug}">
      <span class="proj__name">${p.name}</span>
      <span class="proj__cat">${p.cat}</span>
      <span class="proj__desc">${p.desc}</span>
      <span class="proj__chev" aria-hidden="true"></span>
    </button>
    <div class="proj__case" id="case-${p.slug}" hidden>
      <div class="case__pin">
        <div class="case__track">${panels}</div>
        <div class="case__hint">Scrollea ↓ · recorré →</div>
      </div>
    </div>
  </article>`;
}

indexEl.innerHTML = PROJECTS.map(renderProject).join("");
if (useNative) indexEl.setAttribute("data-native", "");

/* ---------- Apertura / cierre de casos (uno por vez) ---------- */
let openProj = null;      // <article> abierto
let openCase = null;      // su .proj__case
let openTrack = null;     // su .case__track
let overflow = 0;         // px horizontales a recorrer

function loadMedia(caseEl) {
  caseEl.querySelectorAll("[data-src]").forEach((el) => {
    if (!el.src) el.src = el.dataset.src;
    if (el.tagName === "VIDEO") { const pr = el.play(); if (pr && pr.catch) pr.catch(() => {}); }
  });
}
function stopMedia(caseEl) {
  caseEl.querySelectorAll("video").forEach((v) => v.pause());
}

function navHeight() {
  const v = parseInt(getComputedStyle(document.documentElement).getPropertyValue("--nav-h"), 10);
  return Number.isFinite(v) ? v : 72;
}

function measureOpen() {
  if (!openCase || useNative) return;
  const vw = document.documentElement.clientWidth;
  overflow = Math.max(0, openTrack.scrollWidth - vw);
  const pinH = window.innerHeight - navHeight();
  openCase.style.height = (pinH + overflow) + "px";
  updateTrack();
}

function updateTrack() {
  if (!openCase || useNative) return;
  const navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue("--nav-h")) || 72;
  const rect = openCase.getBoundingClientRect();
  const scrolled = Math.min(Math.max(navH - rect.top, 0), overflow);
  const progress = overflow > 0 ? scrolled / overflow : 0;
  openTrack.style.transform = `translate3d(${-overflow * progress}px,0,0)`;
}

function closeProject(scrollBack) {
  if (!openProj) return;
  const caseEl = openCase;
  openProj.removeAttribute("data-open");
  openProj.querySelector(".proj__row").setAttribute("aria-expanded", "false");
  caseEl.style.height = "";
  stopMedia(caseEl);
  caseEl.setAttribute("hidden", "");
  openProj = openCase = openTrack = null; overflow = 0;
}

function openProject(proj) {
  if (openProj === proj) { closeProject(); return; }
  closeProject();

  openProj = proj;
  openCase = proj.querySelector(".proj__case");
  openTrack = proj.querySelector(".case__track");
  openCase.removeAttribute("hidden");
  proj.setAttribute("data-open", "");
  proj.querySelector(".proj__row").setAttribute("aria-expanded", "true");
  loadMedia(openCase);

  // Llevamos la fila al tope para que el pin arranque desde arriba.
  const navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue("--nav-h")) || 72;
  const y = window.scrollY + proj.getBoundingClientRect().top - navH;
  window.scrollTo({ top: y, behavior: reduceMotion ? "auto" : "smooth" });

  requestAnimationFrame(() => { requestAnimationFrame(measureOpen); });
}

indexEl.querySelectorAll(".proj__row").forEach((row) => {
  row.addEventListener("click", () => openProject(row.closest(".proj")));
});

window.addEventListener("scroll", updateTrack, { passive: true });
window.addEventListener("resize", measureOpen, { passive: true });
window.addEventListener("load", measureOpen);

/* ---------- Año del footer ---------- */
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* ---------- Navegación: la "g" abre/cierra el menú ---------- */
const nav = document.getElementById("nav");
const menuBtn = document.getElementById("menuBtn");
const menuPanel = document.getElementById("menuPanel");

window.addEventListener("scroll", () => {
  if (window.scrollY > 10) nav.setAttribute("data-scrolled", "");
  else nav.removeAttribute("data-scrolled");
}, { passive: true });

function setMenu(open) {
  menuPanel.toggleAttribute("data-open", open);
  menuPanel.setAttribute("aria-hidden", String(!open));
  menuBtn.setAttribute("aria-expanded", String(open));
  menuBtn.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
}
menuBtn.addEventListener("click", () => setMenu(!menuPanel.hasAttribute("data-open")));
menuPanel.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setMenu(false)));
document.addEventListener("keydown", (e) => { if (e.key === "Escape") { setMenu(false); } });

/* ---------- Reveals al entrar en viewport ---------- */
const revealIO = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      if (e.isIntersecting) { e.target.classList.add("is-in"); revealIO.unobserve(e.target); }
    }
  },
  { threshold: 0.18 }
);
document.querySelectorAll(".reveal").forEach((el) => revealIO.observe(el));

/* ---------- Formulario de contacto (provisorio: abre el correo) ---------- */
const CONTACT_EMAIL = "hola@gular.com"; // TODO: correo real de Gular
const form = document.getElementById("contactForm");
const note = document.getElementById("formNote");

if (form) {
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const nombre = form.nombre.value.trim();
    const email = form.email.value.trim();
    const mensaje = form.mensaje.value.trim();
    if (!nombre || !email || !mensaje) {
      note.textContent = "Completá todos los campos para enviar tu consulta.";
      note.dataset.state = "err";
      return;
    }
    const asunto = encodeURIComponent(`Consulta de ${nombre} · Gular`);
    const cuerpo = encodeURIComponent(`${mensaje}\n\n— ${nombre}\n${email}`);
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${asunto}&body=${cuerpo}`;
    note.textContent = "Abrimos tu correo con la consulta lista para enviar. ¡Gracias!";
    note.dataset.state = "ok";
    form.reset();
  });
}
