// NILZ — i18n core
// Bilingual EN / AR with RTL. Language is stored in localStorage and applied
// on load; switching language persists the choice and reloads so every
// dynamically-rendered piece re-renders cleanly in the chosen language.

const LANGS = ['en', 'ar'];
const STORE_KEY = 'nilz_lang';
let _dict = null;
const _refreshers = [];

// Register a callback that re-renders language-dependent content in place.
// Called (in order) by setLang after the new language is applied — no page reload.
export function onLangChange(fn) { if (typeof fn === 'function') _refreshers.push(fn); }

export function getLang() {
  // URL ?lang= wins once (lets us share a link in a language), then persists
  try {
    const url = new URLSearchParams(location.search).get('lang');
    if (url && LANGS.includes(url)) { localStorage.setItem(STORE_KEY, url); return url; }
  } catch (_) {}
  let l;
  try { l = localStorage.getItem(STORE_KEY); } catch (_) {}
  return LANGS.includes(l) ? l : 'en';
}

export function isAr() { return getLang() === 'ar'; }

export async function setLang(lang) {
  if (!LANGS.includes(lang) || lang === getLang()) return;
  try { localStorage.setItem(STORE_KEY, lang); } catch (_) {}
  // Drop any ?lang= from the URL (without navigating) so the stored choice wins
  try {
    const url = new URL(location.href);
    if (url.searchParams.has('lang')) { url.searchParams.delete('lang'); history.replaceState(null, '', url); }
  } catch (_) {}
  // Apply the new language in place — no reload, scroll position is preserved
  applyDir();
  for (const fn of _refreshers) {
    try { await fn(); } catch (e) { console.error('lang refresh failed', e); }
  }
  applyStatic();
  if (window.__revealFadeUps) window.__revealFadeUps();
}

// Set <html lang/dir> + a convenience class. Safe to call early and often.
export function applyDir() {
  const lang = getLang();
  const el = document.documentElement;
  el.lang = lang;
  el.dir = lang === 'ar' ? 'rtl' : 'ltr';
  el.classList.toggle('lang-ar', lang === 'ar');
}

export async function loadI18n() {
  if (_dict) return _dict;
  try {
    const res = await fetch('_data/i18n.json');
    _dict = await res.json();
  } catch (_) { _dict = {}; }
  return _dict;
}

// Load dictionary + set direction. Call (await) before rendering a page.
export async function initI18n() {
  applyDir();
  await loadI18n();
  return getLang();
}

// UI string by key
export function t(key) {
  const lang = getLang();
  const entry = _dict && _dict[key];
  if (!entry) return key;
  return (entry[lang] != null ? entry[lang] : entry.en) || '';
}

// Field on a data object: returns the `<key>_ar` variant when in Arabic and present,
// otherwise the base field. Use for projects.json / site.json content.
export function tf(obj, key) {
  if (!obj) return '';
  if (isAr()) {
    const v = obj[key + '_ar'];
    if (v !== undefined && v !== null && v !== '') return v;
  }
  return obj[key];
}

// Translate static markup: [data-i18n] → innerHTML, plus placeholder / aria-label.
export function applyStatic(root = document) {
  root.querySelectorAll('[data-i18n]').forEach(el => {
    const val = t(el.getAttribute('data-i18n'));
    if (val != null && val !== '') el.innerHTML = val;
  });
  root.querySelectorAll('[data-i18n-ph]').forEach(el => {
    const val = t(el.getAttribute('data-i18n-ph'));
    if (val) el.setAttribute('placeholder', val);
  });
  root.querySelectorAll('[data-i18n-aria]').forEach(el => {
    const val = t(el.getAttribute('data-i18n-aria'));
    if (val) el.setAttribute('aria-label', val);
  });
}

// Markup for the EN | العربية switch (active language is highlighted).
export function langSwitchHTML(extraClass = '') {
  const lang = getLang();
  return `
  <div class="lang-switch ${extraClass}" role="group" aria-label="Language / اللغة">
    <button type="button" class="lang-switch__btn${lang === 'en' ? ' is-active' : ''}" data-lang="en">EN</button>
    <span class="lang-switch__sep" aria-hidden="true">|</span>
    <button type="button" class="lang-switch__btn${lang === 'ar' ? ' is-active' : ''}" data-lang="ar">العربية</button>
  </div>`;
}

export function bindLangSwitch(root = document) {
  root.querySelectorAll('.lang-switch__btn').forEach(btn => {
    if (btn._bound) return;
    btn._bound = true;
    btn.addEventListener('click', () => setLang(btn.dataset.lang));
  });
}
