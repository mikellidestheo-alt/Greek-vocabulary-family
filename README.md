# Οικογένεια · Monster Family Greek

A Duolingo-style app for learning the Greek words for the people in your family,
starring a family of silly plush monsters. Made for a 5th-grader who already knows
some Greek, and built to fill a tablet screen.

Plain HTML, CSS and JavaScript. There is nothing to install and no build step.

> The monsters and the mascot (Floufi) are original drawings in a "quirky plush monster"
> style. They are not affiliated with, or endorsed by, the makers of any toy brand.

## What's in it

- **6 units, 25 words**: Mum & Dad, Brothers & Sisters, Grandparents, Aunts & Uncles,
  Cousins, and the **προ-** ("great-") prefix. It has male and female forms
  (θείος/θεία, ξάδερφος/ξαδέρφη) and a few plurals (γονείς, ξαδέρφια).
  Only grandparents get **προ-** (προπάππους, προγιαγιά). Great-uncles and great-aunts are just θείος/θεία.
- **Every relative is a monster**: fuzzy, tie-dye and two-tone fur, googly eyes and crooked teeth.
- **3 lessons per unit**, getting harder as she learns, then a final "whole family mix".

### Four skills, in every lesson

Every lesson mixes all four, and each can be practised on its own from the Learn page.
Progress for each skill is shown on the **Me** page.

| Skill | Activities |
| --- | --- |
| 🌍 **Translate** | Greek → English, English → Greek, picture questions, ο / η / το, male ↔ female partner, matching pairs |
| 🔤 **Spell** | build the word from letter tiles (from English or from sound), pick the correct spelling, find the missing letter |
| 🗣️ **Say it** | hear it and tap the monster, pick the right pronunciation, which syllable is loudest, **say it out loud** |
| 💬 **Sentences** | fill the missing word, translate a sentence, listen and understand, build a Greek sentence from word tiles |

There are 85 sentences. Every word gets "This is my…", "Where is my…?" and "My … is here."
with the right Greek gender (Αυτός / Αυτή / Αυτό …), plus some hand-written action sentences.

**Speaking practice** listens through the microphone where the browser supports it
(Chrome, Android, recent Safari) and checks the word. Otherwise she records herself,
hears herself next to the real word, and rates herself. It never costs a heart and can be skipped
or switched off (Me → Sound).

### Rewards

XP, a daily streak, a daily goal ring, 5 hearts per lesson, confetti, and a word-strength
system, so tricky words come back more often ("Practise my tricky words").

### Made for tablets

- Fills the screen: the layout scales with the display, with a side menu in landscape
  and a bottom bar in portrait.
- **Full screen**: install it (iPad: Share › Add to Home Screen, Android: ⋮ › Install app)
  and it opens full screen like a real app. There is also a ⛶ button for browsers that allow it.
- Works offline once loaded. Progress is saved **on the device only**, with no accounts.

## Pronunciation audio

The app plays the best audio it can find, in this order:

1. **A voice recorded on this device**: Me → Record family voices. Yiayia or Pappou
   says each word into the tablet. It works straight away and is saved on that device.
2. **An mp3 file in [`audio/`](audio/README.md)**, such as `audio/giagia.mp3`. These are
   shared with every device that opens the site.
3. **The device's own Greek voice** (text-to-speech). This is free, but the quality
   depends on the device.

Run `node scripts/validate-words.mjs --list` to see the exact file name for every word.

## Publishing (GitHub Pages)

`.github/workflows/pages.yml` deploys the site every time something is pushed to `main`.
In the repository go to **Settings → Pages → Build and deployment → Source: GitHub Actions**
(one time only). The address will be `https://<your-username>.github.io/Greek-vocabulary-family/`.

> GitHub Pages sites are public. Don't put family photos or anything private in this repo.
> The app uses cartoon monsters for that reason.

## Adding or changing words and sentences

Everything lives in [`js/words.js`](js/words.js). Copy an existing word, change the fields,
and add its `id` to a unit. Hand-written sentences go in `HAND_SENTENCES`.
The comments at the top explain each field.
Run `node scripts/validate-words.mjs` to check for mistakes. It also runs on every deploy,
so a typo can't break the live site.

## Running it on your computer

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

(Opening `index.html` directly won't work, because browsers block JavaScript modules on `file://`.)
Add `?debug` to the address to expose the answers in the page, which is handy for testing.

## Files

| Path | What it is |
| --- | --- |
| `index.html`, `css/style.css` | page and styling |
| `js/words.js` | **the words, units, sentences and monster recipes** |
| `js/lesson.js` | builds the questions for each lesson and skill |
| `js/app.js` | screens and the lesson player |
| `js/audio.js` | recordings, mp3 files, text-to-speech, speech recognition, sound effects |
| `js/avatars.js` | the monsters and the mascot, drawn as SVG |
| `js/store.js` | saving progress, XP, streaks and skill stats |
| `sw.js`, `manifest.webmanifest`, `icons/` | offline use and "install as app" |
| `scripts/` | word-list checker and audio indexer (run on deploy) |
