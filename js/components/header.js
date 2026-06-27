// W2/js/components/header.js
// Injects the site header into every page and handles:
// - Transparent → solid on scroll
// - Active nav link highlighting
// - Mobile hamburger toggle
// - Re-renders in place on language change (no reload)

import { t, langSwitchHTML, bindLangSwitch, onLangChange } from '../i18n.js';

function headerMarkup() {
  // Normalise: strip .html so both '/about' and '/about.html' match 'about.html'
  const currentSlug = (location.pathname.split('/').pop() || 'index').replace(/\.html$/, '');

  const pages = [
    { href: 'index.html',    key: 'nav.home' },
    { href: 'projects.html', key: 'nav.projects' },
    { href: 'about.html',    key: 'nav.about' },
    { href: 'contact.html',  key: 'nav.contact' },
  ];

  const navLinks = pages.map(p => {
    const slug   = p.href.replace(/\.html$/, '');
    const active = currentSlug === slug ? 'class="active"' : '';
    return `<li><a href="${p.href}" ${active}>${t(p.key)}</a></li>`;
  }).join('');

  return `
<header id="site-header">
  <div class="header-inner container">
    <a href="index.html" class="header-logo">
      <img src="assets/images/logo-white.webp" alt="NILZ" class="header-logo__img header-logo__img--white">
      <img src="assets/images/logo-blue.webp"  alt="NILZ" class="header-logo__img header-logo__img--blue">
    </a>
    <nav class="header-nav" id="header-nav">
      <ul>${navLinks}</ul>
      ${langSwitchHTML('lang-switch--mobile')}
    </nav>
    ${langSwitchHTML('lang-switch--desktop')}
    <a href="contact.html" class="btn btn--outline header-cta">${t('cta.start_project')}</a>
    <button class="header-burger" id="header-burger" aria-label="Toggle menu">
      <span></span><span></span><span></span>
    </button>
  </div>
</header>`;
}

// (Re)bind the per-element handlers on the current header DOM.
function bindHeader(setScrolled) {
  const header = document.getElementById('site-header');
  if (!header) return;
  bindLangSwitch(header);
  setScrolled();
  const burger = document.getElementById('header-burger');
  const nav    = document.getElementById('header-nav');
  burger.addEventListener('click', () => {
    nav.classList.toggle('open');
    burger.classList.toggle('open');
  });
}

export function initHeader() {
  document.body.insertAdjacentHTML('afterbegin', headerMarkup());

  // Scroll → solid header. Bound once on window; queries the live header each time
  // so it keeps working after the header is rebuilt on a language switch.
  const setScrolled = () => {
    const h = document.getElementById('site-header');
    if (h) h.classList.toggle('scrolled', window.scrollY > 60);
  };
  window.addEventListener('scroll', setScrolled, { passive: true });

  bindHeader(setScrolled);

  // Language switch → rebuild the header in place (nav labels, CTA, switch state)
  onLangChange(() => {
    const old = document.getElementById('site-header');
    if (!old) return;
    old.insertAdjacentHTML('beforebegin', headerMarkup());
    old.remove();
    bindHeader(setScrolled);
  });
}
