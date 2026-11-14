// =====================================================================
//  WORD DATA  -  edit this file to add or change words.
//
//  Each word needs:
//    id    unique, lowercase latin letters (also the audio file name:
//          audio/<id>.mp3 is played instead of the computer voice)
//    el    the Greek word, WITHOUT the article  (must be NFC-normalised)
//    art   ο / η / το / οι / τα   ('' for a prefix)
//    tr    pronunciation in latin letters, stressed syllable in CAPITALS
//    en    English meaning
//    hint  (optional) a short tip shown on the card
//    pair  (optional) id of the male/female counterpart
//    grp   (optional) words in the same group mean nearly the same thing,
//          so they are never offered as wrong answers for each other
//    pic   what the little cartoon looks like (see avatars.js)
//    picEx true if the cartoon is distinctive enough for picture questions
//
//  Each unit lists the word ids it teaches, in order.
// =====================================================================

const DARK = '#3b2a20';
const BROWN = '#8a5a35';
const GREY = '#c4c4d0';
const WHITE = '#f3f3f8';
const BLOND = '#d9a441';

// ---- cartoon recipes ------------------------------------------------
const MUM = { g: 'f', a: 'adult', hair: 'long', hc: DARK, shirt: '#ef6f6c', ear: true };
const DAD = { g: 'm', a: 'adult', hair: 'short', hc: DARK, shirt: '#3b82c4', stache: true };
const PAPPOUS = { g: 'm', a: 'elder', hair: 'sides', hc: WHITE, shirt: '#7a8b6f', stache: true, glasses: true, cane: true };
const YIAYIA = { g: 'f', a: 'elder', hair: 'bun', hc: GREY, shirt: '#9b6bb5', glasses: true };
const UNCLE = { g: 'm', a: 'adult', hair: 'short', hc: BROWN, shirt: '#f08c3c', beard: true };
const AUNT = { g: 'f', a: 'adult', hair: 'wavy', hc: BROWN, shirt: '#2fa8a0', ear: true };
const BOY = { g: 'm', a: 'child', hair: 'short', hc: DARK, shirt: '#58b368' };
const GIRL = { g: 'f', a: 'child', hair: 'pony', hc: DARK, shirt: '#ec7fb0' };
const BOY_CAP = { g: 'm', a: 'child', hair: 'cap', hc: DARK, shirt: '#e0b030', cap: '#d94f4f' };
const GIRL_BAND = { g: 'f', a: 'child', hair: 'band', hc: BLOND, shirt: '#8e7be0', band: '#f4c542' };

