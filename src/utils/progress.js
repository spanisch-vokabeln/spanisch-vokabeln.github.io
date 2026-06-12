const PROG_KEY = 'vocab_progress';
const ERR_KEY  = 'vocab_mistakes';

export function getProgress() {
  try { return JSON.parse(localStorage.getItem(PROG_KEY) || '{}'); } catch { return {}; }
}

export function recordWord(esWord, isCorrect) {
  const p = getProgress();
  if (!p[esWord]) p[esWord] = { correct: 0, incorrect: 0, lastSeen: 0 };
  if (isCorrect) p[esWord].correct++; else p[esWord].incorrect++;
  p[esWord].lastSeen = Date.now();
  localStorage.setItem(PROG_KEY, JSON.stringify(p));
}

export function getWordStatus(esWord) {
  const e = getProgress()[esWord];
  if (!e || e.correct + e.incorrect === 0) return 'new';
  const total = e.correct + e.incorrect;
  if (total < 3) return 'medium';
  const r = e.correct / total;
  return r >= 0.75 ? 'good' : r >= 0.4 ? 'medium' : 'hard';
}

// Sort hard/unseen words first, with slight jitter to vary order
export function sortByDifficulty(words) {
  const p = getProgress();
  return [...words].sort((a, b) => {
    const ea = p[a.es], eb = p[b.es];
    const sa = ea ? ea.incorrect / (ea.correct + ea.incorrect + 1) : 0.85;
    const sb = eb ? eb.incorrect / (eb.correct + eb.incorrect + 1) : 0.85;
    return (sb - sa) + (Math.random() - 0.5) * 0.2;
  });
}

export function getMistakes() {
  try { return JSON.parse(localStorage.getItem(ERR_KEY) || '[]'); } catch { return []; }
}

export function setMistakes(words) {
  words.length > 0
    ? localStorage.setItem(ERR_KEY, JSON.stringify(words))
    : localStorage.removeItem(ERR_KEY);
}
