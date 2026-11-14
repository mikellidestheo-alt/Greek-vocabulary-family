// =====================================================================
//  WORD DATA  -  edit this file to add or change words and sentences.
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
//    poss  (optional) spelling when followed by μου, if the accent moves
//          (ξάδερφος -> ξάδερφός μου)
//    pic   what the little monster looks like (see avatars.js)
//    picEx true if the monster is distinctive enough for picture questions
//
//  Each unit lists the word ids it teaches, in order.
//
//  Sentences are made automatically for every word (see sentencesFor) and
//  you can add hand-written ones in HAND_SENTENCES below.
// =====================================================================

// ---- monster recipes ------------------------------------------------
const MUM = { shape: 'cat', fur: 'fuzzy', c: '#ef6fae', ec: '#7ed321', mouth: 'tongue', teeth: 'crooked', acc: ['bow', 'lashes'] };
const DAD = { shape: 'blob', fur: 'plush', c: '#4a90e2', ec: '#f5d142', mouth: 'open', teeth: 'buck', acc: ['stache', 'tie'], tieC: '#e2554f' };
const PAPPOUS = { shape: 'round', fur: 'fuzzy', c: '#cfc9dc', ec: '#8dd0e8', mouth: 'open', teeth: 'gap', acc: ['glasses', 'brows', 'stache', 'cane'], age: 'elder' };
const YIAYIA = { shape: 'round', fur: 'plush', c: '#b78be6', ec: '#7ed321', mouth: 'open', teeth: 'gap', acc: ['glasses', 'bun', 'scarf'], age: 'elder', scarfC: '#f5a623' };
const UNCLE = { shape: 'tall', fur: 'tie', c: '#f08c3c', c2: '#e0558f', c3: '#f5d04a', ec: '#7ed321', mouth: 'open', teeth: 'crooked', acc: ['beard', 'cap'], capC: '#2d7dd2' };
const AUNT = { shape: 'bunny', fur: 'split', c: '#caa6f2', c2: '#9b2c63', ec: '#2fb36d', mouth: 'open', teeth: 'crooked', acc: ['earrings', 'lashes'] };
const BOY = { shape: 'horn', fur: 'fuzzy', c: '#43b86a', ec: '#f5d142', mouth: 'tongue', teeth: 'fangs', acc: ['tuft'], age: 'child' };
const GIRL = { shape: 'blob', fur: 'plush', c: '#ff9cc8', ec: '#5fb7f0', mouth: 'open', teeth: 'buck', acc: ['pigtails'], age: 'child' };
const BOY_CAP = { shape: 'cat', fur: 'fuzzy', c: '#f2b630', ec: '#7ed321', mouth: 'tongue', teeth: 'crooked', acc: ['cap'], age: 'child', capC: '#d94f4f' };
const GIRL_BAND = { shape: 'bunny', fur: 'plush', c: '#8e7be0', ec: '#f5d142', mouth: 'open', teeth: 'gap', acc: ['bow'], age: 'child' };

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
    hint: 'Also used for great-uncles and for close older family friends.', pic: UNCLE, picEx: true },
  { id: 'theia', el: 'θεία', art: 'η', tr: 'THEE-a', en: 'aunt', pair: 'theios',
    hint: 'Also used for great-aunts. There is no προ- for aunts and uncles!', pic: AUNT, picEx: true },
  { id: 'anipsios', el: 'ανιψιός', art: 'ο', tr: 'a-nip-SYOS', en: 'nephew', pair: 'anipsia',
    hint: 'Your brother’s or sister’s son.', pic: { figs: [UNCLE, BOY] } },
  { id: 'anipsia', el: 'ανιψιά', art: 'η', tr: 'a-nip-SYA', en: 'niece', pair: 'anipsios',
    hint: 'Your brother’s or sister’s daughter.', pic: { figs: [AUNT, GIRL] } },

  // ---------------- Cousins ----------------
  { id: 'xaderfos', el: 'ξάδερφος', poss: 'ξάδερφός', art: 'ο', tr: 'KSA-ther-fos', en: 'male cousin', pair: 'xaderfi',
    hint: 'Also written ξάδελφος. Starts with “ks”. Before μου the accent moves: ο ξάδερφός μου.', pic: BOY_CAP },
  { id: 'xaderfi', el: 'ξαδέρφη', art: 'η', tr: 'ksa-THER-fi', en: 'female cousin', pair: 'xaderfos',
    hint: 'Also written ξαδέλφη.', pic: GIRL_BAND },
  { id: 'xaderfia', el: 'ξαδέρφια', art: 'τα', tr: 'ksa-THER-fia', en: 'cousins', plural: true,
    hint: 'Cousins, boys and girls together.', pic: { figs: [BOY_CAP, GIRL_BAND] } },

  // ---------------- Great-grandparents ----------------
  { id: 'pro', el: 'προ-', art: '', tr: 'pro', en: 'great- (prefix)', say: 'προ',
    hint: 'Only for grandparents! προ + παππούς = προπάππους.', pic: { figs: [PAPPOUS], badge: 'προ-' } },
  { id: 'propappous', el: 'προπάππους', art: 'ο', tr: 'pro-PA-pus', en: 'great-grandfather', pair: 'progiagia',
    hint: 'Grandfather + προ-.', pic: { figs: [PAPPOUS], badge: 'προ-' }, picEx: true },
  { id: 'progiagia', el: 'προγιαγιά', art: 'η', tr: 'pro-ya-YA', en: 'great-grandmother', pair: 'propappous',
    hint: 'Grandmother + προ-.', pic: { figs: [YIAYIA], badge: 'προ-' }, picEx: true },
];

