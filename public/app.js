// Bootstrap: wire i18n to the store, mount each region, register global
// keyboard shortcuts, and kick off the async config/health loads. All feature
// logic lives in the components and core modules.

import { $, applyI18n } from './core/dom.js';
import { initI18n, t } from './core/i18n.js';
import { api } from './core/api.js';
import { store, actions } from './state.js';
import { mountTopbar } from './components/topbar.js';
import { mountSidebar } from './components/sidebar.js';
import { mountContent } from './components/content.js';
import { mountSettingsModal } from './components/settings-modal.js';
import { mountTooltips } from './components/tooltip.js';

initI18n(store);

mountTopbar();
mountSidebar();
const content = mountContent();
mountSettingsModal();
mountTooltips();

// Re-translate every [data-i18n] node when the language changes.
let prevLang = store.get().language;
store.subscribe((state) => {
  if (state.language !== prevLang) {
    document.documentElement.lang = state.language;
    applyI18n(t);
    prevLang = state.language;
  }
});

// Global shortcuts: Esc closes mobile sidebar (if open) or cancels requests; Ctrl/Cmd+K focuses search.
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const isMobile = window.matchMedia('(max-width: 860px)').matches;
    if (isMobile && !store.get().sidebarHidden) {
      actions.setSidebarHidden(true);
    } else {
      content.cancelAll();
    }
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    content.focusSearch();
  }
});

async function loadConfig() {
  try {
    const data = await api.config();
    const rootInput = $('rootInput');
    if (!rootInput.value && data.defaultRoot) rootInput.value = data.defaultRoot;
  } catch (_) {
    // Non-fatal; health check surfaces server state.
  }
}

async function checkHealth() {
  try {
    const data = await api.health();
    if (data.rgAvailable) actions.setHealth({ phase: 'good', rgVersion: data.rgVersion });
    else actions.setHealth({ phase: 'bad', rgVersion: null });
  } catch (_) {
    actions.setHealth({ phase: 'offline', rgVersion: null });
  }
}

// Initial paint + async loads.
document.documentElement.lang = store.get().language;
applyI18n(t);
loadConfig();
checkHealth();
