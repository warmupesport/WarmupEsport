/* ==========================================================
   WARMUP ESPORT — Scripts communs
   ========================================================== */

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const euro = (n) => n.toFixed(2).replace(".", ",") + " €";
const PAGE = document.body.dataset.page;

/* ---------- Header / footer / éléments communs ---------- */
function buildLayout() {
  const links = [
    ["index.html", "Accueil", "home"],
    ["joueurs.html", "Joueurs", "joueurs"],
    ["boutique.html", "Boutique", "boutique"],
    ["faq.html", "FAQ", "faq"],
    ["contact.html", "Contact", "contact"],
  ];
  const nav = document.createElement("header");
  nav.className = "nav" + (PAGE === "home" ? "" : " solid");
  nav.innerHTML = `
      <a href="index.html" class="brand" aria-label="Warmup Esport - accueil">
        <img src="assets/logo.png" alt="">
        <span>WARM<span class="accent">UP</span></span>
      </a>
      <ul class="nav-links">
        ${links.map(([h, t, p]) => `<li><a href="${h}" class="${p === PAGE ? "active" : ""}">${t}</a></li>`).join("")}
      </ul>
      <div class="nav-actions">
        <a href="compte.html" class="account-btn" aria-label="Mon compte">${
          typeof Auth !== "undefined" && Auth.user()
            ? `<span class="account-initial">${Auth.user().firstName.charAt(0).toUpperCase()}</span>`
            : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>`
        }</a>
        <button class="cart-btn" aria-label="Ouvrir le panier">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 7h12l-1 13H7L6 7Z"/><path d="M9 7a3 3 0 0 1 6 0"/></svg>
          <span class="cart-count" data-n="0"></span>
        </button>
        <a href="boutique.html" class="nav-cta">Boutique
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
        </a>
        <button class="burger" aria-label="Menu"><span></span></button>
      </div>`;
  document.body.prepend(nav);

  const s = SITE.socials;
  const footer = document.createElement("footer");
  footer.innerHTML = `
    <div class="container">
      <div class="foot-grid">
        <div>
          <a href="index.html" class="brand"><img src="assets/logo.png" alt=""><span>WARM<span class="accent">UP</span></span></a>
          <p>Équipe esport compétitive. Passion, discipline et esprit d'équipe — on s'échauffe, puis on domine.</p>
        </div>
        <div><h4>Navigation</h4><ul>${links.map(([h, t]) => `<li><a href="${h}">${t}</a></li>`).join("")}</ul></div>
        <div><h4>Réseaux</h4><ul>
          <li><a href="${s.twitter}" target="_blank" rel="noopener">X / Twitter</a></li>
          <li><a href="${s.instagram}" target="_blank" rel="noopener">Instagram</a></li>
          <li><a href="${s.twitch}" target="_blank" rel="noopener">Twitch</a></li>
          <li><a href="${s.tiktok}" target="_blank" rel="noopener">TikTok</a></li>
          <li><a href="${s.discord}" target="_blank" rel="noopener">Discord</a></li>
        </ul></div>
        <div><h4>Boutique</h4><ul>
          <li><a href="boutique.html">Tous les maillots</a></li>
          <li><a href="faq.html">Livraison & retours</a></li>
          <li><a href="faq.html">Guide des tailles</a></li>
          <li><a href="contact.html">Service client</a></li>
        </ul></div>
      </div>
      <div class="foot-bottom">
        <span>© ${new Date().getFullYear()} Warmup Esport — Tous droits réservés</span>
        <nav class="foot-legal" aria-label="Informations légales">
          <a href="mentions-legales.html">Mentions légales</a>
          <a href="cgv.html">CGV</a>
          <a href="confidentialite.html">Confidentialité & cookies</a>
        </nav>
        <small class="foot-tm">Fortnite est une marque déposée d'Epic Games, Inc. Warmup Esport est une structure indépendante, ni affiliée ni sponsorisée par Epic Games.</small>
      </div>
    </div>`;
  document.body.append(footer);

  // Panier latéral + toast + halo curseur
  document.body.insertAdjacentHTML("beforeend", `
    <div class="drawer-bg"></div>
    <aside class="drawer" aria-label="Panier" data-lenis-prevent>
      <div class="drawer-head"><h3>Ton panier</h3><button class="modal-close" style="position:static" aria-label="Fermer">✕</button></div>
      <div class="drawer-items"></div>
      <div class="drawer-foot">
        <div class="total"><span>Total</span><span class="total-val">0,00 €</span></div>
        <a href="checkout.html" class="btn checkout-link">Finaliser la commande <span class="arrow">→</span></a>
        <p>🔒 Paiement sécurisé · Livraison offerte dès ${SHOP.freeShippingFrom} €</p>
      </div>
    </aside>
    <div class="toast"></div>
    <div class="xhair"><i class="t"></i><i class="b"></i><i class="l"></i><i class="r"></i><i class="d"></i><div class="hm"><b></b><b></b><b></b><b></b></div></div>
    <div class="xlock"><b></b><b></b><b></b><b></b></div>`);

  // Interactions nav
  const onScroll = () => nav.classList.toggle("scrolled", scrollY > 30);
  addEventListener("scroll", onScroll, { passive: true }); onScroll();
  $(".burger", nav).onclick = () => nav.classList.toggle("open");
  $$(".nav-links a", nav).forEach((a) => (a.onclick = () => nav.classList.remove("open")));
  $(".cart-btn", nav).onclick = openCart;
  $(".drawer-bg").onclick = closeCart;
  $(".drawer .modal-close").onclick = closeCart;

  // Curseur « viseur » : réticule FPS, crochets qui se verrouillent sur les éléments cliquables, hitmarker au clic
  if (matchMedia("(pointer:fine)").matches) {
    document.body.classList.add("has-cursor");
    const xh = $(".xhair"), lock = $(".xlock");
    let mx = -100, my = -100, target = null;
    addEventListener("mousemove", (e) => {
      mx = e.clientX; my = e.clientY;
      xh.style.transform = `translate(${mx}px, ${my}px)`;
    }, { passive: true });
    addEventListener("mouseover", (e) => {
      target = e.target.closest("a, button, select, .r-card, .player-card, .product-media, label.check");
      document.body.classList.toggle("cursor-text", !!e.target.closest("input, textarea"));
    });
    (function follow() {
      if (target && target.isConnected) {
        const r = target.getBoundingClientRect(), p = 6;
        lock.style.transform = `translate(${r.left - p}px, ${r.top - p}px)`;
        lock.style.width = r.width + p * 2 + "px"; lock.style.height = r.height + p * 2 + "px";
      } else {
        // Au repos, les crochets attendent (invisibles) sur le curseur : ils en « jaillissent » au verrouillage
        target = null;
        lock.style.transform = `translate(${mx - 16}px, ${my - 16}px)`;
        lock.style.width = lock.style.height = "32px";
      }
      lock.classList.toggle("on", !!target);
      xh.classList.toggle("locked", !!target);
      requestAnimationFrame(follow);
    })();
    addEventListener("mousedown", () => { xh.classList.remove("fire"); void xh.offsetWidth; xh.classList.add("fire"); });
    document.addEventListener("mouseleave", () => { mx = my = -100; target = null; xh.style.transform = "translate(-100px, -100px)"; });
  }
}

/* ---------- Rendu SVG d'un maillot ---------- */
let svgId = 0;
function jerseySVG(d, opts = {}) {
  const id = "j" + svgId++;
  const shape = "M98 22 L58 34 L8 76 L36 132 L70 114 L70 304 Q150 316 230 304 L230 114 L264 132 L292 76 L242 34 L202 22 Q150 62 98 22 Z";
  let pattern = "";
  switch (d.pattern) {
    case "chevrons":
      pattern = `
        <path d="M70 150 L150 230 L230 150 L230 180 L150 260 L70 180Z" fill="${d.accent}" opacity=".9"/>
        <path d="M70 196 L150 276 L230 196 L230 210 L150 290 L70 210Z" fill="${d.accent2}" opacity=".7"/>
        <path d="M8 76 L58 34 L70 40 L22 84Z" fill="${d.accent}"/><path d="M292 76 L242 34 L230 40 L278 84Z" fill="${d.accent}"/>`;
      break;
    case "split":
      pattern = `<path d="M0 320 L300 60 L300 320Z" fill="${d.accent}"/><path d="M0 300 L300 40 L300 54 L0 314Z" fill="${d.accent2}"/>`;
      break;
    case "stripes":
      pattern = [90, 130, 170, 210].map((x) => `<rect x="${x}" y="0" width="16" height="320" fill="${d.accent}" opacity=".55"/>`).join("") +
        `<rect x="0" y="0" width="300" height="320" fill="url(#${id}g)" opacity=".5"/>`;
      break;
    case "gradient":
      pattern = `<rect width="300" height="320" fill="url(#${id}n)"/>
        <path d="M70 120 L230 260" stroke="${d.accent2}" stroke-width="3" opacity=".8"/><path d="M70 140 L230 280" stroke="${d.accent}" stroke-width="2"/>`;
      break;
    case "plain":
      pattern = `<rect x="0" y="150" width="300" height="26" fill="${d.accent}"/><rect x="0" y="182" width="300" height="6" fill="${d.accent2}" opacity=".7"/>`;
      break;
  }
  const flock = opts.name || opts.number
    ? `<text x="150" y="${opts.back ? 120 : 0}" text-anchor="middle" font-family="Barlow Condensed, Arial Narrow, sans-serif" font-weight="800" font-size="22" fill="#fff">${opts.name || ""}</text>`
    : "";
  return `
  <svg viewBox="0 0 300 320" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Maillot">
    <defs>
      <clipPath id="${id}c"><path d="${shape}"/></clipPath>
      <linearGradient id="${id}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".15"/><stop offset="1" stop-color="#000" stop-opacity=".4"/></linearGradient>
      <linearGradient id="${id}n" x1="0" y1="0" x2="1" y2="1"><stop offset=".25" stop-color="${d.base}"/><stop offset=".7" stop-color="${d.accent}"/><stop offset="1" stop-color="${d.accent2}"/></linearGradient>
      <linearGradient id="${id}s" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".35"/><stop offset=".25" stop-color="#fff" stop-opacity=".07"/><stop offset=".5" stop-color="#000" stop-opacity="0"/><stop offset=".8" stop-color="#000" stop-opacity=".1"/><stop offset="1" stop-color="#000" stop-opacity=".4"/></linearGradient>
    </defs>
    <g clip-path="url(#${id}c)">
      <rect width="300" height="320" fill="${d.base}"/>
      ${pattern}
      <rect width="300" height="320" fill="url(#${id}s)"/>
    </g>
    <path d="${shape}" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="2"/>
    <path d="M98 22 Q150 62 202 22 Q150 46 98 22Z" fill="${d.accent}" stroke="rgba(255,255,255,.3)"/>
    <path d="M70 114 L70 300 M230 114 L230 300" stroke="rgba(0,0,0,.25)" stroke-width="2"/>
    <image href="assets/logo.png" x="172" y="78" width="38" height="38"/>
    <text x="150" y="${d.pattern === "chevrons" ? 140 : 150}" text-anchor="middle" font-family="Barlow Condensed, Arial Narrow, sans-serif" font-weight="800" font-size="26" letter-spacing="2" fill="#fff" opacity=".95">WARMUP</text>
    ${flock}
  </svg>`;
}

/* Silhouette joueur par défaut (si pas de photo) */
function silhouetteSVG(p) {
  const id = "s" + svgId++;
  return `
  <svg class="silhouette" viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8b3dff"/><stop offset="1" stop-color="#2a1252"/></linearGradient></defs>
    <circle cx="100" cy="70" r="38" fill="url(#${id})"/>
    <path d="M20 220 Q22 130 100 122 Q178 130 180 220Z" fill="url(#${id})"/>
    <path d="M70 128 L100 160 L130 128" fill="none" stroke="#0b0911" stroke-width="5"/>
    <image href="assets/logo.png" x="122" y="150" width="26" height="26" opacity=".9"/>
  </svg>`;
}

/* Cartes du staff (page Joueurs + accueil) */
function staffCards(extraClass = "") {
  return STAFF.map((s) => `
    <article class="staff-card ${extraClass}">
      <div class="staff-photo">
        ${s.photo ? `<img src="${s.photo}" alt="${s.name}" style="--b:${s.brightness || 1}">` : ""}
        <span class="tag">${s.title}</span>
      </div>
      <div class="staff-info">
        <h3>${s.name}<span>, ${s.age} ans</span></h3>
        <p>${s.role}</p>
      </div>
    </article>`).join("");
}

/* ---------- Panier (localStorage) ---------- */
const store = {
  get() { try { return JSON.parse(localStorage.getItem("wu-cart")) || []; } catch { return []; } },
  set(v) { try { localStorage.setItem("wu-cart", JSON.stringify(v)); } catch {} },
};
let cart = store.get();

function addToCart(item) {
  const same = cart.find((c) => c.id === item.id && c.size === item.size && c.flock === item.flock);
  if (same) same.qty += item.qty; else cart.push(item);
  store.set(cart); renderCart();
  toast(`✓ ${item.name} (${item.size}) ajouté au panier`);
  const btn = $(".cart-btn"); btn.animate([{ transform: "scale(1)" }, { transform: "scale(1.25)" }, { transform: "scale(1)" }], 400);
}
function renderCart() {
  const n = cart.reduce((a, c) => a + c.qty, 0);
  const badge = $(".cart-count"); badge.textContent = n; badge.dataset.n = n;
  const list = $(".drawer-items");
  if (!cart.length) list.innerHTML = `<div class="drawer-empty">Ton panier est vide.<br><br><a class="btn btn-sm" href="boutique.html">Voir la boutique</a></div>`;
  else list.innerHTML = cart.map((c, i) => {
    const p = PRODUCTS.find((x) => x.id === c.id);
    return `<div class="cart-item">
      <div class="thumb">${p.image ? `<img src="${p.image}" alt="">` : jerseySVG(p.design)}</div>
      <div><b>${c.name}</b><small>Taille ${c.size} · Qté ${c.qty}${c.flock ? " · Flocage : " + c.flock : ""}</small><small>${euro(c.price * c.qty)}</small></div>
      <button class="rm" data-i="${i}" aria-label="Retirer">✕</button></div>`;
  }).join("");
  $$(".rm", list).forEach((b) => (b.onclick = () => { cart.splice(+b.dataset.i, 1); store.set(cart); renderCart(); }));
  $(".total-val").textContent = euro(cart.reduce((a, c) => a + c.price * c.qty, 0));
  $(".drawer-foot").style.display = cart.length ? "" : "none";
}
function openCart() { $(".drawer").classList.add("open"); $(".drawer-bg").classList.add("open"); }
function closeCart() { $(".drawer").classList.remove("open"); $(".drawer-bg").classList.remove("open"); }

let toastT;
function toast(msg) {
  const t = $(".toast"); t.textContent = msg; t.classList.add("show");
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), 2600);
}

/* ---------- Modal générique ---------- */
function openModal(html, after) {
  let m = $("#modal");
  if (!m) {
    m = document.createElement("div"); m.id = "modal"; m.className = "modal"; m.dataset.lenisPrevent = "";
    m.innerHTML = `<div class="modal-box" role="dialog" aria-modal="true"></div>`;
    document.body.append(m);
    m.addEventListener("click", (e) => { if (e.target === m) closeModal(); });
    addEventListener("keydown", (e) => { if (e.key === "Escape") { closeModal(); closeCart(); } });
  }
  $(".modal-box", m).innerHTML = `<button class="modal-close" aria-label="Fermer">✕</button>` + html;
  $(".modal-close", m).onclick = closeModal;
  requestAnimationFrame(() => m.classList.add("open"));
  document.body.style.overflow = "hidden";
  after && setTimeout(() => after($(".modal-box", m)), 60);
}
function closeModal() { const m = $("#modal"); if (m) m.classList.remove("open"); document.body.style.overflow = ""; }

/* ---------- Animations au scroll ---------- */
function initReveal() {
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
  }), { threshold: 0.12 });
  $$(".reveal").forEach((el) => {
    if (el.getBoundingClientRect().top < innerHeight) el.classList.add("in"); // déjà visible au chargement
    else io.observe(el);
  });

  const co = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (!e.isIntersecting) return;
    const el = e.target, end = +el.dataset.count, suf = el.dataset.suffix || "", t0 = performance.now();
    const step = (t) => {
      const k = Math.min(1, (t - t0) / 1600), v = Math.round(end * (1 - Math.pow(1 - k, 3)));
      el.textContent = v + suf; if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step); co.unobserve(el);
  }), { threshold: 0.5 });
  $$("[data-count]").forEach((el) => co.observe(el));
}

/* ==========================================================
   PAGE JOUEURS
   ========================================================== */
function initPlayers() {
  const grid = $(".players-grid");
  grid.innerHTML = PLAYERS.map((p, i) => `
    <article class="player-card reveal d${i % 3}" data-i="${i}" tabindex="0">
      <div class="player-photo">
        <span class="number">${String(p.number).padStart(2, "0")}</span>
        <span class="tag role-tag">${p.role}</span>
        ${p.photo ? `<img class="photo" src="${p.photo}" alt="${p.pseudo}">` : silhouetteSVG(p)}
        <span class="flag">${p.flag}</span>
      </div>
      <div class="player-info">
        <div class="pseudo">${p.pseudo}</div>
        <div class="realname">${p.name} · ${p.game}</div>
        <div class="mini-stats">${Object.entries(p.stats).slice(0, 3).map(([k, v]) => `<div><b>${v}</b><small>${k}</small></div>`).join("")}</div>
      </div>
    </article>`).join("");

  $$(".player-card").forEach((card) => {
    const open = () => {
      const p = PLAYERS[card.dataset.i];
      openModal(`
        <div class="modal-media">${p.photo ? `<img src="${p.photo}" alt="${p.pseudo}">` : silhouetteSVG(p)}</div>
        <div class="modal-body">
          <span class="tag">${p.role}</span>
          <h2 style="margin-top:14px">${p.pseudo} <span style="font-size:.5em;color:var(--muted)">#${p.number}</span></h2>
          <p style="color:var(--muted);margin-top:-8px">${p.flag} ${p.name} · ${p.game}</p>
          <p>${p.bio}</p>
          <div class="big-stats">${Object.entries(p.stats).map(([k, v]) => `<div><b>${v}</b><small>${k}</small></div>`).join("")}</div>
          <div class="stat-bars">${Object.entries(p.bars).map(([k, v]) => `
            <div class="stat-bar"><div class="row"><span>${k}</span><b>${v}</b></div><div class="track"><div class="fill" data-w="${v}"></div></div></div>`).join("")}
          </div>
          <div class="socials">${Object.entries(p.socials).map(([k, v]) => `<a href="${v}" target="_blank" rel="noopener">${k} ↗</a>`).join("")}</div>
        </div>`, (box) => $$(".fill", box).forEach((f) => (f.style.width = f.dataset.w + "%")));
    };
    card.onclick = open;
    card.onkeydown = (e) => e.key === "Enter" && open();
    // Effet 3D au survol
    card.onmousemove = (e) => {
      const r = card.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      card.style.transform = `perspective(800px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) translateY(-6px)`;
    };
    card.onmouseleave = () => (card.style.transform = "");
  });

  $(".staff-grid").innerHTML = staffCards("reveal");
}

/* ==========================================================
   PAGE BOUTIQUE
   ========================================================== */
function initShop() {
  const cats = ["Tous", ...new Set(PRODUCTS.map((p) => p.cat))];
  let cat = "Tous", sort = "default";
  $(".filters").innerHTML = cats.map((c, i) => `<button class="filter ${i ? "" : "active"}" data-c="${c}">${c}</button>`).join("");

  const render = () => {
    let list = PRODUCTS.filter((p) => cat === "Tous" || p.cat === cat);
    if (sort === "asc") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "desc") list = [...list].sort((a, b) => b.price - a.price);
    $(".products").innerHTML = list.map((p) => `
      <article class="product reveal in">
        <div class="product-media" data-id="${p.id}">
          ${p.image ? `<img src="${p.image}" alt="${p.name}">` : jerseySVG(p.design)}
          ${p.tag ? `<span class="tag ${p.tag === "Nouveau" || p.tag === "Limité" ? "hot" : ""}">${p.tag}</span>` : ""}
          <span class="btn btn-sm quick">Aperçu rapide</span>
        </div>
        <div class="product-body">
          <h3>${p.name}</h3>
          <span class="cat">${p.cat}</span>
          <div class="bottom">
            <span class="price">${euro(p.price)}${p.oldPrice ? `<s>${euro(p.oldPrice)}</s>` : ""}</span>
            <span class="swatches"><i style="background:${p.design.base}"></i><i style="background:${p.design.accent}"></i></span>
          </div>
        </div>
      </article>`).join("");
    $$(".product-media").forEach((m) => (m.onclick = () => openProduct(m.dataset.id)));
  };
  $$(".filter").forEach((b) => (b.onclick = () => {
    $$(".filter").forEach((x) => x.classList.remove("active")); b.classList.add("active"); cat = b.dataset.c; render();
  }));
  $("#sort").onchange = (e) => { sort = e.target.value; render(); };
  render();

  // Ouverture directe via boutique.html#id
  if (location.hash && PRODUCTS.some((p) => p.id === location.hash.slice(1))) openProduct(location.hash.slice(1));
}

function openProduct(id) {
  const p = PRODUCTS.find((x) => x.id === id);
  let size = null, qty = 1;
  openModal(`
    <div class="modal-media">${p.image ? `<img src="${p.image}" alt="${p.name}">` : jerseySVG(p.design)}</div>
    <div class="modal-body">
      <span class="tag">${p.cat}</span>
      <h2 style="margin-top:14px">${p.name}</h2>
      <div style="font-family:var(--font-title);font-size:28px;font-weight:900;margin-bottom:12px">${euro(p.price)}${p.oldPrice ? ` <s style="font-size:16px;color:var(--muted);font-weight:400">${euro(p.oldPrice)}</s>` : ""}</div>
      <p style="color:var(--muted)">${p.desc}</p>
      <div class="field-label">Taille</div>
      <div class="sizes">${p.sizes.map((s) => `<button class="size" data-s="${s}">${s}</button>`).join("")}</div>
      <div class="field-label">Flocage (optionnel)</div>
      <div class="flocage"><input id="fl-name" maxlength="12" placeholder="Pseudo"><input id="fl-num" type="number" min="0" max="99" placeholder="N°"></div>
      <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
        <div class="qty"><button data-q="-1" aria-label="Moins">−</button><span>1</span><button data-q="1" aria-label="Plus">+</button></div>
        <button class="btn add">Ajouter au panier <span class="arrow">→</span></button>
      </div>
    </div>`, (box) => {
    $$(".size", box).forEach((b) => (b.onclick = () => { $$(".size", box).forEach((x) => x.classList.remove("active")); b.classList.add("active"); size = b.dataset.s; }));
    $$(".qty button", box).forEach((b) => (b.onclick = () => { qty = Math.max(1, Math.min(10, qty + +b.dataset.q)); $(".qty span", box).textContent = qty; }));
    $(".add", box).onclick = () => {
      if (!size) { toast("⚠ Choisis une taille"); $(".sizes", box).animate([{ transform: "translateX(-6px)" }, { transform: "translateX(6px)" }, { transform: "none" }], 300); return; }
      const fn = $("#fl-name", box).value.trim().toUpperCase(), num = $("#fl-num", box).value;
      const flock = [fn, num && "#" + num].filter(Boolean).join(" ");
      addToCart({ id: p.id, name: p.name, price: p.price, size, qty, flock });
      closeModal(); setTimeout(openCart, 300);
    };
  });
}

/* ==========================================================
   PAGE FAQ
   ========================================================== */
function initFaq() {
  $(".faq-nav").innerHTML = `<button class="active" data-c="all">Toutes</button>` + FAQ.map((g, i) => `<button data-c="${i}">${g.cat}</button>`).join("");
  $(".faq-list").innerHTML = FAQ.map((g, i) => `
    <div class="faq-group" data-c="${i}"><h2>${g.cat}</h2>
      ${g.items.map(([q, a]) => `
        <div class="faq-item"><button class="faq-q" aria-expanded="false">${q}<span class="plus"></span></button>
        <div class="faq-a"><div><p>${a}</p></div></div></div>`).join("")}
    </div>`).join("") + `<p class="faq-empty">Aucune question ne correspond. <a href="contact.html" style="color:var(--violet-2)">Pose-nous ta question →</a></p>`;

  $$(".faq-q").forEach((q) => (q.onclick = () => {
    const it = q.parentElement, open = it.classList.toggle("open"); q.setAttribute("aria-expanded", open);
  }));
  $$(".faq-nav button").forEach((b) => (b.onclick = () => {
    $$(".faq-nav button").forEach((x) => x.classList.remove("active")); b.classList.add("active");
    $$(".faq-group").forEach((g) => (g.style.display = b.dataset.c === "all" || g.dataset.c === b.dataset.c ? "" : "none"));
  }));
  $("#faq-search").oninput = (e) => {
    const s = e.target.value.toLowerCase().trim(); let any = false;
    $$(".faq-group").forEach((g) => {
      let vis = 0;
      $$(".faq-item", g).forEach((it) => { const ok = !s || it.textContent.toLowerCase().includes(s); it.style.display = ok ? "" : "none"; vis += ok; });
      g.style.display = vis ? "" : "none"; any ||= vis > 0;
    });
    $(".faq-empty").style.display = any ? "none" : "block";
  };
}

/* ==========================================================
   PAGE CONTACT
   ========================================================== */
function initContact() {
  $("#contact-form").onsubmit = (e) => {
    e.preventDefault();
    // ⚠ Site statique : brancher ici un service d'envoi (Formspree, EmailJS…) — voir README.
    $(".form").classList.add("sent");
  };
  $(".mail-link").href = "mailto:" + SITE.email; $(".mail-link small").textContent = SITE.email;
  $(".discord-link").href = SITE.socials.discord;
}

/* ==========================================================
   FOND DYNAMIQUE (toutes les pages)
   Réseau « low-poly » : des points dérivent lentement, se relient par des
   lignes lumineuses et forment des facettes translucides violettes.
   ========================================================== */
function initBackground() {
  const cvs = document.createElement("canvas");
  cvs.id = "bg-canvas"; cvs.setAttribute("aria-hidden", "true");
  document.body.prepend(cvs);
  const ctx = cvs.getContext("2d");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const small = matchMedia("(max-width: 768px)").matches;
  let W, H, pts = [], mx = 0, my = 0, tmx = 0, tmy = 0, last = 0;

  // Halos de couleur flous (bleu, rose, violet, une pointe d'orange comme sur l'inspiration)
  const GLOWS = [
    { x: 0.08, y: 0.85, r: 0.35, c: "59,130,246", a: 0.22, s: 0.7 },
    { x: 0.92, y: 0.12, r: 0.3, c: "56,189,248", a: 0.16, s: 0.9 },
    { x: 0.85, y: 0.8, r: 0.4, c: "139,61,255", a: 0.28, s: 0.5 },
    { x: 0.2, y: 0.18, r: 0.35, c: "176,60,255", a: 0.2, s: 0.6 },
    { x: 0.02, y: 0.55, r: 0.22, c: "251,146,60", a: 0.1, s: 1.1 },
    { x: 0.6, y: 0.45, r: 0.3, c: "255,79,216", a: 0.08, s: 0.8 },
  ];

  function resize() {
    W = cvs.width = innerWidth; H = cvs.height = innerHeight;
    const n = Math.round(Math.min(small ? 38 : 75, (W * H) / 18000));
    pts = Array.from({ length: n }, (_, i) => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.18, vy: (Math.random() - 0.5) * 0.18,
      z: Math.random() * 0.8 + 0.2,       // profondeur → parallaxe à la souris
      hot: Math.random() < 0.18,          // certains nœuds brillent (rose/orangé)
      seed: i * 7.31,
    }));
  }
  resize();
  addEventListener("resize", resize, { passive: true });
  addEventListener("mousemove", (e) => { tmx = e.clientX / innerWidth - 0.5; tmy = e.clientY / innerHeight - 0.5; }, { passive: true });

  function frame(now) {
    requestAnimationFrame(frame);
    if (now - last < 33) return; // ~30 images/s : fluide et léger pour la batterie
    const t = now / 1000; last = now;
    mx += (tmx - mx) * 0.05; my += (tmy - my) * 0.05;

    // Fond : dégradé nuit violette
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, "#0a0418"); g.addColorStop(0.5, "#120630"); g.addColorStop(1, "#070312");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    for (const o of GLOWS) {
      const x = (o.x + Math.sin(t * 0.1 * o.s) * 0.04) * W, y = (o.y + Math.cos(t * 0.08 * o.s) * 0.04) * H, r = o.r * Math.max(W, H);
      const rg = ctx.createRadialGradient(x, y, 0, x, y, r);
      rg.addColorStop(0, `rgba(${o.c},${o.a})`); rg.addColorStop(1, `rgba(${o.c},0)`);
      ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);
    }

    // Déplacement des points (rebond sur les bords) + parallaxe
    const P = pts.map((p) => {
      if (!reduced) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < -50 || p.x > W + 50) p.vx *= -1;
        if (p.y < -50 || p.y > H + 50) p.vy *= -1;
      }
      return { x: p.x - mx * 40 * p.z, y: p.y - my * 40 * p.z, p };
    });

    const D = Math.min(260, Math.max(W, H) * 0.2), D2 = D * D;
    const near = (a, b) => { const dx = a.x - b.x, dy = a.y - b.y; return dx * dx + dy * dy < D2; };

    // Facettes : quelques triangles translucides entre points voisins
    for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) {
      if (!near(P[i], P[j])) continue;
      for (let k = j + 1; k < P.length; k++) {
        if (!near(P[i], P[k]) || !near(P[j], P[k])) continue;
        const h = Math.sin(P[i].p.seed + P[j].p.seed * 3 + P[k].p.seed * 7) * 0.5 + 0.5; // toujours les mêmes facettes
        if (h > 0.22) continue;
        const a = P[i], b = P[j], c = P[k];
        const fg = ctx.createLinearGradient(a.x, a.y, c.x, c.y);
        fg.addColorStop(0, "rgba(139,61,255,0.16)"); fg.addColorStop(1, "rgba(59,130,246,0.04)");
        ctx.fillStyle = fg;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.lineTo(c.x, c.y); ctx.closePath(); ctx.fill();
      }
    }

    // Lignes : plus lumineuses quand les points sont proches
    ctx.lineWidth = 1;
    for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) {
      const dx = P[i].x - P[j].x, dy = P[i].y - P[j].y, d2 = dx * dx + dy * dy;
      if (d2 > D2) continue;
      ctx.strokeStyle = `rgba(190,150,255,${(1 - Math.sqrt(d2) / D) * 0.45})`;
      ctx.beginPath(); ctx.moveTo(P[i].x, P[i].y); ctx.lineTo(P[j].x, P[j].y); ctx.stroke();
    }

    // Nœuds : petits points, certains avec un éclat rose qui pulse
    for (const q of P) {
      if (q.p.hot) {
        const pulse = 0.6 + 0.4 * Math.sin(t * 2 + q.p.seed);
        const rg = ctx.createRadialGradient(q.x, q.y, 0, q.x, q.y, 14);
        rg.addColorStop(0, `rgba(255,120,200,${0.9 * pulse})`); rg.addColorStop(0.3, `rgba(255,79,140,${0.35 * pulse})`); rg.addColorStop(1, "rgba(255,79,140,0)");
        ctx.fillStyle = rg; ctx.fillRect(q.x - 14, q.y - 14, 28, 28);
      }
      ctx.fillStyle = q.p.hot ? "#ffd6ef" : "rgba(210,190,255,.75)";
      ctx.beginPath(); ctx.arc(q.x, q.y, q.p.hot ? 1.8 : 1.2, 0, Math.PI * 2); ctx.fill();
    }
  }
  requestAnimationFrame(frame);
}

/* ==========================================================
   PAGES LÉGALES : remplit les informations depuis SITE.legal (js/data.js)
   <span data-legal="address" data-label="adresse du siège"></span>
   ========================================================== */
function initLegal() {
  const values = { ...SITE.legal, email: SITE.email };
  SHOP.shipping.forEach((m) => (values["ship-" + m.id] = euro(m.price)));
  values.freeFrom = euro(SHOP.freeShippingFrom);
  values.countries = SHOP.countries.join(", ");
  $$("[data-legal]").forEach((el) => {
    const v = values[el.dataset.legal];
    if (v) el.textContent = v;
    else if ("optional" in el.dataset) el.closest(".opt")?.remove(); // info facultative non renseignée : on masque la ligne
    else el.innerHTML = `<mark class="todo">[À compléter : ${el.dataset.label || el.dataset.legal}]</mark>`;
  });
  $$(".legal-toc a").forEach((a) => a.addEventListener("click", (e) => {
    const t = $(a.getAttribute("href"));
    if (t) { e.preventDefault(); t.scrollIntoView({ behavior: "smooth", block: "start" }); history.replaceState(null, "", a.getAttribute("href")); }
  }));
}

/* ---------- Démarrage ---------- */
initBackground();
buildLayout();
renderCart();
({ joueurs: initPlayers, boutique: initShop, faq: initFaq, contact: initContact }[PAGE] || (() => {}))();
if ($("[data-legal]")) initLegal();
initReveal();
addEventListener("load", () => setTimeout(() => $(".loader")?.classList.add("done"), 300));
