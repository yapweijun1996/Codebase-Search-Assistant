// Cursor-following tooltip engine. Help text comes from the TOOLTIPS SSOT in
// i18n; tt(key) reads the current language live, so switching language updates
// tooltips without re-attaching listeners.

import { $ } from '../core/dom.js';
import { TOOLTIPS, tt } from '../core/i18n.js';

export function mountTooltips() {
  const tooltipEl = $('tooltip');

  function position(e) {
    const gap = 16;
    const tw = tooltipEl.offsetWidth;
    const th = tooltipEl.offsetHeight;
    let x = e.clientX + gap;
    let y = e.clientY + gap;
    if (x + tw > window.innerWidth - 8) x = e.clientX - tw - gap;
    if (y + th > window.innerHeight - 8) y = e.clientY - th - gap;
    tooltipEl.style.left = `${x}px`;
    tooltipEl.style.top = `${y}px`;
  }

  document.addEventListener('mousemove', (e) => {
    if (tooltipEl.classList.contains('visible')) position(e);
  });

  Object.keys(TOOLTIPS.en).forEach((key) => {
    const el = key.startsWith('tab-')
      ? document.querySelector(`.tab[data-tab="${key.slice(4)}"]`)
      : $(key);
    if (!el) return;
    el.addEventListener('mouseenter', (e) => {
      const text = tt(key);
      if (!text) return;
      tooltipEl.textContent = text;
      tooltipEl.classList.add('visible');
      position(e);
    });
    el.addEventListener('mouseleave', () => tooltipEl.classList.remove('visible'));
  });
}
