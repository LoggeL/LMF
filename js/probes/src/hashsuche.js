/**
 * Probestück · Hashsuche (Transcripator)  [WP4]  · Echt · spec §5.7d (Werkbank)
 *
 * Source: README of LoggeL/TranscripatorWeb („Proof of Work (Anti-Abuse)“: the server hands out a
 * random challenge, a Web Worker increments a nonce until SHA-256(challenge + nonce) starts with
 * four zeros, „~65k attempts avg“; the server re-hashes once). Challenge format as in app.py:
 * 16 random bytes as hex. The search itself runs for real in js/probes/hash-worker.js.
 *
 * The stage may carry data-zeros="2" (tests); default 4 like POW_DIFFICULTY in the original.
 */

import { announcer, calmSource, nextId } from "./index.js";

export const KIND = "echt";
export const CHIP = "Echt: Dein Browser rechnet gerade wirklich. Wie im Transcripator, nur prüft hier kein Server.";

export async function sha256Hex(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function makeChallenge() {
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  return [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
}

const nf = new Intl.NumberFormat("de-DE");
const sec = new Intl.NumberFormat("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export function mount(root, ctx = {}) {
  const motion = calmSource(ctx);
  const say = announcer(ctx);
  const stage = root.closest("[data-zeros]");
  let zeros = Math.max(1, Math.min(6, Number(stage?.dataset.zeros ?? ctx.zeros ?? 4) || 4));
  let expected = 16 ** zeros;
  const levels = [...new Set([zeros, 4, 5, 6])].sort((a, b) => a - b);
  const howId = nextId("ph-how");

  root.classList.add("probe", "probe-hash");
  root.tabIndex = -1;
  root.innerHTML = `
    <div class="ph-screen">
      <dl class="ph-spec">
        <div><dt>Aufgabe</dt><dd><code data-ph="challenge"></code></dd></div>
        <div><dt>Gesucht</dt><dd>SHA-256(Aufgabe + Zahl) fängt mit <b class="ph-zeros" data-ph="zeros"></b> an</dd></div>
        <div><dt>Im Schnitt</dt><dd><span data-ph="expected"></span> Versuche <span class="ph-muted">(16<sup data-ph="exp"></sup>)</span></dd></div>
      </dl>
      <div class="ph-hash" data-ph="hash" aria-hidden="true">${Array.from({ length: 64 }, () => "<span>·</span>").join("")}</div>
      <p class="ph-live meta" aria-hidden="true"><span>Versuch <b data-ph="n">0</b></span><span data-ph="rate"></span></p>
      <div class="ph-meter" aria-hidden="true"><i data-ph="meter"></i><span class="ph-meter-mark" title="Durchschnitt"></span></div>
      <p class="ph-result" data-ph="result" hidden></p>
    </div>
    <fieldset class="ph-levels">
      <legend class="meta">Wie viele Nullen?</legend>
      ${levels
        .map(
          (n) => `<label class="ph-level"><input type="radio" name="${howId}-z" value="${n}" ${n === zeros ? "checked" : ""} /><span>${n}${n === 4 ? " · wie im Original" : ""}</span></label>`,
        )
        .join("")}
    </fieldset>
    <div class="probe-toolbar">
      <button class="button probe-btn" type="button" data-ph="go">Rechnen lassen</button>
      <button class="button button--ghost probe-btn" type="button" data-ph="stop" disabled>Abbrechen</button>
      <p class="probe-readout meta" id="${howId}">Läuft in einem Web Worker, die Seite bleibt bedienbar.</p>
    </div>`;

  const q = (k) => root.querySelector(`[data-ph="${k}"]`);
  const el = { challenge: q("challenge"), hash: q("hash"), n: q("n"), rate: q("rate"), meter: q("meter"), result: q("result"), go: q("go"), stop: q("stop") };
  const cells = [...el.hash.children];
  function applyZeros() {
    expected = 16 ** zeros;
    root.style.setProperty("--ph-zeros", zeros);
    q("zeros").textContent = "0".repeat(zeros);
    q("expected").textContent = nf.format(expected);
    q("exp").textContent = String(zeros);
    cells.forEach((c, i) => c.classList.toggle("ph-slot", i < zeros));
  }
  applyZeros();
  const onLevel = (e) => {
    if (e.target.name !== `${howId}-z`) return;
    if (worker) stop(false);
    zeros = Number(e.target.value);
    applyZeros();
    showHash("");
    el.result.hidden = true;
  };
  root.addEventListener("change", onLevel);
  let challenge = makeChallenge();
  el.challenge.textContent = challenge;
  let worker = null;
  let t0 = 0;
  let destroyed = false;

  function showHash(hex, found = false) {
    for (let i = 0; i < 64; i++) {
      const c = cells[i];
      c.textContent = hex[i] ?? "·";
      c.classList.toggle("is-zero", i < zeros && hex[i] === "0");
    }
    root.classList.toggle("is-found", found);
  }

  // a button never disables itself under the keyboard: focus hops to its partner first (WCAG 2.4.3)
  function setBusy(busy) {
    const from = busy ? el.go : el.stop;
    const to = busy ? el.stop : el.go;
    to.disabled = false;
    if (document.activeElement === from) to.focus({ preventScroll: true });
    el.go.disabled = busy;
    el.stop.disabled = !busy;
    root.classList.toggle("is-busy", busy);
  }

  function start() {
    if (worker || destroyed) return;
    if (!globalThis.crypto?.subtle || typeof Worker !== "function") {
      el.result.hidden = false;
      el.result.textContent = "Dein Browser rechnet hier leider nicht mit (kein crypto.subtle oder Worker).";
      return;
    }
    if (el.result.dataset.hash) {
      challenge = makeChallenge();
      el.challenge.textContent = challenge;
    }
    el.result.hidden = true;
    delete el.result.dataset.hash;
    showHash("");
    el.n.textContent = "0";
    el.rate.textContent = "";
    el.meter.style.transform = "scaleX(0)";
    setBusy(true);
    t0 = performance.now();
    worker = new Worker(new URL("./hash-worker.js", import.meta.url));
    root.__worker = worker;
    worker.onmessage = ({ data }) => (data.type === "done" ? done(data) : progress(data));
    worker.onerror = () => {
      stop(false);
      el.result.hidden = false;
      el.result.textContent = "Das Probestück klemmt gerade.";
    };
    worker.postMessage({ challenge, zeros });
    say("Rechnet.");
  }

  function progress({ nonce, hex }) {
    el.n.textContent = nf.format(nonce);
    const s = (performance.now() - t0) / 1000;
    if (s > 0.2) el.rate.textContent = `${nf.format(Math.round(nonce / s))} Hashes/s`;
    el.meter.style.transform = `scaleX(${Math.min(1, nonce / (expected * 2))})`;
    showHash(hex);
  }

  async function done({ nonce, hex, attempts, ms }) {
    stop(false);
    el.n.textContent = nf.format(attempts);
    el.meter.style.transform = `scaleX(${Math.min(1, attempts / (expected * 2))})`;
    showHash(hex, true);
    // the server's side: one single hash
    const check = await sha256Hex(challenge + String(nonce));
    if (destroyed) return;
    const ok = check === hex;
    const seconds = sec.format(ms / 1000);
    const rate = ms > 0 ? Math.round(attempts / (ms / 1000)) : 0;
    // the live readout ends on the same rate as the result line (one number, not two)
    el.rate.textContent = rate ? `${nf.format(rate)} Hashes/s` : "";
    const head = `Gefunden nach ${nf.format(attempts)} Versuchen in ${seconds} Sekunden: ${hex.slice(0, zeros + 4)}…`;
    el.result.hidden = false;
    el.result.dataset.hash = hex;
    el.result.dataset.nonce = String(nonce);
    el.result.dataset.challenge = challenge;
    el.result.innerHTML = "";
    const p1 = document.createElement("span");
    p1.className = "ph-result-head";
    p1.textContent = head;
    const p2 = document.createElement("span");
    p2.className = "ph-result-proof meta";
    p2.textContent = ok
      ? `Zahl ${nf.format(nonce)} · rund ${nf.format(rate)} Hashes pro Sekunde · Gegenprobe mit einem einzigen Hash: passt.`
      : "Gegenprobe fehlgeschlagen.";
    el.result.append(p1, p2);
    say(head);
    if (!motion.calm) el.result.animate([{ opacity: 0, transform: "translateY(6px)" }, { opacity: 1, transform: "none" }], { duration: 260, easing: "cubic-bezier(.2,0,0,1)" });
    el.go.textContent = "Noch mal";
  }

  function stop(announce = true) {
    if (worker) {
      worker.terminate();
      worker = null;
      delete root.__worker;
    }
    setBusy(false);
    if (announce) say("Abgebrochen.");
  }

  const onGo = () => start();
  const onStop = () => stop(true);
  const onKey = (e) => {
    if (e.key === "Escape" && root.contains(document.activeElement) && document.activeElement !== root) {
      e.preventDefault();
      root.focus({ preventScroll: true });
    }
  };
  el.go.addEventListener("click", onGo);
  el.stop.addEventListener("click", onStop);
  root.addEventListener("keydown", onKey);

  return {
    pause() {},
    resume() {},
    destroy() {
      destroyed = true;
      stop(false);
      root.removeEventListener("keydown", onKey);
      root.removeEventListener("change", onLevel);
      root.replaceChildren();
    },
  };
}
