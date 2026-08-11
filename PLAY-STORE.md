# Mise sur Google Play — guide de lancement MMG (Android)

Guide pas-à-pas pour publier MMG sur le Google Play Store, à destination de Patrick
(non-dev). iOS reste sur TestFlight, inchangé. Décision : on abandonne le lien APK direct
(friction + méfiance) au profit d'un **lien Play Store propre**.

> **Ce que Claude Code NE peut PAS faire à ta place** (à toi de le faire) : créer le compte
> développeur, payer les frais, faire vérifier ton identité, saisir tes coordonnées bancaires.
> Je fournis : la config de build (faite), le contenu de la fiche, la marche à suivre, et les
> points de politique à surveiller.

---

## 0. État technique — PRÊT ✅

- **Cible Android 16 / API 36** : Expo SDK 57 cible par défaut `compileSdkVersion 36` +
  `targetSdkVersion 36`. C'est l'exigence Google Play depuis le 31/08/2026 → **rien à changer**.
- **AAB signé** : le profil EAS `production` produit un **Android App Bundle** (.aab), format
  attendu par le Play Store, **sans les outils de test** (M / aperçu absents). versionCode
  auto-incrémenté par EAS. `app.json` version = **2.0.0**.
- **Signature** : le build est signé avec la clé d'upload gérée par EAS. Au premier envoi sur
  le Play Console, tu actives **Play App Signing** (Google gère la clé de signature finale, la
  clé EAS reste la clé d'upload). Standard, rien de spécial à préparer.
- Le fichier .aab se télécharge depuis la page du build EAS (lien fourni à chaque build).

---

## 1. La contrainte à connaître : « 12 testeurs, 14 jours »

Un compte développeur **personnel** créé après le 13/11/2023 doit, avant de publier en
production publique, faire tourner un **test fermé (closed testing) avec ≥ 12 testeurs opt-in
pendant 14 jours continus**.

- Les 12 doivent rester actifs **en continu** sur la même fenêtre de 14 jours. Si on retombe
  sous 12, **le compteur repart à zéro**. → **Recruter 15-16 testeurs**, pas 12 pile.
- « Opt-in » = chaque testeur a **cliqué le lien** et rejoint le test via le Play Store (une
  simple adresse email ajoutée ne suffit pas).
- Google veut que les testeurs **utilisent vraiment** l'app.
- **INTERDIT** : émulateurs, faux comptes, services de « faux testeurs » → suspension permanente.
  Uniquement de vrais testeurs, vrais appareils.
- Un compte **organisation** (entité légale + numéro D-U-N-S) est **exempté** de cette règle.
  On reste personnel pour l'instant ; l'option organisation est à garder pour plus tard si MMG
  devient une activité formelle.

---

## 2. Stratégie recommandée : double voie en parallèle

On ne passe **pas** directement en production. Trois tracks Google :
`internal testing` (rapide, ≤ 100 testeurs, sans la règle 12/14) → `closed testing` (déclenche
la règle 12/14) → `production` (public).

1. **Tout de suite — internal testing** : dès l'AAB prêt, on distribue à tous les testeurs
   Android via un **lien Play Store propre**. Fini l'APK et la méfiance, sans attendre 14 jours.
2. **En parallèle — closed testing** : ≥ 12 (idéalement 15-16) testeurs opt-in, pour lancer le
   chrono des 14 jours.
3. **Après 14 jours validés + questionnaire de production** → demander l'accès production →
   Play Store public (~2-3 semaines selon le recrutement).

> Le recrutement des 12+ testeurs **recoupe** le recrutement déjà prévu pour l'observation de
> rétention : c'est le même effort, on coche juste aussi la case Google.

---

## 3. Marche à suivre pas-à-pas

### 3.1 Créer le compte développeur (toi)
1. Va sur **play.google.com/console**, connecte-toi avec ton compte Google.
2. Choisis un compte **« Personnel »**. Renseigne nom, adresse.
3. Paie les **frais d'inscription uniques (~25 $US, une seule fois à vie)**.
4. **Vérification d'identité** : Google demande une pièce d'identité (exigence 2026). Prévois
   ta carte d'identité/passeport. La validation peut prendre quelques jours.

### 3.2 Créer l'app dans la console
1. **Créer une application** → nom **MMG** (ou « MMG — MyMoneyGest »), langue par défaut
   **français (France)**, type **Application**, **gratuite**.
2. Accepte les déclarations (règles développeur, lois export US).

### 3.3 Remplir la fiche (contenu prêt en §4)
Menu **Croissance → Présence sur le Play Store → Fiche principale du Store** :
- Nom de l'app, description courte, description complète (§4).
- **Icône** 512×512 (on l'a : `assets/images/icon.png`, à exporter en 512 px).
- **Image de mise en avant** 1024×500.
- **Captures d'écran** téléphone (2 à 8 ; on en a déjà).
- **Catégorie** : Finance.
- **Coordonnées** : email **mymoneygest@gmail.com** (⚠️ PAS `@mail.com`), site web facultatif.

### 3.4 Déclarations obligatoires (menu « Contenu de l'application »)
À remplir avant toute diffusion (§5 pour les points sensibles) :
- **Politique de confidentialité** : URL publique obligatoire (§5.1).
- **Sécurité des données (Data safety)** : formulaire sur les données collectées (§5.2).
- **Accès à l'app** : préciser qu'aucune connexion n'est requise (app 100 % locale).
- **Publicités** : déclarer **aucune publicité**.
- **Classification du contenu** : questionnaire (app finance, tout public).
- **Public cible** : adultes.

### 3.5 Internal testing (immédiat)
1. Menu **Tests → Tests internes** → **Créer une release**.
2. **Importer l'AAB** téléchargé depuis EAS.
3. Onglet **Testeurs** → créer une liste, ajouter les emails Google des testeurs.
4. Copier le **lien d'opt-in**, l'envoyer aux testeurs. Chacun clique, accepte, installe depuis
   le Play Store. → Lien propre, dispo en quelques minutes/heures.

### 3.6 Closed testing (en parallèle, pour débloquer la prod)
1. Menu **Tests → Tests fermés** → créer une piste → importer le **même AAB**.
2. Ajouter la liste des **≥ 12 testeurs opt-in**, envoyer le lien d'opt-in.
3. **Le chrono des 14 jours démarre** quand ≥ 12 testeurs ont rejoint et utilisent l'app.
4. Suivre le tableau de bord « exigences de test » de la console.

### 3.7 Production (après 14 jours OK)
1. Remplir le **questionnaire de production** (Google demande comment le test s'est passé).
2. Demander l'accès production → créer une release production avec le même AAB → soumettre à
   la revue Google.

---

## 4. Contenu de la fiche (prêt à copier)

**Nom (≤ 30 caractères)** : `MMG — MyMoneyGest`

**Description courte (≤ 80 caractères)** :
`Épargne à ta méthode. Un projet, un geste par mois. Sans banque connectée.`

**Description complète (≤ 4000 caractères)** :
```
MMG t'aide à épargner pour tes projets — un fonds d'urgence, une voiture, un voyage — à ta
façon, sans jamais connecter ta banque.

LA MÉTHODE, RIEN D'AUTRE
MMG n'est pas une banque et ne touche pas à ton argent. C'est un outil de méthode : tu choisis
un objectif et une date, MMG calcule un montant réaliste à mettre de côté chaque mois, et te le
rappelle le jour venu. Tu mets la somme de côté avec ton moyen habituel, puis tu confirmes d'un
tap. C'est tout.

NON-PUNITIF PAR PRINCIPE
Tu as mis moins que prévu ce mois-ci ? Ce n'est pas grave : le plan se recalcule tout seul, sans
pénalité ni culpabilisation. Tu avances à ton rythme.

TES DONNÉES RESTENT CHEZ TOI
Tes projets, ton budget et tes versements sont enregistrés uniquement sur ton téléphone. Aucune
création de compte, aucune connexion bancaire, aucune donnée personnelle envoyée. Pas de
publicité, pas de revente.

PLUSIEURS DEVISES, PLUSIEURS PAYS
MMG fonctionne en euro, en franc CFA (FCFA / XAF / XOF), en dollar et plus. Tu choisis ton pays
au premier lancement ; tout s'affiche dans ta monnaie.

CE QUE MMG FAIT
• Un plan d'épargne clair par projet, avec un montant conseillé
• Un rappel mensuel sobre, le jour que tu choisis
• Un mode « épargne libre » pour les revenus irréguliers
• Un suivi de progression simple et motivant

CE QUE MMG NE FAIT PAS
• Pas de conseil en investissement ni de placement
• Pas de connexion à ta banque
• Pas de frais, pas de publicité

MMG, c'est la méthode qui rend l'épargne possible, un geste à la fois.
```

**Réassurances à mettre en avant** (dans les captures/texte) : « Pas une banque », « Aucune
connexion bancaire », « Tes données restent sur ton téléphone », « Sans publicité ».

---

## 5. Points de politique Google à surveiller (AVANT soumission)

### 5.1 Politique de confidentialité (OBLIGATOIRE, surtout en Finance)
Google exige une **URL publique** vers une politique de confidentialité. On a déjà tout le
contenu dans l'app (écran Confidentialité : responsable du traitement, données locales,
événements pseudonymisés, conservation 12 mois, droits RGPD, CNIL, contact
**mymoneygest@gmail.com**). **Action** : la page est **déjà prête** — `web/confidentialite.html` (fichier autonome, reproduit
fidèlement l'écran légal de l'app). Il faut la mettre en ligne à une **URL publique**, puis coller
cette URL dans le Play Console (champ « Politique de confidentialité ») et dans App Store Connect.

> **Pas besoin de Vercel obligatoirement.** Google accepte n'importe quelle URL publique. Tu as
> déjà le domaine sur IONOS → héberge-la là si ton offre inclut un espace web.

**Option A — IONOS (si tu as un hébergement web, pas juste le domaine)** — recommandé :
1. Connecte-toi à ton espace **IONOS** → section **Hébergement / Sites web**.
2. Ouvre le **Gestionnaire de fichiers** (ou connecte-toi en **SFTP** avec les identifiants IONOS).
3. Va dans le **dossier racine** du site (souvent `/`, `htdocs` ou `www`).
4. **Dépose** le fichier `confidentialite.html`.
5. C'est en ligne : `https://mymoneygest.com/confidentialite.html`. Vérifie dans un navigateur.

**Option B — Tu n'as QUE le domaine (pas d'espace web)** :
- Soit tu ajoutes une **offre d'hébergement IONOS** puis Option A.
- Soit tu héberges **gratuitement** ailleurs :
  - **Netlify (le plus rapide, ~2 min)** : va sur app.netlify.com, **glisse-dépose le dossier
    `web/`** dans « Deploy ». Tu obtiens une URL publique immédiate (ex. `xxx.netlify.app/confidentialite.html`).
  - **Vercel** : crée un compte, « Add New Project », connecte le repo GitHub ou importe `web/`,
    déploie. URL immédiate (`xxx.vercel.app`).
  - Pour utiliser **mymoneygest.com** ensuite : ajoute le domaine dans Netlify/Vercel, puis chez
    IONOS modifie les **DNS** (enregistrement pointant vers l'hébergeur, selon leurs instructions).

**Le plus rapide pour débloquer MAINTENANT** : Google accepte une URL `*.netlify.app` /
`*.vercel.app`. Donc un glisser-déposer Netlify te donne une URL utilisable **tout de suite**, et
tu brancheras `mymoneygest.com` plus tard sans bloquer le lancement.

### 5.2 Formulaire « Sécurité des données » (Data safety) — RÉPONSES PRÊTES

Principe Google : « collecter » = **transmettre hors de l'appareil**. Tout ce qui reste en local
(budget, montants, noms de projets, solde) **n'est PAS collecté**. MMG ne transmet que des
**événements d'usage pseudonymisés** reliés à un **identifiant d'installation aléatoire**.

**Écran « Collecte et partage des données » :**
- « Ton application collecte-t-elle ou partage-t-elle un des types de données requis ? » → **OUI**
  (on transmet des événements d'usage).
- « Toutes les données sont-elles chiffrées en transit ? » → **OUI** (HTTPS vers Supabase et
  Frankfurter).
- « Fournis-tu un moyen de demander la suppression des données ? » → **OUI** (email
  mymoneygest@gmail.com ; suppression d'un projet dans l'app ; désinstaller retire les données
  locales).
- Partage avec des tiers : **NON** pour tout. Supabase est un **sous-traitant/hébergeur** (traite
  pour notre compte) → au sens Google ce n'est **pas** du « partage ».

**Types de données à déclarer COLLECTÉS (collecté = Oui / partagé = Non) :**

| Catégorie | Type précis | But | Détails |
|---|---|---|---|
| **Activité dans l'application** | Interactions avec l'app | **Analyse** (+ fonctionnalité) | Ouvertures, création/suppression de projet, versement confirmé, rappel ouvert/reporté, confirmation de solde, choix de réajustement. Inclut le contexte de config (catégorie de projet, rythme, mode guidé/libre, **pays et devise choisis**). **Aucun montant**, même en tranche. |
| **Identifiants (Device or other IDs)** | Identifiant d'installation aléatoire | **Analyse** | Sert seulement à relier entre eux les événements d'une même installation. Ce n'est ni l'ID publicitaire, ni l'IMEI, ni l'Android ID. |

Pour ces deux types : **Collecté = Oui**, **Partagé = Non**, **Traité de façon éphémère = Non**
(conservés ≤ 12 mois), **Collecte obligatoire** (pas de bouton d'activation dans l'app ;
l'opposition se fait par email — base légale : intérêt légitime).

**Types de données à déclarer NON COLLECTÉS (ne rien cocher) :**
- **Informations financières** : NON. **Aucune donnée liée à l'argent ne quitte l'appareil** —
  ni les montants (même approximatifs/en tranches), ni le budget, ni le solde, ni les noms de
  projets. (Depuis le contre-audit Codex, la tranche de montant a été **retirée** des événements.)
- **Localisation** : NON. MMG **ne demande aucune permission de localisation** et n'accède à aucun
  capteur. (Le *pays* est **choisi manuellement** par l'utilisateur pour la devise → déclaré en
  config d'app sous « Activité dans l'application », ce n'est pas de la localisation appareil.)
- **Informations personnelles** (nom, email, adresse, téléphone) : NON (aucun compte ; l'email ne
  sert qu'au contact, à l'initiative de l'utilisateur).
- **Messages, Photos/Vidéos, Audio, Fichiers, Agenda, Contacts, Santé, Navigation web** : NON.

> **Un point de jugement** (mineur) : le *pays* est classé en config d'app (« Activité »), pas en
> « Localisation », car auto-déclaré et sans permission GPS. Si un jour tu ajoutes un vrai opt-in
> analytics dans l'app, repasse la « collecte obligatoire » en « optionnelle ».

### 5.3 Catégorie Finance — mentions
- **Ne PAS se présenter comme un établissement financier** ni promettre un rendement : on est
  un outil de méthode. Le texte de la fiche (§4) est déjà cadré en ce sens (« pas une banque »,
  « pas de conseil en investissement »). C'est un **atout** anti-rejet, à ne pas édulcorer.
- Pas de fonctionnalité de paiement/transfert dans l'app → pas d'exigence PCI/finance lourde.

### 5.4 Vérification d'identité développeur
Exigence 2026 distincte du closed testing. Prévois ta pièce d'identité ; sans validation, la
diffusion reste bloquée.

---

## 6. Ce dont Claude Code peut t'aider ensuite
- ✅ **Page de confidentialité publique** : faite (`web/confidentialite.html`), voir §5.1.
- ✅ **Réponses au formulaire Data safety** : prêtes, voir §5.2.
- Exporter/préparer l'**icône 512** et l'**image de mise en avant 1024×500** si tu fournis les
  sources.
- La procédure technique de build/montée de version est dans **GUIDE-MAINTENANCE.md**.
