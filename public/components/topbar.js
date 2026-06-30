// Topbar: sidebar toggle, project pill, language switcher, dark-mode, status pill.

import { $ } from '../core/dom.js';
import { t } from '../core/i18n.js';
import { store, actions } from '../state.js';

export function mountTopbar() {
  const languageSelect = $('languageSelect');
  const darkModeBtn = $('darkModeBtn');
  const statusBox = $('statusBox');
  const statusDot = $('statusDot');
  const statusText = $('statusText');
  const sidebarToggleBtn = $('sidebarToggleBtn');
  const projectPill = $('projectPill');
  const projectPillText = $('projectPillText');

  languageSelect.addEventListener('change', () => actions.setLanguage(languageSelect.value));
  darkModeBtn.addEventListener('click', () => actions.toggleDark());
  sidebarToggleBtn.addEventListener('click', () => actions.setSidebarHidden(!store.get().sidebarHidden));

  projectPill.addEventListener('click', () => {
    if (store.get().sidebarHidden) actions.setSidebarHidden(false);
    setTimeout(() => {
      const input = document.getElementById('rootInput');
      if (input) input.focus();
    }, 60);
  });

  function getProjectLabel(root) {
    if (!root || !root.trim()) return t('noProject');
    const parts = root.replace(/\\/g, '/').split('/').filter(Boolean);
    if (parts.length === 0) return t('noProject');
    if (parts.length === 1) return parts[0];
    return `${parts[parts.length - 2]} / ${parts[parts.length - 1]}`;
  }

  function renderStatus(health) {
    if (health.phase === 'good') {
      statusBox.className = 'status-pill good';
      statusBox.title = health.rgVersion ? `ripgrep ${health.rgVersion}` : '';
      statusDot.className = 'status-dot good';
      statusText.textContent = t('statusReady');
    } else if (health.phase === 'bad') {
      statusBox.className = 'status-pill bad';
      statusBox.title = '';
      statusDot.className = 'status-dot bad';
      statusText.textContent = t('statusError');
    } else if (health.phase === 'offline') {
      statusBox.className = 'status-pill bad';
      statusBox.title = '';
      statusDot.className = 'status-dot bad';
      statusText.textContent = t('statusOffline');
    } else {
      statusBox.className = 'status-pill';
      statusBox.title = '';
      statusDot.className = 'status-dot';
      statusText.textContent = t('statusChecking');
    }
  }

  function update(state) {
    languageSelect.value = state.language;
    document.documentElement.classList.toggle('dark', state.dark);
    darkModeBtn.textContent = state.dark ? '☀️' : '🌙';
    renderStatus(state.health);
    projectPillText.textContent = getProjectLabel(state.root);
    projectPill.title = state.root || t('noProject');
  }

  store.subscribe(update);
  update(store.get());
}
