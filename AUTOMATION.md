# Weekly auto-refresh — Events

The **Events** list is generated from `data/events.json`, scraped weekly from
Shotgun (`/artists/oscar-baia`).

The **Discography** list is generated from `data/releases.json`, **maintained by
hand** — Beatport blocks automated access too hard to be worth it, and releases
only land a couple of times a year.

`node scripts/build.mjs` writes both into `index.html` between the
`<!-- auto:events -->` / `<!-- auto:releases -->` markers. `deploy.sh` runs it,
so a normal deploy always reflects the current data files.

---

## Events — automatic

`.github/workflows/refresh.yml` runs **every Monday**: it drives a headless
browser to re-scrape Shotgun, commits any change to `data/events.json`, and
redeploys.

Shotgun's block is mostly rate-limiting, so the headless browser usually gets
through. If it fails, the job **keeps the last-known `events.json`**, logs a
`::warning::`, and deploys anyway — the site never breaks. Worst case the list
just doesn't update until the next run or a manual edit.

### One-time setup

1. **Put the site in a GitHub repo**

   ```bash
   cd oscar-baia-site
   git init && git add -A && git commit -m "Oscar Baia site"
   gh repo create oscar-baia-site --private --source=. --push
   ```

2. **Create a Cloudflare API token** — dashboard → *My Profile → API Tokens →
   Create Token* → "Edit Cloudflare Workers" template (or a custom token with
   `Account · Cloudflare Pages · Edit`).

3. **Add repo secrets** — *Settings → Secrets and variables → Actions*:

   | Name | Value |
   |------|-------|
   | `CLOUDFLARE_API_TOKEN` | the token from step 2 |
   | `CLOUDFLARE_ACCOUNT_ID` | `60bd93daee77fd8089514be25dd02254` |

4. Done. Weekly on Monday 06:00 UTC, on demand via *Actions → "Refresh &
   deploy" → Run workflow*, and on every `git push` to `main` (deploy only, no
   scrape).

---

## Discography — by hand (≈ 20 seconds)

When Oscar releases something, edit `data/releases.json`:

```json
{
  "releases": [
    { "year": "2026", "title": "Track Name",
      "meta": "Label · with X · incl. Y remix",
      "url": "https://www.beatport.com/release/slug/12345" }
  ]
}
```

Newest first (build.mjs also sorts by year). Then:

```bash
./deploy.sh
```

Grab the release URL from your Beatport artist page:
<https://www.beatport.com/artist/oscar-baia/248069>

---

## Editing events by hand

Same idea — `data/events.json`:

```json
{
  "upcoming": [
    { "date": "2026-10-17", "name": "Venue · City night",
      "city": "City, CC", "url": "https://...", "status": "tickets",
      "lineup": "Other, DJs, Here" }
  ],
  "past": [
    { "date": "2026-08-08", "name": "Event", "city": "City, CC", "url": "https://..." }
  ]
}
```

`status` = `tickets` · `low` · `soldout`. `lineup` is optional and only shown
for the first upcoming show. The weekly scrape will overwrite this file when it
succeeds, so hand-edits to events are temporary until the next Monday.
