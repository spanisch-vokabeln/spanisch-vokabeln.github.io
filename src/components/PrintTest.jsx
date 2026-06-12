import React, { useState } from 'react';
import { buildWordPool } from '../data/vocab';
import { sortByDifficulty } from '../utils/progress';

const COUNTS = [10, 15, 20, 25, 30];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateHTML({ words, direction, title, withAnswers }) {
  const pts = words.length;
  const scale = [
    { note: 1, von: Math.round(pts * 0.90), bis: pts },
    { note: 2, von: Math.round(pts * 0.75), bis: Math.round(pts * 0.90) - 1 },
    { note: 3, von: Math.round(pts * 0.60), bis: Math.round(pts * 0.75) - 1 },
    { note: 4, von: Math.round(pts * 0.45), bis: Math.round(pts * 0.60) - 1 },
    { note: 5, von: Math.round(pts * 0.20), bis: Math.round(pts * 0.45) - 1 },
    { note: 6, von: 0,                      bis: Math.round(pts * 0.20) - 1 },
  ];

  const rows = words.map((w, i) => {
    const question = direction === 'es-de' ? w.es : w.de;
    const answer   = direction === 'es-de' ? w.de : w.es;
    return `<tr>
      <td class="num">${i + 1}.</td>
      <td class="q">${question}</td>
      <td class="a">${withAnswers ? `<span class="sol">${answer}</span>` : ''}</td>
      <td class="pt">/ 1</td>
    </tr>`;
  }).join('');

  const scaleHTML = scale.map(s =>
    `<span class="sn"><b>${s.note}</b> = ${s.von}–${s.bis} P.</span>`
  ).join('');

  const answerPage = withAnswers ? '' : `
    <div class="page-break"></div>
    <div class="answer-header">
      <h2>✅ Lösungsblatt — ${title}</h2>
      <p class="sub">Nur für Lehrkräfte</p>
    </div>
    <table class="test-table">
      <thead><tr><th>Nr.</th><th>Frage</th><th>Lösung</th><th></th></tr></thead>
      <tbody>
        ${words.map((w, i) => {
          const q = direction === 'es-de' ? w.es : w.de;
          const a = direction === 'es-de' ? w.de : w.es;
          return `<tr><td class="num">${i + 1}.</td><td class="q">${q}</td><td class="a sol">${a}</td><td class="pt">/ 1</td></tr>`;
        }).join('')}
      </tbody>
    </table>`;

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 12pt; color: #111; padding: 20mm 18mm; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6mm; }
    .header-left h1 { font-size: 16pt; font-weight: 900; letter-spacing: -0.5px; }
    .header-left .sub { font-size: 9pt; color: #666; margin-top: 1mm; }
    .score-box { border: 2px solid #111; padding: 4mm 6mm; text-align: center; min-width: 36mm; }
    .score-box .label { font-size: 8pt; color: #555; }
    .score-box .field { font-size: 15pt; font-weight: 700; border-bottom: 1.5px solid #111; width: 24mm; display: inline-block; margin-top: 1mm; }
    .score-box .note-row { margin-top: 2mm; font-size: 8pt; }
    .info-line { display: flex; gap: 8mm; border-top: 1px solid #ccc; border-bottom: 1px solid #ccc; padding: 3mm 0; margin-bottom: 6mm; font-size: 10pt; }
    .info-line .field-label { color: #555; margin-right: 2mm; }
    .info-line .underline { display: inline-block; border-bottom: 1px solid #333; min-width: 50mm; }
    .info-line .underline-sm { min-width: 20mm; }
    .direction-note { font-size: 9pt; color: #444; margin-bottom: 4mm; font-style: italic; }
    .test-table { width: 100%; border-collapse: collapse; margin-bottom: 6mm; }
    .test-table thead th { font-size: 9pt; color: #555; text-align: left; padding: 1mm 2mm; border-bottom: 1.5px solid #333; }
    .test-table tbody tr { border-bottom: 1px solid #ddd; }
    .test-table tbody tr:nth-child(even) { background: #f9f9f9; }
    .num { width: 8mm; padding: 2.5mm 2mm; color: #666; font-size: 9pt; vertical-align: middle; }
    .q   { width: 60mm; padding: 2.5mm 3mm; font-weight: 700; vertical-align: middle; }
    .a   { padding: 2.5mm 3mm; vertical-align: middle; border-bottom: 1px solid #aaa; min-width: 70mm; }
    .pt  { width: 14mm; text-align: right; padding: 2.5mm 2mm; color: #888; font-size: 9pt; vertical-align: middle; }
    .sol { color: #1a6b2c; font-weight: 600; }
    .scale { border-top: 1.5px solid #333; padding-top: 3mm; font-size: 9pt; display: flex; gap: 4mm; flex-wrap: wrap; }
    .scale .label { color: #555; font-weight: 700; margin-right: 1mm; }
    .sn { background: #f0f0f0; padding: 1mm 2.5mm; border-radius: 3px; }
    .print-btn { position: fixed; top: 12px; right: 12px; padding: 8px 18px; background: #4f46e5; color: #fff; border: none; border-radius: 8px; cursor: pointer; font-size: 12pt; z-index: 999; }
    .page-break { page-break-after: always; }
    .answer-header { margin-bottom: 5mm; border-bottom: 2px dashed #333; padding-bottom: 3mm; }
    .answer-header h2 { font-size: 13pt; }
    .answer-header .sub { font-size: 9pt; color: #888; margin-top: 1mm; }
    @media print { .print-btn { display: none; } body { padding: 15mm 14mm; } }
  </style>
</head>
<body>
  <button class="print-btn" onclick="window.print()">🖨️ Drucken / Als PDF</button>

  <div class="header">
    <div class="header-left">
      <h1>🇪🇸 ${title}</h1>
      <div class="sub">${direction === 'es-de' ? 'Spanisch → Deutsch' : 'Deutsch → Spanisch'} · ${pts} Punkte</div>
    </div>
    <div class="score-box">
      <div class="label">Punkte</div>
      <div class="field">&nbsp;</div>
      <div class="note-row">Note: <span class="field" style="min-width:12mm">&nbsp;</span></div>
    </div>
  </div>

  <div class="info-line">
    <span><span class="field-label">Name:</span><span class="underline">&nbsp;</span></span>
    <span><span class="field-label">Klasse:</span><span class="underline underline-sm">&nbsp;</span></span>
    <span><span class="field-label">Datum:</span><span class="underline underline-sm">&nbsp;</span></span>
  </div>

  <div class="direction-note">
    Aufgabe: Schreibe die ${direction === 'es-de' ? 'deutsche Übersetzung' : 'spanische Übersetzung'} in die leere Spalte.
  </div>

  <table class="test-table">
    <thead>
      <tr>
        <th></th>
        <th>${direction === 'es-de' ? 'Spanisch' : 'Deutsch'}</th>
        <th>${direction === 'es-de' ? 'Deutsch' : 'Spanisch'}</th>
        <th>Pkt.</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <div class="scale">
    <span class="label">Notenschlüssel:</span>
    ${scaleHTML}
  </div>

  ${answerPage}
</body>
</html>`;
}

export default function PrintTest({ selectedGrades, onBack }) {
  const [count, setCount]       = useState(20);
  const [direction, setDirection] = useState('es-de');
  const [selection, setSelection] = useState('random');
  const [withAnswers, setWithAnswers] = useState(false);

  const allWords = buildWordPool(selectedGrades.length ? selectedGrades : []);
  const canGenerate = allWords.length > 0;

  const handleGenerate = () => {
    let pool = [...allWords];
    if (selection === 'hard') {
      pool = sortByDifficulty(pool);
    } else {
      pool = shuffle(pool);
    }
    const words = pool.slice(0, Math.min(count, pool.length));

    const gradeLabel = selectedGrades.length === 1
      ? `Klasse ${selectedGrades[0]}`
      : selectedGrades.length > 1
        ? `Klasse ${selectedGrades.sort((a,b)=>a-b).join('/')}`
        : 'Alle Klassen';

    const html = generateHTML({
      words,
      direction,
      title: `Vokabeltest Spanisch — ${gradeLabel}`,
      withAnswers,
    });

    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(html);
    win.document.close();
  };

  return (
    <div className="animate-slide-up space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <button onClick={onBack}
          className="px-4 py-2.5 bg-rose-100 hover:bg-rose-200 active:scale-95 text-rose-700 font-semibold text-sm rounded-xl transition-all">
          ← Zurück
        </button>
        <h2 className="text-xl font-extrabold text-gray-800 dark:text-gray-100 flex-1">Klassentest erstellen</h2>
      </div>

      {/* Preview card */}
      <div className="card border-2 border-dashed border-indigo-200 dark:border-indigo-800 text-center py-8">
        <div className="text-5xl mb-3">📄</div>
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Druckfertiger Vokabeltest</p>
        <p className="text-xs text-gray-400 mt-1">Namenszeile · Punkte­feld · Notenschlüssel · optional Lösungsblatt</p>
      </div>

      {/* Config */}
      <div className="card space-y-5">
        {/* Anzahl */}
        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">
            Anzahl Wörter
          </label>
          <div className="flex gap-2 flex-wrap">
            {COUNTS.map(n => (
              <button key={n} onClick={() => setCount(n)}
                className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all ${
                  count === n
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:border-indigo-300'
                }`}>
                {n}
              </button>
            ))}
          </div>
          {allWords.length < count && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
              Nur {allWords.length} Wörter verfügbar — es werden alle verwendet.
            </p>
          )}
        </div>

        {/* Richtung */}
        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">
            Übersetzungsrichtung
          </label>
          <div className="flex gap-2">
            {[
              { val: 'es-de', label: '🇪🇸 → 🇩🇪', desc: 'Spanisch übersetzen' },
              { val: 'de-es', label: '🇩🇪 → 🇪🇸', desc: 'Deutsch übersetzen' },
            ].map(opt => (
              <button key={opt.val} onClick={() => setDirection(opt.val)}
                className={`flex-1 px-3 py-3 rounded-xl text-sm border-2 transition-all text-center ${
                  direction === opt.val
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:border-indigo-300'
                }`}>
                <div className="font-bold">{opt.label}</div>
                <div className="text-xs mt-0.5 opacity-70">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Auswahl */}
        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">
            Wortauswahl
          </label>
          <div className="flex gap-2">
            {[
              { val: 'random', label: '🎲 Zufällig',        desc: 'Gemischte Auswahl' },
              { val: 'hard',   label: '🔥 Schwierigste',    desc: 'Laut Lernfortschritt' },
            ].map(opt => (
              <button key={opt.val} onClick={() => setSelection(opt.val)}
                className={`flex-1 px-3 py-3 rounded-xl text-sm border-2 transition-all text-center ${
                  selection === opt.val
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:border-indigo-300'
                }`}>
                <div className="font-bold">{opt.label}</div>
                <div className="text-xs mt-0.5 opacity-70">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Lösungsblatt */}
        <button
          onClick={() => setWithAnswers(v => !v)}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left ${
            withAnswers
              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950'
              : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-emerald-300'
          }`}>
          <span className="text-xl">{withAnswers ? '✅' : '⬜'}</span>
          <div>
            <div className={`text-sm font-bold ${withAnswers ? 'text-emerald-700 dark:text-emerald-300' : 'text-gray-700 dark:text-gray-300'}`}>
              Lösungen direkt eintragen
            </div>
            <div className="text-xs text-gray-400 mt-0.5">
              {withAnswers ? 'Lösungen werden im Test eingedruckt (z.B. für Selbstkontrolle)' : 'Zweites Blatt mit Lösungen wird automatisch angehängt'}
            </div>
          </div>
        </button>
      </div>

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        disabled={!canGenerate}
        className={`w-full btn btn-primary text-base ${!canGenerate ? 'opacity-50 cursor-not-allowed' : ''}`}>
        🖨️ Test generieren &amp; drucken
      </button>
      {!canGenerate && (
        <p className="text-center text-xs text-gray-400">Bitte zuerst eine Klassenstufe auf der Startseite auswählen.</p>
      )}
    </div>
  );
}
