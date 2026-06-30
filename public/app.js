const $ = (id) => document.getElementById(id);
const rootInput = $('rootInput');
const statusBox = $('statusBox');
const languageSelect = $('languageSelect');

const savedRoot = localStorage.getItem('codeSearchRoot') || '';
const savedLanguage = localStorage.getItem('codeSearchLang') || 'en';
const savedMaxFiles = localStorage.getItem('codeSearchMaxFiles') || '25';
const savedQuery = localStorage.getItem('codeSearchQuery') || '';
rootInput.value = savedRoot;

const SETTINGS_DEFAULTS = { timeoutMs: 12000, maxResults: 300, maxFilesize: '1M' };
let searchSettings = { ...SETTINGS_DEFAULTS };
try {
  const stored = JSON.parse(localStorage.getItem('codeSearchSettings') || '{}');
  Object.assign(searchSettings, stored);
} catch (_) {}

function saveSearchSettings() {
  localStorage.setItem('codeSearchSettings', JSON.stringify(searchSettings));
}

function applySettingsToModal() {
  $('setTimeoutMs').value = String(searchSettings.timeoutMs);
  $('setMaxResults').value = String(searchSettings.maxResults);
  $('setMaxFilesize').value = searchSettings.maxFilesize;
}

$('settingsBtn').addEventListener('click', () => {
  applySettingsToModal();
  $('settingsModal').classList.remove('hidden');
});

$('settingsModal').addEventListener('click', (e) => {
  if (e.target === $('settingsModal')) $('settingsModal').classList.add('hidden');
});

$('settingsSaveBtn').addEventListener('click', () => {
  searchSettings.timeoutMs = Number($('setTimeoutMs').value);
  searchSettings.maxResults = Number($('setMaxResults').value);
  searchSettings.maxFilesize = $('setMaxFilesize').value;
  saveSearchSettings();
  $('settingsModal').classList.add('hidden');
});

$('settingsResetBtn').addEventListener('click', () => {
  searchSettings = { ...SETTINGS_DEFAULTS };
  saveSearchSettings();
  applySettingsToModal();
});

