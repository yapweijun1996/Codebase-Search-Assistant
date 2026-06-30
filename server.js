const express = require('express');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn, execFile } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3123;
const HOST = process.env.HOST || '127.0.0.1';
const COMMAND_TIMEOUT_MS = Number(process.env.COMMAND_TIMEOUT_MS || 12000);
const RG_THREADS = Math.max(1, Math.min(Number(process.env.RG_THREADS || 1), 4));
const RG_MAX_FILESIZE = process.env.RG_MAX_FILESIZE || '1M';
const GIT_RISK_MAX_FILES = Math.max(1, Math.min(Number(process.env.GIT_RISK_MAX_FILES || 20), 80));
const DEFAULT_ROOT = path.resolve(process.env.DEFAULT_ROOT || process.cwd());
const ALLOWED_ROOTS = String(process.env.ALLOWED_ROOTS || '')
  .split(path.delimiter)
  .map((item) => item.trim())
  .filter(Boolean)
  .map((item) => path.resolve(item));

app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const DEFAULT_GLOBS = [
  '*.cfm', '*.cfc', '*.js', '*.jsx', '*.ts', '*.tsx', '*.css', '*.scss', '*.html', '*.htm',
  '*.sql', '*.json', '*.md', '*.py', '*.java', '*.cs', '*.php', '*.rb', '*.go', '*.rs',
  '*.yml', '*.yaml', '*.xml'
];
const HIGH_RISK_HINTS = [
  'common', 'include', 'includes', 'inc', 'core', 'utils', 'util', 'layout', 'security',
  'auth', 'session', 'db', 'database', 'header', 'footer', 'menu', 'global', 'shared', 'template'
];
const MODULE_HINTS = [
  { key: 'frontend', names: ['frontend', 'client', 'ui', 'views', 'pages', 'components', 'public', 'assets'] },
  { key: 'backend', names: ['backend', 'server', 'api', 'routes', 'controllers', 'services', 'handlers'] },
  { key: 'database', names: ['database', 'db', 'sql', 'schema', 'migration', 'migrations', 'models'] },
  { key: 'auth', names: ['auth', 'login', 'session', 'security', 'permission', 'permissions', 'acl'] },
  { key: 'config', names: ['config', 'settings', 'env', '.env', 'manifest', 'package.json'] },
  { key: 'test', names: ['test', 'tests', 'spec', 'specs', '__tests__', 'fixtures'] },
  { key: 'docs', names: ['docs', 'readme', 'manual', 'guide', 'changelog'] },
  { key: 'build', names: ['build', 'dist', 'bundle', 'webpack', 'vite', 'rollup', 'ci', 'workflow'] },
  { key: 'report', names: ['report', 'reports', 'export', 'print', 'pdf', 'csv', 'excel'] },
  { key: 'admin', names: ['admin', 'setup', 'maintenance', 'management'] }
];

function isSafeRoot(root) {
  return typeof root === 'string' && root.trim().length > 0;
}

function normalizeRoot(root) {
  return path.resolve(root.trim());
}

function isPathInside(childPath, parentPath) {
  const relative = path.relative(parentPath, childPath);
  return relative === '' || (!!relative && !relative.startsWith('..') && !path.isAbsolute(relative));
}

function isAllowedRoot(root) {
  if (!ALLOWED_ROOTS.length) return true;
  return ALLOWED_ROOTS.some((allowedRoot) => isPathInside(root, allowedRoot));
}

function fileExists(dir) {
  try {
    return fs.existsSync(dir) && fs.statSync(dir).isDirectory();
  } catch (err) {
    return false;
  }
}

function listWindowsDrives() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  return letters
    .map((letter) => `${letter}:\\`)
    .filter((drivePath) => {
      try {
        return fs.existsSync(drivePath);
      } catch (_) {
        return false;
      }
    })
    .map((drivePath) => ({ name: drivePath, path: drivePath }));
}

