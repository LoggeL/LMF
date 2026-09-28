/**
 * Spark pool (CPU)  [WP3] — §5.1: x, y, vx, vy, life, decay; gravity + drag; bounce off the bed.
 * Rendered as streaks (GL LINES head → tail) plus a bright head point, additive.
 */
export function createSparks(max = 384) {
  const s = new Float32Array(max * 6);
  const verts = new Float32Array(max * 8); // 2 vertices × (x, y, life, tail)
  let n = 0;
  let cap = max;

  return {
    get count() {
      return n;
    },
    set cap(v) {
      cap = Math.min(max, v);
      n = Math.min(n, cap);
    },
    /** Emit `count` sparks at (x, y) with base velocity (vx, vy) and a random fan. */
    emit(x, y, count, vx = 0, vy = 0.6, spread = 1, rnd = Math.random) {
      for (let k = 0; k < count && n < cap; k++, n++) {
        const a = Math.PI * 0.5 + (rnd() - 0.5) * Math.PI * 1.25 * spread;
        const sp = (0.25 + rnd() * rnd() * 1.15) * (0.6 + spread * 0.5);
        const o = n * 6;
        s[o] = x + (rnd() - 0.5) * 0.01;
        s[o + 1] = y + (rnd() - 0.5) * 0.01;
        s[o + 2] = vx + Math.cos(a) * sp;
        s[o + 3] = vy * 0.4 + Math.sin(a) * sp;
        s[o + 4] = 1;
        s[o + 5] = 0.55 + rnd() * 1.1;
      }
    },
    /** Integrates dt seconds; returns the vertex array (length = count × 8). */
    step(dt, floor) {
      const drag = Math.pow(0.985, dt * 60);
      let w = 0;
      for (let i = 0; i < n; i++) {
        const o = i * 6;
        s[o + 4] -= dt * s[o + 5];
        if (s[o + 4] <= 0) continue;
        s[o + 3] -= 1.55 * dt;
        s[o + 2] *= drag;
        s[o + 3] *= drag;
        s[o] += s[o + 2] * dt;
        s[o + 1] += s[o + 3] * dt;
        if (s[o + 1] < floor && s[o + 3] < 0) {
          s[o + 3] *= -0.3;
          s[o + 2] *= 0.55;
          s[o + 4] -= 0.3;
        }
        if (w !== i) s.copyWithin(w * 6, o, o + 6);
        w++;
      }
      n = w;
      for (let i = 0; i < n; i++) {
        const o = i * 6;
        const v = i * 8;
        const k = 0.022;
        verts[v] = s[o];
        verts[v + 1] = s[o + 1];
        verts[v + 2] = s[o + 4];
        verts[v + 3] = 0;
        verts[v + 4] = s[o] - s[o + 2] * k;
        verts[v + 5] = s[o + 1] - s[o + 3] * k;
        verts[v + 6] = s[o + 4];
        verts[v + 7] = 1;
      }
      return verts.subarray(0, n * 8);
    },
    clear() {
      n = 0;
    },
  };
}
