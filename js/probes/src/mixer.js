/**
 * Probestück · Zwei Regler (MelodAI)  [WP4]  · Nachbau · spec §5.7b
 *
 * Source for the mechanic: README of LoggeL/MelodAI — „Web Audio API with dual GainNodes
 * (vocals + instrumental)“ and „real-time word-highlighting, independent vocal/instrumental volume“.
 *
 * What is NOT from MelodAI: the song. The lyrics are lines from this website's own copy, and
 * both stems are synthesized right here (original, no samples):
 *   Instrumental = triangle bass on the chord roots + square-wave pad through a 1.2 kHz lowpass
 *   Gesang       = sine lead with vibrato, one note per word from C-major pentatonic
 * Each stem → its own GainNode ← its fader → master gain 0.15. No sound before „Ton an“, ever.
 */

import { announcer, calmSource, nextId } from "./index.js";

export const KIND = "nachbau";
export const CHIP = "Nachbau: Statt eines echten Songs singt hier diese Website, mit selbst erzeugten Tönen. Wie im Original laufen Gesang und Instrumental über zwei getrennte Regler.";

/* ── Score (pure data) ─────────────────────────────────────────────────────────────────────────── */

export const BPM = 96;
export const BEAT = 60 / BPM; // 0.625 s
const BEATS_PER_LINE = 8;

/**
 * Lyrics: verbatim lines of this site's copy (hero H1, Werkstatt H2 + lead, Kontakt aside).
 * Timing table: one word per beat from the start of its line; the last word holds.
 * Melody: MIDI notes from C-major pentatonic (C D E G A).
 */
export const SONG = [
  { words: ["Aus", "Neugier.", "Gemacht."], notes: [67, 69, 72], hold: 3, chords: ["C", "Am"] },
  { words: ["Ich", "wollte", "wissen,", "ob", "das", "geht."], notes: [69, 67, 69, 72, 72, 74], hold: 2, chords: ["F", "G"] },
  { words: ["So", "fangen", "ziemlich", "viele", "meiner", "Projekte", "an."], notes: [64, 67, 69, 67, 64, 62, 69], hold: 1, chords: ["C", "Am"] },
  { words: ["Das", "Feuer", "ist", "noch", "an."], notes: [72, 69, 67, 69, 72], hold: 4, chords: ["F", "C"] },
].map((line) => ({ ...line, text: line.words.join(" ") }));

const CHORDS = {
  C: { root: 36, triad: [60, 64, 67] },
  Am: { root: 33, triad: [57, 60, 64] },
  F: { root: 29, triad: [57, 60, 65] },
  G: { root: 31, triad: [59, 62, 67] },
};

export const hz = (midi) => 440 * Math.pow(2, (midi - 69) / 12);

/** Flat timeline in beats. */
export function buildScore(song = SONG) {
  const words = [];
  const lead = [];
  const bass = [];
  const pad = [];
  song.forEach((line, li) => {
    const start = li * BEATS_PER_LINE;
    line.words.forEach((w, wi) => {
      const last = wi === line.words.length - 1;
      const dur = last ? line.hold : 1;
      words.push({ line: li, index: wi, text: w, start: start + wi, dur });
      lead.push({ start: start + wi, dur: dur * 0.92, midi: line.notes[wi] });
    });
    line.chords.forEach((name, bi) => {
      const ch = CHORDS[name];
      const bar = start + bi * 4;
      pad.push({ start: bar, dur: 4, triad: ch.triad });
      bass.push({ start: bar, dur: 0.9, midi: ch.root });
      bass.push({ start: bar + 1, dur: 0.4, midi: ch.root + 12 });
      bass.push({ start: bar + 2, dur: 0.9, midi: ch.root + 7 });
      bass.push({ start: bar + 3, dur: 0.4, midi: ch.root + 12 });
    });
  });
  return { words, lead, bass, pad, beats: song.length * BEATS_PER_LINE };
}

/* ── Toy (DOM + Web Audio) ─────────────────────────────────────────────────────────────────────── */