const translations = {
  en: {
    appTitle: 'Codebase Search Assistant',
    appSubtitle: 'Fast local search, impact check, and Git risk scan for any local project.',
    checking: 'Checking...',
    rootFolder: 'Project root folder',
    saveFolder: 'Save folder',
    browseFolder: 'Browse',
    openFolder: 'Open',
    selectFolder: 'Select folder',
    close: 'Close',
    up: 'Up',
    useThisFolder: 'Use this folder',
    fileFilters: 'File filters',
    recommended: 'Recommended',
    installRg: 'Install ripgrep first:',
    tabSearch: 'Search',
    tabImpact: 'Impact Check',
    tabGit: 'Git Risk Check',
    searchPlaceholder: 'Search keyword, e.g. function name, route, table',
    impactPlaceholder: 'Target file/function/keyword, e.g. auth.js or calculateAmount',
    caseSensitive: 'Case sensitive',
    deepSearch: 'Deep search',
    noContext: 'No context',
    oneContext: '1 context line',
    twoContext: '2 context lines',
    search: 'Search',
    cancel: 'Cancel',
    analyzeImpact: 'Analyze Impact',
    scanGit: 'Scan Current Git Changes',
    uses: 'Uses',
    openVscode: 'Open VS Code',
    folderSaved: 'Folder saved',
    noResults: 'No results found.',
    line: 'Line',
    enterSearch: 'Please enter a search keyword.',
    searching: 'Searching...',
    matches: '{count} matches',
    noModuleInferred: 'No module inferred',
    enterImpact: 'Please enter a target file/function/keyword.',
    analyzingImpact: 'Analyzing impact...',
    risk: 'Risk: {value}',
    usages: '{count} usages',
    includeUsages: '{count} include/import-like usages',
    modules: 'Modules: {value}',
    unknown: 'unknown',
    scanningGit: 'Scanning git changes...',
    changedFiles: '{count} changed files',
    sortedByRisk: 'Sorted by risk',
    suggestedTests: 'Suggested tests',
    noChangedFiles: 'No changed files detected.',
    canceled: 'Canceled.',
    requestFailed: 'Request failed',
    ready: 'Ready - {value}',
    rgNotFound: 'rg not found',
    serverOffline: 'Server offline',
    stoppedEarly: 'Stopped early to protect disk. Narrow folder or keyword.',
    limitedResults: 'Limited results',
    fileLimited: 'Showing first {n} files — increase limit or narrow search',
    filesFound: '{n} files',
    showMore: '▼  Show {n} more',
    showLess: '▲  Show less',
    duration: '{ms} ms',
    noFolders: 'No folders found.',
    nativePickerFallback: 'Native picker unavailable. Using built-in browser.',
    autoInstall: 'Auto Install ripgrep',
    installing: 'Installing... (may take up to 2 min)',
    installOk: 'Installed! Reloading...',
    installRestart: 'Installed — restart the server then refresh.',
    installFail: 'Install failed: {msg}',
    settingsTitle: 'Search Settings',
    settingTimeout: 'Search timeout',
    settingTimeoutHint: 'Stop search after this duration to protect disk I/O.',
    settingMaxResults: 'Max results',
    settingMaxResultsHint: 'Stop collecting matches after this count.',
    settingMaxFilesize: 'Max file size',
    settingMaxFilesizeHint: 'Skip files larger than this size.',
    settingsReset: 'Reset defaults',
    settingsSave: 'Save'
  },
  zh: {
    appTitle: '代码库搜索助手',
    appSubtitle: '本机快速搜索、影响检查、Git 风险扫描，任何本地项目都可以用。',
    checking: '检查中...',
    rootFolder: '项目根目录',
    saveFolder: '保存目录',
    browseFolder: '浏览',
    openFolder: '打开',
    selectFolder: '选择目录',
    close: '关闭',
    up: '上一级',
    useThisFolder: '使用此目录',
    fileFilters: '文件过滤',
    recommended: '建议',
    installRg: '先安装 ripgrep:',
    tabSearch: '搜索',
    tabImpact: '影响检查',
    tabGit: 'Git 风险检查',
    searchPlaceholder: '搜索关键字，例如函数名、路由、表名',
    impactPlaceholder: '目标文件/函数/关键字，例如 auth.js 或 calculateAmount',
    caseSensitive: '区分大小写',
    deepSearch: '深度搜索',
    noContext: '不要上下文',
    oneContext: '1 行上下文',
    twoContext: '2 行上下文',
    search: '搜索',
    cancel: '取消',
    analyzeImpact: '分析影响',
    scanGit: '扫描当前 Git 修改',
    uses: '使用',
    openVscode: '打开 VS Code',
    folderSaved: '目录已保存',
    noResults: '没有找到结果。',
    line: '行',
    enterSearch: '请输入搜索关键字。',
    searching: '搜索中...',
    matches: '{count} 个匹配',
    noModuleInferred: '没有推断到模块',
    enterImpact: '请输入目标文件/函数/关键字。',
    analyzingImpact: '影响分析中...',
    risk: '风险: {value}',
    usages: '{count} 个使用位置',
    includeUsages: '{count} 个 include/import 类使用位置',
    modules: '模块: {value}',
    unknown: '未知',
    scanningGit: 'Git 修改扫描中...',
    changedFiles: '{count} 个修改文件',
    sortedByRisk: '已按风险排序',
    suggestedTests: '建议测试',
    noChangedFiles: '没有检测到修改文件。',
    canceled: '已取消。',
    requestFailed: '请求失败',
    ready: '就绪 - {value}',
    rgNotFound: '找不到 rg',
    serverOffline: '服务器离线',
    stoppedEarly: '已提前停止以保护磁盘。请缩小目录或关键字。',
    limitedResults: '结果已限制',
    duration: '{ms} 毫秒',
    noFolders: '没有找到目录。',
    nativePickerFallback: '系统选择窗口不可用，改用内置目录浏览。',
    fileLimited: '只显示前 {n} 个文件 — 增大限制或缩小搜索范围',
    filesFound: '{n} 个文件',
    showMore: '▼  显示更多 {n} 行',
    showLess: '▲  收起',
    autoInstall: '自动安装 ripgrep',
    installing: '安装中...（最多需要 2 分钟）',
    installOk: '安装成功！正在刷新...',
    installRestart: '已安装 — 重启服务器后刷新页面。',
    installFail: '安装失败：{msg}',
    settingsTitle: '搜索设置',
    settingTimeout: '搜索超时',
    settingTimeoutHint: '超过此时间自动停止，保护磁盘 I/O。',
    settingMaxResults: '最大结果数',
    settingMaxResultsHint: '达到此数量后停止收集匹配项。',
    settingMaxFilesize: '最大文件大小',
    settingMaxFilesizeHint: '跳过超过此大小的文件。',
    settingsReset: '恢复默认',
    settingsSave: '保存'
  }
};

