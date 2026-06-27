// W2/js/main.js
// Scroll-driven animations using IntersectionObserver

export function initFadeUps() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));

  // Expose for content.js to call after dynamic renders
  window.__initFadeUps = initFadeUps;
}

// Instantly reveal every fade-up element (used after an in-place language switch,
// where freshly rendered elements would otherwise start hidden with no observer).
export function revealFadeUps() {
  document.querySelectorAll('.fade-up').forEach(el => el.classList.add('visible'));
}
window.__revealFadeUps = revealFadeUps;

export function initMarquee() {
  const track = document.querySelector('.marquee-track');
  if (!track) return;
  // Clone the inner content for seamless loop
  const inner = track.querySelector('.marquee-inner');
  if (inner) {
    const clone = inner.cloneNode(true);
    track.appendChild(clone);
  }
}

export function init() {
  initFadeUps();
  initMarquee();
}
