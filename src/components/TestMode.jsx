import React, { useState, useEffect, useRef, useMemo } from 'react';
import FloatingBack from './FloatingBack';
import { vocabByGrade, getGrade } from '../data/vocab';
import { compareAnswers } from '../utils/textComparison';
import { recordWord, setMistakes } from '../utils/progress';
import { speak, ttsSupported } from '../utils/speech';
import { generatePrintTest } from '../utils/printTest';

const BACK_BTN = 'px-4 py-2.5 bg-rose-100 dark:bg-rose-950 hover:bg-rose-200 dark:hover:bg-rose-900 active:scale-95 text-rose-700 dark:text-rose-300 font-semibold text-sm rounded-xl transition-all';

function shuffle(arr) {
  return [...arr].map(v => ({ v, s: Math.random() })).sort((a, b) => a.s - b.s).map(({ v }) => v);
}

// ─── Test Setup ──────────────────────────────────────────────────────────────
export default function TestMode({ selectedGrades, onBack }) {
  const [phase, setPhase]   = useState('setup');
  const [testWords, setTestWords] = useState([]);
  const [config, setConfig] = useState({ count: 20, direction: 'mix' });
  const [results, setResults] = useState(null);
  const [showFilter, setShowFilter] = useState(false);

  const allTopics = useMemo(() =>
    selectedGrades.flatMap(g =>
      vocabByGrade[g].topics.map(t => ({
        key: `${g}::${t.name}`,
        label: selectedGrades.length > 1 ? `${vocabByGrade[g].label}: ${t.name}` : t.name,
        words: t.words.map(w => ({ ...w, cat: t.name, grade: g })),
      }))
    ), [selectedGrades]);

  const [selectedTopics, setSelectedTopics] = useState(() => new Set(allTopics.map(t => t.key)));

  const allWords = useMemo(() =>
    allTopics.filter(t => selectedTopics.has(t.key)).flatMap(t => t.words),
    [allTopics, selectedTopics]);

  const maxWords = allWords.length;

  const toggleTopic = (key) =>
    setSelectedTopics(prev => { const s = new Set(prev); s.has(key) ? s.delete(key) : s.add(key); return s; });

  const startTest = () => {
    const picked = shuffle(allWords).slice(0, Math.min(config.count, maxWords));
    const prepared = picked.map(w => {
      let dir = config.direction;
      if (dir === 'mix') dir = Math.random() > 0.5 ? 'es2de' : 'de2es';
      return { ...w, dir };
    });
    setTestWords(prepared);
    setPhase('test');
  };

  const handleFinish = (res) => {
    res.forEach(r => recordWord(r.word.es, r.isCorrect));
    setMistakes(res.filter(r => !r.isCorrect).map(r => r.word));
    setResults(res);
    setPhase('result');
  };

  if (phase === 'test') {
    return <TestExam words={testWords} onFinish={handleFinish} onCancel={() => setPhase('setup')} />;
  }
  if (phase === 'result') {
    return <TestResult results={results} totalWords={testWords.length} onBack={() => setPhase('setup')} onRetry={startTest} />;
  }

  return (
    <>
    <FloatingBack onClick={onBack} />
    <div className="animate-slide-up space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className={BACK_BTN}>← Zurück</button>
        <h2 className="text-xl font-extrabold text-gray-800 dark:text-gray-100">Vokabeltest</h2>
      </div>

      <div className="card space-y-6">
        {/* Anzahl */}
        <div>
          <label className="text-sm font-bold text-gray-700 dark:text-gray-200 block mb-3">Anzahl Wörter</label>
          <div className="flex flex-wrap gap-2">
            {[10, 20, 30, maxWords].filter((v, i, a) => a.indexOf(v) === i).map(n => (
              <button key={n} onClick={() => setConfig(c => ({ ...c, count: n }))}
                className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all ${
                  config.count === n
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:border-amber-300'
                }`}>
                {n === maxWords ? `Alle (${maxWords})` : n}
              </button>
            ))}
          </div>
        </div>

        {/* Richtung */}
        <div>
          <label className="text-sm font-bold text-gray-700 dark:text-gray-200 block mb-3">Richtung</label>
          <div className="flex flex-wrap gap-2">
            {[['es2de', 'Spanisch → Deutsch'], ['de2es', 'Deutsch → Spanisch'], ['mix', 'Gemischt']].map(([val, label]) => (
              <button key={val} onClick={() => setConfig(c => ({ ...c, direction: val }))}
                className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all ${
                  config.direction === val
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:border-amber-300'
                }`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Themenfilter */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-bold text-gray-700">
              Themen{' '}
              <span className="font-normal text-gray-400 text-xs">({selectedTopics.size}/{allTopics.length} ausgewählt)</span>
            </label>
            <button onClick={() => setShowFilter(v => !v)}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-all">
              {showFilter ? 'Einklappen ▲' : 'Filtern ▼'}
            </button>
          </div>
          {showFilter && (
            <div className="pt-2 border-t border-gray-100 dark:border-gray-800 space-y-0.5">
              <div className="flex gap-3 mb-2">
                <button onClick={() => setSelectedTopics(new Set(allTopics.map(t => t.key)))}
                  className="text-xs font-semibold text-indigo-600 hover:underline">Alle</button>
                <button onClick={() => setSelectedTopics(new Set())}
                  className="text-xs font-semibold text-gray-400 hover:underline">Keine</button>
              </div>
              {allTopics.map(t => (
                <label key={t.key} className="flex items-center gap-2.5 cursor-pointer py-1 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg px-1">
                  <input type="checkbox" checked={selectedTopics.has(t.key)} onChange={() => toggleTopic(t.key)}
                    className="w-4 h-4 rounded accent-amber-500" />
                  <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">{t.label}</span>
                  <span className="text-xs text-gray-400">{t.words.length}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Notenschlüssel */}
        <div className="bg-amber-50 dark:bg-amber-950 rounded-xl p-4 text-sm text-amber-800 dark:text-amber-200 space-y-2">
          <div className="font-bold">Notenschlüssel</div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 text-xs">
            {[['1','≥96%'],['2','≥81%'],['3','≥66%'],['4','≥51%'],['5','≥26%'],['6','<26%']].map(([note, pct]) => (
              <div key={note} className="bg-white dark:bg-gray-800 rounded-lg p-2 text-center">
                <div className="font-extrabold text-amber-700 dark:text-amber-400">{note}</div>
                <div className="text-amber-500 dark:text-amber-500">{pct}</div>
              </div>
            ))}
          </div>
        </div>

        <button onClick={startTest} disabled={maxWords === 0}
          className="btn w-full text-white text-base font-bold disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}>
          Test starten → ({Math.min(config.count, maxWords)} Wörter)
        </button>

        <button
          disabled={maxWords === 0}
          onClick={() => {
            const words = shuffle(allWords).slice(0, Math.min(config.count, maxWords)).map(w => {
              let dir = config.direction;
              if (dir === 'mix') dir = Math.random() > 0.5 ? 'es2de' : 'de2es';
              return { ...w, dir };
            });
            const gradeLabel = selectedGrades.length === 1
              ? `Klasse ${selectedGrades[0]}`
              : `Klasse ${[...selectedGrades].sort((a,b)=>a-b).join('/')}`;
            const html = generatePrintTest({ words, direction: config.direction, gradeLabel });
            const win = window.open('', '_blank');
            if (win) { win.document.write(html); win.document.close(); }
          }}
          className="btn-outline btn w-full text-sm font-semibold disabled:opacity-40"
        >
          🖨️ Als Klassentest drucken
        </button>
      </div>
    </div>
    </>
  );
}

// ─── Test Exam ───────────────────────────────────────────────────────────────
function TestExam({ words, onFinish, onCancel }) {
  const [idx, setIdx]     = useState(0);
  const [input, setInput] = useState('');
  const [feedback, setFb] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [showExit, setShowExit] = useState(false);
  const inputRef = useRef(null);
  const total = words.length;
  const word  = words[idx];

  useEffect(() => { if (!feedback && inputRef.current) inputRef.current.focus(); }, [idx, feedback]);

  const submit = () => {
    if (!input.trim()) return;
    const correct = word.dir === 'es2de' ? word.de : word.es;
    const result  = compareAnswers(input, correct);
    setFb({ ...result, correct, userInput: input });
    if (result.isCorrect && !result.hasAccentWarning) {
      const newAnswers = [...answers, { word, userInput: input, correct, isCorrect: true, hasAccentWarning: false }];
      setTimeout(() => {
        if (idx + 1 >= total) onFinish(newAnswers);
        else { setAnswers(newAnswers); setFb(null); setInput(''); setIdx(i => i + 1); }
      }, 900);
    }
  };

  const proceed = () => {
    const newAnswers = [...answers, {
      word, userInput: input, correct: feedback.correct,
      isCorrect: feedback.isCorrect, hasAccentWarning: feedback.hasAccentWarning,
    }];
    if (idx + 1 >= total) onFinish(newAnswers);
    else { setAnswers(newAnswers); setFb(null); setInput(''); setIdx(i => i + 1); }
  };

  const question = word.dir === 'es2de' ? word.es : word.de;
  const qLabel   = word.dir === 'es2de' ? '🇪🇸 Español' : '🇩🇪 Deutsch';
  const aLabel   = word.dir === 'es2de' ? 'Deutsch' : 'Español';
  const qLang    = word.dir === 'es2de' ? 'es-ES' : 'de-DE';

  return (
    <div className="animate-slide-up space-y-4 relative">
      <div className="flex items-center justify-between">
        <button onClick={() => setShowExit(true)} className={BACK_BTN}>← Abbrechen</button>
        <span className="text-sm font-bold text-gray-500">{idx + 1} / {total}</span>
        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-bold">TEST</span>
      </div>

      <div className="w-full bg-gray-100 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
        <div className="h-full transition-all" style={{ width: `${(idx / total) * 100}%`, background: 'linear-gradient(90deg,#f59e0b,#d97706)' }} />
      </div>

      <div className="card text-center space-y-2">
        <span className="text-xs font-bold text-gray-400">{qLabel}</span>
        <div className="flex items-center justify-center gap-2">
          <p className="text-2xl sm:text-3xl font-extrabold text-gray-800 dark:text-gray-100">{question}</p>
          {ttsSupported && (
            <button onClick={() => speak(question, qLang)}
              className="text-xl text-gray-300 hover:text-amber-500 transition-colors p-1 active:scale-90">
              🔊
            </button>
          )}
        </div>
        {word.cat && <p className="text-xs text-gray-400">{word.cat}</p>}
      </div>

      <div className="space-y-3">
        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">{aLabel}:</label>
        <input ref={inputRef} type="text" value={input}
          onChange={e => setInput(e.target.value)}
          disabled={!!feedback}
          onKeyDown={e => { if (e.key === 'Enter' && !feedback) submit(); }}
          className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-xl focus:outline-none text-lg font-semibold text-center focus:border-amber-400"
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
            <button onClick={submit} disabled={!input.trim()}
              className="btn w-full font-bold text-white disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}>
              Antworten
            </button>
          </>
        )}
        {feedback && (
          <>
            <div className={`p-4 rounded-xl text-center font-semibold ${
              feedback.isCorrect
                ? feedback.hasAccentWarning ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' : 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
            }`}>
              {feedback.isCorrect
                ? feedback.hasAccentWarning ? `Richtig! (Akzent beachten: ${feedback.correct})` : '¡Correcto! ✓'
                : `Falsch. Richtig: „${feedback.correct}"`}
            </div>
            {(!feedback.isCorrect || feedback.hasAccentWarning) && (
              <button onClick={proceed} className="btn btn-secondary w-full">Weiter →</button>
            )}
          </>
        )}
      </div>

      {showExit && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 max-w-sm w-full shadow-2xl text-center space-y-4">
            <div className="text-4xl">⚠️</div>
            <h3 className="text-xl font-bold dark:text-gray-100">Test abbrechen?</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Der aktuelle Fortschritt geht verloren.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={onCancel} className="btn bg-red-500 hover:bg-red-600 text-white">Ja, abbrechen</button>
              <button onClick={() => setShowExit(false)} className="btn btn-outline">Weitermachen</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Test Result ─────────────────────────────────────────────────────────────
function TestResult({ results, totalWords, onBack, onRetry }) {
  const [showMistakes, setShowMistakes] = useState(false);
  const correct  = results.filter(r => r.isCorrect).length;
  const pct      = Math.round((correct / totalWords) * 100);
  const grade    = getGrade(pct);
  const mistakes = results.filter(r => !r.isCorrect);
  const accents  = results.filter(r => r.hasAccentWarning);

  const noteColor = grade.note <= 2 ? '#059669' : grade.note <= 3 ? '#d97706' : grade.note <= 4 ? '#ea580c' : '#dc2626';

  return (
    <div className="animate-slide-up space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className={BACK_BTN}>← Zurück</button>
        <h2 className="text-xl font-extrabold text-gray-800 dark:text-gray-100">Testergebnis</h2>
      </div>

      <div className="card text-center space-y-4">
        <div className="text-5xl font-extrabold" style={{ color: noteColor }}>Note {grade.note}</div>
        <div className="text-lg font-bold text-gray-700 dark:text-gray-300">{grade.label}</div>
        <div className="text-4xl font-extrabold text-gray-800 dark:text-gray-100">{pct}%</div>
        <p className="text-gray-500 dark:text-gray-400">{correct} von {totalWords} richtig</p>
        {accents.length > 0 && (
          <p className="text-amber-600 text-sm font-medium">{accents.length} Antwort(en) mit Akzentfehler (als richtig gewertet)</p>
        )}
        <div className="grid grid-cols-6 gap-1 mt-2">
          {[1,2,3,4,5,6].map(n => (
            <div key={n} className={`rounded-lg p-2 text-center transition-all ${grade.note === n ? 'shadow-lg scale-110' : 'opacity-50'}`}
              style={{ background: n <= 2 ? '#dcfce7' : n <= 3 ? '#fef9c3' : n <= 4 ? '#ffedd5' : '#fee2e2' }}>
              <div className="font-extrabold text-sm">{n}</div>
            </div>
          ))}
        </div>
      </div>

      {mistakes.length > 0 && (
        <div className="card">
          <button onClick={() => setShowMistakes(v => !v)} className="flex justify-between items-center w-full">
            <span className="font-bold text-gray-800 dark:text-gray-100">{mistakes.length} Fehler ansehen</span>
            <span className="text-gray-400">{showMistakes ? '▲' : '▼'}</span>
          </button>
          {showMistakes && (
            <div className="mt-4 space-y-2">
              {mistakes.map((r, i) => (
                <div key={i} className="bg-red-50 dark:bg-red-950 rounded-xl p-3 text-sm">
                  <div className="text-gray-500 dark:text-gray-400 text-xs mb-1">{r.word.cat}</div>
                  <div className="font-bold text-gray-800 dark:text-gray-200">{r.word.dir === 'es2de' ? r.word.es : r.word.de}</div>
                  <div className="flex gap-2 mt-1 flex-wrap">
                    <span className="text-red-600 flex items-center gap-1"><span className="font-bold">✗</span> {r.userInput || '(leer)'}</span>
                    <span className="text-gray-400">→</span>
                    <span className="text-green-700 font-semibold flex items-center gap-1"><span className="font-bold">✓</span> {r.correct}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-gray-400 mt-3 pt-3 border-t border-gray-100">
            💡 Fehlerwörter gespeichert — übe sie unter <strong>Üben → Fehlerwörter</strong>
          </p>
        </div>
      )}

      <div className="flex gap-3 flex-wrap">
        <button onClick={onRetry} className="btn btn-primary flex-1">Nochmal testen</button>
        <button onClick={onBack} className="btn btn-outline flex-1">Einstellungen</button>
      </div>
    </div>
  );
}
