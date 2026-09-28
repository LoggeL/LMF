/**
 * Hashsuche worker  [WP4]  · spec §5.7d
 *
 * The same search as static/pow-worker.js in LoggeL/TranscripatorWeb (commit e2c5b17):
 *   input = challenge + nonce.toString();  SHA-256 via crypto.subtle;  stop at N leading hex zeros.
 * One hash per await, exactly like the original loop, so it also takes about as long as there.
 *
 * in:  { challenge: string, zeros: number }
 * out: { type: "progress", nonce, hex }      (≤ 10 per second)
 *      { type: "done", nonce, hex, attempts, ms }
 */

const BATCH = 1;

self.onmessage = async ({ data }) => {
  const { challenge, zeros } = data;
  const prefix = "0".repeat(zeros);
  const enc = new TextEncoder();
  const t0 = performance.now();
  let lastReport = t0;
  let nonce = 0;
  const toHex = (buf) => {
    const b = new Uint8Array(buf);
    let s = "";
    for (let i = 0; i < b.length; i++) s += b[i].toString(16).padStart(2, "0");
    return s;
  };
  for (;;) {
    const jobs = [];
    for (let i = 0; i < BATCH; i++) jobs.push(crypto.subtle.digest("SHA-256", enc.encode(challenge + (nonce + i).toString())));
    const hashes = await Promise.all(jobs);
    for (let i = 0; i < BATCH; i++) {
      const hex = toHex(hashes[i]);
      if (hex.startsWith(prefix)) {
        const found = nonce + i;
        self.postMessage({ type: "done", nonce: found, hex, attempts: found + 1, ms: performance.now() - t0 });
        return;
      }
    }
    nonce += BATCH;
    const now = performance.now();
    if (now - lastReport >= 100) {
      lastReport = now;
      self.postMessage({ type: "progress", nonce, hex: toHex(hashes[BATCH - 1]) });
    }
  }
};
