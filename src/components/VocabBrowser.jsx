import React, { useState, useMemo } from 'react';
import { vocabByGrade } from '../data/vocab';
import { speak, ttsSupported } from '../utils/speech';
import { getProgress, getWordStatus } from '../utils/progress';
import FeedbackModal from './FeedbackModal';
import FloatingBack from './FloatingBack';
import BackButton from './BackButton';
import { escapeHtml, openPrintWindow, POPUP_BLOCKED_MSG } from '../utils/printTest';

const ALL_TAB = 'all';
const STATUS_COLOR = { new: '#d1d5db', good: '#22c55e', medium: '#f59e0b', hard: '#ef4444' };
const STATUS_LABEL = { new: 'Noch nie geübt', good: 'Gut gelernt', medium: 'Mittelmäßig', hard: 'Schwierig' };
const STATUS_SHORT = { new: 'Neu', good: 'Gut', medium: 'Mittel', hard: 'Schwer' };

// Search ignores case and accents: "espanol" finds "español", "cafe" finds "café"
const searchKey = (s) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

export default function VocabBrowser({ selectedGrades, onBack }) {
  const initialTab = selectedGrades.length > 1 ? ALL_TAB : selectedGrades[0];
  const [activeTab, setActiveTab] = useState(initialTab);
  const [search, setSearch]       = useState('');
  const [flipped, setFlipped]     = useState({});
  const [showDE, setShowDE]       = useState(false);
  const [groupByUnidad, setGroupByUnidad] = useState(false);
  const [reportWord, setReportWord] = useState(null);
  const [printError, setPrintError] = useState(false);
  // Read the progress once instead of once per word card
  const progress = useMemo(() => getProgress(), []);

  const isAllTab = activeTab === ALL_TAB;

  const rawTopics = isAllTab
    ? selectedGrades.flatMap(g =>
        vocabByGrade[g].topics.map(t => ({
          ...t,
          name: `${vocabByGrade[g].short}: ${t.name}`,
          color: vocabByGrade[g].color,
          grade: g,
        }))
      )
    : vocabByGrade[activeTab].topics.map(t => ({
        ...t,
        color: vocabByGrade[activeTab].color,
        grade: activeTab,
      }));

  const hasUnidades = rawTopics.some(t => t.unidad);

  // When groupByUnidad is active, merge all topics with the same unidad key
  const topics = (groupByUnidad && hasUnidades)
    ? (() => {
        const map = new Map();
        for (const t of rawTopics) {
          const key = t.unidad ?? t.name;
          if (!map.has(key)) map.set(key, { name: key, unidad: key, color: t.color, words: [] });
          map.get(key).words.push(...t.words);
        }
        return [...map.values()];
      })()
    : rawTopics;

  const allWords = topics.flatMap((t, ti) =>
    t.words.map((w, wi) => ({ ...w, topicIdx: ti, wordIdx: wi, id: `${ti}-${wi}`, color: t.color }))
  );

  const query = searchKey(search.trim());
  const filtered = query
    ? allWords.filter(w => searchKey(w.es).includes(query) || searchKey(w.de).includes(query))
    : null;

  const switchTab = (tab) => { setActiveTab(tab); setSearch(''); setFlipped({}); setGroupByUnidad(false); };

  const handlePrint = () => {
    // Bei aktiver Suche nur die Treffer drucken, gruppiert nach Thema
    const printTopics = filtered
      ? topics
          .map((t, ti) => ({ name: t.name, words: filtered.filter(w => w.topicIdx === ti) }))
          .filter(t => t.words.length > 0)
      : topics;
    const wordCount = printTopics.reduce((n, t) => n + t.words.length, 0);
    const wordsLabel = `${wordCount} ${wordCount === 1 ? 'Wort' : 'Wörter'}`;
    const meta = filtered
      ? `Suchtreffer für „${escapeHtml(search.trim())}“ · ${wordsLabel}`
      : `${printTopics.length} Themen · ${wordsLabel}`;
    const rows = printTopics.map(t =>
      `<div class="topic">
        <h3>${escapeHtml(t.name)}</h3>
        <table>${t.words.map(w =>
          `<tr><td class="es">${escapeHtml(w.es)}</td><td class="de">${escapeHtml(w.de)}</td></tr>`
        ).join('')}</table>
      </div>`
    ).join('');
    const html = `<!DOCTYPE html><html><head>
      <meta charset="utf-8"><title>Español Vokabeln</title>
      <style>
        body{font-family:Arial,sans-serif;padding:24px;max-width:820px;margin:0 auto}
        h1{color:#4f46e5;font-size:20px;margin:0 0 4px}
        .meta{color:#6b7280;font-size:13px;margin:0 0 16px}
        .print-btn{margin-bottom:20px;padding:8px 18px;background:#4f46e5;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:13px}
        .topic{margin-bottom:20px;page-break-inside:avoid}
        h3{color:#4f46e5;font-size:11px;text-transform:uppercase;letter-spacing:1px;border-bottom:2px solid #e5e7eb;padding-bottom:4px;margin:0 0 6px}
        table{width:100%;border-collapse:collapse}
        td{padding:4px 8px;border-bottom:1px solid #f3f4f6;font-size:13px}
        td.es{font-weight:700;width:50%}
        @media print{.print-btn{display:none}}
      </style>
    </head><body>
      <h1>🇪🇸 Español Vokabeln</h1>
      <p class="meta">${meta}</p>
      <button class="print-btn" onclick="window.print()">🖨️ Drucken / Als PDF speichern</button>
      ${rows}
    </body></html>`;
    setPrintError(!openPrintWindow(html));
  };

  return (
    <>
      <FloatingBack onClick={onBack} />

      {/* Header */}
      <div className="flex items-center gap-2">
        <BackButton onClick={onBack} compact />
        <h2 className="text-xl font-extrabold text-gray-800 dark:text-gray-100 flex-1 min-w-0 truncate max-[399px]:sr-only">Vokabeln</h2>
        <span className="flex-1 min-[400px]:hidden" aria-hidden="true" />
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={handlePrint}
            className="w-9 h-9 flex items-center justify-center border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl text-sm transition-all"
            title={filtered ? `${filtered.length} Suchtreffer drucken / PDF` : 'Alle angezeigten Wörter drucken / PDF'}
            aria-label={filtered ? `${filtered.length} Suchtreffer drucken` : 'Angezeigte Wörter drucken'}>
            🖨️
          </button>
          {hasUnidades && (
            <button
              onClick={() => { setGroupByUnidad(v => !v); setFlipped({}); }}
              aria-pressed={groupByUnidad}
              className={`text-xs font-bold px-2.5 py-2 rounded-xl border transition-all ${groupByUnidad ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700'}`}
              title={groupByUnidad ? 'Wieder nach Abschnitten (Bloques) anzeigen' : 'Abschnitte einer Unidad zusammenfassen'}
            >
              {groupByUnidad ? 'Unidad ✓' : 'Unidad'}
            </button>
          )}
          <button
            onClick={() => setShowDE(v => !v)}
            aria-pressed={showDE}
            title={showDE ? 'Deutsche Übersetzungen ausblenden' : 'Alle deutschen Übersetzungen zeigen'}
            className={`text-xs font-bold px-2.5 py-2 rounded-xl border transition-all ${showDE ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700'}`}
          >
            {showDE ? 'DE ✓' : 'DE ?'}
          </button>
        </div>
      </div>

      {printError && (
        <p role="alert" className="mt-3 text-sm text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950 rounded-xl p-3">
          {POPUP_BLOCKED_MSG}
        </p>
      )}

      <div className="animate-slide-up space-y-4 mt-4">
      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {selectedGrades.length > 1 && (
          <button
            onClick={() => switchTab(ALL_TAB)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              isAllTab ? 'text-white shadow-md' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-indigo-300'
            }`}
            style={isAllTab ? { background: 'linear-gradient(135deg,#4f46e5,#7c3aed)' } : {}}
          >
            Alle
          </button>
        )}
        {selectedGrades.map(g => (
          <button key={g} onClick={() => switchTab(g)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              activeTab === g ? 'text-white shadow-md' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-indigo-300'
            }`}
            style={activeTab === g ? { background: vocabByGrade[g].color } : {}}
          >
            {vocabByGrade[g].short}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Wort suchen (ES oder DE)…"
          className="w-full pl-9 pr-4 py-2.5 border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 placeholder:text-gray-400 rounded-xl focus:border-indigo-400 focus:outline-none text-base"
        />
        {search && (
          <button onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none">
            ×
          </button>
        )}
      </div>

      {/* Stats row */}
      <div className="space-y-1.5">
        <div className="text-xs text-gray-400 font-medium">
          {filtered ? `${filtered.length} Treffer` : `${allWords.length} Wörter · ${topics.length} Themen`}
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-400 font-medium">
          {Object.entries(STATUS_COLOR).map(([k, c]) => (
            <span key={k} className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0" style={{ background: c }} />
              <span>{STATUS_SHORT[k]}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Words */}
      {filtered ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {filtered.map(w => (
            <WordCard key={w.id} word={w} showDE={showDE}
              flipped={flipped[w.id]}
              onFlip={() => setFlipped(prev => ({ ...prev, [w.id]: !prev[w.id] }))}
              color={w.color}
              onReport={setReportWord}
              progress={progress}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-5">
          {topics.map((topic, ti) => (
            <div key={ti}>
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-2">
                <span className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
                <span style={{ color: topic.color }}>{topic.name}</span>
                <span className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {topic.words.map((w, wi) => {
                  const id = `${ti}-${wi}`;
                  return (
                    <WordCard key={id} word={w} showDE={showDE}
                      flipped={flipped[id]}
                      onFlip={() => setFlipped(prev => ({ ...prev, [id]: !prev[id] }))}
                      color={topic.color}
                      onReport={setReportWord}
                      progress={progress}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
      {reportWord && (
        <FeedbackModal
          subject={`Vokabel-Fehler: ${reportWord.es}`}
          body={`Hallo,\n\nich habe einen Fehler bei dieser Vokabel gefunden:\n\nSpanisch: ${reportWord.es}\nDeutsch: ${reportWord.de}\n\nRichtig wäre:\n\nViele Grüße`}
          onClose={() => setReportWord(null)}
        />
      )}
      </div>
    </>
  );
}

function WordCard({ word, showDE, flipped, onFlip, color, onReport, progress }) {
  const revealed = showDE || flipped;
  const status   = getWordStatus(word, progress);
  const dot      = STATUS_COLOR[status];

  return (
    <div className="bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-xl shadow-sm hover:border-indigo-200 dark:hover:border-indigo-500 transition-all flex flex-col"
      style={{ borderLeftColor: color, borderLeftWidth: 3 }}>
      <button type="button" onClick={onFlip} aria-expanded={!!revealed}
        className="text-left p-3 w-full active:scale-95 transition-transform flex-1 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400">
        <span className="flex items-start gap-1">
          <span className="text-sm font-bold text-gray-800 dark:text-gray-100 leading-tight flex-1 pr-1">{word.es}</span>
          <span className="w-2 h-2 rounded-full flex-shrink-0 mt-1" style={{ background: dot }}
            title={STATUS_LABEL[status]} />
          <span className="sr-only">({STATUS_LABEL[status]})</span>
        </span>
        {revealed
          ? <span className="block text-xs text-gray-500 dark:text-gray-300 mt-1 leading-tight">{word.de}</span>
          : <span className="block text-xs text-gray-400 dark:text-gray-500 mt-1 select-none" aria-label="Übersetzung verdeckt">• • • • •</span>}
      </button>
      <div className="flex justify-end gap-1 px-1.5 pb-1.5">
        {ttsSupported && (
          <button
            onClick={() => speak(word.es, 'es-ES')}
            aria-label={`${word.es} aussprechen`}
            className="w-7 h-7 flex items-center justify-center rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 hover:border-indigo-300 active:scale-90 transition-all text-xs"
            title="Aussprache">
            🔊
          </button>
        )}
        <button
          onClick={() => onReport(word)}
          aria-label={`Fehler bei ${word.es} melden`}
          className="w-7 h-7 flex items-center justify-center rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:bg-rose-50 dark:hover:bg-rose-950 hover:border-rose-300 active:scale-90 transition-all text-xs"
          title="Fehler melden">
          🚩
        </button>
      </div>
    </div>
  );
}
