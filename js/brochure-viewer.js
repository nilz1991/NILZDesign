// Page-by-page brochure viewer for /lidoma/ (view only, no download link).
// Reads lidoma/brochure/pages.json ({en:[...], ar:[...]}, each page {f,t,w,h,single,tour?,phone?}). The cover's f is its lower
// half on every screen; the back cover's f is widened for desktop and phone holds the plain page.
// Desktop: one spread per view. Phone: every spread is split, so a page fills the screen width.
// A page with a tour QR also gets an open-the-tour button: nobody can scan a screen with the phone that shows it.
// The handlers below only stop casual saving; a screenshot cannot be blocked.

import { isAr, onLangChange, applyStatic } from './i18n.js';

const BASE = 'lidoma/brochure/';
const NARROW = '(max-width: 760px)';

export async function initBrochureViewer(root) {
  let data;
  try {
    const res = await fetch(BASE + 'pages.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error(res.status);
    data = await res.json();
  } catch (_) {
    return { count: 0, hasArabic: false };
  }
  const hasArabic = !!(data.ar && data.ar.length);
  const pagesForLang = () => (isAr() && hasArabic ? data.ar : data.en);
  if (!pagesForLang().length) return { count: 0, hasArabic };

  root.innerHTML = `
    <div class="bv" tabindex="0" dir="ltr">
      <div class="bv-stage">
        <div class="bv-page"><img alt="" draggable="false"></div>
        <div class="bv-shield" aria-hidden="true"></div>
        <a class="bv-tour" data-i18n="lidoma.tour_open" hidden>Open the tour</a>
        <button type="button" class="bv-nav bv-nav--prev" data-i18n-aria="lidoma.prev">&#8249;</button>
        <button type="button" class="bv-nav bv-nav--next" data-i18n-aria="lidoma.next">&#8250;</button>
        <button type="button" class="bv-full" data-i18n-aria="lidoma.fullscreen" hidden>&#x26F6;</button>
        <span class="bv-count"></span>
      </div>
      <div class="bv-thumbs"></div>
    </div>`;

  const bv     = root.querySelector('.bv');
  const stage  = root.querySelector('.bv-stage');
  const pageEl = root.querySelector('.bv-page');
  const img    = pageEl.querySelector('img');
  const count  = root.querySelector('.bv-count');
  const tour   = root.querySelector('.bv-tour');
  const prev  = root.querySelector('.bv-nav--prev');
  const next   = root.querySelector('.bv-nav--next');
  const full   = root.querySelector('.bv-full');
  const thumbs = root.querySelector('.bv-thumbs');
  const mq     = window.matchMedia(NARROW);

  let pages = [];   // brochure pages (spreads / singles)
  let slides = [];  // what one view shows: {page, side}, side is '' | 'l' | 'r'
  let index = 0;

  const fileOf = (p) => BASE + (mq.matches && p.phone ? p.phone : p.f);

  function buildSlides() {
    slides = [];
    pages.forEach((p, i) => {
      if (mq.matches && !p.single) {
        slides.push({ page: i, side: 'l' }, { page: i, side: 'r' });
      } else {
        slides.push({ page: i, side: '' });
      }
    });
  }

  function preload(i) {
    const s = slides[i];
    if (s) { const im = new Image(); im.src = fileOf(pages[s.page]); }
  }

  function show(i) {
    index = Math.max(0, Math.min(slides.length - 1, i));
    const s = slides[index];
    const p = pages[s.page];
    stage.classList.toggle('is-half', !!s.side || !!(mq.matches && p.phone));
    pageEl.classList.toggle('is-half', !!s.side);
    pageEl.classList.toggle('is-left', s.side === 'l');
    pageEl.classList.toggle('is-right', s.side === 'r');
    const src = fileOf(p);
    if (img.getAttribute('src') !== src) {
      img.classList.add('is-loading');
      img.onload = () => img.classList.remove('is-loading');
      img.src = src;
    }
    tour.hidden = !p.tour;
    if (p.tour) tour.href = p.tour;
    count.textContent = `${index + 1} / ${slides.length}`;
    prev.disabled = index === 0;
    next.disabled = index === slides.length - 1;
    thumbs.querySelectorAll('button').forEach((b, n) => {
      const on = n === s.page;
      b.classList.toggle('is-active', on);
      if (on) thumbs.scrollTo({ left: b.offsetLeft - (thumbs.clientWidth - b.clientWidth) / 2, behavior: 'smooth' });
    });
    preload(index + 1);
    preload(index - 1);
  }

  function renderPages() {
    const keep = slides[index] ? slides[index].page : 0;
    pages = pagesForLang();
    buildSlides();
    thumbs.innerHTML = pages.map((p, i) =>
      `<button type="button" class="${p.single ? 'is-single' : ''}" data-page="${i}" aria-label="${i + 1}">` +
      `<img src="${BASE}${p.t}" alt="" loading="lazy" draggable="false"></button>`).join('');
    show(slides.findIndex(s => s.page === keep));
  }

  prev.addEventListener('click', () => show(index - 1));
  next.addEventListener('click', () => show(index + 1));
  thumbs.addEventListener('click', e => {
    const b = e.target.closest('button[data-page]');
    if (b) show(slides.findIndex(s => s.page === Number(b.dataset.page)));
  });
  bv.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft')  { e.preventDefault(); show(index - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); show(index + 1); }
  });

  // Swipe
  let startX = null, startY = 0;
  stage.addEventListener('touchstart', e => {
    startX = e.touches[0].clientX; startY = e.touches[0].clientY;
  }, { passive: true });
  stage.addEventListener('touchend', e => {
    if (startX === null) return;
    const dx = e.changedTouches[0].clientX - startX;
    const dy = e.changedTouches[0].clientY - startY;
    startX = null;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) show(index + (dx < 0 ? 1 : -1));
  }, { passive: true });

  // Full screen (not offered on phones, where a page already fills the width)
  const showFullBtn = () => { full.hidden = mq.matches || !stage.requestFullscreen; };
  full.addEventListener('click', () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else stage.requestFullscreen().catch(() => {});
  });

  mq.addEventListener('change', () => { renderPages(); showFullBtn(); });

  // No save-image menu, no dragging the page out
  ['contextmenu', 'dragstart', 'selectstart'].forEach(ev =>
    bv.addEventListener(ev, e => e.preventDefault()));

  onLangChange(() => { renderPages(); });

  renderPages();
  showFullBtn();
  applyStatic(root);
  return { count: pages.length, hasArabic };
}
