// Builds the questions for a lesson. Pure logic: no DOM in here.
//
// Every question belongs to one of four skills:
//   translation   what does it mean / how do you say it
//   spelling      write it right: letter tiles, missing letter, correct spelling
//   pronunciation hear it, stress it, say it out loud
//   sentences     fill the gap, translate, build a sentence
import { WORDS, UNITS, word, unitOf, label, sentencesFor, ART_TR, topicOf } from './words.js';
import { ws } from './store.js';

export const SKILLS = [
  { id: 'translation', title: 'Translate', icon: '🌍', desc: 'What does it mean?' },
  { id: 'spelling', title: 'Spell', icon: '🔤', desc: 'Write it right' },
  { id: 'pronunciation', title: 'Say it', icon: '🗣️', desc: 'Sound like a Greek' },
  { id: 'sentences', title: 'Sentences', icon: '💬', desc: 'Put words together' },
];

const rnd = (n) => Math.floor(Math.random() * n);
export const shuffle = (a) => {
  const x = [...a];
  for (let i = x.length - 1; i > 0; i--) { const j = rnd(i + 1); [x[i], x[j]] = [x[j], x[i]]; }
  return x;
};
const sample = (a, n) => shuffle(a).slice(0, n);
const uniq = (a) => [...new Set(a)];

const GREEK_LETTERS = 'αβγδεζηθικλμνξοπρστυφχψω'.split('');
const TONOS = { α: 'ά', ε: 'έ', η: 'ή', ι: 'ί', ο: 'ό', υ: 'ύ', ω: 'ώ' };
const ACC = Object.fromEntries(Object.entries(TONOS).map(([b, t]) => [t, b]));
const CONFUSE = { ι: ['η', 'υ'], η: ['ι', 'υ'], υ: ['ι', 'η'], ο: ['ω'], ω: ['ο'], σ: ['ς'], ς: ['σ'] };
const isLetter = (c) => /\p{L}/u.test(c);
const strip = (t) => t.replace(/[.;?!,]/g, '');
let uid = 0;

// Each section of the app has its own words: wrong answers, sentences and mixes never cross over
// (a number question never offers "grandpa" as an answer).
const inTopic = (w) => WORDS.filter((x) => topicOf(x) === topicOf(w));
// words that can be written / said with the word itself being the whole answer: family words with a little word, and numbers
const hasWord = (w) => !!w.art || !!w.num;
const lw = (w, text) => (w.art ? text : ''); // text about "its little word" only where there is one

// ---------- fair wrong answers ----------
function distractors(w, n, { ok = () => true, preferUnit = true } = {}) {
  const fair = inTopic(w).filter((x) => x.id !== w.id && !(w.grp && x.grp === w.grp) && x.en !== w.en && ok(x));
  const home = preferUnit ? fair.filter((x) => unitOf(x.id) === unitOf(w.id)) : [];
  const rest = fair.filter((x) => !home.includes(x));
  return [...sample(home, n), ...sample(rest, n)].slice(0, n);
}
const opt = (key, labelText, correct, extra = {}) => ({ key, label: labelText, correct, ...extra });
// Written answers always include the little word. These are the accepted alternative spellings WITH it.
const fullAlts = (w) => (w.alt || []).map((a) => (w.art ? `${w.art} ${a}` : a));
const writeBase = (w) => ({ kind: 'write', answer: label(w), alts: fullAlts(w), noun: [w.el, ...(w.alt || [])], art: w.art, say: w });

