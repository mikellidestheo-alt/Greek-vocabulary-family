// Plush-monster relatives, drawn as SVG (original drawings, no image files).
// Googly mismatched eyes, crooked teeth, tongues, fuzzy / tie-dye / two-tone fur.
//
// A "pic" is either one monster recipe, or { figs: [recipe, recipe], badge: 'προ-' }.
//   shape  blob | cat | bunny | horn | tall | round
//   fur    fuzzy | plush | tie | split
//   c, c2, c3   body colours (c2/c3 used by tie-dye and split fur)
//   ec     eye colour       mouth  open | tongue | grimace      teeth  crooked | buck | fangs | gap
//   age    child | adult | elder
//   acc    accessories: bow lashes stache beard glasses cap cane bun earrings pigtails brows scarf tie tuft

let UID = 0;

const fnv = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const mulberry = (a) => () => {
  a |= 0; a = (a + 0x6D2B79F5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

function mix(hex, to, t) {
  const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const a = p(hex), b = p(to);
  return '#' + a.map((v, i) => Math.round(v + (b[i] - v) * t).toString(16).padStart(2, '0')).join('');
}
const dark = (c, t = 0.28) => mix(c, '#2a1740', t);
const light = (c, t = 0.4) => mix(c, '#ffffff', t);

const SHAPES = {
  blob: { cx: 50, cy: 60, rx: 30, ry: 29 },
  cat: { cx: 50, cy: 60, rx: 30, ry: 29 },
  bunny: { cx: 50, cy: 62, rx: 27, ry: 30 },
  horn: { cx: 50, cy: 60, rx: 30, ry: 29 },
  tall: { cx: 50, cy: 58, rx: 25, ry: 33 },
  round: { cx: 50, cy: 64, rx: 33, ry: 26 },
};

function bodyPath(sh, fuzzy, rnd) {
  const { cx, cy, rx, ry } = sh;
  if (!fuzzy) return `M${cx - rx} ${cy}A${rx} ${ry} 0 1 1 ${cx + rx} ${cy}A${rx} ${ry} 0 1 1 ${cx - rx} ${cy}Z`;
  const N = 48;
  let d = '';
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    const k = i % 2 === 0 ? 1.07 + rnd() * 0.08 : 0.97;
    d += `${i ? 'L' : 'M'}${(cx + rx * k * Math.cos(a)).toFixed(1)} ${(cy + ry * k * Math.sin(a)).toFixed(1)}`;
  }
  return d + 'Z';
}

function ears(spec, sh) {
  const c = spec.c, edge = dark(c, 0.3), inner = light(c, 0.55);
  const top = sh.cy - sh.ry;
  switch (spec.shape) {
    case 'cat':
      return `<path d="M22 ${top + 14} L27 ${top - 14} L46 ${top + 4}Z" fill="${c}" stroke="${edge}" stroke-width="1.5" stroke-linejoin="round"/>
        <path d="M74 ${top + 14} L73 ${top - 14} L54 ${top + 4}Z" fill="${c}" stroke="${edge}" stroke-width="1.5" stroke-linejoin="round"/>
        <path d="M28 ${top + 4} L29 ${top - 7} L38 ${top + 3}Z M72 ${top + 4} L71 ${top - 7} L62 ${top + 3}Z" fill="${inner}"/>`;
    case 'bunny':
      return `<ellipse cx="37" cy="${top - 6}" rx="7.5" ry="19" transform="rotate(-10 37 ${top - 6})" fill="${c}" stroke="${edge}" stroke-width="1.5"/>
        <ellipse cx="63" cy="${top - 6}" rx="7.5" ry="19" transform="rotate(10 63 ${top - 6})" fill="${c}" stroke="${edge}" stroke-width="1.5"/>
        <ellipse cx="37" cy="${top - 5}" rx="3.5" ry="13" transform="rotate(-10 37 ${top - 5})" fill="${inner}"/>
        <ellipse cx="63" cy="${top - 5}" rx="3.5" ry="13" transform="rotate(10 63 ${top - 5})" fill="${inner}"/>`;
    case 'horn':
      return `<path d="M27 ${top + 10} L21 ${top - 10} L42 ${top + 2}Z M73 ${top + 10} L79 ${top - 10} L58 ${top + 2}Z" fill="#ffe08a" stroke="#c99a1f" stroke-width="1.5" stroke-linejoin="round"/>`;
    default:
      return '';
  }
}

function tieBands(spec) {
  const w = (y) => `M-5 ${y} Q15 ${y - 11} 35 ${y} T75 ${y} T115 ${y} V110 H-5Z`;
  const c2 = spec.c2 || '#ec4fa0', c3 = spec.c3 || '#3fc98a';
  return `<path d="${w(40)}" fill="${c2}"/><path d="${w(54)}" fill="${c3}"/><path d="${w(68)}" fill="${spec.c}"/><path d="${w(81)}" fill="${c2}"/>`;
}

function teethSvg(kind, my, mx0, mx1) {
  const t01 = (x) => (x - mx0) / (mx1 - mx0);
  const top = (x) => my + 8 * t01(x) * (1 - t01(x));
  const bottom = (x) => my + 44 * t01(x) * (1 - t01(x));
  const tooth = (x, w, h, y0 = top(x)) =>
    `<rect x="${x}" y="${(y0 - 0.6).toFixed(1)}" width="${w}" height="${h}" rx="1.2" fill="#fffdf4" stroke="#3a2150" stroke-width=".9"/>`;
  let s = '';
  if (kind === 'buck') s += tooth(44.5, 5.4, 10) + tooth(50.1, 5.4, 9);
  else if (kind === 'fangs') s += `<path d="M38 ${top(38)} l3 9 l3 -9Z M56 ${top(56)} l3 9 l3 -9Z" fill="#fffdf4" stroke="#3a2150" stroke-width=".9" stroke-linejoin="round"/>` + tooth(48, 4, 4);
  else if (kind === 'gap') s += tooth(38, 4.6, 6) + tooth(43.5, 4.6, 7) + tooth(55, 4.6, 7) + tooth(60.5, 4.6, 5);
  else s += tooth(36, 4.6, 6) + tooth(41.5, 4.6, 9) + tooth(47, 4.6, 5) + tooth(52.5, 4.6, 9) + tooth(58, 4.6, 6);
  if (kind !== 'fangs') s += tooth(44, 4.4, 5, bottom(44) - 5) + tooth(52, 4.4, 4, bottom(52) - 4);
  return s;
}

function face(spec, sh, rnd, opts = {}) {
  const ey = sh.cy - 15;
  const thin = spec.shape === 'tall';
  const lx = thin ? 40 : 38, rx2 = thin ? 61 : 62;
  const lr = thin ? 9.5 : 10.5, rr = thin ? 8.5 : 9;
  const ec = spec.ec || '#7ed321';
  const my = sh.cy + 3;
  const mx0 = thin ? 36 : 33, mx1 = thin ? 64 : 67;
  const sad = opts.mood === 'sad';
  const eye = (x, y, r, i) => {
    const px = (rnd() - 0.5) * r * 0.6, py = sad ? -r * 0.35 : (rnd() - 0.2) * r * 0.45;
    return `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" stroke="#3a2150" stroke-width="1.6"/>
      <g class="pupil" style="animation-delay:-${(i * 1.7 + rnd() * 2).toFixed(1)}s">
        <circle cx="${(x + px).toFixed(1)}" cy="${(y + py).toFixed(1)}" r="${(r * 0.62).toFixed(1)}" fill="${ec}"/>
        <circle cx="${(x + px).toFixed(1)}" cy="${(y + py).toFixed(1)}" r="${(r * 0.36).toFixed(1)}" fill="#1f1030"/>
        <circle cx="${(x + px - r * 0.18).toFixed(1)}" cy="${(y + py - r * 0.2).toFixed(1)}" r="${(r * 0.14).toFixed(1)}" fill="#fff"/>
      </g>`;
  };
  let s = '';
  s += eye(lx, ey, lr, 0) + eye(rx2, ey - 2, rr, 1);
  s += `<ellipse cx="50" cy="${ey + 11}" rx="4.4" ry="3.2" fill="#3a1f3d"/><ellipse cx="49" cy="${ey + 10}" rx="1.4" ry=".9" fill="#fff" opacity=".7"/>`;
  if (sad) {
    s += `<path d="M${lx - lr} ${ey - lr - 2} L${lx + 4} ${ey - lr - 7} M${rx2 + rr} ${ey - rr - 3} L${rx2 - 4} ${ey - rr - 8}" stroke="#3a2150" stroke-width="2.6" stroke-linecap="round"/>`;
  }
  const mouth = sad ? 'grimace' : (spec.mouth || 'open');
  if (mouth === 'grimace') {
    s += `<path d="M${mx0 + 2} ${my + 8} Q50 ${my + 1} ${mx1 - 2} ${my + 8} L${mx1 - 4} ${my + 14} Q50 ${my + 8} ${mx0 + 4} ${my + 14}Z" fill="#fffdf4" stroke="#3a2150" stroke-width="1.6" stroke-linejoin="round"/>
      <path d="M41 ${my + 5} V${my + 12} M50 ${my + 4} V${my + 11} M59 ${my + 5} V${my + 12}" stroke="#3a2150" stroke-width="1"/>`;
  } else {
    s += `<path d="M${mx0} ${my} Q50 ${my + 4} ${mx1} ${my} Q50 ${my + 24} ${mx0} ${my}Z" fill="#43203f" stroke="#2a1235" stroke-width="1.4" stroke-linejoin="round"/>`;
    if (mouth === 'tongue') s += `<path d="M41 ${my + 6} Q40 ${my + 23} 50 ${my + 23} Q60 ${my + 23} 59 ${my + 6}Z" fill="#f78fb3" stroke="#c4577e" stroke-width="1.2"/><path d="M50 ${my + 9} V${my + 18}" stroke="#c4577e" stroke-width="1.2" stroke-linecap="round"/>`;
    s += teethSvg(spec.teeth, my, mx0, mx1);
  }
  if (sad) s += `<path d="M${rx2 + 12} ${ey - 16} q-3 6 0 9 q3 -3 0 -9Z" fill="#6ec6ff" stroke="#2f86c9" stroke-width="1"/>`;
  return { svg: s, ey, lx, rx2, lr, rr, my, mx0, mx1 };
}

const hairColour = (spec) => (spec.age === 'elder' ? '#9993ab' : '#5a3b2a');

function beard(spec, f) {
  if (!(spec.acc || []).includes('beard')) return '';
  const hc = hairColour(spec);
  return `<path d="M${f.mx0 - 3} ${f.my - 1} Q${f.mx0 - 5} ${f.my + 26} 50 ${f.my + 29} Q${f.mx1 + 5} ${f.my + 26} ${f.mx1 + 3} ${f.my - 1} Q50 ${f.my + 14} ${f.mx0 - 3} ${f.my - 1}Z" fill="${hc}" stroke="${dark(hc, 0.3)}" stroke-width="1" stroke-linejoin="round"/>`;
}

function accessories(spec, sh, f) {
  const acc = spec.acc || [];
  const hc = hairColour(spec);
  const top = sh.cy - sh.ry;
  const { cx, cy, rx, ry } = sh;
  let s = '';
  if (acc.includes('stache')) s += `<path d="M${f.mx0 + 1} ${f.my - 1} Q${f.mx0 + 7} ${f.my - 9} 50 ${f.my - 3} Q${f.mx1 - 7} ${f.my - 9} ${f.mx1 - 1} ${f.my - 1} Q${f.mx1 - 8} ${f.my + 3} 50 ${f.my - 1} Q${f.mx0 + 8} ${f.my + 3} ${f.mx0 + 1} ${f.my - 1}Z" fill="${hc}" stroke="${dark(hc, 0.3)}" stroke-width=".8" stroke-linejoin="round"/>`;
  if (acc.includes('brows')) s += `<path d="M${f.lx - f.lr} ${f.ey - f.lr - 2} Q${f.lx} ${f.ey - f.lr - 9} ${f.lx + f.lr} ${f.ey - f.lr - 2} M${f.rx2 - f.rr} ${f.ey - f.rr - 4} Q${f.rx2} ${f.ey - f.rr - 11} ${f.rx2 + f.rr} ${f.ey - f.rr - 4}" fill="none" stroke="#867fa0" stroke-width="4.2" stroke-linecap="round"/>`;
  if (acc.includes('lashes')) {
    s += `<path d="M${f.lx - f.lr + 1} ${f.ey - 5} l-5 -4 M${f.lx - f.lr + 4} ${f.ey - 9} l-3 -6 M${f.lx - 2} ${f.ey - f.lr} l-1 -6 M${f.rx2 + f.rr - 1} ${f.ey - 7} l5 -4 M${f.rx2 + f.rr - 4} ${f.ey - 11} l3 -6 M${f.rx2 + 2} ${f.ey - f.rr - 2} l1 -6" stroke="#3a2150" stroke-width="1.8" stroke-linecap="round"/>`;
  }
  if (acc.includes('glasses')) s += `<g fill="rgba(255,255,255,.18)" stroke="#3a2a52" stroke-width="2.4"><circle cx="${f.lx}" cy="${f.ey}" r="${f.lr + 2.4}"/><circle cx="${f.rx2}" cy="${f.ey - 2}" r="${f.rr + 2.4}"/><path d="M${f.lx + f.lr + 2.4} ${f.ey - 1} Q50 ${f.ey - 6} ${f.rx2 - f.rr - 2.4} ${f.ey - 3}" fill="none"/></g>`;
  if (acc.includes('earrings')) s += `<circle cx="${cx - rx + 1}" cy="${cy + 6}" r="3.4" fill="#ffd23f" stroke="#c99a1f" stroke-width="1"/><circle cx="${cx + rx - 1}" cy="${cy + 6}" r="3.4" fill="#ffd23f" stroke="#c99a1f" stroke-width="1"/>`;
  if (acc.includes('scarf')) {
    const sc = spec.scarfC || '#f5a623';
    s += `<path d="M${cx - rx + 4} ${cy + ry - 14} Q50 ${cy + ry - 3} ${cx + rx - 4} ${cy + ry - 14} L${cx + rx - 7} ${cy + ry - 4} Q50 ${cy + ry + 7} ${cx - rx + 7} ${cy + ry - 4}Z" fill="${sc}" stroke="${dark(sc, 0.3)}" stroke-width="1.2" stroke-linejoin="round"/>`;
  }
  if (acc.includes('tie')) {
    const tc = spec.tieC || '#e2554f';
    s += `<path d="M44 ${cy + ry - 3} L56 ${cy + ry - 3} L53 ${cy + ry + 4} L56 ${cy + ry + 14} L50 ${cy + ry + 11} L44 ${cy + ry + 14} L47 ${cy + ry + 4}Z" fill="${tc}" stroke="${dark(tc, 0.35)}" stroke-width="1" stroke-linejoin="round"/>`;
  }
  if (acc.includes('tuft')) s += `<path d="M42 ${top + 3} L45 ${top - 9} L49 ${top} L54 ${top - 11} L57 ${top + 3}Z" fill="${dark(spec.c, 0.35)}" stroke="${dark(spec.c, 0.5)}" stroke-width="1" stroke-linejoin="round"/>`;
  if (acc.includes('bun')) s += `<circle cx="50" cy="${top - 2}" r="9" fill="#cfc9dc" stroke="#9993ab" stroke-width="1.4"/><path d="M44 ${top - 4} q6 -4 12 0 M45 ${top + 1} q5 -3 10 0" fill="none" stroke="#9993ab" stroke-width="1.2" stroke-linecap="round"/>`;
  if (acc.includes('bow')) s += `<g transform="translate(${spec.shape === 'bunny' ? 50 : 33} ${top + 7})"><path d="M0 0 L-10 -6 L-10 6Z M0 0 L10 -6 L10 6Z" fill="#ff4f9a" stroke="#b81f64" stroke-width="1.2" stroke-linejoin="round"/><circle r="3.2" fill="#ff86bd" stroke="#b81f64" stroke-width="1"/></g>`;
  if (acc.includes('pigtails')) {
    for (const sx of [-1, 1]) {
      const x = cx + sx * (rx + 3), y = cy - 14;
      s += `<ellipse cx="${x}" cy="${y + 6}" rx="7" ry="12" transform="rotate(${sx * -14} ${x} ${y})" fill="${dark(spec.c, 0.18)}" stroke="${dark(spec.c, 0.4)}" stroke-width="1.2"/><circle cx="${x - sx}" cy="${y - 5}" r="4" fill="#ffd23f" stroke="#c99a1f" stroke-width="1"/>`;
    }
  }
  if (acc.includes('cap')) {
    const cc = spec.capC || '#d94f4f';
    s += `<path d="M${cx - 25} ${top + 15} Q50 ${top - 16} ${cx + 25} ${top + 15}Z" fill="${cc}" stroke="${dark(cc, 0.4)}" stroke-width="1.5" stroke-linejoin="round"/><path d="M${cx + 2} ${top + 13} Q${cx + 28} ${top + 9} ${cx + 33} ${top + 17} Q${cx + 16} ${top + 18} ${cx + 2} ${top + 17}Z" fill="${dark(cc, 0.2)}" stroke="${dark(cc, 0.45)}" stroke-width="1.2" stroke-linejoin="round"/><circle cx="50" cy="${top - 2}" r="2.6" fill="#fff"/>`;
  }
  return s;
}

function monster(spec, opts = {}) {
  const id = ++UID;
  const rnd = mulberry(fnv(JSON.stringify(spec)) + (opts.seed || 0));
  const sh = SHAPES[spec.shape] || SHAPES.blob;
  const c = spec.c;
  const edge = dark(c, 0.3);
  const smooth = bodyPath(sh, false, rnd);
  const furry = bodyPath(sh, true, rnd);
  const limb = spec.fur === 'split' ? spec.c2 : c;
  let s = '';
  // legs & arms sit behind the body
  s += `<ellipse cx="${sh.cx - 13}" cy="${sh.cy + sh.ry}" rx="11" ry="7.5" fill="${dark(limb, 0.1)}" stroke="${edge}" stroke-width="1.4"/><ellipse cx="${sh.cx + 13}" cy="${sh.cy + sh.ry}" rx="11" ry="7.5" fill="${dark(limb, 0.1)}" stroke="${edge}" stroke-width="1.4"/>`;
  s += `<ellipse cx="${sh.cx - sh.rx - 2}" cy="${sh.cy + 11}" rx="8" ry="13" transform="rotate(22 ${sh.cx - sh.rx - 2} ${sh.cy + 11})" fill="${c}" stroke="${edge}" stroke-width="1.4"/><ellipse cx="${sh.cx + sh.rx + 2}" cy="${sh.cy + 11}" rx="8" ry="13" transform="rotate(-22 ${sh.cx + sh.rx + 2} ${sh.cy + 11})" fill="${limb}" stroke="${edge}" stroke-width="1.4"/>`;
  if ((spec.acc || []).includes('cane')) s += `<path d="M90 ${sh.cy + 4} L91 98" stroke="#8a5a35" stroke-width="4.2" stroke-linecap="round"/><path d="M83 ${sh.cy + 4} Q90 ${sh.cy - 6} 95 ${sh.cy + 4}" fill="none" stroke="#8a5a35" stroke-width="4.2" stroke-linecap="round"/>`;
  s += ears(spec, sh);

  if (spec.fur === 'tie') {
    s += `<clipPath id="t${id}"><path d="${smooth}"/></clipPath><path d="${smooth}" fill="${c}"/><g clip-path="url(#t${id})">${tieBands(spec)}</g><path d="${smooth}" fill="none" stroke="${edge}" stroke-width="1.6"/>`;
  } else if (spec.fur === 'split') {
    s += `<path d="${smooth}" fill="${c}" stroke="${edge}" stroke-width="1.6"/><clipPath id="r${id}"><rect x="50" y="0" width="60" height="110"/></clipPath><g clip-path="url(#r${id})"><path d="${furry}" fill="${spec.c2}" stroke="${spec.c2}" stroke-width="2" stroke-linejoin="round"/></g><path d="M50 ${sh.cy - sh.ry} V${sh.cy + sh.ry}" stroke="${dark(spec.c2, 0.4)}" stroke-width="1.6" stroke-dasharray="3 2.4"/>`;
  } else if (spec.fur === 'fuzzy') {
    s += `<path d="${furry}" fill="${c}" stroke="${c}" stroke-width="2" stroke-linejoin="round"/><path d="${furry}" fill="none" stroke="${edge}" stroke-width=".7" stroke-linejoin="round" opacity=".55"/>`;
  } else {
    s += `<path d="${smooth}" fill="${c}" stroke="${edge}" stroke-width="1.6"/>`;
  }
  s += `<ellipse cx="${sh.cx}" cy="${sh.cy + sh.ry * 0.55}" rx="${sh.rx * 0.5}" ry="${sh.ry * 0.32}" fill="#fff" opacity=".16"/>`;

  const f = face(spec, sh, rnd, opts);
  s += beard(spec, f);
  s += f.svg;
  s += accessories(spec, sh, f);
  return s;
}

function place(spec, x, y, s, opts) {
  const shrink = spec.age === 'child' ? 0.8 : 1;
  const sc = s * shrink;
  const tx = x + 50 * s - 50 * sc;
  const ty = y + 96 * s - 96 * sc;
  return `<g transform="translate(${tx.toFixed(1)} ${ty.toFixed(1)}) scale(${sc})">${monster(spec, opts)}</g>`;
}

export function avatarSVG(pic, { bg = '#e9defa', mood = 'happy' } = {}) {
  const figs = pic.figs || [pic];
  const badge = pic.badge || (figs.find((f) => f.badge) || {}).badge;
  const opts = { mood };
  const body = figs.length === 1
    ? place(figs[0], 0, 4, 1, opts)
    : place(figs[0], -5, 24, 0.62, opts) + place(figs[1], 43, 24, 0.62, { ...opts, seed: 7 });
  const badgeSvg = badge
    ? `<g transform="rotate(-8 74 24)"><circle cx="74" cy="24" r="15" fill="#ffd23f" stroke="#3a2150" stroke-width="2.2"/><text x="74" y="29.5" text-anchor="middle" font-size="14.5" font-weight="900" fill="#3a2150" font-family="system-ui,sans-serif">${badge}</text></g>`
    : '';
  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true">${bg === 'none' ? '' : `<rect width="100" height="100" fill="${bg}"/>`}${body}${badgeSvg}</svg>`;
}

// The mascot: Floufi, a tie-dye monster with its tongue out.
const FLOUFI = { shape: 'cat', fur: 'tie', c: '#2f8fe8', c2: '#ec4fa0', c3: '#3fc98a', ec: '#8bd630', mouth: 'tongue', teeth: 'crooked', acc: [] };
export function mascotSVG(mood = 'happy') {
  return avatarSVG(FLOUFI, { bg: 'none', mood });
}
