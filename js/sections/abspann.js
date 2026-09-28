/**
 * Abspann: generated credits (spec §2.7, §5.11)  [WP5]
 *
 * The credits come prerendered from js/render/credits.js (rendered here if the block is
 * still empty). With JS they sit in a fixed window (max min(640px, 80svh)) instead of
 * taking 2–3 screens of page:
 *  - not calm: the reel rolls upward like end credits, a 60 s linear loop (CSS transform
 *    only). It stops while the window is off screen, hovered or focused, and under the
 *    „Bewegung pausieren“ toggle or reduced motion.
 *  - calm: the reel stands still at the title; the window fades out at the bottom.
 *  - „Alles zeigen“ (aria-expanded) opens the window to full height and stops the roll.
 * Without JS the prerendered credits are simply the full list.
 */
import renderCredits from "../render/credits.js";

const LOOP_S = 60;

export async function mount(root, ctx) {
  const { motion } = ctx;
  const data = await ctx.data;
  const roll = root.querySelector('[data-mount="abspann"]') ?? root.querySelector(".abspann-roll");
  if (!roll) return { destroy() {} };

  if (!roll.querySelector(".credits") && data) {
    const markup = renderCredits(data, { bindings: data.bindings });
    if (markup) roll.insertAdjacentHTML("beforeend", markup);
  }
  if (!roll.querySelector(".credits")) return { destroy() {} };

  // stage > window (fixed height, masked edges) > reel (moves). Prerendered nodes are moved,
  // not re-rendered.
  const stage = document.createElement("div");
  stage.className = "abspann-stage screen";
  const win = document.createElement("div");
  win.className = "credits-window";
  win.id = "abspann-window";
  const reel = document.createElement("div");
  reel.className = "credits-reel";
  for (const node of [...roll.childNodes]) if (node.nodeType === 1 || node.textContent.trim()) reel.append(node);
  win.append(reel);
  stage.append(win);
  const more = document.createElement("button");
  more.type = "button";
  more.className = "abspann-more chip";
  more.setAttribute("aria-expanded", "false");
  more.setAttribute("aria-controls", win.id);
  more.textContent = "Alles zeigen";
  roll.append(stage, more);
  root.classList.add("is-windowed");

  let open = false;
  function measure() {
    const winH = win.clientHeight;
    const reelH = reel.offsetHeight;
    // Enters from the bottom edge, leaves over the top edge; the loop starts with the title
    // already a little way in, so the window is never empty when you arrive.
    const from = winH;
    const to = -reelH;
    roll.style.setProperty("--roll-from", `${from}px`);
    roll.style.setProperty("--roll-to", `${to}px`);
    roll.style.setProperty("--roll-dur", `${LOOP_S}s`);
    roll.style.setProperty("--roll-delay", `${(-((from - winH * 0.12) / (from - to)) * LOOP_S).toFixed(2)}s`);
  }
  function sync() {
    const rolling = !open && !motion.calm;
    root.classList.toggle("is-rolling", rolling);
    root.classList.toggle("is-all", open);
    if (rolling) measure();
  }

  const onMore = () => {
    open = !open;
    more.setAttribute("aria-expanded", String(open));
    more.textContent = open ? "Weniger zeigen" : "Alles zeigen";
    sync();
    if (!open) stage.scrollIntoView({ block: "nearest", behavior: motion.scrollBehavior });
  };
  more.addEventListener("click", onMore);

  const io = new IntersectionObserver((entries) => {
    root.classList.toggle("is-offscreen", !entries.some((e) => e.isIntersecting));
  });
  io.observe(stage);
  const ro = new ResizeObserver(() => root.classList.contains("is-rolling") && measure());
  ro.observe(win);
  ro.observe(reel);
  const offCalm = motion.onCalmChange(sync);
  sync();

  return {
    destroy() {
      io.disconnect();
      ro.disconnect();
      offCalm();
      more.removeEventListener("click", onMore);
    },
  };
}
