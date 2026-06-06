// Google Analytics 4 — single source of truth for the Measurement ID.
// To change the property, edit GA_ID below only.
(function () {
  var GA_ID = 'G-2WE1QCBKKZ';

  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
  document.head.appendChild(s);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', GA_ID);
})();
