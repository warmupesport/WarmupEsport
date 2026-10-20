/* ==========================================================
   WARMUP ESPORT — Accueil immersif
   GSAP + ScrollTrigger pour les animations, Lenis pour le smooth scroll.
   Si les librairies ne chargent pas, la page reste lisible (sans animations).
   ========================================================== */

(() => {
  const hasGsap = !!(window.gsap && window.ScrollTrigger);
  const mobile = matchMedia("(max-width: 767px)").matches;
  const touch = matchMedia("(pointer: coarse)").matches;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const pad = (n) => String(n).padStart(2, "0");
  if (hasGsap) gsap.registerPlugin(ScrollTrigger);
  else document.body.classList.add("no-gsap");

  /* ---------- Smooth scroll (Lenis) ---------- */
  let lenis = null;
  if (window.Lenis && !reduced) {
    lenis = new Lenis({ duration: 1.2, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
    if (hasGsap) {
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }
  const goTo = (target) => {
    if (lenis) return lenis.scrollTo(target);
    if (typeof target === "number") window.scrollTo({ top: target, behavior: "smooth" });
    else target.scrollIntoView({ behavior: "smooth" });
  };
  $$('a[href^="#"]').forEach((a) => a.addEventListener("click", (e) => {
    const t = $(a.getAttribute("href"));
    if (t) { e.preventDefault(); goTo(t); }
  }));

  /* ---------- 1. Hero : voir js/hero.js ---------- */

  /* ---------- 2. Maillots (flèches pour passer d'un maillot à l'autre) ---------- */
  const colSec = $(".collections");
  const items = COLLECTIONS.map((c) => ({ ...c, p: PRODUCTS.find((p) => p.id === c.product) })).filter((c) => c.p);
  $(".col-center").innerHTML = items.map((c, i) =>
    `<div class="col-jersey${i ? "" : " on"}">${c.p.image ? `<img src="${c.p.image}" alt="${c.p.name}">` : jerseySVG(c.p.design)}</div>`).join("");
  $(".col-progress").innerHTML = items.map((c) => `<button aria-label="${c.name}"><span></span></button>`).join("");
  $(".col-num .tot").textContent = pad(items.length);
  $(".col-particles").innerHTML = Array.from({ length: mobile ? 14 : 36 }, () => {
    const s = (Math.random() * 3 + 1).toFixed(1);
    return `<i style="left:${Math.random() * 100}%;top:${Math.random() * 100}%;--s:${s}px;--d:${(Math.random() * 8 + 6).toFixed(1)}s;--delay:-${(Math.random() * 10).toFixed(1)}s"></i>`;
  }).join("");

  const setText = (i) => {
    const c = items[i];
    $(".col-num .cur").textContent = pad(i + 1);
    $(".col-name").textContent = c.name;
    $(".col-headline").textContent = c.headline;
    $(".col-desc").textContent = c.p.desc;
    $(".col-specs").innerHTML = Object.entries(c.specs).map(([k, v]) => `<div><small>${k}</small><b>${v}</b></div>`).join("");
    $(".col-price").innerHTML = euro(c.p.price) + (c.p.oldPrice ? ` <s>${euro(c.p.oldPrice)}</s>` : "");
    $(".col-link").href = "boutique.html#" + c.p.id;
    $$(".col-progress button").forEach((b, j) => b.classList.toggle("active", j === i));
  };
  const setPalette = (i, instant) => {
    const { light, mid, dark } = items[i].palette;
    const vars = { "--c-light": light, "--c-mid": mid, "--c-dark": dark };
    if (hasGsap && !instant) gsap.to(colSec, { ...vars, duration: 1, ease: "power2.out" });
    else Object.entries(vars).forEach(([k, v]) => colSec.style.setProperty(k, v));
  };

  let active = 0;
  const jerseys = $$(".col-jersey");
  const textEls = () => $$(".col-left > *, .col-right > *");
  // dir = 1 : le maillot part à gauche et le suivant arrive par la droite ; -1 : l'inverse
  function show(i, dir = i > active ? 1 : -1) {
    if (i === active) return;
    const prev = active; active = i;
    if (!hasGsap) { jerseys.forEach((j, k) => j.classList.toggle("on", k === i)); setText(i); setPalette(i, true); return; }
    gsap.to(jerseys[prev], { xPercent: -70 * dir, opacity: 0, rotate: -10 * dir, scale: 0.85, duration: 0.5, ease: "power3.in", overwrite: true });
    gsap.fromTo(jerseys[i], { xPercent: 70 * dir, opacity: 0, rotate: 10 * dir, scale: 0.85 },
      { xPercent: 0, opacity: 1, rotate: 0, scale: 1, duration: 0.9, ease: "expo.out", delay: 0.2, overwrite: true });
    gsap.to(textEls(), {
      y: -30, opacity: 0, duration: 0.25, stagger: 0.03, overwrite: true,
      onComplete() { setText(active); gsap.fromTo(textEls(), { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, stagger: 0.05, ease: "power3.out" }); },
    });
    setPalette(i);
  }
  const step = (d) => show((active + d + items.length) % items.length, d);
  setText(0); setPalette(0, true);
  if (hasGsap) gsap.set(jerseys.slice(1), { opacity: 0 });

  // Flèches, points, clavier (← →) et glissé du doigt sur mobile
  $(".col-arrow.prev").onclick = () => step(-1);
  $(".col-arrow.next").onclick = () => step(1);
  $$(".col-progress button").forEach((b, i) => (b.onclick = () => show(i)));
  addEventListener("keydown", (e) => {
    const r = colSec.getBoundingClientRect();
    if (r.top > innerHeight / 2 || r.bottom < innerHeight / 2 || e.target.closest("input, textarea, select")) return;
    if (e.key === "ArrowLeft") step(-1);
    if (e.key === "ArrowRight") step(1);
  });
  let x0 = null;
  colSec.addEventListener("touchstart", (e) => (x0 = e.touches[0].clientX), { passive: true });
  colSec.addEventListener("touchend", (e) => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0; x0 = null;
    if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
  }, { passive: true });

  /* ---------- 3. Notre histoire ---------- */
  $(".heritage-img").innerHTML = SITE.teamVideo
    ? `<video src="${SITE.teamVideo}" autoplay muted loop playsinline preload="auto" aria-label="Vidéo Warmup Esport"></video>`
    : SITE.teamPhoto
      ? `<img src="${SITE.teamPhoto}" alt="L'équipe Warmup Esport">`
      : `<div class="heritage-ph"><img src="assets/logo.png" alt=""><span>Photo d'équipe</span></div>`;
  if (hasGsap) {
    gsap.fromTo(".heritage-media", { clipPath: "inset(18% 22% 18% 22%)" }, {
      clipPath: "inset(0% 0% 0% 0%)", ease: "none",
      scrollTrigger: { trigger: ".heritage", start: "top 85%", end: "center center", scrub: true },
    });
    gsap.to(".heritage-img", {
      yPercent: touch ? 4 : 15, ease: "none",
      scrollTrigger: { trigger: ".heritage", start: "top bottom", end: "bottom top", scrub: true },
    });
    gsap.from(".heritage-text > *", {
      y: 50, opacity: 0, duration: 1, stagger: 0.12, ease: "power3.out",
      scrollTrigger: { trigger: ".heritage-text", start: "top 75%" },
    });
  }

  /* ---------- 4. Roster : 3 joueurs en aperçu (le reste sur joueurs.html) ---------- */
  $(".roster-grid").innerHTML = PLAYERS.slice(0, 3).map((p) => `
    <a class="r-card fade-up" href="joueurs.html">
      <div class="r-media">
        ${p.photo ? `<img class="photo" src="${p.photo}" alt="${p.pseudo}">` : silhouetteSVG(p)}
        <span class="tag r-tag">${p.role}</span>
        <span class="r-num">${pad(p.number)}</span>
      </div>
      <div class="r-body">
        <h3>${p.pseudo}</h3>
        <p class="r-specs">${Object.entries(p.stats).slice(0, 3).map(([k, v]) => `${k} ${v}`).join(" • ")}</p>
        <div class="r-foot">
          <span>${p.flag} ${p.name}</span>
          <span class="r-arrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>
        </div>
      </div>
    </a>`).join("");

  /* ---------- 6. Contact ---------- */
  $("#home-form").onsubmit = (e) => {
    e.preventDefault();
    // ⚠ Site statique : brancher ici un service d'envoi (Formspree, EmailJS…) — voir README.
    e.target.classList.add("sent"); e.target.reset();
  };

  /* ---------- Apparition des sections au scroll ---------- */
  // Cartes du roster : apparition en CSS (classe .in), en cascade
  if (hasGsap) {
    ScrollTrigger.batch(".fade-up", { start: "top 88%", once: true, onEnter: (els) => els.forEach((el) => el.classList.add("in")) });
  } else {
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    }), { threshold: 0.2 });
    $$(".fade-up").forEach((el) => io.observe(el));
  }

  if (hasGsap && !reduced) {
    // 1) Chaque section se « déplie » (coins arrondis qui s'ouvrent) en entrant dans l'écran
    $$("main > section:not(#hero-runway)").forEach((sec) => {
      gsap.fromTo(sec, { clipPath: "inset(7% 5% 0% 5% round 32px)" }, {
        clipPath: "inset(0% 0% 0% 0% round 0px)", ease: "none",
        scrollTrigger: { trigger: sec, start: "top bottom", end: "top 20%", scrub: true },
      });
    });

    // 2) Puis son contenu arrive en cascade
    const reveal = (targets, vars, trigger, start = "top 70%") => gsap.from(targets, {
      opacity: 0, duration: 1, ease: "power3.out", stagger: 0.1, clearProps: "transform", ...vars,
      scrollTrigger: { trigger, start },
    });
    reveal(".col-left > *", { x: -80 }, ".collections", "top 55%");
    reveal(".col-stage", { scale: 0.6, rotate: -10, duration: 1.4, ease: "expo.out" }, ".collections", "top 55%");
    reveal(".col-right > *", { x: 80 }, ".collections", "top 55%");
    reveal(".col-progress", { y: 30 }, ".collections", "top 55%");
    reveal(".roster > .roster-head > *", { y: 70 }, ".roster");
    reveal(".roster-more", { y: 40, scale: 0.9 }, ".roster-more", "top 90%");
    reveal(".cta-inner > *", { y: 70, stagger: 0.12 }, ".cta-banner");
    reveal(".ch-head > *", { y: 70 }, ".contact-home");
    reveal(".line-form > *", { y: 40, stagger: 0.08 }, ".contact-home", "top 60%");

    // Le grand logo du bandeau tourne et grossit au rythme du scroll
    gsap.fromTo(".cta-logo", { yPercent: -50, scale: 0.4, rotate: -45, opacity: 0 }, {
      yPercent: -50, scale: 1, rotate: -10, opacity: 0.2, ease: "none",
      scrollTrigger: { trigger: ".cta-banner", start: "top bottom", end: "center center", scrub: true },
    });
  }

  // Recalcule les positions une fois polices et images chargées (elles décalent la mise en page)
  if (hasGsap) {
    document.fonts?.ready.then(() => ScrollTrigger.refresh());
    addEventListener("load", () => ScrollTrigger.refresh());
  }
})();
