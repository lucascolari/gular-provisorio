/* =========================================================================
   NOTEBOOK · núcleo compartido de la PANTALLA
   - Construye el contenido de la pantalla (encendido → formulario → enviado).
   - Mismo envío que el sitio real (mailto a sin@gular.agency).
   - Lo usan los dos tests (A: CSS 3D · C: Three.js), así la pantalla se
     comporta igual y solo comparás la notebook.
   ========================================================================= */

const CONTACT_EMAIL = "sin@gular.agency";

export function createScreen() {
  const scr = document.createElement("div");
  scr.className = "scr";
  scr.dataset.stage = "off";
  scr.innerHTML = `
    <div class="scr__boot" aria-hidden="true">
      <span class="scr__word">gular</span>
      <span class="scr__line"></span>
    </div>

    <form class="scr__form" novalidate>
      <p class="scr__kick">Contanos qué estás construyendo.</p>
      <label class="scr__field">
        <span>Nombre</span>
        <input name="nombre" type="text" autocomplete="name" required />
      </label>
      <label class="scr__field">
        <span>Correo</span>
        <input name="email" type="email" autocomplete="email" required />
      </label>
      <div class="scr__field scr__select" data-open="false">
        <span>Servicio</span>
        <button type="button" class="scr__select-trigger" aria-haspopup="listbox" aria-expanded="false">
          <span class="scr__select-value"></span>
          <span class="scr__select-caret" aria-hidden="true"></span>
        </button>
        <ul class="scr__select-list" role="listbox" aria-label="Servicio">
          <li role="option" tabindex="-1">Re/diseño web</li>
          <li role="option" tabindex="-1">Desarrollo web</li>
          <li role="option" tabindex="-1">Desarrollo de software a medida</li>
          <li role="option" tabindex="-1">Branding</li>
          <li role="option" tabindex="-1">Producción audiovisual</li>
          <li role="option" tabindex="-1">Gestión de redes</li>
          <li role="option" tabindex="-1">Marketing</li>
          <li role="option" tabindex="-1">Asesoría</li>
          <li role="option" tabindex="-1">Estrategia</li>
          <li role="option" tabindex="-1">Otro</li>
        </ul>
      </div>
      <label class="scr__field">
        <span>Consulta</span>
        <textarea name="mensaje" rows="2" required></textarea>
      </label>
      <button type="submit" class="scr__send">Enviar consulta</button>
      <p class="scr__note" role="status" aria-live="polite"></p>
    </form>

    <div class="scr__sent" aria-hidden="true">
      <span class="scr__g">g</span>
      <p class="scr__thanks">Recibimos tu consulta.</p>
    </div>
  `;

  const form = scr.querySelector(".scr__form");
  const note = scr.querySelector(".scr__note");
  // desplegable de Servicios (vacío como los demás; al tocar se abre la barra)
  const select = scr.querySelector(".scr__select");
  const trigger = select.querySelector(".scr__select-trigger");
  const valueEl = select.querySelector(".scr__select-value");
  const options = [...select.querySelectorAll(".scr__select-list li")];
  let servicio = "";
  function closeSelect() { select.dataset.open = "false"; trigger.setAttribute("aria-expanded", "false"); }
  trigger.addEventListener("click", (e) => {
    e.stopPropagation();
    const o = select.dataset.open !== "true";
    select.dataset.open = o ? "true" : "false";
    trigger.setAttribute("aria-expanded", o ? "true" : "false");
  });
  options.forEach((li) => li.addEventListener("click", () => {
    servicio = li.textContent.trim();
    valueEl.textContent = servicio;
    options.forEach((o) => o.classList.remove("is-active"));
    li.classList.add("is-active");
    closeSelect();
  }));
  scr.addEventListener("click", (e) => { if (!select.contains(e.target)) closeSelect(); });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const nombre = form.nombre.value.trim();
    const email = form.email.value.trim();
    const mensaje = form.mensaje.value.trim();
    if (!nombre || !email || !mensaje) {
      note.textContent = "Completá nombre, correo y consulta.";
      note.dataset.state = "err";
      return;
    }
    // Mismo envío que el sitio real: abre el correo con la consulta lista.
    const asunto = encodeURIComponent(`Consulta de ${nombre} · Gular`);
    const cuerpo = encodeURIComponent(
      `${mensaje}\n\nServicio: ${servicio || "—"}\n\n— ${nombre}\n${email}`
    );
    try {
      const a = document.createElement("a");
      a.href = `mailto:${CONTACT_EMAIL}?subject=${asunto}&body=${cuerpo}`;
      a.rel = "noopener";
      a.click();
    } catch (err) {}
    scr.dataset.stage = "sent";
    // la frase "Recibimos tu consulta" se desvanece y queda solo la "g"
    setTimeout(() => scr.classList.add("scr--justg"), 2600);
  });

  /* enciende la pantalla: intro de marca y luego el formulario */
  scr.boot = function boot() {
    scr.classList.remove("scr--justg");
    scr.dataset.stage = "boot";
    clearTimeout(scr._t);
    scr._t = setTimeout(() => { scr.dataset.stage = "form"; }, 1700);
  };
  /* apaga / reinicia (al cerrar la notebook) */
  scr.off = function off() {
    clearTimeout(scr._t);
    scr.classList.remove("scr--justg");
    scr.dataset.stage = "off";
    try { form.reset(); } catch (e) {}
    servicio = ""; valueEl.textContent = "";
    options.forEach((o) => o.classList.remove("is-active"));
    closeSelect();
    note.textContent = "";
    note.dataset.state = "";
  };

  return scr;
}