export const UNITS = [
  { id: 'parents', title: 'Mum & Dad', color: '#8a6bff', icon: 'mama',
    words: ['mama', 'mpampas', 'mitera', 'pateras', 'goneis'],
    note: 'At home you say μαμά and μπαμπάς. μητέρα and πατέρας are the polite, formal words.' },
  { id: 'siblings', title: 'Brothers & Sisters', color: '#16b8a2', icon: 'aderfi',
    words: ['aderfos', 'aderfi', 'aderfia', 'gios', 'kori', 'paidi'],
    note: 'Listen for the Greek δ: it sounds like the “th” in “the”.' },
  { id: 'grandparents', title: 'Grandparents', color: '#f2599f', icon: 'giagia',
    words: ['pappous', 'giagia', 'egonos', 'egoni'],
    note: 'Ο παππούς and η γιαγιά are the grandparents. Their grandchildren are οι εγγονοί.' },
  { id: 'auntsuncles', title: 'Aunts & Uncles', color: '#ff8a2b', icon: 'theios',
    words: ['theios', 'theia', 'anipsios', 'anipsia'],
    note: 'Great-uncles and great-aunts are simply θείος and θεία. There is no προ- for them!' },
  { id: 'cousins', title: 'Cousins', color: '#2fa8ee', icon: 'xaderfi',
    words: ['xaderfos', 'xaderfi', 'xaderfia'],
    note: 'Boys and girls together are τα ξαδέρφια, a neuter plural.' },
  { id: 'great', title: 'Great-grandparents', color: '#ffc83d', ink: '#4d3300', icon: 'propappous',
    words: ['pro', 'propappous', 'progiagia'],
    note: 'The prefix προ- means “great”, but only grandparents get it: προ + γιαγιά = προγιαγιά.' },
];

export const LESSONS_PER_UNIT = 3;

const byId = new Map(WORDS.map((w) => [w.id, w]));
export const word = (id) => byId.get(id);
export const unitOf = (wid) => UNITS.find((u) => u.words.includes(wid));
export const label = (w) => (w.art ? `${w.art} ${w.el}` : w.el);

