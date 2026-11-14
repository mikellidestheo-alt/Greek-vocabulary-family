// Builds the questions for a lesson. Pure logic: no DOM in here.
import { WORDS, UNITS, word, unitOf, label } from './words.js';
import { state, ws } from './store.js';

const rnd = (n) => Math.floor(Math.random() * n);
export const shuffle = (a) => {
  const x = [...a];
  for (let i = x.length - 1; i > 0; i--) { const j = rnd(i + 1); [x[i], x[j]] = [x[j], x[i]]; }
  return x;
};
const sample = (a, n) => shuffle(a).slice(0, n);

const GREEK_LETTERS = 'αβγδεζηθικλμνξοπρστυφχψω'.split('');
let uid = 0;

// Wrong answers that are fair: not the same word, not a synonym, and (optionally) matching a filter.
function distractors(w, n, { ok = () => true, preferUnit = true } = {}) {
  const fair = WORDS.filter((x) => x.id !== w.id && !(w.grp && x.grp === w.grp) && x.en !== w.en && ok(x));
  const home = preferUnit ? fair.filter((x) => unitOf(x.id) === unitOf(w.id)) : [];
  const rest = fair.filter((x) => !home.includes(x));
  return [...sample(home, n), ...sample(rest, n)].slice(0, n);
}

const opt = (key, labelText, correct, extra = {}) => ({ key, label: labelText, correct, ...extra });
const choices = (opts) => shuffle(opts);

// ---- question makers ------------------------------------------------
const makers = {
  // hear the word, pick the English meaning
  'listen-en': (w) => ({
    kind: 'choice', title: 'What does this mean?', listen: true, say: w,
    options: choices([opt(w.id, w.en, true), ...distractors(w, 3).map((d) => opt(d.id, d.en, false))]),
  }),
  // see the Greek, pick the English
  'see-en': (w) => ({
    kind: 'choice', title: 'What does this mean?', show: w, say: w, autoplay: true,
    options: choices([opt(w.id, w.en, true), ...distractors(w, 3).map((d) => opt(d.id, d.en, false))]),
  }),
  // see the English, pick the Greek
  'en-el': (w) => ({
    kind: 'choice', title: 'How do you say this in Greek?', prompt: w.en, say: w, wordOpts: true,
    options: choices([opt(w.id, label(w), true), ...distractors(w, 3).map((d) => opt(d.id, label(d), false))]),
  }),
  // see the picture, pick the Greek
  'pic-el': (w) => ({
    kind: 'choice', title: 'Who is this?', pic: w, say: w, wordOpts: true,
    options: choices([opt(w.id, label(w), true), ...distractors(w, 3, { ok: (x) => x.picEx }).map((d) => opt(d.id, label(d), false))]),
  }),
  // hear the word, pick the picture
  'listen-pic': (w) => ({
    kind: 'choice', title: 'Tap the picture you hear', listen: true, say: w, picOpts: true,
    options: choices([opt(w.id, label(w), true, { pic: w }), ...distractors(w, 3, { ok: (x) => x.picEx }).map((d) => opt(d.id, label(d), false, { pic: d }))]),
  }),
  // build the Greek word from letters, from the English
  'build-en': (w) => ({ kind: 'build', title: 'Write this in Greek', prompt: w.en, say: w, answer: w.el, tiles: tilesFor(w.el) }),
  // build the Greek word from letters, from the sound
  'build-listen': (w) => ({ kind: 'build', title: 'Write what you hear', listen: true, say: w, answer: w.el, tiles: tilesFor(w.el) }),
  // ο / η / το
  article: (w) => ({
    kind: 'choice', title: 'Which little word goes with it?', prompt: w.el, sub: w.en, say: w, articleOpts: true,
    options: ['ο', 'η', 'το'].map((a) => opt(a, a, a === w.art)),
  }),
  // the male / female partner
  counterpart: (w) => {
    const p = word(w.pair);
    const female = p.art === 'η';
    return {
      kind: 'choice', title: `Which word is the ${female ? 'female' : 'male'} version?`, prompt: label(w), sub: w.en, say: w, sayAfter: p, wordOpts: true,
      options: choices([opt(p.id, label(p), true), ...distractors(p, 3, { ok: (x) => x.art === p.art && x.id !== w.id && !x.plural, preferUnit: false }).map((d) => opt(d.id, label(d), false))]),
    };
  },
};

