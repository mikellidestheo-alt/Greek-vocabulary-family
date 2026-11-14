// Pronunciation audio, in this order of preference:
//   1. a voice recorded on this device (Me > Record family voices)
//   2. an audio file in the audio/ folder, e.g. audio/mama.mp3
//   3. the device's built-in Greek text-to-speech voice
import { state } from './store.js';

const fileUrls = new Map();   // id -> object URL of audio/<id>.mp3
const recUrls = new Map();    // id -> object URL of a recording on this device
let voices = [];
let playing = null;

// ---------- text to speech ----------
const isGreek = (v) => (v.lang || '').toLowerCase().replace('_', '-').startsWith('el');

function loadVoices() {
  if (!('speechSynthesis' in window)) return;
  voices = speechSynthesis.getVoices();
}

export const greekVoices = () => voices.filter(isGreek);
export const ttsSupported = () => 'speechSynthesis' in window;

function pickVoice() {
  const greek = greekVoices();
  return greek.find((v) => v.name === state.settings.voice) || greek[0] || null;
}

function speak(w, slow) {
  if (!ttsSupported()) return;
  const u = new SpeechSynthesisUtterance(w.say || `${w.art} ${w.el}`.trim());
  u.lang = 'el-GR';
  const v = pickVoice();
  if (v) u.voice = v;
  u.rate = slow ? Math.min(state.settings.rate, 0.5) : state.settings.rate;
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
}

// ---------- public ----------
export function stopAudio() {
  if (playing) { try { playing.pause(); } catch { /* ignore */ } playing = null; }
  if (ttsSupported()) speechSynthesis.cancel();
}

// Must be called straight from a tap so phones allow the sound.
export function playWord(w, { slow = false } = {}) {
  stopAudio();
  const url = recUrls.get(w.id) || fileUrls.get(w.id);
  if (url) {
    const a = new Audio(url);
    a.playbackRate = slow ? 0.7 : 1;
    a.preservesPitch = true;
    playing = a;
    a.play().catch(() => speak(w, slow));
    return;
  }
  speak(w, slow);
}

export const hasRecording = (id) => recUrls.has(id);
export const hasFile = (id) => fileUrls.has(id);

export function initAudio() {
  loadVoices();
  if (ttsSupported()) speechSynthesis.addEventListener('voiceschanged', loadVoices);
  Promise.all([loadRecordings(), loadFiles()]).then(() => window.dispatchEvent(new Event('gvf-audio-ready')));
}

async function loadFiles() {
  try {
    const res = await fetch('audio/index.json', { cache: 'no-cache' });
    if (!res.ok) return;
    const ids = await res.json();
    for (const id of ids) {
      try {
        const r = await fetch(`audio/${id}.mp3`);
        if (r.ok) fileUrls.set(id, URL.createObjectURL(await r.blob()));
      } catch { /* offline: fall back to the computer voice */ }
    }
  } catch { /* no index.json yet: that is fine */ }
}

// ---------- recordings stored on this device (IndexedDB) ----------
function db() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('gvf-audio', 1);
    req.onupgradeneeded = () => req.result.createObjectStore('rec');
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx(mode, fn) {
  const d = await db();
  return new Promise((resolve, reject) => {
    const t = d.transaction('rec', mode);
    const r = fn(t.objectStore('rec'));
    t.oncomplete = () => resolve(r && r.result);
    t.onerror = () => reject(t.error);
  });
}

async function loadRecordings() {
  try {
    const d = await db();
    const t = d.transaction('rec', 'readonly');
    const store = t.objectStore('rec');
    const keys = store.getAllKeys();
    const vals = store.getAll();
    await new Promise((resolve) => {
      t.oncomplete = () => {
        keys.result.forEach((k, i) => recUrls.set(k, URL.createObjectURL(vals.result[i])));
        resolve();
      };
      t.onerror = t.onabort = () => resolve();
    });
  } catch { /* IndexedDB blocked: recordings just won't be available */ }
}

