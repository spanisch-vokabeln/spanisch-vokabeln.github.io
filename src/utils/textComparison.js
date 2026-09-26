// ─── Answer checking ─────────────────────────────────────────────────────────
// A model answer like "el/la dentista", "mucho, -a", "estar (irr.)" or
// "(hinaus-/heraus-)gehen; verlassen" is expanded into every spelling a learner
// may reasonably type. The user's input is then compared against that list.

const MAX_VARIANTS = 256;

// ñ is its own letter in Spanish, so it survives accent stripping.
export const removeAccents = (str) =>
  str.replace(/ñ/g, '\u0001').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\u0001/g, 'ñ');

// Placeholders are unified so "etw.", "etwas", "algo" all compare equal (same for jmd./alguien).
const PLACEHOLDERS = {
  etw: 'etw', etwas: 'etw', algo: 'etw', sth: 'etw',
  jmd: 'jmd', jmdn: 'jmd', jmdm: 'jmd', jdn: 'jmd', jdm: 'jmd', sb: 'jmd',
  jemand: 'jmd', jemanden: 'jmd', jemandem: 'jmd', alguien: 'jmd',
};

// Lower-case, ß → ss, punctuation → space, placeholders unified.
export const normalizeAnswer = (str) => {
  if (!str) return '';
  return str
    .normalize('NFC')
    .toLowerCase()
    .replace(/ß/g, 'ss')
    .replace(/['’‘`´-]/g, '')                               // "Wie geht's" = "Wie gehts", "E-Mail" = "EMail"
    .replace(/[¿?¡!.,;:()[\]{}"“”„«»…_/\\#%&*+=<>–—]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map(w => PLACEHOLDERS[w] ?? w)
    .join(' ');
};

const letterCount = (s) => (s.match(/\p{L}/gu) || []).length;

// Replace the first regex match in `str` with each of `options`.
const branch = (str, match, options) =>
  options.map(o => str.slice(0, match.index) + o + str.slice(match.index + match[0].length));

// Apply `step` (string → string[] | null) until no string changes any more.
const expandAll = (strings, step) => {
  const out = [];
  const queue = [...strings];
  while (queue.length && out.length < MAX_VARIANTS) {
    const s = queue.shift();
    const next = step(s);
    if (next) queue.push(...next);
    else out.push(s);
  }
  return out;
};

// ── Step 1: article pairs "el/la X", "el / la X", "der / die X" ───────────────
// (No lookbehind in these regexes: Safari before iOS 16.4 cannot parse it.)
const ARTICLE_PAIR_RE = /(^|[^\p{L}])(el|la|los|las|der|die|das) ?\/ ?(el|la|los|las|der|die|das)(?![\p{L}])/iu;
const expandArticlePairs = (s) => {
  const m = ARTICLE_PAIR_RE.exec(s);
  return m ? branch(s, m, [m[1] + m[2], m[1] + m[3]]) : null;
};

// ── Step 2: endings "mucho, -a", "erste, -r, -s", "empleado/-a", "andere(-r,-s)" ──
const deriveForm = (base, ending) => {
  // Spanish vowel endings replace the final vowel (+s): cuánto → cuántas, todos → todas, este → esta.
  if (/^[aeo]s?$/.test(ending)) {
    if (/[aeo]s$/.test(base) && ending.endsWith('s')) return base.slice(0, -2) + ending;
    if (/[aeo]$/.test(base)) return base.slice(0, -1) + ending;
  }
  return base + ending;                                     // erste → erster, kein → keine, Bürger → Bürgerin
};
const ENDING_RES = [
  /(\p{L}+)\((-\p{L}+(?:\s*,\s*-\p{L}+)*)\)/u,               // andere(-r,-s)
  /(\p{L}+)\s+\((-\p{L}+(?:\s*,\s*-\p{L}+)+)\)/u,            // nächste (-r,-s)
  /(\p{L}+)((?:\s*,\s*-\p{L}+)+)/u,                         // mucho, -a · ¿cuánto, -a, -os, -as?
  /(\p{L}+)\/(-\p{L}+)/u,                                   // empleado/-a · Unternehmer/-in
];
const expandEndings = (s) => {
  for (const re of ENDING_RES) {
    const m = re.exec(s);
    if (!m) continue;
    const base = m[1];
    const endings = m[2].split(/[\s,]+/).filter(Boolean).map(e => e.replace(/^-/, ''));
    return branch(s, m, [base, ...endings.map(e => deriveForm(base, e))]);
  }
  return null;
};

// ── Step 3: compound prefixes "ab-/übergeben", "konkurrenz-/wettbewerbsfähig" ──
const GERMAN_PREFIXES = ['über', 'unter', 'durch', 'wieder', 'um', 'ab', 'an', 'auf', 'aus', 'ein', 'mit', 'nach', 'vor', 'zu', 'weg', 'hin', 'her'];
const COMPOUND_RE = /(\p{L}+)-\/(\p{L}+)(?!\p{L}*-)/u;   // not "(Jacken-/Hosen-)Tasche" (step 5)
const expandCompounds = (s) => {
  const m = COMPOUND_RE.exec(s);
  if (!m) return null;
  const [, first, second] = m;
  const options = [second];
  const prefix = GERMAN_PREFIXES.find(p => second.toLowerCase().startsWith(p) && second.length - p.length >= 3);
  if (prefix) options.push(first + second.slice(prefix.length));   // ab-/übergeben → abgeben
  return branch(s, m, options);
};

// ── Step 4: split into alternatives at " / ", "," and ";" (outside brackets) ──
const splitTopLevel = (s) => {
  const parts = [];
  let depth = 0, cur = '';
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '(') depth++;
    if (c === ')') depth = Math.max(0, depth - 1);
    if (depth === 0 && (c === ',' || c === ';' || (c === '/' && s[i - 1] === ' ' && s[i + 1] === ' '))) {
      parts.push(cur);
      cur = '';
      continue;
    }
    cur += c;
  }
  parts.push(cur);
  return parts.map(p => p.trim()).filter(Boolean);
};

// "conocer algo / a alguien" means "conocer algo" or "conocer a alguien".
const OBJECT_ONLY_RE = /^((a|de|con|en|por|para|an|mit|von|zu|für|über|auf) )?(etw|jmd)$/;
const TRAILING_OBJECT_RE = /(\s+(a|de|con|en|por|para|an|mit|von|zu|für|über|auf))?\s+(algo|alguien|etw\.?|etwas|jmd[nm]?\.?)\s*$/i;

const splitAlternatives = (s) => {
  const parts = splitTopLevel(s);
  const alternatives = [];
  parts.forEach((part, i) => {
    if (i > 0 && OBJECT_ONLY_RE.test(normalizeAnswer(part))) {
      const prev = parts[i - 1];
      if (TRAILING_OBJECT_RE.test(prev)) alternatives.push(prev.replace(TRAILING_OBJECT_RE, ' ' + part));
      return;
    }
    // Never accept endings ("-a") or one-letter fragments as a standalone answer.
    if (parts.length > 1 && (part.startsWith('-') || letterCount(part) < 2)) return;
    alternatives.push(part);
  });
  return alternatives;
};

// ── Step 5: brackets ─────────────────────────────────────────────────────────
// Grammar hints are dropped entirely; any other bracket content is optional.
const isGrammarHint = (content, attached) => {
  const c = content.trim();
  if (/^[-+]/.test(c)) return true;                                          // (-ue-) (-zco) (+ inf.)
  if (/^(irr|f|m|pl|adv|ugs|inf|subst|sust|n)\.$/i.test(c)) return true;      // (irr.) (f.) (pl.) (ugs.)
  if (!attached && /^(ue|ie|i|u|g|zc|j)$/i.test(c)) return true;             // poder (ue)
  if (/^(wörtl|höflichkeitsform|schulfach)/i.test(c)) return true;
  return false;
};
const BRACKET_RE = /(\s?)\(([^()]*)\)(\s?)/u;
const expandBrackets = (s) => {
  const m = BRACKET_RE.exec(s);
  if (!m) return null;
  const [, before, content, after] = m;
  const start = m.index, end = m.index + m[0].length;
  const attachedBefore = !before && start > 0;
  const attachedAfter  = !after && end < s.length;
  const gap = (before || after) ? ' ' : '';
  if (isGrammarHint(content, attachedBefore || attachedAfter)) return branch(s, m, [gap]);
  const options = content.split(/\s*\/\s*/).map(o => (attachedAfter ? o.replace(/-$/, '') : o).trim()).filter(Boolean);
  return branch(s, m, [gap, ...options.map(o => before + o + after)]);
};

// ── Step 6: word alternatives "er/sie/es ist", "es/son", "ist/sind" ──────────
const WORD_SLASH_RE = /(^|[^\p{L}-])(\p{L}{2,}(?:\/\p{L}{2,})+)(?![\p{L}])/u;
const expandWordSlashes = (s) => {
  const m = WORD_SLASH_RE.exec(s);
  return m ? branch(s, m, m[2].split('/').map(w => m[1] + w)) : null;
};

const ARTICLES = new Set(['el', 'la', 'los', 'las', 'der', 'die', 'das']);

const variantCache = new Map();

// Returns { exact: Set<string>, bare: Set<string>, whole: string } of normalized answers.
// `bare` holds the same answers without a leading article (accepted with a hint).
const buildVariants = (answer) => {
  if (variantCache.has(answer)) return variantCache.get(answer);

  const whole = normalizeAnswer(answer);
  let strings = expandAll([answer], expandArticlePairs);
  strings = expandAll(strings, expandEndings);
  strings = expandAll(strings, expandCompounds);
  // The complete answer (e.g. "Guten Morgen! / Guten Tag!") counts as well as each alternative.
  strings = strings.flatMap(s => [s, ...splitAlternatives(s)]);
  strings = expandAll(strings, expandBrackets);
  strings = expandAll(strings, expandWordSlashes);

  const exact = new Set([whole]);
  for (const s of strings) {
    const n = normalizeAnswer(s);
    if (n) exact.add(n);                                    // short fragments were already dropped in step 4
  }
  const bare = new Set();
  for (const n of exact) {
    const [first, ...rest] = n.split(' ');
    const r = rest.join(' ');
    if (ARTICLES.has(first) && letterCount(r) >= 2 && !exact.has(r)) bare.add(r);
  }

  const result = { exact, bare, whole };
  variantCache.set(answer, result);
  return result;
};

// All normalized spellings accepted as fully correct (used by scripts/check-answers.mjs).
export const getAcceptedAnswers = (correctAnswer) => {
  const answers = Array.isArray(correctAnswer) ? correctAnswer : [correctAnswer];
  return [...new Set(answers.flatMap(a => [...buildVariants(a).exact]))];
};

// hint: null | 'accent' | 'article' | 'article-accent'
export const compareAnswers = (userInput, correctAnswer) => {
  const answers = Array.isArray(correctAnswer) ? correctAnswer : [correctAnswer];
  const user = normalizeAnswer(userInput);
  const wrong = { isCorrect: false, hasAccentWarning: false, hint: null };
  if (!user) return wrong;
  const userNoAccent = removeAccents(user);

  const sets = answers.map(buildVariants);
  const matches = (key, compare) => sets.some(v => [...v[key]].some(compare));

  let hint;
  if (matches('exact', v => v === user)) hint = null;
  else if (matches('exact', v => removeAccents(v) === userNoAccent)) hint = 'accent';
  else if (matches('bare', v => v === user)) hint = 'article';
  else if (matches('bare', v => removeAccents(v) === userNoAccent)) hint = 'article-accent';
  else return wrong;

  return { isCorrect: true, hasAccentWarning: hint === 'accent' || hint === 'article-accent', hint };
};

// Short feedback text for a correct answer with a hint.
export const hintMessage = (hint) => ({
  accent: 'Akzente beachten',
  article: 'Artikel nicht vergessen',
  'article-accent': 'Artikel und Akzente beachten',
}[hint] ?? '');
