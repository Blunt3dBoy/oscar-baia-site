# Newsletter double opt-in

How it works, end to end:

1. Visitor fills the footer newsletter form (email + **required** consent
   checkbox) → `POST /api/subscribe`.
2. The Function stores `{status:"pending", token}` in KV and emails the
   visitor a confirmation message with two buttons: **Yes, subscribe me** /
   **No thanks**.
3. Clicking a button hits `GET /api/confirm?email=…&token=…&action=accept|reject`:
   - **Accept** → KV record flips to `confirmed`, a welcome email goes out,
     visitor sees a "You're in" page.
   - **Reject** → the record is deleted, visitor sees a "No problem" page.
   Both are one-click, no reply-parsing — reliable across every mail client.
4. Re-clicking an old/used link is handled (already-confirmed / expired /
   invalid states all show a clear message).

All of this is already built, deployed, and tested (`functions/api/subscribe.js`,
`functions/api/confirm.js`, `functions/_lib/`). It fails safe: if email
sending isn't configured yet, `/api/subscribe` returns a clean error instead
of losing the signup — nothing is broken by finishing setup later.

**Note on Cloudflare:** don't return HTTP 502/504 from these Functions —
Cloudflare silently replaces those with its own generic error page instead of
passing the JSON body through. 500/503/400/etc. all pass through fine.

## What's left — one-time setup

### 1. Create a Resend account (free tier: 3,000 emails/month)

[resend.com/signup](https://resend.com/signup)

### 2. Verify the sending domain

Resend dashboard → **Domains → Add Domain** → `oscarbaia.com`. It shows a
handful of DNS records (SPF `TXT`, DKIM `CNAME`/`TXT`, optionally DMARC).
Add them in **Cloudflare → oscarbaia.com → DNS → Records** (I don't have
permission to add DNS records myself — my Cloudflare login only covers Pages).
Verification usually completes within minutes.

Once the domain is verified, both `subscribe@oscarbaia.com` (used here) and
`booking@oscarbaia.com` can send from it if needed later.

### 3. Create an API key

Resend dashboard → **API Keys → Create API Key** → sending permission is enough.

### 4. Add it as a Pages secret (never paste it in chat — run this yourself)

```bash
cd "/Users/oscarbaia/Downloads/CLAUDE CODE/oscar-baia-site"
npx wrangler pages secret put RESEND_API_KEY --project-name oscar-baia
```
It prompts for the value privately in your terminal.

### 5. Test it

Go to oscarbaia.com, scroll to the footer, subscribe with a real address you
can check. You should get the confirmation email within seconds; click
**Yes, subscribe me** and you should immediately get the welcome email.

## Where things live

- `functions/api/subscribe.js` — validation, KV write, sends the confirmation email
- `functions/api/confirm.js` — accept/reject landing, KV update, sends the welcome email
- `functions/_lib/email.js` — Resend API call + shared email HTML template
- `functions/_lib/page.js` — shared branded landing-page template
- KV namespace `SUBSCRIBERS` (id `cff8d6b4581f463bb0622f3402b43c6b`), bound via `wrangler.toml`
- Both emails and the consent checkbox copy are bilingual (EN/PT), matching whatever language the visitor had selected when they subscribed
