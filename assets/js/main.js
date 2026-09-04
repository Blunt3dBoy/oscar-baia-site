/* =========================================================
   OSCAR BAIA — interactions
   Lightweight, progressive, reduced-motion aware.
   GSAP + ScrollTrigger are optional enhancements; the page
   is fully usable if they fail to load.
   ========================================================= */
(function () {
  "use strict";

  const html = document.documentElement;
  html.classList.add("js");

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  /* ---------- year ---------- */
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- TikTok link ----------
     Paste Oscar's TikTok profile URL below. Until it's set the TikTok
     links stay hidden (no dead links). */
  const TIKTOK_URL = "https://www.tiktok.com/@oscarbaiadj";
  $$("[data-social-tiktok]").forEach((a) => {
    if (TIKTOK_URL) {
      a.href = TIKTOK_URL;
      a.removeAttribute("data-social-tiktok");
    } else {
      (a.closest("li") || a).remove();
    }
  });

  /* ---------- preloader ---------- */
  const preloader = $("#preloader");
  const fill = $("#preloaderFill");
  function dismissPreloader() {
    if (!preloader) return;
    preloader.classList.add("is-done");
    setTimeout(() => preloader.remove(), 700);
  }
  if (preloader) {
    if (reduceMotion) {
      dismissPreloader();
    } else {
      let p = 0;
      const tick = setInterval(() => {
        p = Math.min(100, p + Math.random() * 26);
        if (fill) fill.style.width = p + "%";
        if (p >= 100) {
          clearInterval(tick);
          setTimeout(dismissPreloader, 250);
        }
      }, 130);
      // hard safety net
      setTimeout(dismissPreloader, 3500);
    }
  }

  /* ---------- custom cursor ---------- */
  if (fine && !reduceMotion) {
    const cursor = $("#cursor");
    const dot = $(".cursor__dot", cursor);
    const ring = $(".cursor__ring", cursor);
    let mx = -100, my = -100;
    let rx = mx, ry = my;
    cursor.style.opacity = "0";

    window.addEventListener("mousemove", (e) => {
      if (!document.body.classList.contains("cursor-ready")) {
        document.body.classList.add("cursor-ready");
        cursor.style.opacity = "";
        rx = e.clientX; ry = e.clientY;
      }
      mx = e.clientX; my = e.clientY;
      dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
    }, { passive: true });

    (function loop() {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
      requestAnimationFrame(loop);
    })();

    const hoverables = "a, button, input, textarea, [data-magnetic], .tile, .show";
    document.addEventListener("mouseover", (e) => {
      if (e.target.closest(hoverables)) cursor.classList.add("is-hover");
    });
    document.addEventListener("mouseout", (e) => {
      if (e.target.closest(hoverables)) cursor.classList.remove("is-hover");
    });
  }

  /* ---------- magnetic buttons ---------- */
  if (fine && !reduceMotion) {
    $$("[data-magnetic]").forEach((el) => {
      const strength = 0.35;
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        el.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
      });
      el.addEventListener("mouseleave", () => { el.style.transform = ""; });
    });
  }

  /* ---------- nav: hide on scroll down, blur after threshold ---------- */
  const nav = $("#nav");
  let lastY = window.scrollY;
  window.addEventListener("scroll", () => {
    const y = window.scrollY;
    nav.classList.toggle("is-scrolled", y > 40);
    if (!document.body.classList.contains("menu-open")) {
      nav.classList.toggle("is-hidden", y > lastY && y > 300);
    }
    lastY = y;
  }, { passive: true });

  /* ---------- mobile menu ---------- */
  const toggle = $("#navToggle");
  const menu = $("#mobileMenu");
  function setMenu(open) {
    document.body.classList.toggle("menu-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    menu.setAttribute("aria-hidden", String(!open));
    document.body.style.overflow = open ? "hidden" : "";
  }
  toggle.addEventListener("click", () => setMenu(!document.body.classList.contains("menu-open")));
  $$("a", menu).forEach((a) => a.addEventListener("click", () => setMenu(false)));
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && document.body.classList.contains("menu-open")) setMenu(false);
  });

  /* ---------- booking form -> mailto ---------- */
  const form = $("#bookingForm");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      const d = new FormData(form);
      const subject = `Booking enquiry — ${d.get("name") || ""}`.trim();
      const body =
        `Name / Company: ${d.get("name") || ""}\n` +
        `Email: ${d.get("email") || ""}\n` +
        `Event date: ${d.get("date") || "TBC"}\n\n` +
        `Details:\n${d.get("details") || ""}\n`;
      window.location.href =
        `mailto:oscarbaia3@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      const g = window.__i18nGet;
      $("#formHint").textContent = (g && g("form.sent")) || "Your email app should now be open.";
    });
  }

  /* ---------- newsletter (front-end only stub) ---------- */
  const sub = $("#subForm");
  if (sub) {
    sub.addEventListener("submit", (e) => {
      e.preventDefault();
      const hint = $("#subHint");
      if (!sub.checkValidity()) { sub.reportValidity(); return; }
      const g = window.__i18nGet;
      hint.textContent = (g && g("footer.subok")) || "Thanks — connect a provider to store this.";
      sub.reset();
    });
  }

  /* =========================================================
     GSAP enhancements
     ========================================================= */
  function initGSAP() {
    if (typeof window.gsap === "undefined") { fallbackReveal(); return; }
    const gsap = window.gsap;

    if (reduceMotion) {
      $$("[data-reveal]").forEach((el) => el.classList.add("is-in"));
      return;
    }

    if (window.ScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);

    /* hero intro — resilient: hero is visible by default in CSS, so if the
       timeline never runs (tab loaded in background, rAF throttled, etc.)
       the content is never stuck hidden. */
    const heroWords = $$(".hero__title .word");
    const introTargets = [".hero__kicker", ".hero__sub", ".hero__actions"];
    const photoMask = $(".hero__photo-mask");
    const photoImg = $(".hero__photo img");
    const revealHero = () => {
      gsap.set(heroWords, { clearProps: "transform" });
      gsap.set(introTargets, { clearProps: "opacity,transform" });
      if (photoMask) gsap.set(photoMask, { clearProps: "clipPath" });
      if (photoImg) gsap.set(photoImg, { scale: 1 });
    };

    function playIntro() {
      gsap.set(heroWords, { yPercent: 115 });
      gsap.set(introTargets, { opacity: 0, y: 20 });
      if (photoMask) gsap.set(photoMask, { clipPath: "inset(0 0 0 100%)" });
      if (photoImg) gsap.set(photoImg, { scale: 1.18 });

      const tl = gsap.timeline({ delay: 0.15, onComplete: revealHero });
      if (photoMask) tl.to(photoMask, { clipPath: "inset(0 0 0 0%)", duration: 1.25, ease: "expo.out" }, 0);
      if (photoImg) tl.to(photoImg, { scale: 1, duration: 1.7, ease: "expo.out" }, 0);
      tl.to(".hero__kicker", { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }, 0.1)
        .to(heroWords, { yPercent: 0, duration: 1, ease: "expo.out", stagger: 0.08 }, "-=0.3")
        .to(".hero__sub", { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }, "-=0.5")
        .to(".hero__actions", { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }, "-=0.4");
      // safety: force final state if the timeline stalls
      setTimeout(() => { if (tl.progress() < 1) { tl.progress(1).kill(); revealHero(); } }, 4500);
    }

    if (document.hidden) {
      document.addEventListener("visibilitychange", function once() {
        document.removeEventListener("visibilitychange", once);
        playIntro();
      });
    } else {
      playIntro();
    }

    if (!window.ScrollTrigger) { $$("[data-reveal]").forEach((el) => el.classList.add("is-in")); return; }
    const ST = window.ScrollTrigger;

    /* generic reveals */
    $$("[data-reveal]").forEach((el) => {
      ST.create({
        trigger: el,
        start: "top 88%",
        once: true,
        onEnter: () => el.classList.add("is-in"),
      });
    });

    /* backdrop parallax */
    $$("[data-parallax]").forEach((el) => {
      const amt = parseFloat(el.dataset.parallax) || 0.1;
      gsap.to(el, {
        yPercent: amt * 100,
        ease: "none",
        scrollTrigger: { trigger: document.body, start: "top top", end: "bottom bottom", scrub: 0.6 },
      });
    });

    /* hero photo parallax on scroll */
    if (photoImg) {
      gsap.to(photoImg, {
        yPercent: 12,
        ease: "none",
        scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 0.5 },
      });
    }

    /* mouse-move glow drift */
    if (fine) {
      const glows = $$(".backdrop__glow");
      window.addEventListener("mousemove", (e) => {
        const dx = (e.clientX / innerWidth - 0.5);
        const dy = (e.clientY / innerHeight - 0.5);
        glows.forEach((g, i) => {
          gsap.to(g, { x: dx * (i ? 30 : 60), y: dy * (i ? 30 : 60), duration: 1.2, ease: "power2.out" });
        });
      }, { passive: true });
    }

    /* section number counters */
    $$("[data-counter-group]").forEach((group) => {
      ST.create({
        trigger: group,
        start: "top 80%",
        once: true,
        onEnter: () => {
          $$("[data-count]", group).forEach((el) => {
            const target = parseInt(el.dataset.count, 10);
            const obj = { v: 0 };
            gsap.to(obj, {
              v: target,
              duration: 1.4,
              ease: "power2.out",
              onUpdate: () => { el.textContent = Math.round(obj.v); },
            });
          });
        },
      });
    });

    /* gallery tile drift (transform only — opacity handled separately) */
    $$("[data-parallax-tile]").forEach((tile, i) => {
      gsap.fromTo(tile,
        { yPercent: (i % 2 ? 6 : -4) },
        {
          yPercent: (i % 2 ? -6 : 4),
          ease: "none",
          scrollTrigger: { trigger: tile, start: "top bottom", end: "bottom top", scrub: 0.8 },
        }
      );
    });

    ST.refresh();
  }

  function fallbackReveal() {
    // Backstop: IntersectionObserver reveals items even if GSAP/ScrollTrigger
    // never load or the ticker is throttled. Safe to run alongside ScrollTrigger.
    if (!("IntersectionObserver" in window)) {
      $$("[data-reveal]").forEach((el) => el.classList.add("is-in"));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -8% 0px" });
    $$("[data-reveal]:not(.is-in)").forEach((el) => io.observe(el));
  }

  let booted = false;
  function sweepInView() {
    // Reveal anything at/above the fold that hasn't been revealed yet.
    const h = window.innerHeight || 800;
    $$("[data-reveal]:not(.is-in)").forEach((el) => {
      if (el.getBoundingClientRect().top < h * 0.95) el.classList.add("is-in");
    });
  }

  function boot() {
    if (booted) return;
    booted = true;
    initGSAP();
    fallbackReveal();          // IntersectionObserver backstop
    sweepInView();             // immediate: reveal current viewport
    window.addEventListener("scroll", sweepInView, { passive: true });
    setTimeout(sweepInView, 1200);
  }

  if (document.readyState === "complete") {
    boot();
  } else {
    window.addEventListener("load", boot);
    setTimeout(boot, 2600);
  }
})();
