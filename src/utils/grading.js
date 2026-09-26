// Einziger Notenschlüssel der App: Test-Setup, Ergebnis-Note und Druck nutzen ihn.
// `min` = Mindestanteil in Prozent für diese Note.
export const GRADE_SCALE = [
  { note: 1, label: 'Sehr gut',     min: 96 },
  { note: 2, label: 'Gut',          min: 81 },
  { note: 3, label: 'Befriedigend', min: 66 },
  { note: 4, label: 'Ausreichend',  min: 51 },
  { note: 5, label: 'Mangelhaft',   min: 26 },
  { note: 6, label: 'Ungenügend',   min: 0 },
];

// Note aus einem (ungerundeten) Prozentwert.
export function getGrade(pct) {
  return GRADE_SCALE.find(g => pct >= g.min) ?? GRADE_SCALE[GRADE_SCALE.length - 1];
}

// Note aus Punkten; rechnet ohne Rundung, damit Anzeige und Druck übereinstimmen.
export function getGradeForPoints(points, total) {
  return getGrade(total > 0 ? (points / total) * 100 : 0);
}

// Punktebereiche pro Note für `total` Punkte. Noten, die bei dieser Punktzahl
// nicht erreichbar sind, bekommen `von`/`bis` = null.
export function getPointRanges(total) {
  const ranges = GRADE_SCALE.map(g => ({ note: g.note, label: g.label, von: null, bis: null }));
  for (let p = 0; p <= total; p++) {
    const r = ranges.find(x => x.note === getGradeForPoints(p, total).note);
    if (r.von === null) r.von = p;
    r.bis = p;
  }
  return ranges;
}
