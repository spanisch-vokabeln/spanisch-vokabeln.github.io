import React, { useState, useEffect, useMemo, useRef } from 'react';
import FloatingBack from './FloatingBack';
import { vocabByGrade } from '../data/vocab';
import { compareAnswers } from '../utils/textComparison';
import { recordWord, sortByDifficulty, getMistakes, setMistakes } from '../utils/progress';
import { speak, ttsSupported } from '../utils/speech';

const BACK_BTN = 'px-4 py-2.5 bg-rose-100 dark:bg-rose-950 hover:bg-rose-200 dark:hover:bg-rose-900 active:scale-95 text-rose-700 dark:text-rose-300 font-semibold text-sm rounded-xl transition-all';

function shuffle(arr) {
  return [...arr].map(v => ({ v, s: Math.random() })).sort((a, b) => a.s - b.s).map(({ v }) => v);
}

// ─── Practice Menu ──────────────────────────────────────────────────────────
export default function PracticeMode({ selectedGrades, onBack }) {
  const [mode, setMode]             = useState(null);
  const [mistakeMode, setMistakeMode] = useState(false);
  const [showFilter, setShowFilter] = useState(false);

  const allTopics = useMemo(() =>
    selectedGrades.flatMap(g =>
      vocabByGrade[g].topics.map(t => ({
        key: `${g}::${t.name}`,
        label: selectedGrades.length > 1 ? `${vocabByGrade[g].label}: ${t.name}` : t.name,
        color: vocabByGrade[g].color,
        grade: g,
        words: t.words.map(w => ({ ...w, cat: t.name, grade: g })),
      }))
    ), [selectedGrades]);

  const [selectedTopics, setSelectedTopics] = useState(() => new Set(allTopics.map(t => t.key)));

  const filteredWords = useMemo(() =>
    allTopics.filter(t => selectedTopics.has(t.key)).flatMap(t => t.words),
    [allTopics, selectedTopics]);

  const savedMistakes = getMistakes();
  const activeWords   = mistakeMode ? savedMistakes : filteredWords;

  const toggleTopic = (key) =>
    setSelectedTopics(prev => { const s = new Set(prev); s.has(key) ? s.delete(key) : s.add(key); return s; });

  if (mode === 'flashcard') return <FlashcardMode words={activeWords} onBack={() => setMode(null)} />;
  if (mode === 'choice')    return <MultipleChoiceMode words={activeWords} onBack={() => setMode(null)} />;
  if (mode === 'typing')    return <TypingMode words={activeWords} onBack={() => setMode(null)} />;
  if (mode === 'matching')  return <MatchingMode words={activeWords} onBack={() => setMode(null)} />;

  const canStart  = activeWords.length >= 1;
  const canChoice = activeWords.length >= 4;

  return (
    <>
    <FloatingBack onClick={onBack} />
    <div className="animate-slide-up space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className={BACK_BTN}>← Zurück</button>
        <h2 className="text-xl font-extrabold text-gray-800 dark:text-gray-100">Üben</h2>
      </div>

      {/* Topic filter */}
      {!mistakeMode && (
        <div className="card">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">
              <span className="font-bold text-gray-700 dark:text-gray-200">{filteredWords.length}</span> Wörter ·{' '}
              <span className="font-bold text-gray-700 dark:text-gray-200">{selectedTopics.size}/{allTopics.length}</span> Themen
            </span>
            <button onClick={() => setShowFilter(v => !v)}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-all">
              Themen {showFilter ? '▲' : '▼'}
            </button>
          </div>
          {showFilter && (
            <div className="mt-3 pt-3 border-t border-gray-100 space-y-0.5">
              <div className="flex gap-3 mb-2">
                <button onClick={() => setSelectedTopics(new Set(allTopics.map(t => t.key)))}
                  className="text-xs font-semibold text-indigo-600 hover:underline">Alle</button>
                <button onClick={() => setSelectedTopics(new Set())}
                  className="text-xs font-semibold text-gray-400 hover:underline">Keine</button>
              </div>
              {allTopics.map(t => (
                <label key={t.key} className="flex items-center gap-2.5 cursor-pointer py-1 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg px-1">
                  <input type="checkbox" checked={selectedTopics.has(t.key)} onChange={() => toggleTopic(t.key)}
                    className="w-4 h-4 rounded accent-indigo-600" />
                  <span className="text-sm text-gray-700 dark:text-gray-200 flex-1">{t.label}</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">{t.words.length}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Fehlerwörter card */}
      {savedMistakes.length > 0 && (
        <button onClick={() => setMistakeMode(v => !v)}
          className={`w-full card text-left flex items-center gap-3 cursor-pointer active:scale-95 border-2 transition-all ${
            mistakeMode ? 'border-rose-400 bg-rose-50' : 'border-rose-200 hover:border-rose-300 hover:shadow-md'
          }`}>
          <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-xl flex-shrink-0">🔁</div>
          <div className="flex-1">
            <div className="font-bold text-gray-800 dark:text-gray-100 text-sm">Fehlerwörter üben</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{savedMistakes.length} Wörter aus letzter Session</div>
          </div>
          {mistakeMode
            ? <span className="text-xs font-bold text-rose-600 bg-rose-100 px-2 py-1 rounded-lg">Aktiv ✓</span>
            : <span className="text-xs text-rose-400 font-medium">Tippen →</span>}
        </button>
      )}
      {mistakeMode && (
        <p className="text-xs text-center text-gray-400">
          Fehlerwörter-Modus aktiv ·{' '}
          <button onClick={() => setMistakeMode(false)} className="text-indigo-600 underline">Zurück zu allen Wörtern</button>
        </p>
      )}

      {/* Mode grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ModeCard icon="🃏" title="Karteikarten" desc="Schwierige Wörter zuerst · Gewusst / Noch nicht"
          color="#6366f1" onClick={() => setMode('flashcard')} disabled={!canStart} />
        <ModeCard icon="🔘" title="Multiple Choice" desc="4 Antworten – wähle die richtige"
          color="#059669" onClick={() => setMode('choice')} disabled={!canChoice} />
        <ModeCard icon="⌨️" title="Eintippen" desc="Übersetzung selbst eintippen"
          color="#d97706" onClick={() => setMode('typing')} disabled={!canStart} />
        <ModeCard icon="🔗" title="Zuordnung" desc="Paare aus ES und DE verbinden"
          color="#7c3aed" onClick={() => setMode('matching')} disabled={!canChoice} />
      </div>
    </div>
    </>
  );
}

function ModeCard({ icon, title, desc, color, onClick, disabled }) {
  return (
    <button onClick={disabled ? undefined : onClick} disabled={disabled}
      className={`card text-left transition-all duration-200 active:scale-95 flex items-start gap-4 ${
        disabled ? 'opacity-40 cursor-not-allowed' : 'hover:shadow-xl cursor-pointer'
      }`}>
      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
        style={{ background: color + '22' }}>
        {icon}
      </div>
      <div>
        <div className="font-bold text-gray-800 dark:text-gray-100">{title}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{desc}</div>
      </div>
    </button>
  );
}

// ─── Flashcard Mode ──────────────────────────────────────────────────────────
function FlashcardMode({ words, onBack }) {
  const [direction, setDirection] = useState('es2de');
  const [deck]      = useState(() => sortByDifficulty(words));
  const [idx, setIdx]     = useState(0);
  const [revealed, setRevealed] = useState(false);
  const mistakesRef = useRef([]);
  const total = deck.length;
  const card  = deck[idx];

  const front     = card ? (direction === 'es2de' ? card.es : card.de) : '';
  const back      = card ? (direction === 'es2de' ? card.de : card.es) : '';
  const frontLang = direction === 'es2de' ? 'es-ES' : 'de-DE';

  const handleAnswer = (known) => {
    if (!card) return;
    recordWord(card.es, known);
    if (!known) mistakesRef.current.push(card);
    if (idx + 1 >= total) setMistakes(mistakesRef.current);
    setRevealed(false);
    setIdx(i => i + 1);
  };

  const restart = () => { mistakesRef.current = []; setIdx(0); setRevealed(false); };

  if (idx >= total) {
    const knownCount = total - mistakesRef.current.length;
    return (
      <div className="card animate-slide-up text-center space-y-4">
        <div className="text-5xl">{mistakesRef.current.length === 0 ? '🎉' : '💪'}</div>
        <h3 className="text-2xl font-extrabold">Alle Karten durch!</h3>
        <div className="flex justify-center gap-8">
          <div>
            <div className="text-2xl font-extrabold text-emerald-600">{knownCount}</div>
            <div className="text-xs text-gray-500">Gewusst</div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-rose-500">{mistakesRef.current.length}</div>
            <div className="text-xs text-gray-500">Noch nicht</div>
          </div>
        </div>
        {mistakesRef.current.length > 0 && (
          <p className="text-xs text-gray-400">Fehlerwörter für Üben gespeichert.</p>
        )}
        <div className="flex gap-3 justify-center flex-wrap">
          <button onClick={restart} className="btn btn-primary">Nochmal</button>
          <button onClick={onBack} className="btn btn-outline">Zurück</button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-slide-up space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className={BACK_BTN}>← Zurück</button>
        <span className="text-sm text-gray-400 font-medium">{idx + 1} / {total}</span>
        <button
          onClick={() => { setDirection(d => d === 'es2de' ? 'de2es' : 'es2de'); setRevealed(false); }}
          className="text-xs font-bold px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:border-indigo-300">
          {direction === 'es2de' ? 'ES → DE' : 'DE → ES'}
        </button>
      </div>

      <div className="w-full bg-gray-100 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
        <div className="h-full bg-indigo-500 transition-all duration-300 rounded-full" style={{ width: `${(idx / total) * 100}%` }} />
      </div>

      <div onClick={() => setRevealed(r => !r)}
        className="card w-full min-h-48 flex flex-col items-center justify-center text-center gap-3 cursor-pointer hover:shadow-xl transition-all active:scale-[0.98]">
        <span className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
          {direction === 'es2de' ? 'Español' : 'Deutsch'}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-2xl sm:text-3xl font-extrabold text-gray-800 dark:text-gray-100">{front}</span>
          {ttsSupported && (
            <button onClick={e => { e.stopPropagation(); speak(front, frontLang); }}
              className="text-xl text-gray-300 hover:text-indigo-500 transition-colors p-1 active:scale-90">
              🔊
            </button>
          )}
        </div>
        {card.cat && <span className="text-xs text-indigo-400 font-medium">{card.cat}</span>}
        {revealed ? (
          <div className="border-t border-gray-100 pt-4 w-full">
            <span className="text-xs font-bold uppercase tracking-widest text-gray-400">
              {direction === 'es2de' ? 'Deutsch' : 'Español'}
            </span>
            <p className="text-xl font-bold text-indigo-600 mt-1">{back}</p>
          </div>
        ) : (
          <p className="text-gray-300 text-sm">Tippen zum Aufdecken</p>
        )}
      </div>

      {!revealed ? (
        <button onClick={() => setRevealed(true)} className="btn btn-primary w-full">Aufdecken →</button>
      ) : (
        <div className="flex gap-3">
          <button onClick={() => handleAnswer(false)}
            className="flex-1 py-4 rounded-xl font-bold text-base bg-rose-100 dark:bg-rose-950 hover:bg-rose-200 dark:hover:bg-rose-900 active:scale-95 text-rose-700 dark:text-rose-300 transition-all">
            ✗ Noch nicht
          </button>
          <button onClick={() => handleAnswer(true)}
            className="flex-1 py-4 rounded-xl font-bold text-base bg-emerald-100 dark:bg-emerald-950 hover:bg-emerald-200 dark:hover:bg-emerald-900 active:scale-95 text-emerald-700 dark:text-emerald-300 transition-all">
            ✓ Gewusst
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Multiple Choice Mode ────────────────────────────────────────────────────
function MultipleChoiceMode({ words, onBack }) {
  const [deck]        = useState(() => shuffle(words));
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFb] = useState(null);
  const mistakesRef = useRef([]);
  const total = deck.length;
  const card  = deck[idx];

  const options = useMemo(() => {
    if (!card) return [];
    const correct = card.de;
    const pool    = deck.filter(w => w.de !== correct).map(w => w.de);
    return shuffle([correct, ...shuffle(pool).slice(0, 3)]);
  }, [idx]);

  const advance = (nextIdx) => {
    if (nextIdx >= total) setMistakes(mistakesRef.current);
    setFb(null);
    setIdx(nextIdx);
  };

  const pick = (opt) => {
    if (feedback) return;
    const isCorrect = opt === card.de;
    if (isCorrect) setScore(s => s + 1);
    else mistakesRef.current.push(card);
    recordWord(card.es, isCorrect);
    setFb({ picked: opt, correct: card.de, isCorrect });
    if (isCorrect) setTimeout(() => advance(idx + 1), 1000);
  };

  if (idx >= total) {
    const pct = Math.round((score / total) * 100);
    return (
      <div className="card animate-slide-up text-center space-y-4">
        <div className="text-5xl">{pct >= 80 ? '🏆' : pct >= 50 ? '👍' : '📚'}</div>
        <h3 className="text-2xl font-extrabold">Fertig!</h3>
        <p className="text-4xl font-extrabold text-indigo-600">{pct}%</p>
        <p className="text-gray-500">{score} von {total} richtig</p>
        <div className="flex gap-3 justify-center flex-wrap">
          <button onClick={() => { setIdx(0); setScore(0); setFb(null); mistakesRef.current = []; }} className="btn btn-primary">Nochmal</button>
          <button onClick={onBack} className="btn btn-outline">Zurück</button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-slide-up space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className={BACK_BTN}>← Zurück</button>
        <span className="text-sm text-gray-400">{idx + 1} / {total} · ✓ {score}</span>
      </div>
      <div className="w-full bg-gray-100 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
        <div className="h-full bg-emerald-500 transition-all" style={{ width: `${(idx / total) * 100}%` }} />
      </div>

      <div className="card text-center">
        {card.cat && <span className="text-xs text-emerald-500 font-bold uppercase tracking-wide block mb-1">{card.cat}</span>}
        <div className="flex items-center justify-center gap-2">
          <p className="text-2xl font-extrabold text-gray-800 dark:text-gray-100">{card.es}</p>
          {ttsSupported && (
            <button onClick={() => speak(card.es, 'es-ES')}
              className="text-xl text-gray-300 hover:text-emerald-500 transition-colors p-1 active:scale-90">
              🔊
            </button>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-1">Wie heißt das auf Deutsch?</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {options.map((opt, i) => {
          let cls = 'btn-outline';
          if (feedback) {
            if (opt === feedback.correct) cls = 'bg-green-500 border-green-500 text-white';
            else if (opt === feedback.picked && !feedback.isCorrect) cls = 'bg-red-500 border-red-500 text-white animate-shake';
            else cls = 'btn-outline opacity-40';
          }
          return (
            <button key={i} onClick={() => pick(opt)} disabled={!!feedback}
              className={`btn py-4 text-sm font-semibold ${cls}`}>
              {opt}
            </button>
          );
        })}
      </div>

      {feedback && !feedback.isCorrect && (
        <div className="flex justify-center">
          <button onClick={() => advance(idx + 1)} className="btn btn-primary">Weiter →</button>
        </div>
      )}
    </div>
  );
}

// ─── Typing Mode ─────────────────────────────────────────────────────────────
function TypingMode({ words, onBack }) {
  const [deck]       = useState(() => sortByDifficulty(words));
  const [idx, setIdx]     = useState(0);
  const [input, setInput] = useState('');
  const [feedback, setFb] = useState(null);
  const [score, setScore] = useState(0);
  const [direction, setDirection] = useState('es2de');
  const inputRef    = useRef(null);
  const mistakesRef = useRef([]);
  const total = deck.length;
  const card  = deck[idx];

  useEffect(() => { if (!feedback && inputRef.current) inputRef.current.focus(); }, [idx, feedback]);

  const advance = (nextIdx) => {
    if (nextIdx >= total) setMistakes(mistakesRef.current);
    setFb(null);
    setInput('');
    setIdx(nextIdx);
  };

  const submit = () => {
    if (!input.trim()) return;
    const correct = direction === 'es2de' ? card.de : card.es;
    const result  = compareAnswers(input, correct);
    if (result.isCorrect) setScore(s => s + 1);
    else mistakesRef.current.push(card);
    recordWord(card.es, result.isCorrect);
    setFb({ ...result, correct });
    if (result.isCorrect && !result.hasAccentWarning) {
      setTimeout(() => advance(idx + 1), 1200);
    }
  };

  if (idx >= total) {
    const pct = Math.round((score / total) * 100);
    return (
      <div className="card animate-slide-up text-center space-y-4">
        <div className="text-5xl">{pct >= 80 ? '🏆' : '📚'}</div>
        <h3 className="text-2xl font-extrabold">Fertig!</h3>
        <p className="text-4xl font-extrabold text-indigo-600">{pct}%</p>
        <p className="text-gray-500">{score} von {total} richtig</p>
        <div className="flex gap-3 justify-center flex-wrap">
          <button onClick={() => { setIdx(0); setScore(0); setFb(null); setInput(''); mistakesRef.current = []; }} className="btn btn-primary">Nochmal</button>
          <button onClick={onBack} className="btn btn-outline">Zurück</button>
        </div>
      </div>
    );
  }

  const question = direction === 'es2de' ? card.es : card.de;
  const qLang    = direction === 'es2de' ? 'Español' : 'Deutsch';
  const aLang    = direction === 'es2de' ? 'Deutsch' : 'Español';

  return (
    <div className="animate-slide-up space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className={BACK_BTN}>← Zurück</button>
        <span className="text-sm text-gray-400">{idx + 1} / {total} · ✓ {score}</span>
        <button onClick={() => setDirection(d => d === 'es2de' ? 'de2es' : 'es2de')}
          className="text-xs font-bold px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:border-indigo-300">
          {direction === 'es2de' ? 'ES → DE' : 'DE → ES'}
        </button>
      </div>
      <div className="w-full bg-gray-100 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
        <div className="h-full bg-amber-400 transition-all" style={{ width: `${(idx / total) * 100}%` }} />
      </div>

      <div className="card text-center">
        <span className="text-xs text-amber-500 font-bold uppercase tracking-wide">{qLang}</span>
        <div className="flex items-center justify-center gap-2 mt-1">
          <p className="text-2xl font-extrabold text-gray-800">{question}</p>
          {ttsSupported && (
            <button onClick={() => speak(question, direction === 'es2de' ? 'es-ES' : 'de-DE')}
              className="text-xl text-gray-300 hover:text-amber-500 transition-colors p-1 active:scale-90">
              🔊
            </button>
          )}
        </div>
        {card.cat && <p className="text-xs text-gray-400 mt-1">{card.cat}</p>}
      </div>

      <div className="space-y-3">
        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">{aLang}:</label>
        <input ref={inputRef} type="text" value={input}
          onChange={e => setInput(e.target.value)}
          disabled={!!feedback}
          onKeyDown={e => { if (e.key === 'Enter' && !feedback) submit(); }}
          className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-xl focus:border-amber-400 focus:outline-none text-lg font-semibold text-center"
          placeholder="Übersetzung eingeben…"
        />
        {!feedback && (
          <>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {['á','é','í','ó','ú','ñ','ü','¡','¿'].map(c => (
                <button key={c} onClick={() => setInput(v => v + c)}
                  className="w-9 h-9 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:text-gray-200 rounded-lg text-sm font-bold hover:bg-amber-50 dark:hover:bg-amber-950 hover:border-amber-300 transition-all">
                  {c}
                </button>
              ))}
            </div>
            <button onClick={submit} disabled={!input.trim()} className="btn btn-primary w-full disabled:opacity-40">
              Prüfen
            </button>
          </>
        )}
        {feedback && (
          <div className={`p-4 rounded-xl text-center font-semibold ${
            feedback.isCorrect
              ? feedback.hasAccentWarning ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' : 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
              : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
          }`}>
            {feedback.isCorrect
              ? feedback.hasAccentWarning ? `Richtig! (Akzente: ${feedback.correct})` : '¡Correcto!'
              : `Falsch. Richtig: ${feedback.correct}`}
          </div>
        )}
        {feedback && (!feedback.isCorrect || feedback.hasAccentWarning) && (
          <button onClick={() => advance(idx + 1)} className="btn btn-secondary w-full">Weiter →</button>
        )}
      </div>
    </div>
  );
}

// ─── Matching Mode ───────────────────────────────────────────────────────────
function MatchingMode({ words, onBack }) {
  const [allWords]    = useState(() => shuffle(words));
  const [round, setRound] = useState(0);
  const [roundMatched, setRoundMatched] = useState(0);
  const [matchedIds, setMatchedIds] = useState(new Set());
  const [cards, setCards]  = useState([]);
  const [selected, setSel] = useState(null);
  const [disabled, setDis] = useState(false);
  const [mistakes, setMistakesState] = useState(0);

  const PAIR_COUNT  = 5;
  const totalRounds = Math.ceil(allWords.length / PAIR_COUNT);

  const loadRound = (r) => {
    const slice = allWords.slice(r * PAIR_COUNT, r * PAIR_COUNT + PAIR_COUNT);
    const raw = [];
    slice.forEach(w => {
      raw.push({ id: `es-${w.es}`, text: w.es, lang: 'es', key: w.es, state: 'idle' });
      raw.push({ id: `de-${w.es}`, text: w.de, lang: 'de', key: w.es, state: 'idle' });
    });
    setCards(shuffle(raw));
    setRoundMatched(0);
    setSel(null);
  };

  useEffect(() => { loadRound(0); }, []);

  const click = (card) => {
    if (disabled || card.state === 'matched') return;
    if (!selected) {
      setSel(card);
      setCards(cs => cs.map(c => c.id === card.id ? { ...c, state: 'selected' } : c));
      return;
    }
    if (selected.id === card.id) {
      setSel(null);
      setCards(cs => cs.map(c => c.id === card.id ? { ...c, state: 'idle' } : c));
      return;
    }
    if (selected.lang === card.lang) {
      const prev = selected;
      setSel(card);
      setCards(cs => cs.map(c =>
        c.id === card.id ? { ...c, state: 'selected' } :
        c.id === prev.id ? { ...c, state: 'idle' } : c));
      return;
    }
    setCards(cs => cs.map(c => c.id === card.id ? { ...c, state: 'selected' } : c));
    const isMatch = selected.key === card.key;
    const p1 = selected, p2 = card;
    if (isMatch) {
      setCards(cs => cs.map(c => (c.id === p1.id || c.id === p2.id) ? { ...c, state: 'matched' } : c));
      setSel(null);
      const next = roundMatched + 1;
      setRoundMatched(next);
      setMatchedIds(prev => { const s = new Set(prev); s.add(p1.key); return s; });
      const pairCount = Math.min(PAIR_COUNT, allWords.length - round * PAIR_COUNT);
      if (next === pairCount) {
        const nextR = round + 1;
        setTimeout(() => { setRound(nextR); if (nextR < totalRounds) loadRound(nextR); }, 400);
      }
    } else {
      setDis(true);
      setMistakesState(m => m + 1);
      setCards(cs => cs.map(c => (c.id === p1.id || c.id === p2.id) ? { ...c, state: 'incorrect' } : c));
      setTimeout(() => {
        setCards(cs => cs.map(c => (c.id === p1.id || c.id === p2.id) ? { ...c, state: 'idle' } : c));
        setSel(null); setDis(false);
      }, 700);
    }
  };

  if (round >= totalRounds) {
    return (
      <div className="card animate-slide-up text-center space-y-4">
        <div className="text-5xl">🎉</div>
        <h3 className="text-2xl font-extrabold">Alle Paare gefunden!</h3>
        <p className="text-gray-500">Fehler: {mistakes}</p>
        <div className="flex gap-3 justify-center flex-wrap">
          <button onClick={() => { setRound(0); setMatchedIds(new Set()); setMistakesState(0); loadRound(0); }} className="btn btn-primary">Nochmal</button>
          <button onClick={onBack} className="btn btn-outline">Zurück</button>
        </div>
      </div>
    );
  }

  const colES = cards.filter(c => c.lang === 'es');
  const colDE = cards.filter(c => c.lang === 'de');

  return (
    <div className="animate-slide-up space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className={BACK_BTN}>← Zurück</button>
        <span className="text-sm text-gray-400">Runde {round + 1}/{totalRounds} · Fehler: {mistakes}</span>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:gap-4">
        {[{ col: colES, label: 'Español', color: '#6366f1' }, { col: colDE, label: 'Deutsch', color: '#059669' }].map(({ col, label, color }) => (
          <div key={label}>
            <div className="text-center text-xs font-bold uppercase tracking-wider mb-2" style={{ color }}>{label}</div>
            <div className="flex flex-col gap-2">
              {col.map(card => {
                const s = card.state;
                let cls = 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 hover:border-indigo-300';
                if (s === 'selected')  cls = 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-200 shadow-md ring-2 ring-indigo-200 dark:ring-indigo-800';
                if (s === 'matched')   cls = 'invisible pointer-events-none opacity-0';
                if (s === 'incorrect') cls = 'border-red-500 bg-red-50 dark:bg-red-950 text-red-800 dark:text-red-200 animate-shake';
                return (
                  <button key={card.id} onClick={() => click(card)}
                    className={`border-2 rounded-xl p-2 sm:p-3 text-sm font-semibold text-center min-h-14 transition-all duration-150 active:scale-95 ${cls}`}>
                    {card.text}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
