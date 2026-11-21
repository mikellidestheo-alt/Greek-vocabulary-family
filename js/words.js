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
//    alt   (optional) other correct spellings, accepted when she writes the word
//          (e.g. αδελφός for αδερφός)
//    heardAs (optional) things the microphone is known to write when the word is said,
//          which are accepted as that word (e.g. it hears μπαμπάς as the film star Μπαντέρας)
//    poss  (optional) spelling when followed by μου, if the accent moves
//          (ξάδερφος -> ξάδερφός μου)
//    pic   what the little monster looks like (see avatars.js)
//    picEx true if the monster is distinctive enough for picture questions
//    topic (optional) which section of the app the word belongs to ('family' unless set)
//    num   (numbers only) the number itself. These words have no little word (art is '')
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
const UNCLE = { shape: 'tall', fur: 'tie', c: '#35b9c9', c2: '#2f6fd8', c3: '#a6e05a', ec: '#f59a23', mouth: 'open', teeth: 'buck', acc: ['beard', 'glasses'] };
const AUNT = { shape: 'bunny', fur: 'split', c: '#caa6f2', c2: '#9b2c63', ec: '#2fb36d', mouth: 'open', teeth: 'crooked', acc: ['earrings', 'lashes'] };
const BOY = { shape: 'horn', fur: 'fuzzy', c: '#43b86a', ec: '#f5d142', mouth: 'tongue', teeth: 'fangs', acc: ['tuft'], age: 'child' };
const GIRL = { shape: 'blob', fur: 'plush', c: '#ff9cc8', ec: '#5fb7f0', mouth: 'open', teeth: 'buck', acc: ['pigtails'], age: 'child' };
const NEPHEW = { shape: 'round', fur: 'fuzzy', c: '#ff8a6b', ec: '#f5d142', mouth: 'tongue', teeth: 'fangs', acc: ['tuft'], age: 'child' };
const NIECE = { shape: 'cat', fur: 'plush', c: '#f7a8d8', ec: '#2fb36d', mouth: 'open', teeth: 'gap', acc: ['bow', 'lashes'], age: 'child' };
// number-only monsters (1 to 9). The same plush family, just not relatives.
const N1 = { shape: 'horn', fur: 'tie', c: '#ff9f45', c2: '#ffd23f', c3: '#ff6b6b', ec: '#2fb36d', mouth: 'tongue', teeth: 'fangs', acc: ['tuft'] };
const N2 = { shape: 'blob', fur: 'plush', c: '#9c7bea', ec: '#f5d142', mouth: 'open', teeth: 'gap', acc: ['glasses'] };
const N3 = { shape: 'bunny', fur: 'fuzzy', c: '#ffd166', ec: '#7ed321', mouth: 'open', teeth: 'crooked', acc: ['bow'] };
const N4 = { shape: 'round', fur: 'fuzzy', c: '#ef7c8e', ec: '#5fb7f0', mouth: 'tongue', teeth: 'buck', acc: ['cap'], capC: '#2d7dd2' };
const N5 = { shape: 'tall', fur: 'plush', c: '#59c9a5', ec: '#f5d142', mouth: 'open', teeth: 'fangs', acc: ['stache'] };
const N6 = { shape: 'cat', fur: 'tie', c: '#5aa9f0', c2: '#a78bfa', c3: '#f9a8d4', ec: '#fbbf24', mouth: 'open', teeth: 'crooked', acc: ['lashes'] };
const N7 = { shape: 'horn', fur: 'split', c: '#ffb4a2', c2: '#6d6875', ec: '#7ed321', mouth: 'open', teeth: 'gap', acc: ['earrings'] };
const N8 = { shape: 'blob', fur: 'fuzzy', c: '#9fd86b', ec: '#e76f51', mouth: 'tongue', teeth: 'crooked', acc: ['tuft'] };
const N9 = { shape: 'bunny', fur: 'plush', c: '#e0aaff', ec: '#2fb36d', mouth: 'open', teeth: 'buck', acc: ['glasses'] };
const BOY_CAP = { shape: 'cat', fur: 'fuzzy', c: '#f2b630', ec: '#7ed321', mouth: 'tongue', teeth: 'crooked', acc: ['cap'], age: 'child', capC: '#d94f4f' };
const GIRL_BAND = { shape: 'bunny', fur: 'plush', c: '#8e7be0', ec: '#f5d142', mouth: 'open', teeth: 'gap', acc: ['bow'], age: 'child' };