// ─── Tooltip SSOT ────────────────────────────────────────────────────────────
// One place to define help text for every interactive element.
// Keys that start with "tab-" map to .tab[data-tab="<rest>"] buttons.
const TOOLTIPS = {
  en: {
    languageSelect:   'Language — switch UI between English and 中文.',
    statusBox:        'Status — shows whether ripgrep (rg) is installed and reachable in PATH.',
    rootInput:        'Project root folder — the directory ripgrep will search inside.',
    browseRootBtn:    'Browse — open the native OS folder picker to choose your project folder.',
    openRootBtn:      'Open — reveal the selected folder in Explorer / Finder.',
    saveRootBtn:      'Save folder — persist this path in localStorage so it reloads on next visit.',
    installRgBtn:     'Auto Install — runs winget (Windows) / brew (Mac) / apt-get (Linux) to install ripgrep automatically.',
    'tab-search':     'Search tab — full-text keyword search across all project files using ripgrep.',
    'tab-impact':     'Impact Check tab — find every file that references a target file, function, or keyword. Helps estimate blast radius before a change.',
    'tab-git':        'Git Risk Check tab — run git diff --name-only HEAD, then score each changed file by how widely it is referenced.',
    searchInput:      'Search keyword — enter any text, function name, route, table name, or regex pattern.',
    caseSensitive:    'Case sensitive — when checked, matches must have exactly the same letter casing.',
    deepSearch:       'Deep search — include hidden files and override .gitignore rules. Useful for config/env files. Slower on large repos.',
    contextSelect:    'Context lines — show N lines above and below each match to give surrounding code context.',
    maxFilesSelect:   'Max files — ripgrep stops after reaching this many unique files. Lower = faster. "All files" scans everything.',
    searchBtn:        'Search — start the ripgrep scan. Results stream in as files are found.',
    cancelSearchBtn:  'Cancel — kill the running ripgrep process immediately.',
    impactInput:      'Target — enter a filename (e.g. inc_auth.cfm), function name, or any keyword to trace all usages.',
    impactBtn:        'Analyze Impact — searches the project for the target and its basename, classifies risk (HIGH/MEDIUM/LOW) by usage count and path hints.',
    cancelImpactBtn:  'Cancel — stop the impact analysis.',
    gitRiskBtn:       'Scan Git Changes — reads git diff, then ripgrep-searches for each changed filename to count references and suggest test areas.',
    cancelGitBtn:     'Cancel — stop the Git risk scan.',
  },
  zh: {
    languageSelect:   '语言 — 切换界面语言（English / 中文）。',
    statusBox:        '状态 — 显示 ripgrep (rg) 是否已安装并在 PATH 中。',
    rootInput:        '项目根目录 — ripgrep 将在此目录内搜索。',
    browseRootBtn:    '浏览 — 打开系统目录选择窗口选择项目目录。',
    openRootBtn:      '打开 — 在资源管理器 / Finder 中显示所选目录。',
    saveRootBtn:      '保存目录 — 将此路径保存到 localStorage，下次访问自动加载。',
    installRgBtn:     '自动安装 — 运行 winget / brew / apt-get 自动安装 ripgrep。',
    'tab-search':     '搜索标签 — 用 ripgrep 在所有项目文件中全文搜索关键字。',
    'tab-impact':     '影响检查标签 — 查找所有引用目标文件、函数或关键字的文件，评估改动影响范围。',
    'tab-git':        'Git 风险检查标签 — 运行 git diff，按引用次数对每个改动文件评分排序。',
    searchInput:      '搜索关键字 — 输入任意文本、函数名、路由、表名或正则表达式。',
    caseSensitive:    '区分大小写 — 勾选后严格匹配字母大小写。',
    deepSearch:       '深度搜索 — 包含隐藏文件并忽略 .gitignore。适合查配置/环境文件，但在大仓库较慢。',
    contextSelect:    '上下文行 — 在每个匹配行前后显示 N 行，便于理解代码上下文。',
    maxFilesSelect:   '文件数限制 — 达到 N 个文件后 ripgrep 停止搜索。越小越快。"All" 扫描全部。',
    searchBtn:        '搜索 — 开始 ripgrep 扫描，结果边找边流式显示。',
    cancelSearchBtn:  '取消 — 立即终止 ripgrep 进程。',
    impactInput:      '目标 — 输入文件名（如 inc_auth.cfm）、函数名或任意关键字，追踪所有引用位置。',
    impactBtn:        '分析影响 — 搜索目标及其文件名，按使用次数和路径判断风险（HIGH/MEDIUM/LOW）。',
    cancelImpactBtn:  '取消 — 停止影响分析。',
    gitRiskBtn:       '扫描 Git 修改 — 读取 git diff，再用 ripgrep 统计每个改动文件的引用次数并给出测试建议。',
    cancelGitBtn:     '取消 — 停止 Git 风险扫描。',
  }
};
// ─────────────────────────────────────────────────────────────────────────────

