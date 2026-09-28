/**
 * Live-region announcements  [LEAD]
 *
 *   announce("Kettenreaktion: 4 Bomben.")                 polite, throttled (≥ 800 ms, latest wins)
 *   announce("…", { assertive: true })                    assertive, immediate
 *   announce("…", { throttle: 0 })                        polite, immediate
 *   toast("Dieses Projekt gibt's hier nicht (mehr).")     visible role=status toast (#toast) + polite
 *
 * Regions live in index.html: #announcer-polite, #announcer-assertive, #toast.
 * If they are missing (404.html, tests), they are created on demand.
 * No announcements on scroll — callers only announce results of user actions.
 */

const THROTTLE = 800;
let lastPolite = 0;
let pending = null;
let pendingTimer = 0;
let toastTimer = 0;

function region(id, politeness) {
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement("div");
    el.id = id;
    el.className = "vh";
    el.setAttribute("aria-live", politeness);
    el.setAttribute("aria-atomic", "true");
    document.body.append(el);
  }
  return el;
}

function write(el, text) {
  // Clearing first makes repeated identical messages audible again.
  el.textContent = "";
  requestAnimationFrame(() => {
    el.textContent = text;
  });
}

export function announce(text, { assertive = false, throttle = THROTTLE } = {}) {
  if (typeof document === "undefined" || !text) return;
  if (assertive) {
    write(region("announcer-assertive", "assertive"), text);
    return;
  }
  const now = performance.now();
  const wait = lastPolite + throttle - now;
  if (wait <= 0) {
    lastPolite = now;
    write(region("announcer-polite", "polite"), text);
    return;
  }
  pending = text;
  clearTimeout(pendingTimer);
  pendingTimer = setTimeout(() => {
    lastPolite = performance.now();
    write(region("announcer-polite", "polite"), pending);
    pending = null;
  }, wait);
}

/** Visible, auto-hiding status toast. The toast itself is role=status, so it is announced once. */
export function toast(text, { duration = 4200 } = {}) {
  if (typeof document === "undefined" || !text) return;
  let el = document.getElementById("toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "toast";
    el.className = "toast";
    el.setAttribute("role", "status");
    el.setAttribute("aria-live", "polite");
    document.body.append(el);
  }
  el.hidden = false;
  el.textContent = text;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.hidden = true;
    el.textContent = "";
  }, duration);
}

announce.toast = toast;
export default announce;
