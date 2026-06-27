# NILZ Design — Project Guide

Static portfolio for NILZ (architecture & interior design, Muscat).
Live: **nilzdesign.com** · Repo: **github.com/nilz1991/NILZDesign** · Host: **GitHub Pages** (push to `main` → deploys ~1 min).

## Stack
- Plain HTML + CSS + vanilla JS (ES modules). **No build step.**
- Content: **`_data/projects.json`** (projects) + **`_data/site.json`** (home/about/services/contact text) + **`_data/i18n.json`** (static UI strings, EN/AR).
- Header/footer injected by `js/components/*.js`. Page logic in `js/content.js`, `js/main.js`. i18n in `js/i18n.js`.
- CSS link is cache-busted: `css/style.css?v=N` — **bump N** on every CSS change so mobile picks it up.

## Bilingual (EN / AR + RTL) — `js/i18n.js`
- Default **English**; choice stored in `localStorage('nilz_lang')` (or one-time `?lang=ar`). Switching reloads the page (everything re-renders cleanly). Switch UI = `EN | العربية` in header (active bolded/gold), built by `langSwitchHTML()`.
- Each page: early inline `<head>` script sets `dir/lang/.lang-ar` to avoid flash; module then `await initI18n()` **before** rendering, and `applyStatic()` **after** injecting header/footer + dynamic content.
- **Static UI text**: mark with `data-i18n="key"` (innerHTML), `data-i18n-ph` (placeholder), `data-i18n-aria` (aria-label); keys live in `_data/i18n.json` as `{en, ar}`. JS components use `t('key')`.
- **Data content** (site.json / projects.json): add a sibling `<field>_ar` next to each text field; rendering reads it via `tf(obj, 'field')` (falls back to base field if `_ar` missing). `category` stays English (used for filtering) — `category_ar` is display-only.
- **RTL**: `html.lang-ar` swaps font tokens to `El Messiri` (display) / `Tajawal` (body); a small `html[dir="rtl"]` block at the end of `style.css` mirrors the few physically-positioned bits (scroll hint, card badge, captions border, toc, lightbox bar). Arabic translations must be **fluent MSA (فصحى)**.

## Pages
- `index.html` home (Selected Work = `featured` projects, max 4) · `projects.html` grid (collections collapse to 1 card) · `collection.html?id=` · `project.html?id=` detail · `about/services/contact/thank-you.html`.

## Data model — `projects.json`
- `collections[]`: `{id,title,category,location,image,description}` → one grid card opening `collection.html`.
- `projects[]`: `{id,title,category,location,image,description,featured,order,overview,sections[]}`.
  - `image` = card thumbnail **and** project hero (unless `hero` set). `hero` overrides hero only. `heroFit:"contain"` shows full hero image (no crop).
  - `collection:"<id>"` → member (hidden from grid, listed on collection page).
  - `homeTitle` / `homeDescription` → override card on HOME only.
  - `locations[]` (optional) groups sections under named headers (office project).
- `sections[]`: `{title, description, renders[]}`. Section gets `id="sec-N"` + appears in the auto Contents index.
- **`renders[]` types** (the `fit`/keys decide rendering — see `project.html` `renderSection`):
  - default: `{image,caption}` → full-bleed cover, click → lightbox, has zoom badge.
  - `{image,caption,fit:"contain"}` → full image on page, **not** zoomable (floor plans). Often a transparent PNG.
  - `fit:"drawing"` → full image + zoomable.
  - `fit:"flip"` `{images:[colour,bw],caption}` → B&W, auto cross-fades to colour on scroll; arrow toggles. (currently unused but supported)
  - `fit:"gallery"` `{images:[...],caption}` → paged slideshow with cross-fade + prev/next + dots.
  - `{video:"…mp4",caption}` → autoplay muted loop video with controls.
- Captions = **innerHTML** (HTML/`<span class="pd-draw-title">` etc. work). Grid/home order = array order (no sort).

## Key UI behaviour (project.html / style.css)
- **Lightbox**: 3-step **targeted** zoom (zooms toward click point) + **drag-to-pan** (grab cursor) + magnifier ±/close toolbar.
- **Contents index** auto-renders when a project has **2+ sections** (`#pd-contents`), plus a **floating glassy TOC button** (`.pd-toc`) that jumps back / opens a quick-jump menu (touch = tap, desktop = hover/click-to-top).
- Renders use **NO fade-up** (caused scroll jank). Keep it that way.

## Images workflow
- **Masters** (untouched originals): `projects-content/<project>/…` and `projects-content/_site-originals/` (logos, services, site images).
- **Web copies** (always compressed): `assets/images/…`.
- **No ffmpeg / cwebp / ImageMagick / node** in PATH. Compress two ways:
  - **PowerShell + System.Drawing**: resize + JPEG quality. Photos ≈ maxEdge 1920 q74–78; drawings ≈ 2400 q85. `g.Clear(White)` first. For **transparent** PNG use `ImageAttributes.SetColorKey` (white→transparent), 32bppArgb, no clear.
  - **WebP**: System.Drawing can't encode it → generate via **browser canvas** in the preview (`canvas.toDataURL('image/webp', q)`), return base64 (large → saved to a tool-results file), then decode to a file with PowerShell.

## Working notes
- Use `preview_*` tools to verify (server `serve.js` via Adobe's bundled node, `.claude/launch.json`). Preview navigation/scroll often lags — trust `preview_eval` data over screenshots; re-check after a delay.
- **Always `git pull --rebase origin main` before pushing** (user also edits on GitHub). Commit + push only when done; tell user to hard-refresh (Ctrl+Shift+R) — mobile caches hard.
- Backup branches on request: branch named `V1`, `V2`, … (next counter; an old `V1-NILZDesign` exists).
- Contact: call **99009464**, WhatsApp **92315257**, Instagram **@nilz.design**, Al Mouj, Muscat.
