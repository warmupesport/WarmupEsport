/* ==========================================================
   WARMUP ESPORT — Données du site
   👉 C'est ICI que tu modifies joueurs, maillots et FAQ.
   ========================================================== */

const SITE = {
  name: "Warmup Esport",
  email: "warmupesport@gmail.com",
  socials: {
    twitter: "https://x.com/",
    instagram: "https://instagram.com/",
    twitch: "https://twitch.tv/",
    youtube: "https://youtube.com/",
    tiktok: "https://tiktok.com/",
    discord: "https://discord.gg/",
  },
};

/* ---------- INFORMATIONS LÉGALES ----------
   ✏️ Obligatoires pour les mentions légales et les CGV. Tant qu'un champ est vide,
   il apparaît surligné « À compléter » sur les pages légales. */
SITE.legal = {
  // Infos officielles : registre SIRENE (INSEE) / Répertoire national des associations
  company: "Structure Warmup Esport (WRMP)",
  form: "Association déclarée (loi du 1er juillet 1901), créée le 27 septembre 2025",
  registration: "SIREN 992 755 959 — SIRET 992 755 959 00010 — RNA W802019236 (préfecture de la Somme)",
  address: "Bâtiment 4 – 309, 17 passage du Logis du Roi, 80000 Amiens, France",
  vat: "",           // ex. "TVA non applicable, art. 293 B du CGI" ou "TVA intracommunautaire FR12345678901"
  director: "",      // directeur·rice de la publication = en principe le/la président·e de l'association, ex. "Pierrick NOM, président"
  phone: "",         // facultatif : la ligne disparaît si vide
  host: "",          // hébergeur : nom, adresse et téléphone, ex. "Netlify, Inc. — 512 2nd Street, Suite 200, San Francisco, CA 94107, USA"
  mediator: "",      // médiateur de la consommation (obligatoire) : nom, adresse et site web
  payment: "",       // prestataire de paiement, ex. "Stripe Payments Europe Ltd."
  updated: "14 octobre 2026", // date de dernière mise à jour des pages légales
};

/* ---------- JOUEURS ----------
   photo : chemin vers une image (ex: "assets/joueurs/nova.png"), ou "" pour la silhouette par défaut
   stats : valeurs affichées ; bars : valeurs de 0 à 100 pour les jauges */
