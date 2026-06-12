export const removeAccents = (str) =>
  str.normalize('NFD').replace(/[̀-ͯ]/g, '');

export const stripPunctuation = (str) => {
  if (!str) return '';
  return str
    .replace(/[¿?¡!.,;:()\-–—…_'"""''`«»\[\]\{\}\/\\#%&\*\+\=\<\>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

// Expand common German/Spanish placeholder abbreviations so "etw." and "etwas" both match.
// Applied after stripPunctuation (which already removed the trailing dot).
const ABBREVS = {
  'etw':   'etwas',
  'jmd':   'jemand',
  'jmdn':  'jemanden',
  'jmdm':  'jemandem',
  'jdn':   'jemanden',
  'jdm':   'jemandem',
  'sb':    'jemand',
  'sth':   'etwas',
  'algo':  'etwas',       // Spanish → German normalisation
  'alguien': 'jemanden',
};
const expandAbbreviations = (str) =>
  str.replace(/\b(etw|jmdn?|jmdm|jdn|jdm|sb|sth|algo|alguien)\b/gi,
    m => ABBREVS[m.toLowerCase()] ?? m);

// Split "die Nummer, die Zahl" or "Guten Morgen / Guten Tag" into alternatives.
// Splits on " / " (spaced slash) and "," and ";" — avoids splitting "ab-/übergeben".
const splitAlternatives = (str) =>
  str.split(/ \/ |[,;]/).map(s => s.trim()).filter(s => s.length > 0);

export const compareAnswers = (userInput, correctAnswer) => {
  const rawAnswers = Array.isArray(correctAnswer) ? correctAnswer : [correctAnswer];
  const answers = rawAnswers.flatMap(splitAlternatives);
  let bestResult = { isCorrect: false, hasAccentWarning: false };

  for (const ans of answers) {
    const cleanUser    = expandAbbreviations(stripPunctuation(userInput || '').toLowerCase());
    const cleanCorrect = expandAbbreviations(stripPunctuation(ans).toLowerCase());

    if (cleanUser === cleanCorrect) return { isCorrect: true, hasAccentWarning: false };

    const noAccentUser    = removeAccents(cleanUser);
    const noAccentCorrect = removeAccents(cleanCorrect);

    if (noAccentUser === noAccentCorrect) {
      bestResult = { isCorrect: true, hasAccentWarning: true };
    }
  }
  return bestResult;
};
