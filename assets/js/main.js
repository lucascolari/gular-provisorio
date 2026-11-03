/* =========================================================================
   Interacción de la landing de Gular (rediseño editorial)
   - Navegación (menú), año, reveals, formulario (mailto provisorio).
   - Índice de proyectos: cada fila (nombre serif) abre su caso (uno por vez).
   - Caso abierto = barra blanca (sans) + lienzo NEGRO que se recorre en
     horizontal (el scroll vertical lo mueve de derecha a izquierda).
     Funciona igual en desktop y en celular. Solo con reduce-motion se apila.
   (La intro/ceremonia se maneja en intro.js.)
   ========================================================================= */

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const useNative = reduceMotion; // en móvil también recorremos en horizontal

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
    slug: "triumph", name: "Triumph Argentina", cat: "Universo construido",
    desc: "Dirección, edición y posproducción de la campaña Rider Academy.",
    services: "Concepto creativo · Producción audiovisual · Edición y posproducción",
    logo: "Triumph",
    statement: "Una historia\ncompartida.",
    media: [
      { type: "video", src: "assets/media/video/triumph.mp4", poster: "assets/media/video/triumph.jpg", hero: true },
      { type: "image", src: "assets/media/proyectos/triumph/triumph-01.webp", full: true },
    ],
    body: [
      "Triumph nos convocó para anunciar la incorporación de Diego Graziosi a su Rider Academy. Detrás de la noticia encontramos una oportunidad: presentar al instructor desde aquello que lo conecta con quienes se suben a una moto.",
      "Propusimos una videoentrevista breve, centrada en su vínculo personal con el motociclismo. Desarrollamos el enfoque narrativo, realizamos la grabación y trabajamos la edición y la posproducción para que su voz y su experiencia condujeran el relato.",
      "El resultado fue una presentación más humana: además de comunicar quién se incorpora, la pieza puso en primer plano la pasión compartida entre Diego y la comunidad Triumph.",
    ],
    outro: [{ type: "image", src: "assets/media/proyectos/triumph/triumph-02.webp", bleed: true, pos: "right center" }],
  },
  {
    slug: "yuze", name: "Yuze", cat: "Universo construido",
    desc: "Marca, producto y campaña de lanzamiento para un banco digital.",
    services: "Branding · Producto digital · Campaña de lanzamiento",
    caseTitle: "Yuze Digital Bank",
    panels: [
      // Hero: film de marca a pantalla completa, con sonido.
      { type: "video", src: "assets/media/video/yuze-hero.mp4", poster: "assets/media/video/yuze-hero.jpg", hero: true },
      // Intro
      { body: ["Yuze se preparaba para salir al mercado desde Emiratos Árabes Unidos. Ya tenía nombre, logo y una estrategia inicial. El desafío era transformar esa base en una marca con una forma propia de presentarse, explicar su propuesta y conectar con las personas."] },
      { statement: "A partir de una identidad.\nUn universo por construir." },
      // Producto / app
      { type: "image", src: "assets/media/proyectos/yuze/hero-silk.webp", full: true },
      { type: "image", src: "assets/media/proyectos/yuze/app-wallet.webp", slide: true },
      // Identidad / brandbook
      { type: "image", src: "assets/media/proyectos/yuze/bb-01-portada.webp", slide: true },
      { type: "image", src: "assets/media/proyectos/yuze/bb-02-clearspace.webp", slide: true },
      { type: "image", src: "assets/media/proyectos/yuze/bb-03-compositional.webp", slide: true },
      { type: "image", src: "assets/media/proyectos/yuze/bb-04-graphic.webp", slide: true },
      { type: "image", src: "assets/media/proyectos/yuze/bb-05-tone.webp", slide: true },
      // Producto en mano
      { type: "image", src: "assets/media/proyectos/yuze/phones-app.webp", slide: true },
      { type: "image", src: "assets/media/proyectos/yuze/cards.webp", slide: true },
      { type: "image", src: "assets/media/proyectos/yuze/next-gen.webp", slide: true },
      // Campaña de lanzamiento (Freelancer app)
      { body: ["Con la identidad definida, desarrollamos la campaña de lanzamiento: una pieza de marca en video y un sistema de contenidos para redes, pensado para hablarle a la comunidad freelancer y mostrar la propuesta de Yuze en movimiento."] },
      { type: "video", src: "assets/media/video/yuze-ad1.mp4", poster: "assets/media/video/yuze-ad1.jpg", slide: true },
      { type: "video", src: "assets/media/video/yuze-ad2.mp4", poster: "assets/media/video/yuze-ad2.jpg", slide: true },
      { type: "image", src: "assets/media/proyectos/yuze/camp-01.webp", slide: true },
      { type: "image", src: "assets/media/proyectos/yuze/camp-02.webp", slide: true },
      { type: "image", src: "assets/media/proyectos/yuze/camp-03.webp", slide: true },
      { body: [], logo: "Yuze" },
    ],
  },
  {
    slug: "noormenaa", name: "Noormenaa", cat: "Universo construido",
    desc: "Diseño y desarrollo de la identidad de una agencia creativa.",
    services: "Diseño y desarrollo de identidad de marca",
    caseTitle: "Noormenaa Agency",
    hideHint: true,
    panels: [
      // Hero: cielo + wordmark Noormenaa, a pantalla completa.
      { type: "image", src: "assets/media/proyectos/noormenaa/hero.webp", hero: true },
      // Carrusel = una sola escena flotante con las coordenadas EXACTAS del boceto (PDF).
      { scene: {
        pw: 8000, ph: 975,
        items: [
          // Apertura: manifiesto "03"
          { img: "assets/media/proyectos/noormenaa/p-03.webp", x: -3, y: -2, w: 1256, h: 707 },
          { text: "El punto de partida fue un nombre y una breve descripción sensorial. El desafío era convertir esa intención en una marca: encontrar un concepto que le diera dirección y construir un universo visual capaz de expresar una mirada propia.", x: 1300, top: 250, w: 290, fs: 2.0 },
          { text: "De una sensación,\n*a una identidad.*", x: 1288, top: 630, w: 400, fs: 6.6, cls: "scene__head" },
          // Sistema de identidad
          { img: "assets/media/proyectos/noormenaa/clearspace-1.webp", x: 1756, y: 627, w: 618, h: 348 },
          { img: "assets/media/proyectos/noormenaa/p-01.webp", x: 1973, y: 279, w: 618, h: 348 },
          { img: "assets/media/proyectos/noormenaa/clearspace-2.webp", x: 2373, y: 627, w: 643, h: 362 },
          { img: "assets/media/proyectos/noormenaa/monolith.webp", x: 2591, y: 277, w: 617, h: 353 },
          // Luz como principio de identidad + laptop
          { text: "*Desarrollamos la luz como\nprincipio de identidad.*", x: 3100, top: 130, w: 680, fs: 5.6, cls: "scene__head" },
          { text: "El manual reúne las decisiones que ayudan a revelar, orientar y transformar información en significado: el logotipo, el sistema cromático, las tipografías y el lenguaje de imágenes. Reunimos estas decisiones en un manual que permite expresar y ampliar el universo de Noormenaa.", x: 3880, top: 150, w: 470, fs: 2.0 },
          { img: "assets/media/proyectos/noormenaa/laptop.webp", x: 3207, y: -31, w: 1151, h: 658 },
          // Paleta cromática
          { palette: [["#2E6E96","#7FD3E6","#ECE9DF"],["#CFE4F6","#FFFFFF","#2B3A66"],["#D6436A","#2E6E9E","#E7E5DB"]], x: 4480, top: 360, w: 560 },
          // Paisaje "06"
          { img: "assets/media/proyectos/noormenaa/sea.webp", x: 5193, y: 321, w: 1162, h: 654 },
          { text: "Hoy, Noormenaa es una agencia de marketing internacional que utiliza el manual y el universo construido como base de su comunicación. Una intención sensorial transformada en un lenguaje propio, con criterios para sostenerlo mientras la marca crece.", x: 5230, top: 740, w: 560, fs: 2.1, cls: "scene__strong" },
          // Cierre: Instagram
          { img: "assets/media/proyectos/noormenaa/phone.webp", x: 6254, y: -3, w: 1712, h: 978, fit: "contain" },
        ],
      } },
    ],
  },
  {
    slug: "jolly", name: "Jolly Hygge", cat: "Universo construido",
    desc: "Sistema de identidad de marca y manual de uso.",
    services: "Estrategia · Sistema visual · Manual de marca",
    logo: "Jolly Hygge",
    statement: "Una identidad cálida,\nde principio a fin.",
    media: gallery("jolly", 1, 10),
    body: [
      "Jolly Hygge es una marca de lifestyle de real food que necesitaba una identidad cálida, consistente y fácil de sostener en el tiempo.",
      "Construimos el sistema visual completo: logotipo, paleta, tipografías, iconografía y criterios de uso, documentados en un manual de marca claro para todo el equipo.",
      "Cada aplicación —del packaging a lo digital— habla el mismo idioma: una marca con carácter propio y reglas simples para crecer.",
    ],
  },
  {
    slug: "team-uniforms", name: "Team Uniforms", cat: "Solución digital",
    desc: "Diseño y desarrollo del sitio web de la marca.",
    services: "Diseño · Desarrollo web",
    logo: "Team Uniforms",
    statement: "Estándares\ninternacionales, a medida.",
    media: [{ type: "image", src: "assets/media/proyectos/team-uniforms.png" }],
    body: [
      "Team Uniforms desarrolla, produce e importa colecciones para marcas que buscan crecer con estándares internacionales. Su web tenía que estar a esa altura.",
      "Diseñamos y desarrollamos un sitio sobrio y contundente, pensado para presentar el proceso, las categorías y la calidad de producto con claridad.",
      "Una presencia digital que transmite confianza y ordena la conversación comercial desde el primer scroll.",
    ],
  },
  {
    slug: "envision", name: "Envision", cat: "Universo construido",
    desc: "Showreel de marca y campaña audiovisual integral.",
    services: "Dirección · Producción audiovisual · Postproducción",
    logo: "Envision",
    statement: "La ambición de la marca,\nen movimiento.",
    media: [{ type: "video", src: "assets/media/video/envision.mp4", poster: "assets/media/video/envision.jpg" }],
    body: [
      "Envision quería mostrar su ambición con un lenguaje audiovisual a la altura. Trabajamos un showreel de marca y una campaña que hablan el mismo idioma visual.",
      "Nos ocupamos de la dirección, la edición y la postproducción, cuidando el pulso del montaje y la coherencia de la imagen en cada pieza.",
      "El resultado es una marca que se percibe sólida y en movimiento, lista para pantallas y presentaciones.",
    ],
  },
  {
    slug: "aperol", name: "Aperol", cat: "Universo construido",
    desc: "Activación y pieza audiovisual de marca.",
    services: "Producción audiovisual · Postproducción",
    logo: "Aperol",
    statement: "El color de la marca,\nen vivo.",
    media: [{ type: "video", src: "assets/media/video/aperol.mp4", poster: "assets/media/video/aperol.jpg" }],
    body: [
      "En el marco de Ultra 2025, Aperol necesitaba una pieza que respirara el espíritu y el color de la marca dentro del contexto del festival.",
      "Encaramos la realización y la postproducción pensando en el entorno del evento: energía, ritmo y una identidad visual inconfundible.",
      "Una activación audiovisual que convierte el momento en marca.",
    ],
  },
  {
    slug: "sky", name: "Sky", cat: "Universo construido",
    desc: "Pieza audiovisual de marca.",
    services: "Producción audiovisual · Postproducción",
    logo: "Sky",
    statement: "La identidad,\nen pantalla.",
    media: [{ type: "video", src: "assets/media/video/skyy.mp4", poster: "assets/media/video/skyy.jpg" }],
    body: [
      "Para Ultra 2025, Sky buscaba una pieza que respirara su identidad y funcionara en el contexto del festival.",
      "Trabajamos la realización y la postproducción con foco en el tono de la marca y en la experiencia de pantalla grande.",
      "Una pieza breve y contundente, pensada para el momento y para la marca.",
    ],
  },
  {
    slug: "turismo", name: "FIT 2025", cat: "Solución digital",
    desc: "Video institucional para la Feria Internacional de Turismo.",
    services: "Guion · Producción audiovisual · Postproducción",
    logo: "FIT 2025",
    statement: "Una historia institucional,\nclara y cálida.",
    media: [{ type: "video", src: "assets/media/video/turismo.mp4", poster: "assets/media/video/turismo.jpg" }],
    body: [
      "Para la Feria Internacional de Turismo, el desafío era comunicar valor y confianza en una pieza institucional clara, pensada para pantallas en stand.",
      "Trabajamos el guion, la realización y la postproducción buscando un tono cálido y humano, fácil de seguir en un entorno de evento.",
      "El resultado acompaña la presencia en la feria y ordena el mensaje institucional.",
    ],
  },
  {
    slug: "motorola", name: "Motorola", cat: "Universo construido",
    desc: "Dirección de arte y propuesta creativa con CGI.",
    services: "Dirección de arte · CGI · Diseño",
    logo: "Motorola",
    statement: "Un universo visual\ncon ambición.",
    media: gallery("motorola", 1, 6),
    body: [
      "El objetivo era proponer un universo visual con impacto y ambición para la marca, capaz de sostener una gran idea.",
      "Desarrollamos la dirección de arte y la propuesta apoyándonos en CGI, cuidando materiales, luz y composición para lograr una imagen potente.",
      "Una propuesta que muestra hacia dónde puede ir la marca, con una estética a la altura.",
    ],
  },
  {
    slug: "megaled", name: "Megaled", cat: "Solución digital",
    desc: "Propuesta creativa y de contenido.",
    services: "Dirección de arte · Diseño",
    logo: "Megaled",
    statement: "Una propuesta\ncon impacto.",
    media: gallery("megaled-hbo", 1, 7),
    body: [
      "Megaled necesitaba dar forma a una propuesta clara y con fuerza visual para presentar su idea.",
      "Trabajamos la dirección de arte y el desarrollo de la propuesta, ordenando el contenido y elevando la imagen de cada pieza.",
      "El resultado es una presentación contundente, lista para convencer.",
    ],
  },
];

