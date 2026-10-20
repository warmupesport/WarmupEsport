/* ==========================================================
   WARMUP ESPORT — Tunnel de commande : livraison, paiement, confirmation
   ========================================================== */

(() => {
  const subtotal = () => cart.reduce((a, c) => a + c.price * c.qty, 0);
  const thumb = (id) => { const p = PRODUCTS.find((x) => x.id === id); return p ? (p.image ? `<img src="${p.image}" alt="">` : jerseySVG(p.design)) : ""; };

  /* ==========================================================
     PAGE PAIEMENT
     ========================================================== */
  function initCheckout() {
    const user = Auth.user();
    if (!user) { location.replace("compte.html?next=checkout"); return; }
    if (!cart.length) { $("#empty").hidden = false; return; }
    $("#checkout").hidden = false;

    let mode = user.address?.mode || "relay", relay = null, shipping = null;

    /* ---- Récapitulatif ---- */
    function renderSummary() {
      const sub = subtotal(), ship = shippingCost(mode, sub), left = SHOP.freeShippingFrom - sub;
      $("#sum-items").innerHTML = cart.map((c) => `
        <div class="sum-item">
          <div class="thumb">${thumb(c.id)}<span class="qty-badge">${c.qty}</span></div>
          <div><b>${c.name}</b><small>Taille ${c.size}${c.flock ? " · Flocage " + c.flock : ""}</small></div>
          <span class="p">${euro(c.price * c.qty)}</span>
        </div>`).join("");
      $("#sum-sub").textContent = euro(sub);
      $("#sum-ship").textContent = ship ? euro(ship) : "Offerte";
      $("#sum-total").textContent = euro(sub + ship);
      $("#pay-btn").innerHTML = `🔒 Payer ${euro(sub + ship)}`;
      $("#free-ship").innerHTML = left > 0
        ? `Plus que <b>${euro(left)}</b> pour la livraison offerte !<div class="bar"><i style="width:${(sub / SHOP.freeShippingFrom) * 100}%"></i></div>`
        : "🎉 Livraison offerte !";
    }

    /* ---- Étape 1 : livraison ---- */
    $("#s-first").value = user.firstName; $("#s-last").value = user.lastName; $("#s-phone").value = user.phone || "";
    $("#s-country").innerHTML = SHOP.countries.map((c) => `<option>${c}</option>`).join("");
    if (user.address?.mode === "home") {
      const a = user.address;
      $("#s-addr").value = a.line1; $("#s-addr2").value = a.line2 || ""; $("#s-zip").value = a.zip; $("#s-city").value = a.city; $("#s-country").value = a.country;
    }
    $("#ship-modes").innerHTML = SHOP.shipping.map((m) => `
      <label class="choice"><input type="radio" name="mode" value="${m.id}" ${m.id === mode ? "checked" : ""}>
        <span class="ico">${m.id === "relay" ? "📦" : "🏠"}</span>
        <span><b>${m.label}</b><small>${m.carrier} · ${m.delay}</small></span>
        <span class="price" data-mode="${m.id}"></span>
      </label>`).join("");
    const refreshModes = () => {
      $("#home-fields").hidden = mode !== "home";
      $("#relay-fields").hidden = mode !== "relay";
      $$("#ship-modes .price").forEach((el) => { const c = shippingCost(el.dataset.mode, subtotal()); el.textContent = c ? euro(c) : "Offerte"; });
      renderSummary();
    };
    $$("#ship-modes input").forEach((r) => (r.onchange = () => { mode = r.value; refreshModes(); }));
    refreshModes();

    // Points relais : en démo, 3 points fictifs proches du code postal saisi.
    // À la mise en ligne : widget officiel Mondial Relay (carte + vrais points).
    $("#find-relay").onclick = () => {
      const zip = $("#r-zip").value.trim(), city = $("#r-city").value.trim();
      if (!/^\d{4,5}$/.test(zip) || !city) { $("#ship-error").textContent = "Indique un code postal et une ville pour trouver un point relais."; return; }
      $("#ship-error").textContent = "";
      const C = city.charAt(0).toUpperCase() + city.slice(1);
      const points = [
        { id: "R1", name: "Tabac Presse du Centre", street: "12 place de la Mairie", dist: "350 m", hours: "Lun–Sam 7h–20h" },
        { id: "R2", name: "Supérette Express", street: "48 avenue de la République", dist: "800 m", hours: "Lun–Dim 8h–22h" },
        { id: "R3", name: "Pressing de la Gare", street: "3 rue de la Gare", dist: "1,2 km", hours: "Mar–Sam 9h–19h" },
      ].map((p) => ({ ...p, zip, city: C }));
      $("#relays").innerHTML = `<span class="hint">Points relais de démonstration</span>` + points.map((p, i) => `
        <label class="choice"><input type="radio" name="relay" value="${i}">
          <span class="ico">📍</span>
          <span><b>${p.name}</b><small>${p.street}, ${p.zip} ${p.city}</small><small>${p.hours}</small></span>
          <span class="hint" style="margin-left:auto">${p.dist}</span>
        </label>`).join("");
      $$("#relays input").forEach((r) => (r.onchange = () => { relay = points[+r.value]; }));
    };

    $("#ship-form").onsubmit = (e) => {
      e.preventDefault();
      const err = $("#ship-error"); err.textContent = "";
      const first = $("#s-first").value.trim(), last = $("#s-last").value.trim(), phone = $("#s-phone").value.trim();
      if (!first || !last) { err.textContent = "Indique ton prénom et ton nom."; return; }
      if (!/^[0-9 +().-]{9,}$/.test(phone)) { err.textContent = "Indique un numéro de téléphone valide."; return; }
      let address;
      if (mode === "home") {
        address = { mode, line1: $("#s-addr").value.trim(), line2: $("#s-addr2").value.trim(), zip: $("#s-zip").value.trim(), city: $("#s-city").value.trim(), country: $("#s-country").value };
        if (!address.line1 || !/^\d{4,5}$/.test(address.zip) || !address.city) { err.textContent = "Complète ton adresse de livraison (adresse, code postal, ville)."; return; }
      } else {
        if (!relay) { err.textContent = "Recherche puis choisis un point relais."; return; }
        address = { mode, relay };
      }
      const m = SHOP.shipping.find((x) => x.id === mode);
      shipping = { mode, label: m.label, carrier: m.carrier, delay: m.delay, days: m.days, firstName: first, lastName: last, phone, address };
      Auth.update({ phone, address: mode === "home" ? address : user.address });

      // Résumé de l'étape et ouverture du paiement
      $("#ship-recap").innerHTML = `<b>${first} ${last}</b> · ${phone}<br>${m.label} (${m.carrier}, ${m.delay})<br>` + (mode === "home"
        ? `${address.line1}${address.line2 ? ", " + address.line2 : ""}<br>${address.zip} ${address.city}, ${address.country}`
        : `📍 ${relay.name}<br>${relay.street}, ${relay.zip} ${relay.city}`);
      $("#ship-form").hidden = true; $("#ship-recap").hidden = false; $("#edit-ship").hidden = false;
      $("#b-pay").classList.remove("locked");
      $("#st-ship").className = "done"; $("#st-ship i").textContent = "✓"; $("#st-pay").className = "current";
      $("#b-pay").scrollIntoView({ behavior: "smooth", block: "start" });
    };
    $("#edit-ship").onclick = () => {
      $("#ship-form").hidden = false; $("#ship-recap").hidden = true; $("#edit-ship").hidden = true;
      $("#b-pay").classList.add("locked");
      $("#st-ship").className = "current"; $("#st-ship i").textContent = "3"; $("#st-pay").className = "";
    };

    /* ---- Étape 2 : paiement ---- */
    const num = $("#c-num"), exp = $("#c-exp"), cvc = $("#c-cvc");
    const brandOf = (d) => (/^4/.test(d) ? "VISA" : /^(5[1-5]|2[2-7])/.test(d) ? "MASTERCARD" : /^3[47]/.test(d) ? "AMEX" : "");
    num.oninput = () => {
      const d = num.value.replace(/\D/g, "").slice(0, 19);
      num.value = d.replace(/(.{4})/g, "$1 ").trim();
      $("#c-brand").textContent = brandOf(d);
    };
    exp.oninput = () => {
      const d = exp.value.replace(/\D/g, "").slice(0, 4);
      exp.value = d.length > 2 ? d.slice(0, 2) + " / " + d.slice(2) : d;
    };
    cvc.oninput = () => (cvc.value = cvc.value.replace(/\D/g, "").slice(0, 4));
    const luhn = (d) => {
      let s = 0;
      [...d].reverse().forEach((c, i) => { let n = +c; if (i % 2) { n *= 2; if (n > 9) n -= 9; } s += n; });
      return d.length >= 13 && s % 10 === 0;
    };

    $("#pay-form").onsubmit = (e) => {
      e.preventDefault();
      const err = $("#pay-error"); err.textContent = "";
      if (!shipping) { err.textContent = "Valide d'abord ta livraison."; return; }
      const d = num.value.replace(/\D/g, ""), [mm, yy] = exp.value.split("/").map((s) => +s.trim());
      const now = new Date(), expOk = mm >= 1 && mm <= 12 && (2000 + yy > now.getFullYear() || (2000 + yy === now.getFullYear() && mm >= now.getMonth() + 1));
      if (!$("#c-name").value.trim()) { err.textContent = "Indique le nom du titulaire de la carte."; return; }
      if (!luhn(d)) { err.textContent = "Ce numéro de carte n'est pas valide."; return; }
      if (!expOk) { err.textContent = "La date d'expiration n'est pas valide."; return; }
      if (!/^\d{3,4}$/.test(cvc.value)) { err.textContent = "Le cryptogramme n'est pas valide."; return; }
      if (!$("#c-cgv").checked) { err.textContent = "Tu dois accepter les conditions générales de vente."; return; }

      const btn = $("#pay-btn");
      btn.disabled = true; btn.innerHTML = `<span class="paying"></span> Paiement en cours…`;
      const card = { brand: brandOf(d) || "CARTE", last4: d.slice(-4) }; // seuls la marque et les 4 derniers chiffres sont conservés
      [num, exp, cvc, $("#c-name")].forEach((i) => (i.value = ""));

      setTimeout(() => {
        const sub = subtotal(), ship = shippingCost(shipping.mode, sub);
        const order = Orders.create({
          email: user.email, items: cart.map((c) => ({ ...c })), shipping: { ...shipping, cost: ship },
          subtotal: sub, total: sub + ship, payment: card,
        });
        cart = []; store.set(cart); renderCart();
        location.href = "commande.html?id=" + order.id;
      }, 1600);
    };

    renderSummary();
  }

  /* ==========================================================
     PAGE CONFIRMATION
     ========================================================== */
  function initConfirmation() {
    const o = Orders.get(new URLSearchParams(location.search).get("id"));
    const box = $("#confirm");
    if (!o) { box.innerHTML = `<div class="empty-state">Commande introuvable.<br><br><a class="btn btn-sm" href="compte.html">Mon compte</a></div>`; return; }
    const s = o.shipping, a = s.address;
    box.innerHTML = `
      <div class="confirm-head">
        <div class="ok-badge"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12.5l5 5L20 6.5"/></svg></div>
        <span class="kicker">Commande n° ${o.id}</span>
        <h1>Merci <span class="grad">${s.firstName}</span> !</h1>
        <p>Ta commande est confirmée. Un e-mail récapitulatif vient d'être envoyé à <b style="color:#fff">${o.email}</b>.</p>
      </div>
      <div class="confirm-grid">
        <div class="co-block">
          <h2>📦 Livraison</h2>
          <div class="co-recap"><b>${s.label}</b> · ${s.carrier}<br>${a.mode === "home"
            ? `${s.firstName} ${s.lastName}<br>${a.line1}${a.line2 ? ", " + a.line2 : ""}<br>${a.zip} ${a.city}, ${a.country}`
            : `${a.relay.name}<br>${a.relay.street}<br>${a.relay.zip} ${a.relay.city}`}
            <br><br>Livraison estimée : <b>${deliveryEstimate(o)}</b></div>
        </div>
        <div class="co-block">
          <h2>💳 Paiement</h2>
          <div class="co-recap">${o.payment.brand} •••• ${o.payment.last4}<br>Montant payé : <b>${euro(o.total)}</b><br>Statut : <span class="status">${o.status}</span></div>
        </div>
      </div>
      <div class="co-block">
        <h2>🛍️ Articles</h2>
        ${o.items.map((c) => `
          <div class="sum-item">
            <div class="thumb">${thumb(c.id)}<span class="qty-badge">${c.qty}</span></div>
            <div><b>${c.name}</b><small>Taille ${c.size}${c.flock ? " · Flocage " + c.flock : ""}</small></div>
            <span class="p">${euro(c.price * c.qty)}</span>
          </div>`).join("")}
        <div class="sum-line"><span>Sous-total</span><span>${euro(o.subtotal)}</span></div>
        <div class="sum-line"><span>Livraison</span><span>${o.shipping.cost ? euro(o.shipping.cost) : "Offerte"}</span></div>
        <div class="sum-line total"><span>Total payé</span><span>${euro(o.total)}</span></div>
      </div>
      <div class="confirm-actions">
        <a class="btn" href="emails/apercu.html?order=${o.id}">📧 Voir l'e-mail de confirmation</a>
        <a class="btn btn-ghost" href="compte.html">Mes commandes</a>
        <a class="btn btn-ghost" href="boutique.html">Continuer mes achats</a>
      </div>`;
  }

  ({ checkout: initCheckout, commande: initConfirmation }[PAGE] || (() => {}))();
})();
