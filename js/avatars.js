// Little cartoon people drawn as SVG, so no image files are needed.
// A "pic" is either one person recipe, or { figs: [recipe, recipe], badge: 'προ-' }.

const SKIN = '#f6d2b0';
const SKIN_SHADE = '#e8b891';

function hair(spec) {
  const c = spec.hc || '#3b2a20';
  const front = `<path d="M30 44 Q28 20 50 22 Q72 20 70 44 Q64 33 50 34 Q36 33 30 44Z" fill="${c}"/>`;
  const fringe = `<path d="M31 42 Q36 26 50 27 Q64 26 69 42 Q58 34 50 35 Q42 34 31 42Z" fill="${c}"/>`;
  switch (spec.hair) {
    case 'long':
      return { back: `<path d="M28 46 Q25 17 50 19 Q75 17 72 46 L75 80 Q50 88 25 80Z" fill="${c}"/>`, front: fringe };
    case 'wavy':
      return { back: `<path d="M28 46 Q25 17 50 19 Q75 17 72 46 Q78 62 70 70 Q62 66 60 60 L40 60 Q38 66 30 70 Q22 62 28 46Z" fill="${c}"/>`, front: fringe };
    case 'bun':
      return { back: `<circle cx="50" cy="15" r="9" fill="${c}"/>`, front };
    case 'pony':
      return { back: `<path d="M66 32 Q92 28 84 66 Q80 52 68 48Z" fill="${c}"/>`, front };
    case 'band':
      return { back: '', front: `${front}<path d="M30 38 Q50 28 70 38 L70 42 Q50 32 30 42Z" fill="${spec.band || '#f4c542'}"/>` };
    case 'sides':
      return { back: '', front: `<path d="M30 48 Q26 34 36 28 L37 44Z" fill="${c}"/><path d="M70 48 Q74 34 64 28 L63 44Z" fill="${c}"/><path d="M38 27 Q50 22 62 27 Q50 25 38 27Z" fill="${c}"/>` };
    case 'cap':
      return { back: '', front: `${front}<path d="M28 38 Q50 10 72 38Z" fill="${spec.cap || '#d94f4f'}"/><path d="M60 37 L86 41 L60 44Z" fill="${spec.cap || '#d94f4f'}"/>` };
    default:
      return { back: '', front };
  }
}

function figure(spec) {
  const child = spec.a === 'child';
  const elder = spec.a === 'elder';
  const h = hair(spec);
  const c = spec.hc || '#3b2a20';
  const headR = child ? 22 : 20;
  const eyeY = child ? 46 : 45;
  let out = '';
  if (spec.cane) out += `<path d="M90 100 L90 70 Q90 62 82 64" fill="none" stroke="#8a5a35" stroke-width="4" stroke-linecap="round"/>`;
  out += h.back;
  out += `<path d="M12 100 Q12 69 50 67 Q88 69 88 100Z" fill="${spec.shirt || '#3b82c4'}"/>`;
  if (elder && spec.g === 'f') out += `<path d="M42 68 L50 82 L58 68Z" fill="#fff" opacity=".55"/>`;
  out += `<rect x="43" y="58" width="14" height="14" rx="5" fill="${SKIN_SHADE}"/>`;
  out += `<circle cx="30" cy="48" r="4.5" fill="${SKIN}"/><circle cx="70" cy="48" r="4.5" fill="${SKIN}"/>`;
  out += `<circle cx="50" cy="44" r="${headR}" fill="${SKIN}"/>`;
  out += h.front;
  if (spec.beard) out += `<path d="M31 50 Q50 84 69 50 Q62 68 50 68 Q38 68 31 50Z" fill="${c}"/>`;
  out += `<ellipse cx="38" cy="53" rx="4.5" ry="3" fill="#f29b9b" opacity=".45"/><ellipse cx="62" cy="53" rx="4.5" ry="3" fill="#f29b9b" opacity=".45"/>`;
  out += `<circle cx="43" cy="${eyeY}" r="${child ? 2.8 : 2.3}" fill="#2b2b3a"/><circle cx="57" cy="${eyeY}" r="${child ? 2.8 : 2.3}" fill="#2b2b3a"/>`;
  if (spec.stache) out += `<path d="M41 54 Q50 49 59 54 Q50 57 41 54Z" fill="${c}"/>`;
  out += `<path d="M43 56 Q50 62 57 56" fill="none" stroke="#b5524f" stroke-width="2.2" stroke-linecap="round"/>`;
  if (spec.glasses) out += `<g fill="none" stroke="#4a4a5a" stroke-width="2"><circle cx="43" cy="${eyeY}" r="7"/><circle cx="57" cy="${eyeY}" r="7"/><path d="M50 ${eyeY}h0"/></g>`;
  if (spec.ear) out += `<circle cx="30" cy="55" r="2.6" fill="#f2c230"/><circle cx="70" cy="55" r="2.6" fill="#f2c230"/>`;
  return out;
}

