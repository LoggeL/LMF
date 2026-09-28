/**
 * Motion policy  [LEAD]
 *
 * „Calm“ = prefers-reduced-motion: reduce  OR  the visitor pressed „Bewegung pausieren“
 * (html[data-motion="paused"], persisted as lmf-motion=paused).
 *
 *   motion.calm                → boolean, live
 *   motion.reduced / .paused   → the two inputs
 *   motion.onCalmChange(fn)    → off(); fn(calm) runs on every change (also as `lmf:calm` on document)
 *   motion.setPaused(bool)     → used by shell/motion-toggle.js
 *   motion.vt(fn)              → runs fn inside document.startViewTransition when supported and
 *                                not calm; otherwise runs it directly. Returns a Promise that
 *                                resolves when the DOM update is done (never awaits animations).
 *   motion.scrollBehavior      → "smooth" | "auto" for scrollIntoView / scrollBy
 *   motion.saveData            → navigator.connection.saveData
 *   motion.gpuOk()             → coarse capability gate used by GL modules (§5.1)
 *
 * Node-importable: all browser access is guarded.
 */

const hasWindow = typeof window !== "undefined" && typeof document !== "undefined";
const mq = hasWindow && window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
const listeners = new Set();
let lastCalm = null;

function isPaused() {
  return hasWindow && document.documentElement.dataset.motion === "paused";
}

function emit() {
  const calm = motion.calm;
  if (calm === lastCalm) return;
  lastCalm = calm;
  for (const fn of listeners) {
    try {
      fn(calm);
    } catch (error) {
      console.error(error);
    }
  }
  if (hasWindow) document.dispatchEvent(new CustomEvent("lmf:calm", { detail: { calm } }));
}

export const motion = {
  get reduced() {
    return Boolean(mq?.matches);
  },
  get paused() {
    return isPaused();
  },
  get calm() {
    return this.reduced || this.paused;
  },
  get scrollBehavior() {
    return this.calm ? "auto" : "smooth";
  },
  get saveData() {
    return Boolean(hasWindow && navigator.connection?.saveData);
  },
  onCalmChange(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  setPaused(paused) {
    if (!hasWindow) return;
    if (paused) document.documentElement.dataset.motion = "paused";
    else delete document.documentElement.dataset.motion;
    emit();
  },
  /** View-transition wrapper (§5.3). Never blocks: resolves once the callback has run. */
  vt(fn) {
    if (!hasWindow || this.calm || typeof document.startViewTransition !== "function") {
      return Promise.resolve().then(fn);
    }
    try {
      const transition = document.startViewTransition(fn);
      transition.finished.catch(() => {});
      return transition.updateCallbackDone.catch(() => {});
    } catch {
      return Promise.resolve().then(fn);
    }
  },
  /** Coarse device gate for WebGL work (WP3 adds the WebGL2 check itself). */
  gpuOk() {
    if (!hasWindow || this.calm || this.saveData) return false;
    const mem = navigator.deviceMemory ?? 8;
    const cores = navigator.hardwareConcurrency ?? 4;
    return mem >= 2 && cores >= 4;
  },
};

if (mq) {
  lastCalm = motion.calm;
  mq.addEventListener?.("change", emit);
}

export default motion;
