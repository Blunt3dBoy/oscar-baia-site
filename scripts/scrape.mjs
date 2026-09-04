#!/usr/bin/env node
/* =========================================================
   scrape.mjs — refresh data/events.json from Shotgun using a
   real headless browser (Shotgun blocks plain HTTP requests).

   Discography is NOT scraped — data/releases.json is edited by hand.

   Design rules:
   - Never throw. Only overwrite events.json when >= 1 event was found.
   - On any failure, keep the last-known-good file and warn.
   - Always exit 0 so the deploy still runs with existing data.

   Run:  npx playwright install --with-deps chromium && node scripts/scrape.mjs
   ========================================================= */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const today = new Date().toISOString().slice(0, 10);
const warn = (m) => console.log(`::warning::scrape: ${m}`);
const info = (m) => console.log(`scrape: ${m}`);

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  warn("playwright not installed — skipping scrape, keeping existing data");
  process.exit(0);
}

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  userAgent:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
  locale: "en-US",
  viewport: { width: 1280, height: 900 },
});

const readJSON = (p) => {
  try {
    return JSON.parse(readFileSync(join(ROOT, p), "utf8"));
  } catch {
    return null;
  }
};

/* ---------------- Shotgun ---------------- */
async function scrapeShotgun() {
  const ARTIST = "https://shotgun.live/en/artists/oscar-baia";
  const page = await ctx.newPage();
  try {
    await page.goto(ARTIST, { waitUntil: "networkidle", timeout: 45000 });
    await page.waitForTimeout(1500);
    const body = await page.content();

    const upIdx = body.search(/upcoming events/i);
    const pastIdx = body.search(/past events/i);
    const slugsIn = (seg) => [
      ...new Set(
        (seg.match(/\/en\/events\/([a-z0-9-]+)/gi) || []).map((s) => s.split("/").pop())
      ),
    ];
    const upSlugs = slugsIn(body.slice(upIdx > -1 ? upIdx : 0, pastIdx > upIdx ? pastIdx : undefined));
    const pastSlugs = pastIdx > -1 ? slugsIn(body.slice(pastIdx)) : [];
    // guard: if the page layout changed and we got nothing, bail
    if (!upSlugs.length && !pastSlugs.length) throw new Error("no event links found on artist page");

    const seen = new Set();
    const fetchEvent = async (slug) => {
      if (seen.has(slug)) return null;
      seen.add(slug);
      const ep = await ctx.newPage();
      try {
        await ep.goto(`https://shotgun.live/en/events/${slug}`, {
          waitUntil: "domcontentloaded",
          timeout: 30000,
        });
        const blocks = await ep.$$eval('script[type="application/ld+json"]', (els) =>
          els.map((e) => e.textContent)
        );
        for (const b of blocks) {
          let j;
          try {
            j = JSON.parse(b);
          } catch {
            continue;
          }
          if (j && j["@type"] === "MusicEvent" && j.startDate) {
            const loc = j.location || {};
            const addr = loc.address || {};
            const venue = loc.name || "";
            const nameRaw = j.name || slug;
            const name = venue && !nameRaw.includes(venue) ? `${nameRaw} · ${venue}` : nameRaw;
            const cityBits = [addr.addressLocality, addr.addressCountry].filter(Boolean);
            const perf = (j.performer || [])
              .map((p) => p.name)
              .filter((n) => n && !/oscar\s*ba[ií]a/i.test(n));
            return {
              date: String(j.startDate).slice(0, 10),
              name,
              city: cityBits.join(", "),
              url: `https://shotgun.live/en/events/${slug}`,
              status: "tickets",
              lineup: perf.length ? perf.join(", ") : undefined,
            };
          }
        }
        return null;
      } catch (e) {
        warn(`shotgun event ${slug}: ${e.message}`);
        return null;
      } finally {
        await ep.close();
      }
    };

    const nowISO = today;
    let upcoming = (await Promise.all(upSlugs.map(fetchEvent))).filter(Boolean);
    let past = (await Promise.all(pastSlugs.map(fetchEvent))).filter(Boolean);

    // move anything that has already happened from upcoming -> past
    const stillUpcoming = [],
      demoted = [];
    for (const e of upcoming) (e.date >= nowISO ? stillUpcoming : demoted).push(e);
    upcoming = stillUpcoming.sort((a, b) => a.date.localeCompare(b.date));
    past = [...past, ...demoted].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10);

    // strip 'lineup' from past entries (keep the file tidy)
    past.forEach((e) => delete e.lineup);
    upcoming.forEach((e, i) => {
      if (i > 0) delete e.lineup;
    });

    if (!upcoming.length && !past.length) throw new Error("resolved 0 events");

    const out = { updated: nowISO, source: ARTIST, upcoming, past };
    writeFileSync(join(ROOT, "data/events.json"), JSON.stringify(out, null, 2) + "\n");
    info(`events.json updated — ${upcoming.length} upcoming, ${past.length} past`);
  } catch (e) {
    warn(`shotgun failed (${e.message}) — keeping existing events.json`);
  } finally {
    await page.close();
  }
}

/* Discography (data/releases.json) is maintained by hand — Beatport blocks
   automated access too aggressively to be worth scraping, and releases only
   come a couple of times a year. Edit data/releases.json, then ./deploy.sh */

await scrapeShotgun();
await browser.close();
info("done");
process.exit(0);