/* ---------- Render del índice ---------- */
const indexEl = document.getElementById("proyectos");

function mediaPanel(m, p, i) {
  const label = `${p.name} — ${p.cat}, proyecto de Gular`;
  const full = m.hero ? " case__panel--full" : (m.bleed ? " case__panel--bleed" : (m.slide ? " case__panel--slide" : (m.full ? " case__panel--shot" : "")));
  if (m.type === "video") {
    // Video "hero": a pantalla completa y con sonido mientras el usuario lo mira.
    const hero = m.hero ? ` data-hero` : ` muted`;
    return `<div class="case__panel case__panel--media${full}">
      <div class="case__media">
        <video data-src="${m.src}" poster="${m.poster}" loop playsinline preload="none"${hero} aria-label="${label}"></video>
      </div></div>`;
  }
  const posStyle = m.pos ? ` style="object-position:${m.pos}"` : "";
  return `<div class="case__panel case__panel--media${full}">
    <div class="case__media"><img data-src="${m.src}" alt="${p.name} — ${p.cat} (${i + 1})" loading="lazy"${posStyle} /></div></div>`;
}

function statementPanel(text, opts) {
  opts = opts || {};
  const cls = opts.sans ? " case__statement--sans" : "";
  const align = opts.align ? ` case__panel--${opts.align}` : "";
  // *negrita* → <strong>
  const html = text.replace(/\n/g, "<br />").replace(/\*(.+?)\*/g, "<strong>$1</strong>");
  return `<div class="case__panel case__panel--statement${align}"><p class="case__statement${cls}">${html}</p></div>`;
}
function bodyPanel(paragraphs, logo) {
  const bodyHTML = paragraphs.map((t) => `<p class="case__body-p">${t}</p>`).join("");
  return `<div class="case__panel case__panel--body">${logo ? `<span class="case__logo">${logo}</span>` : ""}${bodyHTML}</div>`;
}
// Paleta cromática (swatches en ladrillo, sobre el negro).
function palettePanel(rows) {
  const html = rows.map((r) => `<div class="palette__row">${r.map((c) => `<span class="palette__chip" style="background:${c}"></span>`).join("")}</div>`).join("");
  return `<div class="case__panel case__panel--palette"><div class="palette">${html}</div></div>`;
}
// Escena: TODO el carrusel como una sola composición flotante con las
// coordenadas EXACTAS del boceto (PDF). Cada item se posiciona en % sobre el
// lienzo del PDF (ancho pw × alto ph, pt). Imágenes con `y` (origen abajo, como
// el PDF); textos/cajas con `top` (origen arriba). El scroll horizontal recorre
// la escena = experiencia de carrusel flotante.
function paletteRows(rows) {
  return `<div class="palette">${rows.map((r) => `<div class="palette__row">${r.map((c) => `<span class="palette__chip" style="background:${c}"></span>`).join("")}</div>`).join("")}</div>`;
}
function scenePanel(scene, p) {
  const PW = scene.pw, PH = scene.ph;
  const pc = (v, tot) => (v / tot * 100).toFixed(3);
  const items = scene.items.map((it) => {
    const topPt = (it.top != null) ? it.top : (PH - it.y - it.h);
    const base = `left:${pc(it.x, PW)}%;top:${pc(topPt, PH)}%;width:${pc(it.w, PW)}%;`;
    if (it.img) return `<img class="scene__img" data-src="${it.img}" alt="${p.name} — ${p.cat}" loading="lazy" style="${base}height:${pc(it.h, PH)}%;object-fit:${it.fit || "cover"}" />`;
    if (it.palette) return `<div class="scene__palette" style="${base}">${paletteRows(it.palette)}</div>`;
    if (it.text != null) {
      const html = it.text.replace(/\n/g, "<br />").replace(/\*(.+?)\*/g, "<strong>$1</strong>");
      return `<div class="scene__text${it.cls ? " " + it.cls : ""}" style="${base}font-size:${it.fs || 2}cqh">${html}</div>`;
    }
    return "";
  }).join("");
  return `<div class="case__panel case__panel--scene"><div class="scene">${items}</div></div>`;
}
// Un panel puede ser media, statement, body, paleta o escena.
function panelHTML(panel, p, i) {
  if (panel.statement) return statementPanel(panel.statement, panel);
  if (panel.palette) return palettePanel(panel.palette);
  if (panel.scene) return scenePanel(panel.scene, p);
  if (panel.body) return bodyPanel(panel.body, panel.logo);
  return mediaPanel(panel, p, i);
}