function safeListDirectories(targetPath) {
  const resolvedPath = path.resolve(targetPath);
  const parent = path.dirname(resolvedPath);
  const entries = fs.readdirSync(resolvedPath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const fullPath = path.join(resolvedPath, entry.name);
      return { name: entry.name, path: fullPath };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  return {
    path: resolvedPath,
    parent: parent !== resolvedPath ? parent : null,
    entries
  };
}

async function refreshWindowsPath() {
  const result = await new Promise((resolve) => {
    execFile('powershell.exe', [
      '-NoProfile', '-Command',
      '[System.Environment]::GetEnvironmentVariable("PATH","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH","User")'
    ], { windowsHide: true, timeout: 8000 }, (err, stdout) => {
      resolve(err ? null : String(stdout || '').trim());
    });
  });
  if (result) process.env.PATH = result;
}

function runExecFile(command, args, options = {}) {
  return new Promise((resolve) => {
    execFile(command, args, { windowsHide: false, timeout: options.timeoutMs || 0 }, (err, stdout, stderr) => {
      if (err) {
        resolve({ ok: false, message: stderr || err.message || 'Command failed.' });
        return;
      }
      resolve({ ok: true, stdout: String(stdout || '').trim(), stderr: String(stderr || '').trim() });
    });
  });
}

async function selectNativeFolder(initialPath) {
  const platform = os.platform();
  const startPath = fileExists(initialPath) ? path.resolve(initialPath) : DEFAULT_ROOT;

  if (platform === 'win32') {
    const command = [
      'Add-Type -AssemblyName System.Windows.Forms;',
      '[Console]::OutputEncoding = [System.Text.Encoding]::UTF8;',
      '$dialog = New-Object System.Windows.Forms.FolderBrowserDialog;',
      '$dialog.Description = "Select project folder";',
      `$dialog.SelectedPath = ${JSON.stringify(startPath)};`,
      'if ($dialog.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) { Write-Output $dialog.SelectedPath }'
    ].join(' ');
    return runExecFile('powershell.exe', ['-NoProfile', '-STA', '-Command', command]);
  }

  if (platform === 'darwin') {
    const script = `POSIX path of (choose folder with prompt "Select project folder" default location POSIX file ${JSON.stringify(startPath)})`;
    return runExecFile('osascript', ['-e', script]);
  }

  return { ok: false, message: 'Native folder picker is not available on this OS.' };
}

function revealFolder(folderPath) {
  const resolvedPath = path.resolve(folderPath);
  const platform = os.platform();

  if (platform === 'win32') {
    // explorer.exe is single-instance — it hands off to the running instance and
    // exits with a non-zero code immediately, which execFile wrongly treats as failure.
    return new Promise((resolve) => {
      const child = spawn('explorer.exe', [resolvedPath], { detached: true, stdio: 'ignore', windowsHide: false });
      child.unref();
      resolve({ ok: true });
    });
  }
  if (platform === 'darwin') {
    return runExecFile('open', [resolvedPath]);
  }
  return runExecFile('xdg-open', [resolvedPath]);
}

function runCommand(command, args, options = {}) {
  return new Promise((resolve) => {
    let settled = false;
    const child = spawn(command, args, {
      cwd: options.cwd,
      shell: false,
      windowsHide: true,
      env: process.env
    });

    let stdout = '';
    let stderr = '';
    const maxBuffer = options.maxBuffer || 20 * 1024 * 1024;
    const timeoutMs = options.timeoutMs || COMMAND_TIMEOUT_MS;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      child.kill();
      resolve({ ok: false, code: -2, stdout, stderr: `Command timed out after ${timeoutMs}ms.` });
    }, timeoutMs);

    const cancel = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      child.kill();
      resolve({ ok: false, code: -3, canceled: true, stdout, stderr: 'Request canceled.' });
    };

    if (options.signal) {
      if (options.signal.aborted) return cancel();
      options.signal.addEventListener('abort', cancel, { once: true });
    }

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString('utf8');
      if (stdout.length > maxBuffer) {
        child.kill();
      }
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString('utf8');
    });

    child.on('error', (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (options.signal) options.signal.removeEventListener('abort', cancel);
      resolve({ ok: false, code: -1, stdout, stderr: err.message || stderr });
    });

    child.on('close', (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (options.signal) options.signal.removeEventListener('abort', cancel);
      resolve({ ok: code === 0 || code === 1, code, stdout, stderr });
    });
  });
}

function createRequestSignal(req, res) {
  const controller = new AbortController();
  req.on('aborted', () => controller.abort());
  res.on('close', () => {
    if (!res.writableEnded) controller.abort();
  });
  return controller.signal;
}

function canRespond(res) {
  return !res.destroyed && !res.writableEnded;
}

