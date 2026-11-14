// Progress is saved in this browser only (localStorage). No accounts, no server.

const KEY = 'gvf.v1';

const defaults = () => ({
  v: 1,
  name: '',
  onboarded: false,
  xp: 0,
  streak: 0,
  best: 0,
  lastDay: '',
  daily: { day: '', xp: 0 },
  words: {},   // id -> { s: strength 0-5, seen, ok, bad }
  units: {},   // id -> { done: lessons completed 0-3 }
  skills: {    // answers per skill: first-try correct / total
    translation: { ok: 0, total: 0 }, spelling: { ok: 0, total: 0 },
    pronunciation: { ok: 0, total: 0 }, sentences: { ok: 0, total: 0 },
  },
  settings: { translit: true, sound: true, speaking: true, rate: 0.85, voice: '', unlockAll: false, goal: 100 },
});

export function dayKey(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function load() {
  const base = defaults();
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (raw && typeof raw === 'object') {
      return { ...base, ...raw, settings: { ...base.settings, ...(raw.settings || {}) }, skills: { ...base.skills, ...(raw.skills || {}) } };
    }
  } catch { /* private mode or corrupt data: start fresh */ }
  return base;
}

export const state = load();

export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore */ }
}

export function resetAll() {
  const fresh = defaults();
  for (const k of Object.keys(state)) delete state[k];
  Object.assign(state, fresh);
  save();
}

export function bumpSkill(skill, ok) {
  const s = (state.skills[skill] ||= { ok: 0, total: 0 });
  s.total++;
  if (ok) s.ok++;
}
export const skillPct = (skill) => {
  const s = state.skills[skill];
  return s && s.total ? Math.round((s.ok / s.total) * 100) : null;
};

export const ws = (id) => (state.words[id] ||= { s: 0, seen: 0, ok: 0, bad: 0 });
export const unitDone = (id) => (state.units[id] && state.units[id].done) || 0;

export function xpToday() {
  return state.daily.day === dayKey() ? state.daily.xp : 0;
}

export function addXp(n) {
  const t = dayKey();
  if (state.daily.day !== t) state.daily = { day: t, xp: 0 };
  state.daily.xp += n;
  state.xp += n;
}

// Call once when a lesson is finished.
export function touchStreak() {
  const t = dayKey();
  if (state.lastDay === t) return;
  const y = new Date(); y.setDate(y.getDate() - 1);
  state.streak = state.lastDay === dayKey(y) ? state.streak + 1 : 1;
  state.lastDay = t;
  state.best = Math.max(state.best, state.streak);
}

// The streak shown on screen: it has lapsed if she missed yesterday.
export function liveStreak() {
  const y = new Date(); y.setDate(y.getDate() - 1);
  return state.lastDay === dayKey() || state.lastDay === dayKey(y) ? state.streak : 0;
}
