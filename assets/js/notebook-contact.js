/* =========================================================================
   NOTEBOOK de contacto — CARGADOR DIFERIDO (lazy).
   Para no correr DOS escenas WebGL a la vez (el fondo del hero + la notebook)
   mientras mirás el inicio, el motor 3D (notebook-engine.js) se importa recién
   cuando la sección de contacto se ACERCA. Así el fondo del hero tiene la GPU
   para él solo y no se congela.
   ========================================================================= */
const stage = document.getElementById("nbStage");

function loadEngine() {
  import("./notebook-engine.js").catch(() => {});
}

if (!stage) {
  // nada que hacer
} else if (window.IntersectionObserver) {
  // arranca ~1 pantalla y media antes de llegar, así ya está listo al verlo
  const io = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) {
      io.disconnect();
      loadEngine();
    }
  }, { rootMargin: "150% 0px 150% 0px" });
  io.observe(stage);
} else {
  loadEngine();
}
