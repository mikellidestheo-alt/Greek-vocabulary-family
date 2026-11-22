// Checks js/words.js for mistakes. Run:  node scripts/validate-words.mjs
// Add --list to print the audio file name expected for every word.
import { WORDS, UNITS, TOPICS, sentencesFor } from '../js/words.js';

const errors = [];
const ids = new Set();
for (const w of WORDS) {
  for (const f of ['id', 'el', 'tr', 'en', 'pic']) if (!w[f]) errors.push(`${w.id || '?'}: missing "${f}"`);
  if (typeof w.art !== 'string') errors.push(`${w.id}: missing "art" (use '' for a prefix)`);
  if (!/^[a-z]+$/.test(w.id || '')) errors.push(`${w.id}: id must be lowercase latin letters only`);
  if (ids.has(w.id)) errors.push(`${w.id}: duplicate id`);
  ids.add(w.id);
  if (w.el !== w.el.normalize('NFC')) errors.push(`${w.id}: Greek text is not NFC-normalised`);
  if (w.poss && w.poss !== w.poss.normalize('NFC')) errors.push(`${w.id}: "poss" is not NFC-normalised`);
  for (const a of [...(w.alt || []), ...(w.altPoss || []), ...(w.heardAs || [])]) if (a !== a.normalize('NFC')) errors.push(`${w.id}: alternative spelling "${a}" is not NFC-normalised`);
  if (w.poss && !(w.altPoss || []).length !== !(w.alt || []).length) errors.push(`${w.id}: give "altPoss" whenever a word has both "poss" and "alt"`);
  if (w.art && !['ο', 'η', 'το', 'οι', 'τα'].includes(w.art)) errors.push(`${w.id}: unknown article "${w.art}"`);
  if (!/[A-Z]/.test(w.tr || '') && (w.tr || '').split('-').length > 1) errors.push(`${w.id}: tr has no CAPITAL stressed syllable`);
}
for (const w of WORDS) {
  if (w.pair) {
    const p = WORDS.find((x) => x.id === w.pair);
    if (!p) errors.push(`${w.id}: pair "${w.pair}" does not exist`);
    else if (p.pair !== w.id) errors.push(`${w.id}: pair is not mutual with ${p.id}`);
  }
}
const used = new Set();
for (const u of UNITS) {
  for (const id of u.words) {
    if (!ids.has(id)) errors.push(`unit ${u.id}: unknown word "${id}"`);
    if (used.has(id)) errors.push(`unit ${u.id}: word "${id}" is in more than one unit`);
    used.add(id);
  }
  if (!ids.has(u.icon)) errors.push(`unit ${u.id}: icon word "${u.icon}" does not exist`);
}
for (const w of WORDS) if (!used.has(w.id)) errors.push(`${w.id}: not in any unit`);
// sections: a unit holds words of one section only, and number words have a number and no little word
for (const u of UNITS) {
  for (const id of u.words) {
    const w = WORDS.find((x) => x.id === id);
    if (w && (w.topic || 'family') !== (u.topic || 'family')) errors.push(`unit ${u.id} (${u.topic}): word "${id}" belongs to "${w.topic || 'family'}"`);
  }
}
for (const w of WORDS) {
  if (w.topic === 'numbers' && (!Number.isInteger(w.num) || w.art !== '')) errors.push(`${w.id}: a number word needs an integer "num" and art ''`);
  if (w.num != null && (!w.pic || !w.pic.badge || String(w.num) !== w.pic.badge)) errors.push(`${w.id}: the monster's badge should show the number ${w.num}`);
}
// every section has units, and enough pictures for picture questions (days & time has none: that is fine)
for (const t of TOPICS) {
  if (!UNITS.some((u) => u.topic === t.id)) errors.push(`section ${t.id}: has no units`);
  if (!t.picQ || !t.writeQ) errors.push(`section ${t.id}: needs picQ and writeQ (the wording of its picture questions)`);
  const n = WORDS.filter((w) => (w.topic || 'family') === t.id && w.picEx).length;
  if (n > 0 && n < 4) errors.push(`section ${t.id}: has ${n} words with picEx, picture questions need at least 4 (or none)`);
}
for (const w of WORDS) {
  if (!TOPICS.some((t) => t.id === (w.topic || 'family'))) errors.push(`${w.id}: unknown section "${w.topic}"`);
  // describing words have no little word, so every one needs hand-written sentences
  if (w.plain && (w.art !== '' || w.num != null)) errors.push(`${w.id}: a plain word has no little word and no number`);
  if (w.plain && !sentencesFor(w.id).length) errors.push(`${w.id}: a plain word needs sentences in TOWN_SENTENCES`);
  // an emoji or number badge is what makes a picture question answerable: a picEx word needs one (or a colour)
  const badge = w.pic.badge || ((w.pic.figs || [w.pic]).find((f) => f.badge) || {}).badge;
  if (w.picEx && !badge && (w.pic.figs || [w.pic]).length === 1 && !w.colour && w.topic && !['colours'].includes(w.topic)) errors.push(`${w.id}: picEx word with no badge`);
}
if (WORDS.filter((w) => w.picEx).length < 4) errors.push('need at least 4 words with picEx for picture questions');

// sentences: every sentence must contain the word it is about, spelled as `form`
let nSent = 0;
for (const w of WORDS) {
  for (const s of sentencesFor(w.id)) {
    nSent++;
    const tokens = s.el.split(' ').map((t) => t.replace(/[.;?!,]/g, ''));
    if (!tokens.includes(s.form)) errors.push(`sentence ${s.id}: "${s.el}" does not contain "${s.form}"`);
    if (s.el !== s.el.normalize('NFC')) errors.push(`sentence ${s.id}: not NFC-normalised`);
    if (!s.tr || !s.en) errors.push(`sentence ${s.id}: missing tr or en`);
    else if (s.tr.split(' ').length !== s.el.split(' ').length) errors.push(`sentence ${s.id}: "${s.tr}" does not have as many words as "${s.el}"`);
    if (!/[A-Z]/.test(s.tr || '')) errors.push(`sentence ${s.id}: tr has no CAPITAL stressed syllable`);
    if (new RegExp('[A-Za-z]').test(s.el)) errors.push(`sentence ${s.id}: Latin letters in the Greek "${s.el}"`);
    if (s.form !== w.el && s.form !== w.poss) errors.push(`sentence ${s.id}: form "${s.form}" is not "${w.el}"${w.poss ? ` or "${w.poss}"` : ''}`);
  }
}

if (process.argv.includes('--list')) {
  for (const w of WORDS) console.log(`audio/${w.id}.mp3\t${w.art ? w.art + ' ' : ''}${w.el}\t${w.en}`);
}
if (errors.length) { console.error('\nProblems found:\n - ' + errors.join('\n - ')); process.exit(1); }
console.log(`OK: ${WORDS.length} words in ${UNITS.length} units, ${nSent} sentences.`);