export function mount(root, ctx = {}) {
  const motion = calmSource(ctx);
  const say = announcer(ctx);
  const score = buildScore();
  const LOOP = score.beats * BEAT;
  const ids = { how: nextId("pm-how"), voc: nextId("pm-voc"), ins: nextId("pm-ins") };

  root.classList.add("probe", "probe-mixer");
  root.tabIndex = -1;
  const linesHtml = SONG.map(
    (line, li) =>
      `<p class="pm-line" data-line="${li}">${line.words.map((w, wi) => `<span class="pm-w" data-w="${li}-${wi}">${w}</span>`).join(" ")}</p>`,
  ).join("");
  root.innerHTML = `
    <div class="pm-deck">
      <div class="pm-screen" tabindex="0" role="group" aria-roledescription="Karaoke-Anzeige" aria-label="MelodAI-Nachbau, Karaoke-Anzeige" aria-describedby="${ids.how}">
        <p class="pm-hud meta" aria-hidden="true">
          <span class="pm-hud-tag">MelodAI · Nachbau</span>
          <span><span data-pm="bpm">${BPM}</span> BPM · Zeile <b data-pm="lineNo">1</b>/${SONG.length}</span>
          <span data-pm="clock">0:00</span>
        </p>
        <div class="pm-lyrics" aria-hidden="true"><div class="pm-roll">${linesHtml}</div></div>
        <p class="pm-now vh" data-pm="now"></p>
        <p class="pm-you" data-pm="you" hidden><span>Jetzt du.</span></p>
        <div class="pm-progress" aria-hidden="true"><i data-pm="bar"></i>${SONG.map(() => "<b></b>").join("")}</div>
      </div>
      <div class="pm-desk" role="group" aria-label="Mischpult">
        ${channel("voc", "Gesang", ids.voc, 80)}
        ${channel("ins", "Instrumental", ids.ins, 70)}
      </div>
    </div>
    <div class="probe-toolbar">
      <button class="button probe-btn" type="button" data-pm="play"><svg class="i" aria-hidden="true" focusable="false"><use href="#i-play"></use></svg><span data-pm="playLabel">Abspielen</span></button>
      <button class="button button--ghost probe-btn" type="button" data-pm="restart">Von vorn</button>
      <button class="button button--ghost probe-btn pm-sound" type="button" data-pm="sound" aria-pressed="false"><span class="pm-led" aria-hidden="true"></span>Ton an</button>
      <p class="probe-readout meta pm-note" data-pm="soundnote">Ohne „Ton an“ bleibt es still.</p>
    </div>
    <p class="probe-howto" id="${ids.how}">Regler ziehen oder mit Pfeiltasten stellen · Leertaste auf der Anzeige: Abspielen/Pause · Gesang auf 0: jetzt singst du</p>`;

  function channel(key, label, id, value) {
    return `<div class="pm-ch" data-ch="${key}">
      <label class="pm-ch-label meta" for="${id}">${label}</label>
      <canvas class="pm-wave" data-wave="${key}" aria-hidden="true"></canvas>
      <div class="pm-fader-slot">
        <input class="pm-fader" id="${id}" type="range" min="0" max="100" step="1" value="${value}" aria-valuetext="${value} Prozent" data-fader="${key}" />
      </div>
      <span class="pm-ch-val meta" aria-hidden="true" data-val="${key}">${value} %</span>
    </div>`;
  }

  const q = (sel) => root.querySelector(sel);
  const el = {
    screen: q(".pm-screen"),
    lyrics: q(".pm-lyrics"),
    roll: q(".pm-roll"),
    lines: [...root.querySelectorAll(".pm-line")],
    words: [...root.querySelectorAll(".pm-w")],
    you: q('[data-pm="you"]'),
    now: q('[data-pm="now"]'),
    lineNo: q('[data-pm="lineNo"]'),
    clock: q('[data-pm="clock"]'),
    bar: q('[data-pm="bar"]'),
    play: q('[data-pm="play"]'),
    playLabel: q('[data-pm="playLabel"]'),
    restart: q('[data-pm="restart"]'),
    sound: q('[data-pm="sound"]'),
    note: q('[data-pm="soundnote"]'),
    voc: q('[data-fader="voc"]'),
    ins: q('[data-fader="ins"]'),
    vocVal: q('[data-val="voc"]'),
    insVal: q('[data-val="ins"]'),
    waves: { voc: q('[data-wave="voc"]'), ins: q('[data-wave="ins"]') },
  };

  const css = getComputedStyle(root);
  const cv = (name, fallback) => css.getPropertyValue(name).trim() || fallback; // built in, should probes.css fail
  const C = { voc: cv("--pm-voc", "#86aeff"), ins: cv("--pm-ins", "#e9c46a"), line: cv("--pm-grid", "rgb(154 163 189 / 0.22)") };

  let playing = false;
  let pos = 0; // seconds into the loop (when stopped)
  let originPerf = 0; // performance.now()/1000 − pos
  let raf = 0;
  let destroyed = false;
  let paused = false; // motion toggle / external pause
  let attractUntil = -1; // beat at which the one-time attract run stops
  let touched = false;
  let activeLine = -1;
  let activeWord = -1;
  let level = { voc: 0.8, ins: 0.7 };

  /* audio (created lazily on „Ton an“) */
  let ac = null;
  let bus = null; // per-session gain; dropping it silences scheduled notes at once
  let gains = null;
  let analysers = null;
  let schedTimer = 0;
  let nextBeat = 0; // absolute beat index scheduled up to
  let originAudio = 0; // ac.currentTime − pos
  let soundOn = false;

  const now = () => {
    if (!playing) return pos;
    if (soundOn && ac) return ac.currentTime - originAudio;
    return performance.now() / 1000 - originPerf;
  };
  const loopPos = (t) => ((t % LOOP) + LOOP) % LOOP;
  const fmtClock = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  /* ── transport ── */
  function play({ attract = false } = {}) {
    if (playing || destroyed) return;
    playing = true;
    originPerf = performance.now() / 1000 - pos;
    if (soundOn && ac) startAudio();
    if (!attract) attractUntil = -1;
    setTransport(true);
    loop();
  }
  function stop() {
    if (!playing) return;
    pos = now();
    playing = false;
    stopAudio();
    setTransport(false);
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    render(true);
  }
  /** The label says what the button does next (a toggle whose label changes carries no aria-pressed). */
  function setTransport(on) {
    el.playLabel.textContent = on ? "Pause" : "Abspielen";
    el.play.querySelector("use").setAttribute("href", on ? "#i-pause" : "#i-play");
    emit({ playing: on });
  }
  // the chapter's pipeline listens (meister.js): steps 05–06 glow while the song runs
  const emit = (detail) => root.dispatchEvent(new CustomEvent("lmf:probe", { bubbles: true, detail }));
  function restart() {
    const was = playing;
    if (was) stop();
    pos = 0;
    activeLine = -1;
    activeWord = -1;
    for (const w of el.words) resetWord(w);
    render(true);
    if (was) play();
  }

  function loop() {
    raf = 0;
    if (!playing || destroyed || paused) return;
    const t = now();
    if (attractUntil >= 0 && t / BEAT >= attractUntil) {
      stop();
      attractUntil = -1;
      return;
    }
    render();
    raf = requestAnimationFrame(loop);
  }

  /* ── audio ── */
  function ensureAudio() {
    if (ac) return true;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ac = new AC();
    const master = ac.createGain();
    master.gain.value = 0.15;
    master.connect(ac.destination);
    gains = { voc: ac.createGain(), ins: ac.createGain() };
    analysers = { voc: ac.createAnalyser(), ins: ac.createAnalyser() };
    for (const k of ["voc", "ins"]) {
      analysers[k].fftSize = 1024;
      gains[k].gain.value = curve(level[k]);
      gains[k].connect(analysers[k]);
      analysers[k].connect(master);
    }
    return true;
  }
  const curve = (v) => v * v; // fader law: gentle at the bottom, like a real desk

  function startAudio() {
    if (!ac) return;
    ac.resume?.();
    bus = { voc: ac.createGain(), ins: ac.createGain() };
    bus.voc.connect(gains.voc);
    bus.ins.connect(gains.ins);
    const t = now();
    originAudio = ac.currentTime - t;
    nextBeat = Math.floor(t / BEAT);
    schedule();
    clearInterval(schedTimer);
    schedTimer = setInterval(schedule, 25);
  }
  function stopAudio() {
    clearInterval(schedTimer);
    schedTimer = 0;
    if (bus && ac) {
      const old = bus;
      const t = ac.currentTime;
      for (const g of [old.voc, old.ins]) {
        g.gain.setValueAtTime(g.gain.value, t);
        g.gain.linearRampToValueAtTime(0, t + 0.04);
      }
      const ctxAt = ac;
      setTimeout(() => {
        old.voc.disconnect();
        old.ins.disconnect();
        // nothing sounds any more: let the audio thread sleep until the next „Abspielen“
        if (!bus && ac === ctxAt && ac.state === "running") ac.suspend?.();
      }, 80);
    } else if (ac && ac.state === "running") ac.suspend?.();
    bus = null;
  }
  /** Look-ahead scheduler (25 ms tick, 120 ms horizon). */
  function schedule() {
    if (!ac || !bus || !playing) return;
    const horizon = ac.currentTime + 0.12;
    while (originAudio + nextBeat * BEAT < horizon) {
      const b = nextBeat;
      const inLoop = ((b % score.beats) + score.beats) % score.beats;
      const at = originAudio + b * BEAT;
      for (const n of score.lead) if (n.start === inLoop) voice(at, n.dur * BEAT, hz(n.midi));
      for (const n of score.bass) if (Math.floor(n.start) === inLoop) bassNote(at + (n.start - inLoop) * BEAT, n.dur * BEAT, hz(n.midi));
      for (const n of score.pad) if (n.start === inLoop) padChord(at, n.dur * BEAT, n.triad.map(hz));
      nextBeat++;
    }
  }
  function env(g, at, dur, peak, a = 0.02, r = 0.08) {
    const t0 = Math.max(at, ac.currentTime);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(peak, t0 + a);
    g.gain.setValueAtTime(peak, t0 + Math.max(a, dur - r));
    g.gain.linearRampToValueAtTime(0, t0 + dur);
  }
  function voice(at, dur, f) {
    const o = ac.createOscillator();
    o.type = "sine";
    o.frequency.value = f;
    const lfo = ac.createOscillator();
    lfo.frequency.value = 5.5;
    const depth = ac.createGain();
    depth.gain.setValueAtTime(0, at);
    depth.gain.linearRampToValueAtTime(f * 0.012, at + Math.min(0.25, dur)); // vibrato blooms in
    lfo.connect(depth).connect(o.frequency);
    const g = ac.createGain();
    env(g, at, dur, 0.9, 0.03, 0.09);
    o.connect(g).connect(bus.voc);
    o.start(at);
    lfo.start(at);
    o.stop(at + dur + 0.02);
    lfo.stop(at + dur + 0.02);
  }
  function bassNote(at, dur, f) {
    const o = ac.createOscillator();
    o.type = "triangle";
    o.frequency.value = f;
    const g = ac.createGain();
    env(g, at, dur, 0.9, 0.01, 0.06);
    o.connect(g).connect(bus.ins);
    o.start(at);
    o.stop(at + dur + 0.02);
  }
  function padChord(at, dur, fs) {
    const lp = ac.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 1200;
    lp.Q.value = 0.5;
    const g = ac.createGain();
    env(g, at, dur, 0.16, 0.12, 0.3);
    lp.connect(g).connect(bus.ins);
    for (const f of fs) {
      const o = ac.createOscillator();
      o.type = "square";
      o.frequency.value = f;
      o.detune.value = (Math.random() - 0.5) * 8;
      o.connect(lp);
      o.start(at);
      o.stop(at + dur + 0.02);
    }
  }

  function setSound(on) {
    if (on && !ensureAudio()) {
      el.note.textContent = "Dein Browser kann hier keinen Ton erzeugen.";
      return;
    }
    soundOn = on;
    el.sound.setAttribute("aria-pressed", String(on));
    el.note.textContent = on ? "Ton läuft. Synthetisiert, keine Aufnahme." : "Ohne „Ton an“ bleibt es still.";
    if (on) {
      if (playing) {
        const t = now();
        originPerf = performance.now() / 1000 - t;
        pos = t;
        startAudio();
      } else play();
    } else {
      if (playing) {
        const t = now();
        stopAudio();
        originPerf = performance.now() / 1000 - t;
      }
      ac?.suspend?.();
    }
    say(on ? "Ton an." : "Ton aus.");
  }

  /* ── faders ── */
  function onFader(e) {
    const key = e.target.dataset.fader;
    const v = Number(e.target.value);
    level[key] = v / 100;
    e.target.setAttribute("aria-valuetext", `${v} Prozent`);
    (key === "voc" ? el.vocVal : el.insVal).textContent = `${v} %`;
    root.style.setProperty(`--pm-${key}-level`, String(v / 100));
    if (gains) gains[key].gain.setTargetAtTime(curve(level[key]), ac.currentTime, 0.015);
    if (key === "voc") setSilent(v === 0);
    touched = true;
    if (!raf) render(true);
  }
  function setSilent(silent) {
    if (el.you.hidden === !silent) return;
    el.you.hidden = !silent;
    el.lyrics.classList.toggle("is-silent", silent);
    if (silent) {
      say("Gesang aus. Jetzt du.");
      if (!motion.calm) el.you.animate([{ opacity: 0, transform: "scale(1.08)" }, { opacity: 1, transform: "none" }], { duration: 420, easing: "cubic-bezier(.34,1.56,.64,1)" });
    }
  }

  /* ── render ── */
  function resetWord(w) {
    w.style.backgroundPosition = "";
    w.classList.remove("is-sung", "is-on");
  }
  function render(force = false) {
    const t = now();
    const lt = loopPos(t);
    const beat = lt / BEAT;
    const calm = motion.calm;
    el.clock.textContent = fmtClock(lt);
    el.bar.style.transform = `scaleX(${lt / LOOP})`;

    let wIndex = -1;
    for (let i = 0; i < score.words.length; i++) {
      const w = score.words[i];
      if (beat >= w.start && beat < w.start + Math.max(w.dur, 1)) wIndex = i;
    }
    const line = Math.min(SONG.length - 1, Math.floor(beat / BEATS_PER_LINE));
    if (line !== activeLine || force) setLine(line, force);

    // word sweep
    score.words.forEach((w, i) => {
      const span = el.words[i];
      if (w.line !== line) {
        if (span.classList.contains("is-sung") || span.classList.contains("is-on")) resetWord(span);
        return;
      }
      const k = (beat - w.start) / w.dur;
      if (k >= 1) {
        span.classList.add("is-sung");
        span.classList.remove("is-on");
        span.style.backgroundPosition = "0% 0";
      } else if (k >= 0) {
        span.classList.add("is-on");
        span.style.backgroundPosition = calm ? "0% 0" : `${(1 - k) * 100}% 0`;
      } else resetWord(span);
    });
    if (wIndex !== activeWord) {
      activeWord = wIndex;
    }
    drawWaves(t, beat);
  }
  function setLine(line, instant) {
    const prev = activeLine;
    activeLine = line;
    el.lineNo.textContent = line + 1;
    el.lines.forEach((p, i) => {
      p.classList.toggle("is-active", i === line);
      p.classList.toggle("is-past", i < line);
    });
    const target = el.lines[line];
    const offset = target.offsetTop + target.offsetHeight / 2 - el.lyrics.clientHeight / 2;
    const calm = motion.calm;
    el.roll.style.transition = instant || calm || prev === -1 ? "none" : "";
    el.roll.style.transform = `translateY(${-Math.max(0, offset)}px)`;
    if (playing) {
      el.now.textContent = SONG[line].text;
      if (line !== prev) emit({ playing, line });
    }
  }

  /* waves: analyser data when sound is on, the score's own envelope when it is off */
  const waveCtx = {};
  function sizeWaves() {
    for (const k of ["voc", "ins"]) {
      const c = el.waves[k];
      const dpr = Math.min(2, devicePixelRatio || 1);
      const w = c.clientWidth || 120;
      const h = c.clientHeight || 40;
      c.width = Math.round(w * dpr);
      c.height = Math.round(h * dpr);
      waveCtx[k] = { g: c.getContext("2d"), w, h, dpr };
    }
  }
  const buf = new Uint8Array(1024);
  function drawWaves(t, beat) {
    const calm = motion.calm;
    for (const k of ["voc", "ins"]) {
      const W = waveCtx[k];
      if (!W) continue;
      const { g, w, h, dpr } = W;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, w, h);
      g.strokeStyle = C.line;
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(0, h / 2);
      g.lineTo(w, h / 2);
      g.stroke();
      g.strokeStyle = C[k];
      g.lineWidth = 1.6;
      g.beginPath();
      if (soundOn && analysers && playing) {
        analysers[k].getByteTimeDomainData(buf);
        const step = buf.length / w;
        for (let x = 0; x < w; x++) {
          const v = (buf[Math.floor(x * step)] - 128) / 128;
          const y = h / 2 + v * h * 1.6;
          x ? g.lineTo(x, y) : g.moveTo(x, y);
        }
      } else {
        const amp = envelope(k, beat) * level[k] * (playing ? 1 : 0.25);
        const phase = calm || !playing ? 0 : t * 6;
        const cycles = k === "voc" ? 3 + ((activeWord * 7) % 4) : 2;
        for (let x = 0; x <= w; x++) {
          const u = x / w;
          let v = Math.sin(u * Math.PI * 2 * cycles + phase);
          if (k === "ins") v = 0.6 * Math.sign(Math.sin(u * Math.PI * 2 * 3 + phase)) * 0.5 + 0.5 * Math.sin(u * Math.PI * 2 + phase * 0.5);
          const y = h / 2 + v * amp * (h / 2 - 3) * Math.sin(u * Math.PI);
          x ? g.lineTo(x, y) : g.moveTo(x, y);
        }
      }
      g.stroke();
    }
  }
  /** Loudness of a stem at a beat, straight from the score (used for the silent waveform). */
  function envelope(k, beat) {
    const lb = ((beat % score.beats) + score.beats) % score.beats;
    if (k === "voc") {
      const n = score.lead.find((n) => lb >= n.start && lb < n.start + n.dur);
      if (!n) return 0.05;
      const into = (lb - n.start) / n.dur;
      return 0.35 + 0.65 * Math.min(1, into * 8) * (1 - into * 0.3);
    }
    const into = lb % 1;
    return 0.55 + 0.35 * (1 - into);
  }

  /* ── events ── */
  const onPlay = () => {
    touched = true;
    paused = false;
    playing ? stop() : play();
    say(playing ? "Läuft." : "Pause.");
  };
  const onRestart = () => {
    touched = true;
    paused = false;
    restart();
  };
  const onSound = () => {
    touched = true;
    paused = false;
    setSound(!soundOn);
  };
  const onKey = (e) => {
    if (e.key === " " && e.target === el.screen) {
      e.preventDefault();
      onPlay();
    } else if (e.key === "Escape" && document.activeElement !== root) {
      // first Esc: out of the toy; the next one reaches the dialog (Werkbank closes)
      e.preventDefault();
      root.focus({ preventScroll: true });
    }
  };
  el.play.addEventListener("click", onPlay);
  el.restart.addEventListener("click", onRestart);
  el.sound.addEventListener("click", onSound);
  el.voc.addEventListener("input", onFader);
  el.ins.addEventListener("input", onFader);
  root.addEventListener("keydown", onKey);
  const ro = new ResizeObserver(() => {
    sizeWaves();
    setLine(Math.max(0, activeLine), true);
    render(true);
  });
  ro.observe(el.screen);
  const offCalm = motion.onCalmChange?.(() => render(true)) ?? (() => {});

  // attract: once, when well in view and not calm, sing the first line silently
  let io = null;
  if ("IntersectionObserver" in window) {
    io = new IntersectionObserver(
      (rec) => {
        if (!rec.some((r) => r.intersectionRatio >= 0.6)) return;
        io.disconnect();
        io = null;
        if (touched || motion.calm || paused || playing) return;
        attractUntil = BEATS_PER_LINE - 0.5;
        play({ attract: true });
      },
      { threshold: [0.6] },
    );
    io.observe(el.screen);
  }

  // leaving the viewport or the tab stops the song (and with it the audio thread)
  let away = null;
  if ("IntersectionObserver" in window) {
    away = new IntersectionObserver((rec) => {
      if (rec.some((r) => !r.isIntersecting) && playing) stop();
    });
    away.observe(el.screen);
  }
  const onVis = () => {
    if (document.hidden && playing) stop();
  };
  document.addEventListener("visibilitychange", onVis);

  sizeWaves();
  setLine(0, true);
  render(true);

  root.__probe = {
    get audio() {
      return ac;
    },
    get playing() {
      return playing;
    },
  };

  return {
    pause() {
      paused = true;
      if (playing) stop();
    },
    resume() {
      paused = false;
    },
    destroy() {
      destroyed = true;
      if (playing) emit({ playing: false });
      playing = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      clearInterval(schedTimer);
      schedTimer = 0;
      io?.disconnect();
      away?.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      ro.disconnect();
      offCalm();
      root.removeEventListener("keydown", onKey);
      if (ac) {
        try {
          ac.close();
        } catch {
          /* already closed */
        }
      }
      ac = null;
      root.replaceChildren();
      delete root.__probe;
    },
  };
}
