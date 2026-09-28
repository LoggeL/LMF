/**
 * Film grain tile (§5.8)  [WP3]
 * A 128 × 128 noise tile, generated once on a 2D canvas, handed to CSS as --grain-tile.
 * css/fx.css animates it with steps(6) at 12 fps (static when calm). Used when the projector's GL
 * path is off or unavailable.
 */
let url = null;

export function grainTile() {
  if (url) return Promise.resolve(url);
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d");
  if (!g) return Promise.resolve(null);
  const img = g.createImageData(128, 128);
  let s = 0x2f6b1d; // fixed seed: same tile every time
  for (let i = 0; i < img.data.length; i += 4) {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    const v = 128 + (((s >>> 0) % 256) - 128) * 0.9;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  return new Promise((resolve) => {
    c.toBlob((blob) => {
      url = blob ? URL.createObjectURL(blob) : c.toDataURL();
      resolve(url);
    });
  });
}

/** Sets --grain-tile on el (and marks it data-grain) once the tile exists. */
export async function applyGrain(el) {
  const u = await grainTile();
  if (u && el?.isConnected) {
    el.style.setProperty("--grain-tile", `url("${u}")`);
    el.dataset.grain = "";
  }
}