export async function saveRecording(id, blob) {
  await tx('readwrite', (s) => s.put(blob, id));
  if (recUrls.has(id)) URL.revokeObjectURL(recUrls.get(id));
  recUrls.set(id, URL.createObjectURL(blob));
}

export async function deleteRecording(id) {
  await tx('readwrite', (s) => s.delete(id));
  if (recUrls.has(id)) URL.revokeObjectURL(recUrls.get(id));
  recUrls.delete(id);
}

let rec = null;
export const canRecord = () => !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);

export async function startRecording() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mime = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'].find((m) => MediaRecorder.isTypeSupported(m));
  const mr = new MediaRecorder(stream, mime ? { mimeType: mime } : {});
  const chunks = [];
  mr.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
  mr.start();
  rec = { mr, stream, chunks };
}

export function stopRecording() {
  return new Promise((resolve) => {
    if (!rec) return resolve(null);
    const { mr, stream, chunks } = rec;
    mr.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      rec = null;
      resolve(new Blob(chunks, { type: mr.mimeType || 'audio/webm' }));
    };
    mr.stop();
  });
}

// ---------- speaking practice ----------
const SR = () => window.SpeechRecognition || window.webkitSpeechRecognition;
export const canListen = () => !!SR();

// Listens once for a Greek word. Resolves with a list of guesses ([] if nothing was heard).
// Rejects with 'denied' (microphone blocked) or 'unavailable' (recognition does not work here).
export function listenOnce({ ms = 7000 } = {}) {
  return new Promise((resolve, reject) => {
    let r;
    try { r = new (SR())(); } catch { reject('unavailable'); return; }
    r.lang = 'el-GR';
    r.maxAlternatives = 5;
    r.interimResults = false;
    let done = false;
    const finish = (alts, err) => {
      if (done) return;
      done = true; clearTimeout(timer);
      try { r.abort(); } catch { /* ignore */ }
      if (err) reject(err); else resolve(alts);
    };
    r.onresult = (e) => {
      const alts = [];
      for (const res of e.results) for (let i = 0; i < res.length; i++) alts.push(res[i].transcript);
      finish(alts);
    };
    r.onerror = (e) => {
      if (e.error === 'not-allowed') finish([], 'denied');
      else if (e.error === 'service-not-allowed' || e.error === 'network' || e.error === 'language-not-supported') finish([], 'unavailable');
      else finish([]);
    };
    r.onnomatch = () => finish([]);
    r.onend = () => finish([]);
    const timer = setTimeout(() => finish([]), ms);
    try { r.start(); } catch { finish([], 'unavailable'); }
  });
}

const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ς/g, 'σ').replace(/[^\p{L}]/gu, '');
export function lev(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}

// ---- matching by SOUND ----
// The recogniser may write the same Greek sound in several ways (ο / ω, η / ι / υ / ει / οι, αι / ε, μπ / β ...)
// or even in Latin letters, so words are compared by how they sound, not by how they are spelled.
const PH_DIGRAPH = [['αι', 'e'], ['ει', 'i'], ['οι', 'i'], ['υι', 'i'], ['ου', 'u'], ['μπ', 'b'], ['ντ', 'd'], ['γκ', 'g'], ['γγ', 'g'], ['τσ', 'c'], ['τζ', 'j']];
const PH_SINGLE = { α: 'a', β: 'v', γ: 'g', δ: 'd', ε: 'e', ζ: 'z', η: 'i', θ: 't', ι: 'i', κ: 'k', λ: 'l', μ: 'm', ν: 'n', ξ: 'x', ο: 'o', π: 'p', ρ: 'r', σ: 's', τ: 't', υ: 'i', φ: 'f', χ: 'h', ψ: 'q', ω: 'o' };
const PH_LATIN = [['ou', 'u'], ['oo', 'u'], ['mp', 'b'], ['nt', 'd'], ['th', 't'], ['ee', 'i'], ['ei', 'i'], ['oi', 'i'], ['ai', 'e'], ['ph', 'f'], ['kh', 'h'], ['ch', 'h'], ['gk', 'g'], ['ts', 'c'], ['dz', 'j'], ['ks', 'x'], ['ps', 'q'], ['y', 'i'], ['w', 'v']];
export function phon(s) {
  let t = norm(s).replace(/γι(?=[αοωε])/g, 'y'); // για, γιο ... sound like "ya", "yo" (y becomes i below, like the Latin spelling)
  for (const [g, p] of PH_DIGRAPH) t = t.split(g).join(p);
  t = Array.from(t).map((c) => PH_SINGLE[c] || c).join('');
  for (const [l, p] of PH_LATIN) t = t.split(l).join(p);
  return t;
}

