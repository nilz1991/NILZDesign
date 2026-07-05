# NILZ Design — Project Guide

Static portfolio for NILZ (architecture & interior design, Muscat).
Live: **nilzdesign.com** · Repo: **github.com/nilz1991/NILZDesign** · Host: **GitHub Pages** (push to `main` → deploys ~1 min).

## Stack
- Plain HTML + CSS + vanilla JS (ES modules). **No build step.**
- Content: **`_data/projects.json`** (projects) + **`_data/site.json`** (home/about/services/contact text) + **`_data/i18n.json`** (static UI strings, EN/AR).
- Header/footer injected by `js/components/*.js`. Page logic in `js/content.js`, `js/main.js`. i18n in `js/i18n.js`.
- CSS link is cache-busted: `css/style.css?v=N` — **bump N** on every CSS change so mobile picks it up.

## Bilingual (EN / AR + RTL) — `js/i18n.js`
- Default **English**; choice stored in `localStorage('nilz_lang')` (or one-time `?lang=ar`). Switch UI = `EN | العربية` in header (active bolded/gold), built by `langSwitchHTML()`. On mobile the switch also sits in the top bar next to the burger.
- **Switching is in-place — NO reload.** `setLang()` sets dir, runs every callback registered via `onLangChange(fn)`, then `applyStatic()` + reveals fade-ups. Scroll position is preserved. Each page wraps its dynamic rendering in a `render()`/`renderContent()` and registers it with `onLangChange`. header.js/footer.js rebuild themselves in place; rotating-text renders **into** its placeholder (keeps the node); project.html keeps the lightbox a one-time singleton and rebuilds sections/contents/TOC per render.
- Each page: early inline `<head>` script sets `dir/lang/.lang-ar` to avoid flash; module then `await initI18n()` **before** rendering, and `applyStatic()` **after** injecting header/footer + dynamic content.
- **Static UI text**: mark with `data-i18n="key"` (innerHTML), `data-i18n-ph` (placeholder), `data-i18n-aria` (aria-label); keys live in `_data/i18n.json` as `{en, ar}`. JS components use `t('key')`.
- **Data content** (site.json / projects.json): add a sibling `<field>_ar` next to each text field; rendering reads it via `tf(obj, 'field')` (falls back to base field if `_ar` missing). `category` stays English (used for grouping) — `category_ar` is display-only.
- **RTL**: `html.lang-ar` swaps font tokens to `El Messiri` (display) / `Tajawal` (body); a small `html[dir="rtl"]` block at the end of `style.css` mirrors the few physically-positioned bits (scroll hint, card badge, captions border, toc, lightbox bar). Arabic translations must be **fluent MSA (فصحى)**.

## Pages
- `index.html` home: hero video · marquee · about teaser · **Services** (“What We Do” = `site.services.items`) · Software & Tools strip · rotating statement. **No standalone `services.html`** (moved onto home; footer/nav “Services” links point to `index.html#services`).
- `projects.html` = work grid **grouped by category, with a heading per group** + a category quick-jump bar (soft pills) + a floating jump button/menu. Collections collapse to one card.
- `collection.html?id=` (lists a collection’s members) · `project.html?id=` (detail) · `about.html` · `contact.html` · `thank-you.html`.

## Data model — `projects.json`
- `collections[]`: `{id,title,category,location,image,description}` → one grid card opening `collection.html`. Current collections: **`residential`** & **`office`** (both `Interior Design`), **`facade`** (`Exterior Design`). Add `<field>_ar` siblings for bilingual text.
- `projects[]`: `{id,title,category,location,image,description,featured,order,overview,sections[]}`.
  - `image` = card thumbnail **and** project hero (unless `hero` set). `hero` overrides hero only. `heroFit:"contain"` shows full hero image (no crop).
  - `collection:"<id>"` → member (hidden from the main grid, listed on that collection's page).
  - `homeTitle` / `homeDescription` → override card on HOME only.
  - `locations[]` (optional) groups sections under named headers (office project).
- **Categories drive the projects-page grouping.** Canonical (English) `category` values in use: `Interior Design`, `Exterior Design`, `Engineering & Technical Drawings`, `Visualization & Animation`. Group order = `CATEGORY_ORDER` in `js/content.js`; `category` must stay English (grouping/anchor id), `category_ar` is display-only. To add a project to a sub-group card (e.g. all facades under one “Facade Design” card) give it `collection:"facade"`.
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
- **Masters** (untouched originals): `projects-content/<project>/_originals/` and `projects-content/_site-originals/`. `projects-content/` is **not committed** (large; left untracked) — keep it that way.
- **Web copies** (always compressed): `assets/images/…`. Rename user drops (spaces/parens/`.jpg.jpeg`, “New folder”) to clean lowercase names before referencing (spaces break URLs).
- **No ffmpeg / cwebp / ImageMagick / node / python** in PATH. Compress with:
  - **PowerShell + System.Drawing**: resize + JPEG quality. Photos ≈ maxEdge 1920 q76–80; drawings ≈ 2400 q85. `g.Clear(White)` first; use `Test-Path -LiteralPath` for names with `[]`. For **transparent** PNG use `ImageAttributes.SetColorKey` (white→transparent), 32bppArgb, no clear.
  - **WebP**: System.Drawing can't encode it → browser-canvas in the preview (`canvas.toDataURL('image/webp', q)`) → base64 → decode with PowerShell.
- **Photoshop IS installed** (COM, v24.7): `New-Object -ComObject Photoshop.Application` then `$ps.DoJavaScript($jsx)`. Use for **watermark/logo removal** via Content-Aware Fill (select rect → `executeAction(charIDToTypeID("Fl  "))` with `Usng=contentAware`). It nails complex spots that blind clone-stamping can't. If it hangs “RPC busy”, `Stop-Process -Name Photoshop -Force` and retry fresh; long ops return via a background task.
- **Word IS installed** (COM) → docx→pdf: open doc, `ExportAsFixedFormat(path, 17)`. Used for the off-repo CV/portfolio deliverables in `D:\2026\Nilz-website\CV\` (not part of the site).
- **Building .docx by hand**: author OOXML under a folder, zip with `System.IO.Compression.ZipArchive` using **forward-slash entry names** (`CreateFromDirectory` writes back-slashes → Word rejects it); include `[Content_Types].xml`.

## Working notes
- CSS cache-bust is currently at **`css/style.css?v=18`** — bump on the next CSS change (all HTML pages share the number).
- Use `preview_*` tools to verify (server `serve.js` via Adobe's bundled node, `.claude/launch.json`). `serve.js` now reads `process.env.PORT` and launch.json has `autoPort:true`, so the preview may get a random port (another chat can hold 3000). The static server serves no `.pdf` MIME (browser downloads instead of viewing). Preview navigation/scroll lags — trust `preview_eval` data over screenshots; re-check after a delay.
- **Always `git pull --rebase origin main` before pushing** (user also edits on GitHub). Commit + push only when done; tell user to hard-refresh (Ctrl+Shift+R) — mobile caches hard. Note: the user often leaves unrelated local edits uncommitted (e.g. `muscat-hills` images) — stage only the files for the task at hand.
- Backup branches on request: `V1`, `V2`, … Existing: `V1-NILZDesign`, `V2`, `V3`, `V4` (= main at time of backup). **Next is `V5`.**
- Contact: call **99009464**, WhatsApp **92315257**, Instagram **@nilz.design**, Al Mouj, Muscat.
