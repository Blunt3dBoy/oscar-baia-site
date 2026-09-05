import { sendEmail, emailShell, escapeHtml } from "../_lib/email.js";
import { page } from "../_lib/page.js";

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const email = String(url.searchParams.get("email") || "").trim().toLowerCase();
  const token = String(url.searchParams.get("token") || "");
  const action = String(url.searchParams.get("action") || "");

  if (!env.SUBSCRIBERS) {
    return page({ ok: false, title: "Error", heading: "Not configured", message: "Subscriptions aren't set up yet." });
  }
  if (!email || !token || !["accept", "reject"].includes(action)) {
    return page({ ok: false, title: "Invalid link", heading: "Invalid link", message: "This confirmation link is incomplete." });
  }

  const key = `sub:${email}`;
  const raw = await env.SUBSCRIBERS.get(key);
  const record = raw ? JSON.parse(raw) : null;
  const lang = record?.lang === "pt" ? "pt" : "en";
  const STR = TXT[lang];

  if (!record) {
    return page({ ok: false, title: STR.expiredTitle, heading: STR.expiredHeading, message: STR.expiredMsg });
  }
  if (record.status === "confirmed") {
    return page({ ok: true, title: STR.alreadyTitle, heading: STR.alreadyHeading, message: STR.alreadyMsg });
  }
  if (record.token !== token) {
    return page({ ok: false, title: STR.expiredTitle, heading: STR.expiredHeading, message: STR.expiredMsg });
  }

  if (action === "reject") {
    await env.SUBSCRIBERS.delete(key);
    return page({ ok: false, title: STR.rejectedTitle, heading: STR.rejectedHeading, message: STR.rejectedMsg });
  }

  // action === "accept"
  await env.SUBSCRIBERS.put(
    key,
    JSON.stringify({ status: "confirmed", confirmedAt: Date.now(), lang }),
    { expirationTtl: 60 * 60 * 24 * 365 * 5 } // keep for 5 years
  );

  try {
    await sendEmail(env, {
      to: email,
      subject: STR.welcomeSubject,
      html: emailShell({
        preheader: STR.welcomePreheader,
        title: STR.welcomeTitle,
        bodyHtml: `
          <p>${STR.welcomeBody1.replace("{email}", `<strong>${escapeHtml(email)}</strong>`)}</p>
          <p>${STR.welcomeBody2}</p>
          <p style="margin-top:20px;font-size:13px;color:#71717A;">${STR.welcomeFoot}</p>
        `,
      }),
    });
  } catch (err) {
    // Subscription is already confirmed either way — the welcome email is a nice-to-have.
  }

  return page({ ok: true, title: STR.confirmedTitle, heading: STR.confirmedHeading, message: STR.confirmedMsg });
}

const TXT = {
  en: {
    expiredTitle: "Link expired", expiredHeading: "Link expired",
    expiredMsg: "This confirmation link has expired or was already used. Subscribe again from the site if you'd still like to join.",
    alreadyTitle: "Already confirmed", alreadyHeading: "You're already in",
    alreadyMsg: "This address is already subscribed — no need to do anything else.",
    rejectedTitle: "No problem", rejectedHeading: "No problem",
    rejectedMsg: "You won't be added to the list. If you change your mind, you can subscribe again any time.",
    confirmedTitle: "Subscribed", confirmedHeading: "You're in 🎧",
    confirmedMsg: "Thanks for confirming — a welcome email is on its way.",
    welcomeSubject: "Welcome — you're on the list",
    welcomePreheader: "You're confirmed. Here's what to expect.",
    welcomeTitle: "Welcome to the list",
    welcomeBody1: "This confirms {email} is now subscribed to occasional emails from Oscar Baia.",
    welcomeBody2: "Expect new sets, upcoming shows and the odd release announcement — a few times a year, never more.",
    welcomeFoot: "You can unsubscribe from any future email, no questions asked.",
  },
  pt: {
    expiredTitle: "Link expirado", expiredHeading: "Link expirado",
    expiredMsg: "Este link de confirmação expirou ou já foi utilizado. Subscreva novamente no site se ainda quiser aderir.",
    alreadyTitle: "Já confirmado", alreadyHeading: "Já está na lista",
    alreadyMsg: "Este endereço já está subscrito — não precisa de fazer mais nada.",
    rejectedTitle: "Sem problema", rejectedHeading: "Sem problema",
    rejectedMsg: "Não será adicionado à lista. Se mudar de ideias, pode subscrever novamente a qualquer momento.",
    confirmedTitle: "Subscrito", confirmedHeading: "Está dentro 🎧",
    confirmedMsg: "Obrigado por confirmar — um email de boas-vindas está a caminho.",
    welcomeSubject: "Bem-vindo — já está na lista",
    welcomePreheader: "Confirmado. Aqui está o que esperar.",
    welcomeTitle: "Bem-vindo à lista",
    welcomeBody1: "Isto confirma que {email} está agora subscrito para receber emails ocasionais do Oscar Baia.",
    welcomeBody2: "Espere novos sets, próximos shows e algum anúncio de lançamento — algumas vezes por ano, nunca mais do que isso.",
    welcomeFoot: "Pode cancelar a subscrição em qualquer email futuro, sem perguntas.",
  },
};