function sendJson(res, status, body) {
  if (!canRespond(res)) return;
  return res.status(status).json(body);
}

function validateRoot(root) {
  if (!isSafeRoot(root)) return { ok: false, status: 400, message: 'Root folder is required.' };

  const resolvedRoot = normalizeRoot(root);
  if (!fileExists(resolvedRoot)) return { ok: false, status: 400, message: `Folder not found: ${resolvedRoot}` };
  if (!isAllowedRoot(resolvedRoot)) {
    return {
      ok: false,
      status: 403,
      message: `Folder is outside ALLOWED_ROOTS: ${resolvedRoot}`
    };
  }

  return { ok: true, root: resolvedRoot };
}

function buildRgArgs({ query, globs, caseSensitive, context, deepSearch }) {
  const args = [
    '--json',
    '--line-number',
    '--column',
    '--threads', String(deepSearch ? Math.max(RG_THREADS, 2) : RG_THREADS),
    '--max-filesize', deepSearch ? '10M' : RG_MAX_FILESIZE,
    '--glob', '!node_modules/**',
    '--glob', '!.git/**',
    '--glob', '!.svn/**',
    '--glob', '!vendor/**',
    '--glob', '!dist/**',
    '--glob', '!build/**',
    '--glob', '!cache/**',
    '--glob', '!.cache/**',
    '--glob', '!tmp/**',
    '--glob', '!temp/**',
    '--glob', '!logs/**',
    '--glob', '!log/**',
    '--glob', '!backup/**',
    '--glob', '!backups/**',
    '--glob', '!uploads/**',
    '--glob', '!attachments/**'
  ];

  if (deepSearch) {
    args.push('--hidden', '--no-ignore-parent');
  }

  if (caseSensitive) args.push('--case-sensitive');
  else args.push('--ignore-case');

  const ctx = Number.isFinite(Number(context)) ? Math.max(0, Math.min(Number(context), 5)) : 0;
  if (ctx > 0) args.push('--context', String(ctx));

  const selectedGlobs = Array.isArray(globs) && globs.length ? globs : DEFAULT_GLOBS;
  selectedGlobs.forEach((g) => args.push('--glob', g));

  args.push(query);
  args.push('.');
  return args;
}

function parseRgJsonLine(jsonLine, root) {
  if (!jsonLine.trim()) return null;

  let event;
  try {
    event = JSON.parse(jsonLine);
  } catch (_) {
    return null;
  }

  if (event.type !== 'match') return null;
  const data = event.data || {};
  const rel = data.path?.text || '';
  const lineNumber = data.line_number || 0;
  const line = (data.lines?.text || '').replace(/\r?\n$/, '');
  const submatches = Array.isArray(data.submatches) ? data.submatches.map((m) => ({
    text: m.match?.text || '',
    start: m.start,
    end: m.end
  })) : [];

  return {
    path: path.resolve(root, rel),
    relativePath: rel,
    lineNumber,
    line,
    submatches
  };
}

function runRgSearch(root, args, options = {}) {
  return new Promise((resolve) => {
    let settled = false;
    let killedByLimit = false;
    let pending = '';
    let stderr = '';
    const results = [];
    const maxResults = options.maxResults || 300;
    const timeoutMs = options.timeoutMs || COMMAND_TIMEOUT_MS;

    const child = spawn('rg', args, {
      cwd: root,
      shell: false,
      windowsHide: true,
      env: process.env
    });

    const finish = (payload) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (options.signal) options.signal.removeEventListener('abort', cancel);
      resolve(payload);
    };

    const timer = setTimeout(() => {
      child.kill();
      finish({
        ok: true,
        code: -2,
        results,
        timedOut: true,
        truncated: true,
        stderr: `Search stopped after ${timeoutMs}ms. Narrow the folder, search a more specific keyword, or enable Deep search only when needed.`
      });
    }, timeoutMs);

    const cancel = () => {
      child.kill();
      finish({ ok: false, code: -3, canceled: true, results, stderr: 'Request canceled.' });
    };

    const readLines = (chunk) => {
      pending += chunk.toString('utf8');
      const lines = pending.split(/\r?\n/);
      pending = lines.pop() || '';

      for (const line of lines) {
        const item = parseRgJsonLine(line, root);
        if (!item) continue;
        results.push(item);

        if (results.length >= maxResults) {
          killedByLimit = true;
          child.kill();
          return;
        }
      }
    };

    if (options.signal) {
      if (options.signal.aborted) return cancel();
      options.signal.addEventListener('abort', cancel, { once: true });
    }

    child.stdout.on('data', readLines);
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString('utf8');
    });
    child.on('error', (err) => {
      finish({ ok: false, code: -1, results, stderr: err.message || stderr });
    });
    child.on('close', (code) => {
      if (pending) {
        const item = parseRgJsonLine(pending, root);
        if (item && results.length < maxResults) results.push(item);
      }

      if (killedByLimit) {
        return finish({ ok: true, code, results, truncated: true, stderr });
      }

      finish({ ok: code === 0 || code === 1, code, results, truncated: false, stderr });
    });
  });
}

