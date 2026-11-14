// A handwriting pad for a stylus (Xiaomi Pad, iPad with Apple Pencil, ...) or a finger.
//
// - Pointer Events work the same in Chrome on Android and Safari on iPad.
// - Palm rejection: once a stylus has been seen (even just hovering), fingers stop writing. With no stylus, a finger works.
// - Marking handwriting:
//     1. if the browser can read Greek handwriting (Chrome's Handwriting Recognition API, where available) -> `recognize()`
//     2. when she TRACES a faint model -> `traceScore()` measures how well her ink follows the letters
//     3. otherwise she compares with the correct writing and says how she did (done by the app, not here)

const INK = '#3b2a63';

// ---------- where a piece of text sits on a pad (shared by drawing and by the tracing score) ----------
export function layoutText(ctx, text, W, H) {
  const base = 100;
  ctx.font = `900 ${base}px ui-rounded, "SF Pro Rounded", "Segoe UI", system-ui, sans-serif`;
  const measured = ctx.measureText(text).width || 1;
  const fs = Math.max(20, Math.min(H * 0.6, base * ((W * 0.9) / measured)));
  ctx.font = `900 ${fs}px ui-rounded, "SF Pro Rounded", "Segoe UI", system-ui, sans-serif`;
  return { fs, x: W / 2, y: H * 0.69 };
}

function makeCanvas(W, H) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(W)); c.height = Math.max(1, Math.round(H));
  return c;
}

function strokeWidth(H) { return Math.max(8, H * 0.06); }

function drawStrokes(ctx, strokes, width) {
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = INK; ctx.fillStyle = INK; ctx.lineWidth = width;
  for (const s of strokes) {
    const p = s.pts;
    if (!p.length) continue;
    if (p.length === 1) { ctx.beginPath(); ctx.arc(p[0].x, p[0].y, width / 2, 0, Math.PI * 2); ctx.fill(); continue; }
    ctx.beginPath(); ctx.moveTo(p[0].x, p[0].y);
    for (let i = 1; i < p.length - 1; i++) { // smooth: curve through the midpoints
      const mx = (p[i].x + p[i + 1].x) / 2, my = (p[i].y + p[i + 1].y) / 2;
      ctx.quadraticCurveTo(p[i].x, p[i].y, mx, my);
    }
    ctx.lineTo(p[p.length - 1].x, p[p.length - 1].y);
    ctx.stroke();
  }
}

// ---------- tracing score ----------
// coverage: how much of the letters her ink covers. stray: how much of her ink is away from the letters.
export function traceScore(strokes, text, W, H) {
  const lw = strokeWidth(H);
  const ink = makeCanvas(W, H), coreC = makeCanvas(W, H), nearC = makeCanvas(W, H);
  drawStrokes(ink.getContext('2d'), strokes, lw);
  const cc = coreC.getContext('2d'); const lc = layoutText(cc, text, W, H);
  cc.fillStyle = '#000'; cc.textAlign = 'center'; cc.textBaseline = 'alphabetic'; cc.fillText(text, lc.x, lc.y);
  const nc = nearC.getContext('2d'); layoutText(nc, text, W, H);
  nc.fillStyle = '#000'; nc.strokeStyle = '#000'; nc.lineWidth = lw * 1.8; nc.lineJoin = 'round'; nc.textAlign = 'center'; nc.textBaseline = 'alphabetic';
  nc.strokeText(text, lc.x, lc.y); nc.fillText(text, lc.x, lc.y);
  const a = ink.getContext('2d').getImageData(0, 0, ink.width, ink.height).data;
  const b = cc.getImageData(0, 0, coreC.width, coreC.height).data;
  const c = nc.getImageData(0, 0, nearC.width, nearC.height).data;
  let core = 0, covered = 0, inkN = 0, stray = 0;
  for (let i = 3; i < a.length; i += 4) {
    const isInk = a[i] > 90, isCore = b[i] > 127, isNear = c[i] > 90;
    if (isCore) { core++; if (isInk) covered++; }
    if (isInk) { inkN++; if (!isNear) stray++; }
  }
  return { coverage: core ? covered / core : 0, stray: inkN ? stray / inkN : 1, ink: inkN };
}

// the pixels of the letters, for tests
export function modelPixels(text, W, H) {
  const c = makeCanvas(W, H), ctx = c.getContext('2d');
  const l = layoutText(ctx, text, W, H);
  ctx.fillStyle = '#000'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.fillText(text, l.x, l.y);
  const d = ctx.getImageData(0, 0, c.width, c.height).data;
  const out = [];
  for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) if (d[(y * c.width + x) * 4 + 3] > 127) out.push([x, y]);
  return out;
}

// ---------- reading Greek handwriting, where the browser can ----------
let recogPromise = null;
export function handwritingRecognizer() {
  if (!recogPromise) {
    recogPromise = (async () => {
      try {
        if (!('createHandwritingRecognizer' in navigator)) return null;
        const query = navigator.queryHandwritingRecognizerSupport || navigator.queryHandwritingRecognizer;
        if (query) {
          const s = await query.call(navigator, { languages: ['el'] });
          if (s && s.languages === false) return null; // this device has no Greek handwriting model
        }
        return await navigator.createHandwritingRecognizer({ languages: ['el'] });
      } catch { return null; }
    })();
  }
  return recogPromise;
}
// 'auto' = this tablet can read Greek handwriting; 'self' = she checks her own writing
export async function handwritingMode() { return (await handwritingRecognizer()) ? 'auto' : 'self'; }