// ---------- spelling helpers ----------
// Plausible misspellings: lost/moved accents, ι-η-υ and ο-ω mix-ups, ει/οι/αι, swapped or doubled letters.
export function misspellings(el) {
  const nfc = el.normalize('NFC');
  const chars = Array.from(nfc);
  const out = new Set();
  const add = (s) => { const x = s.normalize('NFC'); if (x !== nfc && x.length >= 2) out.add(x); };
  chars.forEach((c, i) => { if (ACC[c]) { const a = [...chars]; a[i] = ACC[c]; add(a.join('')); } });
  const ai = chars.findIndex((c) => ACC[c]);
  if (ai >= 0) chars.forEach((c, i) => { if (i !== ai && TONOS[c]) { const a = [...chars]; a[ai] = ACC[chars[ai]]; a[i] = TONOS[c]; add(a.join('')); } });
  chars.forEach((c, i) => {
    const base = ACC[c] || c;
    for (const r of CONFUSE[base] || []) { const a = [...chars]; a[i] = ACC[c] ? (TONOS[r] || r) : r; add(a.join('')); }
  });
  const nfd = nfc.normalize('NFD');
  for (const [from, to] of [['ει', 'ι'], ['οι', 'ι'], ['αι', 'ε'], ['ι', 'ει'], ['ε', 'αι']]) {
    const i = nfd.indexOf(from);
    if (i >= 0) add(nfd.slice(0, i) + to + nfd.slice(i + from.length));
  }
  for (let i = 0; i < chars.length - 1; i++) {
    if (isLetter(chars[i]) && isLetter(chars[i + 1]) && chars[i] !== chars[i + 1]) { const a = [...chars]; [a[i], a[i + 1]] = [a[i + 1], a[i]]; add(a.join('')); }
  }
  chars.forEach((c, i) => { if ('πλνρσκτμ'.includes(c)) { const a = [...chars]; a.splice(i, 0, c); add(a.join('')); } });
  const all = shuffle([...out]);
  // make sure the three wrong ones are a mixture (accent, letter, other)
  return all.slice(0, 3);
}

function letterOptions(correct) {
  const base = ACC[correct] || correct;
  const c = new Set();
  if (ACC[correct]) c.add(base);
  if (TONOS[correct]) c.add(TONOS[correct]);
  for (const r of CONFUSE[base] || []) if (r.length === 1) c.add(ACC[correct] ? (TONOS[r] || r) : r);
  c.delete(correct);
  for (const g of shuffle(GREEK_LETTERS)) { if (c.size >= 3) break; if (g !== correct) c.add(g); }
  return [...c].slice(0, 3);
}

// ---------- pronunciation helpers ----------
const syllables = (tr) => tr.split('-');
const stressIndex = (tr) => syllables(tr).findIndex((s) => /[A-Z]/.test(s) && s === s.toUpperCase());

const ARTICLES = ['ο', 'η', 'το', 'οι', 'τα'];
// the pronunciation of the word with its little word: "o ba-BAS"
const trFull = (w, art = w.art) => (art ? `${ART_TR[art]} ${w.tr}` : w.tr);

function trOptions(w) {
  const syl = syllables(w.tr), si = stressIndex(w.tr);
  const wrongStress = syl.length > 1
    ? syl.map((_, j) => j).filter((j) => j !== si).map((j) => syl.map((s, k) => (k === j ? s.toUpperCase() : s.toLowerCase())).join('-'))
    : [];
  const correct = trFull(w);
  // right word but the wrong little word (the pronunciation of the article is tested too)
  const wrongArt = w.art ? uniq(ARTICLES.filter((a) => ART_TR[a] !== ART_TR[w.art]).map((a) => trFull(w, a))) : [];
  const others = inTopic(w).filter((x) => x.id !== w.id && x.tr !== w.tr && hasWord(x)).map((x) => trFull(x));
  return uniq([
    ...sample(wrongArt, 1),
    ...sample(wrongStress, 1).map((t) => (w.art ? `${ART_TR[w.art]} ${t}` : t)),
    ...sample(others, 6),
  ]).filter((t) => t !== correct).slice(0, 3);
}

// ---------- sentences ----------
const pseudo = (s) => ({ id: `s-${s.id}`, el: s.el, art: '', tr: s.tr, en: s.en, say: s.el });
const pickSentence = (w, preferT) => {
  const list = sentencesFor(w.id);
  if (!list.length) return null;
  const same = preferT == null ? [] : list.filter((s) => s.t === preferT);
  return (same.length ? same : list)[rnd((same.length ? same : list).length)];
};
const sameArtPool = (w) => inTopic(w).filter((x) => x.id !== w.id && (w.num ? !!x.num : x.art && x.art === w.art) && x.id !== 'pro' && x.en !== w.en && !(w.grp && x.grp === w.grp));

