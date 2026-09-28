/**
 * YouTube facade (spec §5.4, §2.11)  [WP2]
 * Zero requests to YouTube, Google or ytimg before the click: the poster is our own image
 * (or a Rohling), the play button is plain markup. The click swaps in a youtube-nocookie iframe
 * and moves focus into it. Playlists (no single video id) only link out.
 *
 *   renderFacade(project, film, { poster })   → string
 *   playFacade(button)                        → the iframe; werkbank.js calls it on clicks on [data-yt]
 */
import { html, extLink, icon, raw } from "../lib/dom.js";
import { durationLabel } from "../lib/format.js";

export const FACADE_NOTE = "Beim Abspielen lädt YouTube (Google) Inhalte und setzt ggf. Cookies.";

export function renderFacade(p, film, { poster = "", bed = "" } = {}) {
  const id = film?.youtubeId;
  if (!id || !/^[\w-]{11}$/.test(id)) return "";
  const aspect = film.aspect === "9:16" ? "portrait" : "landscape";
  const title = film.realTitle || p.title;
  const len = film.duration ? html`<span class="wb-film-len">${film.duration}<span class="vh"> (${durationLabel(film.duration)})</span></span>` : "";
  return String(html`<div class="wb-film wb-film--${aspect}" data-facade>
  <div class="wb-film-frame">
    ${bed && aspect === "portrait" ? html`<div class="wb-film-bed" aria-hidden="true"><img src="${bed}" alt="" decoding="async"></div>` : ""}
    <div class="wb-film-poster">${raw(poster)}</div>
    <button type="button" class="wb-film-play" data-yt="${id}" data-yt-title="${title}">
      <span class="wb-film-disc" aria-hidden="true">${icon("play")}</span>
      <span class="wb-film-label">Film abspielen<span class="wb-film-label-note"> (lädt YouTube)</span></span>
      ${len}
    </button>
  </div>
  <p class="wb-film-note meta">${FACADE_NOTE} ${extLink(`https://www.youtube.com/watch?v=${id}`, "Auf YouTube öffnen", "wb-film-out")}</p>
</div>`);
}

export function playFacade(button) {
  const id = button?.dataset.yt;
  if (!id || !/^[\w-]{11}$/.test(id)) return null;
  const frame = button.closest(".wb-film-frame");
  const iframe = document.createElement("iframe");
  iframe.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0`;
  iframe.title = `${button.dataset.ytTitle} auf YouTube`;
  iframe.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
  iframe.referrerPolicy = "strict-origin-when-cross-origin";
  iframe.className = "wb-film-iframe";
  frame.replaceChildren(iframe);
  frame.closest("[data-facade]")?.classList.add("is-playing");
  iframe.focus();
  return iframe;
}

export default renderFacade;