// a number word: no little word, and a monster holding up the number
function num(id, n, el, tr, en, extra) {
  const { monster, ...rest } = extra;
  return { id, el, art: '', tr, en, topic: 'numbers', num: n, pic: { figs: [monster], badge: String(n) }, picEx: true, ...rest };
}

export const WORDS = [
  // ---------------- Mum & Dad ----------------
  { id: 'mama', el: 'μαμά', art: 'η', tr: 'ma-MA', en: 'mum', grp: 'mum', pair: 'mpampas',
    hint: 'The everyday word for mum.', pic: MUM, picEx: true },
  { id: 'mpampas', el: 'μπαμπάς', heardAs: ['μπαντέρας', 'banderas', 'παπάς', 'μπάμπα'], art: 'ο', tr: 'ba-BAS', en: 'dad', grp: 'dad', pair: 'mama',
    hint: 'The everyday word for dad. When you call him, say «Μπαμπά!»', pic: DAD, picEx: true },
  { id: 'mitera', el: 'μητέρα', art: 'η', tr: 'mi-TE-ra', en: 'mother', grp: 'mum', pair: 'pateras',
    hint: 'The formal word. At home you say μαμά.', pic: MUM },
  { id: 'pateras', el: 'πατέρας', art: 'ο', tr: 'pa-TE-ras', en: 'father', grp: 'dad', pair: 'mitera',
    hint: 'The formal word. At home you say μπαμπάς.', pic: DAD },
  { id: 'goneis', el: 'γονείς', art: 'οι', tr: 'go-NEES', en: 'parents', plural: true,
    hint: 'Mum and dad together. Always plural!', pic: { figs: [MUM, DAD] }, picEx: true },

  // ---------------- Brothers & Sisters ----------------
  { id: 'aderfos', el: 'αδερφός', alt: ['αδελφός'], art: 'ο', tr: 'a-ther-FOS', en: 'brother', pair: 'aderfi',
    hint: 'The Greek δ sounds like “th” in “the”. Also written αδελφός.', pic: BOY },
  { id: 'aderfi', el: 'αδερφή', alt: ['αδελφή'], art: 'η', tr: 'a-ther-FEE', en: 'sister', pair: 'aderfos',
    hint: 'Also written αδελφή.', pic: GIRL },
  { id: 'aderfia', el: 'αδέρφια', alt: ['αδέλφια'], art: 'τα', tr: 'a-THER-fia', en: 'brothers and sisters', plural: true,
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
    hint: 'Your brother’s or sister’s son.', pic: NEPHEW },
  { id: 'anipsia', el: 'ανιψιά', art: 'η', tr: 'a-nip-SYA', en: 'niece', pair: 'anipsios',
    hint: 'Your brother’s or sister’s daughter.', pic: NIECE },

  // ---------------- Cousins ----------------
  { id: 'xaderfos', el: 'ξάδερφος', alt: ['ξάδελφος'], poss: 'ξάδερφός', altPoss: ['ξάδελφός'], art: 'ο', tr: 'KSA-ther-fos', en: 'male cousin', pair: 'xaderfi',
    hint: 'Also written ξάδελφος. Starts with “ks”. Before μου the accent moves: ο ξάδερφός μου.', pic: BOY_CAP },
  { id: 'xaderfi', el: 'ξαδέρφη', alt: ['ξαδέλφη'], art: 'η', tr: 'ksa-THER-fi', en: 'female cousin', pair: 'xaderfos',
    hint: 'Also written ξαδέλφη.', pic: GIRL_BAND },
  { id: 'xaderfia', el: 'ξαδέρφια', alt: ['ξαδέλφια'], art: 'τα', tr: 'ksa-THER-fia', en: 'cousins', plural: true,
    hint: 'Cousins, boys and girls together.', pic: { figs: [BOY_CAP, GIRL_BAND] } },

  // ---------------- Great-grandparents ----------------
  { id: 'pro', el: 'προ-', art: '', tr: 'pro', en: 'great- (prefix)', say: 'προ',
    hint: 'Only for grandparents! προ + παππούς = προπάππους.', pic: { figs: [PAPPOUS], badge: 'προ-' } },
  { id: 'propappous', el: 'προπάππους', art: 'ο', tr: 'pro-PA-pus', en: 'great-grandfather', pair: 'progiagia',
    hint: 'Grandfather + προ-.', pic: { figs: [PAPPOUS], badge: 'προ-' }, picEx: true },
  { id: 'progiagia', el: 'προγιαγιά', art: 'η', tr: 'pro-ya-YA', en: 'great-grandmother', pair: 'propappous',
    hint: 'Grandmother + προ-.', pic: { figs: [YIAYIA], badge: 'προ-' }, picEx: true },

  // ---------------- Numbers 1 to 20 (a different section: nothing to do with family) ----------------
  // The same plush monsters hold up each number. Numbers have no little word (art is '').
  // 13 and 14 are given in the form used for counting (neuter), which is also what goes with neuter nouns like μήλα.
  num('one', 1, 'ένα', 'E-na', 'one', { hint: 'This is the counting word. In a sentence it changes: ένας (m), μία (f), ένα (n).', monster: N1, sing: true }),
  num('two', 2, 'δύο', 'THEE-o', 'two', { alt: ['δυο'], hint: 'Also written δυο, with no accent.', monster: N2 }),
  num('three', 3, 'τρία', 'TREE-a', 'three', { hint: 'You will meet it again: δεκα + τρία = δεκατρία (13).', monster: N3 }),
  num('four', 4, 'τέσσερα', 'TE-se-ra', 'four', { hint: 'Double σσ!', monster: N4 }),
  num('five', 5, 'πέντε', 'PEN-de', 'five', { hint: 'δεκα + πέντε = δεκαπέντε (15).', monster: N5 }),
  num('six', 6, 'έξι', 'E-ksi', 'six', { hint: 'The ξ sounds like “ks”.', monster: N6 }),
  num('seven', 7, 'επτά', 'ep-TA', 'seven', { alt: ['εφτά'], heardAs: ['εφτά'], hint: 'Often said and written εφτά.', monster: N7 }),
  num('eight', 8, 'οκτώ', 'ok-TO', 'eight', { alt: ['οχτώ'], heardAs: ['οχτώ'], hint: 'Often said and written οχτώ. Think of an octopus: 8 arms.', monster: N8 }),
  num('nine', 9, 'εννέα', 'e-NE-a', 'nine', { alt: ['εννιά'], heardAs: ['εννιά'], hint: 'Double νν. Often said and written εννιά.', monster: N9 }),
  num('ten', 10, 'δέκα', 'THE-ka', 'ten', { hint: 'Like “deca-” in decade or decathlon.', monster: DAD }),
  num('eleven', 11, 'έντεκα', 'EN-de-ka', 'eleven', { alt: ['ένδεκα'], heardAs: ['ένδεκα'], hint: 'A special word. Also written ένδεκα. You are this old!', monster: GIRL }),
  num('twelve', 12, 'δώδεκα', 'THO-the-ka', 'twelve', { hint: 'Also a special word. Think of a dodecagon: 12 sides.', monster: BOY_CAP }),
  num('thirteen', 13, 'δεκατρία', 'the-ka-TREE-a', 'thirteen', { hint: 'δέκα + τρία (3). From 13 up, the words are δεκα + the number.', monster: MUM }),
  num('fourteen', 14, 'δεκατέσσερα', 'the-ka-TE-se-ra', 'fourteen', { hint: 'δέκα + τέσσερα (4). Double σσ!', monster: UNCLE }),
  num('fifteen', 15, 'δεκαπέντε', 'the-ka-PEN-de', 'fifteen', { hint: 'δέκα + πέντε (5).', monster: GIRL_BAND }),
  num('sixteen', 16, 'δεκαέξι', 'the-ka-E-ksi', 'sixteen', { hint: 'δέκα + έξι (6). The ξ sounds like “ks”.', monster: BOY }),
  num('seventeen', 17, 'δεκαεπτά', 'the-ka-ep-TA', 'seventeen', { alt: ['δεκαεφτά'], hint: 'δέκα + επτά (7). Often said and written δεκαεφτά.', monster: AUNT }),
  num('eighteen', 18, 'δεκαοκτώ', 'the-ka-ok-TO', 'eighteen', { alt: ['δεκαοχτώ'], hint: 'δέκα + οκτώ (8). Often said and written δεκαοχτώ.', monster: PAPPOUS }),
  num('nineteen', 19, 'δεκαεννέα', 'the-ka-e-NE-a', 'nineteen', { alt: ['δεκαεννιά'], hint: 'δέκα + εννέα (9). Double νν. Often written δεκαεννιά.', monster: YIAYIA }),
  num('twenty', 20, 'είκοσι', 'EE-ko-si', 'twenty', { hint: 'A brand-new word, not built from the others. Think of an icosahedron: 20 faces.', monster: NIECE }),
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
  { id: 'num-1', topic: 'numbers', title: 'Numbers 1 to 5', color: '#f26d5b', icon: 'five',
    words: ['one', 'two', 'three', 'four', 'five'],
    note: 'ένα, δύο, τρία, τέσσερα, πέντε. Numbers have no little word (no ο, η or το).' },
  { id: 'num-2', topic: 'numbers', title: 'Numbers 6 to 9', color: '#e6a817', ink: '#4d3300', icon: 'seven',
    words: ['six', 'seven', 'eight', 'nine'],
    note: 'Learn these well: the numbers from 13 to 19 are built from δεκα + these words (δεκα + έξι = δεκαέξι).' },
  { id: 'num-a', topic: 'numbers', title: 'Numbers 10 to 15', color: '#34b86b', icon: 'fifteen',
    words: ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen'],
    note: 'δέκα is ten. έντεκα (11) and δώδεκα (12) are special words. From 13 the words are δεκα + the number: δεκα + τρία = δεκατρία.' },
  { id: 'num-b', topic: 'numbers', title: 'Numbers 16 to 20', color: '#d65bd9', icon: 'twenty',
    words: ['sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'],
    note: 'The same pattern: δεκα + έξι = δεκαέξι. Numbers have no little word (no ο, η or το). είκοσι (20) is a brand-new word.' },
];
UNITS.forEach((u) => { u.topic ||= 'family'; });