// sentences where the word comes right after its little word: "Αυτός είναι ο θείος μου."
function artGapCandidates(w) {
  if (!w.art) return [];
  return sentencesFor(w.id).map((sn) => {
    const toks = sn.el.split(' ');
    const i = toks.findIndex((t, k) => strip(t).toLowerCase() === w.art && strip(toks[k + 1] || '') === sn.form);
    return i >= 0 ? { s: sn, toks, i } : null;
  }).filter(Boolean);
}

function otherTranslations(w, s, n = 3) {
  const cands = sample(inTopic(w).filter((x) => x.id !== w.id && hasWord(x) && !(w.grp && x.grp === w.grp)), 12)
    .map((x) => pickSentence(x, s.t)).filter(Boolean);
  const seen = new Set([s.en]);
  const out = [];
  for (const c of cands) { if (!seen.has(c.en)) { seen.add(c.en); out.push(c.en); } if (out.length === n) break; }
  return out;
}

function tilesFor(el) {
  const letters = Array.from(el.normalize('NFC'));
  const extra = sample(GREEK_LETTERS.filter((c) => !letters.includes(c)), 3);
  return shuffle([...letters, ...extra]).map((c, i) => ({ id: i, c }));
}

// ---------- question makers ----------
const makers = {
  // ===== translation =====
  'see-en': (w) => ({
    kind: 'choice', title: 'What does this mean?', show: w, say: w, autoplay: true,
    options: shuffle([opt(w.id, w.en, true), ...distractors(w, 3).map((d) => opt(d.id, d.en, false))]),
  }),
  'listen-en': (w) => ({
    kind: 'choice', title: 'What does this mean?', listen: true, say: w,
    options: shuffle([opt(w.id, w.en, true), ...distractors(w, 3).map((d) => opt(d.id, d.en, false))]),
  }),
  'en-el': (w) => ({
    kind: 'choice', title: 'How do you say this in Greek?', prompt: w.en, promptClass: 'en', silent: true, say: w, optClass: 'greek',
    options: shuffle([opt(w.id, label(w), true, { say: w }), ...distractors(w, 3).map((d) => opt(d.id, label(d), false, { say: d }))]),
  }),
  'pic-el': (w) => ({
    kind: 'choice', title: w.num ? 'Which number is this?' : 'Who is this?', pic: w, say: w, optClass: 'greek',
    options: shuffle([opt(w.id, label(w), true, { say: w }), ...distractors(w, 3, { ok: (x) => x.picEx }).map((d) => opt(d.id, label(d), false, { say: d }))]),
  }),
  article: (w) => ({
    kind: 'choice', title: 'Which little word goes with it?', prompt: w.el, promptClass: 'greek', sub: w.en, say: w,
    gridClass: 'arts', optClass: 'greek',
    options: ['ο', 'η', 'το'].map((a) => opt(a, a, a === w.art)),
  }),
  counterpart: (w) => {
    const p = word(w.pair);
    const female = p.art === 'η';
    return {
      kind: 'choice', title: `Which word is the ${female ? 'female' : 'male'} version?`, prompt: label(w), promptClass: 'greek', sub: w.en,
      say: w, sayAfter: p, optClass: 'greek',
      options: shuffle([opt(p.id, label(p), true, { say: p }), ...distractors(p, 3, { ok: (x) => x.art === p.art && x.id !== w.id && !x.plural, preferUnit: false }).map((d) => opt(d.id, label(d), false, { say: d }))]),
    };
  },

  // ===== spelling =====
  // Spelling covers the little word as well: she spells "ο μπαμπάς", not just "μπαμπάς".
  'build-en': (w) => ({
    kind: 'build', title: 'Write this in Greek', prompt: w.en, promptClass: 'en', sub: lw(w, 'with its little word'), silent: true, say: w,
    answer: label(w), tiles: tilesFor(label(w)),
  }),
  'build-listen': (w) => ({
    kind: 'build', title: `Write what you hear${lw(w, ', with its little word')}`, listen: true, say: w,
    answer: label(w), tiles: tilesFor(label(w)),
  }),
  // One right answer; one has the wrong little word; the others have a slip in the spelling.
  'spell-pick': (w) => {
    const wrongArt = w.art ? sample(ARTICLES.filter((a) => a !== w.art), 1)[0] : null;
    const withArt = (t) => (w.art ? `${w.art} ${t}` : t);
    const wrong = [
      ...(wrongArt ? [opt('xa', `${wrongArt} ${w.el}`, false)] : []),
      ...misspellings(w.el).map((m, i) => opt(`x${i}`, withArt(m), false)),
    ].slice(0, 3);
    return {
      kind: 'choice', title: 'Which spelling is correct?', prompt: w.en, promptClass: 'en', say: w, optClass: 'greek',
      answerText: label(w), options: shuffle([opt('ok', label(w), true), ...wrong]),
    };
  },
  // The missing letter can be in the little word too.
  'missing-letter': (w) => {
    const chars = Array.from(label(w).normalize('NFC'));
    const artLen = w.art ? Array.from(w.art).length : 0;
    const letters = chars.map((c, i) => (isLetter(c) ? i : -1)).filter((i) => i >= 0);
    const inArticle = letters.filter((i) => i < artLen);
    const inWord = letters.filter((i) => i >= artLen);
    const accented = inWord.filter((i) => ACC[chars[i]]);
    let i;
    if (inArticle.length && Math.random() < 0.35) i = inArticle[rnd(inArticle.length)];
    else if (accented.length && Math.random() < 0.4) i = accented[rnd(accented.length)];
    else i = inWord[rnd(inWord.length)];
    const shown = chars.map((c, k) => (k === i ? '＿' : c === ' ' ? ' ' : c)).join(' ');
    return {
      kind: 'choice', title: 'Which letter is missing?', prompt: shown, promptClass: 'letters', sub: w.en, say: w,
      gridClass: 'letters', optClass: 'greek', answerText: label(w),
      options: shuffle([opt(chars[i], chars[i], true), ...letterOptions(chars[i]).map((l) => opt(l, l, false))]),
    };
  },

  // ===== spelling: writing whole phrases =====
  // Every written answer is the word WITH its little word: "ο μπαμπάς". A bare "μπαμπάς" is "so close", not right.
  // New words show a pattern: the first letter of the word is given, the little word is for her to supply.
  'write-hint': (w) => ({
    ...writeBase(w), title: 'Write this in Greek', prompt: w.en, promptClass: 'en', sub: w.art ? 'with its little word. The first letter of the word is shown' : 'The first letter is shown', silent: true, scaffold: true,
  }),
  'write-en': (w) => ({
    ...writeBase(w), title: 'Write this in Greek', prompt: w.en, promptClass: 'en', sub: lw(w, 'with its little word'), silent: true,
  }),
  'write-listen': (w) => ({
    ...writeBase(w), title: `Write what you hear${lw(w, ', with its little word')}`, listen: true,
  }),
  'write-pic': (w) => ({
    ...writeBase(w), title: w.num ? 'Write this number in Greek' : 'Write who this is, with its little word', pic: w, silent: true,
  }),
  // Write the missing word of a sentence (the little word is already in the sentence).
  'write-gap': (w) => {
    const s = pickSentence(w);
    const blanked = s.el.split(' ').map((t) => (strip(t) === s.form ? t.replace(s.form, '＿＿＿') : t)).join(' ');
    return {
      kind: 'write', title: 'Write the missing word', prompt: blanked, promptClass: 'sent', sub: s.en, silent: true, say: pseudo(s),
      answer: s.form, alts: s.form === w.el ? w.alt : w.altPoss,
    };
  },
  // Write the missing LITTLE word of a sentence.
  'write-art-gap': (w) => {
    const cand = artGapCandidates(w);
    const { s, toks, i } = cand[rnd(cand.length)];
    const blanked = toks.map((t, k) => (k === i ? '＿' : t)).join(' ');
    return {
      kind: 'write', title: 'Write the missing little word', prompt: blanked, promptClass: 'sent', sub: s.en, silent: true, say: pseudo(s),
      answer: w.art, alts: [],
    };
  },

  // ===== pronunciation =====
  'listen-pic': (w) => ({
    kind: 'choice', title: 'Tap the monster you hear', listen: true, say: w, gridClass: 'pics', picOpts: true,
    options: shuffle([opt(w.id, label(w), true, { pic: w }), ...distractors(w, 3, { ok: (x) => x.picEx }).map((d) => opt(d.id, label(d), false, { pic: d }))]),
  }),
  'say-tr': (w) => ({
    kind: 'choice', title: 'How do you say it?', sub: lw(w, 'with its little word'), listen: true, say: w, optClass: 'trs', answerText: trFull(w),
    options: shuffle([opt('ok', trFull(w), true), ...trOptions(w).map((t, i) => opt(`x${i}`, t, false))]),
  }),
  stress: (w) => {
    const syl = syllables(w.tr), si = stressIndex(w.tr);
    return {
      kind: 'choice', title: 'Which part do you say loudest?', show: w, say: w, autoplay: true, gridClass: 'stress', optClass: 'greek', keepOrder: true,
      answerText: w.tr,
      options: syl.map((s, i) => opt(`s${i}`, s.toLowerCase(), i === si)),
    };
  },
  speak: (w) => ({ kind: 'speak', title: 'Say it out loud!', say: w, target: w }),

  // ===== sentences =====
  's-blank': (w) => {
    const s = pickSentence(w);
    const blanked = s.el.split(' ').map((t) => (strip(t) === s.form ? t.replace(s.form, '＿＿＿') : t)).join(' ');
    const ds = sample(sameArtPool(w), 3);
    return {
      kind: 'choice', title: 'Fill in the missing word', prompt: blanked, promptClass: 'sent', sub: s.en, silent: true, say: pseudo(s), optClass: 'greek',
      answerText: s.el, options: shuffle([opt(w.id, s.form, true), ...ds.map((d) => opt(d.id, d.poss || d.el, false))]),
    };
  },
  's-translate': (w) => {
    const s = pickSentence(w);
    return {
      kind: 'choice', title: 'What does this sentence mean?', showSentence: s, say: pseudo(s), autoplay: true, answerText: s.en,
      options: shuffle([opt('ok', s.en, true), ...otherTranslations(w, s).map((t, i) => opt(`x${i}`, t, false))]),
    };
  },
  's-listen': (w) => {
    const s = pickSentence(w);
    return {
      kind: 'choice', title: 'What did you hear?', listen: true, say: pseudo(s), answerText: s.en,
      options: shuffle([opt('ok', s.en, true), ...otherTranslations(w, s).map((t, i) => opt(`x${i}`, t, false))]),
    };
  },
  's-build': (w) => {
    const s = pickSentence(w);
    const toks = s.el.split(' ');
    const pool = uniq(sample(inTopic(w).filter((x) => x.id !== w.id && hasWord(x)), 8).flatMap((x) => (pickSentence(x, s.t) || { el: '' }).el.split(' ')))
      .filter((t) => t && !toks.includes(t) && !toks.includes(strip(t)));
    const extra = sample(pool, 2);
    return {
      kind: 'build', title: 'Build the sentence in Greek', prompt: s.en, promptClass: 'sent-en', silent: true, say: pseudo(s),
      answer: s.el, joiner: ' ', words: true,
      tiles: shuffle([...toks, ...extra]).map((c, i) => ({ id: i, c })),
    };
  },
};

