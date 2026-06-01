let _projects = null;
let _site     = null;

async function loadProjects() {
  if (_projects) return _projects;
  const res = await fetch('_data/projects.json');
  _projects = (await res.json()).projects;
  return _projects;
}

async function loadSite() {
  if (_site) return _site;
  const res = await fetch('_data/site.json');
  _site = await res.json();
  return _site;
}

// ── Project card HTML ──────────────────────
function projectCardHTML(p) {
  const hasSlides = Array.isArray(p.slides) && p.slides.length > 0;
  return `
<article class="project-card ${hasSlides ? 'project-card--clickable' : ''}" data-category="${p.category}" data-project-id="${p.id}">
  <div class="project-card__img" style="background-image:url('${p.image}')">
    ${hasSlides ? `<span class="project-card__view">View Project Details<span class="project-card__view-icon">→</span></span>` : ''}
  </div>
  <div class="project-card__body">
    <span class="project-card__cat">${p.category}</span>
    <h3 class="project-card__title">${p.title}</h3>
    <p class="project-card__loc">${p.location}</p>
    <p class="project-card__desc">${p.description}</p>
  </div>
</article>`;
}

// ── Stacked project card (home page) ───────
function stackedCardHTML(p, idx) {
  const isEven = idx % 2 === 0;
  return `
<div class="stack-card fade-up ${isEven ? '' : 'stack-card--reverse'}">
  <div class="stack-card__img" style="background-image:url('${p.image}')"></div>
  <div class="stack-card__body">
    <span class="section-tag">${p.category}</span>
    <h2 class="stack-card__title">${p.title}</h2>
    <p class="stack-card__loc">${p.location}</p>
    <p class="stack-card__desc">${p.description}</p>
    <a href="projects.html" class="btn btn--outline" style="margin-top:28px">Explore Projects</a>
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

// ── Render projects grid with filter ───────
async function renderProjectsGrid(containerSelector, filterSelector) {
  const container = document.querySelector(containerSelector);
  if (!container) return;
  const projects  = await loadProjects();

  function render(filter) {
    const filtered = filter === 'All'
      ? projects
      : projects.filter(p => p.category === filter);
    container.innerHTML = filtered.map(p => projectCardHTML(p)).join('');
    if (window.__initFadeUps) window.__initFadeUps();
  }

  render('All');

  if (filterSelector) {
    document.querySelectorAll(filterSelector).forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll(filterSelector).forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        render(btn.dataset.filter);
      });
    });
  }

  // Open project overlay on card click
  initProjectViewer(projects, container);
}

/* ════════════════════════════════════════════
   Full-screen project viewer (overlay slideshow)
   ════════════════════════════════════════════ */
function initProjectViewer(projects, gridEl) {
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
          <p class="pv__overview"></p>
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
    overview: overlay.querySelector('.pv__overview'),
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
    els.overview.textContent = p.overview || p.description || '';
    els.total.textContent = slides.length;

    els.slides.innerHTML = slides.map((s, i) =>
      `<div class="pv__slide">
        <div class="pv__slide-img" style="background-image:url('${s.image}')"></div>
        <div class="pv__slide-text">
          <span class="pv__slide-num">${String(i + 1).padStart(2, '0')}</span>
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
    document.body.style.overflow = 'hidden';
  }

  function close() {
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
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

  // [data-cms="key"] → innerHTML
  document.querySelectorAll('[data-cms]').forEach(el => {
    const key = el.dataset.cms;
    if (data[key] !== undefined && typeof data[key] === 'string') {
      el.innerHTML = data[key].replace(/\n/g, '<br>');
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

export { loadProjects, loadSite, renderHomeProjects, renderProjectsGrid, renderSiteContent };