let currentLanguage = savedLanguage;
const activeRequests = {
  search: null,
  impact: null,
  git: null
};
let browserCurrentPath = '';

function t(key, values = {}) {
  const dictionary = translations[currentLanguage] || translations.en;
  const template = dictionary[key] || translations.en[key] || key;
  return template.replace(/\{(\w+)\}/g, (_, name) => values[name] ?? '');
}

function applyI18n() {
  document.documentElement.lang = currentLanguage;
  languageSelect.value = currentLanguage;
  document.querySelectorAll('[data-i18n]').forEach((node) => {
    node.textContent = t(node.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((node) => {
    node.placeholder = t(node.dataset.i18nPlaceholder);
  });
}

async function loadConfig() {
  try {
    const res = await fetch('/api/config');
    const data = await res.json();
    if (!rootInput.value && data.defaultRoot) {
      rootInput.value = data.defaultRoot;
    }
  } catch (_) {
    if (!rootInput.value) rootInput.value = '';
  }
}

languageSelect.addEventListener('change', () => {
  currentLanguage = languageSelect.value;
  localStorage.setItem('codeSearchLang', currentLanguage);
  applyI18n();
});

$('saveRootBtn').addEventListener('click', () => {
  localStorage.setItem('codeSearchRoot', rootInput.value.trim());
  toastSummary('searchSummary', [{ text: t('folderSaved') }]);
});

$('browseRootBtn').addEventListener('click', async () => {
  try {
    const data = await api('/api/select-folder', { root: rootInput.value.trim() });
    if (data.canceled) return;
    rootInput.value = data.path;
    localStorage.setItem('codeSearchRoot', rootInput.value.trim());
    $('folderBrowser').classList.add('hidden');
    toastSummary('searchSummary', [{ text: t('folderSaved') }]);
  } catch (_) {
    $('folderBrowser').classList.remove('hidden');
    toastSummary('searchSummary', [{ text: t('nativePickerFallback'), level: 'MEDIUM' }]);
    loadFolder(rootInput.value.trim());
  }
});

$('openRootBtn').addEventListener('click', async () => {
  try {
    await api('/api/reveal-folder', { root: rootInput.value.trim() });
  } catch (err) {
    showError('searchResults', err.message);
  }
});

$('closeBrowserBtn').addEventListener('click', () => {
  $('folderBrowser').classList.add('hidden');
});

$('upFolderBtn').addEventListener('click', () => {
  const parent = $('upFolderBtn').dataset.parent;
  if (parent) loadFolder(parent);
});

$('useFolderBtn').addEventListener('click', () => {
  if (!browserCurrentPath) return;
  rootInput.value = browserCurrentPath;
  localStorage.setItem('codeSearchRoot', rootInput.value.trim());
  $('folderBrowser').classList.add('hidden');
  toastSummary('searchSummary', [{ text: t('folderSaved') }]);
});

async function loadFolder(folderPath) {
  $('browserPath').textContent = folderPath || '';
  $('folderList').innerHTML = '';
  try {
    const data = await api('/api/browse', { root: folderPath || '' });
    browserCurrentPath = data.path || '';
    $('browserPath').textContent = data.path || '';
    $('upFolderBtn').dataset.parent = data.parent || '';
    $('upFolderBtn').disabled = !data.parent;
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

document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
    document.querySelectorAll('.panel').forEach((p) => p.classList.remove('active'));
    tab.classList.add('active');
    $(tab.dataset.tab).classList.add('active');
  });
});

function getGlobs() {
  return Array.from(document.querySelectorAll('.glob:checked')).map((x) => x.value);
}

async function api(path, body, signal) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) throw new Error(data.message || t('requestFailed'));
  return data;
}