export const TYPE_SKILL = {
  'see-en': 'translation', 'listen-en': 'translation', 'en-el': 'translation', 'pic-el': 'translation',
  article: 'translation', counterpart: 'translation', match: 'translation',
  'build-en': 'spelling', 'build-listen': 'spelling', 'spell-pick': 'spelling', 'missing-letter': 'spelling',
  'write-hint': 'spelling', 'write-en': 'spelling', 'write-listen': 'spelling', 'write-pic': 'spelling', 'write-gap': 'spelling', 'write-art-gap': 'spelling',
  'listen-pic': 'pronunciation', 'say-tr': 'pronunciation', stress: 'pronunciation', speak: 'pronunciation',
  's-blank': 'sentences', 's-translate': 'sentences', 's-listen': 'sentences', 's-build': 'sentences',
};

// easy -> hard, by how well the word is known
const TIERS = {
  translation: [['see-en', 'en-el', 'pic-el'], ['listen-en', 'en-el', 'counterpart', 'pic-el', 'article'], ['en-el', 'counterpart', 'article', 'listen-en']],
  // spelling is about WRITING (and the little word is part of every answer): new words start with a pattern hint, then
  // full phrases with no help, plus gap-fills for the word and for the little word
  spelling: [
    ['write-hint', 'write-hint', 'write-hint', 'build-en', 'missing-letter', 'spell-pick'],
    ['write-en', 'write-listen', 'write-hint', 'write-gap', 'write-pic', 'write-art-gap'],
    ['write-en', 'write-gap', 'write-listen', 'write-pic', 'write-art-gap'],
  ],
  pronunciation: [['listen-pic', 'say-tr', 'stress'], ['say-tr', 'stress', 'speak', 'listen-pic'], ['speak', 'say-tr', 'stress']],
  sentences: [['s-blank', 's-translate'], ['s-translate', 's-blank', 's-build'], ['s-build', 's-listen', 's-blank']],
};

