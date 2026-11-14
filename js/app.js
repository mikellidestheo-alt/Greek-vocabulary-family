import { WORDS, UNITS, LESSONS_PER_UNIT, word, label, sentencesFor } from './words.js';
import { avatarSVG, mascotSVG } from './avatars.js';
import {
  state, save, resetAll, ws, unitDone, addXp, xpToday, touchStreak, liveStreak, bumpSkill, skillPct,
} from './store.js';
import {
  initAudio, playWord, stopAudio, sfx, greekVoices, ttsSupported, hasRecording, hasFile,
  canRecord, startRecording, stopRecording, saveRecording, deleteRecording, canListen, listenOnce, judgeSpeech,
} from './audio.js';
import { buildLesson, introWords, SKILLS } from './lesson.js';

// ---------- tiny helpers ----------
const h = (tag, props = {}, ...kids) => {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v === false || v == null) continue;
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat()) {
    if (kid == null || kid === false) continue;
    el.append(kid.nodeType ? kid : document.createTextNode(kid));
  }
  return el;
};
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const tint = (hex, amt = 0.82) => {
  const n = parseInt(hex.slice(1), 16);
  const mix = (c) => Math.round(c + (255 - c) * amt);
  return `rgb(${mix(n >> 16)}, ${mix((n >> 8) & 255)}, ${mix(n & 255)})`;
};
const DEBUG = new URLSearchParams(location.search).has('debug');
const skillInfo = (id) => SKILLS.find((s) => s.id === id);

// sizes are in rem so the whole app scales up on tablets
function avatar(pic, size = 64, bg = '#e9defa') {
  const rem = `${(size / 16).toFixed(2)}rem`;
  return h('span', { class: 'avatar', style: `width:${rem};height:${rem}`, html: avatarSVG(pic, { bg }) });
}
const unitBg = (wid) => {
  const u = UNITS.find((x) => x.words.includes(wid));
  return u ? tint(u.color, 0.84) : '#e9defa';
};
const wordAvatar = (w, size) => avatar(w.pic, size, unitBg(w.id));
const mascot = (cls = '', mood = 'happy') => h('span', { class: `mascot ${cls}`, html: mascotSVG(mood) });

function speakerBtn(w, { slow = false, big = false } = {}) {
  return h('button', {
    class: `speaker ${slow ? 'slow' : ''} ${big ? 'big' : ''}`, type: 'button',
    'aria-label': slow ? `Play ${w.el} slowly` : `Play ${w.el}`,
    onclick: (e) => { e.stopPropagation(); sfx('tap'); playWord(w, { slow }); },
  }, slow ? '🐢' : '🔊');
}

function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 2600);
}

// ---------- full screen ----------
const fsAvailable = () => !!(document.fullscreenEnabled || document.webkitFullscreenEnabled);
const inFullscreen = () => !!(document.fullscreenElement || document.webkitFullscreenElement);
function toggleFullscreen() {
  try {
    if (inFullscreen()) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    else {
      const el = document.documentElement;
      const p = (el.requestFullscreen || el.webkitRequestFullscreen).call(el);
      if (p && p.catch) p.catch(() => toast('Full screen is not allowed here'));
    }
  } catch { toast('Full screen is not available'); }
}
const isStandalone = () => matchMedia('(display-mode: fullscreen)').matches || matchMedia('(display-mode: standalone)').matches || navigator.standalone;

// ---------- shell & routing ----------
const view = document.getElementById('view');
const tabs = [...document.querySelectorAll('#tabs a')];
const routes = { learn: viewLearn, words: viewWords, me: viewMe, record: viewRecord };

