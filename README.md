# Himanshu Malik, personal website

Seven hand-written HTML pages, one stylesheet, one script. No build step, no
framework, no dependencies. Open `index.html` and it runs.

Alongside them sits one optional extra: `hero.html`, a React + Tailwind
experiment built by Vite and deployed next to the static site. It is not linked
from any page, and the seven pages do not know it exists.

**Pages:** Home · About · Skills · Experience · Projects · Education · Contact

---

## Contents

- [Run it](#run-it) · [Build and deploy](#build-and-deploy)
- [File map](#file-map)
- [Design system](#design-system) · [Class vocabulary](#class-vocabulary) · [Motion hooks](#motion-hooks)
- [Write-ups](#write-ups) · [Images](#images)
- [Accessibility](#accessibility-and-robustness) · [Editing notes](#editing-notes)

---

## Run it

The static site needs nothing installed.

```bash
python -m http.server 8000     # http://localhost:8000
```

Double-clicking `index.html` works too. A server is only nicer because it gives
clean URLs.

The React hero needs Node.

```bash
npm install
npm run dev                    # Vite serves hero.html
```

## Build and deploy

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server, `hero.html` only |
| `npm run typecheck` | `tsc --noEmit` over `src`, `components`, `vite.config.ts` |
| `npm run build` | typecheck, then `vite build`, then `scripts/copy-static.mjs` |
| `npm run preview` | serve the built `dist/` |

`vite build` is pointed at `hero.html` alone, so it can never rewrite
`index.html` or the other six pages. Its own output lands in `dist/_hero/`
rather than `dist/assets/`, which leaves `assets/` free for the real site.
`scripts/copy-static.mjs` then copies the seven pages plus `css/`, `js/` and
`assets/` into `dist/` verbatim, and throws if any of them is missing.

Vercel reads `vercel.json`: build with `npm run build`, serve `dist/`. That one
folder is the whole deploy, static site and hero together.

## File map

```
index.html  about.html  skills.html  experience.html
projects.html  education.html  contact.html    the site, hand-written
css/styles.css          design system: tokens, components, responsive, print
js/script.js            all behaviour, vanilla, ~500 lines
assets/img/             photography, profile, IIT KGP mark (also the favicon)
assets/img/CREDITS.md   Unsplash ids and crops for every photo
assets/resume/          three PDFs: SDE, Data, Product

hero.html               React mount point, standalone, unlinked
src/main.tsx            mounts the hero component
src/index.css           Tailwind entry and the hero's HSL channel tokens
components/ui/scroll-locked-video-hero.tsx     the hero itself
scripts/copy-static.mjs build step that copies the static site into dist/
tests/interaction-check.html   open in a browser: prints PASS/FAIL for the
                        pointer layer. Not copied into dist/, so it never ships

package.json  vite.config.ts  tsconfig.json  components.json  vercel.json
dist/                   build output, git-ignored
requirements.txt        the original brief, git-ignored, not shipped
```

`dist/`, `node_modules/` and `requirements.txt` are ignored by git.
`requirements.txt` is prose, not Python packages: it is the redesign brief,
kept for reference.

## Design system

Modelled on [moritzdunkel.de](https://www.moritzdunkel.de/): a dark magenta
gradient hero, oversized condensed display type, uppercase nav, one hot crimson
accent with yellow as the counterpoint, and modular sections on alternating
light grounds below.

| | |
|---|---|
| Display | Archivo (variable `wdth` 62-125, `wght` 100-900) |
| Body | Inter Tight |
| Meta / labels | JetBrains Mono |
| Accent | `#c80552`, hover `#ff1575` |
| Counterpoint | `#ffcc00` (rotating badge, on-slab rules) |
| Ink / paper | `#0b0b0d` on `#ffffff` / `#f4f3ef` |

Everything is driven by CSS custom properties on `:root`, with a full dark set
under `html[data-theme="dark"]`. To reskin the site, change the tokens at the
top of `css/styles.css` and nothing else.

Theme is chosen by the visitor, stored in `localStorage` under `hm-theme`, and
applied by a tiny inline script in each `<head>` so there is no flash of the
wrong theme on load.

The React hero keeps its own palette in `src/index.css`. Those values must stay
in space-separated HSL-channel form, because the component reads them as
`hsl(var(--background))`; let a generator rewrite them to `oklch(...)` and every
colour goes transparent.

### Class vocabulary

Compose pages from these; avoid inventing new classes.

- **Type**: `.d-hero` `.d-xl` `.d-lg` `.d-md` `.d-sm` `.lede` `.eyebrow` `.outline` `.accent`
- **Layout**: `.wrap` `.section` `.bg-alt` `.bg-sunk` `.band` `.sec-head` `.page-hero` `.crumb`
- **Dark slab**: `.dark-slab` re-declares the palette tokens locally, so the magenta
  hero reads identically in both themes and every child inherits the on-dark colours
- **Components**: `.card` `.stack` `.stats` `.worklist`/`.workrow` `.feature` `.accordion`
  `.tags` `.meter` `.timeline` `.table` `.filters` `.contact-list` `.resume-panel` `.note` `.cta`
- **Buttons**: `.btn` + `.btn-solid` / `.btn-ink` / `.btn-ghost` / `.btn-light`; `.link-arrow`; `.read-more`

### Motion hooks

Markup opts into behaviour with attributes; `js/script.js` wires them up on any
page, so nothing needs registering.

| Hook | Effect |
|---|---|
| `data-reveal` | fade + rise when scrolled into view |
| `data-stagger` | direct children rise in sequence |
| `.split` + `<span class="ln"><span>...</span></span>` | masked line-by-line heading reveal |
| `.clip-in` | wipe reveal on a media block |
| `data-count="8.49"` | counts up from zero on entry |
| `data-magnet="0.25"` | magnetic pull toward the cursor |
| `data-cursor="View"` | word shown in the cursor bubble on hover |
| `data-variant` / `data-cat-label` / `data-n` on `.workrow` | builds the floating hover preview |
| `data-cat` + `data-filter` | project filtering |
| `data-modal="<id>"` | opens the matching write-up template |

Also in the script, in source order: theme, preloader, custom cursor, scroll
meter and hide-on-scroll header, mobile menu, reveal observer, hero dot-field
canvas, marquee duplication, work hover preview, accordion, filters, the modal
with deep linking, the footer year, and the pointer-lit surfaces below.

### Interaction layer

Three effects that need no markup at all, all of them in the INTERACTION LAYER
block at the bottom of `css/styles.css`.

| Effect | How it works |
|---|---|
| Pointer light | One delegated `mousemove` writes `--mx` `--my` `--rx` `--ry` onto the nearest `.card`, `.resume-panel`, `.tl-item`, `.stat` or `.feature-media`. CSS turns those into a spotlight that follows the cursor and a few degrees of tilt |
| Dot-field everywhere | Every page hero carries the `#dotfield` canvas the homepage had. It reads its colours from the slab it sits in, so the dots are white on the magenta and bloom yellow around the cursor |
| Scroll parallax | Hero washes and `.wide-figure` photos drift against the scroll on a `view()` timeline. Pure CSS, inside an `@supports` guard, so an unsupporting browser just gets a still photo |

The pointer effects are skipped outright on a coarse pointer or under
`prefers-reduced-motion`, in which case the custom properties keep their
neutral defaults and every component renders exactly as it did before.
`tests/interaction-check.html` fires a synthetic move at a card and prints
PASS when the properties and the gradient come out right.

## Write-ups

Long-form posts live in `<template id="post-<id>">` blocks at the bottom of the
page they belong to. Anything carrying `data-modal="<id>"` opens the matching
template in the modal, and the id is pushed to the URL hash, so
`projects.html#zepto` opens that write-up directly, and the homepage links into
them that way.

To add one: write the `<template>`, give it an id, and point a `data-modal` at
it. No JavaScript changes needed.

## Images

Site photography comes from Unsplash, fetched as WebP and cropped and
compressed at source, so there is no image build step.
`assets/img/CREDITS.md` lists every file with its Unsplash id, crop and
subject. Project thumbnails are 900x563; page heroes and the profile shot are
listed alongside them.

## Accessibility and robustness

- Skip link, one `<h1>` per page, ordered headings, labelled landmarks
- Focus trap and `Escape` handling in the modal; focus returns to the opener
- `prefers-reduced-motion` disables the preloader, cursor, grain, canvas and every
  transition, and pins revealed content to its final state
- Custom cursor and hover previews are suppressed on touch and coarse pointers
- Content is plain HTML, so the pages read fine with JavaScript disabled
- Print stylesheet strips the chrome

## Editing notes

- Breakpoints: 1180 / 1024 / 860 / 560 px
- The homepage owns `.hero`, the `#dotfield` canvas and `.hero-ghost`; every other
  page opens with `.page-hero`. Both carry `.dark-slab`
- The header floats transparent and light over that slab, then becomes the solid
  blurred bar once it scrolls past. The threshold is measured in `script.js`,
  not hardcoded
- The header, footer, loader, grain, progress bar and modal markup are identical
  across all seven pages, so change one and change all seven
- `.marquee-track` words are written once; the script duplicates the track for the
  seamless loop
- A new page also has to be added to `STATIC` in `scripts/copy-static.mjs`, or it
  never reaches the deploy

---

Built by Himanshu Malik. Chemistry, IIT Kharagpur, class of 2028.
[himanshumalik0033@gmail.com](mailto:himanshumalik0033@gmail.com)