// questions per lesson, per skill (lesson 1 is gentle on sentences, lesson 3 leans on them)
const QUOTAS = {
  1: { translation: 3, spelling: 3, pronunciation: 3, sentences: 1 },
  2: { translation: 2, spelling: 4, pronunciation: 2, sentences: 2 },
  3: { translation: 2, spelling: 4, pronunciation: 1, sentences: 3 },
};

function eligible(type, w, caps) {
  switch (type) {
    case 'pic-el': case 'listen-pic': return !!w.picEx && inTopic(w).filter((x) => x.picEx).length >= 4;
    case 'counterpart': return !!w.pair && !!word(w.pair);
    case 'article': return ['ο', 'η', 'το'].includes(w.art);
    case 'build-en': case 'build-listen': return Array.from(w.el).length <= 14;
    case 'missing-letter': return Array.from(w.el).filter(isLetter).length >= 3;
    case 'write-hint': case 'write-en': case 'write-listen': return hasWord(w) && Array.from(w.el).length >= 3 && Array.from(w.el).length <= 14;
    case 'write-pic': return !!w.picEx;
    case 'write-art-gap': return ARTICLES.includes(w.art) && artGapCandidates(w).length > 0;
    case 'write-gap': return sentencesFor(w.id).length > 0;
    case 'stress': return hasWord(w) && syllables(w.tr).length >= 2 && stressIndex(w.tr) >= 0;
    case 'speak': return !!caps.speak;
    case 's-blank': return sentencesFor(w.id).length > 0 && sameArtPool(w).length >= 3;
    case 's-translate': case 's-listen': case 's-build': return sentencesFor(w.id).length > 0;
    default: return true;
  }
}