// The app has sections. Each one has its own lessons, practice and final mix.
export const TOPICS = [
  { id: 'family', title: 'Family', icon: '👨‍👩‍👧', mix: ['Whole family mix', 'Every word, tricky ones first'], hello: 'Floufi and the family monsters are ready to learn Greek!' },
  { id: 'numbers', title: 'Numbers 1–20', icon: '🔢', mix: ['Number mix', 'Every number, tricky ones first'], hello: 'Floufi and the monsters are ready to count in Greek!' },
];
export const topicOf = (w) => (w && w.topic) || 'family';

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
  // numbers
  { blank: 'one', el: 'Η γιαγιά μου έχει ένα σκυλί.', tr: 'ee ya-YA moo E-hi E-na ski-LEE', en: 'My grandma has one dog.' },
  { blank: 'two', el: 'Έχω δύο χέρια.', tr: 'E-ho THEE-o HE-rya', en: 'I have two hands.' },
  { blank: 'four', el: 'Το τραπέζι έχει τέσσερα πόδια.', tr: 'to tra-PE-zi E-hi TE-se-ra PO-thya', en: 'The table has four legs.' },
  { blank: 'five', el: 'Το χέρι μου έχει πέντε δάχτυλα.', tr: 'to HE-ri moo E-hi PEN-de THA-hti-la', en: 'My hand has five fingers.' },
  { blank: 'six', el: 'Η αδερφή μου είναι έξι χρονών.', tr: 'ee a-ther-FEE moo EE-ne E-ksi hro-NON', en: 'My sister is six years old.' },
  { blank: 'seven', el: 'Η εβδομάδα έχει επτά ημέρες.', tr: 'ee ev-tho-MA-tha E-hi ep-TA ee-ME-res', en: 'The week has seven days.' },
  { blank: 'eight', el: 'Η αράχνη έχει οκτώ πόδια.', tr: 'ee a-RA-hni E-hi ok-TO PO-thya', en: 'The spider has eight legs.' },
  { blank: 'ten', el: 'Έχω δέκα δάχτυλα.', tr: 'E-ho THE-ka THA-hti-la', en: 'I have ten fingers.' },
  { blank: 'eleven', el: 'Είμαι έντεκα χρονών.', tr: 'EE-me EN-de-ka hro-NON', en: 'I am eleven years old.' },
  { blank: 'eleven', el: 'Η ομάδα έχει έντεκα παίκτες.', tr: 'ee o-MA-tha E-hi EN-de-ka PEK-tes', en: 'The team has eleven players.' },
  { blank: 'twelve', el: 'Ο χρόνος έχει δώδεκα μήνες.', tr: 'o HRO-nos E-hi THO-the-ka MEE-nes', en: 'The year has twelve months.' },
  { blank: 'fifteen', el: 'Στην τάξη μου είμαστε δεκαπέντε παιδιά.', tr: 'stin TA-ksi moo EE-ma-ste the-ka-PEN-de pe-THYA', en: 'There are fifteen of us in my class.' },
  { blank: 'sixteen', el: 'Η αδερφή μου είναι δεκαέξι χρονών.', tr: 'ee a-ther-FEE moo EE-ne the-ka-E-ksi hro-NON', en: 'My sister is sixteen years old.' },
  { blank: 'eighteen', el: 'Ο ξάδερφός μου είναι δεκαοκτώ χρονών.', tr: 'o KSA-ther-fos moo EE-ne the-ka-ok-TO hro-NON', en: 'My cousin is eighteen years old.' },
  { blank: 'twenty', el: 'Έχω είκοσι ευρώ.', tr: 'E-ho EE-ko-si ev-RO', en: 'I have twenty euros.' },
];

