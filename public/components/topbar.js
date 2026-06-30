// Topbar: language switcher, dark-mode toggle, and ripgrep/server status.
// (The ⚙ settings button is wired by the settings-modal component.)

import { $ } from '../core/dom.js';
import { t } from '../core/i18n.js';
import { store, actions } from '../state.js';

export function mountTopbar() {
  const languageSelect = $('languageSelect');
  const darkModeBtn = $('darkModeBtn');
  const statusBox = $('statusBox');
  const sidebarToggleBtn = $('sidebarToggleBtn');

  languageSelect.addEventListener('change', () => actions.setLanguage(languageSelect.value));
  darkModeBtn.addEventListener('click', () => actions.toggleDark());
  sidebarToggleBtn.addEventListener('click', () => actions.setSidebarHidden(!store.get().sidebarHidden));

  function renderStatus(health) {
    if (health.phase === 'good') {
      statusBox.textContent = t('ready', { value: health.rgVersion });
      statusBox.className = 'status good';
    } else if (health.phase === 'bad') {
      statusBox.textContent = t('rgNotFound');
      statusBox.className = 'status bad';
    } else if (health.phase === 'offline') {
      statusBox.textContent = t('serverOffline');
      statusBox.className = 'status bad';
    } else {
      statusBox.textContent = t('checking');
      statusBox.className = 'status';
    }
  }

  function update(state) {
    languageSelect.value = state.language;
    document.documentElement.classList.toggle('dark', state.dark);
    darkModeBtn.textContent = state.dark ? '☀️' : '🌙';
    renderStatus(state.health);
  }

  store.subscribe(update);
  update(store.get());
}