function makeFor(skill, w, lessonNo, last, caps) {
  const s = Math.min(5, ws(w.id).s + (lessonNo - 1));
  // writing moves up faster than the other skills: hints for brand-new words, then full words, then the little word too
  const tier = skill === 'spelling' ? (s <= 0 ? 0 : s <= 2 ? 1 : 2) : (s <= 1 ? 0 : s <= 3 ? 1 : 2);
  let pool = TIERS[skill][tier].filter((t) => eligible(t, w, caps));
  if (!pool.length) pool = TIERS[skill].flat().filter((t) => eligible(t, w, caps));
  const fresh = pool.filter((t) => t !== last);
  if (fresh.length) pool = fresh;
  if (!pool.length) return null;
  const type = pool[rnd(pool.length)];
  const q = { id: ++uid, type, skill: TYPE_SKILL[type], wid: w.id, ...makers[type](w) };
  // every Say-it task ends with saying the word out loud (the "speak" question already is that)
  if (q.skill === 'pronunciation' && type !== 'speak' && caps.speak) q.needsSpeak = true;
  return q;
}

// A shuffle where no item stays in its original position, so the two columns
// of a matching question never line up by accident.
function jumbled(ids) {
  if (ids.length < 2) return ids;
  let r;
  do { r = shuffle(ids); } while (r.some((id, i) => id === ids[i]));
  return r;
}