const PLAYERS = [
  {
    pseudo: "NOVA", name: "Lucas Martin", role: "Capitaine · IGL", game: "Valorant", flag: "🇫🇷", number: 1, photo: "",
    bio: "Fondateur et leader de l'équipe, il dicte le rythme de chaque round avec un calme olympien.",
    stats: { "K/D": "1.32", "ACS": "248", "Winrate": "64%", "Matchs": "212" },
    bars: { "Visée": 82, "Stratégie": 96, "Communication": 98, "Clutch": 78 },
    socials: { Twitter: "#", Twitch: "#" },
  },
  {
    pseudo: "VYPER", name: "Hugo Bernard", role: "Duelliste", game: "Valorant", flag: "🇫🇷", number: 7, photo: "",
    bio: "Entry fragger explosif, toujours le premier à ouvrir le site.",
    stats: { "K/D": "1.48", "ACS": "281", "Winrate": "61%", "Matchs": "188" },
    bars: { "Visée": 95, "Stratégie": 74, "Communication": 80, "Clutch": 88 },
    socials: { Twitter: "#", Twitch: "#" },
  },
  {
    pseudo: "KAIROS", name: "Nathan Petit", role: "Sentinelle", game: "Valorant", flag: "🇧🇪", number: 12, photo: "",
    bio: "Le mur de l'équipe. Personne ne passe son flanc.",
    stats: { "K/D": "1.21", "ACS": "219", "Winrate": "63%", "Matchs": "201" },
    bars: { "Visée": 84, "Stratégie": 90, "Communication": 86, "Clutch": 92 },
    socials: { Twitter: "#" },
  },
  {
    pseudo: "ECHO", name: "Théo Laurent", role: "Initiateur", game: "Valorant", flag: "🇫🇷", number: 21, photo: "",
    bio: "Maître de l'info, il prépare chaque exécution au millimètre.",
    stats: { "K/D": "1.15", "ACS": "226", "Winrate": "60%", "Matchs": "176" },
    bars: { "Visée": 80, "Stratégie": 92, "Communication": 90, "Clutch": 75 },
    socials: { Twitch: "#" },
  },
  {
    pseudo: "SHADE", name: "Enzo Moreau", role: "Contrôleur", game: "Valorant", flag: "🇨🇭", number: 33, photo: "",
    bio: "Smokes parfaites, timing parfait. Le cerveau de l'ombre.",
    stats: { "K/D": "1.09", "ACS": "205", "Winrate": "62%", "Matchs": "194" },
    bars: { "Visée": 76, "Stratégie": 94, "Communication": 88, "Clutch": 81 },
    socials: { Twitter: "#", Twitch: "#" },
  },
  {
    pseudo: "BLITZ", name: "Maxime Roux", role: "Remplaçant · Flex", game: "Valorant", flag: "🇫🇷", number: 99, photo: "",
    bio: "Polyvalent, il peut remplacer n'importe quel rôle au pied levé.",
    stats: { "K/D": "1.18", "ACS": "231", "Winrate": "58%", "Matchs": "84" },
    bars: { "Visée": 86, "Stratégie": 80, "Communication": 82, "Clutch": 79 },
    socials: { Twitter: "#" },
  },
];

/* photo : PNG détouré (fond transparent), posé sur le fond aux couleurs de l'équipe.
   Pour détourer une nouvelle photo : la mettre dans assets/staff/src/ puis ouvrir tools/detourage.html.
   brightness : éclaircit la photo si elle est sombre (1 = inchangé) */
const STAFF = [
  { name: "Pierrick", age: 19, title: "Fondateur Warmup Esport", role: "Responsable sponsors & recrutement", photo: "assets/staff/pierrick-cut.png", brightness: 1.3 },
  { name: "Luigi", age: 21, title: "Fondateur Warmup Esport", role: "Responsable design & communication", photo: "assets/staff/luigi-cut.png", brightness: 1.05 },
];

/* ---------- MAILLOTS ----------
   design : base / accent / accent2 = couleurs ; pattern = "chevrons" | "split" | "stripes" | "gradient" | "plain"
   image : chemin vers une vraie photo du maillot (remplace le rendu SVG si renseigné) */
