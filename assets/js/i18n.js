/* =========================================================
   OSCAR BAIA — EN / PT localisation
   Text lives here; markup carries data-i18n="key".
   Language: ?lang= param  >  saved choice  >  browser language.
   ========================================================= */
(function () {
  "use strict";

  const STR = {
    en: {
      "a11y.skip": "Skip to content",
      "nav.discography": "Discography",
      "nav.follow": "Follow Me",
      "nav.sounds": "Sets & Shows",
      "nav.shows": "Events",
      "nav.about": "About",
      "nav.gallery": "Gallery",
      "nav.bookings": "Bookings",

      "hero.kicker": "DJ · Lisboa, Portugal — since 1986",
      "hero.sub": "Four decades behind the decks. An eclectic selector, a three-deck technician, and a party icon of Lisbon nightlife.",
      "hero.listen": "Listen",
      "hero.book": "Get in touch",
      "hero.scroll": "Scroll",

      "mq.1": "Eclectic",
      "mq.2": "Three decks",
      "mq.3": "Party icon",
      "mq.4": "Lisboa",
      "mq.5": "Since 1986",

      "about.title": "About",
      "about.lead": "It started almost by chance — an unplanned stand-in for the resident DJ at a club called Skylab. The year was 1986. The career that began that night is still going.",
      "about.p1": "In 1994, an invitation to join the X-Club DJ agency put Oscar in front of a fast-growing crowd. A rare command of three-deck mixing quickly carried him to the top of the Portuguese DJ roster and made him an unavoidable presence in the country's dance scene.",
      "about.p2": "He was one of the first Portuguese DJs to build an international career — Madrid, Barcelona and Ibiza, Frankfurt and Berlin, Rome and Rimini, Paris, Cape Town and Johannesburg, Toronto and Montreal, Osaka, London, Moscow, Dubai.",
      "about.p3": "Oscar refuses to draw a line around his taste. An eclectic selection and an exquisite technique let him play the music he loves while moving a whole room — the reason he has held residencies in Lisbon's landmark clubs, from Trumps, Benzina and Alcântara-Mar to Kings & Queens, Garage, Indústria and O2LX. Since 1995 the Azores have named him their ambassador of dance music, and in 2008 he began a weekly residency at the mythical Kremlin — his favourite club since the beginning.",
      "about.stat1": "Years on the decks",
      "about.stat2": "Countries played",
      "about.stat3": "Landmark residencies",
      "about.side1": "Resident at",
      "about.residencies": "Kremlin · Trumps · Benzina · Alcântara-Mar · Kings & Queens · Garage · Indústria · O2LX",
      "about.side2": "On the road",
      "about.road": "USA · Spain · Germany · Italy · France · South Africa · Canada · Japan · United Kingdom · Russia · UAE",

      "sounds.title": "Sets & Shows",
      "sounds.featkicker": "Listen",
      "sounds.feattitle": "Sets, shows & selections",
      "sounds.featdesc": "Recorded sets from clubs and open-airs — four decades of selection. Press play, then follow to catch the next one.",
      "sounds.followMc": "Follow on Mixcloud",
      "sounds.followSc": "Follow on SoundCloud",
      "sounds.discTitle": "Discography",
      "sounds.discAll": "Full catalogue on Beatport",

      "shows.title": "Events",
      "shows.upcoming": "Upcoming",
      "shows.recent": "Recent",
      "show.tickets": "Tickets",
      "show.low": "Low tickets",
      "show.off": "Sold out",
      "shows.foot": "Follow on Shotgun for new dates →",

      "gallery.title": "Gallery",

      "bookings.title": "Bookings",
      "bookings.lead": "Available worldwide. For dates and enquiries, get in touch directly.",
      "bookings.c1": "Bookings & enquiries",
      "bookings.c2": "Phone",
      "bookings.c2link": "Available on request — email →",
      "bookings.c3": "Press kit",
      "bookings.c3link": "Download press kit",
      "bookings.c3note": "Bios (EN / PT), press photos and logo. Photo — Alexandra Guerreiro.",
      "form.name": "Name / Company",
      "form.email": "Email",
      "form.date": "Event date",
      "form.datePh": "e.g. 14 March 2027",
      "form.details": "Venue, city, capacity, set length",
      "form.send": "Send enquiry",
      "form.hint": "Opens in your email app.",
      "form.sent": "Your email app should now be open with the enquiry drafted.",

      "footer.newsletter": "Newsletter",
      "footer.follow": "Follow",
      "footer.subtitle": "New sets & dates, a few times a year.",
      "footer.subscribe": "Subscribe",
      "footer.consent": "I agree to receive occasional emails from Oscar Baia (new sets, dates & info). You can unsubscribe anytime.",
      "footer.subok": "Thanks — connect a provider (see README) to store this.",
      "footer.rights": "Lisboa, Portugal.",
      "footer.top": "Back to top ↑",

      "doc.title": "Oscar Baia — DJ & Producer, Lisbon",
    },

    pt: {
      "a11y.skip": "Saltar para o conteúdo",
      "nav.discography": "Discografia",
      "nav.follow": "Segue-me",
      "nav.sounds": "Sets & Shows",
      "nav.shows": "Eventos",
      "nav.about": "Bio",
      "nav.gallery": "Galeria",
      "nav.bookings": "Contactos",

      "hero.kicker": "DJ · Lisboa, Portugal — desde 1986",
      "hero.sub": "Quatro décadas nas cabines. Um selector eclético, técnico de três decks e ícone das noites de Lisboa.",
      "hero.listen": "Ouvir",
      "hero.book": "Contactar",
      "hero.scroll": "Descer",

      "mq.1": "Eclético",
      "mq.2": "Três decks",
      "mq.3": "Ícone de pista",
      "mq.4": "Lisboa",
      "mq.5": "Desde 1986",

      "about.title": "Bio",
      "about.lead": "Começou quase por acaso — uma substituição imprevista do DJ residente de um club chamado Skylab. O ano era 1986. A carreira que começou nessa noite ainda não parou.",
      "about.p1": "Em 1994, o convite para integrar a agência de DJs X-Club colocou Óscar diante de uma legião crescente de fãs. Um domínio ímpar da mistura com três decks depressa o catapultou para o topo da tabela de DJs em Portugal e fez dele presença incontornável na cena de dança do país.",
      "about.p2": "Foi um dos primeiros DJs portugueses a construir uma carreira internacional — Madrid, Barcelona e Ibiza, Frankfurt e Berlim, Roma e Rimini, Paris, Cidade do Cabo e Joanesburgo, Toronto e Montreal, Osaka, Londres, Moscovo, Dubai.",
      "about.p3": "Óscar recusa definir uma linha para o seu gosto. Uma selecção eclética e uma técnica requintada permitem-lhe tocar a música que ama enquanto move uma sala inteira — a razão pela qual foi residente nos clubs históricos de Lisboa, dos Trumps, Benzina e Alcântara-Mar aos Kings & Queens, Garage, Indústria e O2LX. Desde 1995 os Açores apelidaram-no de Embaixador da música de dança e, em 2008, iniciou uma residência semanal no mítico Kremlin — o seu club preferido desde sempre.",
      "about.stat1": "Anos nas cabines",
      "about.stat2": "Países",
      "about.stat3": "Residências de culto",
      "about.side1": "Residente em",
      "about.residencies": "Kremlin · Trumps · Benzina · Alcântara-Mar · Kings & Queens · Garage · Indústria · O2LX",
      "about.side2": "Em digressão",
      "about.road": "EUA · Espanha · Alemanha · Itália · França · África do Sul · Canadá · Japão · Reino Unido · Rússia · E.A.U.",

      "sounds.title": "Sets & Shows",
      "sounds.featkicker": "Ouvir",
      "sounds.feattitle": "Sets, sessões e selecções",
      "sounds.featdesc": "Sets gravados em clubs e open-airs — quatro décadas de selecção. Carregue em play e siga para não perder o próximo.",
      "sounds.followMc": "Seguir no Mixcloud",
      "sounds.followSc": "Seguir no SoundCloud",
      "sounds.discTitle": "Discografia",
      "sounds.discAll": "Catálogo completo no Beatport",

      "shows.title": "Eventos",
      "shows.upcoming": "Próximos",
      "shows.recent": "Recentes",
      "show.tickets": "Bilhetes",
      "show.low": "Últimos bilhetes",
      "show.off": "Esgotado",
      "shows.foot": "Segue no Shotgun para novas datas →",

      "gallery.title": "Galeria",

      "bookings.title": "Contactos",
      "bookings.lead": "Disponível para todo o mundo. Para datas e propostas, contacte diretamente.",
      "bookings.c1": "Bookings e propostas",
      "bookings.c2": "Telefone",
      "bookings.c2link": "Sob pedido — enviar email →",
      "bookings.c3": "Press kit",
      "bookings.c3link": "Descarregar press kit",
      "bookings.c3note": "Biografias (EN / PT), fotos de imprensa e logótipo. Foto — Alexandra Guerreiro.",
      "form.name": "Nome / Empresa",
      "form.email": "Email",
      "form.date": "Data do evento",
      "form.datePh": "ex. 14 Março 2027",
      "form.details": "Espaço, cidade, lotação, duração do set",
      "form.send": "Enviar pedido",
      "form.hint": "Abre na sua aplicação de email.",
      "form.sent": "A sua aplicação de email deve abrir com o pedido preenchido.",

      "footer.newsletter": "Newsletter",
      "footer.follow": "Seguir",
      "footer.subtitle": "Novos sets e datas, algumas vezes por ano.",
      "footer.subscribe": "Subscrever",
      "footer.consent": "Aceito receber emails ocasionais do Oscar Baia (novos sets, datas e novidades). Pode cancelar quando quiser.",
      "footer.subok": "Obrigado — ligue um fornecedor (ver README) para guardar.",
      "footer.rights": "Lisboa, Portugal.",
      "footer.top": "Voltar ao topo ↑",

      "doc.title": "Oscar Baia — DJ & Produtor, Lisboa",
    },
  };

  const SUPPORTED = ["en", "pt"];
  let lang = "en";

  function get(key) {
    return (STR[lang] && STR[lang][key]) || STR.en[key] || "";
  }

  function apply() {
    const dict = STR[lang] || STR.en;

    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const v = dict[el.dataset.i18n];
      if (v != null) el.textContent = v;
    });
    document.querySelectorAll("[data-i18n-ph]").forEach((el) => {
      const v = dict[el.dataset.i18nPh];
      if (v != null) el.setAttribute("placeholder", v);
    });

    document.documentElement.lang = lang;
    if (dict["doc.title"]) document.title = dict["doc.title"];

    document.querySelectorAll("[data-lang-btn]").forEach((b) => {
      b.setAttribute("aria-pressed", String(b.dataset.langBtn === lang));
    });

    window.__lang = lang;
    document.dispatchEvent(new CustomEvent("langchange", { detail: { lang } }));
  }

  function setLang(next, save) {
    if (!SUPPORTED.includes(next)) return;
    lang = next;
    if (save !== false) {
      try { localStorage.setItem("ob-lang", next); } catch (e) {}
    }
    apply();
  }

  // resolve initial language
  let initial = null;
  try {
    const p = new URLSearchParams(location.search).get("lang");
    if (p && SUPPORTED.includes(p)) initial = p;
  } catch (e) {}
  if (!initial) {
    try { initial = localStorage.getItem("ob-lang"); } catch (e) {}
  }
  if (!initial || !SUPPORTED.includes(initial)) {
    const navLang = (navigator.language || navigator.userLanguage || "en").toLowerCase();
    initial = navLang.startsWith("pt") ? "pt" : "en";
  }
  lang = initial;

  // expose for main.js
  window.__i18nGet = get;
  window.__setLang = setLang;
  window.__lang = lang;

  function wire() {
    document.querySelectorAll("[data-lang-btn]").forEach((b) => {
      b.addEventListener("click", () => setLang(b.dataset.langBtn));
    });
    apply();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", wire);
  } else {
    wire();
  }
})();
