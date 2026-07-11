# Journal d'avancement — MMG

Journal partagé entre les IA (Claude Code, Codex) et Patrick. Objectif : celui qui prend le
relais sait exactement où on en est, sans relire tout l'historique git.

**Règles** : mise à jour à CHAQUE session de travail (pas en fin de chantier). Entrées datées,
signées, les plus récentes en haut. Chaque entrée dit : ce qui a été fait, ce qui est en cours,
ce qui vient ensuite.

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
- Chantier 1, item 1.2 : suggestions de projets cliquables (préremplissage du nom).

### Ensuite
- Dérouler le chantier 1 dans l'ordre validé. Commit + push à chaque item terminé,
  FEATURES.md mis à jour à chaque fonctionnalité.

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
