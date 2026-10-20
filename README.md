# Warmup Esport — site vitrine

Site statique (HTML/CSS/JS, aucune installation). Ouvre `index.html` ou héberge le dossier sur Netlify, Vercel, GitHub Pages, o2switch…

## Prévisualiser en local
Lance `powershell -ExecutionPolicy Bypass -File tools/serve.ps1` dans ce dossier, puis ouvre http://localhost:8080

## Modifier le contenu
- **Joueurs, staff, maillots, FAQ, e-mail, réseaux** → `js/data.js`
- **Accueil** : maillots mis en scène (`COLLECTIONS`), photo d'équipe (`SITE.teamPhoto`) → `js/data.js` ; le roster reprend `PLAYERS`
- **Hero « plongée dans le logo »** → `js/hero.js` (canvas piloté par le scroll). Les 3 textes du hero sont dans `index.html`, blocs `hero-stage`
- Les autres animations de l'accueil sont dans `js/home.js` (GSAP + ScrollTrigger + Lenis, chargés depuis un CDN)
- **Notre histoire** → `index.html`, section `#histoire`
- **Chiffres clés** (tournois, podiums…) → `index.html`, attributs `data-count`

## Motion design de présentation
`motion.html` : vidéo de présentation de 30 s (16:9 ou 9:16) avec son, exportable en MP4 via le bouton « Exporter la vidéo » (Chrome / Edge).
Ouvre-la via le serveur local (http://localhost:8080/motion.html), pas en double-cliquant le fichier, sinon l'export est bloqué par le navigateur.
Les textes se modifient en haut de `js/motion.js` (objet `TEXTS`).

`motion-blueprint.html` : motion « Du plan à la réalité » (30 s, 16:9 ou 9:16, en 3D avec Three.js). DA blueprint : le site est dessiné au crayon sur papier bleu,
passe en vue éclatée 3D, se transforme en vrai site via un scan, le maillot sort de la page boutique, puis séquence roster façon gameplay et logo 3D final.
Textes, URL et tampon « EN LIGNE » : objet `TEXTS` en haut de `js/motion-blueprint.js`. Maillots et joueurs repris de `js/data.js`.

## Boutique : comptes, paiement et e-mails
Parcours : panier → `compte.html` (connexion / inscription) → `checkout.html` (livraison domicile ou point relais, paiement) → `commande.html` (confirmation).
E-mails : `emails/bienvenue.html` (inscription) et `emails/commande.html` (commande validée), avec des variables `{{prenom}}`, `{{total}}`…
Aperçu des e-mails « envoyés » : `emails/apercu.html`. Frais de port et pays : objet `SHOP` dans `js/data.js`.

⚠ **Actuellement en mode démo** : comptes, commandes et e-mails sont simulés dans le navigateur (`js/auth.js`), aucun paiement réel.
Avant la mise en ligne, il faut brancher de vrais services (seul `js/auth.js` et le bloc paiement de `checkout.html` changent) :
- **Paiement** : Stripe (compte gratuit, commission par vente, virements vers votre compte bancaire). Le formulaire de carte est alors remplacé par le module sécurisé de Stripe : les numéros de carte ne passent jamais par le site.
- **Comptes clients** : Supabase Auth (gratuit pour démarrer), qui envoie aussi l'e-mail d'inscription avec le modèle `emails/bienvenue.html`.
- **E-mails de commande** : Brevo ou Resend, avec le modèle `emails/commande.html`.
- **Points relais** : widget officiel Mondial Relay (les points affichés en démo sont fictifs).
- **Hébergement** : il faudra un hébergeur qui accepte des petites fonctions serveur (Netlify, Vercel…) pour valider les paiements Stripe.

## Légal & sécurité
- Pages : `mentions-legales.html`, `cgv.html` (avec formulaire de rétractation), `confidentialite.html` (RGPD + cookies), `404.html`.
- **Infos légales à compléter une seule fois** dans `SITE.legal` (`js/data.js`) : elles s'affichent automatiquement sur les 3 pages (surlignées en jaune tant qu'elles sont vides).
- En-têtes de sécurité HTTP : `_headers` (Netlify, Cloudflare Pages) ou `vercel.json` (Vercel). Pensez à y ajouter Stripe le jour où le paiement est branché.
- Référencement : `robots.txt` et `sitemap.xml` (remplacer `VOTRE-DOMAINE.fr`).

### Checklist avant la mise en ligne
1. Compléter `SITE.legal` (forme juridique, SIRET/RNA, adresse, TVA, directeur de publication, hébergeur, médiateur, prestataire de paiement).
2. Adhérer à un **médiateur de la consommation** (obligatoire pour vendre aux particuliers, payant, quelques dizaines d'€/an).
3. Brancher les vrais services (Stripe, comptes, e-mails, Mondial Relay) — voir « Boutique ».
4. Remplacer les joueurs, stats et chiffres provisoires.
5. Mettre le domaine dans `robots.txt` et `sitemap.xml`, activer le HTTPS chez l'hébergeur (automatique sur Netlify/Vercel).
6. Ne pas publier les dossiers `tools/` et la page `emails/apercu.html` (outils internes / démo).
7. Faire relire CGV et mentions légales par un professionnel du droit.

## Photos du staff
Les photos sont détourées (PNG transparent) puis posées sur un fond aux couleurs de l'équipe généré en CSS.
Pour un nouveau membre : mets sa photo dans `assets/staff/src/`, ajoute-la dans `JOBS` en haut de `tools/detourage.html`,
ouvre http://localhost:8080/tools/detourage.html (serveur local lancé) et clique sur « Détourer et enregistrer ». Ajoute-le ensuite dans `STAFF` (`js/data.js`).

## Médias
- **Photos des joueurs** → ex. `assets/joueurs/nova.png`, puis `photo: "assets/joueurs/nova.png"` dans `data.js`
- **Vraies photos des maillots** → `image: "assets/maillots/domicile.png"` dans `data.js` (remplace le rendu dessiné)

## Formulaire de contact
Le site étant statique, le formulaire affiche une confirmation mais n'envoie rien.
Pour recevoir les messages par e-mail, le plus simple est [Formspree](https://formspree.io) : crée un formulaire,
puis dans `contact.html` remplace `<form id="contact-form">` par
`<form id="contact-form" action="https://formspree.io/f/TON_ID" method="POST">` et supprime le bloc `onsubmit` dans `js/main.js` (fonction `initContact`).