const DEM = {
  ο: { el: 'Αυτός', tr: 'af-TOS' }, η: { el: 'Αυτή', tr: 'af-TEE' }, το: { el: 'Αυτό', tr: 'af-TO' },
  οι: { el: 'Αυτοί', tr: 'af-TEE' }, τα: { el: 'Αυτά', tr: 'af-TA' },
};
export const ART_TR = { ο: 'o', η: 'ee', το: 'to', οι: 'ee', τα: 'ta' };

// Every word gets three template sentences ("This is my…", "Where is my…?",
// "My … is here.") that follow the right Greek gender, plus any hand-written ones.
export function sentencesFor(wid) {
  const w = byId.get(wid);
  if (!w) return [];
  if (w.num) return numberSentences(w);
  if (!w.art) return [];
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

// Numbers have no little word, so they get their own three template sentences (with neuter plural nouns, which
// is what 13 and 14 need), plus any hand-written ones. The number is always a separate word in the sentence.
function numberSentences(w) {
  const form = w.el;
  const one = !!w.sing; // "one" goes with a singular noun: ένα μήλο
  const gen = [
    one ? { el: `Έχω ${form} μήλο.`, tr: `E-ho ${w.tr} MEE-lo.`, en: `I have ${w.en} apple.` } : { el: `Έχω ${form} μήλα.`, tr: `E-ho ${w.tr} MEE-la.`, en: `I have ${w.en} apples.` },
    one ? { el: `Βλέπω ${form} αστέρι.`, tr: `VLE-po ${w.tr} a-STE-ri.`, en: `I can see ${w.en} star.` } : { el: `Βλέπω ${form} αστέρια.`, tr: `VLE-po ${w.tr} a-STE-rya.`, en: `I can see ${w.en} stars.` },
    { el: `Μετράω μέχρι το ${form}.`, tr: `me-TRA-o ME-hri to ${w.tr}.`, en: `I count up to ${w.en}.` },
  ].map((s, t) => ({ ...s, t, id: `${w.id}-${t}`, blank: w.id, form }));
  const hand = HAND_SENTENCES.filter((h) => h.blank === w.id)
    .map((h, i) => ({ ...h, t: 3 + i, id: `${w.id}-h${i}`, form: h.form || form }));
  return [...gen, ...hand];
}
