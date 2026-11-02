// Full-screen film for /lidoma/ and the home page: a click shows the film alone, over the whole page, and starts it with sound.
// A screen held upright gets the vertical cut, any other screen the wide one. Nothing downloads before the click.
// iPhone Safari cannot put a page element in full screen, so there the player fills the space between the browser's bars.

const WIDE = 'assets/images/lidoma/film.mp4';
const TALL = 'assets/images/lidoma/film-vertical.mp4';

export function initFilmPlayer() {
  const player  = document.getElementById('film-player');
  const video   = player.querySelector('video');
  const upright = window.matchMedia('(orientation: portrait)');

  const source = () => (upright.matches ? TALL : WIDE);

  function open(e) {
    e.preventDefault();
    video.src = source();
    player.hidden = false;
    document.documentElement.classList.add('film-open');
    if (player.requestFullscreen) player.requestFullscreen().catch(() => {});
    video.play().catch(() => {});
  }

  function close() {
    if (player.hidden) return;
    player.hidden = true;
    document.documentElement.classList.remove('film-open');
    video.pause();
    video.removeAttribute('src');
    video.load();
    if (document.fullscreenElement) document.exitFullscreen();
  }

  document.querySelectorAll('[data-film-open]').forEach(el => el.addEventListener('click', open));
  player.querySelector('button').addEventListener('click', close);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement) close(); });

  // While the panel fills the view, the white header and the cream scrollbar step aside
  const panel = document.getElementById('film');
  if (panel) new IntersectionObserver(([entry]) => {
    document.documentElement.classList.toggle('panel-in-view', entry.isIntersecting);
  }, { threshold: 0.6 }).observe(panel);

  // Turning the phone swaps the cut and carries on from the same second: both are the same 30 seconds
  upright.addEventListener('change', () => {
    if (player.hidden) return;
    const { currentTime, paused } = video;
    video.src = `${source()}#t=${currentTime}`;
    if (!paused) video.play().catch(() => {});
  });
}