function route() {
  const name = (location.hash.replace(/^#\/?/, '') || 'learn').split('/')[0];
  const fn = routes[name] || viewLearn;
  tabs.forEach((a) => a.classList.toggle('active', a.dataset.tab === (name === 'record' ? 'me' : name)));
  view.replaceChildren(fn());
  window.scrollTo(0, 0);
}
window.addEventListener('hashchange', route);
document.addEventListener('fullscreenchange', () => { const b = document.getElementById('fsbtn'); if (b) b.textContent = inFullscreen() ? '🡼' : '⛶'; });

// ---------- Learn ----------
function ring(value, goal) {
  const r = 18, c = 2 * Math.PI * r, p = Math.min(1, value / goal);
  return h('span', {
    class: 'ring', title: `${value} of ${goal} XP today`,
    html: `<svg viewBox="0 0 44 44"><circle cx="22" cy="22" r="${r}" fill="none" stroke="var(--line)" stroke-width="5"/>
      <circle cx="22" cy="22" r="${r}" fill="none" stroke="var(--gold)" stroke-width="5" stroke-linecap="round"
        stroke-dasharray="${(c * p).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 22 22)"/></svg><b>${p >= 1 ? '✓' : '⚡'}</b>`,
  });
}

const speakAvailable = () => state.settings.speaking && !micBlocked && (canRecord() || (canListen() && !srBroken));
let micBlocked = false, srBroken = false;

function viewLearn() {
  const root = h('div', { class: 'page learn' });
  const streak = liveStreak();
  const goal = state.settings.goal;
  root.append(h('header', { class: 'topbar wide' },
    mascot('hero'),
    h('div', { class: 'greet' },
      h('div', { class: 'hello' }, state.name ? `Γεια σου, ${state.name}!` : 'Γεια σου!'),
      h('div', { class: 'small' }, 'Floufi and the family monsters are ready to learn Greek!')),
    h('div', { class: 'stats' },
      h('span', { class: `chip ${streak ? 'hot' : ''}`, title: 'Day streak' }, `🔥 ${streak}`),
      h('span', { class: 'chip', title: 'Total XP' }, `⚡ ${state.xp}`),
      ring(xpToday(), goal),
      fsAvailable() ? h('button', { id: 'fsbtn', class: 'iconbtn', type: 'button', 'aria-label': 'Toggle full screen', onclick: toggleFullscreen }, inFullscreen() ? '🡼' : '⛶') : null)));

  // the four skills, each practised in every lesson and also on its own
  root.append(h('section', { class: 'skills wide' },
    h('h2', {}, 'Four ways to practise'),
    h('div', { class: 'skillgrid' }, SKILLS.map((s) => {
      const pct = skillPct(s.id);
      return h('button', { class: `skill sk-${s.id}`, type: 'button', onclick: () => startLesson({ kind: 'skill', skill: s.id }) },
        h('span', { class: 'si' }, s.icon),
        h('span', { class: 'st' }, h('b', {}, s.title), h('span', { class: 'small' }, pct == null ? s.desc : `${pct}% right first time`)));
    }))));

  if (ttsSupported() && greekVoices().length === 0 && sessionStorage.getItem('gvf.novoice') !== '1') {
    root.append(h('div', { class: 'notice wide' },
      h('button', { class: 'close', type: 'button', 'aria-label': 'Hide this message', onclick: (e) => { try { sessionStorage.setItem('gvf.novoice', '1'); } catch { /* ignore */ } e.target.closest('.notice').remove(); } }, '✕'),
      h('b', {}, 'No Greek voice found on this device. '),
      'Words will be read with a default voice, which may sound wrong. Add a Greek voice in your device’s language settings, or record real voices for the family in ',
      h('a', { href: '#/record' }, 'Me › Record family voices'), '.'));
  }

  const seen = WORDS.filter((w) => ws(w.id).seen > 0).length;
  if (seen >= 3) {
    root.append(h('button', { class: 'pill wide', type: 'button', onclick: () => startLesson({ kind: 'practice' }) }, '💪 Practise my tricky words'));
  }

  let node = 0;
  const completed = UNITS.reduce((n, u) => n + unitDone(u.id), 0);
  const unlocked = (i) => state.settings.unlockAll || i <= completed;
  UNITS.forEach((u, ui) => {
    const done = unitDone(u.id);
    root.append(h('section', { class: 'unit', style: `--uc:${u.color}; --on:${u.ink || '#fff'}` },
      h('div', { class: 'banner' },
        wordAvatar(word(u.icon), 60),
        h('div', {},
          h('div', { class: 'kicker' }, `Unit ${ui + 1}`),
          h('h2', {}, u.title),
          h('div', { class: 'small' }, `${u.words.length} words`)),
        h('a', { class: 'banner-btn', href: '#/words', 'aria-label': `See the words in ${u.title}`, onclick: () => { try { sessionStorage.setItem('gvf.jump', u.id); } catch { /* ignore */ } } }, '📖')),
      h('div', { class: 'path' },
        Array.from({ length: LESSONS_PER_UNIT }, (_, k) => {
          const i = node++;
          const isDone = k < done;
          const isOpen = unlocked(i);
          const isCurrent = isOpen && !isDone && k === done;
          const offset = [0, 2.4, 3.6, 2.4][k % 4];
          return h('div', { class: 'node-row', style: `transform:translateX(${offset}rem)` },
            h('button', {
              type: 'button', class: `node ${isDone ? 'done' : ''} ${isCurrent ? 'current' : ''} ${isOpen ? '' : 'locked'}`,
              disabled: !isOpen, 'aria-label': `${u.title}, lesson ${k + 1}${isDone ? ', completed' : isOpen ? '' : ', locked'}`,
              onclick: () => startLesson({ kind: 'unit', unit: u, lessonNo: k + 1 }),
            }, isDone ? '★' : isOpen ? String(k + 1) : '🔒'),
            isCurrent ? h('span', { class: 'start-tag' }, 'START') : null);
        }))));
  });

  const allDone = completed >= UNITS.length * LESSONS_PER_UNIT;
  root.append(h('section', { class: 'unit final', style: '--uc:#ffc83d; --on:#4d3300' },
    h('div', { class: 'banner' }, h('span', { class: 'trophy' }, '🏆'),
      h('div', {}, h('div', { class: 'kicker' }, 'Final challenge'), h('h2', {}, 'Whole family mix'),
        h('div', { class: 'small' }, 'Every word, tricky ones first'))),
    h('div', { class: 'path' }, h('div', { class: 'node-row' },
      h('button', {
        type: 'button', class: `node big ${allDone || state.settings.unlockAll ? 'current' : 'locked'}`,
        disabled: !(allDone || state.settings.unlockAll), 'aria-label': 'Whole family mix',
        onclick: () => startLesson({ kind: 'mix' }),
      }, allDone || state.settings.unlockAll ? '🏆' : '🔒')))));
  return root;
}

// ---------- Words ----------
function viewWords() {
  const jump = sessionStorage.getItem('gvf.jump');
  sessionStorage.removeItem('gvf.jump');
  const root = h('div', { class: 'page words' },
    h('header', { class: 'plain wide' }, h('h1', {}, 'All the words'),
      h('label', { class: 'switch' },
        h('input', { type: 'checkbox', checked: state.settings.translit, onchange: (e) => { state.settings.translit = e.target.checked; save(); route(); } }),
        h('span', {}, 'Show how to say it'))));
  UNITS.forEach((u) => {
    const words = u.words.map(word);
    const sents = words.flatMap((w) => sentencesFor(w.id).filter((s) => s.t === 0 || s.t >= 3));
    root.append(h('section', { class: 'wunit', id: `u-${u.id}`, style: `--uc:${u.color}` },
      h('h2', {}, u.title),
      h('p', { class: 'note' }, u.note),
      words.map((w) => wordRow(w)),
      sents.length ? h('details', { class: 'sentences' },
        h('summary', {}, `💬 Sentences (${sents.length})`),
        sents.map((s) => sentenceRow(s))) : null));
  });
  if (jump) setTimeout(() => document.getElementById(`u-${jump}`)?.scrollIntoView({ behavior: 'smooth' }), 50);
  return root;
}

const sentenceWord = (s) => ({ id: `s-${s.id}`, el: s.el, art: '', tr: s.tr, en: s.en, say: s.el });

function sentenceRow(s) {
  const pw = sentenceWord(s);
  return h('div', { class: 'srow', onclick: () => playWord(pw) },
    h('div', { class: 'wtext' },
      h('div', { class: 'sel' }, s.el),
      state.settings.translit ? h('div', { class: 'tr' }, s.tr) : null,
      h('div', { class: 'en' }, s.en)),
    h('div', { class: 'wbtns' }, speakerBtn(pw), speakerBtn(pw, { slow: true })));
}

function wordRow(w) {
  const rec = hasRecording(w.id) ? '🎙 recorded voice' : hasFile(w.id) ? '🎧 audio file' : '';
  return h('div', { class: 'wrow', onclick: () => playWord(w) },
    wordAvatar(w, 64),
    h('div', { class: 'wtext' },
      h('div', { class: 'el' }, label(w)),
      state.settings.translit ? h('div', { class: 'tr' }, w.tr) : null,
      h('div', { class: 'en' }, cap(w.en), rec ? h('span', { class: 'tag' }, rec) : null),
      w.hint ? h('div', { class: 'hint' }, w.hint) : null),
    h('div', { class: 'wbtns' }, speakerBtn(w), speakerBtn(w, { slow: true })));
}

// ---------- Me ----------
function viewMe() {
  const mastered = WORDS.filter((w) => ws(w.id).s >= 4).length;
  const voices = greekVoices();
  const root = h('div', { class: 'page me' },
    h('header', { class: 'plain wide' }, h('h1', {}, 'Me')),
    h('div', { class: 'tiles' },
      tile('🔥', liveStreak(), 'day streak'), tile('⚡', state.xp, 'total XP'),
      tile('🏅', state.best, 'best streak'), tile('⭐', `${mastered}/${WORDS.length}`, 'words known')),
    h('section', { class: 'card' },
      h('h2', {}, 'My skills'),
      h('div', { class: 'skillbars' }, SKILLS.map((s) => {
        const st = state.skills[s.id] || { ok: 0, total: 0 };
        const pct = skillPct(s.id);
        return h('div', { class: 'sbar' },
          h('span', { class: 'si' }, s.icon),
          h('div', { class: 'sbody' },
            h('div', {}, h('b', {}, s.title), h('span', { class: 'small' }, ` · ${st.total} answered${pct == null ? '' : ` · ${pct}% right first time`}`)),
            h('div', { class: 'meter' }, h('i', { style: `width:${pct || 0}%` }))));
      }))),
    h('section', { class: 'card' },
      h('h2', {}, 'My name'),
      h('input', { class: 'text', type: 'text', maxlength: 20, value: state.name, placeholder: 'Type your name',
        oninput: (e) => { state.name = e.target.value.trim(); save(); } })),
    h('section', { class: 'card' },
      h('h2', {}, 'Sound'),
      toggle('Sound effects', 'sound'),
      toggle('Show how to say the words', 'translit'),
      toggle('Speaking practice (uses the microphone)', 'speaking'),
      h('label', { class: 'field' }, h('span', {}, 'Speaking speed'),
        h('input', { type: 'range', min: 0.5, max: 1.1, step: 0.05, value: state.settings.rate,
          oninput: (e) => { state.settings.rate = Number(e.target.value); save(); } }),
        h('button', { type: 'button', class: 'mini', onclick: () => playWord(word('giagia')) }, '🔊 Try')),
      ttsSupported()
        ? (voices.length
          ? h('label', { class: 'field' }, h('span', {}, 'Greek voice'),
            h('select', { onchange: (e) => { state.settings.voice = e.target.value; save(); } },
              voices.map((v) => h('option', { value: v.name, selected: v.name === state.settings.voice }, `${v.name} (${v.lang})`))))
          : h('p', { class: 'warn' }, 'No Greek voice is installed on this device. Install one in the device’s language settings, or record voices below.'))
        : h('p', { class: 'warn' }, 'This browser cannot speak out loud. Record voices below instead.'),
      h('a', { class: 'btn ghost', href: '#/record' }, '🎙 Record family voices')),
    h('section', { class: 'card' },
      h('h2', {}, 'Full screen'),
      fsAvailable()
        ? h('button', { class: 'btn ghost', type: 'button', onclick: toggleFullscreen }, '⛶ Toggle full screen')
        : null,
      h('p', { class: 'small' }, isStandalone()
        ? 'You are using the installed app, so it already fills the screen.'
        : 'For the best tablet experience, install it: on iPad tap Share › Add to Home Screen. On Android tap ⋮ › Install app. It then opens full screen, like a real app.')),
    h('section', { class: 'card' },
      h('h2', {}, 'Grown-ups'),
      h('label', { class: 'field' }, h('span', {}, 'Daily goal'),
        h('select', { onchange: (e) => { state.settings.goal = Number(e.target.value); save(); } },
          [50, 100, 150, 200].map((g) => h('option', { value: g, selected: g === state.settings.goal }, `${g} XP`)))),
      toggle('Unlock all lessons', 'unlockAll'),
      h('button', {
        type: 'button', class: 'btn danger',
        onclick: () => { if (confirm('Erase all progress on this device? This cannot be undone.')) { resetAll(); toast('Progress erased'); route(); } },
      }, 'Erase progress')));
  return root;
}

const tile = (icon, v, text) => h('div', { class: 'tile' }, h('div', { class: 'big' }, `${icon} ${v}`), h('div', { class: 'small' }, text));

function toggle(text, key) {
  return h('label', { class: 'switch row' },
    h('span', {}, text),
    h('input', { type: 'checkbox', checked: state.settings[key], onchange: (e) => { state.settings[key] = e.target.checked; save(); } }));
}

// ---------- Record family voices ----------
function viewRecord() {
  let busy = null;
  const root = h('div', { class: 'page record' },
    h('header', { class: 'plain wide' }, h('a', { class: 'back', href: '#/me' }, '‹ Back'), h('h1', {}, 'Record family voices')),
    h('p', { class: 'note wide' }, 'Ask Yiayia or Pappou to say each word. Tap ● to start, tap ■ to stop. Recordings are saved on this device only and are used instead of the computer voice. To share voices with every device, add mp3 files to the audio folder (see audio/README.md).'));
  if (!canRecord()) root.append(h('p', { class: 'warn wide' }, 'This browser cannot record audio.'));
  const rows = h('div', { class: 'rec-list wide' });
  const draw = () => {
    rows.replaceChildren(...WORDS.map((w) => {
      const has = hasRecording(w.id);
      const isRec = busy === w.id;
      return h('div', { class: `rrow ${has ? 'has' : ''}` },
        h('div', { class: 'wtext' }, h('div', { class: 'el' }, label(w)), h('div', { class: 'en' }, cap(w.en))),
        h('button', {
          type: 'button', class: `mini rec ${isRec ? 'live' : ''}`, disabled: !canRecord() || (busy && !isRec),
          'aria-label': isRec ? `Stop recording ${w.el}` : `Record ${w.el}`,
          onclick: async () => {
            try {
              if (isRec) {
                const blob = await stopRecording(); busy = null;
                if (blob && blob.size > 500) { await saveRecording(w.id, blob); toast(`Saved: ${w.el}`); }
              } else { await startRecording(); busy = w.id; }
            } catch { busy = null; toast('Could not use the microphone. Please allow it and try again.'); }
            draw();
          },
        }, isRec ? '■ Stop' : '● Record'),
        h('button', { type: 'button', class: 'mini', disabled: !has, onclick: () => playWord(w) }, '▶'),
        h('button', { type: 'button', class: 'mini', disabled: !has, 'aria-label': `Delete recording of ${w.el}`, onclick: async () => { await deleteRecording(w.id); draw(); } }, '🗑'));
    }));
  };
  draw();
  root.append(rows);
  return root;
}

// ---------- first-run welcome ----------
function welcome() {
  const input = h('input', { class: 'text', type: 'text', maxlength: 20, placeholder: 'Type your name', 'aria-label': 'Your name' });
  const done = () => { state.name = input.value.trim(); state.onboarded = true; save(); dlg.remove(); route(); };
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') done(); });
  const dlg = h('div', { class: 'overlay' }, h('div', { class: 'dialog' },
    mascot('big'),
    h('h1', {}, 'Καλώς ήρθες!'),
    h('p', {}, 'Welcome! I’m Floufi, and these are the family monsters. Let’s learn the Greek words for all your relatives. What’s your name?'),
    input,
    h('button', { class: 'btn', type: 'button', onclick: done }, 'Let’s go!')));
  document.body.append(dlg);
  setTimeout(() => input.focus(), 50);
}

// =====================================================================
//  LESSON
// =====================================================================
const lessonEl = document.getElementById('lesson');
let L = null;

const PRAISE = [['Μπράβο!', 'Well done!'], ['Σωστά!', 'Correct!'], ['Τέλεια!', 'Perfect!'], ['Εξαιρετικά!', 'Excellent!'], ['Ωραία!', 'Lovely!']];
const OOPS = [['Σχεδόν!', 'Almost!'], ['Δοκίμασε ξανά!', 'Try again!'], ['Λίγο ακόμα!', 'Nearly there!']];
const SOFT = [['Καλή προσπάθεια!', 'Nice try!'], ['Συνέχισε!', 'Keep going!']];
const pick = (a) => a[Math.floor(Math.random() * a.length)];

function startLesson(spec) {
  stopAudio();
  const queue = buildLesson(spec, { speak: speakAvailable() });
  L = {
    spec, queue, i: 0, hearts: 5, total: queue.length, done: 0, firstTry: 0, mistakes: 0, xp: 0,
    attempted: new Set(), requeued: new Map(), touched: new Set(),
    skills: [...new Set(queue.map((q) => q.skill))],
  };
  lessonEl.hidden = false;
  document.body.classList.add('in-lesson');
  const intro = spec.kind === 'unit' && spec.lessonNo === 1 && unitDone(spec.unit.id) === 0;
  if (intro) showIntro(spec.unit); else nextQuestion();
}

function closeLesson() {
  stopAudio();
  lessonEl.hidden = true; lessonEl.replaceChildren();
  document.body.classList.remove('in-lesson');
  L = null;
  route();
}

function lessonShell(content, { progress = true } = {}) {
  const hearts = h('span', { class: 'hearts', 'aria-label': `${L.hearts} hearts left` },
    Array.from({ length: 5 }, (_, i) => h('i', { class: i < L.hearts ? 'on' : '' }, i < L.hearts ? '❤' : '♡')));
  const top = h('div', { class: 'ltop' },
    h('button', { class: 'x', type: 'button', 'aria-label': 'Leave lesson', onclick: () => { if (confirm('Leave this lesson? Your progress in it will be lost.')) closeLesson(); } }, '✕'),
    progress ? h('div', { class: 'bar' }, h('i', { style: `width:${Math.round((L.done / L.total) * 100)}%` })) : h('div', { class: 'bar-gap' }),
    progress ? hearts : null);
  lessonEl.replaceChildren(top, content);
}

// ---- intro cards ----
function showIntro(unit) {
  const words = introWords(unit);
  let n = 0;
  const draw = () => {
    const w = words[n];
    const last = n === words.length - 1;
    const body = h('div', { class: 'lbody intro' },
      h('div', { class: 'kicker' }, `Meet the monsters · ${n + 1} of ${words.length}`),
      wordAvatar(w, 190),
      h('div', { class: 'bigword' }, label(w)),
      state.settings.translit ? h('div', { class: 'tr' }, w.tr) : null,
      h('div', { class: 'en' }, cap(w.en)),
      w.hint ? h('p', { class: 'hint' }, w.hint) : null,
      h('div', { class: 'row' }, speakerBtn(w, { big: true }), speakerBtn(w, { slow: true, big: true })));
    const foot = h('div', { class: 'lfoot' }, h('button', {
      class: 'btn', type: 'button',
      onclick: () => { if (last) nextQuestion(); else { n++; draw(); } },
    }, last ? 'Start the lesson' : 'Next'));
    lessonShell(h('div', { class: 'lwrap' }, body, foot), { progress: false });
    playWord(w);
  };
  draw();
}

// ---- questions ----
function nextQuestion() {
  if (L.hearts <= 0) return outOfHearts();
  if (L.i >= L.queue.length) return finishLesson();
  renderQuestion(L.queue[L.i]);
}

function skipQuestion() { L.total = Math.max(1, L.total - 1); L.i++; nextQuestion(); }

const PROMPT_CLASS = { greek: 'bigword', en: 'bigword en', letters: 'bigword letters', sent: 'bigword sent', 'sent-en': 'bigword sent en' };

function renderQuestion(q) {
  const sk = skillInfo(q.skill);
  const body = h('div', { class: `lbody ${q.kind === 'speak' ? 'speakbody' : ''}` },
    h('div', { class: `skilltag sk-${q.skill}` }, `${sk.icon} ${sk.title}`),
    h('h1', { class: 'qtitle' }, q.title));
  const foot = h('div', { class: 'lfoot' });
  const fb = h('div', { class: 'fb', role: 'status', 'aria-live': 'polite' });
  const wrap = h('div', { class: 'lwrap' }, body, h('div', { class: 'ldock' }, fb, foot));
  lessonShell(wrap);

  const w = q.say || word(q.wid);

  if (q.kind === 'speak') { renderSpeak(q, body, foot, fb); return; }

  const checkBtn = h('button', { class: 'btn', type: 'button', disabled: true }, 'Check');
  foot.append(checkBtn);
  let locked = false;
  let getAnswer = () => null;

  if (q.listen) body.append(h('div', { class: 'row center' }, speakerBtn(w, { big: true }), speakerBtn(w, { slow: true, big: true })));
  if (q.show) {
    body.append(h('div', { class: 'promptcard' },
      h('div', { class: 'bigword' }, label(q.show)),
      state.settings.translit && q.type !== 'stress' ? h('div', { class: 'tr' }, q.show.tr) : null,
      h('div', { class: 'row center' }, speakerBtn(q.show), speakerBtn(q.show, { slow: true }))));
  }
  if (q.showSentence) {
    body.append(h('div', { class: 'promptcard' },
      h('div', { class: 'bigword sent' }, q.showSentence.el),
      state.settings.translit ? h('div', { class: 'tr' }, q.showSentence.tr) : null,
      h('div', { class: 'row center' }, speakerBtn(w), speakerBtn(w, { slow: true }))));
  }
  if (q.pic) body.append(h('div', { class: 'row center' }, wordAvatar(q.pic, 170)));
  if (q.prompt) {
    body.append(h('div', { class: 'promptcard' },
      h('div', { class: PROMPT_CLASS[q.promptClass] || 'bigword' }, q.promptClass === 'en' ? cap(q.prompt) : q.prompt),
      q.sub ? h('div', { class: 'small' }, `(${q.sub})`) : null,
      !q.silent && q.say ? h('div', { class: 'row center' }, speakerBtn(q.say)) : null));
  }

  if (q.kind === 'choice') {
    let sel = null;
    const els = new Map();
    const grid = h('div', { class: `opts ${q.gridClass || ''}` });
    q.options.forEach((o, idx) => {
      const b = h('button', {
        type: 'button', class: `opt ${q.optClass || ''}`, 'data-correct': DEBUG && o.correct ? '1' : null, 'aria-label': q.picOpts ? 'picture' : null,
        onclick: () => { if (locked) return; sel = o; els.forEach((e) => e.classList.remove('sel')); b.classList.add('sel'); checkBtn.disabled = false; sfx('tap'); },
      },
      q.picOpts ? wordAvatar(o.pic, 112) : null,
      q.picOpts || q.gridClass ? null : h('span', { class: 'k' }, String(idx + 1)),
      q.picOpts ? null : h('span', { class: 'lbl' }, q.optClass ? o.label : cap(o.label)));
      els.set(o.key, b);
      // every Greek option gets its own speaker, so each word can be heard before choosing
      grid.append(o.say ? h('div', { class: 'optwrap' }, b, speakerBtn(o.say)) : b);
    });
    body.append(grid);
    getAnswer = () => {
      const ok = !!sel && sel.correct;
      q.options.forEach((o) => { if (o.correct) els.get(o.key).classList.add('right'); });
      if (!ok && sel) els.get(sel.key).classList.add('wrong');
      const right = q.options.find((o) => o.correct);
      return { ok, answer: q.answerText || (q.picOpts ? label(word(right.key)) : right.label) };
    };
    wrap._keys = (n) => { const o = q.options[n]; if (o && !locked && !q.gridClass) els.get(o.key).click(); };
  } else if (q.kind === 'build') {
    const chosen = [];
    const joiner = q.joiner || '';
    const line = h('div', { class: 'buildline', 'aria-label': 'Your answer', 'data-answer': DEBUG ? q.answer : null });
    const bank = h('div', { class: 'bank' });
    const tcls = `tile-l ${q.words ? 'tile-w' : ''}`;
    const draw = () => {
      line.replaceChildren(...chosen.map((t) => h('button', { type: 'button', class: tcls, onclick: () => { if (locked) return; chosen.splice(chosen.indexOf(t), 1); draw(); sfx('tap'); } }, t.c)));
      bank.replaceChildren(...q.tiles.map((t) => (chosen.includes(t)
        ? h('span', { class: `${tcls} ghost` }, t.c)
        : h('button', { type: 'button', class: tcls, onclick: () => { if (locked) return; chosen.push(t); draw(); sfx('tap'); } }, t.c))));
      checkBtn.disabled = chosen.length === 0;
    };
    draw();
    body.append(line, bank);
    getAnswer = () => {
      const ok = chosen.map((t) => t.c).join(joiner) === q.answer;
      line.classList.add(ok ? 'right' : 'wrong');
      return { ok, answer: q.answer };
    };
  } else if (q.kind === 'match') {
    renderMatch(q, body, foot, fb);
    return;
  }

  const finish = () => {
    if (locked) return;
    locked = true;
    const { ok, answer } = getAnswer();
    recordResult(q, ok);
    showFeedback(fb, foot, ok, answer, q);
    if (ok && q.needsSpeak) addSpeechConfirm(q, foot);
  };
  checkBtn.addEventListener('click', finish);
  if ((q.listen || q.autoplay) && w) setTimeout(() => playWord(w), 250);
}

// ---- microphone check ----
// Shared by the "Say it out loud!" question and by the "now say it" step that follows every other
// Say-it task. On Android Chrome the browser listens and judges the word. If recognition is not
// available the child records herself, hears herself next to the real word, and rates herself.
function speechUI(w, { area, status, onResult, onBlocked }) {
  let tries = 0, finished = false;
  const finish = (ok) => {
    if (finished) return;
    finished = true;
    const rate = area.querySelector('.speak-after');
    if (rate) rate.hidden = true; // the self-rating buttons are done with
    onResult(ok);
  };
  const blocked = () => {
    micBlocked = true;
    status.textContent = 'The microphone is blocked, so we’ll skip this one.';
    onBlocked();
  };

  // A: the browser listens and judges
  const listenMode = () => {
    const mic = h('button', { class: 'mic', type: 'button', 'aria-label': 'Tap and say the word' }, '🎤');
    area.replaceChildren(mic);
    mic.onclick = async () => {
      stopAudio(); mic.classList.add('live'); status.textContent = 'Listening… say it now!';
      try {
        const alts = await listenOnce();
        mic.classList.remove('live');
        if (judgeSpeech(alts, w)) { finish(true); return; }
        tries++;
        status.textContent = alts[0] ? `I heard “${alts[0]}”. Try again!` : 'I didn’t catch that. Try again!';
        if (tries >= 2) finish(false);
      } catch (err) {
        mic.classList.remove('live');
        if (err === 'denied') blocked();
        else { srBroken = true; recordMode(); }
      }
    };
  };

  // B: record yourself, compare with the real word, rate yourself
  const recordMode = () => {
    if (!canRecord()) { status.textContent = 'Speaking practice isn’t available on this device.'; onBlocked(); return; }
    let mineUrl = null, recording = false;
    const playMine = (chain) => {
      if (!mineUrl) return;
      stopAudio();
      const a = new Audio(mineUrl);
      if (chain === true) a.onended = () => playWord(w);
      a.play().catch(() => {});
    };
    const mic = h('button', { class: 'mic', type: 'button', 'aria-label': 'Record yourself' }, '🎤');
    const after = h('div', { class: 'speak-after', hidden: true },
      h('div', { class: 'row center wrap' },
        h('button', { class: 'mini big', type: 'button', onclick: () => playMine() }, '▶ Hear me'),
        h('button', { class: 'mini big', type: 'button', onclick: () => playWord(w) }, '🔊 Hear the word')),
      h('div', { class: 'row center wrap' },
        h('button', { class: 'btn', type: 'button', onclick: () => finish(true) }, '😄 I said it well!'),
        h('button', { class: 'btn ghost', type: 'button', onclick: () => finish(false) }, '🔁 More practice')));
    area.replaceChildren(mic, after);
    status.textContent = 'Tap the microphone, say the word, then tap again to stop.';
    mic.onclick = async () => {
      try {
        if (!recording) {
          stopAudio(); await startRecording(); recording = true;
          mic.classList.add('live'); mic.textContent = '■'; status.textContent = 'Recording… tap to stop.';
        } else {
          const blob = await stopRecording(); recording = false;
          mic.classList.remove('live'); mic.textContent = '🎤';
          if (blob && blob.size > 300) {
            if (mineUrl) URL.revokeObjectURL(mineUrl);
            mineUrl = URL.createObjectURL(blob);
            after.hidden = false;
            status.textContent = 'Listen to yourself, then to the real word. How did you do?';
            playMine(true);
          } else status.textContent = 'That was too short. Try again!';
        }
      } catch { recording = false; blocked(); }
    };
  };

  if (canListen() && !srBroken) listenMode(); else recordMode();
}

// ---- say it out loud (a question of its own) ----
function renderSpeak(q, body, foot, fb) {
  const w = q.target;
  const status = h('div', { class: 'speak-status', 'aria-live': 'polite' }, 'Listen first, then tap the microphone and say the word.');
  const area = h('div', { class: 'speak-area' });
  body.append(
    h('div', { class: 'promptcard' },
      h('div', { class: 'bigword' }, label(w)),
      state.settings.translit ? h('div', { class: 'tr' }, w.tr) : null,
      h('div', { class: 'row center' }, speakerBtn(w, { big: true }), speakerBtn(w, { slow: true, big: true }))),
    area, status);
  foot.replaceChildren(h('button', { class: 'btn ghost', type: 'button', onclick: skipQuestion }, 'Skip this one'));
  speechUI(w, {
    area, status,
    onResult: (ok) => {
      recordSpeak(q, ok);
      showFeedback(fb, foot, ok, ok ? null : label(w), q, { skipRecord: true, soft: !ok });
    },
    onBlocked: () => setTimeout(skipQuestion, 1700),
  });
}

// ---- "now say it" ----
// After a correct answer to any other Say-it task, Continue stays locked until she has said the word
// out loud (heard by the microphone, or recorded and self-checked). It never costs a heart.
function addSpeechConfirm(q, foot) {
  const w = q.say;
  const go = foot.querySelector('.btn');
  if (!go || !w) return;
  go.disabled = true;
  const status = h('div', { class: 'speak-status', 'aria-live': 'polite' }, `Now say “${label(w)}” out loud!`);
  const area = h('div', { class: 'speak-area compact' });
  foot.prepend(h('div', { class: 'speak-confirm' }, area, status));
  const unlock = (msg) => { status.textContent = msg; go.disabled = false; go.focus({ preventScroll: true }); };
  speechUI(w, {
    area, status,
    onResult: (ok) => {
      if (ok) { L.xp += 5; unlock('You said it! 🎉'); } else unlock('Nice try! You’ll get another go at this one.');
    },
    onBlocked: () => unlock('No microphone, so we’ll carry on.'),
  });
}

// ---- matching pairs ----
function renderMatch(q, body, foot, fb) {
  foot.replaceChildren();
  let left = null, right = null, matched = 0, hadMiss = false, over = false;
  const lbtn = new Map(), rbtn = new Map();
  const unsel = (m) => m.forEach((b) => b.classList.remove('sel'));
  const clear = () => { left = right = null; unsel(lbtn); unsel(rbtn); };
  const tryPair = () => {
    if (!left || !right || over) return;
    if (left === right) {
      [lbtn.get(left), rbtn.get(right)].forEach((b) => { b.classList.add('right'); b.disabled = true; });
      const p = q.pairs.find((x) => x.id === left);
      playWord(p.w); sfx('ok'); matched++;
      const pw = ws(p.id); pw.seen++; pw.ok++; if (!hadMiss) pw.s = Math.min(5, pw.s + 1);
      L.touched.add(p.id);
      clear();
      if (matched === q.pairs.length) {
        L.done++; bumpSkill('translation', !hadMiss);
        if (!hadMiss) { L.firstTry++; L.xp += 10; } else L.xp += 5;
        showFeedback(fb, foot, true, null, q, { skipRecord: true });
      }
    } else {
      const a = lbtn.get(left), b = rbtn.get(right);
      [a, b].forEach((x) => x.classList.add('wrong'));
      setTimeout(() => [a, b].forEach((x) => x.classList.remove('wrong')), 450);
      hadMiss = true; L.hearts--; L.mistakes++; sfx('bad');
      const wsx = ws(left); wsx.bad++; wsx.s = Math.max(0, wsx.s - 1);
      clear(); updateHearts();
      if (L.hearts <= 0) { over = true; bumpSkill('translation', false); showFeedback(fb, foot, false, null, q, { skipRecord: true }); }
    }
    save();
  };
  const leftCol = h('div', { class: 'col' }, q.pairs.map((p) => {
    const b = h('button', { type: 'button', class: 'opt greek', 'data-pid': DEBUG ? p.id : null, onclick: () => { if (b.disabled) return; unsel(lbtn); left = p.id; b.classList.add('sel'); playWord(p.w); tryPair(); } }, p.el);
    lbtn.set(p.id, b); return b;
  }));
  const rightCol = h('div', { class: 'col' }, q.rightOrder.map((id) => {
    const p = q.pairs.find((x) => x.id === id);
    const b = h('button', { type: 'button', class: 'opt', 'data-pid': DEBUG ? p.id : null, onclick: () => { if (b.disabled) return; unsel(rbtn); right = p.id; b.classList.add('sel'); sfx('tap'); tryPair(); } }, cap(p.en));
    rbtn.set(p.id, b); return b;
  }));
  body.append(h('div', { class: 'match' }, leftCol, rightCol));
}

function updateHearts() {
  const hs = lessonEl.querySelector('.hearts');
  if (!hs) return;
  [...hs.children].forEach((el, i) => { el.className = i < L.hearts ? 'on' : ''; el.textContent = i < L.hearts ? '❤' : '♡'; });
}

// ---- results ----
function recordResult(q, ok) {
  const first = !L.attempted.has(q.id);
  L.attempted.add(q.id);
  const s = ws(q.wid);
  L.touched.add(q.wid);
  if (first) bumpSkill(q.skill, ok);
  if (ok) {
    if (first) { L.firstTry++; L.xp += 10; s.ok++; s.s = Math.min(5, s.s + 1); s.seen++; } else L.xp += 5;
    L.done++;
    sfx('ok');
  } else {
    L.hearts--; L.mistakes++;
    if (first) { s.bad++; s.s = Math.max(0, s.s - 1); s.seen++; }
    sfx('bad');
  }
  save();
  updateHearts();
}

// speaking practice never costs a heart
function recordSpeak(q, ok) {
  const first = !L.attempted.has(q.id);
  L.attempted.add(q.id);
  const s = ws(q.wid);
  L.touched.add(q.wid);
  if (first) {
    s.seen++;
    bumpSkill('pronunciation', ok);
    if (ok) { s.ok++; s.s = Math.min(5, s.s + 1); } else s.bad++;
  }
  L.done++;
  if (ok) { L.firstTry++; L.xp += 10; sfx('ok'); } else L.xp += 3;
  save();
}

function showFeedback(fb, foot, ok, answer, q, { skipRecord = false, soft = false } = {}) {
  const [elTxt, enTxt] = ok ? pick(PRAISE) : soft ? pick(SOFT) : pick(OOPS);
  const showWord = q.sayAfter || q.say || word(q.wid);
  fb.className = `fb show ${ok ? 'good' : soft ? 'soft' : 'bad'}`;
  fb.replaceChildren(
    mascot('sm', ok || soft ? 'happy' : 'sad'),
    h('div', {},
      h('div', { class: 'fbt' }, `${elTxt} `, h('span', { class: 'fbe' }, enTxt)),
      !ok && answer ? h('div', { class: 'fba' }, soft ? 'Say it with me: ' : 'Correct answer: ', h('b', {}, answer)) : null,
      q.kind !== 'match' && showWord ? h('div', { class: 'fbw' }, `${label(showWord)} · ${showWord.tr}`) : null),
    q.kind !== 'match' && showWord ? speakerBtn(showWord) : null);
  if (!ok && !soft && !skipRecord && (L.requeued.get(q.id) || 0) < 2) {
    L.requeued.set(q.id, (L.requeued.get(q.id) || 0) + 1);
    L.queue.push(q); L.total++;
  }
  if ((ok || soft) && q.kind !== 'match' && !q.listen && !q.autoplay && showWord) setTimeout(() => playWord(showWord), 150);
  const bar = lessonEl.querySelector('.bar i');
  if (bar) bar.style.width = `${Math.round((L.done / L.total) * 100)}%`;
  const go = h('button', { class: `btn ${ok ? 'good' : soft ? '' : 'bad'}`, type: 'button', onclick: () => { L.i++; nextQuestion(); } }, 'Continue');
  foot.replaceChildren(go);
  setTimeout(() => go.focus({ preventScroll: true }), 0);
}

function onKey(e) {
  if (lessonEl.hidden || !L) return;
  const wrap = lessonEl.querySelector('.lwrap');
  if (e.key === 'Enter') {
    const go = lessonEl.querySelector('.lfoot > .btn:not([disabled]):not(.ghost)');
    if (go && document.activeElement !== go) { go.click(); e.preventDefault(); }
  } else if (/^[1-4]$/.test(e.key) && wrap && wrap._keys) wrap._keys(Number(e.key) - 1);
}
window.addEventListener('keydown', onKey);

// ---- end screens ----
function outOfHearts() {
  const spec = L.spec;
  lessonShell(h('div', { class: 'lwrap' }, h('div', { class: 'lbody center' },
    mascot('big', 'sad'),
    h('h1', {}, 'Oh no, no hearts left!'),
    h('p', {}, 'That’s okay. Every mistake helps you learn. Have another go!')),
  h('div', { class: 'lfoot two' },
    h('button', { class: 'btn ghost', type: 'button', onclick: closeLesson }, 'Back home'),
    h('button', { class: 'btn', type: 'button', onclick: () => startLesson(spec) }, 'Try again'))), { progress: false });
}

function finishLesson() {
  const spec = L.spec;
  const perfect = L.mistakes === 0;
  if (perfect) L.xp += 10;
  addXp(L.xp);
  touchStreak();
  if (spec.kind === 'unit') {
    const u = (state.units[spec.unit.id] ||= { done: 0 });
    if (spec.lessonNo === u.done + 1) u.done = spec.lessonNo;
  }
  save();
  sfx('done');
  const total = L.firstTry + L.mistakes;
  const acc = total ? Math.round((L.firstTry / total) * 100) : 100;
  const unitFinished = spec.kind === 'unit' && unitDone(spec.unit.id) === LESSONS_PER_UNIT && spec.lessonNo === LESSONS_PER_UNIT;
  const goal = xpToday() >= state.settings.goal && xpToday() - L.xp < state.settings.goal;
  lessonShell(h('div', { class: 'lwrap' }, h('div', { class: 'lbody center done' },
    mascot('big'),
    h('h1', {}, perfect ? 'Τέλεια! Perfect!' : `Μπράβο${state.name ? ', ' + state.name : ''}!`),
    unitFinished ? h('p', { class: 'cheer' }, `You finished the “${spec.unit.title}” unit! 🎉`) : null,
    goal ? h('p', { class: 'cheer' }, 'You reached your daily goal! 🎯') : null,
    h('div', { class: 'row center wrap' }, L.skills.map((id) => h('span', { class: `skilltag sk-${id}` }, `${skillInfo(id).icon} ${skillInfo(id).title}`))),
    h('div', { class: 'tiles three' },
      tile('⚡', `+${L.xp}`, 'XP earned'),
      tile('🎯', `${acc}%`, 'first-try'),
      tile('🔥', liveStreak(), 'day streak'))),
  h('div', { class: 'lfoot' }, h('button', { class: 'btn', type: 'button', onclick: closeLesson }, 'Continue'))), { progress: false });
  confetti();
}

function confetti() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const cv = h('canvas', { class: 'confetti' });
  lessonEl.append(cv);
  const c = cv.getContext('2d');
  const W = (cv.width = innerWidth), H = (cv.height = innerHeight);
  const cols = ['#7a4fe0', '#ffd23f', '#ef6fae', '#17a673', '#1b9bd1', '#ffffff'];
  const bits = Array.from({ length: 130 }, () => ({
    x: Math.random() * W, y: -20 - Math.random() * H * 0.5, r: 4 + Math.random() * 6, c: cols[Math.floor(Math.random() * cols.length)],
    vy: 2 + Math.random() * 3.5, vx: (Math.random() - 0.5) * 2.5, a: Math.random() * 6,
  }));
  let frames = 0;
  (function tick() {
    c.clearRect(0, 0, W, H);
    for (const b of bits) { b.x += b.vx; b.y += b.vy; b.a += 0.12; c.fillStyle = b.c; c.save(); c.translate(b.x, b.y); c.rotate(b.a); c.fillRect(-b.r, -b.r / 2, b.r * 2, b.r); c.restore(); }
    if (++frames < 220 && cv.isConnected) requestAnimationFrame(tick); else cv.remove();
  })();
}

// ---------- boot ----------
initAudio();
route();
if (!state.onboarded) welcome();

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
window.addEventListener('gvf-audio-ready', () => { if (location.hash.startsWith('#/words') && !L) route(); });
if (ttsSupported()) speechSynthesis.addEventListener('voiceschanged', () => { if ((location.hash || '#/learn').startsWith('#/learn') && !L) route(); });
