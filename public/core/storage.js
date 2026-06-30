// SSOT for every localStorage key and the small lists we persist (search
// history, recent roots). Nothing else in the app should touch localStorage
// directly — go through these helpers so keys live in exactly one place.

export const KEYS = {
  root: 'codeSearchRoot',
  lang: 'codeSearchLang',
  maxFiles: 'codeSearchMaxFiles',
  query: 'codeSearchQuery',
  settings: 'codeSearchSettings',
  history: 'codeSearchHistory',
  roots: 'codeSearchRecentRoots',
  dark: 'codeSearchDark',
  sidebarHidden: 'codeSearchSidebarHidden'
};

export function get(key, fallback = '') {
  return localStorage.getItem(key) ?? fallback;
}

export function set(key, value) {
  localStorage.setItem(key, value);
}

export function getJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (_) {
    return fallback;
  }
}

export function setJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// ─── Search history (most-recent-first, de-duplicated, capped) ───────────────
const MAX_HISTORY = 10;

export function getHistory() {
  const h = getJSON(KEYS.history, []);
  return Array.isArray(h) ? h : [];
}

export function pushHistory(query) {
  const h = getHistory().filter((q) => q !== query);
  h.unshift(query);
  setJSON(KEYS.history, h.slice(0, MAX_HISTORY));
}

// ─── Recent project roots (for the root <datalist>) ──────────────────────────
const MAX_ROOTS = 5;

export function getRecentRoots() {
  const r = getJSON(KEYS.roots, []);
  return Array.isArray(r) ? r : [];
}

export function pushRecentRoot(root) {
  if (!root || !root.trim()) return;
  const roots = getRecentRoots().filter((r) => r !== root);
  roots.unshift(root);
  setJSON(KEYS.roots, roots.slice(0, MAX_ROOTS));
}
