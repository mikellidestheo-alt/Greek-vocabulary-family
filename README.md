# Οικογένεια · Family Greek

A Duolingo-style app for learning the Greek words for the people in your family.
Made for a 5th-grader who already knows some Greek, with pictures, pronunciation
audio, and short lessons.

Plain HTML, CSS and JavaScript. There is nothing to install and no build step.

## What's in it

- **6 units, 25 words**: Mum & Dad, Brothers & Sisters, Grandparents, Aunts & Uncles,
  Cousins, and the **προ-** ("great-") prefix. It has male and female forms
  (θείος/θεία, ξάδερφος/ξαδέρφη) and a few plurals (γονείς, ξαδέρφια).
- **3 lessons per unit**, getting harder as she learns. Then a final "whole family mix".
- **10 kinds of questions**: hear it and pick the meaning, see it and pick the meaning,
  English → Greek, picture questions, build the word from letter tiles, "ο / η / το",
  "which is the female/male version?", and matching pairs.
- **Duolingo-style rewards**: XP, daily streak, daily goal ring, 5 hearts per lesson,
  confetti, and Sofia the owl.
- **Tricky words come back more often.** Each word has a strength from 0 to 5 that
  goes up and down as she answers, and the "Practise my tricky words" button uses it.
- **Works offline and installs like an app** on a phone or tablet (Add to Home Screen).
- Progress is saved **on the device only**. There are no accounts and no data is sent anywhere.

## Pronunciation audio

The app plays the best audio it can find, in this order:

1. **A voice recorded on this device**: Me → Record family voices. Yiayia or Pappou
   says each word into the phone or tablet. It works straight away and is saved on that device.
2. **An mp3 file in [`audio/`](audio/README.md)**, such as `audio/giagia.mp3`. These are
   shared with every device that opens the site.
3. **The device's own Greek voice** (text-to-speech). This is free, but the quality
   depends on the device. Phones and Chromebooks are usually good, and some computers
   have no Greek voice.

Run `node scripts/validate-words.mjs --list` to see the exact file name for every word.

## Publishing (GitHub Pages)

`.github/workflows/pages.yml` deploys the site every time something is pushed to `main`.
In the repository go to **Settings → Pages → Build and deployment → Source: GitHub Actions**
(one time only). The address will be `https://<your-username>.github.io/Greek-vocabulary-family/`.

> GitHub Pages sites are public. Don't put family photos or anything private in this repo.
> The app uses cartoon pictures for that reason.

## Adding or changing words

Everything lives in [`js/words.js`](js/words.js). Copy an existing word, change the fields,
and add its `id` to a unit. The comments at the top explain each field.
Run `node scripts/validate-words.mjs` to check for mistakes. It also runs on every deploy,
so a typo can't break the live site.

## Running it on your computer

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

(Opening `index.html` directly won't work, because browsers block JavaScript modules on `file://`.)

## Files

| Path | What it is |
| --- | --- |
| `index.html`, `css/style.css` | page and styling |
| `js/words.js` | **the words, units and cartoon recipes** |
| `js/lesson.js` | builds the questions for each lesson |
| `js/app.js` | screens and the lesson player |
| `js/audio.js` | recordings, mp3 files, text-to-speech, sound effects |
| `js/avatars.js` | the cartoon people and the owl, drawn as SVG |
| `js/store.js` | saving progress, XP and streaks |
| `sw.js`, `manifest.webmanifest`, `icons/` | offline use and "install as app" |
| `scripts/` | word-list checker and audio indexer (run on deploy) |
