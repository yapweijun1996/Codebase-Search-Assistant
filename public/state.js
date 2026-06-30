// The app's single store plus the only functions allowed to mutate shared
// state. Cross-cutting state (language, theme, sidebar, health, search
// settings, request-busy flags) lives here; DOM-local concerns (input text,
// checkbox state, result nodes) stay inside their component.

import { createStore } from './core/store.js';
import * as storage from './core/storage.js';
import { $, $$ } from './core/dom.js';

const SETTINGS_DEFAULTS = { timeoutMs: 12000, maxResults: 300, maxFilesize: '1M' };

function loadSettings() {
  const stored = storage.getJSON(storage.KEYS.settings, {});
  return { ...SETTINGS_DEFAULTS, ...(stored && typeof stored === 'object' ? stored : {}) };
}

const isMobileInit = window.matchMedia('(max-width: 860px)').matches;

const initialState = {
  language: storage.get(storage.KEYS.lang, 'en'),
  dark: storage.get(storage.KEYS.dark) === '1',
  sidebarHidden: isMobileInit ? true : storage.get(storage.KEYS.sidebarHidden) === '1',
  root: storage.get(storage.KEYS.root, ''),
  health: { phase: 'checking', rgVersion: null }, // checking | good | bad | offline
  settings: loadSettings(),
  busy: { search: false, impact: false, git: false }
};

export const store = createStore(initialState);
export { SETTINGS_DEFAULTS };

export const actions = {
  setLanguage(language) {
    store.set({ language });
    storage.set(storage.KEYS.lang, language);
  },
  toggleDark() {
    const dark = !store.get().dark;
    store.set({ dark });
    storage.set(storage.KEYS.dark, dark ? '1' : '0');
  },
  setSidebarHidden(sidebarHidden) {
    store.set({ sidebarHidden });
    storage.set(storage.KEYS.sidebarHidden, sidebarHidden ? '1' : '0');
  },
  setRoot(root) {
    store.set({ root });
  },
  setHealth(health) {
    store.set({ health });
  },
  setSettings(patch) {
    const settings = { ...store.get().settings, ...patch };
    store.set({ settings });
    storage.setJSON(storage.KEYS.settings, settings);
  },
  resetSettings() {
    store.set({ settings: { ...SETTINGS_DEFAULTS } });
    storage.setJSON(storage.KEYS.settings, SETTINGS_DEFAULTS);
  },
  setBusy(type, value) {
    store.set((s) => ({ busy: { ...s.busy, [type]: value } }));
  }
};

// ── Request registry (AbortControllers are not serializable state) ───────────
const requests = { search: null, impact: null, git: null };

export function startRequest(type) {
  cancelRequest(type);
  const controller = new AbortController();
  requests[type] = controller;
  actions.setBusy(type, true);
  return controller;
}

export function finishRequest(type, controller) {
  if (requests[type] !== controller) return;
  requests[type] = null;
  actions.setBusy(type, false);
}

export function cancelRequest(type) {
  const controller = requests[type];
  if (!controller) return;
  controller.abort();
  requests[type] = null;
  actions.setBusy(type, false);
}

export function hasActiveRequest(type) {
  return !!requests[type];
}

// ── DOM-derived selections shared across components ──────────────────────────
export function getGlobs() {
  return $$('.glob:checked').map((cb) => cb.value);
}

export function getExcludePatterns() {
  const input = $('excludeInput');
  const val = input ? input.value : '';
  return val.trim().split(/[,\s]+/).map((p) => p.trim()).filter(Boolean);
}
