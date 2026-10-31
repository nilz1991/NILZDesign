// Brochure request form on /lidoma/. The download service e-mails the link, so this page never receives it.

import { t, getLang } from './i18n.js';

const ENDPOINT = 'https://dl.nilzdesign.com/request';

export function initLidomaForm(form) {
  const msg = document.getElementById('lidoma-form-msg');
  const button = form.querySelector('button[type="submit"]');

  // data-i18n keeps the message translated after a language switch
  const say = (key, isError) => {
    msg.setAttribute('data-i18n', key);
    msg.innerHTML = t(key);
    msg.classList.toggle('is-error', isError);
    msg.hidden = false;
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    button.disabled = true;
    msg.hidden = true;
    const data = Object.fromEntries(new FormData(form));
    let result;
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, lang: getLang() }),
      });
      result = await res.json();
    } catch (_) {
      result = { ok: false, code: 'send' };
    }
    button.disabled = false;
    if (result.ok) {
      form.reset();
      say('lidoma.form_sent', false);
    } else {
      say(`lidoma.form_err_${result.code || 'send'}`, true);
    }
  });
}
