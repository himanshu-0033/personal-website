# Himanshu Malik — personal website

Static portfolio site. Seven hand-written HTML pages, one stylesheet, one script.
No build step, no framework, no dependencies — open `index.html` and it runs.

**Live pages:** Home · About · Skills · Experience · Projects · Education · Contact

---

## Run it

```bash
python -m http.server 8000    # then open http://localhost:8000
```

Opening `index.html` directly from the filesystem also works; a server is only
nicer because it gives clean URLs.

## Layout

```
index.html  about.html  skills.html  experience.html
projects.html  education.html  contact.html
css/styles.css        design system — tokens, components, responsive, print
js/script.js          all behaviour, vanilla, ~500 lines
assets/img/           profile photo, IIT KGP mark (also the favicon)
assets/resume/        three PDFs — SDE, Data, Product
```

## Design system

Modelled on [moritzdunkel.de](https://www.moritzdunkel.de/): a dark magenta
gradient hero, oversized condensed display type, uppercase nav, one hot crimson
accent with yellow as the counterpoint, and modular sections on alternating
light grounds below.

| | |
|---|---|
| Display | Archivo (variable `wdth` 62–125, `wght` 100–900) |
| Body | Inter Tight |
| Meta / labels | JetBrains Mono |
| Accent | `#c80552`, hover `#ff1575` |
| Counterpoint | `#ffcc00` (rotating badge, on-slab rules) |
| Ink / paper | `#0b0b0d` on `#ffffff` / `#f4f3ef` |

Everything is driven by CSS custom properties on `:root`, with a full dark set
under `html[data-theme="dark"]`. To reskin the site, change the tokens at the top
of `css/styles.css` and nothing else.

Theme is chosen by the visitor, stored in `localStorage` under `hm-theme`, and
applied by a tiny inline script in each `<head>` so there is no flash of the
wrong theme on load.

### Class vocabulary

Compose pages from these; avoid inventing new classes.

- **Type** — `.d-hero` `.d-xl` `.d-lg` `.d-md` `.d-sm` `.lede` `.eyebrow` `.outline` `.accent`
- **Layout** — `.wrap` `.section` `.bg-alt` `.bg-sunk` `.band` `.sec-head` `.page-hero` `.crumb`
- **Dark slab** — `.dark-slab` re-declares the palette tokens locally, so the magenta
  hero reads identically in both themes and every child inherits the on-dark colours
- **Components** — `.card` `.stack` `.stats` `.worklist`/`.workrow` `.feature` `.accordion`
  `.tags` `.meter` `.timeline` `.table` `.filters` `.contact-list` `.resume-panel` `.note` `.cta`
- **Buttons** — `.btn` + `.btn-solid` / `.btn-ink` / `.btn-ghost` / `.btn-light`; `.link-arrow`; `.read-more`

### Motion hooks

Markup opts into behaviour with attributes; `js/script.js` wires them up on any page.

| Hook | Effect |
|---|---|
| `data-reveal` | fade + rise when scrolled into view |
| `data-stagger` | direct children rise in sequence |
| `.split` + `<span class="ln"><span>…</span></span>` | masked line-by-line heading reveal |
| `.clip-in` | wipe reveal on a media block |
| `data-count="8.49"` | counts up from zero on entry |
| `data-magnet="0.25"` | magnetic pull toward the cursor |
| `data-cursor="View"` | word shown in the cursor bubble on hover |
| `data-variant` / `data-cat-label` / `data-n` on `.workrow` | builds the floating hover preview |

Also in the script: preloader, custom cursor, interactive hero dot-field canvas,
scroll progress bar, hide-on-scroll header, mobile menu, marquee duplication,
accordion, project filtering, and the write-up modal with deep linking.

## Write-ups

Long-form posts live in `<template id="post-<id>">` blocks at the bottom of the
page they belong to. Anything carrying `data-modal="<id>"` opens the matching
template in the modal, and the id is pushed to the URL hash — so
`projects.html#zepto` opens that write-up directly, and the homepage links into
them that way.

To add one: write the `<template>`, give it an id, and point a `data-modal` at it.
No JavaScript changes needed.

## Accessibility & robustness

- Skip link, one `<h1>` per page, ordered headings, labelled landmarks
- Focus trap and `Escape` handling in the modal; focus returns to the opener
- `prefers-reduced-motion` disables the preloader, cursor, grain, canvas and every
  transition, and pins revealed content to its final state
- Custom cursor and hover previews are suppressed on touch and coarse pointers
- Content is plain HTML — the pages read fine with JavaScript disabled
- Print stylesheet strips the chrome

## The hero portrait slot

The reference hero uses a background-removed cut-out of the person on the right.
`assets/img/profile.jpg` still has its indoor background, which reads as a pasted
rectangle against the magenta, so **that side is intentionally left empty**.

To fill it: save a transparent PNG as `assets/img/profile-cutout.png` (portrait,
roughly 2:3, cropped at mid-thigh) and uncomment the `PORTRAIT SLOT` block in
`index.html`. The `.hero-figure` CSS is already written — no other change needed.

## Editing notes

- Breakpoints: 1180 / 1024 / 860 / 560 px
- The homepage owns `.hero`, the `#dotfield` canvas and `.hero-ghost`; every other
  page opens with `.page-hero`. Both carry `.dark-slab`
- The header floats transparent and light over that slab, then becomes the solid
  blurred bar once it scrolls past — the threshold is measured in `script.js`,
  not hardcoded
- The header, footer, loader, grain, progress bar and modal markup are identical
  across all seven pages — change one, change all seven
- `.marquee-track` words are written once; the script duplicates the track for the
  seamless loop

---

Built by Himanshu Malik. Chemistry, IIT Kharagpur, class of 2028.
[himanshumalik0033@gmail.com](mailto:himanshumalik0033@gmail.com)