export const WORDS = [
  // ---------------- Mum & Dad ----------------
  { id: 'mama', el: 'μαμά', art: 'η', tr: 'ma-MA', en: 'mum', grp: 'mum', pair: 'mpampas',
    hint: 'The everyday word for mum.', pic: MUM, picEx: true },
  { id: 'mpampas', el: 'μπαμπάς', art: 'ο', tr: 'ba-BAS', en: 'dad', grp: 'dad', pair: 'mama',
    hint: 'The everyday word for dad. When you call him, say «Μπαμπά!»', pic: DAD, picEx: true },
  { id: 'mitera', el: 'μητέρα', art: 'η', tr: 'mi-TE-ra', en: 'mother', grp: 'mum', pair: 'pateras',
    hint: 'The formal word. At home you say μαμά.', pic: MUM },
  { id: 'pateras', el: 'πατέρας', art: 'ο', tr: 'pa-TE-ras', en: 'father', grp: 'dad', pair: 'mitera',
    hint: 'The formal word. At home you say μπαμπάς.', pic: DAD },
  { id: 'goneis', el: 'γονείς', art: 'οι', tr: 'go-NEES', en: 'parents', plural: true,
    hint: 'Mum and dad together. Always plural!', pic: { figs: [MUM, DAD] }, picEx: true },

  // ---------------- Brothers & Sisters ----------------
  { id: 'aderfos', el: 'αδερφός', art: 'ο', tr: 'a-ther-FOS', en: 'brother', pair: 'aderfi',
    hint: 'The Greek δ sounds like “th” in “the”. Also written αδελφός.', pic: BOY },
  { id: 'aderfi', el: 'αδερφή', art: 'η', tr: 'a-ther-FEE', en: 'sister', pair: 'aderfos',
    hint: 'Also written αδελφή.', pic: GIRL },
  { id: 'aderfia', el: 'αδέρφια', art: 'τα', tr: 'a-THER-fia', en: 'brothers and sisters', plural: true,
    hint: 'Siblings, boys and girls together.', pic: { figs: [BOY, GIRL] } },
  { id: 'gios', el: 'γιος', art: 'ο', tr: 'YOS', en: 'son', pair: 'kori',
    hint: 'A short word with a long “o”: yos.', pic: { figs: [DAD, BOY] } },
  { id: 'kori', el: 'κόρη', art: 'η', tr: 'KO-ri', en: 'daughter', pair: 'gios',
    hint: 'Also means “girl”.', pic: { figs: [MUM, GIRL] } },
  { id: 'paidi', el: 'παιδί', art: 'το', tr: 'pe-THEE', en: 'child',
    hint: 'This one is neuter, so it uses το. Plural: τα παιδιά.', pic: { figs: [BOY, GIRL_BAND] } },

  // ---------------- Grandparents ----------------
  { id: 'pappous', el: 'παππούς', art: 'ο', tr: 'pa-POOS', en: 'grandfather', pair: 'giagia',
    hint: 'When you call him, drop the ς: «Παππού!»', pic: PAPPOUS, picEx: true },
  { id: 'giagia', el: 'γιαγιά', art: 'η', tr: 'ya-YA', en: 'grandmother', pair: 'pappous',
    hint: 'When you call her: «Γιαγιά!»', pic: YIAYIA, picEx: true },
  { id: 'egonos', el: 'εγγονός', art: 'ο', tr: 'en-go-NOS', en: 'grandson', pair: 'egoni',
    hint: 'The γγ in the middle sounds like “ng”.', pic: { figs: [YIAYIA, BOY] } },
  { id: 'egoni', el: 'εγγονή', art: 'η', tr: 'en-go-NEE', en: 'granddaughter', pair: 'egonos',
    pic: { figs: [PAPPOUS, GIRL] } },

  // ---------------- Aunts & Uncles ----------------
  { id: 'theios', el: 'θείος', art: 'ο', tr: 'THEE-os', en: 'uncle', pair: 'theia',
    hint: 'Greeks also call close older family friends “θείος”.', pic: UNCLE, picEx: true },
  { id: 'theia', el: 'θεία', art: 'η', tr: 'THEE-a', en: 'aunt', pair: 'theios',
    pic: AUNT, picEx: true },
  { id: 'anipsios', el: 'ανιψιός', art: 'ο', tr: 'a-nip-SYOS', en: 'nephew', pair: 'anipsia',
    hint: 'Your brother’s or sister’s son.', pic: { figs: [UNCLE, BOY] } },
  { id: 'anipsia', el: 'ανιψιά', art: 'η', tr: 'a-nip-SYA', en: 'niece', pair: 'anipsios',
    hint: 'Your brother’s or sister’s daughter.', pic: { figs: [AUNT, GIRL] } },

  // ---------------- Cousins ----------------
  { id: 'xaderfos', el: 'ξάδερφος', art: 'ο', tr: 'KSA-ther-fos', en: 'male cousin', pair: 'xaderfi',
    hint: 'Also written ξάδελφος. Starts with “ks”.', pic: BOY_CAP },
  { id: 'xaderfi', el: 'ξαδέρφη', art: 'η', tr: 'ksa-THER-fi', en: 'female cousin', pair: 'xaderfos',
    hint: 'Also written ξαδέλφη.', pic: GIRL_BAND },
  { id: 'xaderfia', el: 'ξαδέρφια', art: 'τα', tr: 'ksa-THER-fia', en: 'cousins', plural: true,
    hint: 'Cousins, boys and girls together.', pic: { figs: [BOY_CAP, GIRL_BAND] } },

  // ---------------- Great-! ----------------
  { id: 'pro', el: 'προ-', art: '', tr: 'pro', en: 'great- (prefix)', say: 'προ',
    hint: 'Put προ- in front: προ + παππούς = προπάππους.', pic: { figs: [PAPPOUS], badge: 'προ-' } },
  { id: 'propappous', el: 'προπάππους', art: 'ο', tr: 'pro-PA-pus', en: 'great-grandfather', pair: 'progiagia',
    hint: 'Grandfather + προ-.', pic: { figs: [PAPPOUS], badge: 'προ-' }, picEx: true },
  { id: 'progiagia', el: 'προγιαγιά', art: 'η', tr: 'pro-ya-YA', en: 'great-grandmother', pair: 'propappous',
    hint: 'Grandmother + προ-.', pic: { figs: [YIAYIA], badge: 'προ-' }, picEx: true },
];

export const UNITS = [
  { id: 'parents', title: 'Mum & Dad', color: '#1f78d1', icon: 'mama',
    words: ['mama', 'mpampas', 'mitera', 'pateras', 'goneis'],
    note: 'At home you say μαμά and μπαμπάς. μητέρα and πατέρας are the polite, formal words.' },
  { id: 'siblings', title: 'Brothers & Sisters', color: '#2fa36b', icon: 'aderfi',
    words: ['aderfos', 'aderfi', 'aderfia', 'gios', 'kori', 'paidi'],
    note: 'Listen for the Greek δ: it sounds like the “th” in “the”.' },
  { id: 'grandparents', title: 'Grandparents', color: '#8a5bd1', icon: 'giagia',
    words: ['pappous', 'giagia', 'egonos', 'egoni'],
    note: 'Ο παππούς and η γιαγιά are the grandparents. Their grandchildren are οι εγγονοί.' },
  { id: 'auntsuncles', title: 'Aunts & Uncles', color: '#ef8a2c', icon: 'theios',
    words: ['theios', 'theia', 'anipsios', 'anipsia'],
    note: 'Great-uncle and great-aunt: most families just say θείος and θεία. Ask Yiayia if your family has its own special word!' },
  { id: 'cousins', title: 'Cousins', color: '#e0558f', icon: 'xaderfi',
    words: ['xaderfos', 'xaderfi', 'xaderfia'],
    note: 'Boys and girls together are τα ξαδέρφια, a neuter plural.' },
  { id: 'great', title: 'Great-!', color: '#d9a21b', icon: 'propappous',
    words: ['pro', 'propappous', 'progiagia'],
    note: 'The prefix προ- means “great”. Stick it in front: προ + γιαγιά = προγιαγιά.' },
];

export const LESSONS_PER_UNIT = 3;

const byId = new Map(WORDS.map((w) => [w.id, w]));
export const word = (id) => byId.get(id);
export const unitOf = (wid) => UNITS.find((u) => u.words.includes(wid));
export const label = (w) => (w.art ? `${w.art} ${w.el}` : w.el);