function formatDuration(ms) {
  const value = Number(ms);
  if (!Number.isFinite(value)) return null;
  if (value < 1000) return t('duration', { ms: value });
  return `${(value / 1000).toFixed(2)} s`;
}

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
}

function badge(text, level) {
  const cls = level ? ` ${level.toLowerCase()}` : '';
  return `<span class="badge${cls}">${escapeHtml(text)}</span>`;
}

function toastSummary(targetId, items) {
  $(targetId).innerHTML = items.map((item) => badge(item.text, item.level)).join('');
}

function showError(targetId, message) {
  $(targetId).innerHTML = `<div class="error">${escapeHtml(message)}</div>`;
}

function setBusy(type, isBusy) {
  const buttonMap = {
    search: ['searchBtn', 'cancelSearchBtn'],
    impact: ['impactBtn', 'cancelImpactBtn'],
    git: ['gitRiskBtn', 'cancelGitBtn']
  };
  const [startId, cancelId] = buttonMap[type];
  $(startId).disabled = isBusy;
  $(cancelId).classList.toggle('hidden', !isBusy);
}

function startRequest(type) {
  cancelRequest(type, false);
  const controller = new AbortController();
  activeRequests[type] = controller;
  setBusy(type, true);
  return controller;
}

function finishRequest(type, controller) {
  if (activeRequests[type] !== controller) return;
  activeRequests[type] = null;
  setBusy(type, false);
}

function cancelRequest(type, showMessage = true) {
  const controller = activeRequests[type];
  if (!controller) return;
  controller.abort();
  activeRequests[type] = null;
  setBusy(type, false);
  if (!showMessage) return;
  const targetMap = {
    search: 'searchSummary',
    impact: 'impactSummary',
    git: 'gitSummary'
  };
  toastSummary(targetMap[type], [{ text: t('canceled') }]);
}

function isAbortError(err) {
  return err && (err.name === 'AbortError' || /canceled|cancelled|aborted/i.test(err.message || ''));
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

$('searchBtn').addEventListener('click', runSearch);
$('cancelSearchBtn').addEventListener('click', () => cancelRequest('search'));
$('searchInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') runSearch();
});

const PREVIEW_LINES = 5;

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
  codeLine.textContent = item.line || '';

  const openBtn = document.createElement('button');
  openBtn.className = 'btn small-btn open-btn';
  openBtn.textContent = t('openVscode');
  openBtn.addEventListener('click', async () => {
    try {
      await api('/api/open-vscode', { root: rootInput.value, filePath: item.path, lineNumber: item.lineNumber });
    } catch (err) { alert(err.message); }
  });

  row.appendChild(lineNum);
  row.appendChild(codeLine);
  row.appendChild(openBtn);
  group.linesEl.appendChild(row);
  updateToggle(group);
}

