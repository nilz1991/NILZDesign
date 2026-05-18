// W2/js/components/cta.js
export function initCTA(targetSelector = '#cta-placeholder') {
  const html = `
<section class="section section--navy cta-section">
  <div class="container cta-inner">
    <p class="section-tag" style="color:var(--gold)">Let's Build Your Dream</p>
    <h2 class="section-title cta-title fade-up">Is it time to elevate your<br>project to the next level?</h2>
    <p class="cta-body fade-up delay-1">Let's elevate your project — get in touch and discover how we can make it happen.</p>
    <a href="contact.html" class="btn btn--gold fade-up delay-2">Contact Us Today</a>
  </div>
</section>`;

  const target = document.querySelector(targetSelector);
  if (target) target.outerHTML = html;
  else document.body.insertAdjacentHTML('beforeend', html);
}
