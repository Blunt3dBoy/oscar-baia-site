# Oscar Baia — official site

Static, no build step. Dark editorial aesthetic built around Oscar's own
brand mark (magenta / near-black), with a bilingual **EN / PT** toggle and
lightweight GSAP animation that degrades gracefully (works with JS off,
respects `prefers-reduced-motion`, and falls back to `IntersectionObserver`
+ a scroll sweep if the GSAP CDN is blocked).

```
oscar-baia-site/
├── index.html
├── 404.html
├── _headers                  → Cloudflare Pages security + cache headers
├── assets/
│   ├── css/style.css
│   ├── js/i18n.js            → EN/PT strings + language switch
│   ├── js/main.js            → animation, nav, players, forms
│   ├── img/
│   │   ├── logo-oscarbaia-white.png   (from OscarLogo_2020.ai)
│   │   ├── logo-oscarbaia.png         (black version, spare)
│   │   ├── oscar-hero.jpg             (B&W — photo: Alexandra Guerreiro)
│   │   ├── oscar-studio.jpg  oscar-live.jpg  oscar-nyc.jpg  oscar-bw.jpg  (gallery)
│   │   └── favicon.svg
│   └── press/
│       └── oscar-baia-press-kit.zip  (bios EN/PT, press photos, logo .ai + PNG)
├── deploy.sh                 → build dist/ + push to Cloudflare Pages
├── DEPLOY.md                 → deploy + custom-domain notes
└── README.md
```

`dist/` is a generated deploy staging folder (git-ignore it).

## Deploy

Already live on Cloudflare Pages — https://oscar-baia.pages.dev
(project `oscar-baia`). Redeploy after edits with `./deploy.sh`.
Custom domain `oscarbaia.com` needs one manual DNS step — see **DEPLOY.md**.

## Language

- Switches with the **EN / PT** control in the header (and the mobile menu).
- Choice is remembered (`localStorage`) and can be deep-linked: `?lang=pt`.
- First-time visitors with a Portuguese browser start in PT.
- All copy lives in `assets/js/i18n.js` — edit the `en` / `pt` objects. Markup
  carries `data-i18n="key"`; add a new key to both objects and a matching
  `data-i18n` attribute in `index.html`.

## Sets & Shows / Discography

The **Sets & Shows** section embeds the live **Mixcloud** player
(`/oscarbaia/` — updates itself as Oscar uploads). SoundCloud is a follow link
only (that account has no public tracks yet).

Below it, a **Discography** list rendered from `data/releases.json` (see
`AUTOMATION.md`). To add a release: edit that file, `./deploy.sh`.

The **Events** list is rendered from `data/events.json`, refreshed weekly from
Shotgun by a GitHub Action — setup in `AUTOMATION.md`.

## Press kit

The **Download press kit** button in `#bookings` serves
`/assets/press/oscar-baia-press-kit.zip` (~5 MB) — bios EN/PT, four press
photos, and the logo (`.ai` + black/white PNG). To rebuild it after swapping
assets:

```bash
cd assets/press && zip -j -X oscar-baia-press-kit.zip <files…>
```

Keep the same filename so the download link doesn't change. `_headers` caches
this folder for 1 hour (not a year) so updates propagate.

## What still needs real content

| Area | Where | Action |
|------|-------|--------|
| Shows | `#shows` | Replace every `<li class="show">` — the 6 dates/venues/ticket links are invented. Format `DD.MM YYYY`, language-neutral. |
| Ticket / EPK links | `#shows`, `#bookings` | Show rows and the press-kit PDF link still point to `#`. |
| Gallery | `#gallery` | Live now (4 real photos). Add/replace `<figure class="tile">` blocks to change. |
| OG image | `assets/img/og-image.jpg` | 1200×630 share image; then update `og:image` in `<head>`. |
| Stats | `#about` `data-count` | 39 years / 12 countries / 8 residencies — adjust to taste. |

## Booking form

The form composes a `mailto:oscarbaia3@gmail.com` message (works everywhere,
no backend). To capture submissions instead:

- **Cloudflare Pages Forms** – add `data-static-form-name="bookings"` to the
  `<form>` (no code).
- **Formspree / Basin** – set `action="https://formspree.io/f/XXXX"` +
  `method="POST"` and delete that form's `preventDefault()` block in `main.js`.
- **Newsletter** – point `#subForm` at Mailchimp / Buttondown / ConvertKit.

## Fonts

Google Fonts (Anton, Space Grotesk, JetBrains Mono), `display=swap`. To
self-host, drop WOFF2 files in `assets/fonts/`, add `@font-face` at the top of
`style.css`, remove the Google `<link>`s.

## Accessibility / performance

- Contrast ≥ 4.5:1, keyboard nav, visible focus, skip link, reduced-motion,
  bilingual `<html lang>` + `<title>` all handled.
- One photo (~195 KB) + two small logos ship; players and GSAP load lazily /
  deferred. Test widths: 375 / 768 / 1024 / 1440 px.
