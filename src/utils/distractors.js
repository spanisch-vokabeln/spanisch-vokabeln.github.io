// Picks up to `count` distinct wrong answer texts for a multiple-choice question.
// Skips candidates whose answer equals the correct one and candidates with the same
// prompt text (e.g. "gut" → bien / bueno: both would be correct).
// `fallbackPool` is used when `pool` has too few distinct texts.
export function pickDistractors(item, dir, pool, fallbackPool = [], count = 3) {
  const promptOf = w => (dir === 'es2de' ? w.es : w.de);
  const answerOf = w => (dir === 'es2de' ? w.de : w.es);
  const seen = new Set([answerOf(item)]);
  const out = [];
  const tryAdd = (w) => {
    const text = answerOf(w);
    if (!text || seen.has(text) || promptOf(w) === promptOf(item)) return;
    seen.add(text);
    out.push(text);
  };
  for (const p of [pool, fallbackPool]) {
    if (!p.length) continue;
    for (let tries = 0; tries < 60 && out.length < count; tries++) {
      tryAdd(p[Math.floor(Math.random() * p.length)]);
    }
    // Small pools: scan everything from a random offset
    const offset = Math.floor(Math.random() * p.length);
    for (let k = 0; k < p.length && out.length < count; k++) {
      tryAdd(p[(offset + k) % p.length]);
    }
    if (out.length >= count) break;
  }
  return out;
}
