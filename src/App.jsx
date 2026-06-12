import React, { useState } from 'react';
import HomePage    from './components/HomePage';
import VocabBrowser from './components/VocabBrowser';
import PracticeMode from './components/PracticeMode';
import TestMode     from './components/TestMode';
import GamesHub     from './components/GamesHub';
import FeedbackModal from './components/FeedbackModal';
import { useDark } from './utils/darkMode.jsx';

const GRADES = [7, 8, 9, 10, '7n', 'ks'];

export default function App() {
  const [view, setView]                   = useState('home');
  const [selectedGrades, setSelectedGrades] = useState([]);
  const [showFeedback, setShowFeedback]   = useState(false);
  const { dark, setDark } = useDark();

  const toggleGrade = (g) =>
    setSelectedGrades(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);

  const selectAll  = () => setSelectedGrades([...GRADES]);
  const clearAll   = () => setSelectedGrades([]);

  const goTo = (target) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setView(target);
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--app-bg)' }}>
      <div className="max-w-3xl mx-auto px-3 py-6 sm:px-4 sm:py-10">
        {view === 'home' && (
          <HomePage
            selectedGrades={selectedGrades}
            onToggleGrade={toggleGrade}
            onSelectAll={selectAll}
            onClearAll={clearAll}
            onGo={goTo}
          />
        )}
        {view === 'vocab' && (
          <VocabBrowser
            selectedGrades={selectedGrades}
            onBack={() => goTo('home')}
          />
        )}
        {view === 'practice' && (
          <PracticeMode
            selectedGrades={selectedGrades}
            onBack={() => goTo('home')}
          />
        )}
        {view === 'test' && (
          <TestMode
            selectedGrades={selectedGrades}
            onBack={() => goTo('home')}
          />
        )}
        {view === 'games' && (
          <GamesHub
            selectedGrades={selectedGrades}
            onBack={() => goTo('home')}
          />
        )}
      </div>
      <footer className="text-center py-4 text-xs text-gray-400 dark:text-gray-500 flex items-center justify-center gap-4">
        <button
          onClick={() => setShowFeedback(true)}
          className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400 transition-colors"
        >
          Fehler melden
        </button>
        <button
          onClick={() => setDark(d => !d)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:border-indigo-300 dark:hover:border-indigo-600 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all text-xs font-medium shadow-sm"
          title={dark ? 'Hellmodus' : 'Dunkelmodus'}
        >
          {dark ? '☀️' : '🌙'}
          <span>{dark ? 'Hellmodus' : 'Dunkelmodus'}</span>
        </button>
      </footer>
      {showFeedback && (
        <FeedbackModal
          subject="Fehler auf der Vokabel-Website"
          body={`Hallo,\n\nich habe einen Fehler gefunden:\n\n[Bitte hier beschreiben]\n\nViele Grüße`}
          onClose={() => setShowFeedback(false)}
        />
      )}
    </div>
  );
}
