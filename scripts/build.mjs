#!/usr/bin/env node
/* =========================================================
   build.mjs — regenerate the auto sections of index.html
   from data/events.json + data/releases.json.
   Zero dependencies. Safe to run any time.
   ========================================================= */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const readJSON = (p, fallback) => {
  try {
    return JSON.parse(readFileSync(join(ROOT, p), "utf8"));
  } catch {
    console.warn(`build: could not read ${p}, keeping existing markup`);
    return fallback;
  }
};

function fmtDate(iso) {
  // "2026-10-17" -> { d:"17", m:"10", y:"2026" }
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || "").trim());
  if (!m) return null;
  return { y: m[1], m: m[2], d: m[3] };
}

const STATUS = {
  tickets: { cls: "is-open", key: "show.tickets", label: "Tickets" },
  low: { cls: "is-low", key: "show.low", label: "Low tickets" },
  soldout: { cls: "is-off", key: "show.off", label: "Sold out" },
};

function renderEvents(data) {
  if (!data) return null;
  const up = [...(data.upcoming || [])]
    .filter((e) => fmtDate(e.date))
    .sort((a, b) => a.date.localeCompare(b.date));
  const past = [...(data.past || [])]
    .filter((e) => fmtDate(e.date))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 8);

  const lines = [];
  lines.push(`      <p class="shows__label" data-reveal data-i18n="shows.upcoming">Upcoming</p>`);

  if (up.length) {
    lines.push(`      <ul class="showlist">`);
    for (const e of up) {
      const dt = fmtDate(e.date);
      const st = STATUS[e.status] || STATUS.tickets;
      const cityAttr = esc((e.city || "").split(",")[0].trim());
      const statusHTML =
        e.url && e.status !== "soldout"
          ? `<a class="show__status ${st.cls}" href="${esc(e.url)}" target="_blank" rel="noopener" data-i18n="${st.key}">${esc(st.label)}</a>`
          : `<span class="show__status ${st.cls}" data-i18n="${st.key}">${esc(st.label)}</span>`;
      lines.push(`        <li class="show" data-reveal>`);
      lines.push(`          <span class="show__date"><b>${dt.d}.${dt.m}</b> ${dt.y}</span>`);
      lines.push(`          <span class="show__venue">${esc(e.name)}</span>`);
      lines.push(`          <span class="show__city" data-city="${cityAttr}">${esc(e.city)}</span>`);
      lines.push(`          ${statusHTML}`);
      lines.push(`        </li>`);
    }
    lines.push(`      </ul>`);
    const lineup = up.find((e) => e.lineup)?.lineup;
    if (lineup) {
      lines.push(`      <p class="shows__lineup" data-reveal>`);
      lines.push(`        w/ ${esc(lineup)}`);
      lines.push(`      </p>`);
    }
  } else {
    lines.push(`      <p class="shows__lineup" data-reveal>New dates announced soon — follow on Shotgun below.</p>`);
  }

  if (past.length) {
    lines.push(``);
    lines.push(`      <p class="shows__label" data-reveal data-i18n="shows.recent">Recent</p>`);
    lines.push(`      <ul class="showlist showlist--past">`);
    for (const e of past) {
      const dt = fmtDate(e.date);
      const cityAttr = esc((e.city || "").split(",")[0].trim());
      lines.push(`        <li class="show show--past" data-reveal>`);
      lines.push(`          <span class="show__date"><b>${dt.d}.${dt.m}</b> ${dt.y}</span>`);
      lines.push(`          <span class="show__venue">${esc(e.name)}</span>`);
      lines.push(`          <span class="show__city" data-city="${cityAttr}">${esc(e.city)}</span>`);
      lines.push(`        </li>`);
    }
    lines.push(`      </ul>`);
  }
  return lines.join("\n");
}

function renderReleases(data) {
  if (!data || !Array.isArray(data.releases) || !data.releases.length) return null;
  const rel = [...data.releases].sort((a, b) => String(b.year).localeCompare(String(a.year)));
  const lines = [`        <ul class="releaselist">`];
  for (const r of rel) {
    lines.push(`          <li>`);
    lines.push(`            <a href="${esc(r.url)}" target="_blank" rel="noopener">`);
    lines.push(`              <span class="releaselist__year">${esc(r.year)}</span>`);
    lines.push(`              <span class="releaselist__name">${esc(r.title)}</span>`);
    lines.push(`              <span class="releaselist__meta">${esc(r.meta)}</span>`);
    lines.push(`              <span class="releaselist__go" aria-hidden="true">↗</span>`);
    lines.push(`            </a>`);
    lines.push(`          </li>`);
  }
  lines.push(`        </ul>`);
  return lines.join("\n");
}

function replaceBlock(html, name, inner) {
  if (inner == null) return html; // nothing to write — leave existing markup
  const re = new RegExp(`(<!-- auto:${name}[^>]*-->)[\\s\\S]*?(<!-- /auto:${name} -->)`);
  if (!re.test(html)) {
    console.warn(`build: markers for "${name}" not found in index.html`);
    return html;
  }
  return html.replace(re, `$1\n${inner}\n      $2`);
}

const indexPath = join(ROOT, "index.html");
let html = readFileSync(indexPath, "utf8");

const events = readJSON("data/events.json", null);
const releases = readJSON("data/releases.json", null);

html = replaceBlock(html, "events", renderEvents(events));
html = replaceBlock(html, "releases", renderReleases(releases));

writeFileSync(indexPath, html);
console.log(
  `build: index.html updated — ${(events?.upcoming?.length ?? "?")} upcoming, ${(events?.past?.length ?? "?")} past, ${(releases?.releases?.length ?? "?")} releases`
);
