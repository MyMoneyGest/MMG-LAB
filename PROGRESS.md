# Journal d'avancement — MMG

Journal partagé entre les IA (Claude Code, Codex) et Patrick. Objectif : celui qui prend le
relais sait exactement où on en est, sans relire tout l'historique git.

**Règles** : mise à jour à CHAQUE session de travail (pas en fin de chantier). Entrées datées,
signées, les plus récentes en haut. Chaque entrée dit : ce qui a été fait, ce qui est en cours,
ce qui vient ensuite.

> **Relais Claude Code ⇄ Codex (décidé par Patrick)** : les deux travaillent la V2 en
> alternance (l'un prend le relais quand l'autre n'a plus de tokens). **Tout ce qui est fait
> doit être consigné ici au fil de l'eau, par les deux.** Travailler sur la branche **`v2`**
> (jamais `main`, qui reste la V1 taguée `v1.0.0`).

---

## 2026-08-11 — Codex / Claude Code — Session 64 : re-audit validé + actions externes restantes

Codex a re-audité après les correctifs (session 63) : **code Android validé**, 5 points bien
traités, `npm test` 11 suites OK, `tsc` sans erreur, branche `v2` propre sur `3135399`. AAB
`2.0.0 (3)` bien issu de ce commit. **iOS build 5 mis à dispo par Apple** — des testeurs l'ont
déjà installé (TestFlight : 2.0.0 (5) sur iPhone 17/13 Pro/17 Pro Max/16).

### Actions externes restantes (côté Patrick, pas du code)
1. ✅ **FAIT — page Netlify redéployée** : `https://mymoneygest.netlify.app/` affiche désormais
   « Aucune donnée liée à l'argent n'est transmise » (vérifié en ligne). Politique publique
   cohérente avec le code.
2. **Exécuter la purge `pg_cron`** dans Supabase (SQL prêt, `retention-queries.sql` §0.b) puis
   vérifier avec `select * from cron.job;`. *(Reste à faire, quand Patrick veut.)*

### À faire avant diffusion PUBLIQUE (pas avant la bêta)
- **iOS build 6** : le build 5 (en bêta) repose sur `b609ec9` et contient encore la tranche de
  montant — honnêtement annoncée dans SA propre page Confidentialité, donc cohérent pour la bêta.
  Un build 6 intégrera le retrait avant une diffusion plus large. Ne pas interrompre le 5.
- **Maintenance dépendances Expo 57** : `expo-doctor` 19/20 (mises à jour correctives signalées).
  Non bloquant ; à faire + retester avant la vraie sortie publique, pas maintenant.

---

## 2026-08-11 — Claude Code — Session 63 : application des 5 points du contre-audit Codex

Patrick a arbitré : appliquer les **5 recommandations** de Codex (session 62), dont le **retrait
d'`amountBucket`**. Fait, puis nouvel AAB Android versionCode 3.

### Fait
1. **Garde-fous inactivité** (`nudge-planner.ts`) : le déclencheur B respecte désormais les mêmes
   cas « ne rien envoyer » que le mi-cycle — rien à < 4 j d'un rappel, ni si le cycle courant du
   projet ciblé est soldé. +2 cas de test.
2. **Retrait d'`amountBucket`** : plus AUCUNE donnée liée à l'argent transmise. Supprimé de
   `actions.ts` (dépôt + retrait) ; fonctions mortes retirées (`bucketAmount` de `plan.ts`,
   `amountInEurReference`/`EUR_REFERENCE_RATE` de `currency.ts`) ; tests, `analytics.ts`,
   `retention-queries.sql`, `legal.tsx`, `confidentialite.html`, PLAY-STORE §5.2, FEATURES §13 et
   README mis à jour (déclaration Data safety « aucune info financière », promesse renforcée).
3. **`installId` visible** : affiché et copiable dans l'écran Confidentialité (« Ton identifiant
   de suivi ») pour rattacher une demande RGPD ; page publique alignée ; requête de suppression
   par `install_id` documentée dans `retention-queries.sql` (0.d).
4. **Purge 12 mois automatique** : `retention-queries.sql` 0.b remplace la purge manuelle par une
   tâche `pg_cron` quotidienne (à activer une fois côté Supabase).