function tilesFor(el) {
  const letters = Array.from(el.normalize('NFC'));
  const extra = sample(GREEK_LETTERS.filter((c) => !letters.includes(c)), 3);
  return shuffle([...letters, ...extra]).map((c, i) => ({ id: i, c }));
}

const TIERS = [
  ['see-en', 'en-el', 'pic-el', 'listen-en', 'listen-pic'],
  ['listen-en', 'en-el', 'listen-pic', 'build-en', 'article', 'counterpart', 'pic-el'],
  ['build-listen', 'build-en', 'listen-en', 'counterpart', 'article', 'en-el', 'listen-pic'],
];

function eligible(type, w) {
  if (type === 'pic-el' || type === 'listen-pic') return !!w.picEx && WORDS.filter((x) => x.picEx).length >= 4;
  if (type === 'counterpart') return !!w.pair && !!word(w.pair);
  if (type === 'article') return ['ο', 'η', 'το'].includes(w.art);
  if (type === 'build-en' || type === 'build-listen') return Array.from(w.el).length <= 14;
  return true;
}

function makeFor(w, lessonNo, lastType) {
  const s = Math.min(5, ws(w.id).s + (lessonNo - 1));
  const tier = s <= 1 ? 0 : s <= 3 ? 1 : 2;
  let pool = TIERS[tier].filter((t) => eligible(t, w));
  const fresh = pool.filter((t) => t !== lastType);
  if (fresh.length) pool = fresh;
  if (!pool.length) pool = ['see-en'];
  const type = pool[rnd(pool.length)];
  return { id: ++uid, type, wid: w.id, ...makers[type](w) };
}

function matchQuestion(words) {
  const ws4 = sample(words, Math.min(4, words.length));
  return {
    id: ++uid, type: 'match', kind: 'match', wid: ws4[0].id, title: 'Tap the matching pairs',
    pairs: ws4.map((w) => ({ id: w.id, el: label(w), en: w.en, w })),
    rightOrder: shuffle(ws4.map((w) => w.id)),
  };
}

// ---- lesson assembly -------------------------------------------------
// spec: { kind: 'unit', unit, lessonNo } | { kind: 'practice' } | { kind: 'mix' }
export function buildLesson(spec) {
  let pool;
  const N = 10;
  if (spec.kind === 'unit') {
    pool = spec.unit.words.map(word);
    // tiny units get a few review words from earlier units so lessons aren't repetitive
    if (pool.length < 5) {
      const idx = UNITS.indexOf(spec.unit);
      const earlier = UNITS.slice(0, idx).flatMap((u) => u.words).map(word)
        .filter((w) => ws(w.id).seen > 0).sort((a, b) => ws(a.id).s - ws(b.id).s);
      pool = [...pool, ...earlier.slice(0, 5 - pool.length)];
    }
  } else if (spec.kind === 'practice') {
    const seen = WORDS.filter((w) => ws(w.id).seen > 0).sort((a, b) => ws(a.id).s - ws(b.id).s);
    pool = seen.slice(0, 8);
  } else {
    // mix: everything, weaker words more likely
    const weighted = WORDS.flatMap((w) => Array(6 - Math.min(5, ws(w.id).s)).fill(w));
    pool = [...new Set(sample(weighted, 40))].slice(0, 10);
  }
  if (pool.length < 2) pool = WORDS.slice(0, 5);

  const lessonNo = spec.kind === 'unit' ? spec.lessonNo : 3;
  const qs = [];
  let last = null;
  // give each word a turn, then fill up, weakest words first
  const order = [];
  while (order.length < N) order.push(...shuffle(pool).sort((a, b) => ws(a.id).s - ws(b.id).s + (rnd(3) - 1)));
  for (let i = 0; qs.length < N && i < order.length; i++) {
    if (qs.length === 4 && pool.length >= 3) { qs.push(matchQuestion(pool)); last = 'match'; }
    const q = makeFor(order[i], lessonNo, last);
    qs.push(q); last = q.type;
  }
  return qs.slice(0, N);
}

export function introWords(unit) { return unit.words.map(word); }
