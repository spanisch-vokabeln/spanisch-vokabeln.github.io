// localStorage wrappers that never throw (private mode, blocked storage, quota exceeded)

export function storageGet(key, fallback = null) {
  try {
    const v = localStorage.getItem(key);
    return v === null ? fallback : v;
  } catch { return fallback; }
}

export function storageSet(key, value) {
  try { localStorage.setItem(key, String(value)); return true; } catch { return false; }
}

export function storageRemove(key) {
  try { localStorage.removeItem(key); } catch { /* ignore */ }
}

export function storageKeys() {
  try {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) keys.push(localStorage.key(i));
    return keys.filter(Boolean);
  } catch { return []; }
}

export function storageGetJSON(key, fallback) {
  const raw = storageGet(key);
  if (raw === null) return fallback;
  try { return JSON.parse(raw); } catch { return fallback; }
}

export function storageSetJSON(key, value) {
  try { return storageSet(key, JSON.stringify(value)); } catch { return false; }
}
