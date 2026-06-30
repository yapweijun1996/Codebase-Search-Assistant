// Small DOM "write" helpers for badges, summary toasts, and inline errors.

import { $, escapeHtml } from './dom.js';

export function badge(text, level) {
  const cls = level ? ` ${level.toLowerCase()}` : '';
  return `<span class="badge${cls}">${escapeHtml(text)}</span>`;
}

export function toastSummary(targetId, items) {
  $(targetId).innerHTML = items.map((item) => badge(item.text, item.level)).join('');
}

export function showError(targetId, message) {
  $(targetId).innerHTML = `<div class="error">${escapeHtml(message)}</div>`;
}
