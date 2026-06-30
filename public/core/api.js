// SSOT for every server call. Components never call fetch() directly.

import { t } from './i18n.js';

async function post(path, body, signal) {
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

async function get(path) {
  const res = await fetch(path);
  return res.json();
}

// Generic Server-Sent-Events POST. Calls onEvent(eventName, data) for each
// "event: …\n data: {json}" block. Throws on non-OK HTTP before streaming.
async function streamSSE(path, body, onEvent, signal) {
  const init = { method: 'POST', signal };
  if (body != null) {
    init.headers = { 'Content-Type': 'application/json' };
    init.body = JSON.stringify(body);
  }
  const res = await fetch(path, init);
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
      let data;
      try { data = JSON.parse(dataStr); } catch (_) { continue; }
      onEvent(event, data);
    }
  }
}

export const api = {
  health: () => get('/api/health'),
  config: () => get('/api/config'),
  browse: (root) => post('/api/browse', { root }),
  selectFolder: (root) => post('/api/select-folder', { root }),
  revealFolder: (root) => post('/api/reveal-folder', { root }),
  impact: (body, signal) => post('/api/impact', body, signal),
  gitRisk: (body, signal) => post('/api/git-risk', body, signal),
  openVscode: (body) => post('/api/open-vscode', body),
  search: (body, onEvent, signal) => streamSSE('/api/search', body, onEvent, signal),
  installRg: (onEvent, signal) => streamSSE('/api/install-rg', null, onEvent, signal)
};
