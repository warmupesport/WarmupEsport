/* ==========================================================
   WARMUP ESPORT — Motion design de présentation (30 s)
   Tout est dessiné sur un canvas en fonction du temps t : l'animation est
   donc identique à chaque lecture, et peut être enregistrée en vidéo.
   Les textes se modifient dans l'objet TEXTS ci-dessous.
   ========================================================== */

(() => {
  /* ---------- Textes (à personnaliser) ---------- */
  const TEXTS = {
    tagline: "STRUCTURE ESPORT · FORTNITE",
    since: "DEPUIS", year: 2025, born: "NÉE POUR LA COMPÉTITION.",
    storm: "LA ZONE SE REFERME", motto1: "UN MOT D'ORDRE :", motto2: "GAGNER.",
    dna: [
      ["COMPÉTITION", "Viser le Top 1, game après game."],
      ["PROGRESSION", "Entraînement, review et stratégie."],
      ["COMMUNAUTÉ", "Une famille unie sous les mêmes couleurs."],
    ],
    collection: "COLLECTION", collectionYear: "2026", collectionSub: "LES MAILLOTS OFFICIELS", shop: "DISPONIBLE SUR LA BOUTIQUE",
    outro1: "WRMP", outro2: "ON TOP", outroSub: "WARMUP ESPORT · FORTNITE",
  };
  const JERSEYS = ["home-26", "away-26", "neon-ltd"]; // ids des maillots dans js/data.js

  /* ---------- Timeline (secondes) ---------- */
  const DUR = 30;
  const CUTS = [7.5, 11, 16.5, 21.5, 26];                     // transitions entre scènes
  const IMPACTS = [[0.8, 26], [9.2, 12], [14.6, 28], [27.2, 22]]; // [moment, force] → secousse caméra

  const VIOLET = "#8b3dff", VIOLET2 = "#b07cff";
  const TAU = Math.PI * 2;
  const cvs = document.getElementById("mv"), ctx = cvs.getContext("2d");
  let W, H, U, portrait, minD, diag;

  /* ---------- Outils ---------- */
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const prog = (t, a, b) => clamp((t - a) / (b - a));
  const eOutExpo = (x) => (x === 1 ? 1 : 1 - Math.pow(2, -10 * x));
  const eOutCubic = (x) => 1 - Math.pow(1 - x, 3);
  const eInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const eOutBack = (x) => 1 + 2.70158 * Math.pow(x - 1, 3) + 1.70158 * Math.pow(x - 1, 2);
  const eIn = (x) => x * x * x;
  function rng(seed) { // pseudo-aléatoire reproductible : même rendu à chaque lecture
    return () => {
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const R = rng(2025);
  const DUST = Array.from({ length: 90 }, () => ({ x: R(), y: R(), s: R() * 2.2 + 0.6, v: R() * 0.6 + 0.2, a: R() * 0.45 + 0.15 }));
  const BURST = Array.from({ length: 80 }, () => ({ a: R() * TAU, d: R() * 0.6 + 0.35, s: R() * 3 + 1 }));
  const SWIRL = Array.from({ length: 170 }, () => ({ a: R() * TAU, d: R(), sp: R() * 0.8 + 0.3, len: R() * 0.25 + 0.05, w: R() * 3 + 1, al: R() * 0.45 + 0.15 }));
  const SLICES = Array.from({ length: 14 }, () => ({ y: R(), h: R() * 0.1 + 0.02, dx: R() - 0.5 }));
  const BOLTS = [12.25, 13.05, 15.3].map((t0) => {
    const r = rng(Math.round(t0 * 100)), side = r();
    return { t0, sx: side, pts: Array.from({ length: 9 }, () => r() - 0.5) };
  });

  function setSize(f) {
    portrait = f === "9x16";
    cvs.width = portrait ? 1080 : 1920; cvs.height = portrait ? 1920 : 1080;
    W = cvs.width; H = cvs.height; minD = Math.min(W, H); diag = Math.hypot(W, H); U = minD / 1080;
  }

  /* ---------- Médias ---------- */
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

  function jerseyImage(d) {
    const shape = "M98 22 L58 34 L8 76 L36 132 L70 114 L70 304 Q150 316 230 304 L230 114 L264 132 L292 76 L242 34 L202 22 Q150 62 98 22 Z";
    let pat = "";
    if (d.pattern === "chevrons") pat = `<path d="M70 150 L150 230 L230 150 L230 180 L150 260 L70 180Z" fill="${d.accent}" opacity=".9"/><path d="M70 196 L150 276 L230 196 L230 210 L150 290 L70 210Z" fill="${d.accent2}" opacity=".7"/><path d="M8 76 L58 34 L70 40 L22 84Z" fill="${d.accent}"/><path d="M292 76 L242 34 L230 40 L278 84Z" fill="${d.accent}"/>`;
    else if (d.pattern === "split") pat = `<path d="M0 320 L300 60 L300 320Z" fill="${d.accent}"/><path d="M0 300 L300 40 L300 54 L0 314Z" fill="${d.accent2}"/>`;
    else if (d.pattern === "gradient") pat = `<rect width="300" height="320" fill="url(#n)"/><path d="M70 120 L230 260" stroke="${d.accent2}" stroke-width="3" opacity=".8"/><path d="M70 140 L230 280" stroke="${d.accent}" stroke-width="2"/>`;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 320" width="600" height="640"><defs><clipPath id="c"><path d="${shape}"/></clipPath><linearGradient id="n" x1="0" y1="0" x2="1" y2="1"><stop offset=".25" stop-color="${d.base}"/><stop offset=".7" stop-color="${d.accent}"/><stop offset="1" stop-color="${d.accent2}"/></linearGradient><linearGradient id="s" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".35"/><stop offset=".25" stop-color="#fff" stop-opacity=".07"/><stop offset=".5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".4"/></linearGradient></defs><g clip-path="url(#c)"><rect width="300" height="320" fill="${d.base}"/>${pat}<rect width="300" height="320" fill="url(#s)"/></g><path d="${shape}" fill="none" stroke="rgba(255,255,255,.2)" stroke-width="2"/><path d="M98 22 Q150 62 202 22 Q150 46 98 22Z" fill="${d.accent}"/></svg>`;
    const img = new Image();
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
    img.pattern = d.pattern;
    return img;
  }
  const jerseys = JERSEYS.map((id) => PRODUCTS.find((p) => p.id === id)).filter(Boolean).map((p) => jerseyImage(p.design));

  // Grain de pellicule (texture de bruit répétée)
  const grainTile = document.createElement("canvas");
  grainTile.width = grainTile.height = 220;
  {
    const g = grainTile.getContext("2d"), id = g.createImageData(220, 220), r = rng(7);
    for (let i = 0; i < id.data.length; i += 4) { const v = r() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
    g.putImageData(id, 0, 0);
  }
  let grainPattern = null;

  /* ---------- Texte ---------- */
  function txt(s, x, y, o = {}) {
    ctx.save();
    ctx.globalAlpha *= o.alpha ?? 1;
    ctx.font = o.ui ? `${o.weight || 700} ${o.size}px Barlow, sans-serif` : `italic 800 ${o.size}px 'Barlow Condensed', sans-serif`;
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
    ctx.font = o.ui ? `${o.weight || 700} ${size}px Barlow, sans-serif` : `italic 800 ${size}px 'Barlow Condensed', sans-serif`;
    if ("letterSpacing" in ctx) ctx.letterSpacing = (o.ls || 0) + "px";
    const w = ctx.measureText(s).width;
    ctx.restore();
    return w;
  }
  function txtParts(parts, x, y, size, o = {}) { // texte multicolore centré : [["L'ADN ", "#fff"], ["WARMUP", VIOLET]]
    const ws = parts.map(([s]) => measure(s, size, o));
    let cx = x - ws.reduce((a, b) => a + b, 0) / 2;
    parts.forEach(([s, color], i) => { txt(s, cx, y, { ...o, size, color, align: "left" }); cx += ws[i]; });
  }
  function wrap(s, maxW, size, o) {
    const words = s.split(" "), lines = [];
    let line = "";
    for (const w of words) {
      const test = line ? line + " " + w : w;
      if (measure(test, size, o) > maxW && line) { lines.push(line); line = w; } else line = test;
    }
    lines.push(line);
    return lines;
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

  /* ---------- Décor commun ---------- */
  function background(t, glow = 1) {
    ctx.fillStyle = "#040208"; ctx.fillRect(-50, -50, W + 100, H + 100);
    const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, diag / 2);
    g.addColorStop(0, `rgba(95,32,180,${0.45 * glow})`);
    g.addColorStop(0.6, `rgba(30,10,60,${0.35 * glow})`);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    // Sol en grille qui avance
    ctx.save();
    ctx.strokeStyle = VIOLET; ctx.lineWidth = 1.2 * U;
    const hy = H * 0.64;
    ctx.globalAlpha = 0.16 * glow;
    for (let i = -14; i <= 14; i++) { ctx.beginPath(); ctx.moveTo(W / 2 + i * W * 0.02, hy); ctx.lineTo(W / 2 + i * W * 0.2, H); ctx.stroke(); }
    const off = (t * 0.35) % 1;
    for (let j = 0; j < 10; j++) {
      const k = (j + off) / 10, y = hy + (H - hy) * k * k;
      ctx.globalAlpha = 0.2 * glow * k;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
    ctx.restore();

    // Poussière violette qui monte
    for (const p of DUST) {
      const y = (((p.y - t * p.v * 0.04) % 1) + 1) % 1;
      ctx.fillStyle = `rgba(176,124,255,${p.a * glow})`;
      ctx.beginPath(); ctx.arc(p.x * W, y * H, p.s * U, 0, TAU); ctx.fill();
    }
  }

  /* ==========================================================
     SCÈNES
     ========================================================== */

  // 1 + 2 · Explosion du logo, puis nom de la structure (0 → 7,5 s)
  function sIdentity(t) {
    background(t, prog(t, 0.6, 1.6));
    const cx = W / 2, cy = H / 2;

    // Ligne lumineuse d'ouverture
    if (t < 1.0) {
      const p = eOutExpo(prog(t, 0.1, 0.8));
      ctx.save();
      ctx.globalAlpha = 1 - prog(t, 0.8, 1.0);
      ctx.shadowColor = VIOLET; ctx.shadowBlur = 30 * U; ctx.fillStyle = "#fff";
      ctx.fillRect(cx - (W / 2) * p, cy - 2 * U, W * p, 4 * U);
      ctx.restore();
    }
    if (t < 0.8) return;

    const sp = prog(t, 0.8, 2.0);
    ring(cx, cy, eOutExpo(sp) * diag * 0.6, (30 * (1 - sp) + 2) * U, 1 - sp);
    const bp = prog(t, 0.8, 2.4);
    if (bp < 1) for (const b of BURST) {
      const d = eOutExpo(bp) * b.d * diag * 0.5;
      ctx.fillStyle = `rgba(255,255,255,${(1 - bp) * 0.9})`;
      ctx.beginPath(); ctx.arc(cx + Math.cos(b.a) * d, cy + Math.sin(b.a) * d, b.s * U * (1 - bp * 0.5), 0, TAU); ctx.fill();
    }

    // Logo : arrive en force, puis monte pour laisser place au nom
    const inP = eOutExpo(prog(t, 0.8, 1.5)), mv = eInOut(prog(t, 3.5, 4.3)), out = prog(t, 7.0, 7.45);
    const base = minD * 0.42;
    const size = base * lerp(lerp(2.4, 1, inP) * (1 + 0.03 * Math.sin(t * 2.4)), portrait ? 0.62 : 0.5, mv);
    const ly = lerp(cy, H * (portrait ? 0.3 : 0.27), mv) - out * 60 * U;
    const la = prog(t, 0.8, 1.05) * (1 - out);
    if (inP < 1) { // aberration chromatique pendant l'impact
      ctx.save(); ctx.globalCompositeOperation = "lighter";
      drawLogo(cx - (1 - inP) * 50 * U, ly, size, la * 0.45, false);
      drawLogo(cx + (1 - inP) * 50 * U, ly, size, la * 0.45, false);
      ctx.restore();
    }
    drawLogo(cx, ly, size, la);

    // Nom lettre par lettre
    if (t > 3.9) {
      const S = (portrait ? 250 : 270) * U, y = H * (portrait ? 0.5 : 0.56) - out * 60 * U;
      const letters = [..."WARMUP"], gap = S * 0.03;
      const ws = letters.map((l) => measure(l, S));
      let x = cx - (ws.reduce((a, b) => a + b, 0) + gap * (letters.length - 1)) / 2;
      letters.forEach((l, i) => {
        const p = prog(t, 4.0 + i * 0.07, 4.6 + i * 0.07);
        txt(l, x + ws[i] / 2, y - (1 - eOutBack(p)) * H * 0.12, { size: S, alpha: prog(t, 4.0 + i * 0.07, 4.25 + i * 0.07) * (1 - out) });
        x += ws[i] + gap;
      });
      const ep = eOutExpo(prog(t, 4.6, 5.6));
      const ey = y + S * 0.6;
      txt("ESPORT", cx, ey, { size: 72 * U, color: VIOLET2, ls: lerp(4, 38, ep) * U, alpha: ep * (1 - out), glow: "rgba(139,61,255,.8)", glowSize: 20 });
      const tp = eOutCubic(prog(t, 5.2, 5.9)), ty = ey + 90 * U + (1 - tp) * 20 * U;
      const tSize = (portrait ? 26 : 28) * U, tw = measure(TEXTS.tagline, tSize, { ui: true, weight: 700, ls: 8 * U });
      txt(TEXTS.tagline, cx, ty, { ui: true, size: tSize, weight: 700, ls: 8 * U, color: "rgba(255,255,255,.85)", alpha: tp * (1 - out) });
      const lw = 110 * U * eOutExpo(prog(t, 5.4, 6.2));
      ctx.save();
      ctx.globalAlpha = 1 - out; ctx.fillStyle = VIOLET;
      ctx.fillRect(cx - tw / 2 - 24 * U - lw, ty - 1.5 * U, lw, 3 * U);
      ctx.fillRect(cx + tw / 2 + 24 * U, ty - 1.5 * U, lw, 3 * U);
      ctx.restore();
    }
    flash(0.9 * (1 - prog(t, 0.8, 1.3)));
  }

  // 3 · Depuis 2025 (7,5 → 11 s)
  function sYear(t) {
    background(t, 0.8);
    const cx = W / 2, cy = H / 2;
    ctx.save();
    ctx.setLineDash([22 * U, 16 * U]);
    for (let k = 0; k < 3; k++) {
      ctx.save();
      ctx.translate(cx, cy); ctx.rotate(t * 0.25 * (k % 2 ? 1 : -1));
      ctx.strokeStyle = `rgba(176,124,255,${0.28 - k * 0.06})`; ctx.lineWidth = 2 * U;
      ctx.beginPath(); ctx.arc(0, 0, minD * (0.34 + 0.11 * k), 0, TAU); ctx.stroke();
      ctx.restore();
    }
    ctx.restore();

    txt(TEXTS.since, cx, cy - 235 * U, { ui: true, weight: 800, size: 34 * U, ls: 16 * U, color: VIOLET2, alpha: prog(t, 7.7, 8.1) });
    const locked = t >= 9.2;
    const v = Math.round(lerp(1990, TEXTS.year, eOutCubic(prog(t, 7.8, 9.2))));
    const S = (portrait ? 330 : 390) * U;
    const pop = 1 + 0.15 * (1 - eOutCubic(prog(t, 9.2, 9.6)));
    ctx.save();
    ctx.translate(cx, cy); ctx.scale(pop, pop);
    if (!locked) {
      txt(String(v - 1), 0, -S * 0.75, { size: S, fill: false, stroke: 2 * U, strokeColor: "rgba(176,124,255,.25)" });
      txt(String(v), 0, 0, { size: S, fill: false, stroke: 3 * U });
    } else {
      txt(String(v), 0, 0, { size: S, color: "#fff", glow: "rgba(139,61,255,.9)", glowSize: 50 });
    }
    ctx.restore();
    ring(cx, cy, minD * 0.3 + eOutExpo(prog(t, 9.2, 10)) * minD * 0.5, 6 * U, locked ? 1 - prog(t, 9.2, 10) : 0);
    const sp = eOutCubic(prog(t, 9.5, 10));
    txt(TEXTS.born, cx, cy + 235 * U + (1 - sp) * 20 * U, { ui: true, weight: 700, size: (portrait ? 32 : 36) * U, ls: 6 * U, color: "rgba(255,255,255,.85)", alpha: sp });
    flash(0.5 * (1 - prog(t, 9.2, 9.5)));
  }

  // 4 · La tempête se referme : « Un mot d'ordre : gagner. » (11 → 16,5 s)
  function storm(t, Rr) {
    const cx = W / 2, cy = H / 2;
    ctx.save();
    ctx.beginPath(); ctx.rect(-50, -50, W + 100, H + 100); ctx.arc(cx, cy, Rr, 0, TAU, true); ctx.clip();
    ctx.fillStyle = "rgba(72,20,155,0.62)"; ctx.fillRect(-50, -50, W + 100, H + 100);
    ctx.lineCap = "round";
    for (const s of SWIRL) {
      const r = Rr + s.d * diag * 0.6, a = s.a + t * s.sp * 0.5;
      ctx.strokeStyle = `rgba(205,165,255,${s.al})`; ctx.lineWidth = s.w * U;
      ctx.beginPath(); ctx.arc(cx, cy, r, a, a + s.len); ctx.stroke();
    }
    ctx.restore();
    for (const [w, a] of [[70, 0.1], [30, 0.22], [10, 0.55], [2.5, 1]]) ring(cx, cy, Rr, w * U, a);
  }
  function sStorm(t) {
    background(t, 0.55);
    const cx = W / 2, cy = H / 2;
    let Rr = lerp(diag * 0.75, minD * 0.37, eInOut(prog(t, 11.0, 13.4)));
    Rr *= lerp(1, 0.93, prog(t, 14.6, 16.5));
    Rr += Math.sin(t * 3) * 4 * U;
    storm(t, Rr);

    // Éclairs dans la tempête
    for (const b of BOLTS) {
      const f = t >= b.t0 ? 1 - prog(t, b.t0, b.t0 + 0.28) : 0;
      if (f <= 0) continue;
      flash(0.18 * f, "176,124,255");
      const x0 = b.sx * W, x1 = cx + (b.sx - 0.5) * Rr * 1.2, y1 = cy - Rr * 0.7;
      ctx.save();
      ctx.strokeStyle = `rgba(255,255,255,${f})`; ctx.lineWidth = 4 * U; ctx.shadowColor = VIOLET2; ctx.shadowBlur = 30 * U;
      ctx.beginPath(); ctx.moveTo(x0, -10);
      b.pts.forEach((j, i) => { const k = (i + 1) / (b.pts.length + 1); ctx.lineTo(lerp(x0, x1, k) + j * 120 * U, lerp(-10, y1, k)); });
      ctx.lineTo(x1, y1); ctx.stroke();
      ctx.restore();
    }

    const a1 = prog(t, 11.4, 11.8) * (1 - prog(t, 13.0, 13.4)) * (0.85 + 0.15 * Math.sin(t * 40));
    txt(TEXTS.storm, cx, cy, { ui: true, weight: 800, size: (portrait ? 38 : 44) * U, ls: 16 * U, alpha: a1, glow: "rgba(139,61,255,.9)", glowSize: 24 });
    const m = eOutCubic(prog(t, 13.5, 13.9));
    txt(TEXTS.motto1, cx, cy - 75 * U + (1 - m) * 30 * U, { size: (portrait ? 96 : 110) * U, alpha: m });
    if (t >= 14.6) {
      const g = eOutExpo(prog(t, 14.6, 15.0));
      ctx.save();
      ctx.translate(cx, cy + 80 * U); ctx.scale(lerp(2.2, 1, g), lerp(2.2, 1, g));
      txt(TEXTS.motto2, 0, 0, { size: (portrait ? 190 : 205) * U, color: VIOLET, alpha: prog(t, 14.6, 14.75), glow: "rgba(139,61,255,.9)", glowSize: 50 });
      ctx.restore();
    }
    flash(0.7 * (t >= 14.6 ? 1 - prog(t, 14.6, 15.0) : 0));
  }

  // 5 · L'ADN de la structure (16,5 → 21,5 s)
  function sDNA(t) {
    background(t, 0.7);
    const cx = W / 2;
    const tp = eOutCubic(prog(t, 16.6, 17.1));
    txtParts([["L'ADN ", "#fff"], ["WARMUP", VIOLET]], cx, H * (portrait ? 0.17 : 0.18) + (1 - tp) * 30 * U, (portrait ? 120 : 110) * U, { alpha: tp });

    TEXTS.dna.forEach(([title, text], i) => {
      let x, y, pw, ph;
      if (portrait) { pw = W * 0.84; ph = H * 0.17; x = (W - pw) / 2; y = H * 0.27 + i * (ph + H * 0.03); }
      else { pw = W * 0.26; ph = H * 0.52; const gap = W * 0.03; x = (W - (3 * pw + 2 * gap)) / 2 + i * (pw + gap); y = H * 0.32; }
      const p = eOutExpo(prog(t, 16.9 + i * 0.22, 17.9 + i * 0.22));
      if (p <= 0) return;
      ctx.save();
      ctx.globalAlpha = p;
      ctx.translate(0, (1 - p) * H * 0.25);
      ctx.fillStyle = "rgba(22,13,42,.88)"; ctx.fillRect(x, y, pw, ph);
      ctx.strokeStyle = "rgba(176,124,255,.35)"; ctx.lineWidth = 1.5 * U; ctx.strokeRect(x, y, pw, ph);
      ctx.fillStyle = VIOLET; ctx.fillRect(x, y, 6 * U, ph * eOutExpo(prog(t, 17.3 + i * 0.22, 18.2 + i * 0.22)));
      const pad = 36 * U;
      txt("0" + (i + 1), x + pw - pad, y + (portrait ? ph / 2 : 80 * U), { size: 120 * U, align: "right", fill: false, stroke: 2 * U, strokeColor: "rgba(176,124,255,.6)" });
      const tSize = (portrait ? 72 : 78) * U, bSize = (portrait ? 26 : 27) * U;
      const titleY = portrait ? y + ph * 0.36 : y + ph * 0.58;
      txt(title, x + pad, titleY, { size: tSize, align: "left" });
      wrap(text, pw - pad * 2 - (portrait ? 160 * U : 0), bSize, { ui: true, weight: 400 }).forEach((line, k) => {
        txt(line, x + pad, titleY + tSize * 0.62 + k * bSize * 1.4, { ui: true, weight: 400, size: bSize, align: "left", color: "rgba(255,255,255,.72)" });
      });
      // Reflet lumineux qui balaie le panneau
      const sw = prog(t, 18.5 + i * 0.15, 19.3 + i * 0.15);
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

  // 6 · Collection de maillots 2026 (21,5 → 26 s)
  function drawJersey(img, x, y, h, rot, alpha) {
    if (!img.complete || !img.naturalWidth) return;
    const w = h * 300 / 320;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "rgba(0,0,0,.45)";
    ctx.beginPath(); ctx.ellipse(x, y + h * 0.55, w * 0.35, h * 0.04, 0, 0, TAU); ctx.fill();
    ctx.translate(x, y); ctx.rotate(rot);
    ctx.shadowColor = "rgba(0,0,0,.6)"; ctx.shadowBlur = 40 * U; ctx.shadowOffsetY = 20 * U;
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
    ctx.shadowColor = "transparent";
    drawLogo(41 / 300 * w, -63 / 320 * h, 38 / 300 * w, 1, false);
    txt("WARMUP", 0, ((img.pattern === "chevrons" ? 140 : 150) - 160) / 320 * h, { ui: true, weight: 800, size: h * 0.06, ls: h * 0.008 });
    ctx.restore();
  }
  function sJerseys(t) {
    background(t, 0.9);
    const cx = W / 2;
    const tp = eOutCubic(prog(t, 21.6, 22.1));
    txtParts([[TEXTS.collection + " ", "#fff"], [TEXTS.collectionYear, VIOLET]], cx, H * (portrait ? 0.14 : 0.15) + (1 - tp) * 30 * U, (portrait ? 120 : 110) * U, { alpha: tp });
    txt(TEXTS.collectionSub, cx, H * (portrait ? 0.14 : 0.15) + 80 * U, { ui: true, weight: 700, size: 26 * U, ls: 10 * U, color: "rgba(255,255,255,.7)", alpha: prog(t, 21.9, 22.4) });

    const order = portrait ? [0, 2, 1] : [0, 1, 2]; // en vertical, le maillot central est dessiné en dernier (devant)
    order.forEach((i) => {
      const img = jerseys[i];
      if (!img) return;
      const p = eOutExpo(prog(t, 21.9 + i * 0.18, 23.1 + i * 0.18));
      let tx, ty, h;
      if (portrait) {
        const side = i === 1 ? 0 : i === 0 ? -1 : 1;
        tx = cx + side * W * 0.3; ty = H * (side ? 0.47 : 0.5); h = H * (side ? 0.2 : 0.29);
      } else { tx = cx + (i - 1) * W * 0.27; ty = H * 0.54; h = H * 0.5; }
      const x = lerp(W * 1.4, tx, p), y = ty + Math.sin(t * 2 + i) * 8 * U;
      drawJersey(img, x, y, h, lerp(0.7, 0, p) + Math.sin(t * 1.5 + i) * 0.03, prog(t, 21.9 + i * 0.18, 22.3 + i * 0.18));
    });

    const bp = eOutBack(prog(t, 23.6, 24.2));
    if (bp > 0) {
      const size = 28 * U, ls = 6 * U, tw = measure(TEXTS.shop, size, { ui: true, weight: 800, ls });
      const bw = tw + 80 * U, bh = 76 * U, by = H * (portrait ? 0.8 : 0.89);
      ctx.save();
      ctx.translate(cx, by); ctx.scale(bp, bp);
      ctx.fillStyle = VIOLET; ctx.shadowColor = "rgba(139,61,255,.8)"; ctx.shadowBlur = 40 * U;
      ctx.beginPath(); ctx.roundRect(-bw / 2, -bh / 2, bw, bh, bh / 2); ctx.fill();
      ctx.restore();
      ctx.save(); ctx.translate(cx, by); ctx.scale(bp, bp);
      txt(TEXTS.shop, 0, 2 * U, { ui: true, weight: 800, size, ls });
      ctx.restore();
    }
  }

  // 7 · Conclusion : WRMP ON TOP (26 → 30 s)
  function sOutro(t) {
    background(t, 1);
    const cx = W / 2, ly = H * (portrait ? 0.36 : 0.34);
    const p = eOutExpo(prog(t, 26.1, 26.8));
    ctx.save();
    ctx.translate(cx, ly); ctx.rotate(lerp(-0.5, 0, p));
    drawLogo(0, 0, minD * lerp(0.2, portrait ? 0.6 : 0.5, p) * (1 + 0.02 * Math.sin(t * 3)), prog(t, 26.1, 26.4));
    ctx.restore();
    const sw = prog(t, 27.2, 28.2);
    ring(cx, ly, minD * 0.25 + eOutExpo(sw) * diag * 0.5, (24 * (1 - sw) + 2) * U, t >= 27.2 ? 1 - sw : 0);

    const S = (portrait ? 190 : 230) * U, y = H * (portrait ? 0.6 : 0.67);
    const w1 = measure(TEXTS.outro1 + " ", S), w2 = measure(TEXTS.outro2, S), x0 = cx - (w1 + w2) / 2;
    const sl = 1 - eIn(prog(t, 26.7, 27.2));
    const drawWords = () => {
      txt(TEXTS.outro1, x0 - sl * W * 0.8, y, { size: S, align: "left" });
      txt(TEXTS.outro2, x0 + w1 + sl * W * 0.8, y, { size: S, align: "left", color: VIOLET, glow: "rgba(139,61,255,.85)", glowSize: 40 });
    };
    const gl = t >= 27.2 ? 1 - prog(t, 27.2, 27.65) : 0;
    if (gl > 0) { // glitch : tranches décalées + séparation RVB
      for (const s of SLICES) {
        ctx.save();
        ctx.beginPath(); ctx.rect(0, y - S * 0.6 + s.y * S * 1.2, W, s.h * S * 1.2); ctx.clip();
        ctx.translate(s.dx * gl * 120 * U, 0);
        drawWords();
        ctx.restore();
      }
      ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = 0.5 * gl;
      ctx.translate(-14 * U * gl, 0); txt(TEXTS.outro1 + " " + TEXTS.outro2, cx, y, { size: S, color: "#ff2bd6" });
      ctx.translate(28 * U * gl, 0); txt(TEXTS.outro1 + " " + TEXTS.outro2, cx, y, { size: S, color: "#3de8ff" });
      ctx.restore();
    } else drawWords();

    const tp = eOutCubic(prog(t, 27.8, 28.3));
    txt(TEXTS.outroSub, cx, y + S * 0.62 + (1 - tp) * 20 * U, { ui: true, weight: 700, size: 30 * U, ls: 12 * U, color: "rgba(255,255,255,.8)", alpha: tp });
    flash(0.6 * (t >= 27.2 ? 1 - prog(t, 27.2, 27.5) : 0));
  }

  /* ---------- Habillage : transitions, cadre, vignette, grain ---------- */
  function wipes(t) {
    for (const c of CUTS) {
      const p = prog(t, c - 0.32, c + 0.32);
      if (p <= 0 || p >= 1) continue;
      const sk = 0.4 * H, hw = W / 2 + sk + 60 * U, travel = W / 2 + hw + sk;
      const x = W / 2 + lerp(-travel, travel, eInOut(p));
      const band = (off, w, color) => {
        ctx.beginPath();
        ctx.moveTo(x + off - w + sk / 2, 0); ctx.lineTo(x + off + w + sk / 2, 0);
        ctx.lineTo(x + off + w - sk / 2, H); ctx.lineTo(x + off - w - sk / 2, H);
        ctx.closePath(); ctx.fillStyle = color; ctx.fill();
      };
      band(-hw - 24 * U, 24 * U, "#2a0b5c");
      band(0, hw, "#6d27e6");
      band(hw + 22 * U, 10 * U, "#fff");
      band(hw + 64 * U, 6 * U, VIOLET2);
      drawLogo(x, H / 2, minD * 0.2, 1, false);
    }
  }
  function frameHud(t) {
    const a = prog(t, 1.6, 2.2) * (1 - prog(t, 29, 29.6));
    if (a <= 0) return;
    const m = 40 * U, l = 46 * U;
    ctx.save();
    ctx.globalAlpha = a * 0.7; ctx.strokeStyle = "#fff"; ctx.lineWidth = 2 * U;
    [[m, m, 1, 1], [W - m, m, -1, 1], [m, H - m, 1, -1], [W - m, H - m, -1, -1]].forEach(([x, y, sx, sy]) => {
      ctx.beginPath(); ctx.moveTo(x, y + l * sy); ctx.lineTo(x, y); ctx.lineTo(x + l * sx, y); ctx.stroke();
    });
    ctx.restore();
    const scene = t < 7.5 ? 1 : t < 11 ? 2 : t < 16.5 ? 3 : t < 21.5 ? 4 : t < 26 ? 5 : 6;
    txt("WRMP", m + 64 * U, m + 22 * U, { ui: true, weight: 800, size: 20 * U, ls: 6 * U, align: "left", alpha: a * 0.8 });
    txt(`0${scene} / 06`, W - m - 64 * U, m + 22 * U, { ui: true, weight: 700, size: 20 * U, ls: 4 * U, align: "right", color: VIOLET2, alpha: a * 0.9 });
  }
  function overlays(t) {
    const v = ctx.createRadialGradient(W / 2, H / 2, minD * 0.35, W / 2, H / 2, diag / 2);
    v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(0,0,0,.6)");
    ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
    grainPattern ||= ctx.createPattern(grainTile, "repeat");
    const r = rng(Math.floor(t * 24));
    ctx.save();
    ctx.globalAlpha = 0.05; ctx.translate(-r() * 220, -r() * 220);
    ctx.fillStyle = grainPattern; ctx.fillRect(0, 0, W + 220, H + 220);
    ctx.restore();
    flash(prog(t, 29.2, 30), "0,0,0"); // fondu au noir final
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
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
    ctx.save();
    const [sx, sy] = shake(t);
    ctx.translate(sx, sy);
    if (t < 7.5) sIdentity(t);
    else if (t < 11) sYear(t);
    else if (t < 16.5) sStorm(t);
    else if (t < 21.5) sDNA(t);
    else if (t < 26) sJerseys(t);
    else sOutro(t);
    ctx.restore();
    frameHud(t);
    wipes(t);
    overlays(t);
  }

  /* ==========================================================
     SON : musique et bruitages générés en direct (WebAudio)
     ========================================================== */
  const EVENTS = [["riser", 0, 0.8], ["impact", 0.8, 1], ["pad", 3.5, 29.5], ["riser", 8.4, 0.8], ["impact", 9.2, 0.5],
    ["riser", 13.4, 1.2], ["impact", 14.6, 1.2], ["riser", 26.2, 1.0], ["impact", 27.2, 1.2]];
  for (let b = 3.5; b < 11; b += 0.5) EVENTS.push(["kick", b], ["hat", b + 0.25]);
  for (let b = 11; b < 16.5; b += 1) if (b !== 14) EVENTS.push(["kick", b]);
  for (let b = 16.5; b < 26; b += 0.5) EVENTS.push(["kick", b], ["hat", b + 0.25]);
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
      g.gain.setValueAtTime(0.0001, when); g.gain.exponentialRampToValueAtTime(0.06, when + 1.5);
      g.gain.setValueAtTime(0.06, Math.max(when + 1.5, end - 1.5)); g.gain.exponentialRampToValueAtTime(0.0001, end);
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
  function pause() {
    playing = false; Sound.stop();
    playBtn.textContent = "▶";
  }
  function onEnd() {
    pause();
    if (recorder) recorder.stop();
  }
  function loop() {
    if (playing) {
      cur = startT + (performance.now() - startPerf) / 1000;
      if (cur >= DUR) { cur = DUR; onEnd(); }
    }
    draw(Math.min(cur, DUR - 0.001));
    scrub.value = cur;
    timeEl.textContent = `${cur.toFixed(1)} / ${DUR.toFixed(1)} s`;
    requestAnimationFrame(loop);
  }

  // Première lecture : toujours depuis le début (l'image affichée avant lecture n'est qu'un aperçu)
  playBtn.onclick = () => (playing ? pause() : play(bigPlay.classList.contains("hidden") ? cur : 0));
  bigPlay.onclick = () => play(0);
  $("#restart").onclick = () => play(0);
  scrub.oninput = () => { if (recorder) return; pause(); cur = +scrub.value; };
  addEventListener("keydown", (e) => { if (e.code === "Space" && !recorder) { e.preventDefault(); playing ? pause() : play(); } });
  document.querySelectorAll(".seg button").forEach((b) => (b.onclick = () => {
    if (recorder) return;
    document.querySelectorAll(".seg button").forEach((x) => x.classList.toggle("on", x === b));
    setSize(b.dataset.f); grainPattern = null;
  }));
  $("#sound").onclick = (e) => { Sound.setMuted(!Sound.muted); e.target.textContent = Sound.muted ? "🔇 Muet" : "🔊 Son"; };

  exportBtn.onclick = () => {
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
      a.download = `warmup-esport-presentation-${portrait ? "9x16" : "16x9"}.${ext}`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
      recorder = null;
      exportBtn.classList.remove("rec"); exportBtn.textContent = "⬇ Exporter la vidéo";
      status.textContent = `Vidéo exportée (${ext.toUpperCase()}, ${(blob.size / 1e6).toFixed(1)} Mo) : elle est dans tes téléchargements.`;
    };
    recorder.start();
    exportBtn.classList.add("rec"); exportBtn.textContent = "● Enregistrement…";
    status.textContent = "Enregistrement en cours (30 s) : garde cet onglet ouvert et visible jusqu'à la fin.";
    play(0);
  };

  /* ---------- Démarrage ---------- */
  setSize("16x9");
  Promise.all([
    document.fonts.load(`italic 800 100px 'Barlow Condensed'`), document.fonts.load(`800 40px Barlow`),
    document.fonts.load(`700 40px Barlow`), document.fonts.load(`400 40px Barlow`),
  ]).finally(() => { cur = 6.5; requestAnimationFrame(loop); }); // image d'aperçu avant lecture
})();
