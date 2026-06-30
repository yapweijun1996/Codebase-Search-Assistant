// Tiny DOM helpers shared by every component.

export const $ = (id) => document.getElementById(id);
export const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"]/g, (m) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'
  }[m]));
}

// Translate every [data-i18n] / [data-i18n-placeholder] node under `root`.
export function applyI18n(t, root = document) {
  $$('[data-i18n]', root).forEach((node) => {
    node.textContent = t(node.dataset.i18n);
  });
  $$('[data-i18n-placeholder]', root).forEach((node) => {
    node.placeholder = t(node.dataset.i18nPlaceholder);
  });
}
