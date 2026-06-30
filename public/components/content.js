// Content: the Search / Impact / Git tabs, their result panels, streaming
// search with file grouping + show-more, match highlighting, search history,
// and the three "Copy for AI" buttons.
//
// mountContent() returns { cancelAll, focusSearch } so app.js can drive the
// global keyboard shortcuts (Esc / Ctrl+K) without reaching into internals.

import { $, escapeHtml } from '../core/dom.js';
import { t } from '../core/i18n.js';
import { api } from '../core/api.js';
import { toastSummary, showError, badge } from '../core/ui.js';
import {
  formatDuration, renderCodeLine, flashCopy,
  formatSearchForAI, formatImpactForAI, formatGitForAI
} from '../core/format.js';
import * as storage from '../core/storage.js';
import {
  store, getGlobs, getExcludePatterns,
  startRequest, finishRequest, cancelRequest, hasActiveRequest
} from '../state.js';

const PREVIEW_LINES = 5;
const SUMMARY_OF = { search: 'searchSummary', impact: 'impactSummary', git: 'gitSummary' };

export function mountContent() {
  let lastSearchStore = null;
  let lastImpactStore = null;
  let lastGitStore = null;

  function isAbortError(err) {
    return err && (err.name === 'AbortError' || /canceled|cancelled|aborted/i.test(err.message || ''));
  }

  // ── Tabs ───────────────────────────────────────────────────────────────────
  function activateTab(name) {
    document.querySelectorAll('.tab').forEach((tb) => tb.classList.toggle('active', tb.dataset.tab === name));
    document.querySelectorAll('.panel').forEach((p) => p.classList.toggle('active', p.id === name));
  }
  document.querySelectorAll('.tab').forEach((tab) => {
    tab.addEventListener('click', () => activateTab(tab.dataset.tab));
  });

  // ── Search history ─────────────────────────────────────────────────────────
  function renderHistory() {
    const container = $('searchHistory');
    if (!container) return;
    container.innerHTML = storage.getHistory().map((q) =>
      `<button class="history-chip" title="${escapeHtml(q)}" data-query="${escapeHtml(q)}">${escapeHtml(q)}</button>`
    ).join('');
  }

  // ── Result rendering (file-grouped, collapsible) ───────────────────────────
  function updateToggle(group) {
    const overflow = group.count - PREVIEW_LINES;
    if (overflow <= 0) { group.toggleBtn.classList.add('hidden'); return; }
    group.toggleBtn.classList.remove('hidden');
    group.toggleBtn.textContent = group.expanded ? t('showLess') : t('showMore', { n: overflow });
    const rows = group.linesEl.querySelectorAll('.line-row');
    rows.forEach((row, i) => {
      row.classList.toggle('hidden', !group.expanded && i >= PREVIEW_LINES);
    });
  }

  function appendResultToGroup(container, item, fileGroups) {
    const key = item.relativePath || item.path;

    if (!fileGroups.has(key)) {
      const card = document.createElement('article');
      card.className = 'result-card';

      const head = document.createElement('div');
      head.className = 'result-head';

      const pathEl = document.createElement('strong');
      pathEl.className = 'path';
      pathEl.textContent = key;

      const countEl = document.createElement('span');
      countEl.className = 'match-count';

      head.appendChild(pathEl);
      head.appendChild(countEl);
      card.appendChild(head);

      const linesEl = document.createElement('div');
      card.appendChild(linesEl);

      const toggleBtn = document.createElement('button');
      toggleBtn.className = 'btn toggle-btn hidden';
      card.appendChild(toggleBtn);

      container.appendChild(card);
      const group = { linesEl, countEl, toggleBtn, count: 0, expanded: false };
      toggleBtn.addEventListener('click', () => { group.expanded = !group.expanded; updateToggle(group); });
      fileGroups.set(key, group);
    }

    const group = fileGroups.get(key);
    group.count++;
    group.countEl.textContent = `${group.count} match${group.count > 1 ? 'es' : ''}`;

    const row = document.createElement('div');
    row.className = 'line-row';
    if (!group.expanded && group.count > PREVIEW_LINES) row.classList.add('hidden');

    const lineNum = document.createElement('span');
    lineNum.className = 'line-number';
    lineNum.textContent = item.lineNumber || '-';

    const codeLine = document.createElement('pre');
    codeLine.className = 'code-line';
    renderCodeLine(codeLine, item.line || '', item.submatches);

    row.appendChild(lineNum);
    row.appendChild(codeLine);
    group.linesEl.appendChild(row);
    updateToggle(group);
  }

  function renderResults(targetId, results) {
    const container = $(targetId);
    container.innerHTML = '';
    if (!results || !results.length) {
      container.innerHTML = `<div class="error">${escapeHtml(t('noResults'))}</div>`;
      return;
    }
    const fileGroups = new Map();
    results.slice(0, 500).forEach((item) => appendResultToGroup(container, item, fileGroups));
  }

  // ── Search (streaming SSE) ─────────────────────────────────────────────────
  async function runSearch() {
    const query = $('searchInput').value.trim();
    if (!query) return showError('searchResults', t('enterSearch'));

    storage.set(storage.KEYS.query, query);
    storage.pushHistory(query);
    renderHistory();

    const controller = startRequest('search');
    const resultsDiv = $('searchResults');
    resultsDiv.innerHTML = '';
    $('copySearchBtn').classList.add('hidden');
    toastSummary('searchSummary', [{ text: t('searching') }]);

    let liveCount = 0;
    const fileGroups = new Map();
    const streamResults = [];
    const pendingBatch = [];
    let batchTimer = null;

    function flushBatch() {
      batchTimer = null;
      const items = pendingBatch.splice(0);
      if (!items.length) return;
      for (const item of items) appendResultToGroup(resultsDiv, item, fileGroups);
      toastSummary('searchSummary', [{ text: t('matches', { count: liveCount }) + '…' }]);
    }

    const settings = store.get().settings;

    try {
      await api.search({
        root: $('rootInput').value,
        query,
        globs: getGlobs(),
        caseSensitive: $('caseSensitive').checked,
        deepSearch: $('deepSearch').checked,
        fixedStrings: !$('regexMode').checked,
        excludePatterns: getExcludePatterns(),
        context: Number($('contextSelect').value),
        maxResults: settings.maxResults,
        maxFilesize: settings.maxFilesize,
        timeoutMs: settings.timeoutMs,
        maxFiles: Number($('maxFilesSelect').value)
      }, (event, data) => {
        if (event === 'result') {
          liveCount++;
          streamResults.push(data);
          pendingBatch.push(data);
          if (!batchTimer) batchTimer = setTimeout(flushBatch, 80);
        } else if (event === 'done') {
          if (batchTimer !== null) { clearTimeout(batchTimer); flushBatch(); }
          if (data.rgMissing) {
            showError('searchResults', 'ripgrep / rg is not installed or not available in PATH.');
            $('searchSummary').innerHTML = '';
            return;
          }
          if (!data.ok && !data.canceled) {
            showError('searchResults', data.stderr || t('requestFailed'));
            $('searchSummary').innerHTML = '';
            return;
          }
          const durationText = formatDuration(data.durationMs);
          const summary = [
            { text: t('matches', { count: data.count }) },
            { text: t('filesFound', { n: data.fileCount || liveCount }) },
            { text: data.modules && data.modules.length ? data.modules.join(', ') : t('noModuleInferred') }
          ];
          if (durationText) summary.push({ text: durationText });
          if (data.timedOut) summary.push({ text: t('stoppedEarly'), level: 'MEDIUM' });
          else if (data.fileTruncated) summary.push({ text: t('fileLimited', { n: data.fileCount }), level: 'MEDIUM' });
          else if (data.truncated) summary.push({ text: t('limitedResults'), level: 'MEDIUM' });
          toastSummary('searchSummary', summary);
          if (liveCount) {
            lastSearchStore = { query, root: $('rootInput').value, results: streamResults, matchCount: data.count, fileCount: data.fileCount || fileGroups.size, duration: durationText };
            const copyBtn = $('copySearchBtn');
            copyBtn._copyText = formatSearchForAI(lastSearchStore);
            copyBtn.classList.remove('hidden');
          } else {
            resultsDiv.innerHTML = `<div class="error">${escapeHtml(t('noResults'))}</div>`;
          }
        }
      }, controller.signal);
    } catch (err) {
      if (isAbortError(err)) {
        toastSummary('searchSummary', [{ text: t('canceled') }]);
      } else {
        showError('searchResults', err.message);
        $('searchSummary').innerHTML = '';
      }
    } finally {
      if (batchTimer !== null) { clearTimeout(batchTimer); batchTimer = null; }
      finishRequest('search', controller);
    }
  }

  // ── Impact ─────────────────────────────────────────────────────────────────
  async function runImpact() {
    const target = $('impactInput').value.trim();
    if (!target) return showError('impactResults', t('enterImpact'));

    const controller = startRequest('impact');
    $('impactResults').innerHTML = '';
    $('copyImpactBtn').classList.add('hidden');
    toastSummary('impactSummary', [{ text: t('analyzingImpact') }]);

    try {
      const data = await api.impact({
        root: $('rootInput').value,
        target,
        globs: getGlobs()
      }, controller.signal);

      toastSummary('impactSummary', [
        { text: t('risk', { value: data.risk }), level: data.risk },
        { text: t('usages', { count: data.usageCount }) },
        { text: t('includeUsages', { count: data.includeCount }) },
        { text: t('modules', { value: data.modules.length ? data.modules.join(', ') : t('unknown') }) },
        { text: formatDuration(data.durationMs) || '-' }
      ]);

      if (data.results && data.results.length) {
        lastImpactStore = { target: data.target, root: $('rootInput').value, risk: data.risk, usageCount: data.usageCount, modules: data.modules, results: data.results };
        const copyBtn = $('copyImpactBtn');
        copyBtn._copyText = formatImpactForAI(lastImpactStore);
        copyBtn.classList.remove('hidden');
      }

      renderResults('impactResults', data.results);
    } catch (err) {
      if (isAbortError(err)) {
        toastSummary('impactSummary', [{ text: t('canceled') }]);
      } else {
        showError('impactResults', err.message);
        $('impactSummary').innerHTML = '';
      }
    } finally {
      finishRequest('impact', controller);
    }
  }

  // ── Git risk ───────────────────────────────────────────────────────────────
  async function runGitRisk() {
    const controller = startRequest('git');
    $('gitResults').innerHTML = '';
    $('copyGitBtn').classList.add('hidden');
    toastSummary('gitSummary', [{ text: t('scanningGit') }]);

    try {
      const data = await api.gitRisk({
        root: $('rootInput').value,
        globs: getGlobs()
      }, controller.signal);

      toastSummary('gitSummary', [
        { text: t('changedFiles', { count: data.changedCount }) },
        { text: t('sortedByRisk') },
        { text: formatDuration(data.durationMs) || '-' }
      ]);

      if (data.files && data.files.length) {
        lastGitStore = { root: $('rootInput').value, changedCount: data.changedCount, files: data.files };
        const copyBtn = $('copyGitBtn');
        copyBtn._copyText = formatGitForAI(lastGitStore);
        copyBtn.classList.remove('hidden');
      }

      const html = data.files.map((file) => {
        const tests = file.suggestedTests.map((testName) => `<li>${escapeHtml(testName)}</li>`).join('');
        const modules = file.modules.length ? file.modules.join(', ') : t('unknown');
        return `
          <article class="git-card">
            <h3>${escapeHtml(file.file)}</h3>
            <div class="git-meta">
              ${badge(t('risk', { value: file.risk }), file.risk)}
              ${badge(t('usages', { count: file.usageCount }))}
              ${badge(t('modules', { value: modules }))}
            </div>
            <strong>${escapeHtml(t('suggestedTests'))}</strong>
            <ul>${tests}</ul>
          </article>
        `;
      }).join('');

      $('gitResults').innerHTML = html || `<div class="error">${escapeHtml(t('noChangedFiles'))}</div>`;
    } catch (err) {
      if (isAbortError(err)) {
        toastSummary('gitSummary', [{ text: t('canceled') }]);
      } else {
        showError('gitResults', err.message);
        $('gitSummary').innerHTML = '';
      }
    } finally {
      finishRequest('git', controller);
    }
  }

  // ── Events ─────────────────────────────────────────────────────────────────
  $('searchBtn').addEventListener('click', runSearch);
  $('searchInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') runSearch(); });
  $('cancelSearchBtn').addEventListener('click', () => cancelType('search'));

  $('impactBtn').addEventListener('click', runImpact);
  $('impactInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') runImpact(); });
  $('cancelImpactBtn').addEventListener('click', () => cancelType('impact'));

  $('gitRiskBtn').addEventListener('click', runGitRisk);
  $('cancelGitBtn').addEventListener('click', () => cancelType('git'));

  $('copySearchBtn').addEventListener('click', () => flashCopy($('copySearchBtn')));
  $('copyImpactBtn').addEventListener('click', () => flashCopy($('copyImpactBtn')));
  $('copyGitBtn').addEventListener('click', () => flashCopy($('copyGitBtn')));

  $('searchHistory').addEventListener('click', (e) => {
    const chip = e.target.closest('.history-chip');
    if (!chip) return;
    $('searchInput').value = chip.dataset.query;
    runSearch();
  });

  function cancelType(type) {
    if (!hasActiveRequest(type)) return;
    cancelRequest(type);
    toastSummary(SUMMARY_OF[type], [{ text: t('canceled') }]);
  }

  // ── Max-files persistence ──────────────────────────────────────────────────
  const maxFilesSelect = $('maxFilesSelect');
  if (maxFilesSelect) {
    const saved = storage.get(storage.KEYS.maxFiles, '25');
    const opt = maxFilesSelect.querySelector(`option[value="${saved}"]`);
    if (opt) opt.selected = true;
    maxFilesSelect.addEventListener('change', () => storage.set(storage.KEYS.maxFiles, maxFilesSelect.value));
  }

  // ── Reactive: reflect busy flags on start/cancel buttons ───────────────────
  const buttonMap = {
    search: ['searchBtn', 'cancelSearchBtn'],
    impact: ['impactBtn', 'cancelImpactBtn'],
    git: ['gitRiskBtn', 'cancelGitBtn']
  };
  function update(state) {
    for (const [type, [startId, cancelId]] of Object.entries(buttonMap)) {
      $(startId).disabled = state.busy[type];
      $(cancelId).classList.toggle('hidden', !state.busy[type]);
    }
  }

  // Restore last query + history on mount.
  const savedQuery = storage.get(storage.KEYS.query);
  if (savedQuery) $('searchInput').value = savedQuery;
  renderHistory();
  store.subscribe(update);
  update(store.get());

  return {
    cancelAll() {
      ['search', 'impact', 'git'].forEach((type) => cancelType(type));
    },
    focusSearch() {
      activateTab('search');
      const si = $('searchInput');
      if (si) { si.focus(); si.select(); }
    }
  };
}
