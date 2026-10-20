/* ==========================================================
   WARMUP ESPORT — Motion « Du plan à la réalité » (30 s)
   DA blueprint : papier bleu, tracés à la craie, crayon + étincelles,
   puis le site prend vie en 3D (Three.js) : vue éclatée des sections,
   scan plan → réalité, maillot qui sort de la page, roster façon gameplay.
   Tout est calculé en fonction du temps t : rendu identique à chaque
   lecture, exportable en MP4. Les textes se modifient dans TEXTS.
   ========================================================== */

(() => {
  /* ---------- Textes (à personnaliser) ---------- */
  const TEXTS = {
    hud: "PLAN N°01 · SITE OFFICIEL",
    s1Small: "PROJET N°01",
    s1: "Le nouveau site Warmup Esport",
    sections: ["HERO", "COLLECTIONS", "HISTOIRE", "ROSTER", "BOUTIQUE"],
    notes: ["Un mot d'ordre : gagner.", "Les maillots 2026", "6 joueurs · 42 tournois", "Le line-up Valorant", "Commande en 2 clics"],
    s2: ["Chaque section,", "pensée au millimètre."],
    count: "5 SECTIONS",
    fromPlan: "Du plan…", toReal: "…à la réalité.",
    shop: "LA BOUTIQUE", jersey: "Maillot Domicile 2026", price: "59,90 €",
    shopNotes: ["Flocage pseudo + numéro", "Point relais ou domicile"],
    roster: "LE ROSTER", rosterNote: "6 joueurs. 1 objectif.", onTop: "WRMP ON TOP",
    name: "WARMUP ESPORT", tagline: "Le nouveau site officiel", url: "warmupesport.fr", stamp: "EN LIGNE",
    cartouche: [["PROJET", "Site officiel"], ["CLIENT", "Warmup Esport"], ["ÉCHELLE", "1:1"], ["DATE", "2026"]],
  };

  /* ---------- Timeline (secondes) ---------- */
  const DUR = 30;
  const WIPES = [[19.5, "#f4f8ff"], [24.5, "#0d47a8"]]; // gribouillis à la craie entre les grandes parties
  const IMPACTS = [[4.95, 12], [12.3, 26], [15.4, 30], [19.5, 12], [22.0, 20], [25.6, 24], [27.9, 22]]; // [moment, force] → secousse
  const FOCUS_STEPS = [12.9, 13.3, 13.7, 14.1]; // défilement des pages du site

  const CHALK = "#f4f8ff", GOLD = "#ffd36b", RED = "#ff2a3d", VIOLET = "#8b3dff", VIOLET2 = "#b07cff";
  const TAU = Math.PI * 2;
  const cvs = document.getElementById("mv"), ctx = cvs.getContext("2d");
  let W, H, U, portrait, minD, diag, DF = 1;

  /* ---------- Outils ---------- */
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const prog = (t, a, b) => clamp((t - a) / (b - a));
  const eOutExpo = (x) => (x === 1 ? 1 : 1 - Math.pow(2, -10 * x));
  const eOutCubic = (x) => 1 - Math.pow(1 - x, 3);
  const eInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const eSine = (x) => -(Math.cos(Math.PI * x) - 1) / 2;
  const eOutBack = (x) => 1 + 2.70158 * Math.pow(x - 1, 3) + 1.70158 * Math.pow(x - 1, 2);
  function rng(seed) { // pseudo-aléatoire reproductible
    return () => {
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  let t_ = 0; // temps courant, pour les helpers

  /* ---------- Texte ---------- */
  function font(kind, size, weight) {
    if (kind === "hand") return `${size}px 'Architects Daughter', cursive`;
    if (kind === "marker") return `${size}px 'Permanent Marker', cursive`;
    if (kind === "ui") return `${weight || 700} ${size}px Barlow, sans-serif`;
    return `italic 800 ${size}px 'Barlow Condensed', sans-serif`;
  }
  function txt(s, x, y, o = {}, g = ctx) {
    g.save();
    g.globalAlpha *= o.alpha ?? 1;
    g.font = font(o.kind, o.size, o.weight);
    const ls = o.ls || 0;
    if ("letterSpacing" in g) g.letterSpacing = ls + "px";
    g.textAlign = o.align || "center"; g.textBaseline = "middle";
    const dx = g.textAlign === "center" ? ls / 2 : 0;
    if (o.glow) { g.shadowColor = o.glow; g.shadowBlur = o.glowSize || 30; }
    if (o.stroke) { g.lineJoin = "round"; g.lineWidth = o.stroke; g.strokeStyle = o.strokeColor || "#fff"; g.strokeText(s, x + dx, y); }
    if (o.fill !== false) { g.fillStyle = o.color || "#fff"; g.fillText(s, x + dx, y); }
    g.restore();
  }
  function measure(s, size, o = {}, g = ctx) {
    g.save();
    g.font = font(o.kind, size, o.weight);
    if ("letterSpacing" in g) g.letterSpacing = (o.ls || 0) + "px";
    const w = g.measureText(s).width;
    g.restore();
    return w;
  }
  function flash(alpha, color = "255,255,255") {
    if (alpha <= 0) return;
    ctx.fillStyle = `rgba(${color},${alpha})`; ctx.fillRect(-60, -60, W + 120, H + 120);
  }
  function ring(x, y, r, width, alpha, color = "244,248,255") {
    if (alpha <= 0) return;
    ctx.strokeStyle = `rgba(${color},${alpha})`; ctx.lineWidth = width;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke();
  }
  // Mot qui « claque » : arrive grand, se pose, avec un écho en contour
  function slam(s, x, y, size, t0, o = {}) {
    if (t_ < t0) return;
    const p = eOutExpo(prog(t_, t0, t0 + 0.35)), a = prog(t_, t0, t0 + 0.08) * (o.alpha ?? 1);
    ctx.save();
    ctx.translate(x, y); ctx.rotate(o.rot || 0);
    if (p < 1) txt(s, 0, 0, { ...o, size: size * lerp(1.7, 1.15, p), fill: false, stroke: 3 * U, strokeColor: o.echo || `rgba(244,248,255,${1 - p})`, alpha: a, glow: null });
    ctx.scale(lerp(1.9, 1, p), lerp(1.9, 1, p));
    txt(s, 0, 0, { ...o, size, alpha: a });
    ctx.restore();
  }
  // Texte au feutre rouge néon (comme le titre manuscrit de la vidéo de référence)
  function marker(s, x, y, size, t0, o = {}) {
    if (t_ < t0) return;
    const p = eOutExpo(prog(t_, t0, t0 + 0.3)), a = prog(t_, t0, t0 + 0.06) * (o.alpha ?? 1);
    const flick = 0.85 + 0.15 * Math.sin(t_ * 37) * Math.sin(t_ * 13); // néon qui grésille
    ctx.save();
    ctx.translate(x, y); ctx.rotate(o.rot || 0); ctx.scale(lerp(2.2, 1, p), lerp(2.2, 1, p));
    txt(s, 0, 0, { kind: "marker", size, align: o.align, color: RED, alpha: a, glow: "rgba(255,30,50,.95)", glowSize: 50 * U * flick });
    txt(s, 0, 0, { kind: "marker", size, align: o.align, color: "#ff6b78", alpha: a * 0.9, glow: "rgba(255,40,60,.9)", glowSize: 14 * U });
    ctx.restore();
  }

  /* ==========================================================
     TRAITS À LA MAIN : lignes tremblées, crayon, étincelles
     ========================================================== */
  function wob(x1, y1, x2, y2, seed = 1, over = 0.05) { // trait légèrement tremblé qui dépasse aux extrémités
    const r = rng(seed), dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len;
    const n = Math.max(2, Math.ceil(len / (70 * U))), pts = [];
    for (let i = 0; i <= n; i++) {
      const k = lerp(-over, 1 + over * 0.6, i / n), j = i === 0 || i === n ? 0 : (r() - 0.5) * 3 * U;
      pts.push([x1 + dx * k + nx * j, y1 + dy * k + ny * j]);
    }
    return pts;
  }
  const rectLines = (x, y, w, h, seed = 1) => [wob(x, y, x + w, y, seed, 0.03), wob(x + w, y, x + w, y + h, seed + 1, 0.04), wob(x + w, y + h, x, y + h, seed + 2, 0.03), wob(x, y + h, x, y, seed + 3, 0.04)];
  function ellipseLine(cx, cy, rx, ry, seed = 1, turns = 1.12, start = -2.4) {
    const r = rng(seed), n = Math.ceil(56 * turns), pts = [];
    for (let i = 0; i <= n; i++) {
      const a = start + (i / n) * TAU * turns, k = 1 + (r() - 0.5) * 0.04 + (i / n) * 0.06;
      pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
    }
    return pts;
  }
  function arrowLines(x1, y1, x2, y2, seed = 1) {
    const a = Math.atan2(y2 - y1, x2 - x1), h = 26 * U;
    return [wob(x1, y1, x2, y2, seed, 0.01),
      [[x2, y2], [x2 - Math.cos(a - 0.5) * h, y2 - Math.sin(a - 0.5) * h]],
      [[x2, y2], [x2 - Math.cos(a + 0.5) * h, y2 - Math.sin(a + 0.5) * h]]];
  }
  function prepLines(lines) {
    const lens = lines.map((pts) => { const L = [0]; for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); return L; });
    const total = lens.reduce((a, L) => a + L[L.length - 1], 0);
    const at = (p) => { // position du bout du trait à l'avancement p
      let d = total * clamp(p);
      for (let k = 0; k < lines.length; k++) {
        const L = lens[k], pts = lines[k], len = L[L.length - 1];
        if (d <= len || k === lines.length - 1) {
          for (let i = 1; i < pts.length; i++) if (L[i] >= d || i === pts.length - 1) {
            const f = clamp((d - L[i - 1]) / ((L[i] - L[i - 1]) || 1));
            return [lerp(pts[i - 1][0], pts[i][0], f), lerp(pts[i - 1][1], pts[i][1], f)];
          }
        }
        d -= len;
      }
      return lines[0][0];
    };
    return { lines, lens, total, at };
  }
  function partialPath(pts, L, d0, d1) {
    let started = false;
    for (let i = 1; i < pts.length; i++) {
      if (L[i] < d0) continue;
      if (L[i - 1] > d1) break;
      const a = clamp((d0 - L[i - 1]) / ((L[i] - L[i - 1]) || 1)), b = clamp((d1 - L[i - 1]) / ((L[i] - L[i - 1]) || 1));
      const p0 = [lerp(pts[i - 1][0], pts[i][0], a), lerp(pts[i - 1][1], pts[i][1], a)], p1 = [lerp(pts[i - 1][0], pts[i][0], b), lerp(pts[i - 1][1], pts[i][1], b)];
      if (!started) { ctx.moveTo(p0[0], p0[1]); started = true; }
      ctx.lineTo(p1[0], p1[1]);
    }
  }
  function drawLines(geo, p, o = {}) {
    let left = geo.total * clamp(p);
    ctx.save();
    ctx.globalAlpha *= o.alpha ?? 1;
    ctx.strokeStyle = o.color || CHALK; ctx.lineCap = ctx.lineJoin = "round";
    ctx.shadowColor = o.glowColor || "rgba(190,220,255,.85)"; ctx.shadowBlur = (o.glowSize ?? 12) * U;
    for (const pass of [0, 1]) { // deux passes décalées = rendu craie
      ctx.lineWidth = (o.width || 3.2) * U * (pass ? 0.55 : 1);
      if (pass) { ctx.globalAlpha *= 0.55; ctx.translate(1.6 * U, -1 * U); }
      left = geo.total * clamp(p);
      ctx.beginPath();
      geo.lines.forEach((pts, k) => {
        const L = geo.lens[k], len = L[L.length - 1];
        if (left > 0) partialPath(pts, L, 0, Math.min(left, len));
        left -= len;
      });
      ctx.stroke();
    }
    ctx.restore();
  }
  // Crayon jaune (clin d'œil à la vidéo de référence), pointe en (x, y)
  function pencil(x, y, a = 1) {
    if (a <= 0) return;
    const s = U * (portrait ? 1.15 : 1);
    ctx.save();
    ctx.globalAlpha *= a; ctx.translate(x, y); ctx.rotate(-0.95);
    const body = (g) => { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(44 * s, -13 * s); ctx.lineTo(322 * s, -13 * s); ctx.lineTo(322 * s, 13 * s); ctx.lineTo(44 * s, 13 * s); ctx.closePath(); };
    ctx.save(); ctx.translate(18 * s, 22 * s); ctx.globalAlpha *= 0.28; ctx.fillStyle = "#000814"; body(); ctx.fill(); ctx.restore(); // ombre portée
    ctx.fillStyle = "#e7c595"; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(44 * s, -13 * s); ctx.lineTo(44 * s, 13 * s); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#2b2b33"; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(13 * s, -4 * s); ctx.lineTo(13 * s, 4 * s); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#f6c21c"; ctx.fillRect(44 * s, -13 * s, 228 * s, 26 * s);
    ctx.fillStyle = "#ffdd5c"; ctx.fillRect(44 * s, -13 * s, 228 * s, 7 * s);
    ctx.fillStyle = "#cf980b"; ctx.fillRect(44 * s, 6 * s, 228 * s, 7 * s);
    ctx.fillStyle = "#c9cad3"; ctx.fillRect(272 * s, -13 * s, 24 * s, 26 * s);
    ctx.fillStyle = "#9a9ba6"; for (let k = 0; k < 3; k++) ctx.fillRect((276 + k * 7) * s, -13 * s, 2 * s, 26 * s);
    ctx.fillStyle = "#f29bb0"; ctx.beginPath(); ctx.roundRect(296 * s, -13 * s, 28 * s, 26 * s, [0, 7 * s, 7 * s, 0]); ctx.fill();
    ctx.restore();
  }
  // Étincelles dorées qui s'échappent de la pointe du crayon
  function sparkles(tipAt, t0, t1, seed = 1) {
    const step = 0.02, life = 0.5;
    const j0 = Math.max(0, Math.floor((t_ - life - t0) / step)), j1 = Math.floor((Math.min(t_, t1) - t0) / step);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (let j = j0; j <= j1; j++) {
      const ts = t0 + j * step, age = t_ - ts;
      if (age < 0 || age > life) continue;
      const r = rng(seed * 997 + j), p0 = tipAt(ts);
      const vx = (r() - 0.5) * 260 * U, vy = (r() - 0.75) * 260 * U, a = 1 - age / life;
      const x = p0[0] + vx * age, y = p0[1] + vy * age + 300 * U * age * age, s = (r() * 3 + 1.4) * U * (0.5 + a);
      ctx.fillStyle = `rgba(255,${190 + r() * 60 | 0},${90 + r() * 80 | 0},${a})`;
      ctx.shadowColor = GOLD; ctx.shadowBlur = 10 * U;
      ctx.beginPath(); ctx.arc(x, y, s, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }
  // Trace des lignes entre t0 et t1, avec crayon et étincelles pendant le tracé
  function stroke(lines, t0, t1, o = {}) {
    const ease = o.ease || eSine, p = ease(prog(t_, t0, t1));
    if (p <= 0) return 0;
    const geo = prepLines(lines);
    drawLines(geo, p, o);
    if (p < 1 && o.pencil !== false) {
      sparkles((ts) => geo.at(ease(prog(ts, t0, t1))), t0, t1, o.seed || 1);
      const tip = geo.at(p);
      pencil(tip[0], tip[1], o.alpha ?? 1);
    }
    return p;
  }
  // Texte manuscrit qui s'écrit de gauche à droite derrière le crayon
  function handWrite(s, x, y, t0, t1, o = {}) {
    const p = prog(t_, t0, t1);
    if (p <= 0) return;
    const size = o.size, w = measure(s, size, { kind: o.kind || "hand" }), align = o.align || "left";
    const x0 = align === "left" ? x : align === "center" ? x - w / 2 : x - w;
    ctx.save();
    if (p < 1) { ctx.beginPath(); ctx.rect(x0 - size, y - size * 1.4, size + w * p, size * 2.8); ctx.clip(); }
    txt(s, x, y, { kind: "hand", glow: "rgba(190,220,255,.7)", glowSize: 10 * U, ...o, align });
    ctx.restore();
    if (p < 1 && o.pencil !== false) {
      const tipAt = (ts) => [x0 + w * prog(ts, t0, t1), y + size * 0.25 + Math.sin(ts * 47) * size * 0.22];
      sparkles(tipAt, t0, t1, o.seed || 7);
      const tip = tipAt(t_);
      pencil(tip[0], tip[1], o.alpha ?? 1);
    }
  }

  /* ==========================================================
     FONDS
     ========================================================== */
  // Texture de papier (taches douces) + grain
  const paperTile = document.createElement("canvas");
  paperTile.width = paperTile.height = 512;
  {
    const g = paperTile.getContext("2d"), r = rng(11);
    g.fillStyle = "#808080"; g.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 260; i++) {
      const x = r() * 512, y = r() * 512, rad = r() * 60 + 10, light = r() > 0.5;
      const gr = g.createRadialGradient(x, y, 0, x, y, rad);
      gr.addColorStop(0, light ? "rgba(255,255,255,.18)" : "rgba(0,0,0,.18)"); gr.addColorStop(1, "rgba(128,128,128,0)");
      g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    }
  }
  const grainTile = document.createElement("canvas");
  grainTile.width = grainTile.height = 220;
  {
    const g = grainTile.getContext("2d"), id = g.createImageData(220, 220), r = rng(7);
    for (let i = 0; i < id.data.length; i += 4) { const v = r() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
    g.putImageData(id, 0, 0);
  }
  let paperPattern = null, grainPattern = null;

  // Papier blueprint : bleu cyanotype, grille fine et grille principale qui se déploient (gr = 0 → 1)
  function blueprint(t, gr = 1) {
    const g = ctx.createRadialGradient(W * 0.5, H * 0.42, 0, W * 0.5, H * 0.42, diag * 0.62);
    g.addColorStop(0, "#1a5fc4"); g.addColorStop(0.55, "#0d4297"); g.addColorStop(1, "#05214f");
    ctx.fillStyle = g; ctx.fillRect(-60, -60, W + 120, H + 120);
    if (gr > 0) {
      const cx = W / 2, cy = H / 2, drift = (t * 6 * U) % (30 * U);
      ctx.save();
      ctx.strokeStyle = "#cfe3ff";
      for (const [step, alpha, lw] of [[30 * U, 0.07, 1], [150 * U, 0.17, 1.4]]) {
        ctx.globalAlpha = alpha; ctx.lineWidth = lw * U;
        const reach = eOutExpo(gr);
        ctx.beginPath();
        for (let x = (cx % step) - step + drift; x < W + step; x += step) { ctx.moveTo(x, cy - (H / 2 + 60) * reach); ctx.lineTo(x, cy + (H / 2 + 60) * reach); }
        for (let y = (cy % step) - step; y < H + step; y += step) { ctx.moveTo(cx - (W / 2 + 60) * reach, y); ctx.lineTo(cx + (W / 2 + 60) * reach, y); }
        ctx.stroke();
      }
      ctx.restore();
    }
    // Pliures du papier
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = "rgba(255,255,255,.05)"; ctx.fillRect(W * 0.62, 0, 2 * U, H); ctx.fillRect(0, H * 0.37, W, 2 * U);
    ctx.fillStyle = "rgba(0,10,40,.18)"; ctx.fillRect(W * 0.62 + 2 * U, 0, 5 * U, H); ctx.fillRect(0, H * 0.37 + 2 * U, W, 5 * U);
    ctx.restore();
    paperPattern ||= ctx.createPattern(paperTile, "repeat");
    ctx.save(); ctx.globalCompositeOperation = "soft-light"; ctx.globalAlpha = 0.9; ctx.fillStyle = paperPattern; ctx.fillRect(0, 0, W, H); ctx.restore();
  }
  // Fond aux couleurs du site (violet / noir) avec sol en grille
  function warmupBg(t) {
    ctx.fillStyle = "#06030d"; ctx.fillRect(-60, -60, W + 120, H + 120);
    const g = ctx.createRadialGradient(W / 2, H * 0.45, 0, W / 2, H * 0.45, diag / 2);
    g.addColorStop(0, "rgba(110,40,210,.55)"); g.addColorStop(0.6, "rgba(30,10,60,.4)"); g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.strokeStyle = VIOLET; ctx.lineWidth = 1.2 * U;
    const hy = H * 0.72;
    ctx.globalAlpha = 0.18;
    for (let i = -16; i <= 16; i++) { ctx.beginPath(); ctx.moveTo(W / 2 + i * W * 0.03, hy); ctx.lineTo(W / 2 + i * W * 0.3, H); ctx.stroke(); }
    const off = (t * 0.6) % 1;
    for (let j = 0; j < 10; j++) {
      const k = (j + off) / 10, y = hy + (H - hy) * k * k;
      ctx.globalAlpha = 0.22 * k;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
    ctx.restore();
  }

  /* ==========================================================
     TEXTURES DES PAGES DU SITE (version plan + version réelle)
     ========================================================== */
  const logo = new Image(); logo.src = "assets/logo.png";
  const logoReady = new Promise((r) => { logo.onload = r; logo.onerror = r; });

  // Silhouette du maillot (y vers le bas, de -1 à 1) ; l'encolure est un arc
  const JERSEY = [[-0.3, -0.92], [-0.64, -0.8], [-1, -0.42], [-0.78, -0.14], [-0.6, -0.3], [-0.6, 0.95], [0.6, 0.95], [0.6, -0.3], [0.78, -0.14], [1, -0.42], [0.64, -0.8], [0.3, -0.92]];
  function jerseyPath(g, cx, cy, s) {
    g.beginPath();
    g.moveTo(cx + JERSEY[0][0] * s, cy + JERSEY[0][1] * s);
    for (const [x, y] of JERSEY.slice(1)) g.lineTo(cx + x * s, cy + y * s);
    g.quadraticCurveTo(cx, cy - 0.6 * s, cx + JERSEY[0][0] * s, cy + JERSEY[0][1] * s);
    g.closePath();
  }
  function jerseyFill(g, x, y, w, h, d) {
    g.save();
    g.fillStyle = d.base; g.fillRect(x, y, w, h);
    if (d.pattern === "chevrons") {
      g.strokeStyle = d.accent; g.lineWidth = h * 0.055; g.lineJoin = "miter";
      for (let k = 0; k < 4; k++) {
        const yy = y + h * (0.42 + k * 0.12);
        g.globalAlpha = 1 - k * 0.22;
        g.beginPath(); g.moveTo(x - w * 0.05, yy - h * 0.13); g.lineTo(x + w / 2, yy); g.lineTo(x + w * 1.05, yy - h * 0.13); g.stroke();
      }
    } else if (d.pattern === "split") {
      g.fillStyle = d.accent; g.beginPath(); g.moveTo(x + w * 0.62, y); g.lineTo(x + w, y); g.lineTo(x + w, y + h); g.lineTo(x + w * 0.22, y + h); g.closePath(); g.fill();
      g.strokeStyle = d.accent2; g.lineWidth = w * 0.02; g.beginPath(); g.moveTo(x + w * 0.58, y); g.lineTo(x + w * 0.18, y + h); g.stroke();
    } else if (d.pattern === "stripes") {
      g.fillStyle = d.accent; for (let sx = x; sx < x + w; sx += w * 0.14) g.fillRect(sx, y, w * 0.05, h);
    } else if (d.pattern === "gradient") {
      const gr = g.createLinearGradient(x, y, x + w, y + h);
      gr.addColorStop(0, d.accent); gr.addColorStop(0.55, d.base); gr.addColorStop(1, d.accent2);
      g.fillStyle = gr; g.fillRect(x, y, w, h);
    } else {
      g.fillStyle = d.accent; g.fillRect(x, y + h * 0.44, w, h * 0.05);
    }
    g.restore();
  }
  function jersey2D(g, cx, cy, s, d) {
    g.save();
    jerseyPath(g, cx, cy, s); g.clip();
    jerseyFill(g, cx - s, cy - s, s * 2, s * 2, d);
    const lw = s * 0.28;
    g.drawImage(logo, cx - lw / 2, cy - s * 0.52, lw, lw * logo.naturalHeight / logo.naturalWidth);
    g.restore();
    g.strokeStyle = d.accent2; g.lineWidth = Math.max(1.5, s * 0.025);
    jerseyPath(g, cx, cy, s); g.stroke();
  }
  const PRODUCT = (id) => PRODUCTS.find((p) => p.id === id) || PRODUCTS[0];
  const euro = (n) => n.toFixed(2).replace(".", ",") + " €";

  const TW = 1024, TH = 640; // texture d'une page
  function newCanvas(w, h) { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; }

  // Version « plan » : traits blancs sur bleu transparent
  function bpTexture(kind, i) {
    const c = newCanvas(TW, TH), g = c.getContext("2d"), r = rng(100 + i);
    g.fillStyle = "rgba(40,120,235,.22)"; g.fillRect(0, 0, TW, TH);
    g.strokeStyle = "rgba(220,235,255,.12)"; g.lineWidth = 1;
    for (let x = 32; x < TW; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, TH); g.stroke(); }
    for (let y = 32; y < TH; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(TW, y); g.stroke(); }
    g.strokeStyle = CHALK; g.lineCap = g.lineJoin = "round";
    const line = (x1, y1, x2, y2, lw = 3) => { // trait doublé, légèrement tremblé
      g.lineWidth = lw;
      for (const k of [0, 1]) { g.globalAlpha = k ? 0.45 : 0.95; g.beginPath(); g.moveTo(x1 + k * 1.5, y1 + (r() - 0.5) * 2); g.lineTo(x2 + k * 1.5, y2 + (r() - 0.5) * 2); g.stroke(); }
      g.globalAlpha = 1;
    };
    const box = (x, y, w, h, lw = 3, cross = false) => {
      line(x - 4, y, x + w + 4, y, lw); line(x + w, y - 4, x + w, y + h + 4, lw); line(x + w + 4, y + h, x - 4, y + h, lw); line(x, y + h + 4, x, y - 4, lw);
      if (cross) { g.globalAlpha = 0.6; line(x, y, x + w, y + h, 2); line(x + w, y, x, y + h, 2); g.globalAlpha = 1; }
    };
    const bars = (x, y, w, n, gap = 22, lw = 6) => { for (let k = 0; k < n; k++) line(x, y + k * gap, x + w * (k === n - 1 ? 0.6 : 1 - r() * 0.15), y + k * gap, lw); };
    const hand = (s, x, y, size, align = "left", alpha = 1) => txt(s, x, y, { kind: "hand", size, align, color: CHALK, alpha }, g);
    // Barre de navigation
    g.beginPath(); g.arc(46, 38, 18, 0, TAU); g.lineWidth = 3; g.stroke();
    hand("LOGO", 76, 40, 18);
    for (let k = 0; k < 5; k++) box(520 + k * 86, 28, 66, 20, 2);
    line(0, 76, TW, 76, 2);

    if (kind === 0) { // Hero
      hand("Un mot d'ordre :", 60, 200, 48);
      hand("GAGNER.", 60, 285, 92);
      bars(64, 370, 360, 3, 24, 5);
      box(64, 470, 230, 56, 3); hand("CTA", 179, 500, 26, "center");
      box(600, 120, 360, 420, 3, true); hand("visuel", 780, 560, 22, "center", 0.8);
    } else if (kind === 1) { // Collections
      g.lineWidth = 4; jerseyPath(g, 290, 350, 210); g.stroke();
      g.globalAlpha = 0.5; g.lineWidth = 2; for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(130, 330 + k * 60); g.lineTo(290, 380 + k * 60); g.lineTo(450, 330 + k * 60); g.stroke(); } g.globalAlpha = 1;
      hand("DOMICILE 2026", 560, 190, 50);
      bars(562, 250, 360, 2, 26, 5);
      for (let k = 0; k < 4; k++) { line(560, 330 + k * 46, 960, 330 + k * 46, 2); hand(["Tissu", "Coupe", "Flocage", "Tailles"][k], 566, 312 + k * 46, 20); }
      hand("59,90 €", 560, 550, 44);
    } else if (kind === 2) { // Histoire
      hand("Une histoire qui ne fait", 512, 170, 44, "center");
      hand("que commencer", 512, 230, 56, "center");
      [["6", "joueurs"], ["42", "tournois"], ["12", "podiums"], ["15K", "followers"]].forEach(([n, l], k) => {
        const x = 70 + k * 228; box(x, 330, 200, 200, 3);
        hand(n, x + 100, 410, 78, "center"); hand(l, x + 100, 490, 24, "center");
      });
    } else if (kind === 3) { // Roster
      hand("Le roster", 512, 150, 56, "center");
      for (let k = 0; k < 6; k++) {
        const x = 52 + k * 158; box(x, 220, 134, 300, 3);
        g.lineWidth = 3; g.beginPath(); g.arc(x + 67, 320, 34, 0, TAU); g.stroke();
        g.beginPath(); g.arc(x + 67, 430, 60, Math.PI * 1.08, Math.PI * 1.92); g.stroke();
        line(x + 18, 470, x + 116, 470, 5); line(x + 30, 494, x + 104, 494, 3);
      }
      hand("x6", 960, 580, 30, "right");
    } else { // Boutique
      hand("Boutique", 60, 140, 56);
      for (let k = 0; k < 4; k++) box(330 + k * 150, 122, 130, 34, 2);
      for (let k = 0; k < 3; k++) {
        const x = 60 + k * 310; box(x, 196, 280, 400, 3);
        g.lineWidth = 3; jerseyPath(g, x + 140, 330, 95); g.stroke();
        line(x + 24, 470, x + 220, 470, 5); hand("€€,€€", x + 24, 512, 30);
        box(x + 24, 540, 232, 36, 2); hand("Ajouter", x + 140, 558, 20, "center");
      }
    }
    // Cadre + cartouche de la page
    box(6, 6, TW - 12, TH - 12, 4);
    hand(`0${i + 1} — ${TEXTS.sections[i]}`, TW - 30, TH - 34, 26, "right");
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
    return tex;
  }

  // Version « réelle » : le rendu final du site (violet / noir)
  function realTexture(kind) {
    const c = newCanvas(TW, TH), g = c.getContext("2d");
    g.fillStyle = "#07030f"; g.fillRect(0, 0, TW, TH);
    const gr = g.createRadialGradient(TW * 0.7, TH * 0.4, 0, TW * 0.7, TH * 0.4, TW * 0.7);
    gr.addColorStop(0, "rgba(120,45,230,.45)"); gr.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = gr; g.fillRect(0, 0, TW, TH);
    const T = (s, x, y, o) => txt(s, x, y, o, g);
    // Navigation
    g.fillStyle = "rgba(255,255,255,.04)"; g.fillRect(0, 0, TW, 76);
    g.drawImage(logo, 26, 18, 40, 40 * logo.naturalHeight / logo.naturalWidth);
    T("WARMUP ESPORT", 78, 39, { kind: "ui", weight: 800, size: 18, align: "left", ls: 2 });
    ["ACCUEIL", "JOUEURS", "BOUTIQUE", "FAQ"].forEach((l, k) => T(l, 520 + k * 96, 39, { kind: "ui", weight: 700, size: 14, align: "left", ls: 2, color: k === (kind === 4 ? 2 : kind === 3 ? 1 : 0) ? "#fff" : "rgba(255,255,255,.6)" }));
    g.fillStyle = VIOLET; g.beginPath(); g.roundRect(900, 22, 100, 34, 17); g.fill();
    T("PANIER", 950, 40, { kind: "ui", weight: 800, size: 14, ls: 2 });
    g.fillStyle = "rgba(176,124,255,.35)"; g.fillRect(0, 75, TW, 1);

    if (kind === 0) {
      g.globalAlpha = 0.16; g.drawImage(logo, 560, 110, 440, 440 * logo.naturalHeight / logo.naturalWidth); g.globalAlpha = 1;
      T("UN MOT D'ORDRE :", 60, 215, { size: 66, align: "left" });
      T("GAGNER.", 56, 320, { size: 150, align: "left", color: VIOLET, glow: "rgba(139,61,255,.9)", glowSize: 30 });
      T("Équipe esport française · Valorant · Depuis 2024", 62, 420, { kind: "ui", weight: 400, size: 20, align: "left", color: "rgba(255,255,255,.75)" });
      g.fillStyle = VIOLET; g.beginPath(); g.roundRect(60, 470, 270, 58, 29); g.fill();
      T("DÉCOUVRIR L'ÉQUIPE", 195, 500, { kind: "ui", weight: 800, size: 16, ls: 2 });
      g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = 2; g.beginPath(); g.roundRect(350, 470, 190, 58, 29); g.stroke();
      T("BOUTIQUE", 445, 500, { kind: "ui", weight: 800, size: 16, ls: 2 });
    } else if (kind === 1) {
      const d = PRODUCT("home-26");
      const sp = g.createRadialGradient(290, 360, 0, 290, 360, 260); sp.addColorStop(0, "rgba(176,124,255,.5)"); sp.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = sp; g.fillRect(0, 80, 600, 560);
      jersey2D(g, 290, 360, 205, d.design);
      T("COLLECTION 2026", 560, 160, { kind: "ui", weight: 800, size: 16, align: "left", ls: 5, color: VIOLET2 });
      T("DOMICILE 2026", 556, 222, { size: 76, align: "left" });
      T("Né pour la compétition", 560, 278, { kind: "ui", weight: 400, size: 22, align: "left", color: "rgba(255,255,255,.75)" });
      Object.entries(COLLECTIONS[0].specs).forEach(([k, v], j) => {
        g.fillStyle = "rgba(176,124,255,.25)"; g.fillRect(560, 340 + j * 46, 400, 1);
        T(k.toUpperCase(), 560, 322 + j * 46, { kind: "ui", weight: 700, size: 14, align: "left", ls: 2, color: "rgba(255,255,255,.55)" });
        T(v, 960, 322 + j * 46, { kind: "ui", weight: 700, size: 16, align: "right" });
      });
      T(euro(d.price), 556, 560, { size: 56, align: "left", color: VIOLET2 });
    } else if (kind === 2) {
      T("UNE HISTOIRE QUI NE FAIT QUE", 512, 165, { size: 54 });
      T("COMMENCER", 512, 240, { size: 96, color: VIOLET, glow: "rgba(139,61,255,.8)", glowSize: 24 });
      [["6", "JOUEURS"], ["42", "TOURNOIS"], ["12", "PODIUMS"], ["15K", "FOLLOWERS"]].forEach(([n, l], k) => {
        const x = 70 + k * 228;
        g.fillStyle = "rgba(25,12,48,.9)"; g.beginPath(); g.roundRect(x, 320, 200, 210, 14); g.fill();
        g.strokeStyle = "rgba(176,124,255,.45)"; g.lineWidth = 2; g.stroke();
        T(n, x + 100, 405, { size: 100 });
        T(l, x + 100, 488, { kind: "ui", weight: 800, size: 16, ls: 4, color: VIOLET2 });
      });
    } else if (kind === 3) {
      T("LE ", 430, 140, { size: 66 }); T("ROSTER", 560, 140, { size: 66, color: VIOLET });
      PLAYERS.slice(0, 6).forEach((p, k) => {
        const x = 52 + k * 158, y = 210;
        const cg = g.createLinearGradient(0, y, 0, y + 320); cg.addColorStop(0, "#2a1258"); cg.addColorStop(1, "#0c0618");
        g.fillStyle = cg; g.beginPath(); g.roundRect(x, y, 134, 320, 12); g.fill();
        g.strokeStyle = "rgba(176,124,255,.5)"; g.lineWidth = 2; g.stroke();
        T(String(p.number), x + 124, y + 34, { size: 44, align: "right", fill: false, stroke: 2, strokeColor: "rgba(176,124,255,.8)" });
        g.fillStyle = "rgba(176,124,255,.55)"; g.beginPath(); g.arc(x + 67, y + 110, 32, 0, TAU); g.fill();
        g.beginPath(); g.ellipse(x + 67, y + 212, 56, 58, 0, Math.PI, TAU); g.fill();
        T(p.pseudo, x + 67, y + 252, { size: 34 });
        T(p.role.split(" · ")[0].toUpperCase(), x + 67, y + 290, { kind: "ui", weight: 700, size: 11, ls: 2, color: "rgba(255,255,255,.65)" });
      });
    } else {
      T("BOUTIQUE", 56, 140, { size: 66, align: "left" });
      ["TOUS", "MAILLOTS", "LIMITÉS", "ENFANT"].forEach((l, k) => {
        const x = 330 + k * 150; g.fillStyle = k ? "rgba(255,255,255,.06)" : VIOLET; g.beginPath(); g.roundRect(x, 122, 130, 36, 18); g.fill();
        T(l, x + 65, 141, { kind: "ui", weight: 800, size: 13, ls: 2 });
      });
      ["home-26", "away-26", "neon-ltd"].forEach((id, k) => {
        const p = PRODUCT(id), x = 60 + k * 310;
        g.fillStyle = "#120a22"; g.beginPath(); g.roundRect(x, 196, 280, 404, 16); g.fill();
        g.strokeStyle = "rgba(176,124,255,.3)"; g.lineWidth = 2; g.stroke();
        jersey2D(g, x + 140, 330, 95, p.design);
        if (p.tag) { g.fillStyle = k === 2 ? "#ff4fd8" : VIOLET; g.beginPath(); g.roundRect(x + 16, 212, 90, 28, 14); g.fill(); T(p.tag.toUpperCase(), x + 61, 227, { kind: "ui", weight: 800, size: 12, ls: 2 }); }
        T(p.name.replace(" — Édition limitée", ""), x + 24, 470, { kind: "ui", weight: 700, size: 17, align: "left" });
        T(euro(p.price), x + 24, 512, { size: 36, align: "left", color: VIOLET2 });
        g.fillStyle = "rgba(139,61,255,.22)"; g.beginPath(); g.roundRect(x + 24, 540, 232, 40, 20); g.fill();
        T("AJOUTER AU PANIER", x + 140, 561, { kind: "ui", weight: 800, size: 13, ls: 2 });
      });
    }
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
    return tex;
  }

  // Carte joueur (roster 3D)
  function cardTexture(p) {
    const c = newCanvas(512, 720), g = c.getContext("2d"), T = (s, x, y, o) => txt(s, x, y, o, g);
    const bg = g.createLinearGradient(0, 0, 0, 720); bg.addColorStop(0, "#3a167a"); bg.addColorStop(1, "#0a0516");
    g.fillStyle = bg; g.fillRect(0, 0, 512, 720);
    g.globalAlpha = 0.12; g.drawImage(logo, 56, 120, 400, 400 * logo.naturalHeight / logo.naturalWidth); g.globalAlpha = 1;
    T(String(p.number), 480, 92, { size: 150, align: "right", fill: false, stroke: 4, strokeColor: "rgba(176,124,255,.85)" });
    const sg = g.createLinearGradient(0, 200, 0, 560); sg.addColorStop(0, "#c9a6ff"); sg.addColorStop(1, "#5a22c0");
    g.fillStyle = sg; g.beginPath(); g.arc(256, 300, 92, 0, TAU); g.fill();
    g.beginPath(); g.ellipse(256, 580, 190, 175, 0, Math.PI, TAU); g.fill();
    g.fillStyle = "rgba(8,4,18,.92)"; g.fillRect(0, 540, 512, 180);
    g.fillStyle = VIOLET; g.fillRect(0, 540, 512, 6);
    T(p.pseudo, 256, 610, { size: 104 });
    T(p.role.toUpperCase(), 256, 680, { kind: "ui", weight: 800, size: 24, ls: 5, color: VIOLET2 });
    g.strokeStyle = VIOLET2; g.lineWidth = 8; g.strokeRect(4, 4, 504, 712);
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
    return tex;
  }

  // Texture de face du maillot 3D
  function jerseyTexture(d) {
    const S = 1024, c = newCanvas(S, S), g = c.getContext("2d");
    jerseyFill(g, 0, 0, S, S, d);
    const s = S / 2, lw = s * 0.3;
    g.drawImage(logo, s - lw / 2, s - s * 0.6, lw, lw * logo.naturalHeight / logo.naturalWidth);
    txt("WARMUP", s, s * 1.12, { size: 104, color: "#fff", ls: 4 }, g);
    g.strokeStyle = d.accent2; g.lineWidth = 26; // col
    g.beginPath(); g.moveTo(s - 0.3 * s, s - 0.92 * s); g.quadraticCurveTo(s, s - 0.6 * s, s + 0.3 * s, s - 0.92 * s); g.stroke();
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
    tex.repeat.set(0.5, 0.5); tex.offset.set(0.5, 0.5); // coordonnées de la forme (-1..1) → (0..1)
    return tex;
  }

  /* ==========================================================
     SCÈNE 3D (Three.js)
     ========================================================== */
  const PW = 3.2, PH = 2.0;
  let renderer, scene, camera, glc;
  const O = {}; // objets 3D
  const _v = new THREE.Vector3();

  function init3D() {
    glc = document.createElement("canvas");
    renderer = new THREE.WebGLRenderer({ canvas: glc, antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(1);
    renderer.setClearColor(0x000000, 0);
    renderer.localClippingEnabled = true;
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(40, 16 / 9, 0.1, 200);

    scene.add(new THREE.AmbientLight(0xffffff, 0.75));
    const key = new THREE.DirectionalLight(0xffffff, 2.4); key.position.set(3, 4, 6); scene.add(key);
    const rim = new THREE.DirectionalLight(0xb07cff, 2.2); rim.position.set(-4, 2, -3); scene.add(rim);
    const fill = new THREE.PointLight(0x8b3dff, 40, 0, 2); fill.position.set(-3, -1, 3); scene.add(fill);

    // Plans de coupe du scan « plan → réalité »
    O.clipReal = new THREE.Plane(new THREE.Vector3(-1, 0, 0), -100); // garde x ≤ c
    O.clipBp = new THREE.Plane(new THREE.Vector3(1, 0, 0), 100);     // garde x ≥ c

    // Pages du site
    const pageGeo = new THREE.PlaneGeometry(PW, PH), edgeGeo = new THREE.EdgesGeometry(pageGeo);
    O.stack = new THREE.Group(); scene.add(O.stack);
    O.pages = TEXTS.sections.map((_, i) => {
      const grp = new THREE.Group();
      const bp = new THREE.Mesh(pageGeo, new THREE.MeshBasicMaterial({ map: bpTexture(i, i), transparent: true, depthWrite: false, side: THREE.DoubleSide, clippingPlanes: [O.clipBp] }));
      const real = new THREE.Mesh(pageGeo, new THREE.MeshBasicMaterial({ map: realTexture(i), transparent: true, side: THREE.DoubleSide, clippingPlanes: [O.clipReal] }));
      real.position.z = 0.002;
      const edges = new THREE.LineSegments(edgeGeo, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true }));
      edges.position.z = 0.004;
      grp.add(bp, real, edges);
      O.stack.add(grp);
      return { grp, bp, real, edges };
    });
    // Pointillés de la vue éclatée
    O.dashes = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy]) => {
      const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(sx * PW / 2, sy * PH / 2, 0), new THREE.Vector3(sx * PW / 2, sy * PH / 2, -1)]);
      const l = new THREE.Line(geo, new THREE.LineDashedMaterial({ color: 0xe8f1ff, dashSize: 0.09, gapSize: 0.07, transparent: true }));
      O.stack.add(l);
      return { l, sx, sy };
    });

    // Maillot 3D (extrudé) qui sort de la page boutique
    const shape = new THREE.Shape();
    shape.moveTo(JERSEY[0][0], -JERSEY[0][1]);
    for (const [x, y] of JERSEY.slice(1)) shape.lineTo(x, -y);
    shape.quadraticCurveTo(0, 0.6, JERSEY[0][0], -JERSEY[0][1]);
    const jGeo = new THREE.ExtrudeGeometry(shape, { depth: 0.14, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.04, bevelSegments: 4, curveSegments: 16 });
    jGeo.translate(0, 0, -0.07);
    const d = PRODUCT("home-26").design;
    O.jersey = new THREE.Group();
    O.jerseyMesh = new THREE.Mesh(jGeo, [
      new THREE.MeshStandardMaterial({ map: jerseyTexture(d), roughness: 0.55, metalness: 0.05 }),
      new THREE.MeshStandardMaterial({ color: d.accent, roughness: 0.4, metalness: 0.1, emissive: 0x2a0b5c }),
    ]);
    O.jerseyWire = new THREE.LineSegments(new THREE.EdgesGeometry(jGeo, 25), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true }));
    O.jersey.add(O.jerseyMesh, O.jerseyWire);
    O.pages[4].grp.add(O.jersey);
    // Éclats projetés quand le maillot traverse la page
    const r = rng(42), debrisMat = new THREE.MeshStandardMaterial({ color: 0x8b3dff, emissive: 0x5a1fd0, emissiveIntensity: 0.8, roughness: 0.3, transparent: true });
    const debrisMat2 = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x9fc4ff, emissiveIntensity: 0.6, transparent: true });
    O.debris = Array.from({ length: 42 }, (_, k) => {
      const s = r() * 0.1 + 0.04, m = new THREE.Mesh(new THREE.BoxGeometry(s, s, s * 0.3), k % 3 ? debrisMat : debrisMat2);
      const a = r() * TAU, sp = r() * 0.8 + 0.5;
      m.userData = { dx: Math.cos(a) * sp * 2.2, dy: Math.sin(a) * sp * 1.6, dz: r() * 2.5 + 0.6, rx: r() * 12, ry: r() * 12 };
      O.pages[4].grp.add(m);
      return m;
    });
    O.debrisMats = [debrisMat, debrisMat2];

    // Roster : cartes en anneau
    O.ring = new THREE.Group(); scene.add(O.ring);
    const cardGeo = new THREE.PlaneGeometry(1.3, 1.83);
    O.cards = PLAYERS.slice(0, 6).map((p) => {
      const mat = new THREE.MeshBasicMaterial({ map: cardTexture(p) }), m = new THREE.Group();
      const back = new THREE.Mesh(cardGeo, mat); back.rotation.y = Math.PI; // dos de la carte : même visuel, pas en miroir
      m.add(new THREE.Mesh(cardGeo, mat), back);
      O.ring.add(m);
      return m;
    });

    // Logo en relief : couches empilées (effet extrudé)
    O.coin = new THREE.Group(); scene.add(O.coin);
    const ltex = new THREE.Texture(logo); ltex.needsUpdate = true; ltex.colorSpace = THREE.SRGBColorSpace; ltex.anisotropy = 8;
    const lw = 1.75, lh = lw * (logo.naturalHeight / logo.naturalWidth || 1), lgeo = new THREE.PlaneGeometry(lw, lh), N = 18;
    for (let k = 0; k < N; k++) {
      const front = k === N - 1, back = k === 0;
      const col = front || back ? new THREE.Color(0xffffff) : new THREE.Color().setHSL(0.73, 0.75, 0.2 + 0.35 * (k / N));
      const m = new THREE.Mesh(lgeo, new THREE.MeshBasicMaterial({ map: ltex, color: col, alphaTest: 0.35, side: THREE.DoubleSide }));
      m.position.z = lerp(-0.09, 0.09, k / (N - 1));
      O.coin.add(m);
    }
  }
  function resize3D() {
    if (!renderer) return;
    renderer.setSize(W, H, false);
    camera.aspect = W / H; camera.updateProjectionMatrix();
    DF = portrait ? 1.75 : 1; // en vertical, caméra plus loin pour que la 3D tienne dans la largeur
  }
  function setCam(tx, ty, tz, yaw, pitch, dist, roll = 0) {
    const d = dist * DF;
    camera.position.set(tx + d * Math.sin(yaw) * Math.cos(pitch), ty + d * Math.sin(pitch), tz + d * Math.cos(yaw) * Math.cos(pitch));
    camera.up.set(Math.sin(roll), Math.cos(roll), 0);
    camera.lookAt(tx, ty, tz);
  }
  function proj(obj, x, y, z) { // point 3D (repère de obj) → pixels à l'écran
    _v.set(x, y, z); obj.localToWorld(_v); _v.project(camera);
    return [(_v.x + 1) / 2 * W, (1 - _v.y) / 2 * H, _v.z];
  }

  // Écartement des pages (vue éclatée)
  const spacing = (t) => (t < 10.4 ? 1.15 * eOutBack(prog(t, 4.9, 5.6)) : lerp(1.15, 0.08, eInOut(prog(t, 10.4, 11.2))));
  const sweepC = (t) => (t < 11.4 ? -100 : t > 12.4 ? 100 : lerp(-2.0, 2.0, eInOut(prog(t, 11.4, 12.4))));
  function focusAt(t) { let f = 0; for (const ts of FOCUS_STEPS) f += eOutExpo(prog(t, ts, ts + 0.32)); return f; }

  // Place tous les objets 3D et la caméra pour l'instant t (fonction pure du temps)
  function updateWorld(t) {
    const inStack = t < 19.5, inRing = t >= 19.5 && t < 24.5, inCoin = t >= 24.5;
    O.stack.visible = inStack; O.ring.visible = inRing; O.coin.visible = inCoin;

    if (inStack) {
      const sp = spacing(t), cf = eInOut(prog(t, 12.5, 13.0)), focus = focusAt(t), c = sweepC(t);
      O.clipReal.constant = c; O.clipBp.constant = -c;
      O.pages.forEach((pg, i) => {
        const o = i - focus, s = clamp(o, -1, 1);
        const cx = s * 2.3 + (o - s) * 1.15, cz = -Math.abs(s) * 1.4 - Math.abs(o - s) * 0.3, ry = -s * 0.85;
        pg.grp.position.set(lerp(0, cx, cf), Math.sin(t * 1.3 + i * 1.7) * 0.05 * (1 - cf) * prog(t, 5, 6), lerp(-i * sp, cz, cf));
        pg.grp.rotation.y = lerp(0, ry, cf);
        const vis = i === 0 ? 1 : prog(t, 4.9, 5.15);
        pg.grp.visible = vis > 0;
        pg.bp.material.opacity = vis * (i === 0 ? prog(t, 3.0, 3.6) : 1) * (c > 50 ? 0 : 1);
        pg.real.material.opacity = vis;
        pg.edges.material.opacity = vis * (i === 0 ? prog(t, 2.9, 3.3) : 1) * (t > 12.4 ? 0.55 : 1);
        pg.edges.material.color.set(t > 12.4 ? 0xb07cff : 0xffffff);
      });
      const da = prog(t, 5.2, 5.7) * (1 - prog(t, 10.3, 10.6));
      O.dashes.forEach(({ l }) => {
        l.visible = da > 0;
        const pos = l.geometry.attributes.position; pos.setZ(1, -4 * sp); pos.needsUpdate = true;
        l.computeLineDistances(); l.material.opacity = da * 0.8;
      });

      // Maillot : plan filaire tracé sur la page, puis il en sort en 3D
      const jv = t >= 14.6;
      O.jersey.visible = jv;
      if (jv) {
        const pop = eOutExpo(prog(t, 15.4, 16.0));
        const spin = -(1 - eOutCubic(prog(t, 15.4, 16.3))) * TAU, idle = 0.55 * Math.sin((t - 16.3) * 1.25) * prog(t, 16.3, 17.2);
        O.jersey.position.set(0, 0.05 * Math.sin(t * 1.6) * pop, lerp(0.08, 1.45, pop));
        O.jersey.scale.setScalar(lerp(0.55, 1, pop));
        O.jersey.rotation.set(0.07 * Math.sin(t * 1.1) * pop, spin + idle, 0.04 * Math.sin(t * 0.9) * pop);
        O.jerseyMesh.visible = t >= 15.4;
        const n = O.jerseyWire.geometry.attributes.position.count;
        O.jerseyWire.geometry.setDrawRange(0, Math.floor(n * eSine(prog(t, 14.6, 15.35)) / 2) * 2);
        O.jerseyWire.material.opacity = 1 - prog(t, 15.5, 15.9);
        O.jerseyWire.visible = O.jerseyWire.material.opacity > 0;
      }
      const dp = prog(t, 15.4, 16.6), dv = t >= 15.4 && dp < 1;
      O.debris.forEach((m) => {
        m.visible = dv;
        if (!dv) return;
        const u = m.userData, e = eOutExpo(dp);
        m.position.set(u.dx * e, u.dy * e - dp * dp * 0.8, u.dz * e);
        m.rotation.set(u.rx * e, u.ry * e, 0);
        m.scale.setScalar(1 - prog(t, 16.0, 16.6));
      });

      // Caméra
      // Décalage de la pile pour laisser la place à la nomenclature (à droite en 16:9, en bas en 9:16)
      const TX = portrait ? 0 : 0.9, TY = portrait ? -1.3 : 0;
      if (t < 10.4) {
        const m = eInOut(prog(t, 3.8, 5.8)), o = eInOut(prog(t, 5.6, 10.4));
        setCam(TX * m, TY * m, -2 * sp * m, 0.7 * m - 1.3 * o + 0.03 * Math.sin(t * 0.7), 0.34 * m - 0.1 * o, lerp(5.0, 7.4, m) - 0.6 * o);
      } else if (t < 12.5) {
        const k = eInOut(prog(t, 10.4, 11.3));
        setCam(TX * (1 - k), TY * (1 - k), -2 * sp, lerp(-0.6, 0.12, k), lerp(0.24, 0.06, k), lerp(6.8, 4.5, k));
      } else if (t < 14.5) {
        const k = eInOut(prog(t, 12.5, 13.0));
        setCam(0, 0, lerp(-2 * sp, 0, k), lerp(0.12, 0, k) + 0.04 * Math.sin(t * 2), lerp(0.06, 0.04, k), lerp(4.5, 5.0, k));
      } else {
        const a = eInOut(prog(t, 14.5, 15.4)), b = eOutExpo(prog(t, 15.4, 16.2)), c2 = eInOut(prog(t, 15.6, 17.6)), d2 = eInOut(prog(t, 17.6, 19.5));
        setCam(0, 0.05, 0.7 * b, 0.42 * c2 - 0.25 * d2, 0.04 + 0.08 * c2, 5.0 - 0.8 * a + 1.3 * b - 0.3 * d2);
      }
    }

    if (inRing) {
      const ent = eOutExpo(prog(t, 19.5, 20.2)), R = lerp(10, 3.4, ent), hb = eInOut(prog(t, 22, 22.6));
      let rot = -0.5;
      for (const b of [20.1, 20.6, 21.1, 21.6]) rot += eOutExpo(prog(t, b, b + 0.3)) * TAU / 6;
      rot += Math.max(0, t - 22) * 1.7;
      O.cards.forEach((m, i) => {
        const a = i * TAU / 6 + rot;
        m.position.set(R * Math.sin(a), (i - 2.5) * 0.55 * hb + 0.06 * Math.sin(t * 2 + i), R * Math.cos(a));
        m.rotation.set(0, a, 0.12 * hb * Math.sin(i));
      });
      const k = eInOut(prog(t, 22, 24.5));
      setCam(0, 0.1, 0, 0.15 * Math.sin(t * 0.8) + 0.8 * k, lerp(0.16, 0.7, k), lerp(8.4, 2.6, k), 0.35 * k);
    }

    if (inCoin) {
      const k = eOutExpo(prog(t, 24.6, 25.6)), y0 = portrait ? 0.8 : 0.62;
      O.coin.position.set(0, y0 + 0.04 * Math.sin(t * 1.5) * prog(t, 25.6, 26.4), lerp(-30, 0, k));
      O.coin.rotation.set((1 - k) * 0.6, (1 - k) * TAU * 2 + 0.38 * Math.sin((t - 25.6) * 1.3) * prog(t, 25.6, 26.4), 0);
      setCam(0, 0, 0, 0.02 * Math.sin(t * 0.6), 0, lerp(4.9, 4.4, eSine(prog(t, 24.5, 30))));
    }
    scene.updateMatrixWorld(true);
    camera.updateMatrixWorld();
  }

  // Rendu 3D composé sur le canvas 2D, avec échos optionnels (traînées de mouvement)
  function render3D(t, echoes = 0, dt = 0.04, echoAlpha = 0.35) {
    for (let k = echoes; k >= 1; k--) {
      updateWorld(Math.max(0, t - k * dt));
      renderer.render(scene, camera);
      ctx.save(); ctx.globalAlpha = echoAlpha * (1 - k / (echoes + 1)); ctx.drawImage(glc, 0, 0); ctx.restore();
    }
    updateWorld(t);
    renderer.render(scene, camera);
    ctx.drawImage(glc, 0, 0);
  }

  /* ==========================================================
     HABILLAGE COMMUN
     ========================================================== */
  // Cartouche de plan technique (en bas à droite)
  function cartouche(t, t0, alpha = 1) {
    if (t < t0 || alpha <= 0) return;
    const w = (portrait ? 620 : 560) * U, h = 168 * U, m = 50 * U;
    const x = portrait ? (W - w) / 2 : W - m - w, y = H - m - h - (portrait ? 40 * U : 0);
    ctx.save(); ctx.globalAlpha *= alpha;
    const lines = [...rectLines(x, y, w, h, 31), wob(x, y + h * 0.4, x + w, y + h * 0.4, 35, 0.01), wob(x + w * 0.5, y + h * 0.4, x + w * 0.5, y + h, 36, 0.01), wob(x, y + h * 0.7, x + w, y + h * 0.7, 37, 0.01)];
    stroke(lines, t0, t0 + 0.9, { width: 2.4, pencil: false });
    const tp = prog(t, t0 + 0.5, t0 + 1.2);
    if (tp > 0) {
      ctx.globalAlpha *= tp;
      txt(TEXTS.name, x + 22 * U, y + h * 0.2, { size: 46 * U, align: "left", color: CHALK });
      txt(TEXTS.hud, x + w - 22 * U, y + h * 0.2, { kind: "ui", weight: 700, size: 15 * U, align: "right", ls: 3 * U, color: "rgba(244,248,255,.7)" });
      TEXTS.cartouche.forEach(([k, v], i) => {
        const cx = x + (i % 2) * w * 0.5 + 22 * U, cy = y + h * (i < 2 ? 0.55 : 0.85);
        txt(k, cx, cy, { kind: "ui", weight: 700, size: 13 * U, align: "left", ls: 3 * U, color: "rgba(244,248,255,.55)" });
        txt(v, cx + 110 * U, cy, { kind: "hand", size: 26 * U, align: "left", color: CHALK });
      });
    }
    ctx.restore();
  }
  function hud(t) {
    const a = prog(t, 0.8, 1.4) * (1 - prog(t, 29.0, 29.5));
    if (a <= 0) return;
    const m = 40 * U, l = 46 * U;
    ctx.save();
    ctx.globalAlpha = a * 0.7; ctx.strokeStyle = CHALK; ctx.lineWidth = 2 * U;
    [[m, m, 1, 1], [W - m, m, -1, 1], [m, H - m, 1, -1], [W - m, H - m, -1, -1]].forEach(([x, y, sx, sy]) => {
      ctx.beginPath(); ctx.moveTo(x, y + l * sy); ctx.lineTo(x, y); ctx.lineTo(x + l * sx, y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + 14 * U * sx, y + 22 * U * sy); ctx.lineTo(x + 30 * U * sx, y + 22 * U * sy); ctx.moveTo(x + 22 * U * sx, y + 14 * U * sy); ctx.lineTo(x + 22 * U * sx, y + 30 * U * sy); ctx.stroke(); // repère de visée
    });
    ctx.restore();
    txt(TEXTS.hud, m + 64 * U, m + 22 * U, { kind: "ui", weight: 800, size: 20 * U, ls: 5 * U, align: "left", alpha: a * 0.85, color: CHALK });
    const s = Math.floor(t), f = Math.floor((t % 1) * 30);
    txt(`REV. 00:${String(s).padStart(2, "0")}:${String(f).padStart(2, "0")}`, W - m - 64 * U, m + 22 * U, { kind: "ui", weight: 700, size: 20 * U, ls: 3 * U, align: "right", alpha: a * 0.85, color: CHALK });
  }
  // Gribouillis à la craie qui recouvre puis découvre l'écran
  const scribbleCache = {};
  function scribble(t) {
    for (const [c, color] of WIPES) {
      const p = prog(t, c - 0.3, c + 0.3);
      if (p <= 0 || p >= 1) continue;
      const key = W + "x" + H;
      if (!scribbleCache[key]) {
        const N = portrait ? 11 : 15, span = (W + 500 * U) / N, sl = 220 * U, pts = [];
        for (let k = 0; k <= N; k++) pts.push([-250 * U + k * span + (k % 2 ? sl : -sl), k % 2 ? H + 120 * U : -120 * U]);
        const L = [0]; for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
        scribbleCache[key] = { pts, L, lw: span * 1.75 };
      }
      const { pts, L, lw } = scribbleCache[key], total = L[L.length - 1];
      const d0 = p < 0.5 ? 0 : eInOut((p - 0.5) * 2) * total, d1 = p < 0.5 ? eInOut(p * 2) * total : total;
      ctx.save();
      ctx.strokeStyle = color; ctx.lineCap = ctx.lineJoin = "round";
      ctx.lineWidth = lw; ctx.beginPath(); partialPath(pts, L, d0, d1); ctx.stroke();
      ctx.globalAlpha = 0.25; ctx.strokeStyle = color === CHALK || color === "#f4f8ff" ? "#a9c6ff" : "#ffffff"; ctx.lineWidth = lw * 0.08;
      ctx.translate(lw * 0.3, 0); ctx.beginPath(); partialPath(pts, L, d0, d1); ctx.stroke();
      ctx.restore();
    }
  }
  function overlays(t) {
    const v = ctx.createRadialGradient(W / 2, H / 2, minD * 0.42, W / 2, H / 2, diag / 2);
    v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(0,0,0,.55)");
    ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
    grainPattern ||= ctx.createPattern(grainTile, "repeat");
    const r = rng(Math.floor(t * 24));
    ctx.save();
    ctx.globalAlpha = 0.06; ctx.translate(-r() * 220, -r() * 220);
    ctx.fillStyle = grainPattern; ctx.fillRect(0, 0, W + 220, H + 220);
    ctx.restore();
    flash(1 - prog(t, 0, 0.45), "0,0,0");   // ouverture
    flash(prog(t, 29.4, 30), "0,0,0");      // fondu au noir final
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

  /* ==========================================================
     SCÈNES
     ========================================================== */

  // 1 → 4 · Le plan, la vue éclatée, le scan, la boutique (0 → 19,5 s)
  function sPlan(t) {
    updateWorld(t);
    // Fond : blueprint, puis le violet du site gagne l'écran derrière le scan
    if (t < 12.4) blueprint(t, prog(t, 0.2, 1.4));
    if (t >= 11.4) {
      const xs = t < 12.4 ? proj(scene, sweepC(t), 0, 0)[0] : W + 100;
      ctx.save(); ctx.beginPath(); ctx.rect(-60, -60, xs + 60, H + 120); ctx.clip(); warmupBg(t); ctx.restore();
    }

    render3D(t, t > 12.5 && t < 14.5 ? 2 : 0, 0.03, 0.3);
    const p0 = O.pages[0].grp;

    // — Scène 1 : le croquis du site
    if (t < 3.6) {
      const tl = proj(p0, -PW / 2, PH / 2, 0), br = proj(p0, PW / 2, -PH / 2, 0);
      const x = tl[0], y = tl[1], w = br[0] - tl[0], h = br[1] - tl[1], a = 1 - prog(t, 3.0, 3.5);
      ctx.save(); ctx.globalAlpha = a;
      const lines = [...rectLines(x, y, w, h, 3), wob(x, y + h * 0.12, x + w, y + h * 0.12, 9, 0.01),
        ellipseLine(x + w * 0.035, y + h * 0.06, 9 * U, 9 * U, 1, 1, 0), ellipseLine(x + w * 0.065, y + h * 0.06, 9 * U, 9 * U, 2, 1, 0), ellipseLine(x + w * 0.095, y + h * 0.06, 9 * U, 9 * U, 3, 1, 0)];
      stroke(lines, 0.8, 2.3, { width: 3.4, seed: 3 });
      // Cotes : largeur du site
      const dy = y - 40 * U;
      stroke([wob(x, dy, x + w, dy, 12, 0), wob(x, dy - 14 * U, x, dy + 14 * U, 13, 0), wob(x + w, dy - 14 * U, x + w, dy + 14 * U, 14, 0)], 2.3, 2.6, { width: 2, pencil: false });
      if (t > 2.45) txt("1920 px", x + w / 2, dy, { kind: "hand", size: 26 * U, color: CHALK, alpha: prog(t, 2.45, 2.7), glow: "#0d4297", glowSize: 0 });
      ctx.restore();
    }
    if (t < 5.2) {
      const a = 1 - prog(t, 4.6, 5.0);
      const tl = proj(p0, -PW / 2, PH / 2, 0), bl = proj(p0, -PW / 2, -PH / 2, 0);
      const x = portrait ? W / 2 : tl[0], align = portrait ? "center" : "left", y = portrait ? tl[1] - 210 * U : bl[1] + 105 * U;
      txt(TEXTS.s1Small, x, y - 50 * U, { kind: "ui", weight: 800, size: 22 * U, ls: 8 * U, align, color: GOLD, alpha: prog(t, 2.2, 2.5) * a });
      handWrite(TEXTS.s1, x, y + 8 * U, 2.4, 3.5, { size: (portrait ? 54 : 52) * U, align, alpha: a, seed: 21 });
    }
    cartouche(t, 1.2, 1 - prog(t, 10.3, 10.7));

    // — Scène 2 : vue éclatée annotée
    if (t > 5.3 && t < 10.7) {
      const fa = 1 - prog(t, 10.2, 10.6);
      ctx.save(); ctx.globalAlpha = fa;
      // Nomenclature en colonne, reliée au coin de chaque page par une ligne de rappel
      O.pages.forEach((pg, i) => {
        const t0 = 5.5 + i * 0.45, c = proj(pg.grp, PW / 2, PH / 2, 0);
        const lx = portrait ? W * 0.12 : W * 0.75, ly = portrait ? H * 0.635 + i * H * 0.045 : H * 0.22 + i * H * 0.105;
        const ex = portrait ? lx - 24 * U : lx - 20 * U;
        stroke([wob(c[0], c[1], ex, ly, 50 + i, 0)], t0, t0 + 0.2, { width: 2, pencil: false, alpha: 0.8 });
        ctx.fillStyle = CHALK; if (t > t0) { ctx.beginPath(); ctx.arc(c[0], c[1], 5 * U, 0, TAU); ctx.fill(); }
        handWrite(`0${i + 1} — ${TEXTS.sections[i]}`, lx, ly, t0 + 0.15, t0 + 0.5, { size: (portrait ? 32 : 36) * U, seed: 60 + i, glow: "rgba(4,25,70,.9)", glowSize: 10 * U });
        if (!portrait) txt(TEXTS.notes[i], lx + 2 * U, ly + 36 * U, { kind: "hand", size: 23 * U, align: "left", color: "rgba(255,211,107,.9)", alpha: prog(t, t0 + 0.45, t0 + 0.7) });
      });
      // Cote le long de la pile
      const a0 = proj(O.pages[0].grp, -PW / 2, -PH / 2, 0), a4 = proj(O.pages[4].grp, -PW / 2, -PH / 2, 0);
      const off = 50 * U, dx = a4[0] - a0[0], dy = a4[1] - a0[1], len = Math.hypot(dx, dy) || 1, nx = dy / len * off, ny = -dx / len * off;
      const b0 = [a0[0] - nx, a0[1] - ny], b4 = [a4[0] - nx, a4[1] - ny];
      stroke([...arrowLines((b0[0] + b4[0]) / 2, (b0[1] + b4[1]) / 2, b0[0], b0[1], 70), ...arrowLines((b0[0] + b4[0]) / 2, (b0[1] + b4[1]) / 2, b4[0], b4[1], 71)], 7.9, 8.4, { width: 2.4, pencil: false });
      if (t > 8.3) {
        ctx.save(); ctx.translate((b0[0] + b4[0]) / 2 - nx * 0.6, (b0[1] + b4[1]) / 2 - ny * 0.6);
        let ang = Math.atan2(dy, dx); if (ang > Math.PI / 2) ang -= Math.PI; if (ang < -Math.PI / 2) ang += Math.PI;
        ctx.rotate(ang);
        txt(TEXTS.count, 0, 0, { kind: "hand", size: 30 * U, color: GOLD, alpha: prog(t, 8.3, 8.6) });
        ctx.restore();
      }
      // Titre manuscrit
      const hx = portrait ? W / 2 : 90 * U, al = portrait ? "center" : "left", hy = portrait ? H * 0.12 : H * 0.14;
      TEXTS.s2.forEach((l, k) => handWrite(l, hx, hy + k * (portrait ? 80 : 84) * U, 6.1 + k * 0.75, 6.8 + k * 0.75, { size: (portrait ? 62 : 70) * U, align: al, seed: 80 + k, color: k ? GOLD : CHALK }));
      ctx.restore();
    }

    // — Scène 3 : du plan à la réalité
    if (t > 10.7 && t < 13.0) {
      const fa = 1 - prog(t, 12.7, 13.0);
      ctx.save(); ctx.globalAlpha = fa;
      handWrite(TEXTS.fromPlan, portrait ? W / 2 : W * 0.08, portrait ? H * 0.2 : H * 0.15, 10.8, 11.5, { size: (portrait ? 96 : 92) * U, align: portrait ? "center" : "left", seed: 90 });
      ctx.restore();
      if (t >= 11.4 && t < 12.45) { // ligne de scan lumineuse
        const c = sweepC(t), top = proj(scene, c, PH / 2 + 0.25, 0.02), bot = proj(scene, c, -PH / 2 - 0.25, 0.02);
        ctx.save();
        ctx.strokeStyle = "#fff"; ctx.lineWidth = 5 * U; ctx.shadowColor = VIOLET2; ctx.shadowBlur = 40 * U;
        ctx.beginPath(); ctx.moveTo(top[0], top[1]); ctx.lineTo(bot[0], bot[1]); ctx.stroke(); ctx.stroke();
        ctx.globalCompositeOperation = "lighter";
        const r = rng(Math.floor(t * 30));
        for (let k = 0; k < 26; k++) {
          const f = r(), x = lerp(top[0], bot[0], f) + (r() - 0.2) * 60 * U, y = lerp(top[1], bot[1], f);
          ctx.fillStyle = r() > 0.5 ? GOLD : VIOLET2; ctx.beginPath(); ctx.arc(x, y, (r() * 3 + 1) * U, 0, TAU); ctx.fill();
        }
        ctx.restore();
      }
    }
    if (t > 12.3 && t < 13.0) marker(TEXTS.toReal, portrait ? W / 2 : W * 0.93, portrait ? H * 0.8 : H * 0.86, (portrait ? 120 : 130) * U, 12.3, { align: portrait ? "center" : "right", rot: -0.06, alpha: 1 - prog(t, 12.75, 13.0) });
    flash(0.75 * (t >= 12.3 ? 1 - prog(t, 12.3, 12.6) : 0), "190,150,255");

    // — Défilement des pages du site
    if (t > 12.8 && t < 14.7) {
      const f = focusAt(t), idx = clamp(Math.round(f), 0, 4), d = f - idx, a = prog(t, 12.8, 13.0) * (1 - prog(t, 14.45, 14.7)) * (1 - Math.abs(d) * 1.6);
      const y = portrait ? H * 0.78 : H * 0.86;
      txt(`0${idx + 1} / 05`, W / 2, y - 80 * U - d * 40 * U, { kind: "ui", weight: 800, size: 22 * U, ls: 8 * U, color: VIOLET2, alpha: a });
      txt(TEXTS.sections[idx], W / 2, y - d * 70 * U, { size: (portrait ? 120 : 110) * U, alpha: a, glow: "rgba(139,61,255,.8)", glowSize: 30 * U });
    }

    // — Scène 4 : la boutique, le maillot sort de l'écran
    if (t > 14.6) {
      const fa = 1 - prog(t, 19.0, 19.3);
      // Le crayon suit le tracé 3D du maillot
      if (t < 15.35) {
        const pos = O.jerseyWire.geometry.attributes.position, n = O.jerseyWire.geometry.drawRange.count;
        if (n > 1) {
          const i = n - 1, tip = proj(O.jersey, pos.getX(i), pos.getY(i), pos.getZ(i));
          sparkles((ts) => { const k = Math.max(1, Math.floor(pos.count * eSine(prog(ts, 14.6, 15.35)) / 2) * 2) - 1; return proj(O.jersey, pos.getX(k), pos.getY(k), pos.getZ(k)); }, 14.6, 15.35, 99);
          pencil(tip[0], tip[1]);
        }
      }
      const jc = proj(O.jersey, 0, 0, 0);
      const sh = 1 - prog(t, 15.4, 15.9); // traits d'action à l'impact
      if (t >= 15.4 && sh > 0) {
        const r = rng(5);
        ctx.save(); ctx.strokeStyle = CHALK; ctx.lineCap = "round"; ctx.lineWidth = 5 * U; ctx.globalAlpha = sh; ctx.shadowColor = "#9fc4ff"; ctx.shadowBlur = 14 * U;
        for (let k = 0; k < 16; k++) {
          const a = k / 16 * TAU + r() * 0.2, r0 = minD * (0.22 + eOutExpo(1 - sh) * 0.25), r1 = r0 + minD * (0.06 + r() * 0.08);
          ctx.beginPath(); ctx.moveTo(jc[0] + Math.cos(a) * r0, jc[1] + Math.sin(a) * r0); ctx.lineTo(jc[0] + Math.cos(a) * r1, jc[1] + Math.sin(a) * r1); ctx.stroke();
        }
        ctx.restore();
      }
      ring(jc[0], jc[1], minD * 0.1 + eOutExpo(prog(t, 15.4, 16.3)) * diag * 0.5, 22 * U * (1 - prog(t, 15.4, 16.3)) + 2 * U, t >= 15.4 ? 1 - prog(t, 15.4, 16.3) : 0, "190,150,255");
      flash(0.8 * (t >= 15.4 ? 1 - prog(t, 15.4, 15.75) : 0));

      ctx.save(); ctx.globalAlpha = fa;
      slam(TEXTS.shop, portrait ? W / 2 : 90 * U, portrait ? H * 0.14 : H * 0.17, (portrait ? 150 : 140) * U, 15.5, { align: portrait ? "center" : "left", glow: "rgba(139,61,255,.9)", glowSize: 40 * U });
      txt("BOUTIQUE OFFICIELLE", portrait ? W / 2 : 96 * U, (portrait ? H * 0.14 : H * 0.17) - 90 * U, { kind: "ui", weight: 800, size: 22 * U, ls: 8 * U, align: portrait ? "center" : "left", color: VIOLET2, alpha: prog(t, 15.7, 16.0) });
      // Nom du maillot + flèche vers le maillot
      const nx = portrait ? W * 0.08 : Math.max(90 * U, jc[0] - W * 0.4), ny = portrait ? H * 0.27 : jc[1] - H * 0.06;
      handWrite(TEXTS.jersey, nx, ny, 16.0, 16.6, { size: (portrait ? 44 : 46) * U, seed: 110 });
      const nw = measure(TEXTS.jersey, (portrait ? 44 : 46) * U, { kind: "hand" });
      stroke(arrowLines(nx + nw * (portrait ? 0.7 : 0.85), ny + 34 * U, jc[0] - minD * (portrait ? 0.05 : 0.17), jc[1] - minD * (portrait ? 0.2 : 0.06), 120), 16.55, 16.9, { width: 3 });
      // Prix au feutre, entouré au crayon
      const px = portrait ? W * 0.72 : Math.min(W - 230 * U, jc[0] + W * 0.27), py = portrait ? H * 0.69 : jc[1] + H * 0.14;
      marker(TEXTS.price, px, py, (portrait ? 96 : 92) * U, 16.95, { rot: -0.08 });
      const pw = measure(TEXTS.price, (portrait ? 96 : 92) * U, { kind: "marker" });
      stroke([ellipseLine(px, py, pw * 0.66, 78 * U, 130)], 17.15, 17.7, { width: 3.2, seed: 131 });
      // Atouts
      const lx = portrait ? W * 0.08 : Math.max(90 * U, jc[0] - W * 0.42), lyy = portrait ? H * 0.79 : jc[1] + H * 0.2;
      TEXTS.shopNotes.forEach((s, k) => {
        const y = lyy + k * 58 * U, t0 = 17.6 + k * 0.5;
        stroke([[[lx, y], [lx + 10 * U, y + 12 * U], [lx + 30 * U, y - 16 * U]]], t0, t0 + 0.15, { width: 4, pencil: false, color: GOLD });
        handWrite(s, lx + 48 * U, y, t0 + 0.1, t0 + 0.55, { size: 36 * U, seed: 140 + k });
      });
      ctx.restore();
    }
  }

  // 5 · Le roster, ambiance gameplay (19,5 → 24,5 s)
  function sRoster(t) {
    const A = t < 22;
    // Fond : bleu glacier + blocs orange façon constructions, puis tunnel gris
    if (A) {
      const g = ctx.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, "#bff3ff"); g.addColorStop(0.5, "#45b8f0"); g.addColorStop(1, "#0b5fae");
      ctx.fillStyle = g; ctx.fillRect(-60, -60, W + 120, H + 120);
      const r = rng(3);
      for (let k = 0; k < 14; k++) {
        const sz = (r() * 160 + 90) * U, sp = r() * 0.6 + 0.4, x = ((r() * (W + 600 * U) - (t - 19.5) * 900 * U * sp) % (W + 600 * U) + W + 600 * U) % (W + 600 * U) - 300 * U, y = r() * H;
        ctx.save(); ctx.translate(x, y); ctx.transform(1, 0, -0.35, 1, 0, 0);
        ctx.fillStyle = k % 3 ? "rgba(255,122,28,.9)" : "rgba(160,70,20,.85)"; ctx.fillRect(-sz / 2, -sz * 0.3, sz, sz * 0.6);
        ctx.strokeStyle = "rgba(255,210,170,.6)"; ctx.lineWidth = 3 * U; ctx.strokeRect(-sz / 2, -sz * 0.3, sz, sz * 0.6);
        ctx.restore();
      }
    } else {
      ctx.fillStyle = "#5a5a5a"; ctx.fillRect(-60, -60, W + 120, H + 120);
      const r = rng(9), z = (t - 22) * 1.6;
      ctx.save(); ctx.strokeStyle = "rgba(235,235,235,.5)";
      for (let k = 0; k < 40; k++) { // lignes de vitesse
        const a = r() * TAU, f = ((r() + z) % 1), r0 = diag * 0.05 + f * diag * 0.5, r1 = r0 + diag * 0.12 * f;
        ctx.lineWidth = (1 + f * 6) * U; ctx.beginPath(); ctx.moveTo(W / 2 + Math.cos(a) * r0, H / 2 + Math.sin(a) * r0); ctx.lineTo(W / 2 + Math.cos(a) * r1, H / 2 + Math.sin(a) * r1); ctx.stroke();
      }
      for (let k = 0; k < 18; k++) { // dalles qui défilent
        const f = ((k / 18 + z * 0.5) % 1), s = lerp(0.05, 1.4, f * f) * minD, a = k * 2.4;
        ctx.globalAlpha = 0.35 * f; ctx.fillStyle = k % 2 ? "#9a9a9a" : "#2c2c2c";
        ctx.fillRect(W / 2 + Math.cos(a) * s * 0.8 - s * 0.2, H / 2 + Math.sin(a) * s * 0.5 - s * 0.12, s * 0.4, s * 0.24);
      }
      ctx.restore();
    }

    render3D(t, A ? 3 : 6, A ? 0.03 : 0.05, A ? 0.45 : 0.55);

    if (A) {
      ctx.save(); ctx.globalCompositeOperation = "overlay"; ctx.globalAlpha = 0.35; ctx.fillStyle = "#39c8ff"; ctx.fillRect(0, 0, W, H); ctx.restore();
      const y = portrait ? H * 0.16 : H * 0.8, x = portrait ? W / 2 : 90 * U, al = portrait ? "center" : "left";
      slam(TEXTS.roster, x, y, (portrait ? 170 : 160) * U, 19.75, { align: al, stroke: 4 * U, strokeColor: "#0b2a6b", echo: "rgba(255,122,28,.9)" });
      handWrite(TEXTS.rosterNote, portrait ? W / 2 : x + 6 * U, y + (portrait ? 110 : 100) * U, 20.2, 21.0, { size: 46 * U, align: al, color: "#fff", glow: "rgba(0,40,120,.8)", seed: 160 });
      flash(0.5 * (1 - prog(t, 19.5, 19.8)));
    } else {
      ctx.save(); ctx.globalCompositeOperation = "saturation"; ctx.fillStyle = "#808080"; ctx.fillRect(0, 0, W, H); ctx.restore(); // noir & blanc
      ctx.save(); ctx.globalCompositeOperation = "soft-light"; ctx.globalAlpha = 0.6; ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H); ctx.restore(); // contraste
      const cx = W / 2, cy = portrait ? H * 0.5 : H * 0.48, size = (portrait ? 118 : 210) * U;
      const jit = t < 22.4 ? 1 : 0.3, r = rng(Math.floor(t * 20));
      marker(TEXTS.onTop, cx + (r() - 0.5) * 8 * U * jit, cy + (r() - 0.5) * 8 * U * jit, size, 22.05, { rot: -0.07 });
      const w = measure(TEXTS.onTop, size, { kind: "marker" });
      stroke([wob(cx - w * 0.48, cy + size * 0.62, cx + w * 0.5, cy + size * 0.5, 170, 0.02), wob(cx - w * 0.4, cy + size * 0.74, cx + w * 0.36, cy + size * 0.64, 171, 0.02)], 22.35, 22.8, { width: 7, color: RED, glowColor: "rgba(255,30,50,.9)", glowSize: 20, pencil: false });
      flash(0.8 * (t >= 22 ? 1 - prog(t, 22, 22.25) : 0));
    }
  }

  // 6 · Logo 3D, URL et tampon « EN LIGNE » (24,5 → 30 s)
  let stampCanvas = null;
  function makeStamp() { // tampon encreur, avec manques d'encre
    const s = TEXTS.stamp, size = 120, w = measure(s, size, { ui: true, kind: "ui", weight: 800, ls: 10 }) + 120, h = 200;
    const c = newCanvas(Math.ceil(w), h), g = c.getContext("2d");
    g.strokeStyle = RED; g.lineWidth = 12; g.beginPath(); g.roundRect(8, 8, w - 16, h - 16, 26); g.stroke();
    g.lineWidth = 4; g.beginPath(); g.roundRect(26, 26, w - 52, h - 52, 16); g.stroke();
    txt(s, w / 2, h / 2 + 6, { kind: "ui", weight: 800, size, ls: 10, color: RED }, g);
    g.globalCompositeOperation = "destination-out";
    const r = rng(77);
    for (let k = 0; k < 900; k++) { g.globalAlpha = r() * 0.8; g.beginPath(); g.arc(r() * w, r() * h, r() * 3.5 + 0.5, 0, TAU); g.fill(); }
    stampCanvas = c;
  }
  function sOutro(t) {
    blueprint(t, 1);
    updateWorld(t);
    const c = proj(O.coin, 0, 0, 0), land = prog(t, 25.6, 26.4);
    const gl = ctx.createRadialGradient(c[0], c[1], 0, c[0], c[1], minD * 0.45); // halo derrière le logo
    gl.addColorStop(0, `rgba(176,124,255,${0.55 * prog(t, 25.3, 25.8)})`); gl.addColorStop(1, "rgba(176,124,255,0)");
    ctx.fillStyle = gl; ctx.fillRect(0, 0, W, H);
    render3D(t, t < 25.7 ? 3 : 0, 0.03, 0.4);
    ring(c[0], c[1], minD * 0.2 + eOutExpo(land) * diag * 0.55, 26 * U * (1 - land) + 2 * U, t >= 25.6 ? 1 - land : 0);
    flash(0.7 * (t >= 25.6 ? 1 - prog(t, 25.6, 25.9) : 0));

    const bottom = proj(O.coin, 0, -0.95, 0)[1];
    const ny = bottom + (portrait ? 100 : 95) * U, S = (portrait ? 122 : 150) * U;
    // Nom : lettres qui tombent
    if (t > 25.8) {
      const letters = [...TEXTS.name], gap = S * 0.02, ws = letters.map((l) => measure(l, S));
      let x = W / 2 - (ws.reduce((a, b) => a + b, 0) + gap * (letters.length - 1)) / 2;
      letters.forEach((l, i) => {
        const p = prog(t, 25.8 + i * 0.035, 26.25 + i * 0.035);
        txt(l, x + ws[i] / 2, ny - (1 - eOutBack(p)) * 120 * U, { size: S, alpha: prog(t, 25.8 + i * 0.035, 25.95 + i * 0.035), color: i >= 7 ? VIOLET2 : CHALK, glow: i >= 7 ? "rgba(139,61,255,.9)" : null, glowSize: 30 * U });
        x += ws[i] + gap;
      });
    }
    handWrite(TEXTS.tagline, W / 2, ny + (portrait ? 110 : 105) * U, 26.3, 27.1, { size: (portrait ? 56 : 54) * U, align: "center", color: GOLD, seed: 190 });
    // URL entourée au crayon
    const uy = ny + (portrait ? 215 : 195) * U, us = (portrait ? 58 : 52) * U, uw = measure(TEXTS.url, us, { kind: "ui", weight: 800, ls: 3 * U });
    const up = eOutCubic(prog(t, 27.0, 27.35));
    txt(TEXTS.url, W / 2, uy + (1 - up) * 20 * U, { kind: "ui", weight: 800, size: us, ls: 3 * U, alpha: up, color: "#fff" });
    stroke([ellipseLine(W / 2, uy, uw * 0.62 + 30 * U, us * 0.95, 200)], 27.2, 27.85, { width: 3.4, seed: 201 });
    // Tampon
    if (t >= 27.9) {
      stampCanvas || makeStamp();
      const p = eOutExpo(prog(t, 27.9, 28.12)), sw = (portrait ? 430 : 400) * U, sh = sw * stampCanvas.height / stampCanvas.width;
      const sx = portrait ? W * 0.5 : W * 0.79, sy = portrait ? uy + 210 * U : H * 0.3;
      ctx.save(); ctx.translate(sx, sy); ctx.rotate(-0.2); ctx.scale(lerp(2.6, 1, p), lerp(2.6, 1, p));
      ctx.globalAlpha = prog(t, 27.9, 27.98) * 0.92;
      ctx.drawImage(stampCanvas, -sw / 2, -sh / 2, sw, sh);
      ctx.restore();
    }
  }

  function draw(t) {
    t_ = t;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
    ctx.save();
    const [sx, sy] = shake(t);
    ctx.translate(sx, sy);
    if (t < 19.5) sPlan(t);
    else if (t < 24.5) sRoster(t);
    else sOutro(t);
    ctx.restore();
    hud(t);
    scribble(t);
    overlays(t);
  }

  /* ==========================================================
     SON : musique et bruitages générés en direct (WebAudio)
     ========================================================== */
  const EVENTS = [["pad", 0.4, 29.4], ["tap", 0.4, 1],
    ["pencil", 0.8, 1.5], ["pencil", 2.4, 1.1], ["pencil", 5.6, 2.2], ["pencil", 6.1, 1.5], ["pencil", 7.9, 0.5],
    ["riser", 4.3, 0.6], ["impact", 4.95, 0.6],
    ["pencil", 10.8, 0.7], ["riser", 11.4, 0.9], ["impact", 12.3, 1.2],
    ["pencil", 14.6, 0.75], ["riser", 14.8, 0.6], ["impact", 15.4, 1.3], ["pencil", 16.0, 0.9], ["pencil", 17.15, 0.55], ["pencil", 17.7, 1.0],
    ["whoosh", 19.2, 0.6], ["impact", 19.5, 0.6], ["pencil", 20.2, 0.8],
    ["riser", 21.4, 0.6], ["impact", 22.0, 1.0],
    ["whoosh", 24.2, 0.6], ["riser", 24.6, 1.0], ["impact", 25.6, 1.2], ["pencil", 26.3, 0.8], ["pencil", 27.2, 0.65], ["impact", 27.9, 0.7], ["tap", 27.9, 2]];
  for (let b = 5.0; b < 19.4; b += 0.5) EVENTS.push(["kick", b], ["hat", b + 0.25]);
  for (let b = 19.5; b < 24.4; b += 0.5) EVENTS.push(["kick", b], ["hat", b + 0.25], ["hat", b + 0.125, 0.5], ["hat", b + 0.375, 0.5]);
  for (let b = 25.6; b < 29.2; b += 0.5) EVENTS.push(["kick", b], ["hat", b + 0.25]);
  for (const ts of FOCUS_STEPS) EVENTS.push(["whoosh", ts - 0.05, 0.3], ["blip", ts + 0.05, 1]);
  for (const b of [20.1, 20.6, 21.1, 21.6]) EVENTS.push(["whoosh", b - 0.05, 0.3]);

  const Sound = {
    ac: null, master: null, dest: null, bus: null, noise: null, muted: false,
    init() {
      if (this.ac) return;
      const ac = (this.ac = new (window.AudioContext || window.webkitAudioContext)());
      this.master = ac.createGain(); this.master.gain.value = 0.8;
      const comp = ac.createDynamicsCompressor();
      this.master.connect(comp); comp.connect(ac.destination);
      this.dest = ac.createMediaStreamDestination(); comp.connect(this.dest);
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
    hat(when, vol = 1) {
      const f = this.ac.createBiquadFilter(); f.type = "highpass"; f.frequency.value = 7500;
      this.noiseSrc(when, 0.06).connect(f); f.connect(this.env(when, 0.18 * vol, 0.002, 0.05));
    },
    blip(when, vol = 1) {
      const o = this.ac.createOscillator(); o.type = "square";
      o.frequency.setValueAtTime(1800, when); o.frequency.exponentialRampToValueAtTime(900, when + 0.05);
      o.connect(this.env(when, 0.12 * vol, 0.002, 0.05)); o.start(when); o.stop(when + 0.08);
    },
    tap(when, vol = 1) { // petit « toc » de crayon / tampon
      const o = this.ac.createOscillator(); o.type = "triangle";
      o.frequency.setValueAtTime(vol > 1 ? 160 : 900, when); o.frequency.exponentialRampToValueAtTime(vol > 1 ? 50 : 300, when + 0.08);
      o.connect(this.env(when, 0.35 * vol, 0.002, 0.12)); o.start(when); o.stop(when + 0.2);
    },
    pencil(when, dur) { // grattement de mine sur le papier
      const f = this.ac.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = 3200; f.Q.value = 1.1;
      const g = this.ac.createGain();
      g.gain.setValueAtTime(0.0001, when); g.gain.exponentialRampToValueAtTime(0.12, when + 0.04);
      g.gain.setValueAtTime(0.12, when + Math.max(0.05, dur - 0.06)); g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
      const lfo = this.ac.createOscillator(), lg = this.ac.createGain();
      lfo.frequency.value = 11; lg.gain.value = 0.07; lfo.connect(lg); lg.connect(g.gain); lfo.start(when); lfo.stop(when + dur + 0.05);
      this.noiseSrc(when, dur + 0.05).connect(f); f.connect(g); g.connect(this.bus);
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
    pad(when, end) { // nappe d'accords en fond
      const f = this.ac.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 700;
      const g = this.ac.createGain();
      g.gain.setValueAtTime(0.0001, when); g.gain.exponentialRampToValueAtTime(0.06, when + 1.2);
      g.gain.setValueAtTime(0.06, Math.max(when + 1.2, end - 1.2)); g.gain.exponentialRampToValueAtTime(0.0001, end);
      f.connect(g); g.connect(this.bus);
      [110, 138.6, 164.8, 220.5].forEach((hz) => {
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
  let playing = false, cur = 0, startT = 0, startPerf = 0, rendering = false, ready = false;

  function setFormat(f) {
    portrait = f === "9x16";
    cvs.width = portrait ? 1080 : 1920; cvs.height = portrait ? 1920 : 1080;
    W = cvs.width; H = cvs.height; minD = Math.min(W, H); diag = Math.hypot(W, H); U = minD / 1080;
    paperPattern = grainPattern = null;
    resize3D();
    document.querySelectorAll(".seg button").forEach((b) => b.classList.toggle("on", b.dataset.f === f));
  }
  setFormat("16x9");

  function play(from = cur) {
    if (from >= DUR - 0.05) from = 0;
    cur = startT = from; startPerf = performance.now(); playing = true;
    Sound.start(from);
    bigPlay.classList.add("hidden");
    playBtn.textContent = "❚❚";
  }
  function pause() { playing = false; Sound.stop(); playBtn.textContent = "▶"; }
  function loop() {
    if (!rendering && ready) {
      if (playing) {
        cur = startT + (performance.now() - startPerf) / 1000;
        if (cur >= DUR) { cur = DUR; pause(); }
      }
      draw(Math.min(cur, DUR - 0.001));
      scrub.value = cur;
      timeEl.textContent = `${cur.toFixed(1)} / ${DUR.toFixed(1)} s`;
    }
    requestAnimationFrame(loop);
  }

  playBtn.onclick = () => (playing ? pause() : play(bigPlay.classList.contains("hidden") ? cur : 0));
  bigPlay.onclick = () => play(0);
  $("#restart").onclick = () => play(0);
  scrub.oninput = () => { if (rendering) return; pause(); cur = +scrub.value; };
  addEventListener("keydown", (e) => { if (e.code === "Space" && !rendering) { e.preventDefault(); playing ? pause() : play(); } });
  $("#sound").onclick = (e) => { Sound.setMuted(!Sound.muted); e.target.textContent = Sound.muted ? "🔇 Muet" : "🔊 Son"; };
  document.querySelectorAll(".seg button").forEach((b) => (b.onclick = () => { if (!rendering) setFormat(b.dataset.f); }));

  // Export MP4 image par image (WebCodecs) : aucune image perdue
  const FPS = 30;
  const tick = () => new Promise((r) => { const ch = new MessageChannel(); ch.port1.onmessage = r; ch.port2.postMessage(0); });
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
    venc.configure({ codec: "avc1.640032", width: W, height: H, bitrate: 16_000_000, framerate: FPS });
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
        const px = ctx.getImageData(0, 0, W, H).data;
        const frame = new VideoFrame(px, { format: "RGBA", codedWidth: W, codedHeight: H, timestamp: Math.round(i * 1e6 / FPS), duration: Math.round(1e6 / FPS) });
        venc.encode(frame, { keyFrame: i % (FPS * 2) === 0 }); frame.close();
        while (venc.encodeQueueSize > 8) await tick();
        if (i % 10 === 0) { onProgress(i / total); await tick(); }
      }
      await venc.flush(); await aenc.flush();
      if (error) throw error;
      muxer.finalize();
      return new Blob([muxer.target.buffer], { type: "video/mp4" });
    } finally { rendering = false; }
  }
  window.renderMP4 = renderMP4;
  window.motionSeek = (t) => { pause(); cur = t; draw(t); }; // aperçu d'un instant précis (console)

  exportBtn.onclick = async () => {
    if (rendering || !ready) return;
    if (!(window.VideoEncoder && window.AudioEncoder && window.Mp4Muxer)) { status.textContent = "Ton navigateur ne permet pas l'export MP4 : utilise Chrome ou Edge (à jour)."; return; }
    pause();
    try {
      const blob = await renderMP4((p) => { exportBtn.textContent = `● Rendu… ${Math.round(p * 100)} %`; });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob); a.download = `warmup-esport-blueprint-${portrait ? "9x16" : "16x9"}.mp4`; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
      status.textContent = `Vidéo exportée (MP4, ${(blob.size / 1e6).toFixed(1)} Mo) : elle est dans tes téléchargements.`;
    } catch (e) { status.textContent = "Échec de l'export : " + e.message; }
    exportBtn.textContent = "⬇ Exporter la vidéo";
  };

  /* ---------- Démarrage ---------- */
  Promise.all([
    document.fonts.load(`italic 800 100px 'Barlow Condensed'`), document.fonts.load(`800 40px Barlow`), document.fonts.load(`700 40px Barlow`),
    document.fonts.load(`400 40px Barlow`), document.fonts.load(`40px 'Architects Daughter'`), document.fonts.load(`40px 'Permanent Marker'`), logoReady,
  ]).finally(() => {
    try {
      init3D(); resize3D();
      for (const w of [3.5, 8, 12, 13.5, 16, 21, 23, 25.5]) draw(w); // préchauffe les shaders et textures : pas d'à-coup à la lecture
      ready = true; cur = 16.8; // image d'aperçu : le maillot sorti de l'écran
    }
    catch (e) { status.textContent = "Impossible de lancer la 3D (WebGL) : " + e.message; }
    requestAnimationFrame(loop);
  });
})();
