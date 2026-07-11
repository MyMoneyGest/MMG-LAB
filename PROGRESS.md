# Journal d'avancement — MMG

Journal partagé entre les IA (Claude Code, Codex) et Patrick. Objectif : celui qui prend le
relais sait exactement où on en est, sans relire tout l'historique git.

**Règles** : mise à jour à CHAQUE session de travail (pas en fin de chantier). Entrées datées,
signées, les plus récentes en haut. Chaque entrée dit : ce qui a été fait, ce qui est en cours,
ce qui vient ensuite.

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

### En cours
- Correctif validé et prêt pour commit/push.

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
  avec l'éditeur, le contact `mymoneygest@mail.com`, les données locales, les événements
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
   notifications, suppression des données, CGU phase de test) + contact `mymoneygest@mail.com`.
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
