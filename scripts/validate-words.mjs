// Checks js/words.js for mistakes. Run:  node scripts/validate-words.mjs
// Add --list to print the audio file name expected for every word.
import { WORDS, UNITS, sentencesFor } from '../js/words.js';

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
  for (const a of [...(w.alt || []), ...(w.altPoss || [])]) if (a !== a.normalize('NFC')) errors.push(`${w.id}: alternative spelling "${a}" is not NFC-normalised`);
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
    if (s.form !== w.el && s.form !== w.poss) errors.push(`sentence ${s.id}: form "${s.form}" is not "${w.el}"${w.poss ? ` or "${w.poss}"` : ''}`);
  }
}

if (process.argv.includes('--list')) {
  for (const w of WORDS) console.log(`audio/${w.id}.mp3\t${w.art ? w.art + ' ' : ''}${w.el}\t${w.en}`);
}
if (errors.length) { console.error('\nProblems found:\n - ' + errors.join('\n - ')); process.exit(1); }
console.log(`OK: ${WORDS.length} words in ${UNITS.length} units, ${nSent} sentences.`);
