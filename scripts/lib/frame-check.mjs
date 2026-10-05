// Detects an illustration drawn as a picture inside a picture: a uniform light margin (cream or white) around a
// hard-edged inner panel, the most common failure of the illustration model. A full-bleed scene with a plain
// cream background is not a frame: there the background runs on past the figures, with no straight edge where
// a different picture starts. Works on the raw pixels, so it needs no model.
import sharp from 'sharp';

const close = (a, b, tol) => Math.abs(a[0] - b[0]) <= tol && Math.abs(a[1] - b[1]) <= tol && Math.abs(a[2] - b[2]) <= tol;
const lum = (c) => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];

/**
 * @param {Buffer} input image bytes
 * @returns {Promise<{framed: boolean, sides: Record<string, number|null>, reason: string}>}
 */
export async function frameCheck(input, opts = {}) {
  const AFTER = opts.after ?? 0.6, DEEPER = opts.deeper ?? 0.6;
  const { data, info } = await sharp(input).removeAlpha().resize({ width: 512 }).raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height, C = info.channels;
  const px = (x, y) => { const i = (y * W + x) * C; return [data[i], data[i + 1], data[i + 2]]; };
  const maxDepth = Math.round(Math.min(W, H) * 0.42);
  // One side: walk inward line by line; the margin is the run of lines that are almost entirely the edge colour.
  function side(name) {
    const along = name === 'left' || name === 'right' ? H : W;
    const from = Math.round(along * 0.08), to = Math.round(along * 0.92);
    const at = (k, t) => {
      if (name === 'left') return px(k, t);
      if (name === 'right') return px(W - 1 - k, t);
      if (name === 'top') return px(t, k);
      return px(t, H - 1 - k);
    };
    // Reference colour: the median of the outermost line.
    const edge = [];
    for (let t = from; t < to; t++) edge.push(at(1, t));
    const ref = [0, 1, 2].map((ch) => edge.map((c) => c[ch]).sort((a, b) => a - b)[edge.length >> 1]);
    if (lum(ref) < 185) return null; // margins are light; a dark edge is scene content
    const frac = (k) => {
      let n = 0, m = 0;
      for (let t = from; t < to; t += 1) { m++; if (close(at(k, t), ref, 14)) n++; }
      return n / m;
    };
    if (frac(1) < 0.97) return null; // the outer line itself is not uniform: no margin
    let k = 1;
    while (k < maxDepth && frac(k) >= 0.93) k++;
    if (k >= maxDepth || k < 6) return null; // uniform all the way (plain background) or no real margin
    // A frame edge is sharp: within a few lines the line becomes mostly something else, and stays that way.
    const after = Math.min(maxDepth - 1, k + 4);
    if (frac(after) > AFTER) return null; // gradual or partial change: figures or furniture entering, not a panel edge
    const deeper = Math.min(maxDepth - 1, k + 20);
    if (frac(deeper) > DEEPER) return null;
    return k; // margin depth in pixels at 512px width
  }
  const sides = { left: side('left'), right: side('right'), top: side('top'), bottom: side('bottom') };
  const found = Object.entries(sides).filter(([, d]) => d !== null);
  const scale = 1024 / W;
  // Calibrated on 165 reviewed candidates (2026-10-05): no full-bleed picture showed a margin on more than one
  // side, so two or more sides mean a panel inside the canvas.
  let framed = false, reason = 'no margin';
  if (found.length >= 2) { framed = true; reason = `margin on ${found.map(([s, d]) => `${s} ${Math.round(d * scale)}px`).join(', ')}`; }
  else if (found.length) reason = `margin on ${found.map(([s]) => s).join(', ')} only`;
  const out = {};
  for (const [s, d] of Object.entries(sides)) out[s] = d === null ? null : Math.round(d * scale);
  return { framed, sides: out, reason };
}
