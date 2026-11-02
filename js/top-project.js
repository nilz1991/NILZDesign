// Home: Lidoma as the top project. Each act is a pinned stage played by the scroll. Loose pictures gather into one window that
// fills the screen and settles into a sentence; a picture turns into the building, layer by layer, down to each home; then the
// brochure, the film, the tours and the way on. With reduced motion everything stands in plain order and nothing is pinned.
// Positions below are counted in screens of scroll since the act's stage was pinned.
import { onLangChange } from './i18n.js';

const WIPE_FROM = 0.25;     // the window's first change of picture
const WIPE_EVERY = 0.5;     // one picture per half a screen
const SAY_AT = 2.9;         // the window starts to settle into the sentence
const MODEL_AT = 1.8;       // the model's first step
const MODEL_STEP = 0.62;    // each step of the model
const BOOK_EVERY = 0.9;     // each spread of the brochure

// Where the camera looks on the exploded building: centre as a share of the picture, and how close
const CAMERAS = [
  { x: 0.54, y: 0.51, z: 1 },
  { x: 0.557, y: 0.231, z: 2.38 },
  { x: 0.557, y: 0.48, z: 1.98 },
  { x: 0.571, y: 0.67, z: 2.38 },
  { x: 0.562, y: 0.771, z: 2.49 },
];
const BUILDING_RATIO = 3400 / 2559;

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const part = (v, a, b) => clamp((v - a) / (b - a));
const soft = t => t * t * (3 - 2 * t);
const mix = (a, b, t) => a + (b - a) * t;
const mixBox = (a, b, t) => ({ x: mix(a.x, b.x, t), y: mix(a.y, b.y, t), w: mix(a.w, b.w, t), h: mix(a.h, b.h, t) });
const centred = (w, h, cx, cy) => ({ x: cx - w / 2, y: cy - h / 2, w, h });
const pad2 = n => String(n).padStart(2, '0');

