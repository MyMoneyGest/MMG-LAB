# FEATURES — MMG

Description technique de toutes les fonctionnalités : ce qu'elles font, comment elles
fonctionnent, où elles vivent dans le code. **Mis à jour à chaque fonctionnalité ajoutée ou
modifiée**, pas après coup.

Dernière mise à jour : 2026-07-11 (Codex).

---

## 1. Aiguillage d'ouverture

- **Quoi** : à l'ouverture, l'app répond à « qu'est-ce qui a besoin de moi maintenant ? » —
  elle ouvre le projet ayant un versement dû ou en retard (échéance la plus urgente d'abord) ;
  sinon le dernier projet consulté ; sinon le premier projet ; sinon l'accueil.
- **Comment** : `hasPendingAction()` (échéance passée + reste à financer > 0), tri par
  `nextReminderAt` croissant, `<Redirect>` expo-router. Attend l'hydratation du store.
- **Où** : `src/app/index.tsx`, `src/lib/plan.ts` (`hasPendingAction`).

## 2. Accueil « Avant le projet »

- **Quoi** : promesse (« Combien peux-tu mettre de côté sans te serrer ? »), CTA adaptatif
  (Estimer ma capacité / Voir mes plans / Créer un nouveau plan), lien exemple, réassurance
  (« Pas de compte bancaire connecté… »), checklist « Ce que MMG vérifie d'abord ».
- **Comment** : variantes selon `budget` et `goals.length` du store.
- **Où** : `src/app/home.tsx`.

## 3. Budget et capacité d'épargne

- **Quoi** : 3 saisies (revenus nets, charges fixes, dépenses variables) → « Capacité
  prudente : X €/mois » en direct.
- **Comment** : reste à vivre = revenus − charges − variables ; capacité prudente =
  reste à vivre × (1 − marge de sécurité 20 %) (`SAFETY_MARGIN`).
- **Où** : `src/app/onboarding/budget.tsx`, `src/lib/plan.ts` (`resteAVivre`, `prudentCapacity`).

## 4. Création / ajustement d'un plan

- **Quoi** : catégorie (chips colorées : Fonds d'urgence, Voiture, Déménagement, Vacances,
  Autre), nom, montant cible, déjà disponible, date cible (JJ/MM/AAAA), jour de rappel (1-28),
  aperçu en direct : carte « Rythme stable », récap sombre (à mettre de côté, durée, reste à
  financer, diagnostic Confortable/Juste/Trop serré, rappel) et carte de compatibilité budget.
  Mode édition via `?editId=` (menu « Ajuster ce plan »).
- **Suggestions** : sélectionner une catégorie préremplit le nom correspondant. Changer de
  catégorie actualise un nom suggéré, sans écraser un nom personnalisé ; « Autre » vide le
  champ pour laisser l'utilisateur nommer librement son projet.
- **Comment** : `createGoal()` orchestre : store + première demande de permission notifications
  (uniquement ici, jamais à l'ouverture) + programmation du rappel + événement `goal_created`.
- **Où** : `src/app/onboarding/new-goal.tsx`, `src/lib/actions.ts` (`createGoal`),
  `src/components/plan-summary.tsx`.

## 5. Écran projet (cœur de l'app)

- **Quoi** : carte plan (nom, description par catégorie, barre de progression, % atteint /
  déjà mis / restants / cible) + 3 onglets :
  - **Aujourd'hui** : « Action du mois » (montant conseillé + date de rappel), boutons
    **Versement fait (X €)** (1 tap), Montant différent, Reporter, Retrait.
  - **Échéancier** : occurrences mensuelles futures jusqu'à la cible avec montant lissé.
  - **Historique** : versements (+vert) et retraits (−terracotta) datés.
  Bannière si permission de notification manquante (fidèle à l'ancienne app).
- **Comment** : montant conseillé = reste à financer / mois restants (recalculé à chaque
  affichage → absorbe les écarts, non-punitif). Un versement (peu importe le montant) marque
  le mois comme fait : `reminderAfterConfirmation` = jour de rappel du mois suivant.
- **Où** : `src/app/goal/[id].tsx`, `src/lib/plan.ts` (`suggestedAmount`, `upcomingSchedule`,
  `savedTotal`…), `src/lib/actions.ts` (`confirmContribution`, `withdraw`).

## 6. Confirmation de versement (« moment marquant »)

- **Quoi** : écran sombre plein écran après tout versement — check terracotta, montant,
  message encourageant (« Même moins que prévu, c'est déjà bien »), prochain rappel + montant,
  variante « objectif atteint 🎉 ».
- **Où** : `src/components/confirmation-overlay.tsx` (le fond sombre est réservé à ces moments,
  cf. direction visuelle).

## 7. Report de rappel

- **Quoi** : modal « Quand te le rappeler ? » — Demain / Dans 3 jours / Dans 7 jours (dates
  affichées) ou date précise JJ/MM/AAAA. Message d'erreur si permission de notification
  manquante (« Report impossible pour le moment… »).
- **Comment** : `postponeReminder()` revérifie la permission, replanifie la notification,
  trace `reminder_postponed`.
- **Où** : `src/components/report-modal.tsx`, `src/lib/actions.ts`.

## 8. Montant différent / Retrait

- **Quoi** : modals de saisie libre. Montant différent = versement du mois (même effet que le
  1 tap). Retrait = sortie d'argent assumée sans jugement, plafonnée à ce qui est de côté.
- **Où** : `src/components/amount-modal.tsx`, `src/lib/actions.ts` (`withdraw`).

## 9. Notifications locales + deep link (boucle de rétention)

- **Quoi** : un rappel local par objectif actif, à sa date d'échéance à 9h, montant conseillé
  dans le message (« Mets X € de côté pour “Nom”. Même moins, c'est déjà bien. »). Le tap
  ouvre l'app directement sur le bon projet.
- **Comment** : `scheduleGoalReminder()` (trigger DATE, channel Android `reminders`),
  `data.goalId` dans la notification ; `addReminderOpenListener()` dans `_layout.tsx` route
  vers `/goal/[id]` (à chaud et à froid) et trace `reminder_opened`.
  ⚠️ expo-notifications est chargé **paresseusement** : indisponible sur web et Expo Go
  Android (crash à l'import sinon) — support complet sur iOS Expo Go et dev builds.
- **Où** : `src/lib/notifications.ts` (unique point d'accès au module), `src/app/_layout.tsx`.

## 10. Menu / switcher de projets (⋯)

- **Quoi** : accessible depuis tous les écrans — liste « Mes projets » (nom, % atteint,
  restants, badge Actif, Supprimer avec confirmation), puis Nouveau projet, Accueil,
  Ajuster ce plan, Voir un exemple, Ajuster mon budget, Confidentialité et CGU.
- **Où** : `src/components/menu-modal.tsx`, ouvert par `src/components/app-header.tsx`.

## 11. Exemple et pages légales

- **Quoi** : `/example` = plan statique de démonstration (récap sombre + « ensuite, chaque
  mois » pédagogique). `/legal` = positionnement (pas une banque), données locales, tracking
  anonyme, CGU de phase de test.
- **Où** : `src/app/example.tsx`, `src/app/legal.tsx`.

## 12. Persistance locale

- **Quoi** : budget, projets, versements, dernier projet consulté, installId — tout survit au
  redémarrage, uniquement sur le téléphone.
- **Comment** : zustand + middleware `persist` sur AsyncStorage (`mmg-store-v1`).
  `installId` généré une fois (`install-<timestamp>-<aléa>`, format de l'ancienne app).
- **Où** : `src/lib/store.ts`, types dans `src/lib/types.ts`.

## 13. Tracking de rétention (Supabase)

- **Quoi** : événements anonymes dans la table `events` du projet MMG-LAB — `app_open`,
  `goal_created`, `contribution_logged` (type deposit/withdrawal + bucket de montant),
  `reminder_opened`, `reminder_postponed`, `goal_deleted`. Aucune donnée utilisateur.
- **Comment** : `track()` fire-and-forget, no-op si `.env` absent. Montants bucketisés
  (`0_50`, `50_100`, `100_250`, `250_plus`). RLS « anon insert only » → jamais de `.select()`.
- **Où** : `src/lib/analytics.ts`, `src/lib/supabase.ts`, buckets dans `src/lib/plan.ts`.

## 14. Thème et composants UI

- **Quoi** : tokens de la direction visuelle (fond `#F4EFE6`, accent terracotta `#B5432A`,
  sombre `#2B211A`, radius généreux) et primitives (Screen, Card, Button 4 variantes, Field,
  ProgressBar, Eyebrow).
- **Où** : `src/constants/theme.ts`, `src/components/ui.tsx`.
