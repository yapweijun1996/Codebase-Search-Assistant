// Pure formatting/helpers: duration, badges, match highlighting, clipboard,
// and the "Copy for AI" markdown builders. No DOM event wiring here.

import { escapeHtml } from './dom.js';
import { t } from './i18n.js';

export function formatDuration(ms) {
  const value = Number(ms);
  if (!Number.isFinite(value)) return null;
  if (value < 1000) return t('duration', { ms: value });
  return `${(value / 1000).toFixed(2)} s`;
}

// Render a code line into `el`, wrapping ripgrep submatches in <mark>.
export function renderCodeLine(el, line, submatches) {
  if (!submatches || !submatches.length) { el.textContent = line; return; }
  let html = '';
  let pos = 0;
  for (const m of submatches) {
    if (m.start > pos) html += escapeHtml(line.slice(pos, m.start));
    html += `<mark class="match-highlight">${escapeHtml(line.slice(m.start, m.end))}</mark>`;
    pos = m.end;
  }
  if (pos < line.length) html += escapeHtml(line.slice(pos));
  el.innerHTML = html;
}

export async function copyToClipboard(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch (_) { return false; }
}

// Copy the text stashed on btn._copyText and briefly flash a confirmation.
export async function flashCopy(btn) {
  const origHTML = btn.innerHTML;
  const ok = await copyToClipboard(btn._copyText || '');
  btn.textContent = ok ? 'Copied!' : 'Failed';
  setTimeout(() => { btn.innerHTML = origHTML; }, 1800);
}

export function formatSearchForAI(store) {
  const lines = [
    `## Codebase Search: "${store.query}"`,
    `Project: ${store.root}`,
    `Matches: ${store.matchCount} | Files: ${store.fileCount}${store.duration ? ' | ' + store.duration : ''}`,
    ''
  ];
  const fileMap = new Map();
  for (const r of store.results) {
    const key = r.relativePath || r.path;
    if (!fileMap.has(key)) fileMap.set(key, []);
    fileMap.get(key).push(r);
  }
  for (const [file, rows] of fileMap) {
    lines.push(`### ${file}  (${rows.length} match${rows.length > 1 ? 'es' : ''})`);
    for (const r of rows) lines.push(`Line ${r.lineNumber}: ${(r.line || '').trim()}`);
    lines.push('');
  }
  return lines.join('\n');
}

export function formatImpactForAI(store) {
  const lines = [
    `## Impact Report: "${store.target}"`,
    `Project: ${store.root}`,
    `Risk: ${store.risk} | Usages: ${store.usageCount} | Modules: ${store.modules.join(', ') || 'none'}`,
    ''
  ];
  const fileMap = new Map();
  for (const r of store.results) {
    const key = r.relativePath || r.path;
    if (!fileMap.has(key)) fileMap.set(key, []);
    fileMap.get(key).push(r);
  }
  for (const [file, rows] of fileMap) {
    lines.push(`### ${file}`);
    for (const r of rows) lines.push(`Line ${r.lineNumber}: ${(r.line || '').trim()}`);
    lines.push('');
  }
  return lines.join('\n');
}

export function formatGitForAI(store) {
  const lines = [
    `## Git Risk Brief`,
    `Project: ${store.root}`,
    `Changed: ${store.changedCount} files`,
    ''
  ];
  for (const f of store.files) {
    const icon = f.risk === 'HIGH' ? '⚠' : f.risk === 'MEDIUM' ? '~' : '✓';
    lines.push(`${icon} ${f.risk}  ${f.file}  (${f.usageCount} refs)${f.modules.length ? '  [' + f.modules.join(', ') + ']' : ''}`);
    if (f.suggestedTests.length) lines.push(`  Tests: ${f.suggestedTests.join(' · ')}`);
  }
  lines.push('');
  return lines.join('\n');
}
