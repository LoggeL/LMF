#!/usr/bin/env node
/**
 * Dev tool: renders one loop of the MelodAI Probestück („Zwei Regler“) offline, so the singing
 * voice can be listened to without opening the page.
 *
 *   node scripts/render-melodai.mjs      writes work/melodai-vocal-solo.wav and work/melodai-mix.wav
 *
 * Runs js/probes/src/singer.js in headless Chromium (Playwright) on an OfflineAudioContext; the
 * files are served straight from disk through page.route (no server needed). The instrumental here
 * re-creates mixer.js's bass + pad (same score, same envelopes) because those live inside its
 * mount() closure. Levels follow the page: faders 80 / 70 % (squared), master 0.15; each file is
 * then normalised to a −1.2 dBFS sample peak (so the true peak stays under −1 dBTP). A 0.1 s
 * pre-roll lets the first word's early voice onset and scoop start before its beat.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { chromium } from "@playwright/test";

const ROOT = new URL("../", import.meta.url);
const ORIGIN = "http://lmf.render";
const TYPES = { js: "text/javascript", html: "text/html" };

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  page.on("pageerror", (e) => console.error("page error:", e.message));
  await page.route(`${ORIGIN}/**`, (route) => {
    const path = new URL(route.request().url()).pathname.slice(1) || "index.html";
    if (path === "index.html") return route.fulfill({ contentType: TYPES.html, body: "<!doctype html><title>render</title>" });
    try {
      route.fulfill({ contentType: TYPES[path.split(".").pop()] ?? "application/octet-stream", body: readFileSync(new URL(path, ROOT)) });
    } catch {
      route.fulfill({ status: 404, body: "" });
    }
  });
  await page.goto(`${ORIGIN}/`);
  const out = await page.evaluate(async () => {
    const { buildScore, BEAT } = await import("/js/probes/src/mixer.js");
    const { singer } = await import("/js/probes/src/singer.js");
    const score = buildScore();
    const LOOP = score.beats * BEAT;
    const SR = 44100;
    const hz = (m) => 440 * 2 ** ((m - 69) / 12);
    const PRE = 0.1;

    async function render(withIns) {
      const ac = new OfflineAudioContext(2, Math.ceil((PRE + LOOP + 1.5) * SR), SR);
      const master = ac.createGain();
      master.gain.value = 0.15;
      master.connect(ac.destination);
      const voc = ac.createGain();
      voc.gain.value = 0.8 ** 2;
      voc.connect(master);
      const ins = ac.createGain();
      ins.gain.value = 0.7 ** 2;
      ins.connect(master);
      const env = (g, at, dur, peak, a, r) => {
        g.gain.setValueAtTime(0, at);
        g.gain.linearRampToValueAtTime(peak, at + a);
        g.gain.setValueAtTime(peak, at + Math.max(a, dur - r));
        g.gain.linearRampToValueAtTime(0, at + dur);
      };
      const s = singer(ac, voc, score, BEAT);
      for (let b = 0; b < score.beats; b++) s.beat(b, PRE + b * BEAT);
      s.stop(PRE + LOOP + 1.2);
      if (withIns) {
        for (const n of score.bass) {
          const o = ac.createOscillator();
          o.type = "triangle";
          o.frequency.value = hz(n.midi);
          const g = ac.createGain();
          env(g, PRE + n.start * BEAT, n.dur * BEAT, 0.9, 0.01, 0.06);
          o.connect(g).connect(ins);
          o.start(PRE + n.start * BEAT);
          o.stop(PRE + (n.start + n.dur) * BEAT + 0.02);
        }
        for (const n of score.pad) {
          const lp = ac.createBiquadFilter();
          lp.frequency.value = 1200;
          lp.Q.value = 0.5;
          const g = ac.createGain();
          env(g, PRE + n.start * BEAT, n.dur * BEAT, 0.16, 0.12, 0.3);
          lp.connect(g).connect(ins);
          for (const m of n.triad) {
            const o = ac.createOscillator();
            o.type = "square";
            o.frequency.value = hz(m);
            o.detune.value = (Math.random() - 0.5) * 8;
            o.connect(lp);
            o.start(PRE + n.start * BEAT);
            o.stop(PRE + (n.start + n.dur) * BEAT + 0.02);
          }
        }
      }
      const buf = await ac.startRendering();
      await new Promise((r) => setTimeout(r, 50)); // let onended run
      const ch = [buf.getChannelData(0), buf.getChannelData(1)];
      let peak = 0;
      let sum = 0;
      let bad = 0;
      for (const c of ch)
        for (const v of c) {
          if (!Number.isFinite(v)) bad++;
          else {
            peak = Math.max(peak, Math.abs(v));
            sum += v * v;
          }
        }
      const stats = { peak, rms: Math.sqrt(sum / (ch[0].length * 2)), bad, alive: s.alive };
      // 16-bit PCM WAV, normalised to −1.2 dBFS
      const k = peak ? 0.87 / peak : 1;
      const n = ch[0].length;
      const view = new DataView(new ArrayBuffer(44 + n * 4));
      const str = (o, t) => [...t].forEach((c, i) => view.setUint8(o + i, c.charCodeAt(0)));
      str(0, "RIFF");
      view.setUint32(4, 36 + n * 4, true);
      str(8, "WAVEfmt ");
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true);
      view.setUint16(22, 2, true);
      view.setUint32(24, SR, true);
      view.setUint32(28, SR * 4, true);
      view.setUint16(32, 4, true);
      view.setUint16(34, 16, true);
      str(36, "data");
      view.setUint32(40, n * 4, true);
      for (let i = 0; i < n; i++)
        for (let c = 0; c < 2; c++) view.setInt16(44 + i * 4 + c * 2, Math.max(-1, Math.min(1, (ch[c][i] || 0) * k)) * 32767, true);
      const bytes = new Uint8Array(view.buffer);
      let bin = "";
      for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
      return { wav: btoa(bin), stats };
    }
    return { solo: await render(false), mix: await render(true), seconds: LOOP };
  });
  mkdirSync(new URL("work/", ROOT), { recursive: true });
  for (const [name, r] of [["melodai-vocal-solo", out.solo], ["melodai-mix", out.mix]]) {
    writeFileSync(new URL(`work/${name}.wav`, ROOT), Buffer.from(r.wav, "base64"));
    const { peak, rms, bad, alive } = r.stats;
    console.log(`work/${name}.wav  loop ${out.seconds.toFixed(2)} s · raw peak ${peak.toFixed(3)} · rms ${rms.toFixed(4)} · non-finite ${bad} · live sources after stop ${alive}`);
  }
} finally {
  await browser.close();
}