function inferModulesFromResults(results) {
  const found = new Set();
  for (const item of results) {
    const haystack = `${item.relativePath || ''} ${item.line || ''}`.toLowerCase().replace(/\\/g, '/');
    for (const moduleHint of MODULE_HINTS) {
      if (moduleHint.names.some((name) => haystack.includes(name.toLowerCase().replace(/\\/g, '/')))) {
        found.add(moduleHint.key);
      }
    }
  }
  return Array.from(found).sort();
}

function isHighRiskPath(filePath) {
  const normalized = String(filePath || '').toLowerCase().replace(/\\/g, '/');
  return HIGH_RISK_HINTS.some((hint) => normalized.includes(`/${hint}/`) || normalized.includes(`/${hint}_`) || normalized.includes(`/${hint}.`) || normalized.includes(hint));
}

function classifyRisk(filePath, usageCount = 0) {
  const highRiskPath = isHighRiskPath(filePath);
  if (highRiskPath || usageCount >= 30) return 'HIGH';
  if (usageCount >= 8) return 'MEDIUM';
  return 'LOW';
}

async function searchWithRg(root, params, signal) {
  const args = buildRgArgs(params);
  const maxResults = Number.isFinite(Number(params.maxResults)) ? Math.max(1, Math.min(Number(params.maxResults), 1000)) : 300;
  const result = await runRgSearch(root, args, { timeoutMs: COMMAND_TIMEOUT_MS, signal, maxResults });

  if (result.canceled) {
    return { ok: false, canceled: true, message: 'Request canceled.' };
  }

  if (!result.ok && /ENOENT|not found|not recognized/i.test(result.stderr)) {
    return { ok: false, rgMissing: true, message: 'ripgrep / rg is not installed or not available in PATH.' };
  }

  if (!result.ok) {
    return { ok: false, message: result.stderr || 'Search command failed.' };
  }

  return {
    ok: true,
    results: result.results,
    rawCode: result.code,
    truncated: !!result.truncated,
    timedOut: !!result.timedOut,
    message: result.stderr || null
  };
}

app.get('/api/health', async (req, res) => {
  let rg = await runCommand('rg', ['--version']);
  if (!rg.ok && os.platform() === 'win32') {
    await refreshWindowsPath();
    rg = await runCommand('rg', ['--version']);
  }
  res.json({
    ok: true,
    platform: os.platform(),
    node: process.version,
    host: HOST,
    defaultRoot: DEFAULT_ROOT,
    allowedRootsEnabled: ALLOWED_ROOTS.length > 0,
    rgAvailable: rg.ok,
    rgVersion: rg.stdout.split(/\r?\n/)[0] || null
  });
});

app.get('/api/config', (req, res) => {
  res.json({
    ok: true,
    defaultRoot: DEFAULT_ROOT,
    allowedRootsEnabled: ALLOWED_ROOTS.length > 0,
    defaultGlobs: DEFAULT_GLOBS
  });
});

app.post('/api/browse', (req, res) => {
  const { root } = req.body || {};

  try {
    if (!root || !String(root).trim()) {
      return sendJson(res, 200, {
        ok: true,
        path: null,
        parent: null,
        entries: os.platform() === 'win32' ? listWindowsDrives() : [{ name: '/', path: '/' }]
      });
    }

    const resolvedRoot = path.resolve(String(root).trim());
    if (!fileExists(resolvedRoot)) {
      return sendJson(res, 400, { ok: false, message: `Folder not found: ${resolvedRoot}` });
    }
    if (!isAllowedRoot(resolvedRoot)) {
      return sendJson(res, 403, { ok: false, message: `Folder is outside ALLOWED_ROOTS: ${resolvedRoot}` });
    }

    sendJson(res, 200, { ok: true, ...safeListDirectories(resolvedRoot) });
  } catch (err) {
    sendJson(res, 500, { ok: false, message: err.message || 'Unable to list folder.' });
  }
});