function renderProject(p) {
  let panels;
  if (p.panels) {
    // Orden de paneles a medida (ej. Yuze).
    panels = p.panels.map((pan, i) => panelHTML(pan, p, i)).join("");
  } else {
    // Estructura por defecto: media(s) → statement → cuerpo → outro.
    const outroHTML = (p.outro || []).map((m, i) => mediaPanel(m, p, p.media.length + i)).join("");
    panels = [
      ...p.media.map((m, i) => mediaPanel(m, p, i)),
      statementPanel(p.statement),
      bodyPanel(p.body, p.logo),
      outroHTML,
    ].join("");
  }

  return `<article class="proj" data-slug="${p.slug}">
    <button class="proj__row" aria-expanded="false" aria-controls="case-${p.slug}">
      <span class="proj__name">${p.name}</span>
      <span class="proj__cat">${p.cat}</span>
      <span class="proj__desc">${p.desc}</span>
      <span class="proj__chev" aria-hidden="true"></span>
    </button>
    <div class="proj__case" id="case-${p.slug}" hidden>
      <div class="case__pin">
        <button class="case__bar" aria-label="Cerrar ${p.name}">
          <span class="iso" aria-hidden="true"><span class="iso__top"></span><span class="iso__tail"></span></span>
          <span class="case__bar-head">
            <span class="case__bar-title">${p.caseTitle || p.name}</span>
            <span class="case__bar-services">${p.services}</span>
          </span>
        </button>
        <div class="case__track">${panels}</div>
        ${p.hideHint ? "" : '<div class="case__hint">Scrollea ↓ · recorré →</div>'}
      </div>
    </div>
  </article>`;
}

