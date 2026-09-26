import { vocabByGrade } from '../data/vocab.js';
import { compareAnswers } from './textComparison.js';

// es → all German translations, de → all Spanish words (over the whole vocabulary)
let index = null;
function getIndex() {
  if (index) return index;
  const esToDe = new Map();
  const deToEs = new Map();
  const add = (map, k, v) => { if (!map.has(k)) map.set(k, new Set()); map.get(k).add(v); };
  for (const g of Object.values(vocabByGrade)) {
    for (const t of g.topics) {
      for (const w of t.words) { add(esToDe, w.es, w.de); add(deToEs, w.de, w.es); }
    }
  }
  index = { esToDe, deToEs };
  return index;
}

// Other valid answers for the same prompt: "el papel" → Rolle / Papier,
// "vielleicht" → tal vez / quizá(s).
export function alternativeAnswers(word, dir) {
  const { esToDe, deToEs } = getIndex();
  const set = dir === 'es2de' ? esToDe.get(word.es) : deToEs.get(word.de);
  const own = dir === 'es2de' ? word.de : word.es;
  return set ? [...set].filter(a => a !== own) : [];
}

// Like compareAnswers, but also accepts every other meaning of the prompt.
// Returns the compareAnswers result plus `correct` (the matched solution) and
// `expected` (the solution stored with this card).
export function checkAnswer(input, word, dir) {
  const expected = dir === 'es2de' ? word.de : word.es;
  const own = compareAnswers(input, expected);
  if (own.isCorrect && !own.hint) return { ...own, correct: expected, expected };
  for (const alt of alternativeAnswers(word, dir)) {
    const r = compareAnswers(input, alt);
    // Prefer a clean match on another meaning over a hinted match on this one
    if (r.isCorrect && (!r.hint || !own.isCorrect)) return { ...r, correct: alt, expected };
  }
  return { ...own, correct: expected, expected };
}
