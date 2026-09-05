import { sendEmail, emailShell, btn } from "../_lib/email.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PENDING_TTL = 60 * 60 * 24 * 7; // 7 days
const RESEND_COOLDOWN = 5 * 60 * 1000; // 5 minutes

export async function onRequestPost(ctx) {
  try {
    return await handle(ctx);
  } catch (err) {
    // Note: avoid 502/504 here — Cloudflare replaces those with its own
    // generic error page instead of passing this JSON body through.
    return json({ ok: false, message: "Something went wrong. Please try again shortly." }, 500);
  }
}

async function handle({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, message: "Bad request." }, 400);
  }

  const email = String(body?.email || "").trim().toLowerCase();
  const consent = body?.consent === true;
  const lang = body?.lang === "pt" ? "pt" : "en";

  if (!EMAIL_RE.test(email)) {
    return json({ ok: false, message: STR[lang].badEmail }, 400);
  }
  if (!consent) {
    return json({ ok: false, message: STR[lang].needConsent }, 400);
  }
  if (!env.SUBSCRIBERS) {
    return json({ ok: false, message: "Subscriptions aren't configured yet." }, 500);
  }

  const key = `sub:${email}`;
  const existingRaw = await env.SUBSCRIBERS.get(key);
  const existing = existingRaw ? JSON.parse(existingRaw) : null;

  if (existing?.status === "confirmed") {
    return json({ ok: true, message: STR[lang].alreadyConfirmed });
  }
  if (existing?.status === "pending" && Date.now() - existing.createdAt < RESEND_COOLDOWN) {
    return json({ ok: true, message: STR[lang].checkInbox });
  }

  const token = crypto.randomUUID();
  const record = { status: "pending", token, createdAt: Date.now(), lang };
  await env.SUBSCRIBERS.put(key, JSON.stringify(record), { expirationTtl: PENDING_TTL });

  const base = new URL(request.url).origin;
  const acceptUrl = `${base}/api/confirm?email=${encodeURIComponent(email)}&token=${token}&action=accept`;
  const rejectUrl = `${base}/api/confirm?email=${encodeURIComponent(email)}&token=${token}&action=reject`;

  try {
    await sendEmail(env, {
      to: email,
      subject: STR[lang].subject,
      html: emailShell({
        preheader: STR[lang].preheader,
        title: STR[lang].title,
        bodyHtml: `
          <p>${STR[lang].intro}</p>
          <p style="margin:20px 0;">${btn(acceptUrl, STR[lang].accept, { primary: true })}${btn(rejectUrl, STR[lang].reject, { primary: false })}</p>
          <p style="font-size:13px;color:#71717A;">${STR[lang].ignore}</p>
        `,
      }),
    });
  } catch (err) {
    return json({ ok: false, message: STR[lang].sendFailed }, 500);
  }

  return json({ ok: true, message: STR[lang].sent });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

const STR = {
  en: {
    badEmail: "That doesn't look like a valid email address.",
    needConsent: "Please check the box to agree to receive emails.",
    alreadyConfirmed: "You're already subscribed — thanks!",
    checkInbox: "Check your inbox — a confirmation email is already on its way.",
    sendFailed: "Couldn't send the confirmation email. Please try again shortly.",
    sent: "Almost there — check your inbox to confirm.",
    subject: "Confirm your subscription — Oscar Baia",
    preheader: "One click to confirm you'd like to hear from Oscar Baia.",
    title: "Confirm your subscription",
    intro: "You asked to receive new sets, tour dates and news from Oscar Baia by email. Please confirm you'd like to receive these — you can unsubscribe at any time.",
    accept: "Yes, subscribe me",
    reject: "No thanks",
    ignore: "If you didn't request this, you can ignore this email — nothing happens until you click a button above.",
  },
  pt: {
    badEmail: "Isso não parece um endereço de email válido.",
    needConsent: "Marque a caixa para aceitar receber emails.",
    alreadyConfirmed: "Já está subscrito — obrigado!",
    checkInbox: "Verifique o seu email — um email de confirmação já foi enviado.",
    sendFailed: "Não foi possível enviar o email de confirmação. Tente novamente em breve.",
    sent: "Quase lá — verifique o seu email para confirmar.",
    subject: "Confirme a sua subscrição — Oscar Baia",
    preheader: "Um clique para confirmar que quer receber novidades do Oscar Baia.",
    title: "Confirme a sua subscrição",
    intro: "Pediu para receber novos sets, datas e novidades do Oscar Baia por email. Confirme que quer receber — pode cancelar a qualquer momento.",
    accept: "Sim, subscrever",
    reject: "Não, obrigado",
    ignore: "Se não pediu isto, pode ignorar este email — nada acontece até clicar num botão acima.",
  },
};