indexEl.innerHTML = '<h2 class="sr-only">Proyectos de Gular</h2>' + PROJECTS.map(renderProject).join("");
if (useNative) indexEl.setAttribute("data-native", "");

/* ---------- Apertura / cierre de casos (uno por vez) ---------- */
let openProj = null;      // <article> abierto
let openCase = null;      // su .proj__case
let openTrack = null;     // su .case__track
let overflow = 0;         // px horizontales a recorrer
let heroVideo = null;     // video "hero" (full screen + sonido) del caso abierto
let heroPanelW = 0;       // ancho del panel del video hero

function navHeight() {
  const v = parseInt(getComputedStyle(document.documentElement).getPropertyValue("--nav-h"), 10);
  return Number.isFinite(v) ? v : 72;
}

function playVideo(v) {
  const pr = v.play();
  if (pr && pr.catch) pr.catch(() => {
    // Si el navegador bloquea el autoplay con sonido, reproducimos en silencio
    // y marcamos que hace falta un toque del usuario para activarlo.
    if (!v.muted) { v.muted = true; v.dataset.needsTap = "1"; const p2 = v.play(); if (p2 && p2.catch) p2.catch(() => {}); }
  });
}
function loadMedia(caseEl) {
  caseEl.querySelectorAll("[data-src]").forEach((el) => {
    if (!el.src) el.src = el.dataset.src;
    if (el.tagName === "VIDEO") {
      if (el.hasAttribute("data-hero")) el.muted = false; // el hero arranca con sonido
      playVideo(el);
    } else if (el.tagName === "IMG" && !el.complete) {
      // El ancho del panel puede depender del tamaño real de la foto (celular):
      // re-medimos el recorrido cuando la imagen termina de cargar.
      el.addEventListener("load", () => measureOpen(), { once: true });
    }
  });
}
function stopMedia(caseEl) {
  caseEl.querySelectorAll("video").forEach((v) => { v.pause(); v.muted = true; });
}

