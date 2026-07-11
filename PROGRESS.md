# Journal d'avancement — MMG

Journal partagé entre les IA (Claude Code, Codex) et Patrick. Objectif : celui qui prend le
relais sait exactement où on en est, sans relire tout l'historique git.

**Règles** : mise à jour à CHAQUE session de travail (pas en fin de chantier). Entrées datées,
signées, les plus récentes en haut. Chaque entrée dit : ce qui a été fait, ce qui est en cours,
ce qui vient ensuite.

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

### En cours
- Aucun item partiellement implémenté : vérification de l'item 1.4 avant commit et push.

### Ensuite
- **Chantier 1.5 — Confidentialité et CGU enrichies** dans `src/app/legal.tsx`.

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