5. **Scripts `package.json`** : `test:nudge-copy`, `test:nudge-planner` ajoutés + script agrégé
   `npm test` qui lance TOUS les `scripts/test-*.mjs` (plus d'oubli possible).

### Vérifié
`tsc` OK, **11 suites vertes** (via `npm test`), `git diff --check` propre, écran Confidentialité
rendu sans erreur (identifiant de suivi affiché, texte « aucune donnée liée à l'argent »).

### Ensuite
- Nouvel **AAB Android versionCode 3** (l'ancien versionCode 2 n'a jamais été diffusé).
- iOS build 5 reste en TestFlight ; un build 6 intégrera ces changements plus tard si besoin
  (aucun n'est bloquant pour la bêta).

---

## 2026-08-11 — Codex — Session 62 : contre-audit post-build et arbitrage avant Play Store

Contre-audit demandé par Patrick après la préparation des builds V2 par Claude Code. Cette
session est **documentaire uniquement** : aucune modification du code produit ni aucun nouveau
build. Les recommandations ci-dessous doivent encore être relues/arbitrées avec Claude Code.

### Vérifié
- Branche `v2` propre et synchronisée avec `origin/v2`.
- TypeScript, `git diff --check` et les **11 suites de tests** exécutés réellement : tout est vert.
- EAS confirme les deux builds Store V2.0.0 terminés, tous deux issus du commit `b609ec9` :
  Android AAB versionCode 2 (`e60d3ec4`) et iOS build 5 (`8110c56b`).
- SDK 57 / cible Android API 36, outils de test absents de `production`, déclaration iOS de
  chiffrement et page de confidentialité publique (`https://mymoneygest.netlify.app/`) : OK.

### Points proposés à l'arbitrage Claude Code / Patrick
1. Étendre au déclencheur d'inactivité les garde-fous déjà documentés pour le coup de pouce :
   ne rien envoyer si le cycle concerné est soldé ni à moins de 4 jours du rappel mensuel.
2. Pour simplifier et sécuriser la déclaration Google Data safety, retirer `amountBucket` des
   événements Supabase plutôt que qualifier cette tranche pseudonymisée de donnée anonyme.
3. Rendre l'`installId` visible/copiable pour qu'une demande d'opposition ou d'effacement par
   email puisse être rattachée aux bonnes lignes Supabase.
4. Remplacer la purge RGPD manuelle « tous les trois mois environ » par une purge automatique
   garantissant réellement la promesse de conservation maximale de 12 mois.
5. Ajouter les deux suites `test-nudge-copy` et `test-nudge-planner` aux scripts de `package.json`
   afin qu'elles ne soient pas oubliées lors des prochains audits.

### Décision de diffusion à ce stade
- **iOS build 5** : laissé en vérification TestFlight. Aucun point relevé n'est considéré comme
  gênant pour une bêta limitée : le coup de pouce est désactivé par défaut, la tranche de montant
  est décrite dans la confidentialité, et les autres réserves sont opérationnelles/RGPD. Un build
  6 pourra intégrer les arbitrages ultérieurement sans annuler le build 5.
- **Android AAB versionCode 2** : jamais diffusé et ne sera pas importé dans Play Console avant
  arbitrage. Si les corrections sont validées, produire un nouvel AAB V2.0.0 versionCode 3.

### Ensuite
- Patrick recueille l'avis de Claude Code sur les cinq propositions.
- Après arbitrage : corrections retenues, mise à jour de la confidentialité/du guide, tests,
  nouveau build Android ; build iOS 6 ultérieurement si le code ou le texte intégré change.

---

## 2026-08-11 — Claude Code — Session 61 : builds de production + pivot Google Play

Décision de Patrick (après discussion avec Claude Chat) : **Android passe sur le Google Play
Store** (abandon du lien APK direct = friction + méfiance) ; iOS reste sur TestFlight.

### Fait
- **Vérifié** : Expo SDK 57 cible par défaut **API 36 (Android 16)** — exigence Google Play
  depuis le 31/08/2026 — donc **aucune config à ajouter**. Le profil `production` produit un
  **AAB signé sans outils de test**.
- **Builds de production lancés** (EAS, profil `production`, env production avec Supabase) :
  - Android **AAB** (versionCode auto 1→2) : build `e60d3ec4`.
  - iOS pour TestFlight (credentials individuels OK) : build `8110c56b`.
- **`PLAY-STORE.md`** créé : guide de lancement pas-à-pas (compte perso, règle 12 testeurs /
  14 jours, stratégie double-voie internal+closed testing, contenu de fiche prêt, points de
  politique Google — confidentialité, Data safety, catégorie Finance) + **étapes d'hébergement**
  de la page de confidentialité (IONOS, ou Netlify/Vercel en gratuit).
- **GUIDE-MAINTENANCE.md** : section build refaite (3 profils, AAB vs APK, montée de version),
  renvoi vers PLAY-STORE.md.
- **iOS soumis à TestFlight** : `eas submit -p ios` (auth via clé API ASC stockée sur EAS, aucun
  mot de passe Apple à saisir), App v2.0.0 build 5. Soumission `ef78b08b` en cours ; puis
  traitement Apple avant apparition dans TestFlight.
- **`web/confidentialite.html`** créé : page de confidentialité publique autonome (reproduit
  `legal.tsx`), à héberger sur mymoneygest.com (IONOS) — URL à coller dans Play Console + ASC.

### À signaler à Patrick
- Le brief mentionnait `mymoneygest@mail.com` : c'est l'ancienne coquille. L'email réel dans
  l'app est **`mymoneygest@gmail.com`** → à utiliser partout sur la fiche Play.
- **Politique de confidentialité** : Google exige une **URL publique**. Le contenu existe dans
  `legal.tsx` ; reste à le publier en page publique et coller l'URL. (Claude Code peut préparer
  la page.)
- Ce que Claude Code ne peut PAS faire : créer le compte développeur, payer, vérifier l'identité.

### État final (builds V2 de production)
- **Android AAB** : ✅ fini (build `e60d3ec4`), prêt à importer dans le Play Console.
- **iOS** : ✅ fini + **uploadé sur App Store Connect** (soumission `ef78b08b`), en traitement Apple
  puis dispo dans TestFlight (v2.0.0, build 5).
- **Politique de confidentialité** : ✅ en ligne et publique → `https://mymoneygest.netlify.app/`
  (déployée sur Netlify ; à brancher sur mymoneygest.com plus tard). Réponses Data safety prêtes
  (PLAY-STORE.md §5.2), fiche prête (§4).

### Ensuite
- Patrick : créer le compte Google Play + valider identité, importer l'AAB en internal testing,
  recruter 15-16 testeurs Android pour le closed testing. Côté iOS : rien à faire, TestFlight suit
  son cours (attention à la question de conformité export/chiffrement au 1er build TestFlight).

---

## 2026-08-11 — Claude Code — Session 60 : audit V2 avant production + bump version

Audit complet de la V2 (`main..v2` : 28 commits, 59 fichiers, ~5000 lignes) demandé par Patrick
avant les builds de production.

### Vérifié — RAS
- **Mécanique** : `tsc` OK, **11 suites de tests vertes**, `git diff --check main..v2` propre,
  arbre de travail propre.
- **Sécurité** : aucun secret tracké (`.env` ignoré, seul `.env.example` présent) ; Supabase via
  variables d'env (jamais en dur) ; aucun `console.*` hors `__DEV__` ; aucun `@ts-ignore` /
  `eslint-disable` / TODO / FIXME dans `src/`.
- **Confidentialité analytics** : aucune donnée perso — que buckets/catégories/pays/devise ;
  aucun montant en clair, aucun nom de projet, aucun lieu d'épargne. `nudge_shown` jamais compté
  comme rétention.
- **Outils de test** : gating `TEST_TOOLS_ENABLED` airtight — `EXPO_PUBLIC_MMG_TEST_TOOLS` n'est
  QUE dans le profil `preview-test` ; `preview` (Android prod) et `production` (iOS) ne l'ont pas
  → appui long M et aperçu du coup de pouce **absents** des builds de distribution.
- **Env EAS** : clés Supabase présentes dans les environnements `preview` ET `production`.

### Corrigé
- **`app.json` version 1.0.0 → 2.0.0** : la V1 était taguée 1.0.0 ; sans bump, les événements V2
  arriveraient avec `app_version=1.0.0`, indistinguables de la V1 dans la table `events`.

### Verdict
V2 **prête pour la production**. Reste à choisir la cible Android (APK direct façon V1 vs AAB
Play Store) puis lancer les builds Android + iOS.

---

## 2026-08-11 — Claude Code — Session 59 : coup de pouce Étape 2 (planificateur global)

Implémentation de l'Étape 2 validée : plafond partagé + déclencheur d'inactivité + tracing A/B.
Toute la logique délicate mise dans un **module pur et testé** (le comportement natif des notifs,
lui, ne se vérifie que sur appareil).

### Fait
- **`src/lib/nudge-planner.ts`** (pur, 15 cas de test dans `test-nudge-planner`) : décide la
  liste ordonnée des coups de pouce. Garantit **1 coup de pouce max / quinzaine, tous projets
  confondus** ; deux déclencheurs (A mi-cycle, B inactivité ~10 j, réarmée à l'ouverture) ;
  priorité au projet le plus anciennement touché ; tous les cas « ne rien envoyer ».
- **`notifications.ts`** : le coup de pouce sort de `scheduleGoalReminders` ; nouveau
  `scheduleNudges()` global (annule les précédents, trace une fois les passés, programme la
  sortie du planificateur, contenu tiré du pool). Canal LOW + passif conservés.
- **Store/types** : `lastAppOpenAt`, `lastNudgeAt`, `nudgePlan` (annulation + plafond + tracing),
  `recordAppOpen`, `setNudgePlan`. Type `ScheduledNudge`.
- **Appels** : `scheduleNudges()` après chaque mutation de projet (actions) et à chaque passage
  au premier plan (`_layout.tsx` → `recordAppOpen` + `scheduleNudges`).
- **Analytics** : nouvel event `nudge_shown` (déclencheur A/B en metadata), **jamais** compté
  comme rétention ; `retention-queries.sql` documenté en conséquence.
- **Tests** : `test-nudge-planner` (nouveau), `test-notifications` et `test-analytics` alignés
  sur la nouvelle architecture. `tsc` OK, **11 suites vertes**.

### ⚠️ À vérifier sur appareil (non testable ailleurs)
Le comportement natif : que les coups de pouce se programment bien, que le plafond tienne avec
plusieurs projets, que l'inactivité se déclenche/réarme, et que `nudge_shown` remonte. À valider
par Patrick sur un build `preview-test`.

---

## 2026-08-11 — Claude Code — Session 58 : révision du ton des messages (coup de pouce)

Retour de Patrick sur la 1re version du pool : garde-fous OK, mais le **ton** était trop
« coach / développement personnel » (« la preuve vivante », « nuance importante »), écrit pour
être lu plutôt que reçu — hors-sol pour un public qui commence à épargner (Afrique francophone).

### Fait
- **`nudge-copy.ts`** : pool réécrit dans un **registre familier, parlé, concret**. Nom du
  projet précédé de **« ton projet »** là où un nom court serait bancal (« ton projet Voyage »).
  Pools démarrage/libre réécrits en cohérence ; titres inchangés.
- Tests (`test-nudge-copy`) mis à jour sur les nouvelles formulations ; **10 suites vertes**,
  `tsc` OK.
- Doc : FEATURES (note de registre). Copie **« assez bonne »**, à affiner avec les testeurs sur
  place — on ne la sur-travaille pas maintenant (notif secondaire, désactivée par défaut).

### Ensuite
- Rebuild Android `preview-test` pour test de la variété via « Voir un aperçu » (Samsung).

---

## 2026-08-11 — Claude Code — Session 57 : batterie de messages du coup de pouce (Étape 1)

Suite au retour de Patrick (le message unique du coup de pouce sonnait creux, « comme quelqu'un
qui sonne juste pour dire coucou »). Décision stratégique associée : recadrage vers un
mini-déploiement, relance douce acceptée en 2 temps (cf. [[EXCHANGES.md]] et FEEDBACK.md).

### Fait (Étape 1 — le correctif du contenu)
- **`src/lib/nudge-copy.ts`** (module autonome, testable) : pool de messages qui tournent, avec
  sélection *démarrage > libre > principal*, injection systématique du nom du projet, **aucun
  verbe d'action ni montant**, titres variés (sans « Coucou »), rotation déterministe
  `hashSeed(installId + cycle)` (varie par cycle/utilisateur, rien à persister).
- **`notifications.ts`** : le vrai coup de pouce (`scheduleGoalReminders`) et l'aperçu
  (`scheduleTestNudge`) tirent titre+corps du pool ; l'aperçu utilise un index aléatoire pour
  montrer la variété. Contexte (isStarting/isFree) calculé depuis le projet. Nouveau garde-fou :
  rien à moins de 4 j du rappel mensuel.
- **Tests** : nouveau `test-nudge-copy` (injection du nom, garde-fous de contenu, pools
  démarrage/libre, titres, hash) ; `test-notifications` verrouille le câblage dynamique.
  `tsc` OK, **10 suites vertes**.
- **Docs** : FEATURES §9 (contenu du coup de pouce + Étape 2 à venir), FEEDBACK (recadrage),
  EXCHANGES (décision).

### Étape 2 (validée, à venir)
Déclencheur par **inactivité** (Logique B), **plafond 1/quinzaine tous projets confondus**, et
**tracing du déclencheur A/B** (hygiène de mesure). C'est le gros morceau technique (coordination
inter-projets).

### Ensuite
- Rebuild Android `preview-test` pour que Patrick teste la variété des messages via « Voir un
  aperçu » sur son Samsung.

---

## 2026-08-10 — Claude Code — Session 56 : drapeau d'outils de test + build Android

Prépare le plan de build en deux temps voulu par Patrick : d'abord un APK Android de test (avec
les outils de test), puis plus tard les builds de distribution Android + iOS SANS ces outils.

### Fait
- `src/lib/test-tools.ts` : `TEST_TOOLS_ENABLED = __DEV__ || EXPO_PUBLIC_MMG_TEST_TOOLS === '1'`.
- Les **deux** affordances de test passent sous ce drapeau (au lieu de `__DEV__` / toujours
  visible) : le rappel de test (appui long sur le M, `app-header.tsx`) et l'aperçu du coup de
  pouce (`goal/[id].tsx`). Absents des builds de distribution.
- `eas.json` : profil **`preview-test`** (`extends: preview` + `env EXPO_PUBLIC_MMG_TEST_TOOLS=1`)
  → APK autonome AVEC outils de test. `preview` / `production` restent sans le drapeau.
- Tests : `test-design` verrouille le gating (header en `TEST_TOOLS_ENABLED`, plus de `__DEV__` ;
  aperçu du coup de pouce gardé par le drapeau) ; `tsc` OK, 9 suites vertes.

### Build
- **Maintenant** : `eas build -p android --profile preview-test` (APK, test perso Patrick sur
  Samsung, avec le M et l'aperçu).
- **Plus tard (distribution)** : `eas build -p android --profile preview` + `eas build -p ios
  --profile production` → sans outils de test.

---

## 2026-08-10 — Claude Code — Session 55 : aperçu rapide du coup de pouce

Patrick doit pouvoir vérifier la petite notif discrète en quelques secondes (impossible à
juger sans la voir arriver sur l'appareil).

### Fait
- `notifications.ts` : `scheduleTestNudge(goal)` — programme un coup de pouce **identique au
  vrai** (canal `mid_cycle_nudges` LOW + `interruptionLevel: 'passive'`, aucune action,
  `reminderKind: 'mid_cycle_nudge'`) **5 secondes** après le geste. `isTest: true` → jamais
  dans la mesure. Réutilise `lastTestNotificationId` (un seul test à la fois).
- `goal/[id].tsx` : sous le toggle, un lien **« Voir un aperçu (5 s) »** visible seulement quand
  le coup de pouce est activé ET les notifications supportées. Sans effet de bord (contrairement
  au rappel de test `__DEV__`, dont les actions modifient le vrai plan), donc exposable hors dev.
- Tests : `test-notifications` verrouille la fidélité de l'aperçu (canal, passif, kind, isTest,
  5 s, aucune action).

### Vérifié
`tsc` OK, **9 suites vertes**. Ligne du toggle restructurée sans régression (web, sans erreur
console) ; le lien d'aperçu est masqué sur web (notifs non supportées) et apparaîtra sur build
natif — à confirmer par Patrick.

---

## 2026-08-10 — Claude Code — Session 54 : validation à l'écran des parcours Lot C (web)

Vérification visuelle sur le preview web (store Gabon/FCFA) des parcours du Lot C qui sont
observables sans appareil — complément aux tests de notifs (que Patrick, sur Expo Go, ne peut
pas vérifier lui-même pour le moment).

### Vérifié à l'écran, sans erreur console
- **Sélecteur de mode** (`onboarding/mode`) : « Plan guidé » / « Épargne libre », le texte du
  mode libre précise bien « Le rappel mensuel reste là ».
- **Création épargne libre** : étapes « Projet » + **« Rappel »** (pas « Rythme »), pas de
  budget imposé, carte « Épargne libre » ; étape 2 « MMG garde ton rituel mensuel, sans
  t'imposer de montant » ; récap = « Montant libre » / « Épargne libre ».
- **Démarrage différé** (testé dans le même projet) : champ date + hint « Aucun rappel ne
  partira avant cette date » ; récap « Démarrage 01/11/2026 » ; écran projet → en-tête « Prévu
  le 01/11/2026 » + carte « Tout est prêt pour le 01/11/2026 » (état d'attente, pas de montant
  conseillé). Le projet libre n'est pas compté dans l'effort de capacité (bandeau inchangé).
- **Validation** : nom vide correctement bloqué.
- **Estimation des dépenses** (`expense-estimate-modal`) : garde-fou « ne recompte pas… charges
  fixes », 5 catégories FCFA, total live correct (300 000 + 80 000 + 120 000 = 500 000 FCFA).
- **Gros montants FCFA** (rappel Session 43) : rendu sur une ligne confirmé.

### Reste (non vérifiable sans appareil)
- Comportement natif des notifications (rappel mensuel, coup de pouce discret sur canal LOW /
  iOS passif, démarrage différé qui n'émet rien avant la date) → couvert par les tests, à
  confirmer par Patrick en validation native quand un build le permettra.

---

## 2026-08-10 — Claude Code — Session 53 : coup de pouce sur canal dédié discret

Suite de l'audit : second point signalé, sur décision de Patrick.

### Problème
Le coup de pouce à mi-cycle était programmé sur le canal Android `reminders` (importance HIGH),
comme les vrais rappels — trop appuyé pour un message sobre « rien à faire ».

### Fait
- `notifications.ts` : nouveau canal `NUDGE_CHANNEL_ID = 'mid_cycle_nudges'` en
  `AndroidImportance.LOW` via `ensureAndroidNudgeChannel` (assuré uniquement si le projet a le
  coup de pouce activé). Le coup de pouce est programmé sur ce canal et reçoit
  `interruptionLevel: 'passive'` (iOS : livraison discrète, sans son ni réveil d'écran).
- Les rappels mensuels et les tests restent sur leurs canaux HIGH respectifs.
- API vérifiée contre **expo-notifications 57.0.3** (types installés : `AndroidImportance.LOW`,
  `InterruptionLevel = 'passive'` sur `NotificationContentInput`).
- Tests : `test-notifications` couvre le canal dédié, l'importance basse, le niveau passif, et
  vérifie que le rappel mensuel reste sur `CHANNEL_ID`.

### Vérifié
`tsc --noEmit` OK, **9 suites de tests vertes**. Canaux de notification non observables sur web
→ pas de vérif écran (à confirmer en validation native Android/iOS).

### Ensuite
- Les deux points de l'audit sont clos. Reste la validation native de Patrick (Android/iOS) :
  démarrage différé, mode libre, coup de pouce discret, gros montants FCFA, buckets.

---

## 2026-08-10 — Claude Code — Session 52 : buckets analytics ramenés à une base euro

Suite de l'audit (Session 51) : correction du point signalé sur `bucketAmount`, sur décision de
Patrick.

### Problème
`bucketAmount` a des seuils à l'échelle euro (0_50 / 50_100 / 100_250 / 250_plus) et
`normalizeMoney` ne convertit pas → tout versement FCFA réaliste tombait dans `250_plus`, rendant
la métadonnée `amountBucket` muette pour le marché FCFA/XOF (celui qui motive la V2).

### Fait
- `currency.ts` : `EUR_REFERENCE_RATE` (parité CFA fixe 655,957 ; USD ~1,1 ; EUR 1) +
  `amountInEurReference(amount, code)`. Taux **fixe et hors-ligne**, réservé au bucketing anonyme
  (jamais un affichage ni une conversion réelle).
- `actions.ts` : les deux `bucketAmount` (dépôt dans `confirmContribution`, retrait dans
  `withdraw`) bucketisent sur la valeur ramenée en euro (`withdraw` capture désormais la devise).
- `retention-queries.sql` : note explicative sur `amountBucket` (base euro commune, comparable
  entre devises). **Labels inchangés → aucune migration.**
- Tests : `test-currency` (base euro : FCFA/USD ramenés, repli devise inconnue) ; `test-balance`
  (seuils de `bucketAmount` verrouillés + normalisation devise vérifiée dans la source d'actions).

### Vérifié
`tsc --noEmit` OK, **9 suites de tests vertes**, `git diff --check` propre. Changement analytics
(métadonnée Supabase) non observable dans le navigateur → pas de vérif écran.

### Ensuite
- Décision de Patrick restante : canal Android du coup de pouce (importance HIGH vs canal dédié).
- Validation native (Android).

---

## 2026-08-10 — Claude Code — Session 51 : audit indépendant du Lot C (Codex)

Audit complet du travail de Codex sur le Lot C (`80349c7..abbd4e1`, ~1900 insertions,
37 fichiers) : mode épargne libre, écran d'estimation des dépenses, date de démarrage différée,
repère du lieu d'épargne, coup de pouce à mi-cycle.

### Vérifié
- **Mécanique** : `tsc --noEmit` OK, **9 suites de tests vertes**, `git diff --check` propre,
  écran projet rendu sans erreur console (web, store FCFA).
- **Logique cœur (`plan.ts`)** : `goalActivationDate = startDate ?? createdAt`, mode libre qui
  garde les dates de rappel mais met les montants conseillés à 0 (rituel conservé).
- **Analytics (`actions.ts`)** : `goal_created` envoie `activationDelayDays` (délai non
  financier) ; `test_notification` exclu du tracking ; `savingsLocation` jamais envoyé ; coup
  de pouce sans événement.
- **SQL (`retention-queries.sql`)** : activation ancrée sur `created_at + activationDelayDays`
  (sections 3, 3.b, 3.c, 4) ; splits pays (Gabon/FCFA vs France/EUR) et mode (guided/free, avec
  avertissement de ne jamais les agréger).
- **Notifications + `_layout.tsx`** : coup de pouce non interactif, filtré des rappels en
  attente ; son ouverture n'alimente ni `reminder_opened` ni `app_open`.
- **`new-goal.tsx`** : validation du démarrage différé robuste (startDate > aujourd'hui, cible >
  démarrage, premier rappel ≤ cible) ; mode libre sans budget imposé mais avec jour de rappel.

### Verdict
**Lot C conforme et propre.** Les trois pièges de mesure que j'avais signalés (démarrage
différé, épargne libre, coup de pouce) sont correctement fermés côté logique ET côté SQL.

### Signalé à Codex (EXCHANGES.md, non bloquant, non modifié)
- **[SUGGESTION] `bucketAmount` muet en FCFA/XOF** : les seuils sont à l'échelle euro et
  `normalizeMoney` ne convertit pas → tout versement FCFA tombe dans `250_plus`. La rétention
  n'est pas touchée, mais le signal `amountBucket` est perdu pour le marché cible. À trancher.
- **Observation design** : coup de pouce sur le canal Android HIGH `reminders` ; un canal
  distinct à importance plus basse collerait mieux à l'intention sobre.

### Ensuite
- Décision de Patrick sur les deux points ci-dessus.
- Validation native (Android) : démarrage différé, mode libre, coup de pouce, gros montants FCFA.

---

## 2026-08-10 — Codex — Session 50 : Lot C clos, coup de pouce à mi-cycle

### Fait
- Ajouté sur la fiche de chaque projet le réglage **Coup de pouce à mi-parcours**, désactivé
  par défaut et absent de la création. Le switch natif reste lisible à 375 px dans le cadre du
  rappel, pour un projet guidé comme libre ou planifié.
- Programmé un seul message local à 9 h au milieu calendaire entre deux ancres mensuelles. Un
  report ponctuel ne change pas sa date ; un démarrage différé interdit tout envoi anticipé.
- Le message est non-punitif, ne contient aucune catégorie d'actions et ouvre simplement le bon
  projet. Une ouverture normale de MMG l'efface sans afficher Fait / Modifier / Reporter.
- Étendu les identifiants natifs par cycle : désactiver le réglage, supprimer le projet ou
  solder le cycle annule aussi le coup de pouce correspondant. Un échec de ce message facultatif
  ne fait pas perdre l'identifiant d'un rappel mensuel déjà programmé.
- Protégé la mesure de rétention : ce message ne produit aucun événement propre ; son tap ne
  produit ni `reminder_opened` ni l'`app_open` du lancement correspondant.
- Aligné FEATURES, EXCHANGES, FEEDBACK, README, le guide de maintenance et la page
  Confidentialité. Le Lot C de la roadmap V2 est désormais entièrement implémenté.

### Vérifications
- **9 suites fonctionnelles**, TypeScript et `git diff --check` : OK.
- Export Expo Android complet : **1 700 modules**, bundle Hermes généré sans erreur.
- Parcours web à **375 × 812 px** : création d'un projet libre, fiche projet, libellés et
  alignement du switch vérifiés ; aucune erreur ni alerte console.
- Le contrôle web a créé un projet technique vers **23 h 17 CEST**. Par prudence, tout
  `goal_created` de ce créneau doit être considéré comme un événement de développement lors
  d'une future lecture de Supabase.

### Ensuite
1. Confirmer sur un build natif V2 l'activation/désactivation du switch et l'ouverture du bon
   projet depuis le message local.
2. Faire la seconde passe produit de Claude Code sur le Lot C complet avant de préparer les
   nouveaux builds Android et iOS.

---

## 2026-08-10 — Codex — Session 49 : validation produit du repère « Où ? »

### Fait
- Patrick valide l'emplacement du repère **Où ?** entre les montants et la progression : il
  suit naturellement la lecture **combien → où → avancement**.
- Aucun ajustement d'interface demandé avant la seconde lecture de Claude Code.
- Patrick a ensuite vérifié lui-même le rendu et l'interaction sur son téléphone Android :
  **conformes**. La validation native du repère est donc close.

### Ensuite
1. Recueillir la seconde lecture de Claude Code sur l'emplacement, sans bloquer la V2.
2. Cadrer avec Patrick le dernier item du Lot C avant de coder : rappel de milieu de mois
   activé par défaut ou non, date d'envoi et réglage global ou par projet.

---

## 2026-08-10 — Codex — Session 48 : repère facultatif du lieu d'épargne

### Fait
- Ajouté sous **Mis de côté** le bouton compact **Où ? Ajouter**, remplacé ensuite par le texte
  choisi par l'utilisateur. Cette information aide à distinguer plusieurs projets sans alourdir
  la carte de progression.
- Ajouté une fenêtre MMG à un seul champ, protégée du clavier, acceptant librement un compte,
  un support mobile money ou des espèces. Une valeur vide retire le repère.
- Le champ facultatif `savingsLocation` est persisté sur le projet existant, sans modifier le
  parcours de création, le plan, les rappels ou les anciens projets.
- Choisi la saisie libre pour rester compatible avec tous les pays sans entretenir une liste
  incomplète de banques et d'opérateurs.
- Confidentialité protégée : le repère reste dans AsyncStorage et aucun événement analytics ne
  le contient. FEATURES, FEEDBACK, EXCHANGES, README et la page Confidentialité sont alignés.

### Vérifications
- **9 suites fonctionnelles**, TypeScript et `git diff --check` : OK.
- Export Expo web complet : **12 routes statiques générées** — OK.
- Tests ajoutés : absence du champ dans la création, affichage **Où ?**, persistance typée,
  fenêtre à champ unique, protection clavier et mention locale.
- Le serveur web a compilé sans erreur. L'inspection visuelle 375 px n'a pas pu être achevée :
  le navigateur intégré n'a pas chargé l'URL locale depuis son onglet de contrôle. À confirmer
  dans le navigateur ou sur le prochain build natif avant livraison publique.

### Ensuite
1. Validation visuelle du repère **Où ?** sur une fiche projet étroite, puis sur Android/iOS.
2. Validation native groupée du reste de la V2 lors du prochain build neuf.

---

## 2026-08-10 — Codex — Session 47 : Lot C, date de démarrage différée

### Fait
- Ajouté à la création le choix facultatif **Dès maintenant / Plus tard**, commun aux plans
  guidés et aux projets libres. Une date future doit rester antérieure à la date cible.
- Le premier cycle et le premier rappel sont calculés à partir du démarrage choisi. Un
  changement ultérieur du jour mensuel ne peut pas reconstruire une ancre avant cette date.
- Avant l'activation, l'écran projet affiche **Prévu le…**, le premier rappel régulier et un
  état sans bouton de versement ou de report. Les projets existants sans `startDate` gardent
  exactement leur comportement immédiat.
- La vérification trimestrielle et les propositions d'échéancier utilisent aussi le vrai point
  de départ du projet.
- Protégé la mesure : `goal_created` envoie uniquement `activationDelayDays`, jamais la date
  exacte. Toutes les requêtes de rétention choisissent le démarrage effectif le plus ancien,
  y compris si un second projet immédiat est créé après un premier projet différé.
- Page Confidentialité, FEATURES, FEEDBACK, EXCHANGES et README mis en cohérence.

### Vérifications
- **9 suites fonctionnelles**, TypeScript et `git diff --check` : OK.
- Export Expo web complet : **12 routes statiques générées** — OK.
- Tests ajoutés : compatibilité legacy, activation au jour choisi, délai de 66 jours, aucune
  échéance avant le démarrage, changement d'ancre protégé et contrôle de solde à J+90.
- Parcours web à 375 px : choix **Plus tard**, champ `JJ / MM / AAAA`, aide « Aucun rappel… »
  et disposition mobile vérifiés. Aucun projet test n'a été sauvegardé.

### Ensuite
1. Validation native V2 lors du prochain build neuf (pays/devise, mode libre, estimation et
   démarrage différé).
2. Dernier item du Lot C, seulement après décision produit : rappel de milieu de mois sobre,
   basse fréquence et désactivable.

## 2026-08-10 — Codex — Session 46 : Lot C, estimation facultative des dépenses

### Fait
- Ajouté sous **Dépenses variables** une aide facultative, sans nouvelle étape obligatoire.
- La fenêtre décompose une moyenne mensuelle en alimentation, transport, santé, loisirs et
  autres dépenses variables. Elle rappelle de ne pas recompter les charges fixes.
- Le total se calcule en direct dans la devise active et ne remplace la dépense variable qu'au
  clic sur **Utiliser ce total**. Les catégories servent uniquement au calcul à l'écran : seul
  le total rejoint le budget existant, sans nouveau stockage ni donnée analytics.
- Réutilisé le formatage monétaire partagé et la protection clavier de MMG.

### Vérifications
- TypeScript, **9 suites fonctionnelles** et `git diff --check` : OK.
- Parcours web mobile 375 px : ouverture de la fenêtre, total `1 500 €`, saisie `1 350` avec
  groupement des milliers, validation et retour au budget avec `1 500` — OK.

### Ensuite
1. Lot C : date de démarrage différée, avec compatibilité des anciens projets.
2. Ancrer sa lecture de rétention sur la date d'activation choisie, jamais sur `goal_created`.

## 2026-08-10 — Codex — Session 45 : milliers lisibles pendant la saisie en euros

### Fait
- Étendu le regroupement visuel des milliers à **toutes les devises**, et plus seulement aux
  monnaies sans centimes : une saisie euro `2500` s'affiche désormais `2 500` immédiatement.
- Préservé la saisie décimale en français : `2500,50` devient `2 500,50`. Le point produit par
  certains claviers est accepté et affiché comme une virgule, sans changer la valeur enregistrée.
- Le même formateur partagé couvre budget, création et ajustement de projet, versement libre et
  confirmation du solde réel. Aucun écran monétaire n'a de logique divergente.

### Vérifications
- Tests unitaires ajoutés pour EUR/USD : milliers, virgule en cours de frappe, point du clavier,
  limite à deux décimales, zéros initiaux et montant commençant par une virgule.
- **9 suites fonctionnelles vertes**, `npx tsc --noEmit` et `git diff --check` réussis.

### Ensuite
1. Validation visuelle native lors du prochain build V2.
2. Reprendre le Lot C : estimation optionnelle des dépenses, puis date de début différée.

## 2026-08-10 — Codex — Session 44 : accueil lisible + mode épargne libre

### Fait
- Reprise de la branche `v2` après la session 43 de Claude Code, en préservant et en intégrant
  sa note de passation locale dans `EXCHANGES.md`.
- Le titre du choix initial de pays devient **« Où épargnes-tu ? »**. Contrôle réel à 320 px :
  police 25 px, hauteur 31 px pour une ligne de 31 px, sans réduction ni troncature.
- Lot C — **épargne libre** : nouvel écran avant chaque création avec deux cadres explicites,
  **Plan guidé** (budget + mensualités) et **Épargne libre** (revenus irréguliers, aucun budget
  ni montant imposé, rappel mensuel conservé). Un même utilisateur peut mélanger les modes.
- Les projets existants sans `savingsMode` restent guidés. Les projets libres gardent cible,
  progression, historique, cycles, reports, solde réel et notifications, mais sont exclus de
  la capacité budgétaire et des réajustements automatiques.
- Sur un rappel libre, **Fait** ouvre la saisie du montant réel au lieu d'enregistrer zéro.
  L'écran projet et l'échéancier affichent **Montant libre** ; la confirmation conserve la
  prochaine date sans inventer de mensualité.
- `goal_created` porte désormais `savingsMode`. La requête de rétention 90 jours est séparée
  par mode afin de ne pas comparer directement revenus réguliers et irréguliers.
- Raccord corrigé : après un premier projet libre sans budget, choisir ensuite un plan guidé
  conduit bien de la saisie du budget à la création, sans retour parasite.

### Vérifications
- TypeScript : OK.
- **9 suites fonctionnelles** : devise, change, format, saisies, notifications, cycles/report,
  solde (dont exclusion du libre), analytics et design — toutes vertes.
- Export Expo web : **12 routes**, dont `/onboarding/mode` — OK.
- Parcours navigateur à 375 px : choix libre → projet FCFA `2 500 000` → étape Rappel → récap
  sombre « Montant libre » et CTA « Créer le projet » — OK, sans sauvegarder le projet test.
- `git diff --check` : OK.

### Ensuite
1. Validation native V2 du choix pays/devise et des rappels libres sur un futur build neuf.
2. Lot C restant : écran optionnel d'estimation des dépenses, puis date de début différée en
   ancrant la rétention sur la date d'activation choisie et non sur `goal_created`.

---

## 2026-08-10 — Claude Code — Session 43 : affichage des très gros montants FCFA

### Contexte
Patrick a signalé que les montants > 100 000 000 FCFA étaient mal gérés à l'affichage, et
plus précisément que **l'en-tête « Mis de côté / restants » se décalait** dès qu'on renseignait
un montant mis de côté lui-même élevé (deux gros nombres côte à côte).

### Fait
- **Helper `fitFontSize(text, base)`** ajouté dans `src/lib/format.ts` : taille de police
  déterministe fonction de la longueur (≤10 car. = base ; sinon `base×10/len`, plancher à 50 %).
  Nécessaire car `adjustsFontSizeToFit` est **ignoré sur react-native-web** (il tronquait avec
  « … » au lieu de rétrécir). Déterministe web ET natif.
- **Écran projet `goal/[id].tsx`** : le bloc d'en-tête passe d'une **disposition à deux colonnes**
  (montant à gauche / restant-cible à droite) à une **disposition verticale** — le gros montant
  « mis de côté » occupe toute la largeur (avec `fitFontSize`, base 36, une ligne), les infos
  secondaires (« X restants · sur Y ») passent en petit en dessous. Cause racine : deux gros
  nombres ne tiennent jamais côte à côte sur 375 px.
- **Carte « Montant conseillé »** et **overlay de confirmation** : `fitFontSize` appliqué
  (bases 38 et 52) pour éviter que « FCFA » ne casse sur deux lignes.
- **Test** : couverture `fitFontSize` ajoutée à `scripts/test-format.mjs` (cas euro intacts,
  rétrécissement FCFA, plancher). 9 suites vertes, `tsc --noEmit` OK.

### Vérifié à l'écran (web, store Gabon/FCFA, objectif 150 000 000, mis de côté 12 187 500)
- « Mis de côté » → **« 12 187 500 FCFA » sur une seule ligne**, pleine largeur, plus aucune
  troncature ; « 137 812 500 FCFA restants · sur 150 000 000 FCFA » lisible en dessous.
- « Montant conseillé » → **« 11 197 266 FCFA » sur une ligne**. Décalage disparu.
- **Non-régression euro** vérifiée (objectif 3 500 €) : disposition verticale propre, même
  plus lisible.

### Ensuite
- Validation native de Patrick (le rétrécissement natif via `adjustsFontSizeToFit` est en plus).
- Lot C : mode épargne libre ⭐⭐, écran d'estimation des dépenses, date de début différée ⭐.

---

## 2026-08-XX — Claude Code — Session 42 : vérification indépendante du Lot A (Codex)

### Vérifié (lecture seule pendant l'intervention de Codex, puis contrôle complet après)
- **9 suites de tests vertes**, `tsc --noEmit` OK, `git diff --check` propre.
- **Parcours à l'écran (web, store vierge)** :
  - Premier lancement → écran **« Dans quel pays épargnes-tu ? »** : pré-rempli depuis la
    locale (🇫🇷 France · Euro), **1 tap Continuer**, **Changer** ouvre la liste groupée par
    région. Conforme à la décision « premier lancement minimal ».
  - Choix **Gabon → Franc CFA** → tout s'affiche en **FCFA sans décimales** (« 3 500 FCFA »,
    « 480 FCFA / mois »…). ✓
  - Cosmétique embarquée : **« Le 1er du mois »** ✓, accueil **« Un projet, un geste par
    mois. »** (virgule) ✓.
  - Vocabulaire générique : **« mets cette somme de côté avec ton moyen habituel »** ✓.
  - **Aucune erreur console.**
- **Architecture saine** : hook `use-money.ts` (formateur réactif via le store), gating pays
  dans `index.tsx` (redirection `/onboarding/country` si pays absent), `convertMoney`/
  `normalizeMoney` + flux de conversion (parité CFA hors-ligne, taux EUR/USD via API sans
  envoi de montant).

### Constat (polish, non bloquant — noté dans FEEDBACK.md)
- L'écran **Exemple** réutilise les chiffres euro relabellés en FCFA (« 3 500 FCFA » ≈ 5 €),
  magnitude irréaliste pour un public gabonais. À localiser (chiffres adaptés par devise)
  pour la crédibilité. Cosmétique, à grouper.

### Verdict
Lot A **conforme et propre**. Reste : validation native de Patrick sur téléphone
(1er lancement + conversion de devise) et vidéos une fois le FCFA en main.

---

## 2026-08-10 — Codex — Session 41 : saisie FCFA sécurisée + conversion explicite

### Fait
- Le tunnel Expo temporaire utilisé pour diagnostiquer le simulateur cloud a été coupé dès que
  Patrick a choisi de poursuivre sur le navigateur. Le dev client iOS V1 ne contient pas le
  nouveau module natif `ExpoLocalization` : un build V2 neuf sera donc nécessaire pour la
  future validation native ; aucun nouveau build ni aucune nouvelle session payante lancés.
- Ajouté le regroupement visuel des milliers pendant la frappe dans les devises sans centimes :
  `2500000` devient `2 500 000` sur le budget, les projets, les versements et le solde réel.
  Les espaces restent purement visuels et le parseur conserve la valeur numérique exacte.
- Remplacé l'ancien changement d'unité sans conversion par un choix explicite : **Convertir mes
  montants** ou **Garder les mêmes valeurs**. Le taux est affiché, modifiable et accompagné
  d'un aperçu construit à partir d'une valeur réelle déjà présente dans l'app.
- La conversion explicite couvre atomiquement le budget, les objectifs, l'historique des
  versements, les soldes confirmés et leurs répartitions, avec arrondi selon la devise cible.
  Les rappels sont recréés ensuite à partir des montants convertis.
- La parité EUR/XAF/XOF reste disponible hors ligne (`1 EUR = 655,957 FCFA`). Pour USD, MMG
  récupère uniquement la paire EUR/USD de la BCE via Frankfurter, avec délai maximal et repli
  sur une saisie manuelle ; aucun montant personnel n'est transmis.
- Confidentialité, CGU, FEATURES, README, guide de maintenance et tests mis en cohérence.

### Vérifications
- TypeScript : OK.
- **9 suites fonctionnelles** : devise, change/conversion complète, format, saisies, design,
  notifications, cycles/report, solde et analytics — toutes OK.
- Parcours navigateur réel : budget EUR créé, changement France → Gabon, taux fixe affiché,
  aperçu `2 000 € → 1 311 914 FCFA`, conversion appliquée puis budget entièrement visible en
  FCFA — OK. Le taux manuel a recalculé l'aperçu immédiatement et l'option de conservation a
  correctement masqué la conversion.
- Appel réseau réel XAF → USD : taux BCE récupéré via Frankfurter, source/date affichées et
  aperçu recalculé — OK. Une première tentative avec `expo/fetch` a échoué sur web ; remplacée
  avant livraison par le `fetch` standard Expo/React Native, vérifié dans le navigateur.
- Export Expo web complet : 11 routes générées, dont `/onboarding/country` — OK.
- `git diff --check` : OK.

### Ensuite
1. Confirmer plus tard la saisie et la conversion sur un build natif V2 neuf.
2. Le Lot C reste différé jusqu'aux retours de vrais utilisateurs inconnus.

---

## 2026-08-10 — Codex — Session 40 : Lot A, devises câblées + choix du pays

### Fait
- Reprise sur la branche **`v2`**, sans modification de `main` ni de la V1 taguée.
- Corrigé la compatibilité typographique de `formatMoney()` : l'euro reproduit maintenant
  réellement la V1 (espaces fines insécables pour les milliers, espace insécable avant le
  symbole). Le même rendu lisible est appliqué à EUR, XAF, XOF et USD.
- Branché la devise active sur **toutes les surfaces monétaires** : budget, création et
  ajustement d'un plan, écran projet, historique, menus, versements, solde réel,
  rééquilibrage, confirmation, exemple pédagogique et notifications normales/de test.
- Ajouté `useMoney()` comme point d'accès réactif commun au code de devise, au symbole de
  saisie et au formateur. Les libellés figés `EUR` ont disparu des champs.
- Généralisé `parseAmountInput()` : accepte `€`, `FCFA`, `$`, EUR/XAF/XOF/USD et respecte la
  précision de la devise (aucun centime XAF/XOF).
- Normalisé aussi les versements rapides au moment de leur enregistrement : un montant de plan
  calculé avec des décimales ne peut pas créer de centimes invisibles en FCFA.
- Étendu les tests de format pour couvrir les espaces Unicode, les symboles et l'arrondi FCFA.
- Ajouté `expo-localization ~57.0.1` (module officiel SDK 57 + config plugin) et l'écran
  `onboarding/country` : pays prérempli depuis `getLocales()[0].regionCode`, proposition
  compacte confirmable en un appui, et liste accessible organisée par devise seulement après
  un appui sur **Changer**.
- L'absence de pays après hydratation déclenche ce choix avant l'aiguillage habituel. Le menu
  propose ensuite **Pays et devise** pour le modifier.
- Un changement après création de données avertit qu'il ne convertit pas les montants. Il
  reprogramme les rappels locaux afin que leurs textes utilisent immédiatement la devise
  choisie.
- `app_open` attend désormais la confirmation du pays et n'est envoyé qu'une fois par
  lancement ; `app_open` et `goal_created` portent `country` + `currencyCode` sans montant
  financier ni donnée identifiante.
- `scripts/retention-queries.sql` ajoute la répartition des installations et la rétention à
  90 jours **par pays**, en conservant `legacy_inconnu` pour les événements V1. La page
  Confidentialité, FEATURES, README et le guide de maintenance décrivent cette donnée.
- Le vocabulaire d'action est désormais multi-pays : l'exemple et les textes utilisateur
  parlent de mise de côté avec le moyen habituel, sans supposer un virement bancaire. Les
  mentions de banque restent seulement pour la réassurance et le cadre juridique.
- Lot B terminé : `formatReminderDay()` affiche **1er** uniquement le premier jour du mois sur
  le récapitulatif, l'écran projet et l'ajustement ; l'accueil devient « Un projet, un geste
  par mois. ».

### Vérifications
- `npx tsc --noEmit` : OK.
- 8 suites fonctionnelles : devises, formats, notifications, surfaces de saisie, cycles/report,
  solde, analytics et design — **toutes OK**.
- Export Expo web complet : **11 routes générées**, dont `/onboarding/country`.
- Parcours rejoué dans le navigateur en viewport téléphone : détection initiale, sélection
  **Gabon / XAF**, récapitulatif FCFA, validation puis redirection vers l'accueil — **OK**.
- `git diff --check` : OK.
- `expo lint` n'est pas disponible dans ce dépôt (aucune configuration ESLint installée) ;
  Expo a tenté de proposer l'installation hors ligne, sans modifier `package.json`.
- Le contrôle natif Android reste à confirmer : ADB est disponible sur le Mac, mais aucun
  appareil n'était connecté au moment de cette session. Aucun build EAS V2 n'a été lancé.

### Ensuite
1. Confirmer le parcours réel Android dès qu'un appareil est connecté.
2. Préparer les builds V2 seulement après validation de Patrick ; le Lot C reste différé
   jusqu'aux retours de vrais utilisateurs inconnus, conformément à la roadmap.

---

## 2026-08-XX — Claude Code — Session 39 : ouverture V2 + fondation devises (Lot A démarré)

### Contexte / décisions
- **Fin du gel « euro »** : le test de rétention euro ne tourne pas faute de recrues ;
  la traction réelle vient du **Gabon** (réseau Facebook). Décision Patrick : **expansion
  multi-devises / multi-pays** (on GARDE l'euro, on AJOUTE) — pas un pivot. Détails et brief
  séquencé dans EXCHANGES.md ([DÉCISION] V2).
- **V1 sauvegardée** : tag **`v1.0.0`** poussé sur GitHub (point de retour permanent).
  Développement V2 sur la branche **`v2`**.

### Fait (cette session)
- Créé la branche `v2` (poussée).
- **Fondation du système de devises** — `src/lib/currency.ts` (autonome, sans import pour
  rester testable comme les autres modules) : `CurrencyCode` (EUR/XAF/XOF/USD), table
  `CURRENCIES` avec **décimales par devise** (0 pour le FCFA), `formatMoney()` reproduisant
  **exactement** le rendu V1 pour l'euro, liste `COUNTRIES` (starter) + `defaultCurrencyForCountry()`.
- Store (`src/lib/store.ts`) : ajout `country?` + `currencyCode` (défaut EUR) + `setLocale()`.
  Compatible utilisateurs existants (merge zustand/persist → EUR par défaut, aucune migration).
- `format.ts` **laissé intact** (`formatEuro` = V1) pour ne rien casser ; migration vers
  `formatMoney` = câblage à venir (Codex).
- Test `scripts/test-currency.mjs` (+ `npm run test:currency`) : rendu V1 euro, FCFA sans
  centimes, repli, pays→devise. **Les 8 suites passent**, tsc OK.

### Ensuite (Lot A — reste à faire, voir brief EXCHANGES.md)
1. **Câbler `formatMoney(x, currencyCode)`** partout où `formatEuro` est utilisé (écrans,
   notifications, plan-summary…) + généraliser `parseAmountInput` (retirer € / FCFA / $).
2. **Sélecteur de pays au 1er lancement** : pré-rempli depuis la locale de l'appareil, 1 tap
   pour confirmer (garder l'écran minimal), pilote devise + vocabulaire. Appelle `setLocale`.
3. **Envoyer le `country` dans les métadonnées analytics** (`app_open` / `goal_created`) →
   rétention lisible par pays (bonus mesure, donnée grossière non personnelle).
4. **Vocabulaire générique / par pays** (« mets de côté » plutôt que « vire depuis ta banque »).

---

## 2026-08-09 — Codex — Session 39 : diffusion sur le profil Facebook de Patrick

- **2026-08-09 vers 12:53 CEST** : Patrick a publié MMG en visibilité publique sur son
  profil Facebook personnel, avec un visuel réel de l'application et les deux accès directs :
  Release Android GitHub et lien public TestFlight iPhone.
- Le message est personnel et transparent : Patrick se présente comme créateur, explique le
  rituel mensuel et demande aux contacts de transmettre MMG à une personne ayant réellement
  un projet d'épargne. Aucune devise ni limitation géographique n'est suggérée, afin de laisser
  remonter spontanément les besoins de marché.
- Population : réseau personnel et réseau de second niveau, donc plus digne de confiance que
  les publications génériques mais **mixte**. Ce canal est une acquisition d'appoint ; il ne
  doit pas être confondu seul avec la cohorte budget pour une décision de rétention.
- Cette publication constitue la première diffusion publique simultanée des accès Android et
  iPhone. Aucun code produit n'a été modifié et le gel des fonctionnalités reste en vigueur.

## 2026-08-09 — Claude Code — Session 38 : lien public TestFlight approuvé (iOS débloqué)

### Fait
- La Beta App Review externe est **approuvée** (~2 semaines d'attente, backlog Apple 2026).
  Lien public iOS actif : **https://testflight.apple.com/join/SJ9XBTxZ** (build 1.0.0 (4)).
- Les deux canaux sont désormais disponibles pour les communautés budget.

### ⚠️ ÉCHÉANCE CRITIQUE — rebuild iOS avant expiration du build 4
- Le build 4 **expire dans ~73 jours**. Or le test de rétention dure ~90 j PAR utilisateur.
- Quand un build TestFlight expire, les testeurs **ne peuvent plus ouvrir l'app** tant qu'ils
  ne passent pas à un build plus récent → ils sortiraient de la mesure **pile autour du 3e
  rappel** (le moment décisif). Donnée locale conservée, mais app inutilisable.
- **ACTION** : prévoir un nouveau build iOS (+ resoumission TestFlight) **avant** cette
  expiration — vers J+55/60 pour garder de la marge. Y embarquer le lot cosmétique en attente
  (« le 1er », ponctuation accueil — cf. FEEDBACK.md) : build gratuit, aucune churn réactive.

### Ensuite (Codex)
- Ajouter le lien iOS aux posts des communautés **budget** (« sur iPhone → TestFlight »).
- **Dater le lancement iOS** dans le tableau de chronologie (cohorte décision).

## 2026-08-02 — Codex — Session 37 : refus de publication par r/vosfinances

- **2026-08-02 à 07:19 CEST** : la modération de `r/vosfinances` a refusé la demande
  d'autorisation après avoir examiné le texte complet proposé.
- Motif communiqué : la communauté n'autorise pas ses utilisateurs à partager des outils,
  même lorsqu'ils ne sont pas encore commerciaux, afin d'éviter que le subreddit devienne
  un espace de promotion au détriment des échanges entre utilisateurs.
- Décision : ne pas publier, ne pas contourner la règle et ne pas contester le refus.
  `r/vosfinances` est retiré des canaux à venir.
- Cette conversation de modération n'est pas un lancement public et ne constitue aucune borne
  de cohorte dans Supabase. Aucun code produit n'a été modifié.

## 2026-08-01 — Codex — Session 36 : lancement Facebook de la cohorte budget

### Publications effectuées
- **2026-08-01 à 20:47 CEST** — publication soumise dans le groupe Facebook public
  **« GÉRER SON BUDGET : Astuce, recette, comparaison, coaching »** (environ 6,9 K membres),
  avec un visuel montrant réellement l'application MMG et le lien direct vers la Release
  Android. Le message présente Patrick comme créateur, MMG comme un outil fini et gratuit,
  et rappelle l'absence de connexion bancaire, de compte MMG et de publicité.
  Statut : **en attente d'approbation par un administrateur** ; cette soumission ne démarre
  pas encore une borne de cohorte dans Supabase.
  **2026-08-01 à 21:00 CEST** : texte modifié pendant l'attente pour adopter le même ton
  chaleureux et personnel que la seconde publication, sans créer de doublon et sans changer
  l'image, le lien Android ni le statut de validation.
  Publication en attente :
  <https://www.facebook.com/groups/787110589432740/pending_posts/1569614567849001/>.
- **2026-08-01 à 20:52 CEST** — publication au ton chaleureux mise en ligne dans le groupe
  Facebook public **« Enveloppes budgétaires - Conseils gestion de budget »** (environ
  3,1 K membres), avec le même visuel de l'application et le lien direct vers la Release
  Android. Le texte part du vécu de Patrick, explique simplement le rituel mensuel de MMG et
  invite à des retours francs, sans employer « recherche de testeurs », sans formulaire et
  sans engagement artificiel.
  Statut : **publiée et visible publiquement** :
  <https://www.facebook.com/groups/1376187369477505/posts/2584490881980475/>.

### Cohorte et garde-fous
- La publication visible de **20:52 CEST** est le premier lancement Facebook auprès d'une
  population directement intéressée par le budget et l'épargne : elle appartient à la
  **cohorte de décision** pour la mesure de rétention.
- Le lien TestFlight n'a pas été diffusé : la validation Apple du build externe reste en
  attente. Seule la Release Android déjà vérifiée a été partagée.
- Aucun code produit n'a été modifié ; le gel des fonctionnalités est maintenu.

## 2026-07-31 — Codex — Session 35 : lancement de la cohorte budget

### Principe appliqué
- La cohorte `r/BetaTests` + Discord reste réservée au **rodage technique** et ne doit pas
  être utilisée pour la décision de rétention.
- Les canaux budget recrutent des **utilisateurs réels** : MMG est présenté comme un outil
  fini et utilisable, sans appel à « tester pendant trois mois », sans engagement à réagir aux
  rappels et sans formulaire d'inscription. Les liens sont directs.
- Aucun code produit n'est modifié : gel des fonctionnalités maintenu.

### MoneyVox — autorisation en attente, pas encore de lancement
- **2026-07-31 à 15:51 CEST** : lecture de la charte officielle. L'article 5 interdit les
  contributions commerciales, publicitaires ou prospectives ; aucune publication publique
  n'a donc été faite sans accord préalable.
- Demande d'autorisation envoyée via le formulaire officiel de contact à la
  rédaction/modération, sous l'identité de Patrick NGOUALA et avec
  `mymoneygest@gmail.com`. Le site a confirmé : « Votre message a été envoyé ! ».
- Le message décrit MMG comme une application française gratuite et finie, sans connexion
  bancaire, sans compte MMG ni publicité. Il propose un sujet transparent, sans formulaire de
  recrutement, et précise que le lien iPhone ne sera ajouté qu'après validation Apple.
- **Important** : cette demande ne démarre pas la cohorte de décision. La chronologie des
  canaux ci-dessous ne recevra une date MoneyVox qu'après publication publique autorisée.

### r/vosfinances — autorisation refusée, aucun lancement
- **2026-07-31 à 15:54 CEST** : la règle interdisant toute publicité ou promotion a été
  respectée ; aucune publication publique n'a été faite.
- Demande d'autorisation envoyée aux modérateurs depuis le compte Reddit `u/L-45-VY`.
  Le message annonce Patrick comme créateur, présente MMG comme un outil fini et demande
  l'accord pour un sujet unique avec lien direct, sans formulaire ni engagement de test.
- **2026-07-31 à 15:57 CEST** : réponse de la modération demandant le texte complet afin
  que l'équipe puisse l'étudier.
- **2026-07-31 à 21:13 CEST** : texte exact transmis dans le modmail. Il présente MMG comme
  un outil fini, gratuit et sans publicité, annonce Patrick comme créateur, décrit la méthode
  manuelle et la confidentialité, et fournit uniquement la Release Android. Aucun formulaire,
  engagement de test ou lien iPhone non validé n'est inclus.
- **2026-08-02 à 07:19 CEST** : demande refusée. La modération n'autorise pas le partage
  d'outils, même non encore commerciaux, en raison du volume de demandes et du risque de
  transformer le subreddit en espace de promotion.
- Statut final : **refusé**. Aucune publication ne sera tentée et cette conversation privée
  ne constitue pas un lancement ni une borne Supabase.

### Distribution Android directe prête
- **2026-07-31 vers 16:00 CEST** : publication de la préversion GitHub
  **MMG — bêta Android 1.0.0** :
  <https://github.com/MyMoneyGest/MMG-LAB/releases/tag/android-beta-v1.0.0>.
- APK direct :
  <https://github.com/MyMoneyGest/MMG-LAB/releases/download/android-beta-v1.0.0/MMG-beta-Android-1.0.0.apk>.
- La Release pointe sur le commit exact du build `9f332d1d647bdb36408f615836173326134a0bb3`,
  pas sur les commits de documentation ultérieurs. L'APK publié fait 104 966 577 octets.
- La page affiche l'empreinte SHA-256 vérifiée, le build EAS source, les conditions de
  confidentialité et l'avertissement d'installation hors Play Store.
- Cette mise à disposition technique ne démarre pas à elle seule la cohorte budget : seule
  la première diffusion publique dans un canal budget déclenchera la borne Supabase.

### Canaux écartés ou non directement publiables
- `r/EconomiserArgent` n'existe pas : Reddit affiche « Nous n'avons pas trouvé cette
  communauté ». Aucun canal de remplacement non qualifié n'est ajouté.
- La finance pour tous n'a pas de forum ni de publication communautaire directe. Son
  formulaire de contact est le seul point d'entrée pertinent pour demander un relais.
- Les groupes Facebook restent à sélectionner après connexion au compte Facebook de Patrick.

### Ensuite
- Attendre la réponse MoneyVox avant toute publication sur ce forum.
- Envoyer la demande de relais à La finance pour tous après validation manuelle du reCAPTCHA.
- Suivre les deux publications Facebook déjà soumises et ne sélectionner d'autres groupes
  budget/épargne que si leurs règles autorisent ce type de partage.

## 2026-07-31 — Claude Code — Session 34 : chronologie de lancement + garde-fou cohortes

### Chronologie des canaux (à tenir à jour — sert à SÉPARER les cohortes dans Supabase)
L'app ne tague pas la source d'installation → la **date de lancement de chaque canal** est le
seul moyen d'isoler les populations. Tenir cette liste précise.

| Date | Canal | Population | Usage pour la mesure |
|------|-------|-----------|----------------------|
| ~2026-07-31 | Reddit **r/BetaTests** + son Discord (APK Android) | Testeurs / early-adopters | ⚠️ **Rodage technique uniquement** — PAS la cohorte de décision |
| 2026-08-02 à 07:19 CEST (refus modération, non publié) | Reddit **r/vosfinances** | Communauté finances personnelles visée, mais non atteinte | ❌ Aucun lancement — exclu de toute mesure |
| 2026-08-01 à 20:47 CEST (soumise, non visible) | Facebook — **GÉRER SON BUDGET : Astuce, recette, comparaison, coaching** | Épargnants intéressés par le budget | ⏳ Approbation admin en attente — ne démarre pas encore la cohorte |
| 2026-08-01 à 20:52 CEST | Facebook — **Enveloppes budgétaires - Conseils gestion de budget** | Utilisateurs budget / enveloppes budgétaires | ✅ **Cohorte de décision** — première borne Facebook publique |
| 2026-08-09 vers 12:53 CEST | Profil Facebook public de Patrick — Android + TestFlight iPhone | Réseau personnel et second niveau, population mixte | ⚠️ Acquisition d'appoint — interpréter séparément de la cohorte budget |
| à venir | MoneyVox, autres groupes FB budget | Épargnants budget (cible brief §5) | ✅ **Cohorte de décision** rétention |

### Garde-fou (rappel Claude Code)
- r/BetaTests = population non représentative (le brief §5 l'excluait explicitement). Sens du
  biais : churn rapide → rétention **artificiellement basse** → risque de **faux négatif**.
- **La décision go/no-go (seuils 40 %/20 %) doit se lire sur la cohorte budget**, pas sur
  r/BetaTests. Éviter Hardware.fr (tech, même biais) ; prioriser MoneyVox (post déjà rédigé) +
  communautés budget.
- Au moment de l'analyse : filtrer par `created_at` >= date du lancement budget pour isoler la
  bonne cohorte (cf. `scripts/retention-queries.sql`).

### Ensuite
- Lancer les canaux budget et **noter leur date exacte ici**.

## 2026-07-31 — Codex — Session 33 : préparation du recrutement bêta public

### Fait
- Vérifié les canaux proposés pour le recrutement : `r/vosfinances` interdit
  l'autopromotion sans exception explicite de la modération ; chaque communauté devra recevoir
  un message adapté et non un copier-coller massif.
- Identifié le dernier APK réellement distribuable : build EAS Android `1baebe04`, profil
  `preview`, créé depuis `9f332d1` après la désactivation du rappel de test en production.
- Téléchargé l'APK sous
  `/Users/patrickngouala/Downloads/MMG-beta-Android-1.0.0.apk`, vérifié son intégrité et calculé
  son SHA-256 :
  `5eb46a303b8a84cf24abd863a065ea7ed43d1ac07badc7a83d5ff0613530092e`.
- Confirmé que le dépôt `MyMoneyGest/MMG-LAB` est public et ne contient encore aucune Release.
- Créé `BETA-RECRUTEMENT.md` : structure complète du formulaire Tally, notice de
  confidentialité, fiche de Release Android, message aux modérateurs et variantes de
  publication forum/Reddit.
- Créé, fait valider puis publié le formulaire Tally de recrutement :
  `https://tally.so/r/vGVapv`.
- Vérifié le lien public comme un testeur : contenu, champs obligatoires, plateforme,
  consentement et notice de confidentialité sont correctement affichés.
- Précisé dans le formulaire publié que les testeurs iPhone doivent fournir l'adresse e-mail
  associée au compte Apple utilisé sur leur appareil ; nouvelle version vérifiée sur le lien
  public et règle reportée dans `BETA-RECRUTEMENT.md`.
- Vérifié les règles actuelles des autres canaux : MoneyVox interdit la prospection et les
  publications publicitaires, `r/AskFrance` interdit explicitement l'autopromotion et les
  panels de test, et `r/FranceFinance` est en publication restreinte.
- Sélectionné `r/BetaTests`, communauté qui accepte explicitement les appels à bêta-testeurs,
  puis publié avec le compte `u/L-45-VY` un message en anglais précisant que MMG est une
  application en français et recherche des testeurs francophones :
  `https://www.reddit.com/r/betatests/comments/1vbnmim/opportunity_frenchspeaking_android_testers_wanted/`.
- La publication Reddit est créée mais reste en attente de validation par la modération de
  `r/BetaTests`.
- Rejoint le Discord officiel `BetaTests Community` avec le compte `l45vy_01133`, accepté les
  règles et sélectionné les rôles Android et iOS.
- Vérifié les règles de `#post-your-product-here` : formulaires d'inscription autorisés, tous
  les liens doivent être présents et non masqués dans le message, aucun renvoi en message
  privé, une seule application par publication et mode lent de 6 heures.
- Publié le message MMG dans `#post-your-product-here` sous le nom `l45vy`, en précisant que
  l'application est en français, que les testeurs recherchés sont francophones et en incluant
  directement le formulaire Tally :
  `https://discord.com/channels/1405234773449773077/1412101252317184184`.

### En cours
- Préparation de la Release GitHub Android avec l'APK vérifié et attente de la validation du
  message `r/BetaTests` par la modération ; recrutement également lancé sur Discord.

### Ensuite
- Créer la Release GitHub `android-beta-v1.0.0` avec l'APK et son SHA-256.
- Vérifier la validation de la publication `r/BetaTests`, puis traiter les premières
  candidatures Tally.

## 2026-07-23 — Claude Code — Session 32 : rappel de test réservé au dev (anti-pollution du vrai plan)

### Fait
- Problème repéré par Patrick : la notification de test (appui long sur le M) appelait la
  **vraie** `confirmContribution` sur « Fait » → enregistrait un vrai dépôt, soldait le cycle
  et reprogrammait le vrai rappel. Le marquage `test_notification` ne protégeait QUE Supabase
  (mesure), pas le plan réel de l'utilisateur.
- Correctif : le déclencheur de test (appui long sur le M) est désormais **réservé aux builds
  de développement** (`__DEV__`). En production, le M reste un simple élément de marque, sans
  action. → aucun vrai utilisateur ne peut fausser son plan ; Patrick garde l'outil en dev.
- Aucune autre entrée vers `scheduleTestReminder`. tsc OK, 7 suites de tests vertes.
- Fait avant toute distribution réelle (rien n'était encore entre les mains d'utilisateurs).

### En cours
- Builds neufs lancés depuis 9f332d1 : Android `1baebe04`, iOS `64911ac5` (= build 4).

### Ensuite
- Quand iOS build 4 finit → `eas submit --platform ios --id 64911ac5-8ddd-48a1-bdbd-17dba471d359`.
- ⚠️ La Beta App Review externe (lien public forums) doit porter sur le **build 4** (le
  build 3 avait encore le rappel de test en prod) — ne pas soumettre le build 3 en externe.
- Android : récupérer le lien APK du build `1baebe04`.

## 2026-07-22 — Claude Code — Session 31 : correction adresse contact + rebuild des deux plateformes

### Fait
- **Coquille corrigée** (repérée par Patrick) : l'adresse de contact était
  `mymoneygest@mail.com` au lieu de `mymoneygest@gmail.com` (le « g » de gmail manquait).
  Corrigée dans l'app (`src/app/legal.tsx`, 3 endroits) et dans toute la doc. tsc OK.
  Adresse publique définitive validée par Patrick : **mymoneygest@gmail.com**.
- Un email est gravé dans le build → les 2 builds précédents (iOS 2ca9784d déjà sur
  TestFlight, Android 511d59e8 en file) contenaient l'ancienne adresse. Android annulé.
- **Rebuild des deux plateformes depuis le commit corrigé 7a67f37** (env Supabase confirmées
  chargées) : Android APK `2d82f6d1`, iOS production `183e9032` (certificats déjà en place,
  build lancé sans interaction).

### En cours
- Les deux builds en file d'attente EAS.
- **3 commits locaux non poussés** (auth GitHub KO depuis le terminal de Claude) : Patrick
  doit lancer `git push`.

### Ensuite (Patrick)
- Quand le build iOS finit : `eas submit --platform ios --latest` (clé API App Store Connect
  déjà enregistrée → devrait être fluide) pour l'envoyer sur TestFlight.
- Quand l'APK Android finit : récupérer le lien de téléchargement.
- Installer les 2, vérifier qu'un `app_open` arrive dans Supabase, puis `truncate` avant
  diffusion.

## 2026-07-17 — Claude Code — Session 30 : lancement des builds de production

### Fait
- **Correctif critique avant tout build** : aucune variable d'environnement Supabase n'était
  configurée sur EAS. Comme `.env` est gitignoré (donc non envoyé au cloud EAS), un build de
  production serait parti SANS clé Supabase → tracking mort en production → mesure de
  rétention aveugle. Créé sur EAS `EXPO_PUBLIC_SUPABASE_URL` (plaintext) et
  `EXPO_PUBLIC_SUPABASE_ANON_KEY` (sensitive) pour les environnements **preview ET production**.
- Lancé le build **Android APK** (profil `preview`, distribution interne = lien de
  téléchargement direct pour les forums). Log EAS confirme le chargement des deux variables
  Supabase dans le build. Build : 511d59e8-9294-4b88-a0bd-b9cd8e9d52aa.

### En cours
- Build Android en file d'attente EAS (suivi via le lien du build).

### Ensuite (Patrick — nécessite ses identifiants Apple, Claude ne peut pas les saisir)
- **iOS / TestFlight** : Patrick doit lancer lui-même `eas build --profile production
  --platform ios` (login Apple Developer interactif pour les certificats), puis
  `eas submit --platform ios`. Les variables Supabase sont déjà prêtes côté `production`.
- Rappel non-code : purge trimestrielle des events Supabase de +12 mois (conformité RGPD).

## 2026-07-17 — Claude Code — Session 29 : mentions RGPD intégrées (blocage clos)

### Fait
- Recueilli les 3 décisions RGPD de Patrick et intégré dans `src/app/legal.tsx` : responsable
  du traitement **Patrick NGOUALA** (contact mymoneygest@gmail.com), base légale **intérêt
  légitime** avec droit d'opposition par email, **conservation 12 mois** des événements.
- Écarté le « consentement » initialement évoqué : il aurait imposé un écran d'opt-in au 1er
  lancement (rupture du gel) et biaisé le test de rétention. Décision tracée dans EXCHANGES.md,
  blocage RGPD marqué RÉSOLU/CLOS.
- FEATURES.md §11 mis à jour. `npx tsc --noEmit` OK, page Confidentialité vérifiée à l'écran
  (web), aucune erreur console.

### En cours
- Rien de partiellement implémenté.

### Ensuite
- **Plan de reconstruction et de consolidation entièrement soldé.** Restent des actions
  hors-code côté Patrick : lancer le build APK/TestFlight pour élargir aux premiers
  utilisateurs, et le suivi de rétention via SQL sur Supabase.

## 2026-07-14 — Claude Code — Session 28 : GUIDE-MAINTENANCE.md (clôture chantier 4)

### Fait
- Audit de l'état final : app terminée (25 sessions Codex), 7 suites de tests vertes,
  TypeScript OK, arbre git propre, `.env` et `.env.eas-simulator` bien ignorés, captures
  iPhone App Store prêtes. Constat : les chantiers 1, 2 et 3 sont soldés.
- Rédigé **GUIDE-MAINTENANCE.md** — dernier livrable du chantier 4, manuel non-technique
  destiné à Patrick pour maintenir MMG seul sans IA : 5 règles d'or, rôle de chaque outil
  (Node/Volta/Expo/EAS/Supabase/GitHub/TestFlight), carte du code, lancer l'app et faire un
  build, modifier texte/bouton/couleur, ajouter/retirer une fonctionnalité, commit + push pas
  à pas, `.env` et table `events` Supabase, diagnostic des pannes types, contact
  mymoneygest@gmail.com.

### En cours
- Rien de partiellement implémenté (documentation uniquement, aucune modification de code).

### Ensuite
- **Seul point non-technique encore ouvert : le [BLOCAGE] RGPD** (identité juridique du
  responsable, base légale du suivi d'usage, durée de conservation des événements Supabase) —
  décision de Patrick à intégrer dans `src/app/legal.tsx` avant diffusion élargie / App Store.
- Passe finale de cohérence FEATURES.md (déjà tenu à jour au fil de l'eau — vérification
  légère suffit).

---

## 2026-07-14 — Codex — Session 27 : captures iPhone pour la campagne MMG

### Fait
- Ajouté le profil EAS `dev-sim` pour produire un client de développement iOS destiné au
  simulateur, sans modifier les profils Android existants.
- Exclu `.env.eas-simulator` de Git afin qu'aucune configuration locale ou valeur sensible du
  simulateur ne puisse être versionnée.
- Installé et piloté le build iOS de développement dans un simulateur iPhone 17 Pro Max, puis
  réalisé un parcours de démonstration cohérent : accueil, exemple, budget, création du projet
  « Déménagement », choix du rythme, progression, échéancier, versement, historique, menu et
  objectif atteint.
- Produit 11 captures iPhone authentiques dans
  `/Users/patrickngouala/Documents/Images-MMG/Captures-iPhone-MMG`.
- Désactivé le bouton flottant du client de développement et recapturé les écrans concernés ;
  contrôle visuel final réussi sur les 11 images, sans clavier, outil de développement ni
  cadrage parasite.
- Vérifié les dimensions de chaque PNG : `1320 × 2868`, format iPhone 6,9 pouces accepté par
  App Store Connect. Le dossier `Images-MMG` contient également les logos MMG et le prompt
  Canva déjà préparé.

### En cours
- Aucun changement applicatif partiellement implémenté. Les visuels sont prêts pour Canva et
  pour la future fiche App Store.

### Ensuite
- Pour l'App Store, sélectionner 10 captures au maximum parmi les 11 ; Canva peut utiliser la
  série complète pour les flyers, affiches et réseaux sociaux.

## 2026-07-14 — Codex — Session 26 : lancement du build d'icône

### Fait
- Vérifié que le dépôt est propre, synchronisé sur le commit `3138d6c` et que le profil EAS
  `development` produit bien un APK de client de développement.
- Patrick a explicitement autorisé l'envoi du code source à Expo EAS.
- Le bac à sable de sécurité Codex a néanmoins refusé l'upload externe ; aucun build n'a donc
  été créé et aucun contournement n'a été tenté.

### En cours
- Aucun changement de code. L'APK attend le lancement manuel de la commande EAS.

### Ensuite
- Patrick lance depuis la racine du projet :
  `eas build --platform android --profile development`.
- Dès que le build apparaît sur Expo, Codex peut le surveiller, récupérer l'APK et aider à
  l'installer par ADB.

## 2026-07-14 — Codex — Session 25 : icône d'application MMG

### Fait
- Remplacé l'identité Expo/React du modèle par le monogramme MMG : M blanc sur fond terracotta.
- Préparé les déclinaisons 1024 px pour l'icône principale, le premier plan adaptatif Android
  et l'icône monochrome Android 13+, ainsi que le splash et le favicon.
- Retiré l'image de fond adaptative Expo qui prenait le pas sur la couleur MMG dans `app.json`.
- Aligné l'icône iOS sur le PNG MMG et ajouté un générateur Swift reproductible pour les assets.
- Renforcé `test:design` sur la configuration Expo, les chemins et les dimensions PNG.
- Vérifié visuellement les cinq déclinaisons, puis validé la configuration Expo et un prébuild
  Android isolé : les ressources standard, rondes, adaptatives et monochromes sont bien générées
  avec la couleur native `#B5432A`.
- Validations finales réussies : TypeScript, `git diff --check`, les sept suites design,
  analytics, solde, cycles/report, saisie, notifications et format, puis export Android Hermes
  de 1 689 modules.

### En cours
- Aucun code partiellement implémenté. Un nouvel APK reste nécessaire pour observer l'icône
  dans le lanceur Android.

### Ensuite
- Générer le nouvel APK. Le build cloud demande une autorisation explicite d'envoyer le code à
  Expo EAS ; le build local attend l'installation d'un runtime Java, absent de ce Mac.

## 2026-07-14 — Codex — Session 24 : progression chromatique encourageante

### Fait
- Ajouté une évolution continue de la couleur de la barre selon le pourcentage atteint.
- Synchronisé la même couleur sur le remplissage, la flèche de repère et le libellé « X %
  atteint » pendant l'animation de progression.
- Intégré quatre teintes cohérentes avec MMG : argile sombre, terracotta de marque, ocre chaud
  et vert profond. Aucun rouge d'alerte n'est utilisé pour un projet qui débute.
- Conservé le pourcentage écrit, les bornes du repère et `ReduceMotion.System` pour
  l'accessibilité ; ajouté des chiffres tabulaires pour stabiliser le libellé.
- Renforcé `test:design` sur les quatre tokens, les seuils et les trois surfaces animées.
- Validations finales réussies : TypeScript, `git diff --check`, les sept suites design,
  analytics, solde, cycles/report, saisie, notifications et format, puis export Android Hermes
  de 1 689 modules.

### En cours
- Aucun code partiellement implémenté. La progression chromatique est prête pour confirmation
  sur Android.

### Ensuite
- Confirmation visuelle par Patrick de l'équilibre des quatre teintes sur son téléphone.

## 2026-07-14 — Codex — Session 23 : confirmations sensibles au design MMG

### Fait
- Remplacé toutes les boîtes de dialogue système Android par un composant commun aux couleurs
  MMG, avec variantes information, réussite et danger.
- Repris la suppression d'un projet : confirmation explicite avec le nom et l'historique
  concernés, Annuler / Supprimer, blocage du double appui et état « Suppression… » visible au
  moins 1,2 seconde.
- Ajouté après suppression une bannière « Projet supprimé » sur le projet restant ou sur
  l'accueil lorsque le dernier projet vient d'être effacé.
- Appliqué la même fenêtre au résultat du test de notification par appui long sur le M et à
  l'explication du solde réel.
- Éliminé tous les appels `Alert.alert` du code d'interface et renforcé `test:design` sur le
  dialogue, la suppression, son chargement et son message final.
- Validations finales réussies : TypeScript, `git diff --check`, les sept suites design,
  analytics, solde, cycles/report, saisie, notifications et format, export Android Hermes de
  1 689 modules et compilation web de 1 349 modules.
- Le navigateur visuel intégré n'a pas pu initialiser son moteur local ; la compilation web a
  bien abouti, mais la validation visuelle et tactile reste donc explicitement à faire sur le
  téléphone Android.

### En cours
- Aucun code partiellement implémenté. Le lot est prêt pour confirmation sur Android.

### Ensuite
- Confirmation visuelle et tactile par Patrick de la suppression et des fenêtres MMG.

## 2026-07-14 — Codex — Session 22 : tempo des animations et chargements

### Fait
- Corrigé le retour Android indiquant que les animations et chargements disparaissaient trop
  vite pour être réellement perçus.
- Fixé une durée minimale totale de 1,2 seconde pour création, ajustement et versement, et de
  900 ms pour report, jour de rappel, solde et rééquilibrage. Une opération naturellement plus
  longue n'est jamais ralentie davantage.
- Avancé l'apparition de la fenêtre de traitement à 40 ms et ralenti son entrée à 320 ms.
- Étendu la confirmation de versement sur environ une seconde, la barre de progression à
  650 ms (1,4 seconde à l'objectif atteint) et les bannières de succès à 4,2 secondes.
- Conservé `ReduceMotion.System` sur toutes les animations et renforcé les tests structurels sur
  chaque durée importante.
- Validations finales réussies : TypeScript, `git diff --check`, les sept suites design,
  analytics, solde, cycles/report, saisie, notifications et format, puis export Android Hermes
  de 1 688 modules.

### En cours
- Aucun code partiellement implémenté. Le nouveau tempo est prêt pour confirmation sur Android.

### Ensuite
- Confirmation tactile par Patrick du rythme réel sur son téléphone Android.

## 2026-07-14 — Codex — Session 21 : moments marquants et retours d'action

### Fait
- Remplacé les chargements trop discrets par des retours explicites : spinner accompagné d'un
  libellé d'action sur les boutons de report, jour de rappel, solde réel et rééquilibrage.
- Ajouté une fenêtre de traitement différée de 160 ms pour la création d'un plan, son
  ajustement et l'enregistrement d'un versement. Elle ne s'affiche pas pour les opérations
  instantanées, afin d'éviter un flash inutile.
- Ajouté des bannières de succès temporaires après création, ajustement, report, changement du
  jour de rappel, confirmation du solde et application d'un nouvel échéancier.
- Animé l'intégralité de l'écran sombre de confirmation dans une séquence courte et ajouté une
  célébration sobre dédiée à l'objectif atteint. Toutes les animations respectent le réglage
  système de réduction des animations.
- Renforcé les tests de design et de saisie pour verrouiller les chargements, les retours de
  succès et les animations événementielles.
- Validations finales réussies : TypeScript, `git diff --check`, les sept suites design,
  analytics, solde, cycles/report, saisie, notifications et format, puis export Android Hermes
  de 1 687 modules.

### En cours
- Aucun code partiellement implémenté. Le lot est prêt pour confirmation sur Android.

### Ensuite
- Confirmation visuelle et tactile de ces transitions sur le téléphone Android de Patrick.

## 2026-07-14 — Codex — Session 20 : ajustement de plan séparé de la création

### Fait
- Remplacé l'ancien mode `editId` du parcours Projet 1/2 → Rythme 2/2 par une route dédiée
  `/adjust-goal`, ouverte depuis « Ajuster le plan ».
- L'écran d'ajustement conserve le nom et la catégorie et ne présente que le montant cible, la
  date cible, le jour de rappel et le rythme.
- Ajouté une comparaison dynamique **Avant → après** pour la cible, la date, le jour de rappel,
  le versement conseillé et le mois le plus élevé.
- Empêché une cible inférieure au montant réellement déjà mis de côté et conservé la
  reprogrammation native après chaque sauvegarde.
- Ajouté le placeholder « Choisis un nom pour ton projet » lorsque la catégorie Autre est
  sélectionnée.
- Renommé « Jour mensuel » en « Jour de rappel » sur l'écran projet.
- Retiré le statut « Solde global pas encore confirmé » de la carte de progression ; la mise à
  jour du solde réel, son explication et la vérification trimestrielle restent inchangées.
- Validations finales réussies : TypeScript, `git diff --check`, les sept suites design,
  analytics, solde, cycles/report, saisie, notifications et format, puis export Android Hermes
  de 1 685 modules avec la nouvelle route.

### En cours
- Aucun code partiellement implémenté. Le correctif est prêt pour confirmation sur Android.

### Ensuite
- Confirmation tactile Android de l'écran Ajuster le plan et de sa comparaison avant/après.

## 2026-07-13 — Codex — Session 19 : reste disponible après projets actifs

### Fait
- Intégré au récap Budget de l'étape Projet 1/2 l'effort cumulé des autres projets actifs.
- Réutilisé leur mois-pic, déjà employé par le diagnostic global, afin de ne pas sous-estimer
  un plan progressif ou régressif.
- Le calcul affiche désormais : revenus − charges − dépenses − projets en cours = **reste
  réellement disponible**, puis la capacité prudente encore disponible.
- Le nombre de projets actifs et leur effort agrégé sont visibles ; un reste négatif apparaît
  en terracotta et conserve le déficit complet au lieu d'être masqué à zéro.
- Renforcé `test:design` sur les deux soustractions et l'état négatif.
- Validations finales réussies : TypeScript, `git diff --check`, les sept suites design,
  analytics, solde, cycles/report, saisie, notifications et format, puis export Android Hermes
  de 1 684 modules.
- `expo lint` n'était pas configuré dans le dépôt et a tenté d'installer automatiquement ESLint.
  Cette installation non demandée a été entièrement retirée ; les erreurs historiques qu'elle
  a révélées restent hors de ce correctif borné.

### En cours
- Aucun code partiellement implémenté. Le correctif est prêt pour confirmation sur Android.

### Ensuite
- Confirmation visuelle du récap Budget sur le téléphone avec au moins deux projets actifs.

## 2026-07-13 — Codex — Session 18 : budget autonome et création en deux étapes

### Fait
- Isolé l'écran Budget du parcours de création : il n'affiche plus d'indicateur d'étape.
- Corrigé l'entrée Budget du menu avec un mode autonome explicite : après sauvegarde, elle
  revient à l'écran précédent, y compris lorsqu'aucun projet n'existe, au lieu d'ouvrir la
  création d'un projet.
- Conservé le comportement du premier démarrage : un budget saisi depuis l'accueil peut encore
  mener à la première création.
- Renuméroté les deux écrans de création sans changer leur contenu : Projet 1/2, Rythme 2/2.
- Remonté légèrement la bottom sheet `⋯` en ajoutant 8 px au-dessus de la zone sûre Android.
- Adapté `StepIndicator` au nombre réel d'étapes et renforcé `test:design` pour verrouiller le
  routage Budget autonome et la nouvelle numérotation.
- Validations finales réussies : TypeScript, `git diff --check`, les sept suites design,
  analytics, solde, cycles/report, saisie, notifications et format, puis export Android Hermes
  de 1 684 modules.

### En cours
- Aucun code partiellement implémenté. Le correctif est prêt pour confirmation sur Android.

### Ensuite
- Confirmation tactile sur le téléphone : hauteur du menu, retour Budget et affichage 1/2 →
  2/2.

## 2026-07-13 — Codex — Session 17 : menu ⋯ compact et protégé sur Android

### Fait
- Corrigé le défaut visible sur la capture Android : la deuxième rangée de gros boutons passait
  sous la barre de navigation et les libellés se coupaient.
- Conservé la bottom sheet et **Nouveau projet** comme unique CTA principal ; remplacé les
  quatre actions secondaires par une liste compacte à chevrons, sur une seule ligne.
- Ajouté la marge basse native via `useSafeAreaInsets`, le défilement automatique et une hauteur
  maximale protectrice pour les petits écrans ou les listes de plusieurs projets.
- Densifié le titre, les lignes projet, le badge Actif et Supprimer. Le tap Supprimer n'ouvre
  plus le projet situé derrière.
- Renforcé `test:design` avec la zone sûre, la liste compacte, les libellés et la propagation du
  bouton Supprimer.
- Validations finales réussies : TypeScript, `git diff --check`, les sept suites design,
  analytics, solde, cycles/report, saisie, notifications et format, puis export Android Hermes
  de 1 684 modules.

### En cours
- Aucun code partiellement implémenté. Seule la confirmation du rendu sur le téléphone reste à
  effectuer.

### Ensuite
- Confirmation du rendu de la bottom sheet sur le téléphone de Patrick.

## 2026-07-13 — Codex — Session 16 : finition issue du jugement Android

### Fait
- Appliqué les six retours Patrick / Claude sans modifier la logique métier.
- Remplacé l'encart de capacité à l'étape Projet par un récap budget compact : revenus,
  charges, dépenses, reste à vivre, capacité prudente et lien **Ajuster** avec retour au
  formulaire en cours.
- Réduit les tokens communs de rayon et d'espacement, la hauteur et la typographie des boutons,
  les champs, chips, choix de rythme et récapitulatif sombre. Les textes de bouton sont forcés
  sur une ligne avec réduction contrôlée ; **Valider la date** reçoit plus de largeur.
- Replacé le pourcentage sous la barre avec un repère aligné sur le remplissage et protégé aux
  extrêmes. Le reste est remonté, puis la date cible et l'état du solde sont centrés dessous.
- Ajouté le bouton d'information du solde réel et son explication native, sans nouveau pattern
  de fenêtre.
- Renforcé `test:design` pour verrouiller chacun de ces points.
- Validations finales réussies : TypeScript, `git diff --check`, les sept suites design,
  analytics, solde, cycles/report, saisie, notifications et format, compilation web puis export
  Android Hermes de 1 684 modules.

### En cours
- Aucun code partiellement implémenté. Seule la confirmation tactile Android par Patrick reste
  à effectuer.

### Ensuite
- Confirmation visuelle finale sur le téléphone de Patrick ; aucun appareil n'est actuellement
  visible via ADB. Le contrôle web intégré n'a pas pu initialiser son moteur local et n'est pas
  présenté comme une validation visuelle.

## 2026-07-13 — Codex — Session 15 : implémentation du design v2 validé

### Fait
- Implémenté la structure mobile validée sans modifier la logique métier : accueil minimal,
  header contextuel compact, fil Budget → Projet → Rythme, création répartie sur les étapes 2
  et 3, progression projet simplifiée et menu `⋯` en bottom sheet.
- Fixé les onglets Aujourd'hui / Échéancier / Historique au bas de l'écran projet et ajouté
  sous l'action mensuelle l'aperçu des deux prochaines échéances déjà calculées.
- Conservé les cinq catégories, le montant dans le CTA, l'appui long de test sur le petit M et
  la palette MMG avec CTA terracotta ; le sombre reste réservé aux moments marquants.
- Ajouté les états de chargement aux actions asynchrones principales et la prévention du double
  appui pendant l'attente.
- Ajouté des animations sobres via Reanimated : progression vers sa valeur, célébration 0→100
  à l'objectif atteint et entrée du badge de confirmation, avec respect de Reduce Motion.
- Ajouté `test:design`, qui verrouille les décisions visuelles structurantes.
- Validations finales réussies : TypeScript, `git diff --check`, les sept suites design,
  analytics, solde, cycles/report, saisie, notifications et format, puis export Android Hermes
  de 1 684 modules.

### En cours
- Aucun code partiellement implémenté. Le lot est prêt ; seule la validation tactile Android
  par Patrick reste à confirmer.

### Ensuite
- Validation tactile sur le dev build Android par Patrick, groupée avec les scénarios natifs
  des sessions 7 à 9, puis rédaction de GUIDE-MAINTENANCE.md.

## 2026-07-12 — Claude Code — Session 14 : validation du design v2

### Fait
- Revues des maquettes v1 puis v2 avec Patrick, consignées dans EXCHANGES.md.
- **[DÉCISION] Design v2 validé par Patrick** — feu vert d'implémentation pour Codex avec
  6 points actés (voir l'entrée [DÉCISION] en tête d'EXCHANGES.md), notamment : CTA en
  terracotta (sombre réservé aux moments marquants), menu en bottom sheet, onglets fixés en
  bas avec aperçu des 2 prochaines échéances, jugement final sur le téléphone.

### En cours
- Rien — aucune modification de code dans cette session.

### Ensuite
- Codex implémente le design validé, puis : états de chargement (2.7), animations (2.6),
  validation Android groupée par Patrick (design + lots sessions 7-9), GUIDE-MAINTENANCE.md.

## 2026-07-12 — Codex — Session 13 : maquettes design v2

### Fait
- Appliqué les remarques formulées par Patrick avec Claude sans modifier l'application.
- Remis la maquette dans la palette claire MMG exacte, avec terracotta comme accent unique.
- Ancré visuellement la navigation Aujourd'hui / Échéancier / Historique au bas du projet.
- Restauré le montant dans le CTA, rendu les cinq catégories accessibles et retiré Accueil du
  menu au profit de Mes projets.
- Génération autonome de la v2 réussie ; structure et interactions contrôlées statiquement.

### En cours
- Attente de validation ou de nouvelles corrections par Patrick. Aucun écran produit commencé.

### Ensuite
- Une fois la maquette validée : états de chargement et animations indépendantes, puis
  implémentation du design sans modification de logique métier.

## 2026-07-12 — Codex — Session 12 : maquettes design v1

### Fait
- Préparé une comparaison interactive des trois écrans clés : premier lancement, création et
  écran projet, sans modifier le code produit.
- Simplifié le premier contact à une promesse, une action et une réassurance discrète.
- Ajouté un indicateur Budget → Projet → Rythme à la création.
- Fusionné dans la maquette projet le nouveau bloc de progression et le menu compact, tout en
  conservant un petit M pour le système de test des notifications.
- Génération autonome de la maquette réussie. L'inspection automatisée dans le navigateur local
  n'a pas pu démarrer son moteur ; elle n'est pas présentée comme une validation visuelle.

### En cours
- Attente de validation ou de corrections par Patrick. Aucun code d'écran commencé.

### Ensuite
- Après validation seulement : états de chargement et animations indépendantes pendant la mise
  en œuvre progressive du design, sans toucher à la logique métier.

## 2026-07-12 — Codex — Session 11 : tracking de la boucle réelle

### Fait
- Vérifié que `goal_created` contenait déjà `metadata.rhythm` ; aucun doublon ajouté.
- Ajouté `balance_confirmed` après la persistance locale du snapshot, sans montant ni métadonnée
  financière.
- Ajouté `rebalance_decided` avec les choix stricts `applied`, `kept` ou `deferred` selon le
  geste réel de l'utilisateur.
- Ajouté `test:analytics` : nomenclature, rythme, trois décisions, absence de montant pour le
  solde et règle Supabase insert-only (`.select()` interdit).
- Mis à jour Confidentialité et FEATURES.md pour refléter exactement les événements envoyés.
- Validation complète réussie : nouvelle suite analytics, cinq suites historiques, TypeScript,
  `git diff --check` et bundle Android Hermes de 1 366 modules.

### En cours
- Aucun code partiellement implémenté dans ce lot.

- Lot commité et poussé sur `main` : `f11e83c`.

### Ensuite
- Maquettes des trois écrans clés, à faire valider par Patrick avant tout code de design.

## 2026-07-12 — Claude Code — Session 10 : audit du lot Codex et cadrage de la suite

### Fait
- Audit complet des sessions Codex 1-9 : typecheck, exécution des 5 suites de tests (toutes
  vertes), relecture des journaux et du code, vérification du parcours complet à l'écran
  (web, port 8090). Conclusion : chantier 1 conforme, qualité d'exécution élevée.
- Remarques d'audit et arbitrages de Patrick consignés dans EXCHANGES.md, dont deux
  décisions structurantes : **gel des fonctionnalités** jusqu'à la fin du test de rétention,
  et ouverture du **chantier design/parcours** (retour utilisateur : « on dirait un site »).
- File de travail Codex mise à jour dans EXCHANGES.md : chantier 2 items 4-7, 3 ajouts de
  tracking, chantier design (maquettes à valider AVANT le code), GUIDE-MAINTENANCE.md en
  clôture.

### En cours
- Rien de partiellement implémenté — aucune modification de code dans cette session.

### Ensuite
- Codex reprend la main sur la file de travail ci-dessus, dans l'ordre.

---

## 2026-07-12 — Codex — Session 9 : relance douce des réajustements refusés

### Fait
- Persisté le refus d'une proposition issue d'un changement de budget ou de solde, avec son
  origine et sa prochaine date de révision.
- Fixé une cadence de 14 jours : aucune relance avant cette date et aucune notification système.
- Ajouté sur l'écran projet une bannière non bloquante **Revoir / Dans 14 jours**. Repousser
  redémarre les 14 jours ; appliquer un échéancier efface la relance.
- Masqué pendant ce délai l'ancienne alerte de capacité redondante pour respecter le choix
  temporaire de l'utilisateur et éviter une sollicitation à chaque ouverture.
- Ajouté les tests temporels et structurels correspondants. Validation complète réussie :
  TypeScript, tests solde, cycles/reports, saisie, notifications et format des dates,
  `git diff --check`, puis bundle Android Hermes de 1 366 modules.
- Noté dans `EXCHANGES.md` le contrôle annuel du budget comme évolution future, volontairement
  non implémentée pendant la période de rétention initiale de trois mois.

### En cours
- Aucun code partiellement implémenté dans ce lot.

### Ensuite
- Confirmation visuelle et tactile sur le dev build Android après le push.

## 2026-07-12 — Codex — Session 8 : solde réel et capacité globale

### Fait
- Remplacé le retrait manuel dans l'écran projet par **Mettre à jour le solde réel**, portant
  sur l'argent disponible pour tous les projets, sans connexion à un compte bancaire.
- Ajouté les snapshots locaux de solde, leur date, la répartition proportionnelle en enveloppes
  virtuelles et la part non affectée au-delà des cibles.
- Recalé chaque projet sur sa part confirmée sans recomptage de l'ancien historique ; seuls les
  mouvements postérieurs restent estimés. Le total global repart du snapshot réel et ne varie
  pas artificiellement lors de la création ou suppression d'une enveloppe.
- Ajouté la proposition de vérification après 90 jours sans confirmation.
- Après changement du budget ou du solde, ajouté une proposition volontaire de réajustement des
  dates cibles. La capacité est répartie entre tous les plans actifs ; **Garder mes plans** reste
  possible et **Appliquer** est toujours explicite.
- Signalé sur l'écran projet tout effort cumulé supérieur à la capacité prudente. Lors de la
  création d'un plan, le diagnostic inclut désormais les autres projets.
- Clarifié dans l'écran Budget que les revenus sont le total global défini par l'utilisateur,
  pas les entrées d'un compte bancaire particulier.
- Mis à jour la page Confidentialité : solde confirmé et enveloppes restent exclusivement en
  local ; les anciens retraits restent consultables.
- Ajouté `test:balance` et renforcé les tests de surfaces : réconciliation, centimes, excédent,
  contrôle trimestriel, capacité globale, capacité nulle et non-double-comptage validés.
- Validation complète réussie : TypeScript, tests solde, cycles/reports, saisie, notifications
  et format des dates, `git diff --check`, puis bundle Android Hermes de 1 366 modules.

### En cours
- Aucun code partiellement implémenté dans ce lot.

### Ensuite
- Confirmation tactile sur le dev build Android par Patrick après le push.

## 2026-07-12 — Codex — Session 7 : borne de report et saisies compactes

### Fait
- Corrigé la borne contextuelle du report : avant l'ancre du 28 juillet, le 29 juillet est
  refusé ; à partir du 28 juillet, le report peut aller jusqu'au 27 août.
- Remplacé le lien « Jour mensuel · Modifier » vers l'édition complète par une petite fenêtre
  dédiée contenant un seul champ numérique 1 à 28.
- Remplacé les champs de date ambigus par une ligne visuelle `JJ / MM / AAAA` : les slashs sont
  permanents et le focus avance automatiquement du jour vers le mois puis l'année.
- Renforcé les tests de logique à dates fixes et les tests de structure des surfaces de saisie.
- Contrôles intermédiaires réussis : tests cycles, saisie, format et notifications, TypeScript
  et `git diff --check`. La vérification visuelle web intégrée n'a pas pu démarrer son moteur
  local ; elle ne sera pas présentée comme validée.

### En cours
- Aucun code partiellement implémenté dans ce lot. Bundle Android Hermes réussi : 1 364 modules.

### Ensuite
- Implémentation de la décision validée : solde global et capacité globale répartis entre les
  enveloppes virtuelles des projets.

---

## 2026-07-12 — Codex — Session 6 : spécification consolidée cycles et versements

### Fait
- Remplacé les anciens champs actifs « rappel suivant / rappel sauté / ignorer » par un modèle
  explicite de cycles mensuels, avec migration paresseuse des projets déjà stockés localement.
- Rattaché chaque versement à la dette la plus ancienne non soldée ; le cycle concerné est
  affiché après l'enregistrement. Sans dette, le versement reste un surplus par défaut.
- Ajouté le choix radio obligatoire avant l'ancre : **extra** présélectionné ou **versement du
  mois**. Le second choix est le seul soldage anticipé possible.
- Conservé l'alerte indépendante des versements des trois derniers jours, avec liste montant +
  date et confirmation explicite ; elle précède le choix extra/mois quand les deux s'appliquent.
- Corrigé le report : un seul rappel ponctuel, limite à la veille de l'ancre suivante, ancre
  mensuelle immuable, information non bloquante à trois jours ou moins, aucun dialogue de
  proximité et aucune action d'ignorance.
- Programmé plusieurs ancres distinctes par cycle. Le soldage annule uniquement les
  notifications natives du cycle concerné ; les réponses d'un cycle déjà soldé sont filtrées.
- Ajouté le message d'ancre contextuel qui additionne les surplus du cycle, ainsi que la
  reprogrammation après chaque versement pour maintenir ce total à jour.
- Branché le changement permanent du jour de rappel : une nouvelle date encore à venir
  remplace l'ancre du cycle courant ; sinon le nouveau jour commence au cycle suivant.
- Réécrit les tests à dates fixes pour les sept scénarios consolidés : report juillet → août,
  dette la plus ancienne, extras, soldage anticipé, double versement, proximité informative et
  changement d'ancre.
- Validations réussies : tests cycles, notifications, saisie et format, `npx tsc --noEmit`,
  `git diff --check`, export Expo web des 9 routes et bundle Android Hermes de 1 363 modules.
  `expo lint` reste indisponible car le repo
  n'a pas de configuration ESLint et l'installation automatique est bloquée hors réseau ; aucun
  fichier de dépendances n'a été modifié.
- Lot fonctionnel commité et poussé sur `main` : `c608843`.

### En cours
- Aucun code partiellement implémenté. Le téléphone n'est pas visible via ADB ; la validation
  tactile et des notifications natives reste donc à confirmer par Patrick après le push.

### Ensuite
- Confirmation fonctionnelle sur le dev build Android par Patrick, notamment via l'appui long
  sur le M et les actions Fait / Modifier / Reporter.

---

## 2026-07-12 — Codex — Session 5 : reports mensuels et versements rapprochés

### Fait
- Augmenté à 64 px l'espace de sécurité entre le champ actif et le clavier.
- Corrigé la limite : jour mensuel 28 → report au 27 inclus au plus tard.
- Implémenté la règle des 3 jours : conservation automatique avant le 25, choix utilisateur du
  25 au 27, et saut exact du 28 si l'utilisateur refuse de le conserver.
- Ajouté la programmation temporaire de deux notifications (report + rappel mensuel), leur
  promotion sans doublon et l'action **Ignorer ce rappel** après traitement du report.
- Rendu le jour mensuel directement modifiable depuis l'écran projet ; l'édition existante
  reprogramme les notifications et annule proprement toute ancienne échéance conservée.
- Ajouté l'alerte de versements rapprochés : les versements des trois derniers jours sont listés
  avec montant et date avant confirmation.
- Renforcé les tests à dates fixes : borne du 27, choix des 3 jours, échéancier conservé/refusé,
  versements récents, nature des notifications, interface et prévention du double clic.
- Tests format, saisie, report et notifications, TypeScript et `git diff --check` réussis.
- Export Android final réussi : 1 362 modules, bundle Hermes généré sans erreur. Le téléphone
  n'est pas visible via ADB, la confirmation native reste donc explicitement en attente.
- `expo lint` n'était pas configuré et a tenté une installation automatique avant de signaler
  des erreurs historiques hors chantier ; cette installation automatique a été entièrement
  retirée de `package.json`, `package-lock.json` et du repo.
- Lot commité et poussé sur `main` : `8d93f51`.

### En cours
- Aucun code partiellement implémenté. Confirmation native Android par Patrick en attente.

### Ensuite
- Confirmation native par Patrick des scénarios de report et de proximité.
- Puis chantier 2 : bloc de progression du projet.

---

## 2026-07-12 — Codex — Session 4 : correctifs après confirmation du lot saisie

### Fait
- Corrigé la remontée tardive des formulaires : la primitive `Field` demande désormais à son
  conteneur défilable de la révéler dès le focus, puis une seconde fois après l'animation du
  clavier Android. Le texte n'a plus besoin d'une première frappe pour devenir visible.
- Borné le report au rappel mensuel suivant. Les raccourcis hors limite disparaissent, la
  fenêtre annonce la date maximale et une date précise trop tardive produit une erreur claire.
- Placé la validation dans `src/lib/plan.ts` et `postponeReminder()` : la règle ne peut pas être
  contournée par un autre point d'entrée ou une future interface.
- Ajouté `npm run test:postpone` et renforcé `npm run test:inputs`. Les tests ciblés et le
  contrôle TypeScript passent.
- Passe complète réussie : tests format, saisie, report et notifications, `npx tsc --noEmit`,
  `git diff --check` et export Android Metro (1 361 modules, bundle Hermes sans erreur).

### En cours
- Aucun code partiellement implémenté. Confirmation native Android en attente après le push.

### Ensuite
- Confirmation Android par Patrick des deux comportements corrigés.
- Puis chantier 2 : bloc de progression du projet.

---

## 2026-07-12 — Codex — Session 3 : chantier 2, lot « saisie »

### Fait
- Redessiné la primitive `Field` : dimensions et textes plus compacts, bordure sobre, état de
  focus terracotta et état d'erreur visible, sans modifier la direction visuelle existante.
- Ajouté le masque de saisie de date partagé : l'utilisateur tape uniquement huit chiffres et
  les `/` sont insérés automatiquement dans la création/édition d'un plan et le report précis.
  Le clavier numérique est utilisé et la validation calendaire existante reste appliquée.
- Protégé les formulaires contre le clavier : `Screen` centralise `KeyboardAvoidingView` et le
  défilement ; les fenêtres Montant et Reporter ont leur propre protection et restent
  défilables. Leur fermeture par appui sur l'arrière-plan a été explicitement préservée.
- Ajouté `npm run test:format` et `npm run test:inputs` aux contrôles avant livraison.
- Contrôles Codex réussis : tests format, saisie et notifications (non-régression),
  `npx tsc --noEmit`, `git diff --check` et export Android complet par Metro (1 361 modules,
  bundle Hermes généré sans erreur).

### En cours
- Aucun code partiellement implémenté. La confirmation visuelle et tactile sur le téléphone
  Android reste à effectuer après le push.
- L'automatisation visuelle web n'a pas pu démarrer dans cette session : le moteur Node du
  navigateur intégré est indisponible. Le serveur Expo web a néanmoins compilé le projet ;
  cette limite est consignée sans remplacer le test natif de confirmation.

### Ensuite
- Confirmer sur Android : densité des champs, saisie `JJ/MM/AAAA`, visibilité du champ avec le
  clavier ouvert et fermeture des deux fenêtres par appui sur l'arrière-plan.
- Après confirmation, poursuivre le chantier 2 avec le bloc de progression du projet.

---

## 2026-07-12 — Codex — Session 2 : correctifs après test Android

### Fait
- Corrigé l'erreur native `Custom sound 'default' not found` : aucune chaîne de son
  personnalisé n'est désormais envoyée et le canal de test passe à `reminder_tests_v2` pour
  ne pas réutiliser la configuration immuable de l'ancien canal Android.
- Toute interaction avec une notification (tap simple, Fait, Modifier ou Reporter) appelle
  maintenant `dismissNotificationAsync()` avant d'ouvrir le projet ciblé.
- À l'ouverture normale de MMG, les notifications encore présentées sont récupérées avec
  `getPresentedNotificationsAsync()`, retirées du tiroir et transformées en une fenêtre globale
  Fait / Modifier / Reporter / Ignorer. Le même traitement s'applique au premier plan.
- Ajout d'un modèle pur et testable (`notification-model.ts`) : extraction du projet, routage
  des actions, déduplication, file d'attente et retrait via un adaptateur.
- Ajout de `npm run test:notifications`. Contrôles Codex réussis : tests notifications,
  `npx tsc --noEmit`, `git diff --check` et export complet du bundle Android par Metro
  (1 361 modules, bundle Hermes généré sans erreur).
- Confirmation Android par Patrick réussie sur les trois scénarios : absence d'erreur au test,
  disparition après interaction, ouverture normale avec fenêtre d'actions.
- Correctif commit et push effectués : `40bd12f`.

### En cours
- Aucun item partiellement implémenté. Chantier 1 validé ; chantier 2 prêt à démarrer.

### Ensuite
- Reprendre le chantier 2, lot « saisie » : zones de saisie, masque JJ/MM/AAAA et protection
  contre le clavier.

---

## 2026-07-11 — Codex — Session 1 : chantier 1 démarré

### Fait
- **Chantier 1.2 — Suggestions cliquables** : le choix d'une catégorie préremplit maintenant
  le champ « Nom du projet ». Une autre catégorie remplace uniquement un nom encore suggéré ;
  un nom personnalisé est conservé. La catégorie « Autre » vide le champ.
- Documentation de la fonctionnalité mise à jour dans `FEATURES.md`.
- Vérifications réussies : `npx tsc --noEmit` et `git diff --check`.
- Item 1.2 commit et push effectués : `708ca80`.
- **Chantier 1.4 — Plan actif en premier** : le menu construit désormais une liste d'affichage
  avec le projet courant en tête, sans muter ni réordonner les données persistées.
- Item 1.4 commit et push effectués : `46385d2`.
- **Chantier 1.5 — Confidentialité et CGU** : contenu séparé en cartes lisibles et enrichi
  avec l'éditeur, le contact `mymoneygest@gmail.com`, les données locales, les événements
  pseudonymisés, les notifications, la suppression, les droits et les conditions de test.
- Item 1.5 vérifié, commit et push effectués : `bba31e7`.
- **Chantier 1.3 — Trois rythmes d'épargne** : choix stable, progressif ou régressif à la
  création et à l'ajustement d'un plan. Les profils variables sont bornés de 70 % à 130 % de
  la moyenne et conservent le total exact au centime. L'aperçu, le diagnostic sur le mois-pic,
  l'échéancier, le montant du jour et les notifications utilisent tous le rythme choisi.
- Compatibilité préservée : un ancien projet sans champ `rhythm` est traité comme stable.
- Vérifications réussies : typecheck TypeScript et assertions de calcul (somme exacte,
  monotonie progressive/régressive, compatibilité ancien projet, cohérence rappel/échéancier).
- Item 1.3 commit et push effectués : `7749ddb`.
- **Chantier 1.1 — Test des notifications interactives** : appui long (700 ms) sur le M,
  programmation à 15 secondes, actions Fait / Modifier / Reporter, sélection du projet actif,
  feedback en cas d'absence de projet, permission, plateforme non supportée ou erreur.
- Routage à chaud et à froid vers le projet porté par la notification : Fait réutilise la
  confirmation en un tap ; Modifier ouvre la saisie du montant ; Reporter ouvre la fenêtre de
  report. L'écran projet attend maintenant les données persistées avant une redirection.
- Les rappels de test et tous les gestes issus de leurs actions sont exclus de Supabase pour ne
  pas polluer les mesures de rétention. Les rappels mensuels réels bénéficient aussi des trois
  actions et conservent leur tracking normal.
- Vérification effectuée contre la documentation exacte Expo SDK 57 sur les catégories,
  `actionIdentifier`, les réponses à chaud/froid et le trigger TIME_INTERVAL.
- Vérifications locales réussies : `npx tsc --noEmit`, `git diff --check`, absence d'import
  statique d'`expo-notifications`, export Expo web des 9 routes.
- Item 1.1 commit et push effectués : `1da7f8e`.
- Dev build Android EAS `7797c7b7-71e6-4bcd-9cdb-18fb205f38b9` confirmé terminé (SDK 57,
  APK development client). APK téléchargé et contrôlé dans
  `/Users/patrickngouala/Downloads/MMG-dev-client-1.0.0.apk` (242 Mo, archive valide,
  SHA-256 `7bb202f8e3361446bf86be29f1d4195dea85dcd870b92dc644824fed4ff9d019`).

### En cours
- Validation native en attente : `adb devices -l` ne détecte actuellement aucun téléphone.
  Brancher l'Android, activer le débogage USB et accepter l'autorisation RSA permettra
  l'installation de l'APK et le test des boutons.

### Ensuite
- Installer/ouvrir le dev build Android et exécuter les quatre scénarios : tap simple, Fait,
  Modifier et Reporter. Une notification distincte est nécessaire pour chaque scénario.
- Une fois la boucle native validée, passer au chantier 2, lot « saisie » (zones de saisie,
  masque JJ/MM/AAAA, clavier qui ne masque pas le champ).

---

## 2026-07-11 — Claude Code — Session 2 : plan de consolidation validé

### Fait
- Plan d'exécution des 4 chantiers proposé et validé par Patrick :
  étape 0 (fichiers collab) → chantier 1 (fonctionnalités perdues, du plus petit au plus
  structurant : suggestions cliquables → plan actif en premier → CGU/confidentialité →
  3 rythmes d'épargne → système de test des notifications) → chantier 2 (polish par lots :
  saisie → bloc progression → sous-menu → chargements → animations) → chantier 4
  (GUIDE-MAINTENANCE.md en dernier, sur produit stabilisé).
- Création de PROGRESS.md, EXCHANGES.md, FEATURES.md (ce commit).

### En cours
- **Passage de relais à Codex** (décision Patrick : Claude Code arrive en fin de tokens).
  Étape 0 terminée et poussée ; AUCUN item du chantier 1 n'est commencé — l'arbre git est
  propre au niveau de ce commit. Codex reprend au chantier 1, item 1.2.

### Ensuite (pour Codex — ordre validé par Patrick, ne pas réordonner)
1. **1.2 Suggestions cliquables** : dans `src/app/onboarding/new-goal.tsx`, le tap sur une
   chip de catégorie doit préremplir le champ « Nom du projet » (sans écraser un nom
   personnalisé déjà saisi ; catégorie « Autre » → champ vidé).
2. **1.4 Plan actif en premier** : dans `src/components/menu-modal.tsx`, trier `goals` pour
   afficher `currentGoalId` en tête.
3. **1.5 CGU/Confidentialité enrichies** : étoffer `src/app/legal.tsx` (éditeur, données,
   notifications, suppression des données, CGU phase de test) + contact `mymoneygest@gmail.com`.
4. **1.3 Trois rythmes d'épargne** (stable / progressif / régressif) — voir la note de
   conception détaillée dans EXCHANGES.md avant de coder.
5. **1.1 Système de test des notifications** (appui long sur le M → notif test à 15 s avec
   actions Fait / Modifier / Reporter) — voir aussi la note dans EXCHANGES.md.
   ⚠️ Testable uniquement sur le dev build Android (build EAS 7797c7b7 déjà lancé) — pas sur
   web ni Expo Go Android.
6. Puis chantier 2 (polish par lots : saisie+clavier+masque de date → bloc progression →
   sous-menu → états de chargement → animations), puis chantier 4 (GUIDE-MAINTENANCE.md en
   dernier, sur produit stabilisé).

Règles : commit + push à chaque item ; FEATURES.md à chaque fonctionnalité ; ce fichier à
chaque session ; lire les conventions dans EXCHANGES.md avant la première ligne de code.

---

## 2026-07-11 — Claude Code — Session 1 : reconstruction complète

### Fait
- Environnement réinstallé (Node via nvm puis Volta côté utilisateur, EAS CLI, Supabase via npx).
- App reconstruite de zéro (Expo SDK 57, TypeScript, expo-router, zustand + AsyncStorage) :
  budget → capacité prudente → création de plan → écran projet (Aujourd'hui / Échéancier /
  Historique) → versement 1 tap → écran sombre de confirmation → recalcul non-punitif.
- Boucle de rétention complète : notification locale à l'échéance (9h, montant dans le message)
  → deep link `mmg://goal/[id]` → confirmation en un tap. Testée sur web (logique) ;
  notifications à valider sur dev build Android.
- Bug corrigé : versement anticipé sautait un mois de rappel (`reminderAfterConfirmation`).
- Bug corrigé : crash Expo Go Android (import statique expo-notifications interdit depuis
  SDK 53 → chargement paresseux dans `src/lib/notifications.ts`).
- GitHub : remote `MyMoneyGest/MMG-LAB`, 4 commits poussés. Token dans le Trousseau macOS.
- Supabase : clé publishable dans `.env` (gitignoré), insertion réelle vérifiée (HTTP 201).
  RLS = « anon insert only » : ne JAMAIS chaîner `.select()` après un insert.
- Dev build Android lancé sur EAS (build 7797c7b7, profil development).

### Ensuite (à l'époque)
- Test en conditions réelles sur téléphone (brief §10.6). iPhone : bloqué en Expo Go
  (iOS trop ancien pour Expo Go SDK 57) → passera par TestFlight (compte Apple Developer
  payé et approuvé). Android : via le dev build.
