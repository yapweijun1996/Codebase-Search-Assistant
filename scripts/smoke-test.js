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

// Consume the Server-Sent-Events search stream: collect "result" items and the
// final "done" payload.
async function fetchSearch(body, options = {}) {
  const res = await fetch(`${baseUrl}/api/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: options.signal
  });
  if (!res.ok) return { res, results: [], done: null };

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  const results = [];
  let done = null;

  while (true) {
    const chunk = await reader.read();
    if (chunk.done) break;
    buffer += decoder.decode(chunk.value, { stream: true });
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
      let data;
      try { data = JSON.parse(dataStr); } catch (_) { continue; }
      if (event === 'result') results.push(data);
      else if (event === 'done') done = data;
    }
  }
  return { res, results, done };
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
    const search = await fetchSearch(searchBody);
    if (!search.res.ok || !search.done || !search.done.ok || search.done.count < 1) {
      throw new Error('Search smoke test failed.');
    }
    if (search.done.count > 5) {
      throw new Error('Search global maxResults cap failed.');
    }
    if (search.results.length !== search.done.count) {
      throw new Error('Streamed result count does not match done.count.');
    }
    if (!Number.isFinite(search.done.durationMs)) {
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

    const invalid = await fetch(`${baseUrl}/api/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...searchBody, root: path.join(root, '__missing__') })
    });
    if (invalid.status !== 400) throw new Error('Invalid root should return 400.');

    // Cancel mid-flight: abort should reject the fetch without hanging.
    const controller = new AbortController();
    const cancelPromise = fetchSearch({ ...searchBody, query: 'function', maxResults: 1000 }, { signal: controller.signal })
      .then(() => 'completed')
      .catch((err) => err.name);
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
