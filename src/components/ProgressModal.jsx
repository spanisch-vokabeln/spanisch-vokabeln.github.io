import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { downloadProgress, importData, getProgressSummary } from '../utils/backup';

export default function ProgressModal({ onClose }) {
  const [imported, setImported] = useState(false);
  const [error, setError] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  const fileRef = useRef();
  const summary = getProgressSummary();

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        importData(data);
        setImported(true);
        setError('');
        setTimeout(() => window.location.reload(), 1200);
      } catch {
        setError('Die Datei konnte nicht gelesen werden. Bitte wähle eine gültige Lernstand-Datei.');
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    localStorage.removeItem('vocab_progress');
    localStorage.removeItem('vocab_mistakes');
    window.location.reload();
  };

  return createPortal(
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 z-50"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-5 animate-slide-up">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-gray-800 dark:text-gray-100 text-lg">📊 Lernstand sichern</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl leading-none">×</button>
        </div>

        {/* Explanation */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-sm text-amber-800 space-y-1.5">
          <p className="font-semibold">⚠️ Dein Fortschritt ist nur auf diesem Gerät gespeichert.</p>
          <p>Wenn du den Browser-Verlauf löschst oder ein anderes Gerät benutzt, ist er weg.</p>
          <p>👉 Lade ihn als Datei herunter und sende sie dir z.B. per Mail oder speichere sie in deiner Cloud.</p>
        </div>

        {/* Current stats */}
        {summary ? (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 space-y-2">
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Dein aktueller Stand</p>
            <div className="flex gap-2 flex-wrap">
              <Stat color="#22c55e" label="Gut" value={summary.good} />
              <Stat color="#f59e0b" label="Mittel" value={summary.medium} />
              <Stat color="#ef4444" label="Schwierig" value={summary.hard} />
              <Stat color="#d1d5db" label="Gesamt geübt" value={summary.total} />
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center">Du hast noch keine Wörter geübt.</p>
        )}

        {/* Export */}
        <button
          onClick={downloadProgress}
          className="w-full btn btn-primary text-sm"
        >
          💾 Lernstand herunterladen
        </button>

        {/* Import */}
        <div className="space-y-2">
          <p className="text-xs text-gray-500 text-center">Gespeicherten Stand wiederherstellen:</p>
          <input
            ref={fileRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleFile}
          />
          {imported ? (
            <div className="w-full btn bg-emerald-100 text-emerald-700 text-sm text-center">
              ✓ Lernstand geladen – Seite wird neu geladen…
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full btn btn-outline text-sm"
            >
              📂 Datei laden
            </button>
          )}
          {error && <p className="text-xs text-red-500 text-center">{error}</p>}
        </div>

        {/* Reset */}
        <div className="pt-1 border-t border-gray-100">
          {confirmReset ? (
            <div className="flex gap-2">
              <p className="text-xs text-gray-500 flex-1">Wirklich alles löschen?</p>
              <button onClick={handleReset} className="text-xs text-red-500 font-semibold hover:underline">Ja, löschen</button>
              <button onClick={() => setConfirmReset(false)} className="text-xs text-gray-400 hover:underline">Abbrechen</button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmReset(true)}
              className="text-xs text-gray-300 hover:text-red-400 transition-colors w-full text-center"
            >
              Fortschritt zurücksetzen
            </button>
          )}
        </div>

      </div>
    </div>,
    document.body
  );
}

function Stat({ color, label, value }) {
  return (
    <div className="flex items-center gap-1.5 bg-white dark:bg-gray-700 rounded-lg px-2.5 py-1.5 border border-gray-100 dark:border-gray-600">
      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
      <span className="text-xs font-bold text-gray-700 dark:text-gray-200">{value}</span>
      <span className="text-xs text-gray-400 dark:text-gray-400">{label}</span>
    </div>
  );
}
