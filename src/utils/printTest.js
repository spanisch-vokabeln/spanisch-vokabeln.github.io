export function generatePrintTest({ words, direction, gradeLabel, withAnswers = false }) {
  const pts = words.length;
  const scale = [
    { note: 1, von: Math.round(pts * 0.90), bis: pts },
    { note: 2, von: Math.round(pts * 0.75), bis: Math.round(pts * 0.90) - 1 },
    { note: 3, von: Math.round(pts * 0.60), bis: Math.round(pts * 0.75) - 1 },
    { note: 4, von: Math.round(pts * 0.45), bis: Math.round(pts * 0.60) - 1 },
    { note: 5, von: Math.round(pts * 0.20), bis: Math.round(pts * 0.45) - 1 },
    { note: 6, von: 0,                      bis: Math.round(pts * 0.20) - 1 },
  ];

  const title = `Vokabeltest Spanisch — ${gradeLabel}`;

  const dirLabel = direction === 'es2de' ? 'Spanisch → Deutsch'
                 : direction === 'de2es' ? 'Deutsch → Spanisch'
                 : 'Gemischt (Spanisch ↔ Deutsch)';

  const rows = words.map((w, i) => {
    const dir = w.dir || (direction === 'mix' ? 'es2de' : direction);
    const question = dir === 'es2de' ? w.es : w.de;
    const answer   = dir === 'es2de' ? w.de : w.es;
    const qLang    = dir === 'es2de' ? 'Spanisch' : 'Deutsch';
    const aLang    = dir === 'es2de' ? 'Deutsch'  : 'Spanisch';
    return `<tr>
      <td class="num">${i + 1}.</td>
      <td class="qlang">${qLang}</td>
      <td class="q">${question}</td>
      <td class="alang">${aLang}</td>
      <td class="a">${withAnswers ? `<span class="sol">${answer}</span>` : ''}</td>
      <td class="pt">/ 1</td>
    </tr>`;
  }).join('');

  const scaleHTML = scale.map(s =>
    `<span class="sn"><b>${s.note}</b> = ${s.von}–${s.bis} P.</span>`
  ).join('');

  const answerPage = withAnswers ? '' : `
    <div style="page-break-after:always"></div>
    <div class="answer-header">
      <h2>✅ Lösungsblatt</h2>
      <p class="sub">${title} · Nur für Lehrkräfte</p>
    </div>
    <table class="test-table">
      <thead><tr><th></th><th></th><th>Frage</th><th></th><th>Lösung</th><th></th></tr></thead>
      <tbody>${words.map((w, i) => {
        const dir = w.dir || (direction === 'mix' ? 'es2de' : direction);
        const q = dir === 'es2de' ? w.es : w.de;
        const a = dir === 'es2de' ? w.de : w.es;
        const ql = dir === 'es2de' ? 'ES' : 'DE';
        const al = dir === 'es2de' ? 'DE' : 'ES';
        return `<tr><td class="num">${i+1}.</td><td class="qlang">${ql}</td><td class="q">${q}</td><td class="alang">${al}</td><td class="a sol">${a}</td><td class="pt">/ 1</td></tr>`;
      }).join('')}</tbody>
    </table>`;

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:Arial,sans-serif;font-size:12pt;color:#111;padding:18mm 16mm}
    .print-btn{position:fixed;top:12px;right:12px;padding:8px 18px;background:#4f46e5;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:12pt;z-index:999}
    .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:5mm}
    .header-left h1{font-size:15pt;font-weight:900}
    .header-left .sub{font-size:9pt;color:#666;margin-top:1mm}
    .score-box{border:2px solid #111;padding:3mm 5mm;text-align:center;min-width:34mm}
    .score-box .label{font-size:8pt;color:#555}
    .score-line{display:flex;align-items:center;gap:2mm;margin-top:1.5mm}
    .score-line .field{border-bottom:1.5px solid #111;min-width:20mm;display:inline-block}
    .score-line .slash{color:#999}
    .note-row{margin-top:2mm;font-size:9pt}
    .note-row .nfield{border-bottom:1.5px solid #111;min-width:12mm;display:inline-block;margin-left:1mm}
    .info-line{display:flex;gap:6mm;border-top:1px solid #ccc;border-bottom:1px solid #ccc;padding:2.5mm 0;margin-bottom:5mm;font-size:10pt;flex-wrap:wrap}
    .info-line .fl{color:#555;margin-right:1mm}
    .ul{display:inline-block;border-bottom:1px solid #333;min-width:52mm}
    .ul-sm{min-width:22mm}
    .dir-note{font-size:9pt;color:#444;margin-bottom:3mm;font-style:italic}
    .test-table{width:100%;border-collapse:collapse;margin-bottom:5mm}
    .test-table thead th{font-size:8pt;color:#777;text-align:left;padding:1mm 2mm;border-bottom:1.5px solid #333}
    .test-table tbody tr{border-bottom:1px solid #e0e0e0}
    .test-table tbody tr:nth-child(even){background:#f9f9f9}
    .num{width:7mm;padding:2.5mm 1mm;color:#888;font-size:9pt;vertical-align:middle}
    .qlang{width:14mm;font-size:7.5pt;color:#999;padding:2.5mm 1mm;vertical-align:middle;text-transform:uppercase;letter-spacing:.5px}
    .alang{width:14mm;font-size:7.5pt;color:#999;padding:2.5mm 1mm;vertical-align:middle;text-transform:uppercase;letter-spacing:.5px}
    .q{width:55mm;padding:2.5mm 2mm;font-weight:700;vertical-align:middle}
    .a{padding:2.5mm 2mm;vertical-align:middle;border-bottom:1px solid #bbb;min-width:55mm}
    .pt{width:12mm;text-align:right;padding:2.5mm 1mm;color:#aaa;font-size:9pt;vertical-align:middle}
    .sol{color:#1a6b2c;font-weight:600}
    .scale{border-top:1.5px solid #333;padding-top:2.5mm;font-size:9pt;display:flex;gap:3mm;flex-wrap:wrap;align-items:center}
    .scale .slabel{color:#555;font-weight:700}
    .sn{background:#f0f0f0;padding:1mm 2mm;border-radius:3px}
    .answer-header{margin-bottom:4mm;border-bottom:2px dashed #333;padding-bottom:2.5mm}
    .answer-header h2{font-size:13pt}
    .answer-header .sub{font-size:9pt;color:#888;margin-top:1mm}
    @media print{.print-btn{display:none}body{padding:14mm 13mm}}
  </style>
</head>
<body>
  <button class="print-btn" onclick="window.print()">🖨️ Drucken / Als PDF</button>

  <div class="header">
    <div class="header-left">
      <h1>🇪🇸 ${title}</h1>
      <div class="sub">${dirLabel} · ${pts} Punkte</div>
    </div>
    <div class="score-box">
      <div class="label">Punkte</div>
      <div class="score-line">
        <span class="field">&nbsp;</span>
        <span class="slash">/</span>
        <span>${pts}</span>
      </div>
      <div class="note-row">Note: <span class="nfield">&nbsp;</span></div>
    </div>
  </div>

  <div class="info-line">
    <span><span class="fl">Name:</span><span class="ul">&nbsp;</span></span>
    <span><span class="fl">Klasse:</span><span class="ul ul-sm">&nbsp;</span></span>
    <span><span class="fl">Datum:</span><span class="ul ul-sm">&nbsp;</span></span>
  </div>

  <div class="dir-note">
    Aufgabe: Trage die fehlende Übersetzung in die leere Spalte ein. (1 Punkt pro Wort)
  </div>

  <table class="test-table">
    <thead><tr><th></th><th></th><th>Wort</th><th></th><th>Übersetzung</th><th>Pkt.</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>

  <div class="scale">
    <span class="slabel">Notenschlüssel:</span>
    ${scaleHTML}
  </div>

  ${answerPage}
</body>
</html>`;
}