const PRODUCTS = [
  {
    id: "home-26", name: "Maillot Domicile 2026", cat: "Maillots", price: 59.9, tag: "Nouveau",
    desc: "Le maillot officiel porté par nos joueurs en compétition. Tissu respirant ultra-léger, coupe athlétique et logo brodé.",
    design: { base: "#0b0911", accent: "#8b3dff", accent2: "#b07cff", pattern: "chevrons" },
    sizes: ["XS", "S", "M", "L", "XL", "XXL"], image: "",
  },
  {
    id: "away-26", name: "Maillot Extérieur 2026", cat: "Maillots", price: 59.9, tag: "",
    desc: "La version violette pour les grands soirs. Même technicité que le domicile, couleur qui claque à l'écran.",
    design: { base: "#6a24e0", accent: "#0b0911", accent2: "#c9a6ff", pattern: "split" },
    sizes: ["XS", "S", "M", "L", "XL", "XXL"], image: "",
  },
  {
    id: "neon-ltd", name: "Maillot Neon — Édition limitée", cat: "Édition limitée", price: 74.9, tag: "Limité",
    desc: "Série numérotée à 200 exemplaires. Dégradé néon, finitions réfléchissantes et étiquette numérotée.",
    design: { base: "#08070e", accent: "#8b3dff", accent2: "#ff4fd8", pattern: "gradient" },
    sizes: ["S", "M", "L", "XL"], image: "",
  },
  {
    id: "pro-26", name: "Maillot Pro Player 2026", cat: "Maillots", price: 69.9, tag: "",
    desc: "La version 'pro' avec rayures verticales, identique à celle des joueurs sur scène, flocage inclus.",
    design: { base: "#120e1e", accent: "#8b3dff", accent2: "#3a1f6e", pattern: "stripes" },
    sizes: ["S", "M", "L", "XL", "XXL"], image: "",
  },
  {
    id: "retro-s1", name: "Maillot Saison 1 — Rétro", cat: "Édition limitée", price: 44.9, oldPrice: 54.9, tag: "-20%",
    desc: "Le tout premier maillot de l'histoire Warmup. Un collector pour les fans de la première heure.",
    design: { base: "#1a1a1f", accent: "#b07cff", accent2: "#ffffff", pattern: "plain" },
    sizes: ["S", "M", "L", "XL"], image: "",
  },
  {
    id: "kids-26", name: "Maillot Domicile Enfant", cat: "Enfant", price: 44.9, tag: "",
    desc: "Le maillot domicile en taille enfant pour les futurs champions. Tailles de 6 à 14 ans.",
    design: { base: "#0b0911", accent: "#8b3dff", accent2: "#b07cff", pattern: "chevrons" },
    sizes: ["6 ans", "8 ans", "10 ans", "12 ans", "14 ans"], image: "",
  },
];

/* ---------- ACCUEIL : maillots mis en scène (section épinglée) ----------
   product : id du maillot dans PRODUCTS ; palette : couleurs du fond animé (clair / moyen / sombre) */
const COLLECTIONS = [
  {
    product: "home-26", name: "Domicile 2026", headline: "Né pour la compétition",
    palette: { light: "#b07cff", mid: "#3b1475", dark: "#07030f" },
    specs: { Tissu: "Polyester recyclé 140 g", Coupe: "Athlétique", Flocage: "Pseudo + numéro", Tailles: "XS → XXL" },
  },
  {
    product: "away-26", name: "Extérieur 2026", headline: "Fait pour briller sous les projecteurs",
    palette: { light: "#c9a6ff", mid: "#6a24e0", dark: "#120428" },
    specs: { Tissu: "Maille aérée", Coupe: "Athlétique", Flocage: "Pseudo + numéro", Tailles: "XS → XXL" },
  },
  {
    product: "neon-ltd", name: "Neon Limited", headline: "200 exemplaires. Pas un de plus.",
    palette: { light: "#ff8de8", mid: "#a3159a", dark: "#1d0320" },
    specs: { Série: "Numérotée /200", Finition: "Réfléchissante", Flocage: "Inclus", Tailles: "S → XL" },
  },
  {
    product: "retro-s1", name: "Saison 1 Rétro", headline: "Là où tout a commencé",
    palette: { light: "#d9d4e8", mid: "#3a3550", dark: "#08070c" },
    specs: { Tissu: "Coton technique", Coupe: "Classique", Flocage: "Pseudo + numéro", Tailles: "S → XL" },
  },
];

/* Média affiché dans « Notre histoire » : une vidéo (prioritaire), sinon une photo, sinon le visuel provisoire */
SITE.teamVideo = "assets/histoire.mp4";
SITE.teamPhoto = "";

/* ---------- COMMANDES : livraison ---------- */
const SHOP = {
  freeShippingFrom: 80, // livraison offerte à partir de ce montant (€)
  shipping: [
    { id: "relay", label: "Point relais", carrier: "Mondial Relay", delay: "3 à 5 jours ouvrés", days: 5, price: 3.9 },
    { id: "home", label: "À domicile", carrier: "Colissimo", delay: "2 à 3 jours ouvrés", days: 3, price: 5.9 },
  ],
  countries: ["France", "Belgique", "Suisse", "Luxembourg"],
};

