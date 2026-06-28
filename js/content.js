import { t, tf } from './i18n.js';

let _data = null;
let _site = null;

async function loadData() {
  if (_data) return _data;
  const res = await fetch('_data/projects.json');
  _data = await res.json();
  return _data;
}

async function loadProjects() {
  return (await loadData()).projects;
}

async function loadCollections() {
  return (await loadData()).collections || [];
}

async function loadSite() {
  if (_site) return _site;
  const res = await fetch('_data/site.json');
  _site = await res.json();
  return _site;
}

// ── Project / collection card HTML ─────────
// item.category stays the canonical (English) value used for filtering;
// item.categoryLabel is the localised text shown on the card.
function gridCardHTML(item) {
  return `
<a class="project-card project-card--clickable" href="${item.href}" data-category="${item.category}">
  <div class="project-card__img" style="background-image:url('${item.image}')">
    ${item.badge ? `<span class="project-card__badge">${item.badge}</span>` : ''}
    <span class="project-card__view">${item.cta || t('card.view_details')}<span class="project-card__view-icon">→</span></span>
  </div>
  <div class="project-card__body">
    <span class="project-card__cat">${item.categoryLabel || item.category}</span>
    <h3 class="project-card__title">${item.title}</h3>
    <p class="project-card__loc">${item.location || ''}</p>
    <p class="project-card__desc">${item.description}</p>
  </div>
</a>`;
}

// Normalize a project into a grid item (links to its detail page)
function projectToItem(p) {
  return {
    href: `project.html?id=${p.id}`,
    image: p.image, category: p.category, categoryLabel: tf(p, 'category'),
    title: tf(p, 'title'),
    location: tf(p, 'location'), description: tf(p, 'description'),
  };
}

// ── Stacked project card (home page) ───────
function stackedCardHTML(p, idx) {
  const isEven = idx % 2 === 0;
  return `
<div class="stack-card fade-up ${isEven ? '' : 'stack-card--reverse'}">
  <div class="stack-card__img" style="background-image:url('${p.image}')"></div>
  <div class="stack-card__body">
    <h2 class="stack-card__title">${tf(p, 'homeTitle') || tf(p, 'title')}</h2>
    <p class="stack-card__desc">${tf(p, 'homeDescription') || tf(p, 'description')}</p>
  </div>
</div>`;
}

// ── Render home stacked cards ───────────────
async function renderHomeProjects(containerSelector) {
  const container = document.querySelector(containerSelector);
  if (!container) return;
  const projects = await loadProjects();
  const featured = projects.filter(p => p.featured).slice(0, 4);
  container.innerHTML = featured.map((p, i) => stackedCardHTML(p, i)).join('');
}

// ── Render home software / tools strip ──────
async function renderHomeSoftware(containerSelector) {
  const container = document.querySelector(containerSelector);
  if (!container) return;
  const site = await loadSite();
  const list = (site.home && site.home.software) || [];
  if (!list.length) { container.innerHTML = ''; return; }
  const label = (site.home && tf(site.home, 'software_label')) || 'Software & Tools';
  container.innerHTML = `
    <div class="container">
      <span class="section-tag home-software__label">${label}</span>
      <ul class="home-software__grid">
        ${list.map(s => `<li class="home-software__item">
          <span class="home-software__use">${tf(s, 'use')}</span>
          <span class="home-software__name">${(s.names || [s.name]).join(' · ')}</span>
        </li>`).join('')}
      </ul>
    </div>`;
}

// Normalize a collection into a grid item (links to its collection page)
function collectionToItem(col, count) {
  return {
    href: `collection.html?id=${col.id}`,
    image: col.image, category: col.category, categoryLabel: tf(col, 'category'),
    title: tf(col, 'title'),
    location: tf(col, 'location'), description: tf(col, 'description'),
    badge: count > 0 ? `${count} ${t('card.projects_count')}` : '',
    cta: t('card.view_collection'),
  };
}

// Order categories appear in on the Projects page
const CATEGORY_ORDER = [
  'Interior Design',
  'Exterior Design',
  'Engineering & Technical Drawings',
  'Visualization & Animation',
];

// ── Render projects grid, grouped by category with a heading per group ──
async function renderProjectsGrid(containerSelector) {
  const container = document.querySelector(containerSelector);
  if (!container) return;
  const data = await loadData();
  const projects = data.projects;
  const collections = data.collections || [];

  // Build items in project order; members of a collection collapse to one card.
  const seen = new Set();
  const items = [];
  for (const p of projects) {
    if (p.collection) {
      if (seen.has(p.collection)) continue;
      seen.add(p.collection);
      const col = collections.find(c => c.id === p.collection);
      if (!col) continue;
      const count = projects.filter(x => x.collection === p.collection).length;
      items.push(collectionToItem(col, count));
    } else {
      items.push(projectToItem(p));
    }
  }
  // Include collections that have no member projects yet (placeholders)
  for (const col of collections) {
    if (!seen.has(col.id)) { seen.add(col.id); items.push(collectionToItem(col, 0)); }
  }

  // Group by canonical category, ordered by CATEGORY_ORDER
  const groups = new Map();
  for (const it of items) {
    if (!groups.has(it.category)) groups.set(it.category, []);
    groups.get(it.category).push(it);
  }
  const cats = [...groups.keys()].sort((a, b) => {
    const ia = CATEGORY_ORDER.indexOf(a), ib = CATEGORY_ORDER.indexOf(b);
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
  });

  container.innerHTML = cats.map(cat => {
    const list = groups.get(cat);
    const heading = list[0].categoryLabel || cat;
    return `
      <div class="projects-group">
        <h2 class="projects-cat-title fade-up">${heading}</h2>
        <div class="projects-grid">${list.map(gridCardHTML).join('')}</div>
      </div>`;
  }).join('');
  if (window.__initFadeUps) window.__initFadeUps();
}

