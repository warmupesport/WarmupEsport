/* ==========================================================
   WARMUP ESPORT — Comptes clients, commandes et e-mails
   ⚠ MODE DÉMO : tout est stocké dans le navigateur (localStorage) et les
   e-mails ne partent pas réellement (ils sont visibles dans emails/apercu.html).
   Avant la mise en ligne, ce fichier est le SEUL à remplacer par de vrais
   services (ex. Supabase Auth pour les comptes, Stripe pour le paiement,
   Brevo/Resend pour les e-mails) — voir README, section « Boutique ».
   ========================================================== */

const Store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

/* ---------- E-mails (boîte d'envoi de démo) ---------- */
const Mail = {
  send(template, to, data) {
    const outbox = Store.get("wu-outbox", []);
    const mail = { id: Date.now().toString(36), template, to, data, date: new Date().toISOString() };
    outbox.unshift(mail);
    Store.set("wu-outbox", outbox.slice(0, 30));
    return mail;
  },
  list() { return Store.get("wu-outbox", []); },
};

/* ---------- Comptes ---------- */
const Auth = (() => {
  const USERS = "wu-users", SESSION = "wu-session";
  // Démo uniquement : un vrai service d'authentification ne stocke jamais les mots de passe côté navigateur
  async function hash(s) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
    return [...new Uint8Array(buf)].map((x) => x.toString(16).padStart(2, "0")).join("");
  }
  const norm = (e) => e.trim().toLowerCase();

  return {
    user() {
      const email = Store.get(SESSION, null);
      return email ? Store.get(USERS, {})[email] || null : null;
    },
    async register({ firstName, lastName, email, password, newsletter }) {
      email = norm(email);
      const users = Store.get(USERS, {});
      if (users[email]) throw new Error("Un compte existe déjà avec cet e-mail. Connecte-toi plutôt.");
      users[email] = {
        firstName: firstName.trim(), lastName: lastName.trim(), email, newsletter: !!newsletter,
        hash: await hash(email + password), createdAt: new Date().toISOString(), phone: "", address: null,
      };
      Store.set(USERS, users);
      Store.set(SESSION, email);
      Mail.send("bienvenue", email, { prenom: users[email].firstName });
      return users[email];
    },
    async login(email, password) {
      email = norm(email);
      const u = Store.get(USERS, {})[email];
      if (!u || u.hash !== (await hash(email + password))) throw new Error("E-mail ou mot de passe incorrect.");
      Store.set(SESSION, email);
      return u;
    },
    logout() { try { localStorage.removeItem(SESSION); } catch {} },
    update(patch) {
      const u = this.user();
      if (!u) return;
      const users = Store.get(USERS, {});
      users[u.email] = { ...u, ...patch };
      Store.set(USERS, users);
    },
  };
})();

/* ---------- Commandes ---------- */
const Orders = {
  all() { return Store.get("wu-orders", []); },
  mine() { const u = Auth.user(); return u ? this.all().filter((o) => o.email === u.email) : []; },
  get(id) { return this.all().find((o) => o.id === id); },
  create(order) {
    const id = "WU-" + new Date().getFullYear() + "-" + Math.random().toString(36).slice(2, 7).toUpperCase();
    const full = { ...order, id, date: new Date().toISOString(), status: "Payée — en préparation" };
    Store.set("wu-orders", [full, ...this.all()]);
    Mail.send("commande", order.email, { orderId: id });
    return full;
  },
};

/* Date de livraison estimée (jours ouvrés, hors week-end) : « 21 – 23 octobre » */
function deliveryEstimate(order) {
  const addDays = (n) => {
    const d = new Date(order.date);
    while (n > 0) { d.setDate(d.getDate() + 1); if (d.getDay() % 6) n--; }
    return d;
  };
  const from = addDays(Math.max(1, order.shipping.days - 2)), to = addDays(order.shipping.days);
  const f = (d, o) => d.toLocaleDateString("fr-FR", o);
  return from.getMonth() === to.getMonth()
    ? `${f(from, { day: "numeric" })} – ${f(to, { day: "numeric", month: "long" })}`
    : `${f(from, { day: "numeric", month: "long" })} – ${f(to, { day: "numeric", month: "long" })}`;
}

/* Frais de port selon le mode choisi et le montant du panier */
function shippingCost(modeId, subtotal) {
  const mode = SHOP.shipping.find((m) => m.id === modeId);
  if (!mode) return 0;
  return subtotal >= SHOP.freeShippingFrom ? 0 : mode.price;
}
