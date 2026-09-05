// Thin wrapper around the Resend API (https://resend.com).
// Requires env.RESEND_API_KEY (set with: wrangler pages secret put RESEND_API_KEY).
const FROM = "Oscar Baia <subscribe@oscarbaia.com>";

export async function sendEmail(env, { to, subject, html, text }) {
  if (!env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured");
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM, to: [to], subject, html, text }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Resend API ${res.status}: ${body.slice(0, 300)}`);
  }
  return res.json();
}

export function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

// Shared visual shell for both the verification and welcome emails.
export function emailShell({ preheader = "", title, bodyHtml }) {
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0A0A0C;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0A0A0C;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:480px;background:#121216;border:1px solid rgba(255,255,255,0.10);border-radius:12px;overflow:hidden;">
        <tr><td style="padding:28px 32px 0;">
          <div style="font-family:'Arial Narrow',Arial,sans-serif;font-weight:900;font-size:22px;letter-spacing:0.04em;color:#ffffff;text-transform:uppercase;">
            OSCAR <span style="color:#FF2E9A;">BAIA</span>
          </div>
        </td></tr>
        <tr><td style="padding:24px 32px 8px;">
          <h1 style="margin:0 0 16px;font-family:Arial,sans-serif;font-size:20px;line-height:1.3;color:#ffffff;font-weight:700;">${escapeHtml(title)}</h1>
          <div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#C4C4CC;">
            ${bodyHtml}
          </div>
        </td></tr>
        <tr><td style="padding:24px 32px 28px;border-top:1px solid rgba(255,255,255,0.08);margin-top:24px;">
          <p style="margin:16px 0 0;font-family:Arial,sans-serif;font-size:12px;color:#71717A;">
            Oscar Baia — Lisboa, Portugal · <a href="https://oscarbaia.com" style="color:#71717A;">oscarbaia.com</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function btn(href, label, { primary = true } = {}) {
  const bg = primary ? "#FF2E9A" : "transparent";
  const color = primary ? "#0A0A0C" : "#ffffff";
  const border = primary ? "none" : "1px solid rgba(255,255,255,0.28)";
  return `<a href="${href}" style="display:inline-block;padding:12px 22px;margin:4px 8px 4px 0;background:${bg};color:${color};border:${border};border-radius:100px;font-family:Arial,sans-serif;font-weight:700;font-size:13px;letter-spacing:0.04em;text-transform:uppercase;text-decoration:none;">${escapeHtml(label)}</a>`;
}