function measureOpen() {
  if (!openCase || useNative) return;
  const vw = document.documentElement.clientWidth;
  overflow = Math.max(0, openTrack.scrollWidth - vw);
  const pinH = window.innerHeight - navHeight();
  openCase.style.height = (pinH + overflow) + "px";
  if (heroVideo) { const panel = heroVideo.closest(".case__panel"); heroPanelW = panel ? panel.offsetWidth : 0; }
  updateTrack();
}

function updateTrack() {
  if (!openCase || useNative) return;
  const rect = openCase.getBoundingClientRect();
  const scrolled = Math.min(Math.max(navHeight() - rect.top, 0), overflow);
  const progress = overflow > 0 ? scrolled / overflow : 0;
  const tx = -overflow * progress;
  openTrack.style.transform = `translate3d(${tx}px,0,0)`;

  // Sonido del video hero: suena solo mientras el video ocupa la pantalla.
  if (heroVideo && heroPanelW > 0) {
    const vw = document.documentElement.clientWidth;
    const visible = Math.max(0, Math.min(vw, tx + heroPanelW) - Math.max(0, tx));
    const onVideo = visible > vw * 0.5;
    if (onVideo) {
      if (heroVideo.dataset.needsTap !== "1") heroVideo.muted = false;
      if (heroVideo.paused) playVideo(heroVideo);
    } else {
      heroVideo.muted = true;
    }
  }
}

