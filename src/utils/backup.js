export function exportData() {
  const result = { version: 1, date: new Date().toISOString() };
  const prog = localStorage.getItem('vocab_progress');
  const mistakes = localStorage.getItem('vocab_mistakes');
  if (prog) result.vocab_progress = JSON.parse(prog);
  if (mistakes) result.vocab_mistakes = JSON.parse(mistakes);
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k?.startsWith('gm_')) result[k] = localStorage.getItem(k);
  }
  return result;
}

export function importData(obj) {
  if (!obj?.version) throw new Error('Ungültige Datei');
  if (obj.vocab_progress) localStorage.setItem('vocab_progress', JSON.stringify(obj.vocab_progress));
  else localStorage.removeItem('vocab_progress');
  if (obj.vocab_mistakes) localStorage.setItem('vocab_mistakes', JSON.stringify(obj.vocab_mistakes));
  else localStorage.removeItem('vocab_mistakes');
  Object.entries(obj).forEach(([k, v]) => {
    if (k.startsWith('gm_')) localStorage.setItem(k, typeof v === 'string' ? v : String(v));
  });
}

export function getProgressSummary() {
  try {
    const prog = JSON.parse(localStorage.getItem('vocab_progress') || '{}');
    const entries = Object.values(prog);
    if (!entries.length) return null;
    let good = 0, medium = 0, hard = 0;
    entries.forEach(({ correct = 0, incorrect = 0 }) => {
      const total = correct + incorrect;
      if (!total) return;
      const ratio = correct / total;
      if (ratio >= 0.8 && correct >= 3) good++;
      else if (ratio >= 0.5) medium++;
      else hard++;
    });
    return { total: entries.length, good, medium, hard };
  } catch { return null; }
}

export function downloadProgress() {
  const data = exportData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `español-lernstand-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