app.post('/api/select-folder', async (req, res) => {
  const { root } = req.body || {};
  const selected = await selectNativeFolder(String(root || '').trim());

  if (!selected.ok) {
    return sendJson(res, 500, { ok: false, message: selected.message || 'Unable to open native folder picker.' });
  }

  if (!selected.stdout) {
    return sendJson(res, 200, { ok: true, canceled: true });
  }

  const selectedPath = path.resolve(selected.stdout);
  if (!fileExists(selectedPath)) {
    return sendJson(res, 400, { ok: false, message: `Folder not found: ${selectedPath}` });
  }
  if (!isAllowedRoot(selectedPath)) {
    return sendJson(res, 403, { ok: false, message: `Folder is outside ALLOWED_ROOTS: ${selectedPath}` });
  }

  sendJson(res, 200, { ok: true, path: selectedPath });
});

app.post('/api/reveal-folder', async (req, res) => {
  const { root } = req.body || {};
  const rootCheck = validateRoot(root);
  if (!rootCheck.ok) return sendJson(res, rootCheck.status, { ok: false, message: rootCheck.message });

  const output = await revealFolder(rootCheck.root);
  if (!output.ok) {
    return sendJson(res, 500, { ok: false, message: output.message || 'Unable to open file manager.' });
  }
  sendJson(res, 200, { ok: true });
});

