import React, { useState } from 'react';
import { vocabByGrade, buildWordPool } from '../data/vocab';
import { getProgressSummary, downloadProgress } from '../utils/backup';
import ProgressModal from './ProgressModal';
import HardWordsModal from './HardWordsModal';

const GRADE_GROUPS = [
  { key: 'alt', label: '¡Vamos! ¡Adelante!',              grades: [7, 8, 9, 10] },
  { key: 'neu', label: '¡Vamos! ¡Adelante! Nueva Edición', grades: ['7n'] },
  { key: 'ks',  label: 'Kursstufe / Abitur',               grades: ['ks'] },
];
const ALL_GRADES = GRADE_GROUPS.flatMap(g => g.grades);

function gradeLabel(g) {
  if (g === 'ks') return '11/12';
  return String(g).replace('n', '');
}

export default function HomePage({ selectedGrades, onToggleGrade, onSelectAll, onClearAll, onGo }) {
  const totalWords = buildWordPool(selectedGrades.length ? selectedGrades : []).length;
  const [showProgress, setShowProgress] = useState(false);
  const [showHard, setShowHard] = useState(false);
  const summary = getProgressSummary();

  return (
    <div className="animate-slide-up space-y-6 sm:space-y-8">
      {/* Hero */}
      <div className="card text-center border-0 text-white" style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)' }}>
        <div className="text-4xl sm:text-5xl mb-3">🇪🇸</div>
        <h1 className="text-2xl sm:text-4xl font-extrabold mb-2">Español Vokabeln</h1>
        <p className="text-sm sm:text-base" style={{ color: '#c7d2fe' }}>
          Klasse 7–12 · Lernen, üben und testen
        </p>
      </div>

      {/* Grade selector */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-base font-bold text-gray-800 dark:text-gray-100">Klasse wählen</h2>
          <div className="flex items-center gap-1">
            <button onClick={onSelectAll} className={`text-xs font-semibold px-2 py-1.5 rounded-lg transition-colors ${selectedGrades.length === ALL_GRADES.length ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500'}`}>Alle</button>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            <button onClick={onClearAll} className={`text-xs font-semibold px-2 py-1.5 rounded-lg transition-colors ${selectedGrades.length === 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500'}`}>Keine</button>
          </div>
        </div>

        {GRADE_GROUPS.map(group => (
          <div key={group.key} className="mb-4 last:mb-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2 text-center">
              {group.label}
            </p>
            {group.key === 'ks' ? (
              group.grades.map((g) => {
                const info = vocabByGrade[g];
                const count = buildWordPool([g]).length;
                const active = selectedGrades.includes(g);
                return (
                  <button
                    key={g}
                    onClick={() => onToggleGrade(g)}
                    className={`w-full rounded-xl px-4 py-3 border-2 transition-all duration-200 flex flex-row items-center gap-3 active:scale-95 ${
                      active
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950 shadow-md'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-indigo-300'
                    }`}
                  >
                    <span
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-[10px] flex-shrink-0"
                      style={{ background: active ? info.color : '#9ca3af' }}
                    >
                      {gradeLabel(g)}
                    </span>
                    <span className={`text-sm font-semibold ${active ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-500 dark:text-gray-400'}`}>
                      {count} Wörter · 8 Kursthemen
                    </span>
                  </button>
                );
              })
            ) : (
              <div className="grid grid-cols-4 gap-2 sm:gap-3">
                {group.grades.map((g) => {
                  const info = vocabByGrade[g];
                  const count = buildWordPool([g]).length;
                  const active = selectedGrades.includes(g);
                  return (
                    <button
                      key={g}
                      onClick={() => onToggleGrade(g)}
                      className={`rounded-xl p-3 sm:p-4 border-2 transition-all duration-200 flex flex-col items-center gap-1 active:scale-95 ${
                        active
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950 shadow-md'
                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-indigo-300'
                      }`}
                    >
                      <span
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-xs"
                        style={{ background: active ? info.color : '#9ca3af' }}
                      >
                        {gradeLabel(g)}
                      </span>
                      <span className={`text-xs font-semibold ${active ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-500 dark:text-gray-400'}`}>
                        {count} W.
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}

        {selectedGrades.length > 0 && (
          <div className="text-center text-sm text-indigo-600 font-semibold mt-3">
            {[...selectedGrades].sort((a, b) => String(a).localeCompare(String(b))).map(g => vocabByGrade[g].label).join(' + ')} · {totalWords} Wörter
          </div>
        )}
        {selectedGrades.length === 0 && (
          <div className="text-center text-sm text-gray-400 mt-3">
            Bitte mindestens eine Klassenstufe auswählen
          </div>
        )}
      </div>

      {/* Progress banner */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl flex-shrink-0">📊</span>
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 flex-1 min-w-0">
            {summary ? `${summary.total} Wörter geübt` : 'Noch kein Fortschritt gespeichert'}
          </span>
          {summary && (summary.hard > 0 || summary.medium > 0) && (
            <button
              onClick={() => setShowHard(true)}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:bg-amber-50 dark:hover:bg-amber-950 hover:border-amber-300 dark:text-gray-300 transition-all flex-shrink-0"
            >
              📋
            </button>
          )}
          <button
            onClick={() => setShowProgress(true)}
            className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 hover:border-indigo-300 dark:text-gray-300 transition-all flex-shrink-0"
          >
            {summary ? 'Sichern' : 'ℹ️ Info'}
          </button>
        </div>
        {summary && (() => {
          const total = summary.good + summary.medium + summary.hard;
          const pGood   = total ? (summary.good   / total) * 100 : 0;
          const pMedium = total ? (summary.medium / total) * 100 : 0;
          const pHard   = total ? (summary.hard   / total) * 100 : 0;
          return (
            <>
              <div className="h-2 rounded-full overflow-hidden flex bg-gray-100 dark:bg-gray-700">
                {pGood   > 0 && <div style={{ width: `${pGood}%`,   background: '#22c55e' }} />}
                {pMedium > 0 && <div style={{ width: `${pMedium}%`, background: '#f59e0b' }} />}
                {pHard   > 0 && <div style={{ width: `${pHard}%`,   background: '#ef4444' }} />}
              </div>
              <div className="flex items-center gap-4 mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" />{summary.good} gut</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />{summary.medium} mittel</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" />{summary.hard} schwierig</span>
              </div>
            </>
          );
        })()}</div>

      {showProgress && <ProgressModal onClose={() => setShowProgress(false)} />}
      {showHard && <HardWordsModal selectedGrades={selectedGrades} onClose={() => setShowHard(false)} />}

      {/* Action cards */}
      <div className="grid grid-cols-2 gap-3">
        <ActionCard
          icon="📖"
          title="Vokabeln ansehen"
          desc="Alle Wörter durchblättern"
          color="indigo"
          disabled={selectedGrades.length === 0}
          onClick={() => onGo('vocab')}
        />
        <ActionCard
          icon="🃏"
          title="Üben"
          desc="Karten, Quiz & Zuordnung"
          color="emerald"
          disabled={selectedGrades.length === 0}
          onClick={() => onGo('practice')}
        />
        <ActionCard
          icon="📝"
          title="Vokabeltest"
          desc="Zufälliger Test, Note 1–6"
          color="amber"
          disabled={selectedGrades.length === 0}
          onClick={() => onGo('test')}
        />
        <ActionCard
          icon="🎮"
          title="Spiele"
          desc="4 Spielmodi & Highscores"
          color="violet"
          disabled={false}
          onClick={() => onGo('games')}
        />
      </div>
    </div>
  );
}

function ActionCard({ icon, title, desc, color, disabled, onClick }) {
  const colors = {
    indigo:  { border: '#6366f1', bg: 'var(--action-bg-indigo)',  btnBg: '#4f46e5', btnHover: '#4338ca' },
    emerald: { border: '#059669', bg: 'var(--action-bg-emerald)', btnBg: '#059669', btnHover: '#047857' },
    amber:   { border: '#d97706', bg: 'var(--action-bg-amber)',   btnBg: '#d97706', btnHover: '#b45309' },
    violet:  { border: '#7c3aed', bg: 'var(--action-bg-violet)',  btnBg: '#7c3aed', btnHover: '#6d28d9' },
    rose:    { border: '#e11d48', bg: 'var(--action-bg-rose)',    btnBg: '#e11d48', btnHover: '#be123c' },
  };
  const c = colors[color];

  return (
    <div
      className={`card flex flex-col justify-between transition-all duration-300 ${disabled ? 'opacity-50' : 'hover:shadow-xl cursor-pointer'}`}
      onClick={disabled ? undefined : onClick}
      style={{ background: c.bg, borderColor: disabled ? undefined : c.border, padding: '0.875rem' }}
    >
      <div>
        <div className="text-2xl mb-1.5">{icon}</div>
        <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm mb-0.5 leading-tight">{title}</h3>
        <p className="text-gray-500 dark:text-gray-400 text-[11px] leading-snug line-clamp-2">{desc}</p>
      </div>
      <button
        disabled={disabled}
        tabIndex={-1}
        className={`mt-3 btn text-xs text-white py-2 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        style={{ background: disabled ? '#9ca3af' : c.btnBg }}
      >
        {disabled ? 'Klasse wählen' : 'Los geht\'s →'}
      </button>
    </div>
  );
}
