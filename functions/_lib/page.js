// Minimal branded HTML page for links clicked from email (accept/reject/error).
export function page({ title, heading, message, ok = true }) {
  const accent = ok ? "#FF2E9A" : "#9A9AA4";
  return new Response(
    `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${title} — Oscar Baia</title>
  <style>
    body{margin:0;min-height:100vh;display:grid;place-content:center;justify-items:center;gap:1.1rem;
      background:#0A0A0C;color:#F4F4F5;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif;
      text-align:center;padding:2rem}
    h1{font-family:"Arial Narrow",Arial,sans-serif;font-weight:900;font-size:clamp(1.6rem,5vw,2.4rem);
      margin:0;text-transform:uppercase;letter-spacing:.02em;color:${accent}}
    p{color:#9A9AA4;margin:0;max-width:36ch;line-height:1.5}
    a{color:#FF2E9A;text-transform:uppercase;letter-spacing:.08em;font-size:.8rem;text-decoration:none;margin-top:.5rem}
  </style>
</head>
<body>
  <h1>${heading}</h1>
  <p>${message}</p>
  <a href="/">← Back to oscarbaia.com</a>
</body>
</html>`,
    { headers: { "content-type": "text/html; charset=utf-8" } }
  );
}
