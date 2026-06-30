// Topbar: sidebar toggle, project pill, language switcher, dark-mode, status pill.

import { $ } from '../core/dom.js';
import { t } from '../core/i18n.js';
import { store, actions } from '../state.js';

const SVG_MOON = `<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
const SVG_SUN = `<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;

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
    darkModeBtn.innerHTML = state.dark ? SVG_SUN : SVG_MOON;
    renderStatus(state.health);
    projectPillText.textContent = getProjectLabel(state.root);
    projectPill.title = state.root || t('noProject');
  }

  store.subscribe(update);
  update(store.get());
}
