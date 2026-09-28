/**
 * „Bewegung pausieren“  [LEAD]  (WCAG 2.2.2)
 * - #motion-toggle: constant name „Bewegung pausieren“, state in aria-pressed (true = paused).
 *   The tooltip (title) is the same constant name, so hover and screen reader never disagree.
 * - persisted as lmf-motion=paused; html[data-motion="paused"] (set before paint by the boot script)
 * - notifies every animated module through motion.onCalmChange / the `lmf:calm` event
 */

import { local } from "../lib/storage.js";
import { motion } from "../lib/motion.js";
import { announce } from "../lib/announce.js";

const KEY = "lmf-motion";

function sync(button) {
  const paused = motion.paused;
  button.setAttribute("aria-pressed", String(paused));
  button.setAttribute("aria-label", "Bewegung pausieren");
  button.title = "Bewegung pausieren";
}

export function initMotionToggle() {
  const button = document.getElementById("motion-toggle");
  if (!button) return;
  if (local.get(KEY) === "paused") motion.setPaused(true);
  sync(button);
  button.addEventListener("click", () => {
    const paused = !motion.paused;
    motion.setPaused(paused);
    if (paused) local.set(KEY, "paused");
    else local.remove(KEY);
    sync(button);
    announce(paused ? "Bewegung pausiert." : "Bewegung läuft wieder.", { throttle: 0 });
  });
}

export default initMotionToggle;