function matchQuestion(words) {
  const pick = sample(words, Math.min(4, words.length)); // random order for the Greek column
  return {
    id: ++uid, type: 'match', skill: 'translation', kind: 'match', wid: pick[0].id, title: 'Tap the matching pairs',
    pairs: pick.map((w) => ({ id: w.id, el: label(w), en: w.en, w })),
    rightOrder: jumbled(pick.map((w) => w.id)),
  };
}

// spec: { kind: 'unit', unit, lessonNo } | { kind: 'practice' } | { kind: 'mix' } | { kind: 'skill', skill }
export function buildLesson(spec, caps = { speak: false }) {
  const N = 10;
  let pool;
  const topic = spec.topic || (spec.unit && spec.unit.topic) || 'family';
  const TW = WORDS.filter((w) => topicOf(w) === topic);                  // this section's words
  const TU = UNITS.filter((u) => (u.topic || 'family') === topic);       // and units
  const seen = TW.filter((w) => ws(w.id).seen > 0).sort((a, b) => ws(a.id).s - ws(b.id).s);
  if (spec.kind === 'unit') {
    pool = spec.unit.words.map(word);
    if (pool.length < 5) { // tiny units borrow review words from earlier units of the same section
      const idx = TU.indexOf(spec.unit);
      const earlier = TU.slice(0, idx).flatMap((u) => u.words).map(word).filter((w) => ws(w.id).seen > 0).sort((a, b) => ws(a.id).s - ws(b.id).s);
      pool = [...pool, ...earlier.slice(0, 5 - pool.length)];
    }
  } else if (spec.kind === 'practice') {
    pool = seen.slice(0, 8);
  } else if (spec.kind === 'skill') {
    pool = seen.length >= 4 ? seen.slice(0, 10) : uniq([...seen, ...TU[0].words.map(word), ...(TU[1] ? TU[1].words.map(word) : [])]).slice(0, 8);
  } else {
    const weighted = TW.flatMap((w) => Array(6 - Math.min(5, ws(w.id).s)).fill(w));
    pool = uniq(sample(weighted, 40)).slice(0, 10);
  }
  if (pool.length < 2) pool = TW.slice(0, 5);

  const lessonNo = spec.kind === 'unit' ? spec.lessonNo : spec.kind === 'skill' ? 2 : 3;
  const quota = spec.kind === 'skill' ? { [spec.skill]: N } : { ...QUOTAS[lessonNo] };

  // slots: one entry per question, no skill twice in a row when avoidable
  let slots = Object.entries(quota).flatMap(([skill, n]) => Array(n).fill(skill));
  for (let t = 0; t < 30; t++) {
    slots = shuffle(slots);
    if (slots.every((s, i) => i === 0 || s !== slots[i - 1])) break;
  }
  if (spec.kind !== 'skill' && lessonNo < 3 && pool.length >= 3) {
    const k = slots.findIndex((s) => s === 'translation');
    if (k >= 0) slots[k] = 'match';
  }
  if (spec.kind === 'skill' && spec.skill === 'translation' && pool.length >= 3) slots[4] = 'match';

  const order = [];
  while (order.length < N * 2) order.push(...shuffle(pool).sort((a, b) => ws(a.id).s - ws(b.id).s + (rnd(3) - 1)));
  let oi = 0, last = null;
  const queue = [];
  for (const slot of slots) {
    if (slot === 'match') { queue.push(matchQuestion(pool)); last = 'match'; continue; }
    let q = null;
    for (let tries = 0; tries < order.length && !q; tries++) q = makeFor(slot, order[oi++ % order.length], lessonNo, last, caps);
    if (!q) q = makeFor('translation', order[0], lessonNo, last, caps);
    queue.push(q); last = q.type;
  }
  return queue;
}

export function introWords(unit) { return unit.words.map(word); }
