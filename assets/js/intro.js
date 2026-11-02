/* =========================================================================
   Intro / ceremonia de Gular — video de marca.
   Reproduce assets/media/intro.mp4 a pantalla completa sobre negro y entra al
   sitio cuando termina. Silenciosa, scroll bloqueado, una sola vez por sesión.
   Con reduce-motion o en visitas repetidas, entra directo (sin intro).
   ========================================================================= */

const root = document.documentElement;
const intro = document.getElementById("intro");
const video = document.getElementById("introVideo");
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let seen = false;
try { seen = sessionStorage.getItem("gular-intro") === "1"; } catch {}

let done = false;
function finish(instant) {
  if (done) return;
  done = true;
  root.classList.add("intro-done");
  document.body.classList.remove("intro-lock");
  if (!intro) return;
  if (instant) { intro.remove(); return; }
  intro.classList.add("is-hidden");
  setTimeout(() => intro.remove(), 1100);
}

if (!intro || !video || reduce || seen) {
  finish(true);
} else {
  try { sessionStorage.setItem("gular-intro", "1"); } catch {}
  document.body.classList.add("intro-lock");
  window.scrollTo(0, 0);

  // Entra al sitio cuando el video termina.
  video.addEventListener("ended", () => finish(false));
  // Si el video falla o no carga, no dejamos la intro tapando el sitio.
  video.addEventListener("error", () => finish(false));

  // Fallback de seguridad: cerramos aunque "ended" no dispare.
  let fallback = setTimeout(() => finish(false), 20000);
  video.addEventListener("loadedmetadata", () => {
    clearTimeout(fallback);
    const ms = (isFinite(video.duration) ? video.duration : 15) * 1000 + 1500;
    fallback = setTimeout(() => finish(false), ms);
  });

  const play = video.play();
  if (play && typeof play.catch === "function") {
    play.catch(() => finish(false)); // si el autoplay se bloquea, entramos directo
  }
}
