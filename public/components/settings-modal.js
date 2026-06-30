// Settings modal: edit search timeout / max results / max file size.
// Reads and writes the single source of truth (store.settings) via actions.

import { $ } from '../core/dom.js';
import { store, actions } from '../state.js';

export function mountSettingsModal() {
  const modal = $('settingsModal');

  function applyToModal() {
    const s = store.get().settings;
    $('setTimeoutMs').value = String(s.timeoutMs);
    $('setMaxResults').value = String(s.maxResults);
    $('setMaxFilesize').value = s.maxFilesize;
  }

  $('settingsBtn').addEventListener('click', () => {
    applyToModal();
    modal.classList.remove('hidden');
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.add('hidden');
  });

  $('settingsSaveBtn').addEventListener('click', () => {
    actions.setSettings({
      timeoutMs: Number($('setTimeoutMs').value),
      maxResults: Number($('setMaxResults').value),
      maxFilesize: $('setMaxFilesize').value
    });
    modal.classList.add('hidden');
  });

  $('settingsResetBtn').addEventListener('click', () => {
    actions.resetSettings();
    applyToModal();
  });
}
