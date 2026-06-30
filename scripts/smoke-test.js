const { spawn } = require('child_process');
const path = require('path');

const root = path.resolve(__dirname, '..');
const port = String(process.env.SMOKE_PORT || 3199);
const baseUrl = `http://127.0.0.1:${port}`;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson(url, options = {}) {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

async function waitForServer() {
  for (let i = 0; i < 30; i += 1) {
    try {
      const { data } = await fetchJson(`${baseUrl}/api/health`);
      if (data.ok) return data;
    } catch (_) {
      await wait(250);
    }
  }
  throw new Error('Server did not become healthy.');
}

async function main() {
  const child = spawn(process.execPath, ['server.js'], {
    cwd: root,
    env: {
      ...process.env,
      PORT: port,
      HOST: '127.0.0.1',
      COMMAND_TIMEOUT_MS: '5000'
    },
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe']
  });

  let stdout = '';
  let stderr = '';
  child.stdout.on('data', (chunk) => { stdout += chunk.toString(); });
  child.stderr.on('data', (chunk) => { stderr += chunk.toString(); });

  try {
    const health = await waitForServer();
    if (!health.rgAvailable) throw new Error('rg is not available.');

    const searchBody = {
      root,
      query: 'searchWithRg',
      globs: ['*.js'],
      caseSensitive: false,
      context: 0,
      maxResults: 5,
      deepSearch: false
    };
    const search = await fetchJson(`${baseUrl}/api/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(searchBody)
    });
    if (!search.res.ok || !search.data.ok || search.data.count < 1) {
      throw new Error('Search smoke test failed.');
    }
    if (search.data.count > 5) {
      throw new Error('Search global maxResults cap failed.');
    }
    if (!Number.isFinite(search.data.durationMs)) {
      throw new Error('Search durationMs missing.');
    }

    const browse = await fetchJson(`${baseUrl}/api/browse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ root })
    });
    if (!browse.res.ok || !browse.data.ok || !Array.isArray(browse.data.entries)) {
      throw new Error('Browse smoke test failed.');
    }

    const invalid = await fetchJson(`${baseUrl}/api/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...searchBody, root: path.join(root, '__missing__') })
    });
    if (invalid.res.status !== 400) throw new Error('Invalid root should return 400.');

    const controller = new AbortController();
    const cancelPromise = fetch(`${baseUrl}/api/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...searchBody, query: 'function', maxResults: 1000 }),
      signal: controller.signal
    }).catch((err) => err.name);
    controller.abort();
    await cancelPromise;

    console.log('Smoke tests passed.');
  } finally {
    child.kill();
    if (stderr.trim()) console.error(stderr.trim());
    if (process.env.SMOKE_VERBOSE && stdout.trim()) console.log(stdout.trim());
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
