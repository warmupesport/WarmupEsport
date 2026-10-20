/* ==========================================================
   WARMUP ESPORT | MÉDIA — Motion de présentation (20 s, 9:16)
   Pour TikTok / Instagram Reels. Tout est dessiné sur un canvas en
   fonction du temps t : rendu identique à chaque lecture, exportable.
   Les textes se modifient dans l'objet TEXTS ci-dessous.
   ========================================================== */

(() => {
  /* ---------- Textes (à personnaliser) ---------- */
  const TEXTS = {
    handle: "@warmupesport",
    badge: "MÉDIA",
    live: "LIVE",
    actu: "TOUTE L'ACTU", esport: "ESPORT", surtout: "ET SURTOUT", game: "FORTNITE",
    breaking: "BREAKING",
    ticker: ["RÉSULTATS FNCS", "MERCATO DES ÉQUIPES", "CASH CUPS", "NOUVELLE SAISON", "CLASSEMENTS", "LAN & ÉVÉNEMENTS"],
    program: "AU PROGRAMME",
    topics: [
      ["RÉSULTATS", "Les tops des compètes, à chaud."],
      ["TRANSFERTS", "Le mercato des équipes et des joueurs."],
      ["TOURNOIS", "FNCS, Cash Cups, LAN : on couvre tout."],
      ["ANALYSES", "Les stats et les moments clés."],
    ],
    flash: "FLASH INFO",
    headline: ["L'INFO ESPORT,", "EN PREMIER."],
    chips: ["CHAQUE JOUR", "100% ESPORT", "EN FRANÇAIS"],
    follow: "ABONNE-TOI", followed: "ABONNÉ ✓",
    networks: "TIKTOK · INSTAGRAM",
  };

  /* ---------- Timeline (secondes) ---------- */
  const DUR = 20;
  const CUTS = [4.6, 8.4, 12.6, 16];                                        // transitions entre scènes
  const IMPACTS = [[0.6, 28], [5.0, 8], [5.4, 12], [6.3, 22], [16.9, 22], [18.1, 8]]; // [moment, force] → secousse

  const VIOLET = "#8b3dff", VIOLET2 = "#b07cff", RED = "#ff2d55";
  const TAU = Math.PI * 2;
  const cvs = document.getElementById("mv"), ctx = cvs.getContext("2d");
  const W = 1080, H = 1920, U = 1, minD = W, diag = Math.hypot(W, H);

  /* ---------- Outils ---------- */
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const prog = (t, a, b) => clamp((t - a) / (b - a));
  const eOutExpo = (x) => (x === 1 ? 1 : 1 - Math.pow(2, -10 * x));
  const eOutCubic = (x) => 1 - Math.pow(1 - x, 3);
  const eInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const eOutBack = (x) => 1 + 2.70158 * Math.pow(x - 1, 3) + 1.70158 * Math.pow(x - 1, 2);
  function rng(seed) { // pseudo-aléatoire reproductible
    return () => {
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const R = rng(2026);
  const DUST = Array.from({ length: 90 }, () => ({ x: R(), y: R(), s: R() * 2.2 + 0.6, v: R() * 0.6 + 0.2, a: R() * 0.45 + 0.15 }));
  const BURST = Array.from({ length: 80 }, () => ({ a: R() * TAU, d: R() * 0.6 + 0.35, s: R() * 3 + 1 }));
  const SLICES = Array.from({ length: 16 }, () => ({ y: R(), h: R() * 0.08 + 0.02, dx: R() - 0.5 }));

  /* ---------- Logo ---------- */
  const logo = new Image(); logo.src = "assets/logo.png";
  let glowLogo = null, padRel = 0;
  logo.onload = () => {
    const S = 900, P = 160, ratio = logo.naturalHeight / logo.naturalWidth;
    glowLogo = document.createElement("canvas");
    glowLogo.width = S + P * 2; glowLogo.height = S * ratio + P * 2;
    const g = glowLogo.getContext("2d");
    g.shadowColor = "rgba(139,61,255,.95)"; g.shadowBlur = 60; g.drawImage(logo, P, P, S, S * ratio);
    g.shadowColor = "rgba(176,124,255,.9)"; g.shadowBlur = 18; g.drawImage(logo, P, P, S, S * ratio);
    padRel = P / S;
  };
  function drawLogo(x, y, size, alpha = 1, glow = true) {
    if (!glowLogo || alpha <= 0) return;
    ctx.save(); ctx.globalAlpha *= alpha;
    if (glow) {
      const w = size * (1 + 2 * padRel), h = w * glowLogo.height / glowLogo.width;
      ctx.drawImage(glowLogo, x - w / 2, y - h / 2, w, h);
    } else {
      const h = size * logo.naturalHeight / logo.naturalWidth;
      ctx.drawImage(logo, x - size / 2, y - h / 2, size, h);
    }
    ctx.restore();
  }

  // Grain de pellicule + lignes de balayage façon écran TV
  const grainTile = document.createElement("canvas");
  grainTile.width = grainTile.height = 220;
  {
    const g = grainTile.getContext("2d"), id = g.createImageData(220, 220), r = rng(7);
    for (let i = 0; i < id.data.length; i += 4) { const v = r() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
    g.putImageData(id, 0, 0);
  }
  const scanTile = document.createElement("canvas");
  scanTile.width = 4; scanTile.height = 6;
  { const g = scanTile.getContext("2d"); g.fillStyle = "#000"; g.fillRect(0, 0, 4, 2); }
  let grainPattern = null, scanPattern = null;

  /* ---------- Texte ---------- */
  function font(size, o) { return o.ui ? `${o.weight || 700} ${size}px Barlow, sans-serif` : `italic 800 ${size}px 'Barlow Condensed', sans-serif`; }
  function txt(s, x, y, o = {}) {
    ctx.save();
    ctx.globalAlpha *= o.alpha ?? 1;
    ctx.font = font(o.size, o);
    const ls = o.ls || 0;
    if ("letterSpacing" in ctx) ctx.letterSpacing = ls + "px";
    ctx.textAlign = o.align || "center"; ctx.textBaseline = "middle";
    const dx = ctx.textAlign === "center" ? ls / 2 : 0; // compense l'espace ajouté après la dernière lettre
    if (o.glow) { ctx.shadowColor = o.glow; ctx.shadowBlur = (o.glowSize || 40) * U; }
    if (o.stroke) { ctx.lineWidth = o.stroke; ctx.strokeStyle = o.strokeColor || VIOLET2; ctx.strokeText(s, x + dx, y); }
    if (o.fill !== false) { ctx.fillStyle = o.color || "#fff"; ctx.fillText(s, x + dx, y); }
    ctx.restore();
  }
  function measure(s, size, o = {}) {
    ctx.save();
    ctx.font = font(size, o);
    if ("letterSpacing" in ctx) ctx.letterSpacing = (o.ls || 0) + "px";
    const w = ctx.measureText(s).width;
    ctx.restore();
    return w;
  }
  function txtParts(parts, x, y, size, o = {}) { // texte multicolore centré
    const ws = parts.map(([s]) => measure(s, size, o));
    let cx = x - ws.reduce((a, b) => a + b, 0) / 2;
    parts.forEach(([s, color], i) => { txt(s, cx, y, { ...o, size, color, align: "left" }); cx += ws[i]; });
  }
  function flash(alpha, color = "255,255,255") {
    if (alpha <= 0) return;
    ctx.fillStyle = `rgba(${color},${alpha})`; ctx.fillRect(-50, -50, W + 100, H + 100);
  }
  function ring(x, y, r, width, alpha, color = "176,124,255") {
    if (alpha <= 0) return;
    ctx.strokeStyle = `rgba(${color},${alpha})`; ctx.lineWidth = width;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke();
  }
  function pill(x, y, w, h, fill, glow) {
    ctx.save();
    ctx.fillStyle = fill;
    if (glow) { ctx.shadowColor = glow; ctx.shadowBlur = 40 * U; }
    ctx.beginPath(); ctx.roundRect(x - w / 2, y - h / 2, w, h, h / 2); ctx.fill();
    ctx.restore();
  }
  // Mot qui « claque » à l'écran : arrive grand, se pose, avec un écho en contour
  function slam(s, x, y, size, t0, o = {}) {
    if (t_ < t0) return;
    const p = eOutExpo(prog(t_, t0, t0 + 0.35)), a = prog(t_, t0, t0 + 0.08) * (o.alpha ?? 1);
    if (p < 1) txt(s, x, y, { size: size * lerp(1.6, 1.15, p), fill: false, stroke: 2 * U, strokeColor: `rgba(176,124,255,${1 - p})`, alpha: a });
    ctx.save();
    ctx.translate(x, y); ctx.scale(lerp(1.8, 1, p), lerp(1.8, 1, p));
    txt(s, 0, 0, { ...o, size, alpha: a });
    ctx.restore();
  }
  let t_ = 0; // temps courant, pour les helpers

  /* ---------- Décor commun ---------- */
  function background(t, glow = 1) {
    ctx.fillStyle = "#040208"; ctx.fillRect(-50, -50, W + 100, H + 100);
    const g = ctx.createRadialGradient(W / 2, H * 0.45, 0, W / 2, H * 0.45, diag / 2);
    g.addColorStop(0, `rgba(95,32,180,${0.45 * glow})`);
    g.addColorStop(0.6, `rgba(30,10,60,${0.35 * glow})`);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    // Sol en grille qui avance
    ctx.save();
    ctx.strokeStyle = VIOLET; ctx.lineWidth = 1.2 * U;
    const hy = H * 0.7;
    ctx.globalAlpha = 0.16 * glow;
    for (let i = -14; i <= 14; i++) { ctx.beginPath(); ctx.moveTo(W / 2 + i * W * 0.03, hy); ctx.lineTo(W / 2 + i * W * 0.3, H); ctx.stroke(); }
    const off = (t * 0.45) % 1;
    for (let j = 0; j < 10; j++) {
      const k = (j + off) / 10, y = hy + (H - hy) * k * k;
      ctx.globalAlpha = 0.2 * glow * k;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
    ctx.restore();

    for (const p of DUST) {
      const y = (((p.y - t * p.v * 0.04) % 1) + 1) % 1;
      ctx.fillStyle = `rgba(176,124,255,${p.a * glow})`;
      ctx.beginPath(); ctx.arc(p.x * W, y * H, p.s * U, 0, TAU); ctx.fill();
    }
  }

  /* ==========================================================
     SCÈNES
     ========================================================== */

  // 1 · Impact du logo + « WARMUP ESPORT | MÉDIA » (0 → 4,6 s)
  function sIdentity(t) {
    background(t, prog(t, 0.5, 1.4));
    const cx = W / 2, cy = H / 2;

    if (t < 0.7) { // ligne lumineuse d'ouverture
      const p = eOutExpo(prog(t, 0.05, 0.5));
      ctx.save();
      ctx.globalAlpha = 1 - prog(t, 0.5, 0.7);
      ctx.shadowColor = VIOLET; ctx.shadowBlur = 30 * U; ctx.fillStyle = "#fff";
      ctx.fillRect(cx - (W / 2) * p, cy - 2 * U, W * p, 4 * U);
      ctx.restore();
    }
    if (t < 0.6) return;

    const sp = prog(t, 0.6, 1.7);
    ring(cx, cy, eOutExpo(sp) * diag * 0.6, (30 * (1 - sp) + 2) * U, 1 - sp);
    const bp = prog(t, 0.6, 2.1);
    if (bp < 1) for (const b of BURST) {
      const d = eOutExpo(bp) * b.d * diag * 0.5;
      ctx.fillStyle = `rgba(255,255,255,${(1 - bp) * 0.9})`;
      ctx.beginPath(); ctx.arc(cx + Math.cos(b.a) * d, cy + Math.sin(b.a) * d, b.s * U * (1 - bp * 0.5), 0, TAU); ctx.fill();
    }

    const inP = eOutExpo(prog(t, 0.6, 1.2)), mv = eInOut(prog(t, 1.8, 2.4)), out = prog(t, 4.25, 4.55);
    const size = minD * 0.62 * lerp(lerp(2.4, 1, inP) * (1 + 0.03 * Math.sin(t * 2.4)), 0.95, mv);
    const ly = lerp(cy, H * 0.3, mv) - out * 60 * U;
    const la = prog(t, 0.6, 0.8) * (1 - out);
    if (inP < 1) { // aberration chromatique pendant l'impact
      ctx.save(); ctx.globalCompositeOperation = "lighter";
      drawLogo(cx - (1 - inP) * 50 * U, ly, size, la * 0.45, false);
      drawLogo(cx + (1 - inP) * 50 * U, ly, size, la * 0.45, false);
      ctx.restore();
    }
    drawLogo(cx, ly, size, la);

    if (t > 2.0) {
      const S = 240 * U, y = H * 0.53 - out * 60 * U;
      const letters = [..."WARMUP"], gap = S * 0.03;
      const ws = letters.map((l) => measure(l, S));
      let x = cx - (ws.reduce((a, b) => a + b, 0) + gap * (letters.length - 1)) / 2;
      letters.forEach((l, i) => {
        const p = prog(t, 2.1 + i * 0.06, 2.6 + i * 0.06);
        txt(l, x + ws[i] / 2, y - (1 - eOutBack(p)) * H * 0.1, { size: S, alpha: prog(t, 2.1 + i * 0.06, 2.3 + i * 0.06) * (1 - out) });
        x += ws[i] + gap;
      });
      const ep = eOutExpo(prog(t, 2.6, 3.5)), ey = y + S * 0.58;
      txt(TEXTS.esport, cx, ey, { size: 76 * U, color: VIOLET2, ls: lerp(4, 40, ep) * U, alpha: ep * (1 - out), glow: "rgba(139,61,255,.8)", glowSize: 20 });

      // Badge « MÉDIA » encadré de deux traits
      const bpop = eOutBack(prog(t, 3.1, 3.5)), by = ey + 120 * U;
      if (bpop > 0) {
        const bs = 44 * U, bls = 14 * U, bw = measure(TEXTS.badge, bs, { ui: true, weight: 800, ls: bls }) + 90 * U, bh = 82 * U;
        ctx.save();
        ctx.globalAlpha = 1 - out;
        ctx.translate(cx, by); ctx.scale(bpop, bpop);
        pill(0, 0, bw, bh, VIOLET, "rgba(139,61,255,.85)");
        txt(TEXTS.badge, 0, 2 * U, { ui: true, weight: 800, size: bs, ls: bls });
        ctx.restore();
        const lw = 130 * U * eOutExpo(prog(t, 3.3, 4.0));
        ctx.save();
        ctx.globalAlpha = 1 - out; ctx.fillStyle = "#fff";
        ctx.fillRect(cx - bw / 2 - 30 * U - lw, by - 1.5 * U, lw, 3 * U);
        ctx.fillRect(cx + bw / 2 + 30 * U, by - 1.5 * U, lw, 3 * U);
        ctx.restore();
      }
    }
    flash(0.9 * (1 - prog(t, 0.6, 1.1)));
  }

  // 2 · Toute l'actu esport, et surtout Fortnite + bandeau « breaking » (4,6 → 8,4 s)
  function liveTag(x, y, t, alpha = 1) {
    const s = 30 * U, w = measure(TEXTS.live, s, { ui: true, weight: 800, ls: 6 * U }) + 80 * U, h = 56 * U;
    ctx.save(); ctx.globalAlpha *= alpha;
    pill(x, y, w, h, RED, "rgba(255,45,85,.7)");
    ctx.fillStyle = `rgba(255,255,255,${0.4 + 0.6 * (Math.sin(t * 8) > 0 ? 1 : 0)})`;
    ctx.beginPath(); ctx.arc(x - w / 2 + 26 * U, y, 8 * U, 0, TAU); ctx.fill();
    txt(TEXTS.live, x + 12 * U, y + 1 * U, { ui: true, weight: 800, size: s, ls: 6 * U });
    ctx.restore();
  }
  function ticker(t, y, t0) {
    const p = eOutExpo(prog(t, t0, t0 + 0.5));
    if (p <= 0) return;
    const h = 92 * U, bandX = lerp(-W, 0, p);
    ctx.save();
    ctx.translate(bandX, 0);
    ctx.fillStyle = "#fff"; ctx.fillRect(0, y - h / 2, W, h);
    ctx.fillStyle = VIOLET; ctx.fillRect(0, y + h / 2, W, 6 * U);
    // Étiquette rouge « BREAKING »
    const ls = 4 * U, bs = 34 * U, lw = measure(TEXTS.breaking, bs, { ui: true, weight: 800, ls }) + 60 * U;
    // Défilement des infos
    ctx.save();
    ctx.beginPath(); ctx.rect(lw, y - h / 2, W - lw, h); ctx.clip();
    const item = TEXTS.ticker.join("   •   ") + "   •   ", size = 38 * U;
    const iw = measure(item, size, { ui: true, weight: 800 });
    let x = lw + 30 * U - (((t - t0) * 300 * U) % iw);
    for (; x < W; x += iw) txt(item, x, y + 2 * U, { ui: true, weight: 800, size, align: "left", color: "#0b0612" });
    ctx.restore();
    ctx.fillStyle = RED;
    ctx.beginPath(); ctx.moveTo(0, y - h / 2); ctx.lineTo(lw + 20 * U, y - h / 2); ctx.lineTo(lw, y + h / 2); ctx.lineTo(0, y + h / 2); ctx.fill();
    txt(TEXTS.breaking, 26 * U, y + 2 * U, { ui: true, weight: 800, size: bs, ls, align: "left" });
    ctx.restore();
  }
  function sNews(t) {
    background(t, 0.75);
    const cx = W / 2;
    liveTag(cx, H * 0.17, t, eOutBack(prog(t, 4.7, 5.0)));
    slam(TEXTS.actu, cx, H * 0.28, 140 * U, 4.9);
    // ESPORT en grand, avec des échos en contour au-dessus / en dessous
    const ep = prog(t, 5.3, 5.8);
    if (ep > 0) for (const k of [-1, 1]) {
      txt(TEXTS.esport, cx, H * 0.4 + k * 230 * U * eOutExpo(ep), { size: 280 * U, fill: false, stroke: 2 * U, strokeColor: "rgba(176,124,255,.35)", alpha: ep * (1 - prog(t, 5.8, 6.2)) });
    }
    slam(TEXTS.esport, cx, H * 0.4, 280 * U, 5.3);
    const sp = eOutCubic(prog(t, 5.9, 6.2));
    txt(TEXTS.surtout, cx, H * 0.52 + (1 - sp) * 20 * U, { ui: true, weight: 700, size: 36 * U, ls: 14 * U, color: "rgba(255,255,255,.8)", alpha: sp });
    slam(TEXTS.game, cx, H * 0.61, 210 * U, 6.3, { color: VIOLET, glow: "rgba(139,61,255,.9)", glowSize: 50 });
    flash(0.6 * (t >= 6.3 ? 1 - prog(t, 6.3, 6.6) : 0), "176,124,255");
    ticker(t, H * 0.79, 6.7);
  }

  // 3 · Au programme : 4 rubriques (8,4 → 12,6 s)
  function sTopics(t) {
    background(t, 0.7);
    const cx = W / 2;
    const tp = eOutCubic(prog(t, 8.5, 9.0));
    txtParts([["AU ", "#fff"], ["PROGRAMME", VIOLET]], cx, H * 0.15 + (1 - tp) * 30 * U, 130 * U, { alpha: tp });

    TEXTS.topics.forEach(([title, text], i) => {
      const pw = W * 0.86, ph = H * 0.13, x = (W - pw) / 2, y = H * 0.22 + i * (ph + H * 0.025);
      const t0 = 8.8 + i * 0.45, p = eOutExpo(prog(t, t0, t0 + 0.8)), dir = i % 2 ? 1 : -1;
      if (p <= 0) return;
      ctx.save();
      ctx.globalAlpha = prog(t, t0, t0 + 0.15);
      ctx.translate(dir * (1 - p) * W, 0);
      ctx.fillStyle = "rgba(22,13,42,.9)"; ctx.fillRect(x, y, pw, ph);
      ctx.strokeStyle = "rgba(176,124,255,.35)"; ctx.lineWidth = 1.5 * U; ctx.strokeRect(x, y, pw, ph);
      ctx.fillStyle = VIOLET; ctx.fillRect(x, y, 8 * U, ph * eOutExpo(prog(t, t0 + 0.3, t0 + 1)));
      const pad = 44 * U;
      txt("0" + (i + 1), x + pw - pad, y + ph / 2, { size: 130 * U, align: "right", fill: false, stroke: 2 * U, strokeColor: "rgba(176,124,255,.6)" });
      txt(title, x + pad, y + ph * 0.38, { size: 84 * U, align: "left" });
      txt(text, x + pad, y + ph * 0.72, { ui: true, weight: 400, size: 30 * U, align: "left", color: "rgba(255,255,255,.75)" });
      // Reflet qui balaie le panneau
      const sw = prog(t, t0 + 0.7, t0 + 1.4);
      if (sw > 0 && sw < 1) {
        ctx.beginPath(); ctx.rect(x, y, pw, ph); ctx.clip();
        const sx = lerp(x - pw * 0.5, x + pw * 1.5, sw);
        const g = ctx.createLinearGradient(sx - 120 * U, 0, sx + 120 * U, 0);
        g.addColorStop(0, "rgba(255,255,255,0)"); g.addColorStop(0.5, "rgba(255,255,255,.18)"); g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = g; ctx.fillRect(x, y, pw, ph);
      }
      ctx.restore();
    });
  }

  // 4 · Carte « Flash info » (12,6 → 16 s)
  function sFlash(t) {
    background(t, 0.8);
    const cx = W / 2, cw = W * 0.86, ch = H * 0.46, x = (W - cw) / 2, y = H * 0.24;
    const p = eOutBack(prog(t, 12.7, 13.2));
    if (p <= 0) return;
    ctx.save();
    ctx.translate(cx, y + ch / 2); ctx.scale(p, p); ctx.translate(-cx, -(y + ch / 2));

    ctx.save();
    ctx.shadowColor = "rgba(139,61,255,.55)"; ctx.shadowBlur = 80 * U;
    ctx.fillStyle = "#120a22"; ctx.beginPath(); ctx.roundRect(x, y, cw, ch, 28 * U); ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.beginPath(); ctx.roundRect(x, y, cw, ch, 28 * U); ctx.clip();
    // En-tête rouge
    const hh = 100 * U;
    ctx.fillStyle = RED; ctx.fillRect(x, y, cw, hh);
    ctx.fillStyle = "rgba(255,255,255,.12)";
    for (let k = 0; k < 6; k++) ctx.fillRect(x + cw - 260 * U + k * 44 * U, y, 18 * U, hh);
    txt("⚡ " + TEXTS.flash, x + 44 * U, y + hh / 2 + 2 * U, { ui: true, weight: 800, size: 40 * U, ls: 6 * U, align: "left", alpha: 1 - 0.25 * (Math.sin(t * 10) > 0.6 ? 1 : 0) });

    // Auteur
    const ay = y + hh + 90 * U;
    ctx.fillStyle = "#000"; ctx.beginPath(); ctx.arc(x + 90 * U, ay, 50 * U, 0, TAU); ctx.fill();
    ctx.strokeStyle = VIOLET; ctx.lineWidth = 4 * U; ctx.stroke();
    drawLogo(x + 90 * U, ay + 2 * U, 70 * U, 1, false);
    txt("Warmup Esport | Média", x + 166 * U, ay - 20 * U, { ui: true, weight: 800, size: 34 * U, align: "left" });
    txt(TEXTS.handle + " · à l'instant", x + 166 * U, ay + 22 * U, { ui: true, weight: 400, size: 28 * U, align: "left", color: "rgba(255,255,255,.6)" });

    // Titre tapé à la machine
    const full = TEXTS.headline.join("\n"), n = Math.floor(full.length * prog(t, 13.3, 14.3));
    const typed = full.slice(0, n).split("\n"), hs = 130 * U;
    typed.forEach((line, i) => {
      txt(line, x + 44 * U, ay + 170 * U + i * hs * 0.95, { size: hs, align: "left", color: i ? VIOLET2 : "#fff", glow: i ? "rgba(139,61,255,.7)" : null, glowSize: 30 });
    });
    if (n < full.length || Math.sin(t * 12) > 0) {
      const li = typed.length - 1, cxr = x + 44 * U + measure(typed[li], hs) + 12 * U;
      ctx.fillStyle = VIOLET2; ctx.fillRect(cxr, ay + 170 * U + li * hs * 0.95 - hs * 0.4, 10 * U, hs * 0.8);
    }

    // Pastilles
    const cs = 26 * U, cls = 3 * U, cy2 = y + ch - 80 * U;
    const cwid = TEXTS.chips.map((c) => measure(c, cs, { ui: true, weight: 800, ls: cls }) + 50 * U);
    let px = x + 44 * U;
    TEXTS.chips.forEach((c, i) => {
      const cp = eOutBack(prog(t, 14.4 + i * 0.15, 14.75 + i * 0.15));
      if (cp > 0) {
        ctx.save(); ctx.translate(px + cwid[i] / 2, cy2); ctx.scale(cp, cp);
        ctx.strokeStyle = VIOLET2; ctx.lineWidth = 2 * U; ctx.fillStyle = "rgba(139,61,255,.22)";
        ctx.beginPath(); ctx.roundRect(-cwid[i] / 2, -32 * U, cwid[i], 64 * U, 32 * U); ctx.fill(); ctx.stroke();
        txt(c, 0, 2 * U, { ui: true, weight: 800, size: cs, ls: cls });
        ctx.restore();
      }
      px += cwid[i] + 18 * U;
    });

    // Reflet
    const sw = prog(t, 15.0, 15.7);
    if (sw > 0 && sw < 1) {
      const sx = lerp(x - cw * 0.5, x + cw * 1.5, sw);
      const g = ctx.createLinearGradient(sx - 160 * U, 0, sx + 160 * U, 0);
      g.addColorStop(0, "rgba(255,255,255,0)"); g.addColorStop(0.5, "rgba(255,255,255,.14)"); g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g; ctx.fillRect(x, y, cw, ch);
    }
    ctx.restore();
    ctx.strokeStyle = "rgba(176,124,255,.4)"; ctx.lineWidth = 2 * U;
    ctx.beginPath(); ctx.roundRect(x, y, cw, ch, 28 * U); ctx.stroke();
    ctx.restore();

    // Notifications qui tombent sous la carte
    ["Nouveau résultat publié", "Transfert officiel", "Tournoi ce week-end"].forEach((s, i) => {
      const t0 = 13.6 + i * 0.4, np = eOutExpo(prog(t, t0, t0 + 0.5));
      if (np <= 0) return;
      const nw = W * 0.7, nh = 84 * U, nx = cx + (i - 1) * 40 * U, ny = H * 0.75 + i * (nh + 18 * U) - (1 - np) * 60 * U;
      ctx.save();
      ctx.globalAlpha = np * 0.92;
      ctx.fillStyle = "rgba(255,255,255,.1)"; ctx.strokeStyle = "rgba(255,255,255,.18)"; ctx.lineWidth = 1.5 * U;
      ctx.beginPath(); ctx.roundRect(nx - nw / 2, ny - nh / 2, nw, nh, 22 * U); ctx.fill(); ctx.stroke();
      ctx.fillStyle = VIOLET; ctx.beginPath(); ctx.arc(nx - nw / 2 + 46 * U, ny, 20 * U, 0, TAU); ctx.fill();
      txt("🔔", nx - nw / 2 + 46 * U, ny + 1 * U, { ui: true, size: 20 * U });
      txt(s, nx - nw / 2 + 86 * U, ny + 1 * U, { ui: true, weight: 700, size: 30 * U, align: "left" });
      ctx.restore();
    });
  }

  // 5 · Conclusion : abonne-toi (16 → 20 s)
  function sOutro(t) {
    background(t, 1);
    const cx = W / 2, ly = H * 0.29;
    const p = eOutExpo(prog(t, 16.1, 16.8));
    ctx.save();
    ctx.translate(cx, ly); ctx.rotate(lerp(-0.5, 0, p));
    drawLogo(0, 0, minD * lerp(0.2, 0.58, p) * (1 + 0.02 * Math.sin(t * 3)), prog(t, 16.1, 16.4));
    ctx.restore();
    const sw = prog(t, 16.9, 17.9);
    ring(cx, ly, minD * 0.25 + eOutExpo(sw) * diag * 0.5, (24 * (1 - sw) + 2) * U, t >= 16.9 ? 1 - sw : 0);

    // Nom avec glitch à l'impact
    const S = 150 * U, y = H * 0.5;
    const sl = 1 - eOutExpo(prog(t, 16.5, 16.9));
    const draw = () => {
      txt("WARMUP", cx - 10 * U - sl * W, y, { size: S, align: "right" });
      txt("ESPORT", cx + 10 * U + sl * W, y, { size: S, align: "left", color: VIOLET, glow: "rgba(139,61,255,.85)", glowSize: 40 });
    };
    const gl = t >= 16.9 ? 1 - prog(t, 16.9, 17.3) : 0;
    if (gl > 0) {
      for (const s of SLICES) {
        ctx.save();
        ctx.beginPath(); ctx.rect(0, y - S * 0.6 + s.y * S * 1.2, W, s.h * S * 1.2); ctx.clip();
        ctx.translate(s.dx * gl * 120 * U, 0); draw();
        ctx.restore();
      }
      ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = 0.5 * gl;
      ctx.translate(-14 * U * gl, 0); txt("WARMUP ESPORT", cx, y, { size: S, color: "#ff2bd6" });
      ctx.translate(28 * U * gl, 0); txt("WARMUP ESPORT", cx, y, { size: S, color: "#3de8ff" });
      ctx.restore();
    } else draw();
    const mp = eOutCubic(prog(t, 17.0, 17.4));
    txt("|  " + TEXTS.badge, cx, y + 100 * U, { ui: true, weight: 800, size: 40 * U, ls: 18 * U, color: VIOLET2, alpha: mp });

    // Bouton « Abonne-toi » + tap du doigt
    const bp = eOutBack(prog(t, 17.4, 17.9)), by = H * 0.64;
    if (bp > 0) {
      const done = t >= 18.15, size = 56 * U, label = done ? TEXTS.followed : "+ " + TEXTS.follow;
      const bw = measure("+ " + TEXTS.follow, size, { ui: true, weight: 800, ls: 4 * U }) + 120 * U, bh = 120 * U;
      const press = t >= 18.0 && t < 18.3 ? 1 - 0.06 * Math.sin(prog(t, 18.0, 18.3) * Math.PI) : 1;
      const breathe = done ? 1 : 1 + 0.03 * Math.sin(t * 7);
      ctx.save();
      ctx.translate(cx, by); ctx.scale(bp * press * breathe, bp * press * breathe);
      pill(0, 0, bw, bh, done ? "#fff" : RED, done ? "rgba(255,255,255,.5)" : "rgba(255,45,85,.8)");
      txt(label, 0, 3 * U, { ui: true, weight: 800, size, ls: 4 * U, color: done ? "#120a22" : "#fff" });
      ctx.restore();
      const tp = prog(t, 17.85, 18.15); // doigt qui arrive
      if (t > 17.85 && t < 18.6) {
        const fa = 1 - prog(t, 18.3, 18.6);
        ctx.fillStyle = `rgba(255,255,255,${0.55 * fa})`;
        ctx.beginPath(); ctx.arc(cx + bw * 0.3 - (1 - eOutCubic(tp)) * 0, by + lerp(160, 10, eOutCubic(tp)) * U, 34 * U, 0, TAU); ctx.fill();
      }
      const rp = prog(t, 18.15, 18.8);
      ring(cx + bw * 0.3, by + 10 * U, 30 * U + eOutExpo(rp) * 220 * U, 4 * U, t >= 18.15 ? 1 - rp : 0, "255,255,255");
    }
    const hp = eOutCubic(prog(t, 18.4, 18.9));
    txt(TEXTS.handle, cx, H * 0.735 + (1 - hp) * 20 * U, { ui: true, weight: 800, size: 54 * U, ls: 2 * U, alpha: hp });
    txt(TEXTS.networks, cx, H * 0.78 + (1 - hp) * 20 * U, { ui: true, weight: 700, size: 28 * U, ls: 12 * U, color: "rgba(255,255,255,.65)", alpha: hp });
    flash(0.6 * (t >= 16.9 ? 1 - prog(t, 16.9, 17.2) : 0));
  }

  /* ---------- Habillage : transitions, HUD, vignette, grain ---------- */
  function wipes(t) {
    for (const c of CUTS) {
      const p = prog(t, c - 0.3, c + 0.3);
      if (p <= 0 || p >= 1) continue;
      const sk = 0.3 * W, hw = W / 2 + sk + 60 * U, travel = H / 2 + hw + sk;
      const y = H / 2 + lerp(travel, -travel, eInOut(p)); // balayage vertical, adapté au 9:16
      const band = (off, w, color) => {
        ctx.beginPath();
        ctx.moveTo(0, y + off - w + sk / 2); ctx.lineTo(0, y + off + w + sk / 2);
        ctx.lineTo(W, y + off + w - sk / 2); ctx.lineTo(W, y + off - w - sk / 2);
        ctx.closePath(); ctx.fillStyle = color; ctx.fill();
      };
      band(hw + 24 * U, 24 * U, "#2a0b5c");
      band(0, hw, "#6d27e6");
      band(-hw - 22 * U, 10 * U, "#fff");
      band(-hw - 64 * U, 6 * U, VIOLET2);
      drawLogo(W / 2, y, minD * 0.32, 1, false);
    }
  }
  function frameHud(t) {
    const a = prog(t, 1.4, 2.0) * (1 - prog(t, 19.0, 19.5));
    if (a <= 0) return;
    const m = 44 * U, l = 50 * U;
    ctx.save();
    ctx.globalAlpha = a * 0.7; ctx.strokeStyle = "#fff"; ctx.lineWidth = 2 * U;
    [[m, m, 1, 1], [W - m, m, -1, 1], [m, H - m, 1, -1], [W - m, H - m, -1, -1]].forEach(([x, y, sx, sy]) => {
      ctx.beginPath(); ctx.moveTo(x, y + l * sy); ctx.lineTo(x, y); ctx.lineTo(x + l * sx, y); ctx.stroke();
    });
    ctx.restore();
    txt("WARMUP | MÉDIA", m + 70 * U, m + 26 * U, { ui: true, weight: 800, size: 24 * U, ls: 5 * U, align: "left", alpha: a * 0.85 });
    ctx.fillStyle = `rgba(255,45,85,${a * (Math.sin(t * 6) > -0.3 ? 1 : 0.2)})`;
    ctx.beginPath(); ctx.arc(W - m - 150 * U, m + 26 * U, 9 * U, 0, TAU); ctx.fill();
    const s = Math.floor(t), stamp = `REC 00:${String(s).padStart(2, "0")}`;
    txt(stamp, W - m - 70 * U, m + 26 * U, { ui: true, weight: 700, size: 24 * U, ls: 3 * U, align: "right", color: VIOLET2, alpha: a * 0.9 });
  }
  function overlays(t) {
    const v = ctx.createRadialGradient(W / 2, H / 2, minD * 0.4, W / 2, H / 2, diag / 2);
    v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(0,0,0,.6)");
    ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
    scanPattern ||= ctx.createPattern(scanTile, "repeat");
    ctx.save(); ctx.globalAlpha = 0.12; ctx.fillStyle = scanPattern; ctx.fillRect(0, 0, W, H); ctx.restore();
    grainPattern ||= ctx.createPattern(grainTile, "repeat");
    const r = rng(Math.floor(t * 24));
    ctx.save();
    ctx.globalAlpha = 0.05; ctx.translate(-r() * 220, -r() * 220);
    ctx.fillStyle = grainPattern; ctx.fillRect(0, 0, W + 220, H + 220);
    ctx.restore();
    flash(prog(t, 19.5, 20), "0,0,0"); // fondu au noir final
  }
  function shake(t) {
    let x = 0, y = 0;
    for (const [ti, a] of IMPACTS) {
      const d = t - ti;
      if (d < 0 || d > 0.8) continue;
      const k = a * U * Math.exp(-d * 7);
      x += k * Math.sin(d * 90); y += k * Math.cos(d * 70);
    }
    return [x, y];
  }

  function draw(t) {
    t_ = t;
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
    ctx.save();
    const [sx, sy] = shake(t);
    ctx.translate(sx, sy);
    if (t < CUTS[0]) sIdentity(t);
    else if (t < CUTS[1]) sNews(t);
    else if (t < CUTS[2]) sTopics(t);
    else if (t < CUTS[3]) sFlash(t);
    else sOutro(t);
    ctx.restore();
    frameHud(t);
    wipes(t);
    overlays(t);
  }

  /* ==========================================================
     SON : musique et bruitages générés en direct (WebAudio)
     ========================================================== */
  const EVENTS = [["riser", 0, 0.6], ["impact", 0.6, 1], ["pad", 1.8, 19.6],
    ["impact", 4.9, 0.35], ["impact", 5.3, 0.5], ["riser", 5.7, 0.6], ["impact", 6.3, 1.1],
    ["riser", 16.3, 0.6], ["impact", 16.9, 1.2], ["blip", 18.15, 1]];
  for (let b = 2.0; b < 16; b += 0.5) EVENTS.push(["kick", b], ["hat", b + 0.25]);
  for (let b = 17.0; b < 19.5; b += 0.5) EVENTS.push(["kick", b], ["hat", b + 0.25]);
  for (let i = 0; i < 4; i++) EVENTS.push(["whoosh", 8.8 + i * 0.45, 0.35]);
  for (let i = 0; i < 26; i++) EVENTS.push(["blip", 13.3 + i * 0.04, 0.15]); // frappe clavier
  for (const c of CUTS) EVENTS.push(["whoosh", c - 0.3, 0.6]);

  const Sound = {
    ac: null, master: null, dest: null, bus: null, noise: null, muted: false,
    init() {
      if (this.ac) return;
      const ac = (this.ac = new (window.AudioContext || window.webkitAudioContext)());
      this.master = ac.createGain(); this.master.gain.value = 0.8;
      const comp = ac.createDynamicsCompressor();
      this.master.connect(comp); comp.connect(ac.destination);
      this.dest = ac.createMediaStreamDestination(); comp.connect(this.dest); // pour l'export vidéo
      const buf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      this.noise = buf;
    },
    start(fromT) {
      this.init(); this.stop();
      const ac = this.ac; ac.resume();
      const bus = (this.bus = ac.createGain());
      bus.gain.value = this.muted ? 0 : 1; bus.connect(this.master);
      const t0 = ac.currentTime + 0.05 - fromT;
      for (const [type, at, dur] of EVENTS) {
        if (type === "pad") { if (fromT < at + dur) this.pad(Math.max(t0 + at, t0 + fromT), t0 + at + dur); continue; }
        if (at >= fromT) this[type](t0 + at, dur);
      }
    },
    stop() { if (this.bus) { this.bus.disconnect(); this.bus = null; } },
    async renderOffline(rate = 48000) { // toute la bande son, calculée hors temps réel (pour l'export MP4)
      const saved = [this.ac, this.bus, this.noise];
      const ac = (this.ac = new OfflineAudioContext(2, Math.ceil(rate * DUR), rate));
      const master = ac.createGain(); master.gain.value = 0.8;
      const comp = ac.createDynamicsCompressor();
      master.connect(comp); comp.connect(ac.destination);
      this.bus = ac.createGain(); this.bus.connect(master);
      const buf = ac.createBuffer(1, rate * 2, rate), d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      this.noise = buf;
      for (const [type, at, dur] of EVENTS) type === "pad" ? this.pad(at, at + dur) : this[type](at, dur);
      [this.ac, this.bus, this.noise] = saved;
      return ac.startRendering();
    },
    setMuted(m) { this.muted = m; if (this.bus) this.bus.gain.value = m ? 0 : 1; },
    env(when, peak, attack, release) {
      const g = this.ac.createGain();
      g.gain.setValueAtTime(0.0001, when);
      g.gain.exponentialRampToValueAtTime(peak, when + attack);
      g.gain.exponentialRampToValueAtTime(0.0001, when + attack + release);
      g.connect(this.bus);
      return g;
    },
    noiseSrc(when, dur) { const s = this.ac.createBufferSource(); s.buffer = this.noise; s.loop = true; s.start(when); s.stop(when + dur); return s; },
    kick(when) {
      const o = this.ac.createOscillator();
      o.frequency.setValueAtTime(150, when); o.frequency.exponentialRampToValueAtTime(42, when + 0.16);
      o.connect(this.env(when, 0.9, 0.004, 0.35)); o.start(when); o.stop(when + 0.4);
    },
    hat(when) {
      const f = this.ac.createBiquadFilter(); f.type = "highpass"; f.frequency.value = 7500;
      this.noiseSrc(when, 0.06).connect(f); f.connect(this.env(when, 0.18, 0.002, 0.05));
    },
    blip(when, vol = 1) {
      const o = this.ac.createOscillator(); o.type = "square";
      o.frequency.setValueAtTime(1800, when); o.frequency.exponentialRampToValueAtTime(900, when + 0.05);
      o.connect(this.env(when, 0.12 * vol, 0.002, 0.05)); o.start(when); o.stop(when + 0.08);
    },
    impact(when, size = 1) {
      const o = this.ac.createOscillator();
      o.frequency.setValueAtTime(95, when); o.frequency.exponentialRampToValueAtTime(28, when + 0.7);
      o.connect(this.env(when, 1.1 * size, 0.005, 1.2)); o.start(when); o.stop(when + 1.3);
      const f = this.ac.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 1400;
      this.noiseSrc(when, 0.9).connect(f); f.connect(this.env(when, 0.6 * size, 0.003, 0.8));
    },
    whoosh(when, dur) {
      const f = this.ac.createBiquadFilter(); f.type = "bandpass"; f.Q.value = 1.2;
      f.frequency.setValueAtTime(300, when); f.frequency.exponentialRampToValueAtTime(4000, when + dur);
      this.noiseSrc(when, dur + 0.1).connect(f); f.connect(this.env(when, 0.45, dur * 0.6, dur * 0.4));
    },
    riser(when, dur) {
      const f = this.ac.createBiquadFilter(); f.type = "bandpass"; f.Q.value = 2;
      f.frequency.setValueAtTime(200, when); f.frequency.exponentialRampToValueAtTime(6000, when + dur);
      const g = this.ac.createGain();
      g.gain.setValueAtTime(0.0001, when); g.gain.exponentialRampToValueAtTime(0.35, when + dur); g.gain.setValueAtTime(0.0001, when + dur + 0.01);
      g.connect(this.bus);
      this.noiseSrc(when, dur + 0.05).connect(f); f.connect(g);
    },
    pad(when, end) { // nappe d'accords sombres en fond
      const f = this.ac.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 650;
      const g = this.ac.createGain();
      g.gain.setValueAtTime(0.0001, when); g.gain.exponentialRampToValueAtTime(0.06, when + 1.2);
      g.gain.setValueAtTime(0.06, Math.max(when + 1.2, end - 1.2)); g.gain.exponentialRampToValueAtTime(0.0001, end);
      f.connect(g); g.connect(this.bus);
      [110, 130.8, 164.8, 220.5].forEach((hz) => {
        const o = this.ac.createOscillator(); o.type = "sawtooth"; o.frequency.value = hz; o.detune.value = (Math.random() - 0.5) * 14;
        o.connect(f); o.start(when); o.stop(end + 0.1);
      });
    },
  };

  /* ==========================================================
     LECTEUR & EXPORT
     ========================================================== */
  const $ = (s) => document.querySelector(s);
  const playBtn = $("#play"), scrub = $("#scrub"), timeEl = $("#time"), bigPlay = $(".big-play"), status = $("#status"), exportBtn = $("#export");
  let playing = false, cur = 0, startT = 0, startPerf = 0, recorder = null;

  function play(from = cur) {
    if (from >= DUR - 0.05) from = 0;
    cur = startT = from; startPerf = performance.now(); playing = true;
    Sound.start(from);
    bigPlay.classList.add("hidden");
    playBtn.textContent = "❚❚";
  }
  function pause() { playing = false; Sound.stop(); playBtn.textContent = "▶"; }
  function onEnd() { pause(); if (recorder) recorder.stop(); }
  let rendering = false;
  function loop() {
    if (rendering) return requestAnimationFrame(loop);
    if (playing) {
      cur = startT + (performance.now() - startPerf) / 1000;
      if (cur >= DUR) { cur = DUR; onEnd(); }
    }
    draw(Math.min(cur, DUR - 0.001));
    scrub.value = cur;
    timeEl.textContent = `${cur.toFixed(1)} / ${DUR.toFixed(1)} s`;
    requestAnimationFrame(loop);
  }

  playBtn.onclick = () => (playing ? pause() : play(bigPlay.classList.contains("hidden") ? cur : 0));
  bigPlay.onclick = () => play(0);
  $("#restart").onclick = () => play(0);
  scrub.oninput = () => { if (recorder) return; pause(); cur = +scrub.value; };
  addEventListener("keydown", (e) => { if (e.code === "Space" && !recorder) { e.preventDefault(); playing ? pause() : play(); } });
  $("#sound").onclick = (e) => { Sound.setMuted(!Sound.muted); e.target.textContent = Sound.muted ? "🔇 Muet" : "🔊 Son"; };

  // Export MP4 image par image (WebCodecs) : aucune image perdue, plus rapide que le temps réel
  const FPS = 30;
  const tick = () => new Promise((r) => { const ch = new MessageChannel(); ch.port1.onmessage = r; ch.port2.postMessage(0); }); // pas ralenti si l'onglet est en arrière-plan
  async function renderMP4(onProgress = () => {}) {
    const { Muxer, ArrayBufferTarget } = window.Mp4Muxer;
    const audio = await Sound.renderOffline(48000);
    const muxer = new Muxer({
      target: new ArrayBufferTarget(), fastStart: "in-memory",
      video: { codec: "avc", width: W, height: H, frameRate: FPS },
      audio: { codec: "aac", numberOfChannels: 2, sampleRate: 48000 },
    });
    let error = null;
    const venc = new VideoEncoder({ output: (c, m) => muxer.addVideoChunk(c, m), error: (e) => (error = e) });
    venc.configure({ codec: "avc1.640032", width: W, height: H, bitrate: 14_000_000, framerate: FPS });
    const aenc = new AudioEncoder({ output: (c, m) => muxer.addAudioChunk(c, m), error: (e) => (error = e) });
    aenc.configure({ codec: "mp4a.40.2", numberOfChannels: 2, sampleRate: 48000, bitrate: 192_000 });

    const L = audio.getChannelData(0), Rc = audio.getChannelData(1), N = 1024;
    for (let i = 0; i < L.length; i += N) {
      const n = Math.min(N, L.length - i), data = new Float32Array(n * 2);
      data.set(L.subarray(i, i + n), 0); data.set(Rc.subarray(i, i + n), n);
      const ad = new AudioData({ format: "f32-planar", sampleRate: 48000, numberOfFrames: n, numberOfChannels: 2, timestamp: Math.round(i / 48000 * 1e6), data });
      aenc.encode(ad); ad.close();
    }

    rendering = true;
    try {
      const total = Math.round(DUR * FPS);
      for (let i = 0; i < total; i++) {
        if (error) throw error;
        draw(i / FPS);
        // Pixels bruts plutôt que VideoFrame(cvs) : la capture directe du canvas peut bloquer quand l'onglet est caché
        const px = ctx.getImageData(0, 0, W, H).data;
        const frame = new VideoFrame(px, { format: "RGBA", codedWidth: W, codedHeight: H, timestamp: Math.round(i * 1e6 / FPS), duration: Math.round(1e6 / FPS) });
        venc.encode(frame, { keyFrame: i % (FPS * 2) === 0 }); frame.close();
        while (venc.encodeQueueSize > 8) await tick();
        if (i % 15 === 0) { onProgress(i / total); await tick(); }
      }
      await venc.flush(); await aenc.flush();
      if (error) throw error;
      muxer.finalize();
      return new Blob([muxer.target.buffer], { type: "video/mp4" });
    } finally { rendering = false; }
  }
  window.renderMP4 = renderMP4;

  exportBtn.onclick = async () => {
    if (recorder || rendering) return;
    if (window.VideoEncoder && window.AudioEncoder && window.Mp4Muxer) {
      pause();
      try {
        const blob = await renderMP4((p) => { exportBtn.textContent = `● Rendu… ${Math.round(p * 100)} %`; });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob); a.download = "warmup-esport-media-9x16.mp4"; a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
        status.textContent = `Vidéo exportée (MP4, ${(blob.size / 1e6).toFixed(1)} Mo) : elle est dans tes téléchargements.`;
      } catch (e) { status.textContent = "Échec de l'export : " + e.message; }
      exportBtn.textContent = "⬇ Exporter la vidéo (9:16)";
      return;
    }
    if (recorder) return;
    if (!window.MediaRecorder || !cvs.captureStream) { status.textContent = "Ton navigateur ne permet pas l'export : utilise Chrome ou Edge."; return; }
    Sound.init();
    const stream = new MediaStream([...cvs.captureStream(60).getVideoTracks(), ...Sound.dest.stream.getAudioTracks()]);
    const types = ["video/mp4;codecs=avc1.640028,mp4a.40.2", "video/mp4", "video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"];
    const mime = types.find((m) => MediaRecorder.isTypeSupported(m)) || "";
    const ext = mime.includes("mp4") ? "mp4" : "webm";
    const chunks = [];
    recorder = new MediaRecorder(stream, { mimeType: mime || undefined, videoBitsPerSecond: 16_000_000 });
    recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mime || "video/webm" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `warmup-esport-media-9x16.${ext}`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
      recorder = null;
      exportBtn.classList.remove("rec"); exportBtn.textContent = "⬇ Exporter la vidéo (9:16)";
      status.textContent = `Vidéo exportée (${ext.toUpperCase()}, ${(blob.size / 1e6).toFixed(1)} Mo) : elle est dans tes téléchargements.`;
    };
    recorder.start();
    exportBtn.classList.add("rec"); exportBtn.textContent = "● Enregistrement…";
    status.textContent = "Enregistrement en cours (20 s) : garde cet onglet ouvert et visible jusqu'à la fin.";
    play(0);
  };

  /* ---------- Démarrage ---------- */
  Promise.all([
    document.fonts.load(`italic 800 100px 'Barlow Condensed'`), document.fonts.load(`800 40px Barlow`),
    document.fonts.load(`700 40px Barlow`), document.fonts.load(`400 40px Barlow`),
  ]).finally(() => { cur = 3.9; requestAnimationFrame(loop); }); // image d'aperçu avant lecture
})();