// Kind to a child: compares by sound, so accents, ο/ω, η/ι/υ and one or two slips in the word don't matter, and a
// Latin-letter transcript works too. The little word counts: "ο μπαμπάς" needs the "ο" (or anything that sounds
// like it, glued on or not). Returns true, false, or 'noArticle' (the word was heard but not its little word), so
// the app can say what is missing.
export function judgeSpeech(alts, w) {
  const nounP = phon(w.el);
  if (!nounP) return false;
  const artP = phon(w.art || '');
  const tol = nounP.length <= 3 ? 0 : nounP.length <= 6 ? 1 : 2;
  const otherArts = ['ο', 'η', 'το', 'οι', 'τα'].map(phon).filter((x) => x !== artP);
  let nounHeard = false, wrongArt = false;
  for (const a of alts) {
    const toks = a.split(/\s+/).map(phon).filter(Boolean);
    const all = toks.join('');
    let noun = false, art = false;
    toks.forEach((t, i) => {
      if (lev(t, nounP) <= tol) {
        noun = true;
        const before = toks.slice(0, i);
        if (before.some((x) => x === artP)) art = true;
        else if (artP && before.some((x) => otherArts.includes(x))) wrongArt = true; // e.g. "η μπαμπάς" for "ο μπαμπάς"
      }
      // the little word glued onto the word: "ομπαμπάς"
      // (only if cutting the little word off makes it a BETTER match: γιαγιά itself starts with the sound of η)
      if (artP && t.length > artP.length && t.startsWith(artP) && lev(t.slice(artP.length), nounP) <= tol && lev(t.slice(artP.length), nounP) < lev(t, nounP)) { noun = true; art = true; }
    });
    if (!noun && all.includes(nounP)) { noun = true; art = !!artP && all.startsWith(artP); } // the word split over several tokens
    if (noun && (art || !artP)) return true;
    if (noun) nounHeard = true;
  }
  if (wrongArt) return 'wrongArticle';
  return nounHeard ? 'noArticle' : false;
}

// ---------- tiny sound effects (no files needed) ----------
let ctx = null;
// Wake the sound system up. Call it from a tap, so a sound can play later (after the microphone has listened).
export function unlockAudio() {
  try {
    ctx ||= new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
  } catch { /* no audio context available */ }
}
export function sfx(kind) {
  if (!state.settings.sound) return;
  try {
    unlockAudio();
    if (!ctx) return;
    const notes = {
      ok: [[660, 0], [880, 0.09]],
      bad: [[220, 0], [165, 0.12]],
      tap: [[520, 0]],
      done: [[523, 0], [659, 0.12], [784, 0.24], [1046, 0.36]],
      // a bright, bell-like ding for a word pronounced correctly: two high notes that ring on
      ding: [[1319, 0], [1976, 0.07], [2637, 0.14]],
    }[kind] || [];
    const len = kind === 'done' ? 0.3 : kind === 'ding' ? 0.7 : 0.18;
    for (const [f, at] of notes) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = kind === 'bad' ? 'sawtooth' : 'sine';
      o.frequency.value = f;
      const t0 = ctx.currentTime + at;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(kind === 'ding' ? 0.22 : 0.16, t0 + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + len);
      o.connect(g).connect(ctx.destination);
      o.start(t0);
      o.stop(t0 + len + 0.05);
    }
  } catch { /* no audio context available */ }
}
