// Sidebar: collapse, project root (with recent-roots datalist), folder
// browser, file-type filters + presets, exclude paths, and the ripgrep
// auto-installer card.

import { $, escapeHtml } from '../core/dom.js';
import { t } from '../core/i18n.js';
import { api } from '../core/api.js';
import { toastSummary, showError } from '../core/ui.js';
import * as storage from '../core/storage.js';
import { store, actions } from '../state.js';

const FILE_PRESETS = {
  frontend: new Set(['*.js', '*.jsx', '*.ts', '*.tsx', '*.css', '*.html']),
  backend:  new Set(['*.cfm', '*.cfc', '*.sql', '*.py', '*.java', '*.cs', '*.php', '*.rb', '*.go', '*.rs']),
  config:   new Set(['*.json', '*.yml', '*.yaml', '*.md', '*.xml']),
  all:      null
};

const MOBILE_MQ = window.matchMedia('(max-width: 860px)');

export function mountSidebar() {
  const rootInput = $('rootInput');
  const folderBrowser = $('folderBrowser');
  const upBtn = $('upFolderBtn');
  const rgHintCard = $('rgHintCard');
  const expandBtn = $('expandSidebarBtn');
  const backdrop = $('sidebarBackdrop');
  const installBtn = $('installRgBtn');
  const installStatus = $('installRgStatus');
  const installLog = $('installRgLog');

  let browserCurrentPath = '';

  rootInput.value = storage.get(storage.KEYS.root);

  // ── Root suggestions (recent roots) ────────────────────────────────────────
  function renderRootSuggestions() {
    const dl = $('rootSuggestions');
    if (!dl) return;
    dl.innerHTML = storage.getRecentRoots().map((r) => `<option value="${escapeHtml(r)}">`).join('');
  }

  function rememberRoot(root) {
    storage.set(storage.KEYS.root, root);
    storage.pushRecentRoot(root);
    renderRootSuggestions();
  }

  // ── Folder browser ─────────────────────────────────────────────────────────
  async function loadFolder(folderPath) {
    $('browserPath').textContent = folderPath || '';
    $('folderList').innerHTML = '';
    try {
      const data = await api.browse(folderPath || '');
      browserCurrentPath = data.path || '';
      $('browserPath').textContent = data.path || '';
      upBtn.dataset.parent = data.parent || '';
      upBtn.disabled = !data.parent;
      renderFolderList(data.entries || []);
    } catch (err) {
      showError('folderList', err.message);
    }
  }

  function renderFolderList(entries) {
    const list = $('folderList');
    list.innerHTML = '';
    if (!entries.length) {
      list.innerHTML = `<div class="error">${escapeHtml(t('noFolders'))}</div>`;
      return;
    }
    entries.slice(0, 500).forEach((entry) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'folder-item';
      button.textContent = entry.name;
      button.addEventListener('click', () => loadFolder(entry.path));
      list.appendChild(button);
    });
  }

  // ── File-type presets ──────────────────────────────────────────────────────
  function applyPreset(presetKey) {
    const allowed = FILE_PRESETS[presetKey];
    document.querySelectorAll('.glob').forEach((cb) => {
      cb.checked = allowed === null || allowed.has(cb.value);
    });
    document.querySelectorAll('.preset-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.preset === presetKey);
    });
  }

  // ── Events ─────────────────────────────────────────────────────────────────
  $('saveRootBtn').addEventListener('click', () => {
    rememberRoot(rootInput.value.trim());
    toastSummary('searchSummary', [{ text: t('folderSaved') }]);
  });

  $('browseRootBtn').addEventListener('click', async () => {
    try {
      const data = await api.selectFolder(rootInput.value.trim());
      if (data.canceled) return;
      rootInput.value = data.path;
      rememberRoot(rootInput.value.trim());
      folderBrowser.classList.add('hidden');
      toastSummary('searchSummary', [{ text: t('folderSaved') }]);
    } catch (_) {
      folderBrowser.classList.remove('hidden');
      toastSummary('searchSummary', [{ text: t('nativePickerFallback'), level: 'MEDIUM' }]);
      loadFolder(rootInput.value.trim());
    }
  });

  $('openRootBtn').addEventListener('click', async () => {
    try {
      await api.revealFolder(rootInput.value.trim());
    } catch (err) {
      showError('searchResults', err.message);
    }
  });

  $('closeBrowserBtn').addEventListener('click', () => folderBrowser.classList.add('hidden'));
  upBtn.addEventListener('click', () => {
    const parent = upBtn.dataset.parent;
    if (parent) loadFolder(parent);
  });
  $('useFolderBtn').addEventListener('click', () => {
    if (!browserCurrentPath) return;
    rootInput.value = browserCurrentPath;
    rememberRoot(rootInput.value.trim());
    folderBrowser.classList.add('hidden');
    toastSummary('searchSummary', [{ text: t('folderSaved') }]);
  });

  document.querySelectorAll('.preset-btn').forEach((btn) => {
    btn.addEventListener('click', () => applyPreset(btn.dataset.preset));
  });

  $('collapseSidebarBtn').addEventListener('click', () => actions.setSidebarHidden(true));
  expandBtn.addEventListener('click', () => actions.setSidebarHidden(false));
  backdrop.addEventListener('click', () => actions.setSidebarHidden(true));

  installBtn.addEventListener('click', async () => {
    installBtn.disabled = true;
    installStatus.textContent = t('installing');
    installLog.textContent = '';
    installLog.style.display = 'block';
    try {
      await api.installRg((event, data) => {
        if (event === 'log') {
          installLog.textContent += data.line + '\n';
          installLog.scrollTop = installLog.scrollHeight;
        } else if (event === 'done') {
          if (data.ok) {
            installStatus.textContent = t('installOk');
            setTimeout(() => location.reload(), 2000);
          } else if (data.needsRestart) {
            installStatus.textContent = t('installRestart');
            installBtn.disabled = false;
          } else {
            installStatus.textContent = t('installFail', { msg: data.message || 'unknown error' });
            installBtn.disabled = false;
          }
        }
      });
    } catch (err) {
      installStatus.textContent = t('installFail', { msg: err.message });
      installBtn.disabled = false;
    }
  });

  // ── Reactive (collapse state + rg hint visibility) ─────────────────────────
  function update(state) {
    $('layout').classList.toggle('sidebar-hidden', state.sidebarHidden);
    expandBtn.classList.toggle('hidden', !state.sidebarHidden);
    rgHintCard.style.display = state.health.phase === 'bad' ? '' : 'none';

    const isMobile = MOBILE_MQ.matches;
    backdrop.classList.toggle('visible', isMobile && !state.sidebarHidden);
    document.body.style.overflow = isMobile && !state.sidebarHidden ? 'hidden' : '';
  }

  // Close backdrop when resizing to desktop
  MOBILE_MQ.addEventListener('change', () => {
    if (!MOBILE_MQ.matches) {
      backdrop.classList.remove('visible');
      document.body.style.overflow = '';
    }
  });

  renderRootSuggestions();
  store.subscribe(update);
  update(store.get());
}
