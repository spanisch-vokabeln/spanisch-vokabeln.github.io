import { getProgress, getMistakes, migrateProgress, replaceProgress, PROG_KEY, ERR_KEY } from './progress';
import { storageGet, storageSet, storageRemove, storageKeys, storageGetJSON, storageSetJSON } from './storage';

export { getProgressSummary } from './progress';

const BACKUP_VERSION = 2;
// Game records: arcade games (gm_*) and Bilderquiz per theme (bq_*)
const isRecordKey = (k) => k.startsWith('gm_') || k.startsWith('bq_');
const LEGACY_KEY = 'vocab_progress_legacy';

export function exportData() {
  const result = { version: BACKUP_VERSION, date: new Date().toISOString() };
  const prog = getProgress();
  const mistakes = getMistakes();
  if (Object.keys(prog).length) result[PROG_KEY] = prog;
  if (mistakes.length) result[ERR_KEY] = mistakes;
  const legacy = storageGetJSON(LEGACY_KEY, null);
  if (legacy && Object.keys(legacy).length) result[LEGACY_KEY] = legacy;
  storageKeys().filter(isRecordKey).forEach(k => { result[k] = storageGet(k); });
  return result;
}

const isPlainObject = (v) => !!v && typeof v === 'object' && !Array.isArray(v);

// Validates the whole file first, then writes. Throws with a readable message.
export function importData(obj) {
  if (!isPlainObject(obj) || !obj.version) throw new Error('Ungültige Datei');
  const prog = obj[PROG_KEY];
  const mistakes = obj[ERR_KEY];
  if (prog !== undefined && !isPlainObject(prog)) throw new Error('Lernstand hat ein ungültiges Format');
  if (mistakes !== undefined && !Array.isArray(mistakes)) throw new Error('Fehlerwörter haben ein ungültiges Format');
  if (mistakes?.some(w => !w || typeof w.es !== 'string' || typeof w.de !== 'string')) {
    throw new Error('Fehlerwörter haben ein ungültiges Format');
  }
  const records = Object.entries(obj).filter(([k, v]) => isRecordKey(k) && Number.isFinite(Number(v)));

  // Old backups (version 1) are keyed by the Spanish word only
  const { progress, legacy } = migrateProgress(prog ?? {});
  replaceProgress(progress);
  const allLegacy = { ...(isPlainObject(obj[LEGACY_KEY]) ? obj[LEGACY_KEY] : {}), ...legacy };
  Object.keys(allLegacy).length ? storageSetJSON(LEGACY_KEY, allLegacy) : storageRemove(LEGACY_KEY);
  mistakes?.length ? storageSetJSON(ERR_KEY, mistakes) : storageRemove(ERR_KEY);
  records.forEach(([k, v]) => storageSet(k, Number(v)));
}

export function downloadProgress() {
  const data = exportData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `espanol-lernstand-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoking right away can cancel the download in Safari/Firefox
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
