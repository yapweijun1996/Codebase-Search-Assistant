const $ = (id) => document.getElementById(id);
const rootInput = $('rootInput');
const statusBox = $('statusBox');
const languageSelect = $('languageSelect');

const savedRoot = localStorage.getItem('codeSearchRoot') || '';
const savedLanguage = localStorage.getItem('codeSearchLang') || 'en';
rootInput.value = savedRoot;

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
    duration: '{ms} ms',
    noFolders: 'No folders found.',
    nativePickerFallback: 'Native picker unavailable. Using built-in browser.',
    autoInstall: 'Auto Install ripgrep',
    installing: 'Installing... (may take up to 2 min)',
    installOk: 'Installed! Reloading...',
    installRestart: 'Installed — restart the server then refresh.',
    installFail: 'Install failed: {msg}'
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
    autoInstall: '自动安装 ripgrep',
    installing: '安装中...（最多需要 2 分钟）',
    installOk: '安装成功！正在刷新...',
    installRestart: '已安装 — 重启服务器后刷新页面。',
    installFail: '安装失败：{msg}'
  }
};

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

  const template = $('resultTemplate');
  results.slice(0, 500).forEach((item) => {
    const node = template.content.cloneNode(true);
    node.querySelector('.path').textContent = item.relativePath || item.path;
    node.querySelector('.line-number').textContent = `${t('line')} ${item.lineNumber || '-'}`;
    node.querySelector('.code-line').textContent = item.line || '';
    node.querySelector('.open-btn').textContent = t('openVscode');
    node.querySelector('.open-btn').addEventListener('click', async () => {
      try {
        await api('/api/open-vscode', { root: rootInput.value, filePath: item.path, lineNumber: item.lineNumber });
      } catch (err) {
        alert(err.message);
      }
    });
    container.appendChild(node);
  });
}

$('searchBtn').addEventListener('click', runSearch);
$('cancelSearchBtn').addEventListener('click', () => cancelRequest('search'));
$('searchInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') runSearch();
});

async function runSearch() {
  const query = $('searchInput').value.trim();
  if (!query) return showError('searchResults', t('enterSearch'));

  const controller = startRequest('search');
  $('searchResults').innerHTML = '';
  toastSummary('searchSummary', [{ text: t('searching') }]);

  try {
    const data = await api('/api/search', {
      root: rootInput.value,
      query,
      globs: getGlobs(),
      caseSensitive: $('caseSensitive').checked,
      deepSearch: $('deepSearch').checked,
      context: Number($('contextSelect').value),
      maxResults: 300
    }, controller.signal);

    const summary = [
      { text: t('matches', { count: data.count }) },
      { text: data.modules.length ? data.modules.join(', ') : t('noModuleInferred') }
    ];
    const durationText = formatDuration(data.durationMs);
    if (durationText) summary.push({ text: durationText });
    if (data.timedOut) summary.push({ text: t('stoppedEarly'), level: 'MEDIUM' });
    else if (data.truncated) summary.push({ text: t('limitedResults'), level: 'MEDIUM' });
    toastSummary('searchSummary', summary);
    renderResults('searchResults', data.results);
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
  btn.disabled = true;
  status.textContent = t('installing');
  try {
    const res = await fetch('/api/install-rg', { method: 'POST' });
    const data = await res.json().catch(() => ({}));
    if (data.ok) {
      status.textContent = t('installOk');
      setTimeout(() => location.reload(), 1500);
    } else if (data.needsRestart) {
      status.textContent = t('installRestart');
      btn.disabled = false;
    } else {
      status.textContent = t('installFail', { msg: data.message || 'unknown error' });
      btn.disabled = false;
    }
  } catch (err) {
    status.textContent = t('installFail', { msg: err.message });
    btn.disabled = false;
  }
});

applyI18n();
loadConfig();
checkHealth();
