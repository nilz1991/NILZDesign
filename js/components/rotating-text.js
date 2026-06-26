// W2/js/components/rotating-text.js
// Renders a brand-statement section.
// Pass decorativeImage to get a two-column layout with the image on the right.
export function initRotatingText(targetSelector = '#rotating-text-placeholder', opts = {}) {
  const {
    tag            = 'Our Approach',
    headline       = 'One studio.',
    headlineEm     = 'Every discipline.',
    sub            = 'Architecture, interiors, landscape, and visualization — all under one roof, one vision, one team.',
    ctaLabel       = 'Explore Our Services',
    ctaHref        = 'index.html#services',
    decorativeImage = null,
  } = opts;

  const html = decorativeImage ? `
<section class="section section--cream statement-section statement-section--split">
  <div class="container statement-split">
    <div class="statement-body">
      <span class="section-tag">${tag}</span>
      <h2 class="section-title statement-headline">${headline}<br><em>${headlineEm}</em></h2>
      <p class="statement-sub">${sub}</p>
      <a href="${ctaHref}" class="btn btn--solid statement-cta">${ctaLabel}</a>
    </div>
    <div class="statement-art">
      <img src="${decorativeImage}" alt="" class="statement-art__img" aria-hidden="true">
    </div>
  </div>
</section>` : `
<section class="section section--cream statement-section">
  <div class="container statement-inner">
    <span class="section-tag">${tag}</span>
    <h2 class="section-title statement-headline">${headline}<br><em>${headlineEm}</em></h2>
    <p class="statement-sub">${sub}</p>
    <a href="${ctaHref}" class="btn btn--solid statement-cta">${ctaLabel}</a>
  </div>
</section>`;

  const target = document.querySelector(targetSelector);
  if (target) target.outerHTML = html;
  else document.querySelector('#cta-placeholder, footer').insertAdjacentHTML('beforebegin', html);
}