function closeProject() {
  if (!openProj) return;
  const caseEl = openCase;
  const art = openProj;
  art.removeAttribute("data-open");
  art.querySelector(".proj__row").setAttribute("aria-expanded", "false");
  caseEl.style.height = "";
  caseEl.style.transform = "";
  stopMedia(caseEl);
  caseEl.setAttribute("hidden", "");
  openProj = openCase = openTrack = null; overflow = 0;
  heroVideo = null; heroPanelW = 0;
  // Volvemos la fila a la vista.
  const y = window.scrollY + art.getBoundingClientRect().top - navHeight() - 8;
  window.scrollTo({ top: Math.max(0, y), behavior: reduceMotion ? "auto" : "smooth" });
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
  if (openTrack) openTrack.style.transform = "translate3d(0,0,0)";
  heroVideo = openCase.querySelector("video[data-hero]");
  loadMedia(openCase);
  // Tocar el video hero activa/silencia el sonido (y lo desbloquea si el navegador lo frenó).
  if (heroVideo) {
    const stage = heroVideo.closest(".case__media");
    if (stage && !stage.dataset.soundBound) {
      stage.dataset.soundBound = "1";
      stage.addEventListener("click", (e) => {
        e.stopPropagation();
        heroVideo.dataset.needsTap = "";
        heroVideo.muted = !heroVideo.muted;
        playVideo(heroVideo);
      });
    }
  }

  // Llevamos la fila al tope para que el pin arranque desde arriba.
  const y = window.scrollY + proj.getBoundingClientRect().top - navHeight();
  window.scrollTo({ top: y, behavior: reduceMotion ? "auto" : "smooth" });

  requestAnimationFrame(() => { requestAnimationFrame(measureOpen); });
}

indexEl.querySelectorAll(".proj__row").forEach((row) => {
  row.addEventListener("click", () => openProject(row.closest(".proj")));
});
indexEl.querySelectorAll(".case__bar").forEach((bar) => {
  bar.addEventListener("click", () => closeProject());
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
document.addEventListener("keydown", (e) => { if (e.key === "Escape") { setMenu(false); if (openProj) closeProject(); } });

/* ---------- Hero a ancho completo (como el boceto) ---------- */
const heroTitle = document.querySelector(".hero__title");
function fitHero() {
  if (!heroTitle) return;
  const BASE = 1000;                             // base grande para forzar overflow y medir bien
  heroTitle.style.fontSize = BASE + "px";
  const avail = heroTitle.clientWidth;           // ancho disponible (sin padding del hero)
  const text = heroTitle.scrollWidth;            // ancho real del texto a BASE px
  if (text > 0) heroTitle.style.fontSize = (BASE * avail / text) * 0.995 + "px";
}
fitHero();
window.addEventListener("resize", fitHero, { passive: true });
if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitHero);
window.addEventListener("load", fitHero);

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
