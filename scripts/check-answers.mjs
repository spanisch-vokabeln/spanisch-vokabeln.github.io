// Checks the answer comparison against every vocabulary entry.
// Run with: npm run check
import { vocabByGrade } from '../src/data/vocab.js';
import { compareAnswers, getAcceptedAnswers, normalizeAnswer } from '../src/utils/textComparison.js';

const errors = [];
const letterCount = (s) => (s.match(/\p{L}/gu) || []).length;

// Removes every bracket group: "la bici(cleta)" → "la bici", "(der) Herr" → "Herr".
const withoutBrackets = (s) =>
  s.replace(/\s*\([^()]*\)\s*/g, m => (/^\s|\s$/.test(m) ? ' ' : '')).trim();

let checked = 0;
for (const [grade, { topics }] of Object.entries(vocabByGrade)) {
  for (const topic of topics) {
    for (const word of topic.words) {
      for (const field of ['es', 'de']) {
        const answer = word[field];
        const where = `[${grade} · ${topic.name}] ${field}: "${answer}"`;
        checked++;

        const self = compareAnswers(answer, answer);
        if (!self.isCorrect || self.hint) errors.push(`${where} akzeptiert sich selbst nicht`);

        // Every spelling of the answer without its bracket parts must be accepted too.
        if (answer.includes('(')) {
          const short = withoutBrackets(answer);
          const literal = normalizeAnswer(short);
          const variants = getAcceptedAnswers(short).filter(v => v !== literal || getAcceptedAnswers(short).length === 1);
          for (const v of variants) {
            if (!compareAnswers(v, answer).isCorrect) errors.push(`${where} lehnt "${v}" (ohne Klammerteil) ab`);
          }
        }

        // One-letter answers are fine only if the word itself is one letter ("y", "e (vor i und hi)").
        const core = [normalizeAnswer(answer), normalizeAnswer(withoutBrackets(answer))];
        for (const v of getAcceptedAnswers(answer)) {
          if (letterCount(v) < 2 && !core.includes(v)) errors.push(`${where} akzeptiert zu kurze Alternative "${v}"`);
        }
      }
    }
  }
}

// Expected results from bugs.md (Block 1).
const EXAMPLES = [
  ['estar', 'estar (irr.)', true],
  ['Herr', '(der) Herr', true],
  ['la bici', 'la bici(cleta)', true],
  ['el agua', 'el agua (f.)', true],
  ['unser', 'unser(e)', true],
  ['unsere', 'unser(e)', true],
  ['poder hacer algo', 'poder (-ue-) hacer algo', true],
  ['el dentista', 'el/la dentista', true],
  ['la dentista', 'el/la dentista', true],
  ['sie ist', 'er/sie/es ist', true],
  ['la empleada', 'el / la empleado/-a', true],
  ['mucha', 'mucho, -a', true],
  ['a', 'mucho, -a', false],
  ['r', 'erste, -r, -s', false],
  ['e', 'e (vor i und hi)', true],
  ['rodeado', '(estar) rodeado, -a', true],
  ['la policía', 'el/la (ciber)policía', true],
  ['die Polizistin', 'der / die (Cyber)Polizist(in)', true],
  ['s', 'erste, -r, -s', false],
  ['as', '¿cuánto, -a, -os, -as?', false],
  ['Guten Morgen! / Guten Tag!', 'Guten Morgen! / Guten Tag!', true],
  ['ano', 'año', false],
  ['Strasse', 'Straße', true],
  ['jemanden anrufen', 'jmdn. anrufen', true],
  ['llamar a jmd', 'llamar a alguien', true],
];
for (const [input, answer, expected] of EXAMPLES) {
  const { isCorrect } = compareAnswers(input, answer);
  if (isCorrect !== expected)
    errors.push(`Beispiel: "${input}" für "${answer}" sollte ${expected ? 'richtig' : 'falsch'} sein`);
}

const hint = (input, answer, expected) => {
  const r = compareAnswers(input, answer);
  if (r.hint !== expected) errors.push(`Beispiel: "${input}" für "${answer}" sollte Hinweis ${expected} haben, hat ${r.hint}`);
};
hint('mas', 'más', 'accent');
hint('dentista', 'el/la dentista', 'article');
hint('cancion', 'la canción', 'article-accent');

if (errors.length) {
  console.error(errors.join('\n'));
  console.error(`\n✘ ${errors.length} Fehler (${checked} Antworten geprüft)`);
  process.exit(1);
}
console.log(`✔ ${checked} Antworten geprüft, 0 Fehler`);
