import React, { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { vocabByGrade } from '../data/vocab';
import { getWordStatus } from '../utils/progress';

const STATUS_CONFIG = {
  hard:   { label: 'Schwierig',    color: '#ef4444', bg: 'var(--game-bg-red)',   dot: '#ef4444' },
  medium: { label: 'Mittelmäßig', color: '#f59e0b', bg: 'var(--game-bg-amber)', dot: '#f59e0b' },
};

export default function HardWordsModal({ selectedGrades, onClose }) {
  const words = useMemo(() => {
    const grades = selectedGrades.length > 0 ? selectedGrades : Object.keys(vocabByGrade);
    const all = grades.flatMap(g =>
      vocabByGrade[g].topics.flatMap(t => t.words)
    );
    const hard   = all.filter(w => getWordStatus(w.es) === 'hard');
    const medium = all.filter(w => getWordStatus(w.es) === 'medium');
    return { hard, medium };
  }, [selectedGrades]);

  const total = words.hard.length + words.medium.length;

  const modal = (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative w-full sm:max-w-lg bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[85vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-800 dark:text-gray-100">
              Wörter zum Wiederholen
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {total === 0
                ? 'Alle geübten Wörter sitzen gut 🎉'
                : `${total} Wörter brauchen noch Übung`}
            </p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all text-lg">
            ×
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-5">
          {total === 0 && (
            <div className="text-center py-8">
              <div className="text-5xl mb-3">🏆</div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Noch keine Wörter geübt oder alle sitzen gut!
              </p>
            </div>
          )}

          {['hard', 'medium'].map(status => {
            const list = words[status];
            if (list.length === 0) return null;
            const cfg = STATUS_CONFIG[status];
            return (
              <div key={status}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: cfg.dot }} />
                  <h3 className="text-xs font-bold uppercase tracking-wide" style={{ color: cfg.color }}>
                    {cfg.label} · {list.length} Wörter
                  </h3>
                </div>
                <div className="grid grid-cols-1 gap-1.5">
                  {list.map((w, i) => (
                    <div key={i}
                      className="flex items-center justify-between rounded-xl px-3 py-2.5 border border-gray-100 dark:border-gray-800"
                      style={{ background: cfg.bg }}>
                      <span className="font-bold text-sm text-gray-800 dark:text-gray-100">{w.es}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-3 text-right">{w.de}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-800 flex-shrink-0">
          <button onClick={onClose}
            className="w-full btn btn-primary text-sm">
            Schließen
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