// ---------------- sentences ----------------
// Extra hand-written sentences. `blank` is the word that gets hidden in the
// fill-in-the-blank game; `form` is how that word is spelled in the sentence.
const HAND_SENTENCES = [
  { blank: 'mama', el: 'Η μαμά μου χαμογελάει.', tr: 'ee ma-MA moo ha-mo-ye-LA-ee', en: 'My mum is smiling.' },
  { blank: 'mpampas', el: 'Ο μπαμπάς μου είναι στο σπίτι.', tr: 'o ba-BAS moo EE-ne sto SPEE-ti', en: 'My dad is at home.' },
  { blank: 'giagia', el: 'Η γιαγιά μου μαγειρεύει.', tr: 'ee ya-YA moo ma-yi-RE-vi', en: 'My grandma is cooking.' },
  { blank: 'pappous', el: 'Ο παππούς μου διαβάζει.', tr: 'o pa-POOS moo thya-VA-zi', en: 'My grandpa is reading.' },
  { blank: 'theia', el: 'Η θεία μου έρχεται σήμερα.', tr: 'ee THEE-a moo ER-he-te SEE-me-ra', en: 'My aunt is coming today.' },
  { blank: 'theios', el: 'Ο θείος μου παίζει κιθάρα.', tr: 'o THEE-os moo PE-zi ki-THA-ra', en: 'My uncle plays the guitar.' },
  { blank: 'aderfos', el: 'Ο αδερφός μου τρέχει.', tr: 'o a-ther-FOS moo TRE-hi', en: 'My brother is running.' },
  { blank: 'aderfi', el: 'Η αδερφή μου τραγουδάει.', tr: 'ee a-ther-FEE moo tra-ghoo-THA-ee', en: 'My sister is singing.' },
  { blank: 'xaderfos', form: 'ξάδερφός', el: 'Ο ξάδερφός μου παίζει.', tr: 'o KSA-ther-fos moo PE-zi', en: 'My cousin is playing.' },
  { blank: 'xaderfi', el: 'Η ξαδέρφη μου χορεύει.', tr: 'ee ksa-THER-fi moo ho-RE-vi', en: 'My female cousin is dancing.' },
  { blank: 'gios', el: 'Ο γιος μου κοιμάται.', tr: 'o YOS moo ki-MA-te', en: 'My son is sleeping.' },
  { blank: 'kori', el: 'Η κόρη μου ζωγραφίζει.', tr: 'ee KO-ri moo zo-ghra-FEE-zi', en: 'My daughter is drawing.' },
  { blank: 'progiagia', el: 'Η προγιαγιά μου είναι πολύ γλυκιά.', tr: 'ee pro-ya-YA moo EE-ne po-LEE ghli-KYA', en: 'My great-grandmother is very sweet.' },
];

const DEM = {
  ο: { el: 'Αυτός', tr: 'af-TOS' }, η: { el: 'Αυτή', tr: 'af-TEE' }, το: { el: 'Αυτό', tr: 'af-TO' },
  οι: { el: 'Αυτοί', tr: 'af-TEE' }, τα: { el: 'Αυτά', tr: 'af-TA' },
};
const ART_TR = { ο: 'o', η: 'ee', το: 'to', οι: 'ee', τα: 'ta' };

// Every word gets three template sentences ("This is my…", "Where is my…?",
// "My … is here.") that follow the right Greek gender, plus any hand-written ones.
export function sentencesFor(wid) {
  const w = byId.get(wid);
  if (!w || !w.art) return [];
  const form = w.poss || w.el;
  const d = DEM[w.art], a = ART_TR[w.art];
  const A = w.art.charAt(0).toUpperCase() + w.art.slice(1);
  const pl = !!w.plural;
  const gen = [
    { el: `${d.el} είναι ${w.art} ${form} μου.`, tr: `${d.tr} EE-ne ${a} ${w.tr} moo.`, en: pl ? `These are my ${w.en}.` : `This is my ${w.en}.` },
    { el: `Πού είναι ${w.art} ${form} μου;`, tr: `poo EE-ne ${a} ${w.tr} moo?`, en: pl ? `Where are my ${w.en}?` : `Where is my ${w.en}?` },
    { el: `${A} ${form} μου είναι εδώ.`, tr: `${a} ${w.tr} moo EE-ne e-THO.`, en: `My ${w.en} ${pl ? 'are' : 'is'} here.` },
  ].map((s, t) => ({ ...s, t, id: `${wid}-${t}`, blank: wid, form }));
  const hand = HAND_SENTENCES.filter((h) => h.blank === wid)
    .map((h, i) => ({ ...h, t: 3 + i, id: `${wid}-h${i}`, form: h.form || form }));
  return [...gen, ...hand];
}