/* ---------- FAQ ---------- */
const FAQ = [
  {
    cat: "Commandes",
    items: [
      ["Comment commander un maillot ?", "Choisis ton maillot dans la boutique, sélectionne ta taille et ton éventuel flocage, puis ajoute-le au panier. Clique sur « Finaliser la commande », connecte-toi (ou crée ton compte en 30 secondes), choisis la livraison à domicile ou en point relais, puis paie en ligne. Tu reçois aussitôt un e-mail de confirmation."],
      ["Dois-je créer un compte pour commander ?", "Oui : ton compte te permet de suivre tes commandes, de retrouver tes adresses de livraison et d'être prévenu en avant-première des nouveaux maillots."],
      ["Puis-je personnaliser mon maillot (pseudo, numéro) ?", "Oui ! Le flocage est disponible sur tous les maillots : jusqu'à 12 caractères pour le pseudo et un numéro de 0 à 99. Le flocage est offert sur le Maillot Pro Player."],
      ["Quels moyens de paiement acceptez-vous ?", "La carte bancaire (CB, Visa, Mastercard) directement sur le site, via un paiement sécurisé. Tes données bancaires ne sont jamais stockées par Warmup Esport."],
      ["Quels sont les frais de livraison ?", "3,90 € en point relais, 5,90 € à domicile. La livraison est offerte dès 80 € d'achat."],
      ["Comment choisir ma taille ?", "Nos maillots ont une coupe athlétique (ajustée). Si tu es entre deux tailles ou que tu préfères un style ample, prends une taille au-dessus."],
    ],
  },
  {
    cat: "Livraison & retours",
    items: [
      ["Quels sont les délais de livraison ?", "Comptez 5 à 10 jours ouvrés en France métropolitaine, 7 à 15 jours pour la Belgique, la Suisse et le reste de l'Europe. Les maillots floqués demandent 3 à 5 jours de préparation en plus."],
      ["Livrez-vous à l'international ?", "Oui, nous livrons dans toute l'Europe. Pour une livraison hors Europe, contacte-nous via la page contact."],
      ["Puis-je retourner ou échanger un article ?", "Tu disposes de 14 jours après réception pour retourner un article non porté et non floqué. Les échanges de taille sont possibles sous réserve de stock."],
      ["Mon colis est abîmé ou n'arrive pas, que faire ?", "Écris-nous avec ton numéro de commande et une photo si besoin, on règle ça rapidement."],
    ],
  },
  {
    cat: "L'équipe",
    items: [
      ["Sur quels jeux joue Warmup Esport ?", "Notre roster principal évolue actuellement sur Valorant. D'autres line-ups pourraient voir le jour, suis nos réseaux pour ne rien manquer."],
      ["Où regarder vos matchs ?", "Nos matchs officiels sont diffusés sur les chaînes des organisateurs et nos joueurs streament régulièrement sur Twitch. Les dates sont annoncées sur nos réseaux."],
      ["Peut-on rencontrer les joueurs ?", "Oui ! Nous participons régulièrement à des LAN et salons. Les meet & greet sont annoncés sur Instagram et Discord."],
    ],
  },
  {
    cat: "Recrutement & partenariats",
    items: [
      ["Comment rejoindre l'équipe ?", "Nous ouvrons des sessions de recrutement plusieurs fois par an. Envoie-nous ton profil (rang, rôle, disponibilités, clips) via la page contact en choisissant « Recrutement »."],
      ["Je souhaite devenir partenaire / sponsor", "Super ! Contacte-nous via le formulaire en choisissant « Partenariat », nous t'enverrons notre dossier de présentation."],
      ["Recrutez-vous du staff (coach, monteur, graphiste) ?", "Toujours ouverts aux profils motivés. Présente-toi via la page contact avec ton portfolio."],
    ],
  },
];
