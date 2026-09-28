/**
 * One cooled Esse frame as a PNG data URL [WP3], for scripts/render-poster.mjs only (runs in a page on
 * the site origin). Kept out of gl/esse.js so the page never downloads it.
 */
import { createForge } from "./esse.js";
import { loadImage } from "./gl.js";

export async function renderStill({ width, height, repos, asOf, t = 4.2 }) {
  const canvas = document.createElement("canvas");
  const forge = createForge(canvas, { repos, asOf });
  if (!forge) throw new Error("WebGL2 unavailable");
  forge.setSdf(await loadImage(new URL("../../assets/img/logo-sdf.png", import.meta.url).href));
  forge.init();
  forge.setSize(width, height);
  forge.cool();
  forge.st.t = t;
  forge.draw();
  forge.draw();
  return canvas.toDataURL("image/png");
}
