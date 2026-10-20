/* ==========================================================
   WARMUP ESPORT — Hero « plongée dans le logo »
   Un canvas piloté par le scroll : on approche du logo, on le traverse
   par le vide au centre du « A », puis on en ressort de l'autre côté.
   ========================================================== */

(() => {
  const runway = $("#hero-runway");
  if (!runway) return;
  const canvas = $("#hero-canvas"), ctx = canvas.getContext("2d");
  const stages = $$(".hero-stage"), steps = $$(".hud-steps span"), bar = $(".hud-bar i"), hint = $(".hud-hint");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mobile = matchMedia("(max-width: 768px)").matches;

  const FOCUS = { x: 0.5, y: 0.445 }; // point vide au centre du logo, par lequel on passe
  const PASS = 0.6;                   // moment du scroll où l'on traverse le logo
  let W = 0, H = 0, DPR = 1, cur = 0, prev = 0, stage = 0, time = 0, last = performance.now();

  /* ---------- Outils ---------- */
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
  const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const mix = (a, b, t) => `rgb(${hex(a).map((v, i) => Math.round(lerp(v, hex(b)[i], t))).join(",")})`;

  /* ---------- Logo pré-rendu avec halo violet ---------- */
  const logo = new Image();
  let glow = null, ratio = 1, padRel = 0;
  logo.onload = () => {
    ratio = logo.naturalHeight / logo.naturalWidth;
    const S = 1024, pad = 180;
    glow = document.createElement("canvas");
    glow.width = S + pad * 2; glow.height = S * ratio + pad * 2;
    const g = glow.getContext("2d");
    g.shadowColor = "rgba(139,61,255,.95)"; g.shadowBlur = 70;
    g.drawImage(logo, pad, pad, S, S * ratio);
    g.shadowColor = "rgba(176,124,255,.9)"; g.shadowBlur = 22;
    g.drawImage(logo, pad, pad, S, S * ratio);
    padRel = pad / S;
  };
  logo.src = "assets/logo.png";

  /* N'envoie au GPU que la partie de l'image comprise dans le carré visible [-R, R]
     (repère local du logo) — indispensable quand le logo est zoomé x60 */
  function drawCropped(img, dx, dy, dw, dh, R) {
    const x0 = Math.max(-R, dx), y0 = Math.max(-R, dy), x1 = Math.min(R, dx + dw), y1 = Math.min(R, dy + dh);
    if (x1 <= x0 || y1 <= y0) return;
    const sx = (x0 - dx) / dw * img.width, sy = (y0 - dy) / dh * img.height;
    const sw = (x1 - x0) / dw * img.width, sh = (y1 - y0) / dh * img.height;
    if (sw < 0.5 || sh < 0.5) return;
    ctx.drawImage(img, sx, sy, sw, sh, x0, y0, x1 - x0, y1 - y0);
  }

  /* ---------- Champ d'étoiles en profondeur ---------- */
  const stars = Array.from({ length: mobile ? 180 : 420 }, () => newStar(Math.random()));
  function newStar(z) {
    return { x: Math.random() * 2 - 1, y: Math.random() * 2 - 1, z, c: Math.random() < 0.72 ? "176,124,255" : "255,255,255" };
  }

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.width = canvas.offsetWidth * DPR;
    H = canvas.height = canvas.offsetHeight * DPR;
  }
  resize();
  addEventListener("resize", resize, { passive: true });

  /* ---------- Où est le logo selon la progression ---------- */
  function logoState(p) {
    if (p < 0.3) { // approche
      const t = smooth(0, 0.3, p);
      return { scale: 0.82 + 0.18 * t, focus: 0, alpha: 1, rot: 0 };
    }
    if (p < PASS) { // on fonce dedans
      const t = (p - 0.3) / (PASS - 0.3);
      const scale = Math.exp(Math.log(70) * Math.pow(t, 1.7));
      return { scale, focus: clamp(t * 2.5), alpha: 1 - smooth(14, 45, scale), rot: 0 };
    }
    // on ressort de l'autre côté
    const t = smooth(PASS, 0.95, p);
    const scale = Math.exp(Math.log(60) * Math.pow(1 - t, 1.6));
    return { scale, focus: 1 - t, alpha: 1 - smooth(14, 40, scale), rot: (1 - t) * -0.35 };
  }

  /* ---------- Rendu ---------- */
  function draw(p, speed) {
    const cx = W / 2, cy = H / 2;
    const after = smooth(PASS - 0.02, PASS + 0.06, p); // 0 avant la traversée, 1 après

    // Fond : violet profond, puis magenta de l'autre côté
    const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.hypot(cx, cy));
    bg.addColorStop(0, mix("#1d0b3a", "#3d0b52", after));
    bg.addColorStop(0.55, mix("#08030f", "#12031a", after));
    bg.addColorStop(1, "#020104");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    // Étoiles : simples points au repos, traînées de lumière quand on accélère
    const f = Math.max(W, H) * 0.5;
    ctx.lineCap = "round";
    for (const s of stars) {
      const pz = s.z;
      s.z -= speed;
      if (s.z <= 0.02) { Object.assign(s, newStar(1)); continue; }
      const x1 = cx + (s.x / pz) * f, y1 = cy + (s.y / pz) * f;
      const x2 = cx + (s.x / s.z) * f, y2 = cy + (s.y / s.z) * f;
      if (x2 < -50 || x2 > W + 50 || y2 < -50 || y2 > H + 50) { Object.assign(s, newStar(1)); continue; }
      const a = clamp(1 - s.z) * 0.9;
      ctx.strokeStyle = `rgba(${s.c},${a})`;
      ctx.lineWidth = (1 - s.z) * 2.4 * DPR + 0.4;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2 + 0.1, y2); ctx.stroke();
    }

    // Ondes de l'autre côté
    if (after > 0) {
      const maxR = Math.hypot(cx, cy);
      for (let i = 0; i < 4; i++) {
        const k = (time * 0.12 + i / 4) % 1;
        ctx.strokeStyle = `rgba(255,141,232,${(1 - k) * 0.35 * after})`;
        ctx.lineWidth = 1.5 * DPR;
        ctx.beginPath(); ctx.arc(cx, cy, k * maxR, 0, Math.PI * 2); ctx.stroke();
      }
    }

    // Logo
    if (glow) {
      const st = logoState(p);
      if (st.alpha > 0.01) {
        const base = Math.min(W, H) * (mobile ? 0.62 : 0.44);
        const L = base * st.scale, Lh = L * ratio;
        const ax = lerp(0.5, FOCUS.x, st.focus), ay = lerp(0.5, FOCUS.y, st.focus);
        const bob = Math.sin(time * 1.6) * 10 * DPR * (1 - st.focus);
        const pulse = 1 + Math.sin(time * 2.2) * 0.012 * (1 - st.focus);
        // Au repos, le logo se décale pour laisser la place au texte (en bas à droite sur grand écran, en bas sur mobile)
        const rest = 1 - st.focus, wide = W / DPR > 992;
        const ox = cx - (wide ? W * 0.14 : 0) * rest, oy = cy - (wide ? H * 0.05 : H * 0.16) * rest + bob;
        ctx.save();
        ctx.globalAlpha = st.alpha;
        ctx.translate(ox, oy); ctx.rotate(st.rot); ctx.scale(pulse, pulse);
        const lx = -ax * L, ly = -ay * Lh;
        const R = Math.max(Math.hypot(ox, oy), Math.hypot(W - ox, oy), Math.hypot(ox, H - oy), Math.hypot(W - ox, H - oy)) / pulse;
        drawCropped(glow, lx - padRel * L, ly - padRel * L, L * (1 + 2 * padRel), Lh + 2 * padRel * L, R);
        ctx.restore();
      }
    }

    // Flash au moment de la traversée
    const flash = Math.exp(-Math.pow((p - PASS) / 0.035, 2));
    if (flash > 0.01) {
      const fl = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.hypot(cx, cy));
      fl.addColorStop(0, `rgba(255,255,255,${flash * 0.95})`);
      fl.addColorStop(0.35, `rgba(176,124,255,${flash * 0.7})`);
      fl.addColorStop(1, `rgba(139,61,255,${flash * 0.25})`);
      ctx.fillStyle = fl; ctx.fillRect(0, 0, W, H);
    }

    // Léger vignettage pour la lisibilité du texte
    const v = ctx.createRadialGradient(cx, cy, Math.min(W, H) * 0.35, cx, cy, Math.hypot(cx, cy));
    v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(0,0,0,.55)");
    ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  }

  /* ---------- Textes & HUD ---------- */
  function setStage(i) {
    if (i === stage) return;
    stage = i;
    stages.forEach((s, k) => s.classList.toggle("active", k === i));
    steps.forEach((s, k) => s.classList.toggle("on", k === i));
  }

  /* ---------- Boucle ---------- */
  function tick(now) {
    const dt = Math.min(3, (now - last) / 16.67); last = now; time += dt / 60;
    const r = runway.getBoundingClientRect();
    const target = clamp(-r.top / (r.height - innerHeight));
    cur = reduced ? target : cur + (target - cur) * 0.085; // amortissement

    if (r.bottom > 0 && r.top < innerHeight) {
      const dp = Math.abs(cur - prev);
      const warp = Math.exp(-Math.pow((cur - (PASS - 0.04)) / 0.1, 2)) * 0.035;
      const speed = reduced ? 0 : (0.0012 + dp * 5 + warp) * dt;
      draw(cur, speed);
    }
    prev = cur;

    setStage(cur < 0.33 ? 0 : cur < 0.67 ? 1 : 2);
    bar.style.width = (15 + 85 * cur).toFixed(1) + "%";
    hint.classList.toggle("gone", cur > 0.03);
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
