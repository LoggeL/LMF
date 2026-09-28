/**
 * GL gate  [WP3]  — §5.1 gate: WebGL(2) && !calm && !saveData && !reduced-data && coarse device check.
 * motion.gpuOk() (LEAD) covers calm, saveData, deviceMemory and cores; this adds what WP3 owns:
 * prefers-reduced-data and a real context probe on a throwaway canvas, run once per kind and cached,
 * so no js/gl/* module is ever requested on a device that could not run it.
 */
const probed = new Map();

function probe(kind) {
  if (probed.has(kind)) return probed.get(kind);
  let ok = false;
  try {
    const c = document.createElement("canvas");
    c.width = c.height = 1;
    const gl = c.getContext(kind);
    ok = Boolean(gl);
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    ok = false;
  }
  probed.set(kind, ok);
  return ok;
}

export function reducedData() {
  try {
    return matchMedia("(prefers-reduced-data: reduce)").matches;
  } catch {
    return false;
  }
}

/** @param {object} motion  ctx.motion  @param {"webgl2"|"webgl"} kind */
export function glOk(motion, kind = "webgl2") {
  if (!motion?.gpuOk?.() || reducedData()) return false;
  return probe(kind);
}
