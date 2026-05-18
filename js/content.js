// W2/js/content.js
// Fetches _data/projects.json and _data/site.json
// Exposes loadProjects(), loadSite(), and render helpers

let _projects = null;
let _site     = null;

async function loadProjects() {
  if (_projects) return _projects;
  const res = await fetch('_data/projects.json');
  _projects = await res.json();
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
  return `
<article class="project-card" data-category="${p.category}">
  <div class="project-card__img" style="background-image:url('${p.image}')"></div>
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
    // Re-init IntersectionObserver for newly added cards
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
}

// ── Render CMS-managed text fields ─────────
async function renderSiteContent(pageKey) {
  const site = await loadSite();
  const data = site[pageKey];
  if (!data) return;

  // Replace [data-cms="key"] elements with content from site.json
  document.querySelectorAll('[data-cms]').forEach(el => {
    const key = el.dataset.cms;
    if (data[key] !== undefined) {
      if (typeof data[key] === 'string') {
        el.innerHTML = data[key].replace(/\n/g, '<br>');
      }
    }
  });
}

export { loadProjects, loadSite, renderHomeProjects, renderProjectsGrid, renderSiteContent };
