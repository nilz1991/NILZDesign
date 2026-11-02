// Home: Lidoma as the top project. One stage, pinned and played by the scroll: loose pictures gather into one window that fills the
// screen and settles into a sentence, the last thing shown of the project. The next section then rises over the stage like a drawer,
// which is the CSS's work. With reduced motion everything stands in plain order and nothing is pinned.
// Positions below are counted in screens of scroll since the stage was pinned.
import { onLangChange } from './i18n.js';

const WIPE_FROM = 0.25;     // the window's first change of picture
const WIPE_EVERY = 0.5;     // one picture per half a screen
const SAY_AT = 2.9;         // the window starts to settle into the sentence

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const part = (v, a, b) => clamp((v - a) / (b - a));
const soft = t => t * t * (3 - 2 * t);
const mix = (a, b, t) => a + (b - a) * t;
const mixBox = (a, b, t) => ({ x: mix(a.x, b.x, t), y: mix(a.y, b.y, t), w: mix(a.w, b.w, t), h: mix(a.h, b.h, t) });
const centred = (w, h, cx, cy) => ({ x: cx - w / 2, y: cy - h / 2, w, h });

export function initTopProject() {
  const root = document.querySelector('.tp');
  if (!root) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    root.classList.add('tp--still');
    return;
  }

  const html = document.documentElement;
  const $ = q => root.querySelector(q);
  const $$ = (scope, q) => [...scope.querySelectorAll(q)];

  const act = $('.tp-act');
  const stage = $('.tp-stage');
  const header = document.getElementById('site-header');

  const head = $('.tp-show__head');
  const loose = $$(root, '.tp-show__loose img');
  const win = $('.tp-show__window');
  const winPics = $$(win, '.tp-show__pic');
  const winImages = $$(win, 'img');
  const say = $('.tp-say');
  const sayText = $('.tp-say__text');
  const saySlot = $('.tp-say__slot');
  const sayRule = $('.tp-say__rule');
  const sayBody = $('.tp-say__body');
  const sayWay = $('.tp-say__way');

  let W = 1, H = 1, rtl = false, round = 22;
  let top = 0, end = 0, headerH = 0, dark = false;    // end: where the drawer has covered the stage
  let small, full, slot, looseWay = [];
  let y = window.scrollY, drawn = NaN, last = 0, going = false;

  function measure() {
    W = stage.clientWidth;
    H = stage.offsetHeight;
    rtl = html.dir === 'rtl';
    round = parseFloat(getComputedStyle(root).getPropertyValue('--tp-round')) || 22;
    top = act.getBoundingClientRect().top + window.scrollY;
    end = top + parseFloat(act.style.getPropertyValue('--act')) * H;
    headerH = header.offsetHeight;

    const seen = Math.min(H, window.innerHeight), edge = clamp(W * 0.011, 10, 16);
    const under = head.offsetTop + head.offsetHeight + 24, tall = Math.min(W * 0.72, seen - under - 24);    // the window stays clear of the title
    small = H > W
      ? centred(tall * 0.86, tall, W / 2, Math.max(seen * 0.62, under + tall / 2))
      : centred(Math.min(W * 0.36, H * 0.66), Math.min(W * 0.36, H * 0.66) * 0.66, W / 2, H * 0.66);
    full = { x: edge, y: edge, w: W - edge * 2, h: seen - edge * 2 };

    // The sentence's empty place, measured without the transform it is drawn with
    sayText.style.transform = 'none';
    const a = saySlot.getBoundingClientRect(), b = stage.getBoundingClientRect();
    slot = { x: a.left - b.left, y: a.top - b.top, w: a.width, h: a.height };

    const middleX = W / 2, middleY = H / 2;
    looseWay = loose.map(pic => {
      const dx = pic.offsetLeft + pic.offsetWidth / 2 - middleX, dy = pic.offsetTop + pic.offsetHeight / 2 - middleY;
      const far = Math.hypot(dx, dy) || 1;
      return { x: dx / far, y: dy / far };
    });
    drawn = NaN;
  }

  // Shows a full-stage layer inside a box: scaled as a whole, then trimmed to the box's shape
  function fit(el, box, radius) {
    const s = Math.max(box.w / W, box.h / H);
    const cutX = Math.max(0, W - box.w / s) / 2, cutY = Math.max(0, H - box.h / s) / 2;
    el.style.transform = `translate3d(${box.x + box.w / 2 - W / 2}px, ${box.y + box.h / 2 - H / 2}px, 0) scale(${s})`;
    el.style.clipPath = `inset(${cutY}px ${cutX}px round ${radius / s}px)`;
  }

  // Opens a picture from the side; hidden until it starts, unclipped once it is done
  function wipe(el, w) {
    el.style.visibility = w > 0 ? 'visible' : 'hidden';
    const rest = (1 - w) * 100;
    el.style.clipPath = w < 1 ? (rtl ? `inset(0 ${rest}% 0 0)` : `inset(0 0 0 ${rest}%)`) : 'none';
  }

  function draw(s) {
    const come = 1 - soft(part(s, -0.9, -0.05));
    const leave = soft(part(s, 0.15, 0.8));
    loose.forEach((pic, i) => {
      const way = looseWay[i];
      const far = come * Math.min(W, H) * 0.26 + leave * Math.max(W, H) * 0.7;
      pic.style.transform = `translate3d(${way.x * far}px, ${way.y * far}px, 0) rotate(calc(var(--r) * ${1 + come * 0.7}))`;
      pic.style.visibility = leave < 1 ? 'visible' : 'hidden';
    });
    head.style.opacity = 1 - part(s, 0.1, 0.5);
    head.style.transform = `translate3d(0, ${-part(s, 0.1, 0.8) * 50}px, 0)`;

    const open = soft(part(s, 0.15, 1.5)), close = soft(part(s, SAY_AT, SAY_AT + 0.95));
    fit(win, close ? mixBox(full, slot, close) : mixBox(small, full, open), mix(mix(round, round * 0.7, open), 6, close));
    winPics.forEach((pic, k) => {
      if (!k) return;
      const at = WIPE_FROM + (k - 1) * WIPE_EVERY;
      const w = soft(part(s, at, at + WIPE_EVERY * 0.8));
      wipe(pic, w);
      winImages[k].style.transform = `scale(${mix(1.1, 1, w)})`;
    });

    const t = soft(part(s, SAY_AT + 0.25, SAY_AT + 0.95));
    say.style.visibility = t > 0 ? 'visible' : 'hidden';
    sayText.style.clipPath = t < 1 ? `inset(-0.1em -1em ${(1 - t) * 100}% -1em)` : 'none';
    sayText.style.transform = `translate3d(0, ${(1 - t) * 26}px, 0)`;
    sayRule.style.transform = `scaleX(${soft(part(s, SAY_AT + 0.8, SAY_AT + 1.2))})`;
    sayBody.style.opacity = sayWay.style.opacity = part(s, SAY_AT + 1, SAY_AT + 1.3);
    dark = open > 0.5 && close < 0.5;
  }

  // The white header and the scrollbar step aside: nothing but the project stays in view, until the drawer reaches the header
  function setTone() {
    const at = window.scrollY;
    const inside = at >= top - 1 && at < end - headerH;
    html.classList.toggle('panel-in-view', inside && dark);
    html.classList.toggle('tp-light', inside && !dark);
  }

  function tick(time) {
    if (!going) return;
    const dt = Math.min(0.05, (time - last) / 1000);
    last = time;
    const target = window.scrollY;
    y = Math.abs(target - y) < 0.4 ? target : mix(y, target, 1 - Math.pow(0.8, dt * 60));
    if (y !== drawn) {
      drawn = y;
      draw((y - top) / H);
      setTone();
    }
    requestAnimationFrame(tick);
  }

  // The wheel's notches become one glide, so the pinned stage never jumps. Only while it is pinned; elsewhere the wheel is the browser's.
  let glide = null, glideAt = 0, glideLast = 0;
  function glideStep(time) {
    if (glide === null) return;
    const dt = Math.min(0.05, (time - glideLast) / 1000);
    glideLast = time;
    glideAt = mix(glideAt, glide, 1 - Math.pow(0.87, dt * 60));
    if (Math.abs(glide - glideAt) < 0.5) {
      window.scrollTo({ top: glide, behavior: 'instant' });
      glide = null;
      return;
    }
    window.scrollTo({ top: glideAt, behavior: 'instant' });
    requestAnimationFrame(glideStep);
  }
  window.addEventListener('wheel', e => {
    if (!going || window.scrollY >= end) { glide = null; return; }
    if (e.ctrlKey) return;
    e.preventDefault();
    const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1;
    const fresh = glide === null;
    if (fresh) glideAt = window.scrollY;
    glide = clamp((fresh ? glideAt : glide) + e.deltaY * unit, 0, html.scrollHeight - window.innerHeight);
    if (fresh) {
      glideLast = performance.now();
      requestAnimationFrame(glideStep);
    }
  }, { passive: false });

  measure();
  document.fonts?.ready.then(measure);
  document.fonts?.addEventListener('loadingdone', measure);
  const sizes = new ResizeObserver(measure);
  [root, sayText, sayBody].forEach(el => sizes.observe(el));
  window.addEventListener('resize', measure);
  onLangChange(() => setTimeout(measure, 60));
  new IntersectionObserver(([entry]) => {
    going = entry.isIntersecting;
    if (going) {
      last = performance.now();
      requestAnimationFrame(tick);
    } else {
      html.classList.remove('panel-in-view', 'tp-light');
    }
  }, { rootMargin: '20% 0px' }).observe(root);
}