function place(spec, x, y, s) {
  const shrink = spec.a === 'child' ? 0.8 : 1;
  const sc = s * shrink;
  // anchor the bottom-centre of the figure so children stand on the same line
  const tx = x + 50 * s - 50 * sc;
  const ty = y + 100 * s - 100 * sc;
  return `<g transform="translate(${tx.toFixed(1)} ${ty.toFixed(1)}) scale(${sc})">${figure(spec)}</g>`;
}

export function avatarSVG(pic, { bg = '#dff0ff' } = {}) {
  const figs = pic.figs || [pic];
  const badge = pic.badge || (figs.find((f) => f.badge) || {}).badge;
  let body = '';
  if (figs.length === 1) body = place(figs[0], 0, 6, 1);
  else body = place(figs[0], -6, 26, 0.62) + place(figs[1], 44, 26, 0.62);
  const badgeSvg = badge
    ? `<circle cx="72" cy="28" r="15" fill="#f2b705" stroke="#fff" stroke-width="3"/><text x="72" y="33" text-anchor="middle" font-size="14" font-weight="800" fill="#fff" font-family="system-ui,sans-serif">${badge}</text>`
    : '';
  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true">
    <rect width="100" height="100" fill="${bg}"/>
    ${body}${badgeSvg}</svg>`;
}

// The mascot: Sofia the owl (the owl is the symbol of Athena, goddess of wisdom).
export function owlSVG(mood = 'happy') {
  const mouth = mood === 'sad'
    ? '<path d="M44 66 Q50 61 56 66" fill="none" stroke="#e08a1e" stroke-width="3" stroke-linecap="round"/>'
    : '<path d="M44 62 L56 62 L50 71Z" fill="#f2a22c"/>';
  const brow = mood === 'sad'
    ? '<path d="M30 40 L42 33 M70 40 L58 33" stroke="#4a3320" stroke-width="3" stroke-linecap="round"/>' : '';
  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M24 26 L34 14 L42 28Z M76 26 L66 14 L58 28Z" fill="#7a4e2d"/>
    <ellipse cx="50" cy="58" rx="33" ry="36" fill="#9a6a3f"/>
    <ellipse cx="50" cy="66" rx="21" ry="24" fill="#f4e2c4"/>
    <path d="M40 60 q4 5 8 0 M52 60 q4 5 8 0 M40 72 q4 5 8 0 M52 72 q4 5 8 0" fill="none" stroke="#d8bf94" stroke-width="2"/>
    <circle cx="36" cy="42" r="14" fill="#fff"/><circle cx="64" cy="42" r="14" fill="#fff"/>
    <circle cx="36" cy="43" r="6.5" fill="#2b2b3a"/><circle cx="64" cy="43" r="6.5" fill="#2b2b3a"/>
    <circle cx="38.5" cy="40.5" r="2.2" fill="#fff"/><circle cx="66.5" cy="40.5" r="2.2" fill="#fff"/>
    ${brow}${mouth}
    <path d="M18 56 Q10 76 26 88 Q22 70 28 58Z" fill="#7a4e2d"/><path d="M82 56 Q90 76 74 88 Q78 70 72 58Z" fill="#7a4e2d"/>
    <path d="M40 94 h8 M52 94 h8" stroke="#f2a22c" stroke-width="4" stroke-linecap="round"/>
    <path d="M36 15 q14 -9 28 0" fill="none" stroke="#7aa94a" stroke-width="3" stroke-linecap="round"/>
  </svg>`;
}
