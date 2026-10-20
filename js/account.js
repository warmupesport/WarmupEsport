/* ==========================================================
   WARMUP ESPORT — Page « Mon compte » : connexion, inscription, espace client
   ========================================================== */

(() => {
  const params = new URLSearchParams(location.search);
  const goCheckout = params.get("next") === "checkout";
  const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

  // Afficher / masquer le mot de passe
  $$(".input-wrap .toggle").forEach((b) => (b.onclick = () => {
    const i = b.previousElementSibling, show = i.type === "password";
    i.type = show ? "text" : "password"; b.textContent = show ? "Masquer" : "Afficher";
  }));

  function render() {
    const u = Auth.user();
    $("#auth").hidden = !!u;
    $("#dash").hidden = !u;
    $("#checkout-notice").hidden = !(goCheckout && !u);
    if (!u) return;

    $("#page-title").innerHTML = `Salut <span class="grad">${u.firstName}</span> 👋`;
    $("#page-lead").textContent = "Retrouve ici tes commandes et tes infos.";
    $("#d-avatar").textContent = u.firstName.charAt(0).toUpperCase();
    $("#d-name").textContent = `${u.firstName} ${u.lastName}`;
    $("#d-email").textContent = u.email;

    const orders = Orders.mine();
    $("#orders").innerHTML = orders.length
      ? orders.map((o) => `
        <a class="order-row" href="commande.html?id=${o.id}">
          <div><b>${o.id}</b><small>${new Date(o.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</small></div>
          <div><small>${o.items.reduce((a, i) => a + i.qty, 0)} article(s)</small><b>${euro(o.total)}</b></div>
          <div><span class="status">${o.status}</span></div>
          <span class="arrow">→</span>
        </a>`).join("")
      : `<div class="empty-state">Tu n'as pas encore passé de commande.<br><br><a class="btn btn-sm" href="boutique.html">Découvrir les maillots</a></div>`;
  }

  // Après connexion/inscription : direction le paiement si on venait du panier
  const afterAuth = () => {
    if (goCheckout && cart.length) location.href = "checkout.html";
    else location.reload();
  };

  $("#login-form").onsubmit = async (e) => {
    e.preventDefault();
    const err = $("#login-error"); err.textContent = "";
    const email = $("#l-email").value, pass = $("#l-pass").value;
    if (!emailOk(email) || !pass) { err.textContent = "Renseigne ton e-mail et ton mot de passe."; return; }
    try { await Auth.login(email, pass); afterAuth(); }
    catch (ex) { err.textContent = ex.message; }
  };

  $("#register-form").onsubmit = async (e) => {
    e.preventDefault();
    const err = $("#register-error"); err.textContent = "";
    const f = { firstName: $("#r-first").value, lastName: $("#r-last").value, email: $("#r-email").value, password: $("#r-pass").value, newsletter: $("#r-news").checked };
    $$("#register-form input").forEach((i) => i.classList.remove("invalid"));
    const fail = (id, msg) => { $(id).classList.add("invalid"); err.textContent = msg; };
    if (!f.firstName.trim()) return fail("#r-first", "Indique ton prénom.");
    if (!f.lastName.trim()) return fail("#r-last", "Indique ton nom.");
    if (!emailOk(f.email)) return fail("#r-email", "Cette adresse e-mail n'est pas valide.");
    if (f.password.length < 8 || !/\d/.test(f.password)) return fail("#r-pass", "Le mot de passe doit faire 8 caractères minimum, dont au moins un chiffre.");
    if (!$("#r-cgv").checked) { err.textContent = "Tu dois accepter les conditions générales pour créer ton compte."; return; }
    try {
      const u = await Auth.register(f);
      toast(`📧 Bienvenue ${u.firstName} ! Un e-mail de bienvenue t'a été envoyé.`);
      setTimeout(afterAuth, 1400);
    } catch (ex) { err.textContent = ex.message; }
  };

  $("#logout").onclick = () => { Auth.logout(); location.href = "compte.html"; };

  render();
})();
