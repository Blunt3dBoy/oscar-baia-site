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

  /* ---------- intro sound ----------
     Browsers block audio autoplay until the visitor interacts. We try right
     away AND keep listeners armed so the first gesture (tap / click / key /
     scroll) plays it. Marked done only once it actually starts. Once per load. */
  (function introSound() {
    let audio;
    try {
      audio = new Audio("/assets/audio/intro.mp3");
      audio.preload = "auto";
      audio.volume = 0.15;
    } catch (e) { return; }

    let done = false;
    const evts = ["pointerdown", "pointerup", "click", "touchstart", "touchend", "keydown", "wheel", "scroll"];
    function cleanup() {
      evts.forEach((t) => {
        document.removeEventListener(t, onGesture, true);
        window.removeEventListener(t, onGesture, true);
      });
    }
    function onGesture() { attempt(); }
    function attempt() {
      if (done) return;
      let p;
      try { p = audio.play(); } catch (e) { return; }
      if (p && typeof p.then === "function") {
        p.then(() => { done = true; cleanup(); }).catch(() => {});
      } else {
        done = true; cleanup();
      }
    }

    evts.forEach((t) => {
      document.addEventListener(t, onGesture, { capture: true, passive: true });
      window.addEventListener(t, onGesture, { capture: true, passive: true });
    });
    if (document.readyState === "loading") window.addEventListener("DOMContentLoaded", attempt);
    else attempt();
    window.addEventListener("load", attempt);
  })();

  /* ---------- shared sound-effect player (Web Audio, one context) ----------
     Buffers are decoded up front; the context is resumed synchronously on
     every tap (needed on iOS) so a cached sound fires inside the gesture. */
  const Sfx = (function () {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return { play: function () {}, load: function () {}, unlock: function () {} };
    let ctx, primed = false;
    const buffers = {};
    const loading = {};
    function ctxt() { return (ctx = ctx || new AC()); }
    function prime() {
      // one silent blip to wake the iOS audio pipeline so the FIRST real sound plays
      if (primed) return;
      primed = true;
      try {
        const c = ctxt();
        const s = c.createBufferSource();
        s.buffer = c.createBuffer(1, 1, 22050);
        s.connect(c.destination);
        s.start(0);
      } catch (e) {}
    }
    function unlock() {
      const c = ctxt();
      if (c.state === "suspended" && c.resume) { try { c.resume(); } catch (e) {} }
      prime();
    }
    function load(url) {
      if (buffers[url]) return Promise.resolve(buffers[url]);
      if (loading[url]) return loading[url];
      loading[url] = fetch(url)
        .then((r) => r.arrayBuffer())
        .then((a) => ctxt().decodeAudioData(a))
        .then((b) => { buffers[url] = b; return b; })
        .catch(() => null);
      return loading[url];
    }
    function fire(buf, opts) {
      const c = ctxt();
      const src = c.createBufferSource();
      src.buffer = buf;
      src.playbackRate.value = opts.rate || 1;
      const g = c.createGain();
      g.gain.value = opts.gain != null ? opts.gain : 0.5;
      src.connect(g).connect(c.destination);
      try { src.start(0, 0, opts.dur || undefined); } catch (e) { try { src.start(); } catch (e2) {} }
    }
    function play(url, opts) {
      opts = opts || {};
      unlock();
      const c = ctxt();
      const emit = () => {
        const b = buffers[url];
        if (b) fire(b, opts);
        else load(url).then((bb) => { if (bb) fire(bb, opts); });
      };
      if (c.state === "running") emit();
      else if (c.resume) c.resume().then(emit).catch(emit);
      else emit();
    }
    return { play: play, load: load, unlock: unlock, ctx: ctxt };
  })();
  /* ---------- one stage, one performer ----------
     Every music source registers how to silence itself. Whoever starts
     playing claims the stage and everything else stops. */
  const Stage = (function () {
    const stoppers = [];
    return {
      register(fn) { stoppers.push(fn); },
      claim(mine) { stoppers.forEach((s) => { if (s !== mine) { try { s(); } catch (e) {} } }); },
    };
  })();

  const CLICK_SND = "/assets/audio/click.mp3";
  const BACK_SND = "/assets/audio/back.mp3";
  const ENTER_SND = "/assets/audio/enter.mp3";
  const FOLLOW_SND = "/assets/audio/follow.mp3";
  const SUBMIT_SND = "/assets/audio/submit.mp3?v=2";
  const LOGO_SND = "/assets/audio/logo.mp3";

  /* ---------- UI sounds: nav clicks (descending pitch), back, hero CTAs ---------- */
  (function uiSounds() {
    const groups = [$$(".nav__links a"), $$(".mobile-menu nav a")].filter((g) => g.length);

    groups.forEach((links) => {
      const n = links.length;
      links.forEach((a, i) => {
        // the "top / back to top" entries get the dedicated back sound instead
        if (a.classList.contains("nav__top") || a.classList.contains("mobile-menu__top")) return;
        const rate = 1.35 - (n > 1 ? i / (n - 1) : 0) * 0.65;   // 1.35 (high) → 0.70 (low)
        a.addEventListener("pointerdown", () => Sfx.play(CLICK_SND, { rate: rate, gain: 0.45, dur: 0.3 }), { passive: true });
      });
    });

    // dedicated "back / back to top" sound
    $$(".nav__top, .mobile-menu__top, .footer__top").forEach((a) => {
      a.addEventListener("pointerdown", () => Sfx.play(BACK_SND, { rate: 0.72, gain: 0.5, dur: 0.5 }), { passive: true });
    });

    // CTA buttons (hero Listen / Get in touch, nav Bookings) — a bit louder
    $$(".hero__actions .btn, .nav__cta").forEach((b) => {
      b.addEventListener("pointerdown", () => Sfx.play(ENTER_SND, { gain: 0.95 }), { passive: true });
    });

    // Oscar Baia logo — quarter volume
    $$(".nav__brand").forEach((b) => {
      b.addEventListener("pointerdown", () => Sfx.play(LOGO_SND, { gain: 0.25 }), { passive: true });
    });

    // form submit buttons (Send enquiry / Subscribe) — lower pitch
    $$("#bookingForm button[type='submit'], #subForm button[type='submit']").forEach((b) => {
      b.addEventListener("pointerdown", () => Sfx.play(SUBMIT_SND, { rate: 0.75, gain: 0.6, dur: 0.6 }), { passive: true });
    });

    // social / follow links — each a step lower in pitch, left → right
    // (Instagram, Facebook, TikTok, Mixcloud, SoundCloud)
    [$$(".social a"), $$(".mobile-menu__foot a")].filter((g) => g.length).forEach((links) => {
      const n = links.length;
      links.forEach((a, i) => {
        const rate = 0.95 - (n > 1 ? i / (n - 1) : 0) * 0.35;   // 0.95 → 0.60
        a.addEventListener("pointerdown", () => Sfx.play(FOLLOW_SND, { rate: rate, gain: 0.6, dur: 0.7 }), { passive: true });
      });
    });

    // pre-decode every sfx (no gesture needed) so the first tap is instant,
    // and keep the audio context resumed on every tap (iOS needs this)
    [CLICK_SND, BACK_SND, ENTER_SND, FOLLOW_SND, SUBMIT_SND, LOGO_SND].forEach((u) => Sfx.load(u));
    ["pointerdown", "touchstart", "keydown"].forEach((t) =>
      document.addEventListener(t, Sfx.unlock, { passive: true, capture: true })
    );
  })();

  /* ---------- Mixcloud carousel — every set from the Mixcloud API as an
     infinite strip: drag with the cursor, flick, wheel, or let it drift.
     Click a cover to load it in the now-playing panel. */
  (function mixWheel() {
    const wheel = $("#mixwheel");
    const scroller = $("#mixScroller");
    const track = $("#mixTrack");
    const player = $("#mixPlayer");
    const npArt = $("#npArt");
    const npTitle = $("#npTitle");
    const npLink = $("#npLink");
    const nowPlaying = $("#nowPlaying");
    if (!wheel || !scroller || !track) return;

    const clean = (s) => {
      const t = String(s || "")
        .replace(/^\s*(dj\s+)?oscar\s*ba[ií]a\s*(live)?\s*[@·:\-–—]*\s*/i, "")
        .replace(/[_]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      return t || String(s || "");
    };
    const widget = (key, autoplay) =>
      "https://www.mixcloud.com/widget/iframe/?mini=1&hide_cover=1&hide_artwork=1&light=0&autoplay=" +
      (autoplay ? "1" : "0") + "&feed=" + encodeURIComponent(key);

    // Mixcloud Widget API — controls the embedded player
    let mc = null;
    function initMc() {
      if (mc || !player || !window.Mixcloud || !window.Mixcloud.PlayerWidget) return;
      try { mc = window.Mixcloud.PlayerWidget(player); } catch (e) { mc = null; }
    }
    // let the rest of the site silence this player
    const stopMix = () => { if (mc && mc.pause) { try { mc.pause(); } catch (e) {} } };
    Stage.register(stopMix);

    function playKey(key, autoplay) {
      initMc();
      if (autoplay) Stage.claim(stopMix);          // stop anything else first
      const fallback = () => { if (player) player.src = widget(key, autoplay); };
      if (!mc) { fallback(); return; }
      try {
        const p = mc.load(key, !!autoplay);
        if (p && p.then) {
          p.then(() => { if (autoplay && mc.play) mc.play(); }).catch(fallback);
        }
      } catch (e) { fallback(); }
    }

    function card(c) {
      const pics = c.pictures || {};
      const pic = pics["640wx640h"] || pics.large || pics["320wx320h"] || pics.medium || "";
      const b = document.createElement("button");
      b.type = "button";
      b.className = "mixcard";
      b.dataset.key = c.key;
      b.dataset.pic = pic;
      b.dataset.title = clean(c.name);
      b.dataset.url = c.url || "https://www.mixcloud.com/oscarbaia/";
      b.setAttribute("aria-label", "Play: " + b.dataset.title);
      const art = document.createElement("span");
      art.className = "mixcard__art";
      if (pic) {
        const img = document.createElement("img");
        img.src = pic; img.alt = ""; img.decoding = "async"; img.draggable = false;
        art.appendChild(img);
      }
      const title = document.createElement("span");
      title.className = "mixcard__title";
      title.textContent = b.dataset.title;
      b.append(art, title);
      return b;
    }

    function select(el, autoplay) {
      const key = el.dataset.key;
      if (npTitle) npTitle.textContent = el.dataset.title;
      if (npArt && el.dataset.pic) { npArt.src = el.dataset.pic; npArt.alt = el.dataset.title; }
      if (npLink && el.dataset.url) npLink.href = el.dataset.url;
      $$(".mixcard", track).forEach((c) => c.classList.toggle("is-active", c.dataset.key === key));
      playKey(key, autoplay);
    }

    function build(items) {
      const base = items.map(card);

      // enough copies to always be wider than ~3 viewports so the wrap
      // (jump by one set) is never visible in either direction
      let copies = 4;
      const est = items.length * 110;
      while (est * copies < window.innerWidth * 2.6 && copies < 10) copies++;

      const frag = document.createDocumentFragment();
      for (let i = 0; i < copies; i++) {
        base.forEach((c) => {
          const cl = c.cloneNode(true);
          if (i !== 1) { cl.setAttribute("aria-hidden", "true"); cl.tabIndex = -1; }
          frag.appendChild(cl);
        });
      }
      track.appendChild(frag);

      // seed the now-playing panel + player with the newest set
      if (base[0]) {
        if (npArt && base[0].dataset.pic) { npArt.src = base[0].dataset.pic; }
        if (npTitle) npTitle.textContent = base[0].dataset.title;
        if (npLink) npLink.href = base[0].dataset.url;
        if (player) player.src = widget(base[0].dataset.key, false);
      }
      initMc();
      window.addEventListener("load", initMc);

      wheel.hidden = false;                              // must be visible to measure
      const setW = track.scrollWidth / copies;           // width of one full set
      scroller.scrollLeft = setW;                        // start one set in
      setTimeout(() => wheel.classList.add("is-in"), 30);

      const DRIFT = 0.35;                                 // px per frame when idle
      let idleUntil = 0;
      let down = false, sx = 0, ss = 0, moved = 0;
      const nudgeIdle = (ms) => { idleUntil = Date.now() + (ms || 2600); };

      function wrap() {
        const x = scroller.scrollLeft;
        if (x < setW || x >= setW * 2) {
          // content repeats every setW, so land the equivalent spot in [setW, 2·setW)
          scroller.scrollLeft = setW + (((x - setW) % setW) + setW) % setW;
        }
      }

      // auto-drift
      (function loop() {
        if (!reduceMotion && Date.now() > idleUntil && !down) {
          scroller.scrollLeft += DRIFT;
        }
        wrap();
        requestAnimationFrame(loop);
      })();
      scroller.addEventListener("scroll", wrap, { passive: true });

      // trackpad horizontal swipe → scroll the strip (vertical wheel still scrolls the page)
      scroller.addEventListener("wheel", (e) => {
        if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
        e.preventDefault();
        scroller.scrollLeft += e.deltaX;
        nudgeIdle(1800);
      }, { passive: false });

      // mouse drag (no pointer capture — that was swallowing the card click).
      // touch scrolls natively (touch-action: pan-x).
      scroller.addEventListener("mousedown", (e) => {
        if (e.button !== 0) return;
        down = true; moved = 0;
        sx = e.clientX; ss = scroller.scrollLeft;
        nudgeIdle(4000);
      });
      window.addEventListener("mousemove", (e) => {
        if (!down) return;
        const dx = e.clientX - sx;
        if (Math.abs(dx) < 3 && moved === 0) return;   // a click, not a drag — leave it alone
        moved = Math.max(moved, Math.abs(dx));
        scroller.classList.add("is-grabbing");         // cursor only; never blocks card clicks
        scroller.scrollLeft = ss - dx;
        e.preventDefault();
      });
      window.addEventListener("mouseup", () => {
        if (!down) return;
        down = false;
        scroller.classList.remove("is-grabbing");
        nudgeIdle(moved > 8 ? 3000 : 1200);
      });
      scroller.addEventListener("mouseenter", () => nudgeIdle(1400));
      scroller.addEventListener("mouseleave", () => { if (!down) nudgeIdle(300); });
      scroller.addEventListener("touchstart", () => nudgeIdle(3500), { passive: true });

      // click a card → play (skip only if it was clearly a drag)
      track.addEventListener("click", (e) => {
        const c = e.target.closest(".mixcard");
        if (!c) return;
        if (moved > 8) { moved = 0; return; }
        moved = 0;
        select(c, true);
        nudgeIdle(6000);
        if (nowPlaying) { try { nowPlaying.scrollIntoView({ block: "nearest", behavior: "smooth" }); } catch (e2) {} }
      });
      track.addEventListener("pointerdown", (e) => {
        if (e.target.closest(".mixcard")) Sfx.play(CLICK_SND, { rate: 0.82, gain: 0.4, dur: 0.3 });
      }, { passive: true });
    }

    fetch("https://api.mixcloud.com/oscarbaia/cloudcasts/?limit=100")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        const items = (j && Array.isArray(j.data)) ? j.data.filter((c) => c && c.key) : [];
        if (items.length) build(items);
      })
      .catch(() => {});
  })();

  /* ---------- discography previews (2-minute Beatport clips) ----------
     Clicking a release plays only that one — anything else playing stops. */
  (function discography() {
    const btns = $$(".release__play[data-preview]");
    if (!btns.length) return;

    let audio = null, current = null;

    function stop() {
      if (audio) { try { audio.pause(); } catch (e) {} }
      if (current) {
        const li = current.closest(".release");
        if (li) li.classList.remove("is-playing");
        current = null;
      }
    }
    Stage.register(stop);

    btns.forEach((btn) => {
      btn.addEventListener("pointerdown", () => {
        Sfx.play(CLICK_SND, { rate: 0.8, gain: 0.35, dur: 0.3 });
      }, { passive: true });

      btn.addEventListener("click", () => {
        if (current === btn) { stop(); return; }        // click again = stop
        Stage.claim(stop);                              // silence everything else
        stop();
        if (!audio) {
          audio = new Audio();
          audio.preload = "none";
          audio.volume = 0.85;
          audio.addEventListener("ended", stop);
          audio.addEventListener("error", stop);
        }
        audio.src = btn.dataset.preview;
        current = btn;
        const li = btn.closest(".release");
        if (li) li.classList.add("is-playing");
        const p = audio.play();
        if (p && p.catch) p.catch(() => stop());
      });
    });
  })();

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

  /* ---------- mobile: device back button -> scroll to top first ----------
     On phones, once the visitor has scrolled down we drop a single history
     entry. The first back-press then returns them to the top of the page
     (or closes an open overlay); a second back-press leaves the site as
     usual. Desktop is untouched. */
  (function mobileBackToTop() {
    if (!window.matchMedia("(max-width: 900px)").matches) return;
    if (!window.history || !history.pushState) return;

    let armed = false;
    let suppress = false;

    const scrolled = () => (window.scrollY || document.documentElement.scrollTop || 0) > 40;

    function arm() {
      if (armed || suppress || !scrolled()) return;
      armed = true;
      history.pushState({ obBackTop: true }, "", location.href);
    }

    function goTop() {
      suppress = true;
      try { history.replaceState(null, "", location.pathname + location.search + "#hero"); } catch (e) {}
      try { window.scrollTo({ top: 0, behavior: "smooth" }); } catch (e) { window.scrollTo(0, 0); }
      // snap to top if the smooth scroll was ignored / never started
      setTimeout(() => { if (window.scrollY > 4) window.scrollTo(0, 0); }, 1200);
      setTimeout(() => { suppress = false; }, 1400);
    }

    window.addEventListener("scroll", arm, { passive: true });

    window.addEventListener("popstate", () => {
      armed = false;

      const openLightbox = document.querySelector(".lightbox.is-open");
      if (openLightbox) { Sfx.play(BACK_SND, { rate: 0.72, gain: 0.5, dur: 0.5 }); openLightbox.click(); return; }
      if (document.body.classList.contains("menu-open")) { Sfx.play(BACK_SND, { rate: 0.72, gain: 0.5, dur: 0.5 }); setMenu(false); return; }

      if (scrolled()) { Sfx.play(BACK_SND, { rate: 0.72, gain: 0.5, dur: 0.5 }); goTop(); }
    });
  })();

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
        `mailto:booking@oscarbaia.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      const g = window.__i18nGet;
      $("#formHint").textContent = (g && g("form.sent")) || "Your email app should now be open.";
    });
  }

  /* ---------- newsletter: double opt-in via /api/subscribe ---------- */
  const sub = $("#subForm");
  if (sub) {
    sub.addEventListener("submit", async (e) => {
      e.preventDefault();
      const hint = $("#subHint");
      if (!sub.checkValidity()) { sub.reportValidity(); return; }
      const email = sub.email.value.trim();
      const consent = sub.consent.checked;
      const lang = window.__lang || "en";
      const submitBtn = sub.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      hint.textContent = "";
      try {
        const res = await fetch("/api/subscribe", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email, consent, lang }),
        });
        const data = await res.json().catch(() => null);
        hint.textContent = data?.message || (res.ok ? "Check your inbox to confirm." : "Something went wrong — please try again.");
        if (res.ok) sub.reset();
      } catch (err) {
        hint.textContent = "Couldn't reach the server — please try again shortly.";
      } finally {
        submitBtn.disabled = false;
      }
    });
  }

  /* ---------- gallery lightbox (click to open, click / Esc to close) ---------- */
  (function lightbox() {
    const tiles = $$(".gallery__grid .tile");
    if (!tiles.length) return;

    const box = document.createElement("div");
    box.className = "lightbox";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    box.setAttribute("aria-hidden", "true");
    box.hidden = true;
    box.innerHTML =
      '<button type="button" class="lightbox__close">' +
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6 18 18M18 6 6 18"/></svg>' +
      "</button>" +
      '<figure class="lightbox__stage">' +
        '<img alt="" /><figcaption></figcaption>' +
      "</figure>";
    document.body.appendChild(box);

    const img = box.querySelector("img");
    const cap = box.querySelector("figcaption");
    const closeBtn = box.querySelector(".lightbox__close");
    let lastFocus = null;

    const syncCloseLabel = () => {
      const g = window.__i18nGet;
      closeBtn.setAttribute("aria-label", (g && g("gallery.close")) || "Close");
    };
    syncCloseLabel();
    document.addEventListener("langchange", syncCloseLabel);

    function open(tile) {
      const src = tile.querySelector("img");
      if (!src) return;
      lastFocus = document.activeElement;
      img.src = src.currentSrc || src.src;
      img.alt = src.alt || "";
      const fc = tile.querySelector("figcaption");
      cap.textContent = fc ? fc.textContent.trim() : "";
      cap.hidden = !cap.textContent;
      box.hidden = false;
      void box.offsetWidth;                 // reflow so the fade-in runs
      box.classList.add("is-open");
      box.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      closeBtn.focus({ preventScroll: true });
    }

    function close() {
      if (!box.classList.contains("is-open")) return;
      box.classList.remove("is-open");
      box.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      const done = () => {
        if (box.classList.contains("is-open")) return;   // reopened meanwhile
        box.hidden = true;
        img.removeAttribute("src");
      };
      box.addEventListener("transitionend", done, { once: true });
      setTimeout(done, 400);
      if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    }

    tiles.forEach((tile) => {
      tile.setAttribute("role", "button");
      tile.setAttribute("tabindex", "0");
      const fc = tile.querySelector("figcaption");
      tile.setAttribute("aria-label", "Open image" + (fc ? " — " + fc.textContent.trim() : ""));
      tile.addEventListener("click", () => open(tile));
      tile.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(tile); }
      });
    });

    box.addEventListener("click", close);   // tap anywhere (incl. the image) closes
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
    });
  })();

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

    /* slow, continuous Ken Burns drift once the intro has landed —
       scale + object-position only, so it never fights the scroll
       parallax (which owns yPercent). Desktop only. */
    let kbStarted = false;
    function startKenBurns() {
      if (kbStarted || !photoImg) return;
      if (window.matchMedia("(max-width: 900px)").matches) return;
      kbStarted = true;
      gsap.fromTo(photoImg, { scale: 1, xPercent: 0 }, {
        scale: 1.24, xPercent: 6, duration: 16, ease: "sine.inOut", repeat: -1, yoyo: true,
      });
    }

    function playIntro() {
      gsap.set(heroWords, { yPercent: 115 });
      gsap.set(introTargets, { opacity: 0, y: 20 });
      if (photoMask) gsap.set(photoMask, { clipPath: "inset(0 100% 0 0)" });
      if (photoImg) gsap.set(photoImg, { scale: 1.18 });

      const tl = gsap.timeline({ delay: 0.15, onComplete: () => { revealHero(); startKenBurns(); } });
      if (photoMask) tl.to(photoMask, { clipPath: "inset(0 0% 0 0)", duration: 1.25, ease: "expo.out" }, 0);
      if (photoImg) tl.to(photoImg, { scale: 1, duration: 1.7, ease: "expo.out" }, 0);
      tl.to(".hero__kicker", { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }, 0.1)
        .to(heroWords, { yPercent: 0, duration: 1, ease: "expo.out", stagger: 0.08 }, "-=0.3")
        .to(".hero__sub", { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }, "-=0.5")
        .to(".hero__actions", { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }, "-=0.4");
      // safety: force final state if the timeline stalls
      setTimeout(() => { if (tl.progress() < 1) { tl.progress(1).kill(); revealHero(); } startKenBurns(); }, 4500);
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