export function initTopProject() {
  const root = document.querySelector('.tp');
  if (!root) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    root.classList.add('tp--still');
    return;
  }

  const html = document.documentElement;
  const $ = (scope, q) => scope.querySelector(q);
  const $$ = (scope, q) => [...scope.querySelectorAll(q)];

  const act = name => root.querySelector(`[data-act="${name}"]`);
  const show = act('show'), model = act('model'), book = act('book'), film = act('film'), tours = act('tours'), end = act('end');

  const head = $(show, '.tp-show__head');
  const loose = $$(show, '.tp-show__loose img');
  const win = $(show, '.tp-show__window');
  const winPics = $$(win, '.tp-show__pic');
  const winImages = $$(win, 'img');
  const say = $(show, '.tp-say');
  const sayText = $(show, '.tp-say__text');
  const saySlot = $(show, '.tp-say__slot');
  const sayRule = $(show, '.tp-say__rule');
  const sayBody = $(show, '.tp-say__body');

  const word = $(model, '.tp-model__word');
  const photo = $(model, '.tp-model__photo');
  const scene = $(model, '.tp-model__scene');
  const building = $(model, '.tp-model__building');
  const plates = $$(model, '.tp-model__plate');
  const steps = $$(model, '.tp-model__item');
  const dots = $$(model, '.tp-model__dots i');
  const bar = $(model, '.tp-model__bar');
  const count = $(model, '.tp-model__count');
  const counter = $(model, '.tp-model__now');
  const track = $(model, '.tp-model__line');
  const line = $(track, 'i');

  const views = $$(book, '.tp-book__view');

  const bridge = $(film, '.tp-film__bridge');
  const poster = $(film, '.tp-film__poster');
  const caption = $(film, '.tp-film__caption');

  const tourPics = $$(tours, '.tp-tours__pic');
  const tourItems = $$(tours, '.tp-tours__item');
  const tourNow = $(tours, '.tp-tours__now');
  const backs = $$(tours, '.tp-tours__side--back img');
  const nexts = $$(tours, '.tp-tours__side--next img');

  const endPhoto = $(end, '.tp-end__photo');
  const endBar = $(end, '.tp-end__bar');

  const acts = [
    { el: show, draw: drawShow },
    { el: model, draw: drawModel },
    { el: book, draw: drawBook },
    { el: film, draw: drawFilm },
    { el: tours, draw: drawTours },
    { el: end, draw: drawEnd },
  ];

  let W = 1, H = 1, seen = 1, upright = false, rtl = false, round = 22, edge = 16, cw = 1, ch = 1;
  let small, full, slot, tile, low, whole, wordSpan = 0, looseWay = [];
  let y = window.scrollY, drawn = NaN, last = 0, going = false;
  let stepOn = -1, tourOn = -1;

  function measure() {
    const stage = $(show, '.tp-stage');
    W = stage.clientWidth;
    H = stage.offsetHeight;
    seen = Math.min(H, window.innerHeight);
    upright = H > W;
    rtl = html.dir === 'rtl';
    round = parseFloat(getComputedStyle(root).getPropertyValue('--tp-round')) || 22;
    edge = parseFloat(getComputedStyle(views[0]).top) || 16;    // the stage's margin, as the CSS works it out
    for (const a of acts) {
      a.top = a.el.getBoundingClientRect().top + window.scrollY;
      a.len = parseFloat(a.el.style.getPropertyValue('--act'));
    }

    small = upright
      ? centred(W * 0.62, W * 0.72, W / 2, seen * 0.62)
      : centred(Math.min(W * 0.36, H * 0.66), Math.min(W * 0.36, H * 0.66) * 0.66, W / 2, H * 0.66);
    full = { x: edge, y: edge, w: W - edge * 2, h: seen - edge * 2 };
    whole = { x: 0, y: 0, w: W, h: H };
    tile = upright ? centred(W * 0.64, W * 0.72, W / 2, seen / 2) : centred(Math.min(W * 0.26, H * 0.5), Math.min(W * 0.26, H * 0.5) * 0.9, W / 2, H / 2);
    low = { ...tile, y: H + 10 };
    wordSpan = Math.max(0, word.scrollWidth - W);
    cw = Math.max(W, H * BUILDING_RATIO);
    ch = cw / BUILDING_RATIO;
    building.style.width = `${cw}px`;
    building.style.height = `${ch}px`;

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

  // Opens a layer from one side; hidden until it starts, unclipped once it is done
  function wipe(el, w, from) {
    el.style.visibility = w > 0 ? 'visible' : 'hidden';
    const rest = (1 - w) * 100;
    const shapes = { up: `inset(${rest}% 0 0 0)`, left: `inset(0 ${rest}% 0 0)`, right: `inset(0 0 0 ${rest}%)` };
    el.style.clipPath = w < 1 ? shapes[from] : 'none';
  }

  function drawShow(s, a) {
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
      wipe(pic, w, rtl ? 'left' : 'right');
      winImages[k].style.transform = `scale(${mix(1.1, 1, w)})`;
    });

    const t = soft(part(s, SAY_AT + 0.25, SAY_AT + 0.95));
    say.style.visibility = t > 0 ? 'visible' : 'hidden';
    sayText.style.clipPath = t < 1 ? `inset(-0.1em -1em ${(1 - t) * 100}% -1em)` : 'none';
    sayText.style.transform = `translate3d(0, ${(1 - t) * 26}px, 0)`;
    sayRule.style.transform = `scaleX(${soft(part(s, SAY_AT + 0.8, SAY_AT + 1.2))})`;
    sayBody.style.opacity = part(s, SAY_AT + 1, SAY_AT + 1.3);
    a.dark = open > 0.5 && close < 0.5;
  }

  function camera(t) {
    const k = Math.min(CAMERAS.length - 2, Math.floor(t));
    const m = soft(part(t - k, 0.3, 1));
    const from = CAMERAS[k], to = CAMERAS[k + 1];
    const zoom = 1 + (mix(from.z, to.z, m) - 1) * (upright ? 0.35 : 1);
    // The look-at point goes to the middle of what is seen, and the picture always covers the stage
    const tx = clamp(W / 2 - zoom * mix(from.x, to.x, m) * cw, W - zoom * cw, 0);
    const ty = clamp(seen * 0.46 - zoom * mix(from.y, to.y, m) * ch, H - zoom * ch, 0);
    building.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(${zoom})`;
  }

  function drawModel(s, a) {
    word.style.transform = `translate3d(${-wordSpan * part(s, -1, 1.2)}px, -50%, 0)`;
    const rise = soft(part(s, -0.45, 0.25)), g = soft(part(s, 0.25, 1.1));
    fit(photo, g ? mixBox(tile, whole, g) : mixBox(low, tile, rise), round * (1 - g));

    const fade = soft(part(s, 1.2, 1.65));
    scene.style.visibility = fade > 0 ? 'visible' : 'hidden';
    scene.style.opacity = fade;
    const barIn = soft(part(s, 1.5, 1.85));
    bar.style.transform = `translate3d(0, ${(1 - barIn) * 170}%, 0)`;
    count.style.opacity = track.style.opacity = barIn;

    const n = steps.length, cams = CAMERAS.length;
    const t = clamp((s - MODEL_AT) / MODEL_STEP, 0, n - 1);
    camera(Math.min(t, cams - 1));
    plates.forEach((plate, k) => {
      const at = cams - 1 + k;
      const w = soft(part(t, at + 0.35, at + 1));
      plate.style.visibility = w > 0 ? 'visible' : 'hidden';
      plate.style.opacity = w;
      plate.style.transform = `scale(${mix(1.05, 1, w)})`;
    });

    const on = Math.min(n - 1, Math.floor(t + 0.4));
    if (on !== stepOn) {
      stepOn = on;
      steps.forEach((item, k) => item.classList.toggle('is-on', k === on));
      dots.forEach((dot, k) => dot.classList.toggle('is-on', k === on));
      counter.textContent = pad2(on + 1);
    }
    line.style.transform = `scaleX(${(t + 1) / n})`;
    a.dark = g > 0.5;
  }

  function drawBook(s) {
    views.forEach((view, k) => {
      if (!k) return;
      const at = 0.25 + (k - 1) * BOOK_EVERY;
      wipe(view, soft(part(s, at, at + 0.5)), 'up');
    });
  }

  function drawFilm(s, a) {
    const rise = soft(part(s, -0.1, 1)), grow = soft(part(s, 1, 1.9));
    const up = part(s, 0, 0.9);
    bridge.style.transform = `translate3d(0, calc(-50% - ${up * seen * 0.6}px), 0)`;
    bridge.style.opacity = 1 - part(s, 0.45, 0.9);
    fit(poster, grow ? mixBox(tile, whole, grow) : mixBox(low, tile, rise), round * (1 - grow));
    const words = soft(part(s, 1.7, 2.1));
    caption.style.opacity = words;
    caption.style.transform = `translate3d(0, ${(1 - words) * 24}px, 0)`;
    a.dark = grow > 0.5;
  }

  function drawTours(s, a) {
    const n = tourPics.length;
    const t = part(s, 0.2, a.len - 0.3) * (n - 1);
    tourPics.forEach((pic, k) => {
      if (k) wipe(pic, soft(part(t, k - 0.6, k - 0.1)), 'up');
    });
    const on = Math.min(n - 1, Math.floor(t + 0.65));
    if (on !== tourOn) {
      tourOn = on;
      tourItems.forEach((item, k) => item.classList.toggle('is-on', k === on));
      tourNow.textContent = pad2(on + 1);
      backs.forEach((pic, k) => pic.classList.toggle('is-on', k === on - 1));
      nexts.forEach((pic, k) => pic.classList.toggle('is-on', k === on + 1));
    }
  }

  function drawEnd(s, a) {
    const rise = soft(part(s, -0.9, 0.1)), grow = soft(part(s, 0.15, 1.1));
    fit(endPhoto, grow ? mixBox(tile, whole, grow) : mixBox(low, tile, rise), round * (1 - grow));
    endBar.style.transform = `translate3d(0, ${(1 - soft(part(s, 0.95, 1.4))) * 170}%, 0)`;
    a.dark = grow > 0.5;
  }

  // The white header and the scrollbar step aside: nothing but the project stays in view
  function setTone() {
    const top = window.scrollY, middle = top + H / 2;
    const first = acts[0], final = acts[acts.length - 1];
    const inside = top >= first.top - 1 && middle < final.top + final.el.offsetHeight;
    const now = inside ? acts.find(a => middle >= a.top && middle < a.top + a.el.offsetHeight) : null;
    html.classList.toggle('panel-in-view', !!now && now.dark);
    html.classList.toggle('tp-light', !!now && !now.dark);
  }

  function tick(time) {
    if (!going) return;
    const dt = Math.min(0.05, (time - last) / 1000);
    last = time;
    const target = window.scrollY;
    y = Math.abs(target - y) < 0.4 ? target : mix(y, target, 1 - Math.pow(0.8, dt * 60));
    if (y !== drawn) {
      drawn = y;
      for (const a of acts) {
        const s = (y - a.top) / H;
        if (s > -1.2 && s < a.len + 1.2) a.draw(s, a);
      }
      setTone();
    }
    requestAnimationFrame(tick);
  }

  // The wheel's notches become one glide, so the pinned scenes never jump. Only inside the project; elsewhere the wheel is the browser's.
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
    if (!going) { glide = null; return; }
    if (e.ctrlKey || html.classList.contains('film-open')) return;
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