// ── Render a collection page (cards for the collection's projects) ──
async function renderCollection(collectionId, containerSelector) {
  const container = document.querySelector(containerSelector);
  if (!container) return null;
  const data = await loadData();
  const col = (data.collections || []).find(c => c.id === collectionId);
  const members = data.projects.filter(p => p.collection === collectionId);
  container.innerHTML = members.map(p => gridCardHTML(projectToItem(p))).join('');
  if (window.__initFadeUps) window.__initFadeUps();
  return col;
}

/* ════════════════════════════════════════════
   (Project detail is handled by project.html)
   ════════════════════════════════════════════ */
function _unused_initProjectViewer(projects, gridEl) {
  const byId = Object.fromEntries(projects.map(p => [p.id, p]));

  // Build overlay DOM once
  let overlay = document.getElementById('project-viewer');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'project-viewer';
    overlay.className = 'pv';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML = `
      <button class="pv__close" aria-label="Close">&times;</button>
      <div class="pv__panel">
        <aside class="pv__info">
          <span class="pv__cat"></span>
          <h2 class="pv__title"></h2>
          <p class="pv__loc"></p>
          <div class="pv__counter"><span class="pv__current">1</span> / <span class="pv__total">1</span></div>
        </aside>
        <div class="pv__stage">
          <div class="pv__slides"></div>
          <button class="pv__nav pv__nav--prev" aria-label="Previous">&#8592;</button>
          <button class="pv__nav pv__nav--next" aria-label="Next">&#8594;</button>
          <div class="pv__dots"></div>
        </div>
      </div>`;
    document.body.appendChild(overlay);
  }

  const els = {
    close:    overlay.querySelector('.pv__close'),
    cat:      overlay.querySelector('.pv__cat'),
    title:    overlay.querySelector('.pv__title'),
    loc:      overlay.querySelector('.pv__loc'),
    slides:   overlay.querySelector('.pv__slides'),
    dots:     overlay.querySelector('.pv__dots'),
    prev:     overlay.querySelector('.pv__nav--prev'),
    next:     overlay.querySelector('.pv__nav--next'),
    current:  overlay.querySelector('.pv__current'),
    total:    overlay.querySelector('.pv__total'),
  };

  let slides = [];
  let index = 0;

  function show(i) {
    index = (i + slides.length) % slides.length;
    els.slides.style.transform = `translateX(-${index * 100}%)`;
    els.current.textContent = index + 1;
    overlay.querySelectorAll('.pv__dot').forEach((d, di) =>
      d.classList.toggle('active', di === index));
  }

  function open(p) {
    slides = p.slides || [];
    if (!slides.length) return;
    index = 0;

    els.cat.textContent = p.category;
    els.title.textContent = p.title;
    els.loc.textContent = p.location;
    els.total.textContent = slides.length;

    const overview = p.overview || p.description || '';
    els.slides.innerHTML = slides.map((s, i) =>
      `<div class="pv__slide">
        <div class="pv__slide-img" style="background-image:url('${s.image}')"></div>
        <div class="pv__slide-text">
          <span class="pv__slide-num">${String(i + 1).padStart(2, '0')}</span>
          ${i === 0 && overview ? `<p class="pv__slide-overview">${overview}</p>` : ''}
          <p class="pv__slide-caption">${s.caption || ''}</p>
        </div>
      </div>`).join('');
    els.dots.innerHTML = slides.map((_, i) =>
      `<button class="pv__dot ${i === 0 ? 'active' : ''}" data-i="${i}" aria-label="Slide ${i + 1}"></button>`).join('');
    els.dots.querySelectorAll('.pv__dot').forEach(d =>
      d.addEventListener('click', () => show(+d.dataset.i)));

    show(0);
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
  }

  function close() {
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
  }

  // Card clicks (delegated)
  gridEl.addEventListener('click', (e) => {
    const card = e.target.closest('.project-card--clickable');
    if (!card) return;
    const p = byId[card.dataset.projectId];
    if (p) open(p);
  });

  els.close.addEventListener('click', close);
  els.prev.addEventListener('click', () => show(index - 1));
  els.next.addEventListener('click', () => show(index + 1));
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

  document.addEventListener('keydown', (e) => {
    if (!overlay.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') show(index - 1);
    if (e.key === 'ArrowRight') show(index + 1);
  });
}

// ── Render CMS-managed text and href fields ─
async function renderSiteContent(pageKey) {
  const site = await loadSite();
  const data = site[pageKey];
  if (!data) return;

  // [data-cms="key"] → innerHTML (prefers the `<key>_ar` value in Arabic)
  document.querySelectorAll('[data-cms]').forEach(el => {
    const key = el.dataset.cms;
    const val = tf(data, key);
    if (val !== undefined && typeof val === 'string') {
      el.innerHTML = val.replace(/\n/g, '<br>');
    }
  });

  // [data-cms-href="key"] → href attribute
  document.querySelectorAll('[data-cms-href]').forEach(el => {
    const key = el.dataset.cmsHref;
    if (data[key] !== undefined && typeof data[key] === 'string') {
      el.href = data[key];
    }
  });

  // Phone tel: link — derive from phone field
  if (data.phone) {
    const telLink = document.querySelector('a[href^="tel:"][data-cms="phone"]');
    if (telLink) {
      telLink.href = 'tel:' + data.phone.replace(/\s/g, '');
    }
  }
}

export { loadData, loadProjects, loadCollections, loadSite, renderHomeProjects, renderHomeSoftware, renderProjectsGrid, renderCollection, renderSiteContent };
