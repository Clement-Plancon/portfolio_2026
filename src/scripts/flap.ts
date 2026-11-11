// Split-flap effect: each cell shuffles through characters before settling on its own.
// One requestAnimationFrame loop for all cells; ticks every ~55 ms like a mechanical board.

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const TICK = 55;

export function flap(root: HTMLElement, delay = 0) {
  const cells = [...root.querySelectorAll<HTMLElement>('.f')].map((el, i) => ({
    el,
    final: el.textContent ?? '',
    // Cells settle left to right, with a little irregularity so the board feels mechanical.
    flips: 4 + i + ((i * 7) % 5),
    done: false,
  }));
  if (!cells.length) return;
  let last = 0;
  let tick = 0;
  const start = performance.now() + delay;

  const frame = (now: number) => {
    if (now < start) return requestAnimationFrame(frame);
    if (now - last < TICK) return requestAnimationFrame(frame);
    last = now;
    tick++;
    let pending = false;
    for (const c of cells) {
      if (c.done) continue;
      if (tick >= c.flips || c.final === ' ') {
        c.el.textContent = c.final;
        c.done = true;
      } else {
        c.el.textContent = GLYPHS[(tick * 7 + c.flips * 13) % GLYPHS.length];
        pending = true;
      }
    }
    if (pending) requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
