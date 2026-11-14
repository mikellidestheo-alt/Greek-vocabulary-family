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

// Kind to a child: ignores accents, final-sigma and one or two slips.
export function judgeSpeech(alts, w) {
  const target = norm(w.el);
  if (!target) return false;
  const tol = target.length <= 3 ? 0 : target.length <= 7 ? 1 : 2;
  return alts.some((a) => [a, ...a.split(/\s+/)].some((tok) => {
    const t = norm(tok);
    return t && (t === target || t.includes(target) || lev(t, target) <= tol);
  }));
}

// ---------- tiny sound effects (no files needed) ----------
let ctx = null;
export function sfx(kind) {
  if (!state.settings.sound) return;
  try {
    ctx ||= new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    const notes = {
      ok: [[660, 0], [880, 0.09]],
      bad: [[220, 0], [165, 0.12]],
      tap: [[520, 0]],
      done: [[523, 0], [659, 0.12], [784, 0.24], [1046, 0.36]],
    }[kind] || [];
    for (const [f, at] of notes) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = kind === 'bad' ? 'sawtooth' : 'sine';
      o.frequency.value = f;
      const t0 = ctx.currentTime + at;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.16, t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + (kind === 'done' ? 0.3 : 0.18));
      o.connect(g).connect(ctx.destination);
      o.start(t0);
      o.stop(t0 + 0.35);
    }
  } catch { /* no audio context available */ }
}
