export const removeAccents = (str) =>
  str.normalize('NFD').replace(/[̀-ͯ]/g, '');

export const stripPunctuation = (str) => {
  if (!str) return '';
  return str
    .replace(/[¿?¡!.,;:()\-–—_'"""''`«»\[\]\{\}\/\\#%&\*\+\=\<\>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

// Split "die Nummer, die Zahl" or "Guten Morgen / Guten Tag" into alternatives.
// Splits on " / " (spaced slash) and "," and ";" — avoids splitting "ab-/übergeben".
const splitAlternatives = (str) =>
  str.split(/ \/ |[,;]/).map(s => s.trim()).filter(s => s.length > 0);

export const compareAnswers = (userInput, correctAnswer) => {
  const rawAnswers = Array.isArray(correctAnswer) ? correctAnswer : [correctAnswer];
  const answers = rawAnswers.flatMap(splitAlternatives);
  let bestResult = { isCorrect: false, hasAccentWarning: false };

  for (const ans of answers) {
    const cleanUser    = stripPunctuation(userInput || '').toLowerCase();
    const cleanCorrect = stripPunctuation(ans).toLowerCase();

    if (cleanUser === cleanCorrect) return { isCorrect: true, hasAccentWarning: false };

    const noAccentUser    = removeAccents(cleanUser);
    const noAccentCorrect = removeAccents(cleanCorrect);

    if (noAccentUser === noAccentCorrect) {
      bestResult = { isCorrect: true, hasAccentWarning: true };
    }
  }
  return bestResult;
};
