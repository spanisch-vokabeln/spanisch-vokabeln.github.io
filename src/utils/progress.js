import { vocabByGrade } from '../data/vocab';
import { storageGet, storageSet, storageRemove, storageGetJSON, storageSetJSON } from './storage';

export const PROG_KEY    = 'vocab_progress';
export const ERR_KEY     = 'vocab_mistakes';
const VERSION_KEY        = 'vocab_progress_version';
const LEGACY_KEY         = 'vocab_progress_legacy';
const PROGRESS_VERSION   = '2';

// Progress is stored per word *pair*: the same Spanish word can mean different
// things in different grades (el tiempo = Zeit / Wetter).
export const wordKey = (w) => `${w.es}|${w.de}`;

const isPlainObject = (v) => !!v && typeof v === 'object' && !Array.isArray(v);

const cleanEntry = (e) => ({
  correct:   Math.max(0, Number(e?.correct)   || 0),
  incorrect: Math.max(0, Number(e?.incorrect) || 0),
  lastSeen:  Number(e?.lastSeen) || 0,
});

const mergeEntry = (a, b) => a
  ? { correct: a.correct + b.correct, incorrect: a.incorrect + b.incorrect, lastSeen: Math.max(a.lastSeen, b.lastSeen) }
  : b;

// es → all German translations in the data
let esIndex = null;
function getEsIndex() {
  if (esIndex) return esIndex;
  esIndex = new Map();
  for (const g of Object.values(vocabByGrade)) {
    for (const t of g.topics) {
      for (const w of t.words) {
        if (!esIndex.has(w.es)) esIndex.set(w.es, new Set());
        esIndex.get(w.es).add(w.de);
      }
    }
  }
  return esIndex;
}

// Converts old progress (keyed by `es` only) to `es|de` keys. An old entry is copied
// to every pair with that Spanish word. Entries whose word no longer exists are
// returned separately so nothing is lost.
export function migrateProgress(raw) {
  const progress = {};
  const legacy = {};
  if (!isPlainObject(raw)) return { progress, legacy };
  const index = getEsIndex();
  for (const [k, v] of Object.entries(raw)) {
    const e = cleanEntry(v);
    if (k.includes('|')) { progress[k] = mergeEntry(progress[k], e); continue; }
    const des = index.get(k);
    if (!des) { legacy[k] = e; continue; }
    for (const de of des) {
      const nk = `${k}|${de}`;
      progress[nk] = mergeEntry(progress[nk], { ...e });
    }
  }
  return { progress, legacy };
}

let migrated = false;
function ensureMigrated() {
  if (migrated) return;
  migrated = true;
  if (storageGet(VERSION_KEY) === PROGRESS_VERSION) return;
  const raw = storageGetJSON(PROG_KEY, {});
  const { progress, legacy } = migrateProgress(raw);
  if (Object.keys(legacy).length) {
    storageSetJSON(LEGACY_KEY, { ...storageGetJSON(LEGACY_KEY, {}), ...legacy });
  }
  // Only mark as migrated when the new data was written successfully
  if (storageSetJSON(PROG_KEY, progress)) storageSet(VERSION_KEY, PROGRESS_VERSION);
}

// Stores already-migrated progress (used by backup import)
export function replaceProgress(progress) {
  storageSetJSON(PROG_KEY, progress);
  storageSet(VERSION_KEY, PROGRESS_VERSION);
  migrated = true;
}

export function getProgress() {
  ensureMigrated();
  const p = storageGetJSON(PROG_KEY, {});
  return isPlainObject(p) ? p : {};
}

export function recordWord(word, isCorrect) {
  const p = getProgress();
  const k = wordKey(word);
  const e = cleanEntry(p[k]);
  if (isCorrect) e.correct++; else e.incorrect++;
  e.lastSeen = Date.now();
  p[k] = e;
  storageSetJSON(PROG_KEY, p);
}

// One classification for the whole app (word dots, summary, "Wiederholen" list)
export function classifyEntry(e) {
  const total = (e?.correct || 0) + (e?.incorrect || 0);
  if (!total) return 'new';
  if (total < 3) return 'medium';
  const r = e.correct / total;
  return r >= 0.75 ? 'good' : r >= 0.4 ? 'medium' : 'hard';
}

// Pass `progress` when checking many words to avoid re-reading storage
export function getWordStatus(word, progress = getProgress()) {
  return classifyEntry(progress[wordKey(word)]);
}

export function getProgressSummary() {
  const entries = Object.values(getProgress());
  let good = 0, medium = 0, hard = 0;
  entries.forEach(e => {
    const s = classifyEntry(e);
    if (s === 'good') good++;
    else if (s === 'medium') medium++;
    else if (s === 'hard') hard++;
  });
  const total = good + medium + hard;
  return total ? { total, good, medium, hard } : null;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Hard/unseen words first; shuffled first so equal scores come in random order
export function sortByDifficulty(words) {
  const p = getProgress();
  const score = (w) => {
    const e = p[wordKey(w)];
    return e ? e.incorrect / (e.correct + e.incorrect + 1) : 0.85;
  };
  return shuffle(words)
    .map(w => ({ w, s: score(w) }))
    .sort((a, b) => b.s - a.s)
    .map(({ w }) => w);
}

// ─── Fehlerwörter ────────────────────────────────────────────────────────────
// A persistent list: wrong answers are added right away (so aborting a round keeps
// them), and a word is only removed when answered correctly in Fehlerwörter mode.

const slimWord = (w) => ({ es: w.es, de: w.de, ...(w.cat ? { cat: w.cat } : {}) });

export function getMistakes() {
  const list = storageGetJSON(ERR_KEY, []);
  if (!Array.isArray(list)) return [];
  const seen = new Set();
  return list.filter(w => {
    if (!w || typeof w.es !== 'string' || typeof w.de !== 'string') return false;
    const k = wordKey(w);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function saveMistakes(list) {
  list.length ? storageSetJSON(ERR_KEY, list) : storageRemove(ERR_KEY);
}

export function addMistakes(words) {
  const list = getMistakes();
  const keys = new Set(list.map(wordKey));
  for (const w of words) {
    if (keys.has(wordKey(w))) continue;
    keys.add(wordKey(w));
    list.push(slimWord(w));
  }
  saveMistakes(list);
}

export function removeMistakes(words) {
  const drop = new Set(words.map(wordKey));
  saveMistakes(getMistakes().filter(w => !drop.has(wordKey(w))));
}

// Call after every answer. `fromMistakes`: the word was practised in Fehlerwörter mode.
export function trackMistake(word, isCorrect, fromMistakes = false) {
  if (!isCorrect) addMistakes([word]);
  else if (fromMistakes) removeMistakes([word]);
}

// Deletes learning progress and Fehlerwörter; game records are kept
export function clearProgress() {
  storageRemove(PROG_KEY);
  storageRemove(ERR_KEY);
  storageRemove(LEGACY_KEY);
  storageSet(VERSION_KEY, PROGRESS_VERSION);
}