// Returns candidate texts (best first), or null if this device can't read Greek handwriting.
export async function recognize(strokes) {
  const r = await handwritingRecognizer();
  if (!r) return null;
  try {
    const drawing = r.startDrawing({ recognitionType: 'text', inputType: 'stylus', alternatives: 5 });
    for (const s of strokes) {
      const hs = new window.HandwritingStroke();
      for (const p of s.pts) hs.addPoint({ x: p.x, y: p.y, t: p.t });
      drawing.addStroke(hs);
    }
    const preds = await drawing.getPrediction();
    drawing.clear();
    const texts = (preds || []).map((p) => p.text).filter(Boolean);
    return texts.length ? texts : [];
  } catch { return null; }
}

// ---------- the pad ----------
export function createPad({ onChange = () => {} } = {}) {
  const el = document.createElement('div');
  el.className = 'pad';
  const model = document.createElement('canvas'); model.className = 'pad-model';
  const ink = document.createElement('canvas'); ink.className = 'pad-ink';
  el.append(model, ink);
  let W = 0, H = 0, dpr = 1;
  let strokes = [], cur = null, activeId = null, penSeen = false, locked = false;
  let modelText = null, modelKind = 'trace';

  const redraw = () => {
    const c = ink.getContext('2d');
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, W, H);
    drawStrokes(c, strokes, strokeWidth(H));
  };
  const drawModel = () => {
    const c = model.getContext('2d');
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, W, H);
    // handwriting lines
    c.save(); c.strokeStyle = '#e4d6ff'; c.lineWidth = 2; c.setLineDash([6, 8]);
    for (const f of [0.69, 0.33]) { c.beginPath(); c.moveTo(12, H * f); c.lineTo(W - 12, H * f); c.stroke(); }
    c.restore();
    if (!modelText) return;
    const l = layoutText(c, modelText, W, H);
    c.textAlign = 'center'; c.textBaseline = 'alphabetic';
    if (modelKind === 'trace') { c.fillStyle = '#e9defa'; c.strokeStyle = '#c9b5f2'; c.lineWidth = 2; c.setLineDash([5, 6]); c.fillText(modelText, l.x, l.y); c.strokeText(modelText, l.x, l.y); }
    else { c.fillStyle = 'rgba(62, 214, 181, .38)'; c.strokeStyle = '#2fc9a0'; c.lineWidth = 2; c.setLineDash([]); c.fillText(modelText, l.x, l.y); c.strokeText(modelText, l.x, l.y); }
  };
  const size = () => {
    const w = el.clientWidth, h = el.clientHeight;
    if (!w || !h || (w === W && h === H)) return;
    if (W && H) for (const s of strokes) for (const p of s.pts) { p.x *= w / W; p.y *= h / H; } // keep her writing in place if the pad resizes
    W = w; H = h; dpr = Math.min(3, window.devicePixelRatio || 1);
    for (const cv of [model, ink]) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    drawModel(); redraw();
  };
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(size).observe(el);
  requestAnimationFrame(size);

  const pos = (e) => { const r = ink.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top, t: e.timeStamp }; };

  // a stylus hovering over the pad means "this is a pen user": from then on fingers (palms) are ignored
  ink.addEventListener('pointerover', (e) => { if (e.pointerType === 'pen') penSeen = true; });
  ink.addEventListener('pointermove', (e) => { if (e.pointerType === 'pen') penSeen = true; });

  ink.addEventListener('pointerdown', (e) => {
    if (locked) return;
    if (e.pointerType === 'pen') penSeen = true;
    else if (e.pointerType === 'touch' && penSeen) return;       // palm rejection
    if (activeId !== null) return;                                 // one writing pointer at a time
    e.preventDefault();
    try { ink.setPointerCapture(e.pointerId); } catch { /* not capturable (synthetic event) */ }
    activeId = e.pointerId;
    cur = { pts: [pos(e)], pen: e.pointerType === 'pen' };
    strokes.push(cur);
    redraw();
  });
  ink.addEventListener('pointermove', (e) => {
    if (e.pointerId !== activeId || !cur) return;
    const list = typeof e.getCoalescedEvents === 'function' ? e.getCoalescedEvents() : [];
    for (const ev of list.length ? list : [e]) cur.pts.push(pos(ev));
    redraw();
  });
  const end = (e) => {
    if (e.pointerId !== activeId) return;
    activeId = null; cur = null;
    redraw(); onChange();
  };
  ink.addEventListener('pointerup', end);
  ink.addEventListener('pointercancel', end);
  ink.addEventListener('contextmenu', (e) => e.preventDefault());

  return {
    el,
    strokes: () => strokes,
    hasInk: () => strokes.length > 0,
    size: () => ({ W, H }),
    clear() { if (locked) return; strokes = []; redraw(); onChange(); },
    undo() { if (locked) return; strokes.pop(); redraw(); onChange(); },
    lock() { locked = true; el.classList.add('locked'); },
    setModel(text, kind = 'trace') { modelText = text; modelKind = kind; el.classList.toggle('tracing', !!text && kind === 'trace'); drawModel(); },
    penSeen: () => penSeen,
  };
}