async function runSearch() {
  const query = $('searchInput').value.trim();
  if (!query) return showError('searchResults', t('enterSearch'));

  const controller = startRequest('search');
  const resultsDiv = $('searchResults');
  resultsDiv.innerHTML = '';
  toastSummary('searchSummary', [{ text: t('searching') }]);

  let liveCount = 0;
  const fileGroups = new Map();

  try {
    const res = await fetch('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        root: rootInput.value,
        query,
        globs: getGlobs(),
        caseSensitive: $('caseSensitive').checked,
        deepSearch: $('deepSearch').checked,
        context: Number($('contextSelect').value),
        maxResults: searchSettings.maxResults,
        maxFilesize: searchSettings.maxFilesize,
        timeoutMs: searchSettings.timeoutMs,
        maxFiles: Number($('maxFilesSelect').value)
      }),
      signal: controller.signal
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || t('requestFailed'));
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const parts = buffer.split('\n\n');
      buffer = parts.pop();

      for (const block of parts) {
        let event = 'message';
        let dataStr = '';
        for (const line of block.split('\n')) {
          if (line.startsWith('event: ')) event = line.slice(7).trim();
          else if (line.startsWith('data: ')) dataStr = line.slice(6).trim();
        }
        if (!dataStr) continue;
        const data = JSON.parse(dataStr);

        if (event === 'result') {
          liveCount++;
          toastSummary('searchSummary', [{ text: t('matches', { count: liveCount }) + '…' }]);
          appendResultToGroup(resultsDiv, data, fileGroups);
        } else if (event === 'done') {
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
          const summary = [
            { text: t('matches', { count: data.count }) },
            { text: t('filesFound', { n: data.fileCount || liveCount }) },
            { text: data.modules && data.modules.length ? data.modules.join(', ') : t('noModuleInferred') }
          ];
          const durationText = formatDuration(data.durationMs);
          if (durationText) summary.push({ text: durationText });
          if (data.timedOut) summary.push({ text: t('stoppedEarly'), level: 'MEDIUM' });
          else if (data.fileTruncated) summary.push({ text: t('fileLimited', { n: data.fileCount }), level: 'MEDIUM' });
          else if (data.truncated) summary.push({ text: t('limitedResults'), level: 'MEDIUM' });
          toastSummary('searchSummary', summary);
          if (!liveCount) resultsDiv.innerHTML = `<div class="error">${escapeHtml(t('noResults'))}</div>`;
        }
      }
    }
  } catch (err) {
    if (isAbortError(err)) {
      toastSummary('searchSummary', [{ text: t('canceled') }]);
    } else {
      showError('searchResults', err.message);
      $('searchSummary').innerHTML = '';
    }
  } finally {
    finishRequest('search', controller);
  }
}

$('impactBtn').addEventListener('click', runImpact);
$('cancelImpactBtn').addEventListener('click', () => cancelRequest('impact'));
$('impactInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') runImpact();
});