app.post('/api/search', (req, res) => {
  const startedAt = Date.now();
  const { root, query, globs, caseSensitive, context, maxResults, deepSearch } = req.body || {};
  if (!query || !String(query).trim()) return res.status(400).json({ ok: false, message: 'Search keyword is required.' });

  const rootCheck = validateRoot(root);
  if (!rootCheck.ok) return res.status(rootCheck.status).json({ ok: false, message: rootCheck.message });
  const resolvedRoot = rootCheck.root;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const send = (event, data) => {
    if (!res.writableEnded) res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  const maxRes = Number.isFinite(Number(maxResults)) ? Math.max(1, Math.min(Number(maxResults), 1000)) : 300;
  const args = buildRgArgs({
    query: String(query).trim(), globs, caseSensitive: !!caseSensitive, context, deepSearch: !!deepSearch
  });

  let pending = '';
  let stderr = '';
  let count = 0;
  let killedByLimit = false;
  let settled = false;
  const allResults = [];

  const child = spawn('rg', args, { cwd: resolvedRoot, shell: false, windowsHide: true, env: process.env });

  const finish = (payload) => {
    if (settled) return;
    settled = true;
    clearTimeout(timer);
    req.off('close', onClose);
    send('done', { ...payload, modules: inferModulesFromResults(allResults), durationMs: Date.now() - startedAt });
    res.end();
  };

  const timer = setTimeout(() => {
    child.kill();
    finish({ ok: true, count, truncated: true, timedOut: true });
  }, COMMAND_TIMEOUT_MS);

  const onClose = () => { child.kill(); finish({ ok: false, canceled: true, count }); };
  req.on('close', onClose);

  child.stdout.on('data', (chunk) => {
    pending += chunk.toString('utf8');
    const lines = pending.split(/\r?\n/);
    pending = lines.pop() || '';
    for (const line of lines) {
      const item = parseRgJsonLine(line, resolvedRoot);
      if (!item) continue;
      allResults.push(item);
      count++;
      send('result', item);
      if (count >= maxRes) { killedByLimit = true; child.kill(); return; }
    }
  });

  child.stderr.on('data', (chunk) => { stderr += chunk.toString('utf8'); });

  child.on('error', (err) => {
    finish({ ok: false, count, stderr: err.message || stderr });
  });

  child.on('close', (code) => {
    if (pending) {
      const item = parseRgJsonLine(pending, resolvedRoot);
      if (item && count < maxRes) { allResults.push(item); count++; send('result', item); }
    }
    if (killedByLimit) return finish({ ok: true, count, truncated: true });
    const rgMissing = /ENOENT|not found|not recognized/i.test(stderr);
    finish({ ok: code === 0 || code === 1, count, truncated: false, rgMissing, stderr: stderr || null });
  });
});

app.post('/api/impact', async (req, res) => {
  const startedAt = Date.now();
  const signal = createRequestSignal(req, res);
  const { root, target, globs } = req.body || {};
  if (!target || !String(target).trim()) return res.status(400).json({ ok: false, message: 'Target file/function/keyword is required.' });

  const rootCheck = validateRoot(root);
  if (!rootCheck.ok) return res.status(rootCheck.status).json({ ok: false, message: rootCheck.message });
  const resolvedRoot = rootCheck.root;

  const rawTarget = String(target).trim();
  const targetBase = path.basename(rawTarget);
  const searches = Array.from(new Set([rawTarget, targetBase].filter(Boolean)));
  let allResults = [];

  for (const q of searches) {
    if (signal.aborted) return sendJson(res, 499, { ok: false, canceled: true, message: 'Request canceled.' });
    const output = await searchWithRg(resolvedRoot, {
      query: q,
      globs: globs && globs.length ? globs : DEFAULT_GLOBS,
      caseSensitive: false,
      context: 0,
      maxResults: 300,
      deepSearch: false
    }, signal);
    if (output.canceled) return sendJson(res, 499, output);
    if (!output.ok) return sendJson(res, 500, output);
    allResults = allResults.concat(output.results);
  }

  const dedup = new Map();
  for (const item of allResults) {
    const key = `${item.relativePath}:${item.lineNumber}:${item.line}`;
    dedup.set(key, item);
  }
  const results = Array.from(dedup.values());
  const modules = inferModulesFromResults(results);
  const risk = classifyRisk(rawTarget, results.length);

  const includeResults = results.filter((item) => /cfinclude|include|template=|src=|href=|import|require|script/i.test(item.line));

  sendJson(res, 200, {
    ok: true,
    target: rawTarget,
    usageCount: results.length,
    includeCount: includeResults.length,
    modules,
    risk,
    results,
    includeResults,
    durationMs: Date.now() - startedAt,
    truncated: allResults.length >= 300
  });
});

app.post('/api/git-risk', async (req, res) => {
  const startedAt = Date.now();
  const signal = createRequestSignal(req, res);
  const { root, globs } = req.body || {};

  const rootCheck = validateRoot(root);
  if (!rootCheck.ok) return res.status(rootCheck.status).json({ ok: false, message: rootCheck.message });
  const resolvedRoot = rootCheck.root;

  const gitResult = await runCommand('git', ['diff', '--name-only', 'HEAD'], { cwd: resolvedRoot, timeoutMs: COMMAND_TIMEOUT_MS, signal });
  if (gitResult.canceled) return sendJson(res, 499, { ok: false, canceled: true, message: 'Request canceled.' });
  if (!gitResult.ok) {
    return res.status(500).json({ ok: false, message: gitResult.stderr || 'Unable to read git diff. Is this folder a Git repo?' });
  }

  const changedFiles = gitResult.stdout.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
  const details = [];

  for (const rel of changedFiles.slice(0, GIT_RISK_MAX_FILES)) {
    if (signal.aborted) return sendJson(res, 499, { ok: false, canceled: true, message: 'Request canceled.' });
    const base = path.basename(rel);
    let usageCount = 0;
    let modules = [];

    if (base) {
      const output = await searchWithRg(resolvedRoot, {
        query: base,
        globs: globs && globs.length ? globs : DEFAULT_GLOBS,
        caseSensitive: false,
        context: 0,
        maxResults: 300,
        deepSearch: false
      }, signal);
      if (output.canceled) return sendJson(res, 499, output);
      if (output.ok) {
        usageCount = output.results.length;
        modules = inferModulesFromResults(output.results);
      }
    }

    const risk = classifyRisk(rel, usageCount);
    details.push({
      file: rel,
      usageCount,
      modules,
      risk,
      suggestedTests: suggestTests(rel, modules, risk)
    });
  }

  details.sort((a, b) => riskRank(b.risk) - riskRank(a.risk));
  sendJson(res, 200, {
    ok: true,
    root: resolvedRoot,
    changedCount: changedFiles.length,
    scannedCount: details.length,
    truncated: changedFiles.length > details.length,
    durationMs: Date.now() - startedAt,
    files: details
  });
});

function riskRank(risk) {
  return risk === 'HIGH' ? 3 : risk === 'MEDIUM' ? 2 : 1;
}

function suggestTests(file, modules, risk) {
  const tests = new Set();
  if (risk === 'HIGH') {
    ['App start', 'Main navigation', 'Core user flow', 'Save/update flow', 'Error handling', 'Build/check command'].forEach((x) => tests.add(x));
  }
  for (const m of modules) {
    if (m === 'frontend') tests.add('Affected page/component renders');
    if (m === 'backend') tests.add('Affected API route/service returns expected response');
    if (m === 'database') tests.add('Migration/schema/query smoke check');
    if (m === 'auth') tests.add('Login/session/permission check');
    if (m === 'config') tests.add('Start app with expected environment/config');
    if (m === 'test') tests.add('Run focused tests');
    if (m === 'docs') tests.add('Review docs links/examples');
    if (m === 'build') tests.add('Run build/CI check');
    if (m === 'report') tests.add('Report/export preview');
    if (m === 'admin') tests.add('Admin/settings page check');
  }
  if (!tests.size) tests.add('Open changed page and test old + new case');
  return Array.from(tests);
}

app.post('/api/open-vscode', async (req, res) => {
  const { root, filePath, lineNumber } = req.body || {};
  const rootCheck = validateRoot(root);
  if (!rootCheck.ok) return res.status(rootCheck.status).json({ ok: false, message: rootCheck.message });
  if (!filePath || !fs.existsSync(filePath)) return res.status(400).json({ ok: false, message: 'File not found.' });

  const resolvedFile = path.resolve(filePath);
  if (!isPathInside(resolvedFile, rootCheck.root)) {
    return res.status(403).json({ ok: false, message: 'File is outside the selected root folder.' });
  }

  const target = `${resolvedFile}:${lineNumber || 1}`;
  execFile('code', ['-g', target], { windowsHide: true }, (err) => {
    if (err) return res.status(500).json({ ok: false, message: 'Unable to open VS Code. Make sure the `code` command is installed in PATH.' });
    res.json({ ok: true });
  });
});

app.post('/api/install-rg', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const platform = os.platform();
  let command, args;
  if (platform === 'win32') {
    command = 'winget';
    args = ['install', 'BurntSushi.ripgrep.MSVC', '--accept-source-agreements', '--accept-package-agreements'];
  } else if (platform === 'darwin') {
    command = 'brew';
    args = ['install', 'ripgrep'];
  } else {
    command = 'apt-get';
    args = ['install', '-y', 'ripgrep'];
  }

  const send = (event, data) => {
    if (!res.writableEnded) res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  const child = spawn(command, args, { shell: false, windowsHide: true, env: process.env });

  const emitLines = (chunk) => {
    chunk.toString('utf8').split(/\r?\n/).forEach((line) => {
      if (line.trim()) send('log', { line });
    });
  };

  child.stdout.on('data', emitLines);
  child.stderr.on('data', emitLines);

  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    child.kill();
    send('done', { ok: false, message: 'Installation timed out after 2 minutes.' });
    res.end();
  }, 120000);

  child.on('error', (err) => {
    clearTimeout(timer);
    send('done', { ok: false, message: err.message });
    res.end();
  });

  child.on('close', async (code) => {
    if (timedOut) return;
    clearTimeout(timer);
    if (os.platform() === 'win32') await refreshWindowsPath();
    const verify = await runCommand('rg', ['--version']);
    send('done', {
      ok: verify.ok,
      needsRestart: !verify.ok,
      message: verify.ok
        ? 'ripgrep installed successfully.'
        : 'Installed but rg not found in PATH yet — restart the server.',
      rgVersion: verify.ok ? verify.stdout.split(/\r?\n/)[0] : null
    });
    res.end();
  });

  req.on('close', () => { clearTimeout(timer); child.kill(); });
});

app.listen(PORT, HOST, () => {
  console.log(`Codebase Search Assistant running at http://${HOST}:${PORT}`);
  if (ALLOWED_ROOTS.length) {
    console.log(`Allowed roots: ${ALLOWED_ROOTS.join(path.delimiter)}`);
  }
});
