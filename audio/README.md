# Pronunciation recordings

Drop an mp3 in this folder named after the word's `id` and the app uses it instead of
the computer voice. For example `audio/giagia.mp3` is played for η γιαγιά.

Words without a file keep using the device's Greek voice, so you can record just a few.

## File names

| File | Word |
| --- | --- |
| `mama.mp3` | η μαμά (mum) |
| `mpampas.mp3` | ο μπαμπάς (dad) |
| `mitera.mp3` | η μητέρα (mother) |
| `pateras.mp3` | ο πατέρας (father) |
| `goneis.mp3` | οι γονείς (parents) |
| `aderfos.mp3` | ο αδερφός (brother) |
| `aderfi.mp3` | η αδερφή (sister) |
| `aderfia.mp3` | τα αδέρφια (brothers and sisters) |
| `gios.mp3` | ο γιος (son) |
| `kori.mp3` | η κόρη (daughter) |
| `paidi.mp3` | το παιδί (child) |
| `pappous.mp3` | ο παππούς (grandfather) |
| `giagia.mp3` | η γιαγιά (grandmother) |
| `egonos.mp3` | ο εγγονός (grandson) |
| `egoni.mp3` | η εγγονή (granddaughter) |
| `theios.mp3` | ο θείος (uncle) |
| `theia.mp3` | η θεία (aunt) |
| `anipsios.mp3` | ο ανιψιός (nephew) |
| `anipsia.mp3` | η ανιψιά (niece) |
| `xaderfos.mp3` | ο ξάδερφος (male cousin) |
| `xaderfi.mp3` | η ξαδέρφη (female cousin) |
| `xaderfia.mp3` | τα ξαδέρφια (cousins) |
| `pro.mp3` | προ- (the "great-" prefix) |
| `propappous.mp3` | ο προπάππους (great-grandfather) |
| `progiagia.mp3` | η προγιαγιά (great-grandmother) |

(`node scripts/validate-words.mjs --list` prints this table from the real word list.)

## Tips

- Say the word **with** its little word, e.g. "η γιαγιά", because that is what the app reads out.
- Keep each clip short (one or two seconds) and quiet in the background. A phone voice memo is fine.
  Convert to mp3 if the phone saves `.m4a`.
- `index.json` is rewritten automatically when the site is deployed. Locally, run
  `node scripts/build-audio-index.mjs` after adding files.