async function runImpact() {
  const target = $('impactInput').value.trim();
  if (!target) return showError('impactResults', t('enterImpact'));

  const controller = startRequest('impact');
  $('impactResults').innerHTML = '';
  toastSummary('impactSummary', [{ text: t('analyzingImpact') }]);

  try {
    const data = await api('/api/impact', {
      root: rootInput.value,
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

$('gitRiskBtn').addEventListener('click', runGitRisk);
$('cancelGitBtn').addEventListener('click', () => cancelRequest('git'));

async function runGitRisk() {
  const controller = startRequest('git');
  $('gitResults').innerHTML = '';
  toastSummary('gitSummary', [{ text: t('scanningGit') }]);

  try {
    const data = await api('/api/git-risk', {
      root: rootInput.value,
      globs: getGlobs()
    }, controller.signal);

    toastSummary('gitSummary', [
      { text: t('changedFiles', { count: data.changedCount }) },
      { text: t('sortedByRisk') },
      { text: formatDuration(data.durationMs) || '-' }
    ]);

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

async function checkHealth() {
  try {
    const res = await fetch('/api/health');
    const data = await res.json();
    if (data.rgAvailable) {
      statusBox.textContent = t('ready', { value: data.rgVersion });
      statusBox.className = 'status good';
      $('rgHintCard').style.display = 'none';
    } else {
      statusBox.textContent = t('rgNotFound');
      statusBox.className = 'status bad';
      $('rgHintCard').style.display = '';
    }
  } catch (_) {
    statusBox.textContent = t('serverOffline');
    statusBox.className = 'status bad';
  }
}

$('installRgBtn').addEventListener('click', async () => {
  const btn = $('installRgBtn');
  const status = $('installRgStatus');
  const log = $('installRgLog');
  btn.disabled = true;
  status.textContent = t('installing');
  log.textContent = '';
  log.style.display = 'block';

  try {
    const res = await fetch('/api/install-rg', { method: 'POST' });
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const parts = buffer.split('\n\n');
      buffer = parts.pop();

      for (const block of parts) {
        let event = 'message';
        let dataStr = '';
        for (const line of block.split('\n')) {
          if (line.startsWith('event: ')) event = line.slice(7).trim();
          else if (line.startsWith('data: ')) dataStr = line.slice(6).trim();
        }
        if (!dataStr) continue;
        const data = JSON.parse(dataStr);

        if (event === 'log') {
          log.textContent += data.line + '\n';
          log.scrollTop = log.scrollHeight;
        } else if (event === 'done') {
          if (data.ok) {
            status.textContent = t('installOk');
            setTimeout(() => location.reload(), 2000);
          } else if (data.needsRestart) {
            status.textContent = t('installRestart');
            btn.disabled = false;
          } else {
            status.textContent = t('installFail', { msg: data.message || 'unknown error' });
            btn.disabled = false;
          }
        }
      }
    }
  } catch (err) {
    status.textContent = t('installFail', { msg: err.message });
    btn.disabled = false;
  }
});

// ─── Tooltip engine ──────────────────────────────────────────────────────────
const tooltipEl = $('tooltip');

function positionTooltip(e) {
  const gap = 16;
  const tw = tooltipEl.offsetWidth;
  const th = tooltipEl.offsetHeight;
  let x = e.clientX + gap;
  let y = e.clientY + gap;
  if (x + tw > window.innerWidth - 8)  x = e.clientX - tw - gap;
  if (y + th > window.innerHeight - 8) y = e.clientY - th - gap;
  tooltipEl.style.left = `${x}px`;
  tooltipEl.style.top  = `${y}px`;
}

document.addEventListener('mousemove', (e) => {
  if (tooltipEl.classList.contains('visible')) positionTooltip(e);
});

function attachTooltips() {
  Object.keys(TOOLTIPS.en).forEach((key) => {
    const el = key.startsWith('tab-')
      ? document.querySelector(`.tab[data-tab="${key.slice(4)}"]`)
      : $(key);
    if (!el) return;
    el.addEventListener('mouseenter', (e) => {
      const text = (TOOLTIPS[currentLanguage] || TOOLTIPS.en)[key];
      if (!text) return;
      tooltipEl.textContent = text;
      tooltipEl.classList.add('visible');
      positionTooltip(e);
    });
    el.addEventListener('mouseleave', () => tooltipEl.classList.remove('visible'));
  });
}
// ─────────────────────────────────────────────────────────────────────────────

// restore max-files preference
const maxFilesSelect = $('maxFilesSelect');
if (maxFilesSelect) {
  const opt = maxFilesSelect.querySelector(`option[value="${savedMaxFiles}"]`);
  if (opt) opt.selected = true;
  maxFilesSelect.addEventListener('change', () => {
    localStorage.setItem('codeSearchMaxFiles', maxFilesSelect.value);
  });
}

attachTooltips();
applyI18n();
loadConfig();
checkHealth();
