# Deployment

**Live now:** https://oscar-baia.pages.dev
**Cloudflare project:** Workers & Pages → `oscar-baia` (account oscarbaia3@gmail.com)

## Redeploy after edits

```bash
./deploy.sh
```

Builds a clean `dist/` (site files only — no README / config) and uploads it as
a new production deployment. Needs a one-time `npx wrangler login`.

## Finish the custom domain (one manual step)

`oscarbaia.com` and `www.oscarbaia.com` are already attached to the Pages
project but show **Pending** — they need a DNS record, which I don't have
permission to create. In the Cloudflare dashboard:

**Easiest:** Workers & Pages → `oscar-baia` → **Custom domains**. Each pending
domain has a **“Set up DNS record” / “Activate”** button — click it. Because
`oscarbaia.com` is already a zone in the same account, that's all it needs.

**Manual alternative:** the domain's **DNS** tab → add:

| Type  | Name  | Target                 | Proxy |
|-------|-------|------------------------|-------|
| CNAME | `@`   | `oscar-baia.pages.dev` | ON    |
| CNAME | `www` | `oscar-baia.pages.dev` | ON    |

Cloudflare then issues the TLS certificate automatically (a few minutes).
After that, https://oscarbaia.com serves the site and `www` redirects to it.

## Notes

- `_headers` (security + caching) is applied automatically by Pages.
- `dist/` is generated — safe to delete; `deploy.sh` rebuilds it.
- Every deploy is immutable and gets its own `<hash>.oscar-baia.pages.dev`
  preview URL; production always points at the newest.
