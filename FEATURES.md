# FEATURES — MMG

Description technique de toutes les fonctionnalités : ce qu'elles font, comment elles
fonctionnent, où elles vivent dans le code. **Mis à jour à chaque fonctionnalité ajoutée ou
modifiée**, pas après coup.

Dernière mise à jour : 2026-07-12 (Codex).

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
  puis choix entre trois rythmes : **stable** (même montant), **progressif** (effort croissant)
  et **régressif** (effort décroissant). Chaque carte affiche la moyenne et le mois-pic.
  L'aperçu sombre indique le rythme et, si le montant varie, la première et la dernière
  échéance. Le diagnostic de compatibilité est calculé sur le mois le plus élevé, pas sur la
  moyenne. Mode édition via `?editId=` (menu « Ajuster ce plan »).
- **Suggestions** : sélectionner une catégorie préremplit le nom correspondant. Changer de
  catégorie actualise un nom suggéré, sans écraser un nom personnalisé ; « Autre » vide le
  champ pour laisser l'utilisateur nommer librement son projet.
- **Saisie** : la date cible est une seule ligne `JJ / MM / AAAA` dont les séparateurs restent
  toujours visibles. Chaque bloc utilise le clavier numérique et passe automatiquement au
  suivant. L'écran reste défilable et remonte son contenu lorsque le clavier est affiché.
- **Comment** : les rythmes progressif et régressif utilisent des poids linéaires bornés de
  0,7 à 1,3, dont la moyenne vaut 1. La répartition conserve le total exact au centime.
  `createGoal()` orchestre : store + première demande de permission notifications (uniquement
  ici, jamais à l'ouverture) + programmation du rappel + événement `goal_created`.
- **Où** : `src/app/onboarding/new-goal.tsx`, `src/lib/actions.ts` (`createGoal`),
  `src/components/plan-summary.tsx`.

## 5. Écran projet (cœur de l'app)

- **Quoi** : carte plan (nom, description par catégorie, barre de progression, % atteint /
  déjà mis / restants / cible) + 3 onglets :
  - **Aujourd'hui** : « Action du mois » (montant conseillé + date de rappel), boutons
    **Versement fait (X €)** (1 tap), Montant différent, Reporter, Retrait.
    Le jour mensuel ouvre une petite fenêtre dédiée avec un seul champ « Jour du mois
    (1 à 28) » et les boutons Annuler / Valider. L'édition complète du plan ne s'ouvre plus.
  - **Échéancier** : occurrences mensuelles futures jusqu'à la cible avec montants reflétant
    le rythme stable, progressif ou régressif choisi.
  - **Historique** : versements (+vert) et retraits (−terracotta) datés.
  Bannière si permission de notification manquante (fidèle à l'ancienne app).
- **Comment** : le reste à financer est redistribué sur les échéances selon le rythme choisi,
  puis recalculé après chaque geste : les écarts sont absorbés sans pénalité. Les projets créés
  avant l'ajout de ce réglage restent automatiquement en rythme stable (`rhythm ?? 'stable'`).
  Le rattachement aux cycles suit les règles détaillées en section 8 : une dette est soldée en
  priorité, tandis qu'un surplus ne supprime pas le rappel mensuel.
- **Où** : `src/app/goal/[id].tsx`, `src/lib/plan.ts` (`suggestedAmount`, `upcomingSchedule`,
  `savedTotal`…), `src/lib/actions.ts` (`confirmContribution`, `withdraw`).

## 6. Confirmation de versement (« moment marquant »)

- **Quoi** : écran sombre plein écran après tout versement — check terracotta, montant,
  message encourageant (« Même moins que prévu, c'est déjà bien »), prochain rappel + montant,
  variante « objectif atteint 🎉 ».
- **Rattachement visible** : lorsqu'un versement solde une dette, l'écran indique le cycle
  concerné (« Ce versement compte pour juillet. »).
- **Où** : `src/components/confirmation-overlay.tsx` (le fond sombre est réservé à ces moments,
  cf. direction visuelle).

## 7. Report de rappel

- **Quoi** : modal « Quand te le rappeler ? » — Demain / Dans 3 jours / Dans 7 jours (dates
  affichées) ou date précise JJ/MM/AAAA. Message d'erreur si permission de notification
  manquante (« Report impossible pour le moment… »).
- **Saisie** : la fenêtre compacte affiche une seule ligne `JJ / MM / AAAA` dont les deux
  séparateurs restent visibles avant et pendant la saisie. Elle reste défilable au-dessus du
  clavier et peut être fermée par son bouton Annuler,
  le bouton retour Android ou un appui sur l'arrière-plan.
- **Limite avant l'ancre** : tant que le jour du rappel n'est pas arrivé, le report ne peut pas
  le dépasser (rappel le 28 juillet → le 29 juillet est refusé avant le 28).
- **Limite à partir de l'ancre** : le jour du rappel arrivé, le report peut aller jusqu'à la
  veille de l'ancre suivante (le 28 juillet → jusqu'au 27 août inclus). La fenêtre affiche la
  limite active, masque les raccourcis hors limite et la logique métier refuse tout dépassement.
- **Ancre immuable** : le report crée un unique rappel ponctuel pour le cycle ciblé ; il ne
  change jamais le jour mensuel. L'ancre suivante reste donc programmée et ouvre son propre
  cycle, sans fusion ni mois sauté.
- **Proximité informative** : si la date choisie se situe à trois jours ou moins de l'ancre
  suivante, une simple ligne rappelle sa date. Il n'existe aucune question « garder/ignorer »
  et aucune règle de proximité ne supprime un rappel.
- **Extinction par cycle** : dès qu'un cycle est soldé, ses notifications programmées sont
  annulées silencieusement. Une autre ancre ne disparaît que si son propre cycle est soldé.
- **Comment** : `postponeReminder()` revérifie la permission, rattache le report au cycle le
  plus ancien en attente, reprogramme les cycles et trace `reminder_postponed`.
- **Où** : `src/components/report-modal.tsx`, `src/lib/plan.ts`
  (`postponeDateLimit`, `postponeIsNearNextAnchor`, `cyclesAfterPostpone`),
  `src/lib/actions.ts`, `src/lib/notifications.ts`.

## 8. Montant différent / Retrait

- **Quoi** : modals de saisie libre. Montant différent suit le même parcours que le 1 tap
  (dette, extra ou choix du mois). Retrait = sortie d'argent assumée sans jugement, plafonnée à ce qui est de côté.
  Les fenêtres sont compactes, défilables et protégées contre le recouvrement par le clavier.
- **Cycles et dettes** : chaque ancre correspond à un cycle. Un versement solde toujours le
  cycle non soldé le plus ancien ; dans ce cas, le rattachement est automatique et visible.
  Le montant peut être inférieur au conseil : le cycle est tout de même soldé.
- **Sans dette** : le versement est un surplus par défaut. Il augmente la progression et
  recalcule le plan, sans solder le cycle courant ou un cycle futur. Avant l'ancre, un choix
  radio permet explicitement de conserver ce défaut ou de compter le geste comme versement du
  mois ; seule cette seconde option solde le cycle en avance.
- **Versements rapprochés** : avant un nouveau versement, MMG recherche ceux des trois derniers
  jours. S'il en trouve, une confirmation affiche chaque montant et chaque date ; l'utilisateur
  peut annuler ou confirmer explicitement le nouveau versement. Cette vérification précède le
  choix surplus/mois lorsque les deux sont nécessaires.
- **Où** : `src/components/amount-modal.tsx`, `src/components/recent-contribution-modal.tsx`,
  `src/components/contribution-choice-modal.tsx`, `src/lib/plan.ts` (`recentDeposits`,
  `contributionPlan`, `settleReminderCycle`), `src/lib/actions.ts`.

## 9. Notifications locales + deep link (boucle de rétention)

- **Quoi** : des rappels locaux datés et rattachés à leurs cycles (report ponctuel et ancres
  mensuelles distinctes), à 9h, avec le montant de
  la prochaine échéance calculé selon le rythme choisi (« Mets X € de côté pour “Nom”. Même
  moins, c'est déjà bien. »). Le tap ouvre l'app directement sur le bon projet. La notification
  propose aussi trois actions : **Fait**, **Modifier**, **Reporter**.
- **Actions** : Fait exécute la même confirmation en un tap et affiche l'écran de confirmation ;
  Modifier ouvre la saisie d'un autre montant ; Reporter ouvre les choix de date. Dans les trois
  cas, l'onglet Aujourd'hui du projet porté par `data.goalId` est ouvert.
- **Test caché** : maintenir le **M** du logo pendant 700 ms programme un rappel test après
  15 secondes pour le projet affiché (ou le dernier projet actif). Une confirmation immédiate
  indique quel projet sera utilisé. Sur Android, il faut déplier la notification pour voir les
  trois actions. Une seule notification de test reste programmée à la fois.
- **Message contextuel** : les surplus du cycle sont additionnés dans le rappel d'ancre
  (« Tu as déjà mis X € ce mois-ci… »). Chaque nouveau surplus reprogramme les rappels afin que
  le message et le montant conseillé restent à jour.
- **Ouverture normale de l'app** : si un rappel est encore dans le tiroir Android, MMG le retire
  puis affiche une fenêtre compacte au-dessus de l'écran courant avec **Fait**, **Modifier**,
  **Reporter** et **Fermer pour le moment**. Plusieurs rappels sont mis en file sans doublon.
  Un rappel reçu pendant que l'app est déjà ouverte utilise la même fenêtre.
- **Extinction fiable** : les identifiants natifs sont stockés par cycle. Un versement qui solde
  un cycle annule son ancre ou son report, sans toucher aux notifications des autres cycles ;
  une réponse native déjà associée à un cycle soldé est ignorée lors du routage.
- **Nettoyage système** : un tap simple ou une action effectuée directement depuis la
  notification retire explicitement celle-ci du tiroir avant le routage vers le projet. Un
  versement retire également le rappel déjà affiché du cycle qu'il vient de solder, sans
  retirer celui d'un autre cycle.
- **Comment** : `scheduleGoalReminders()` (triggers DATE, channel Android `reminders`) et
  `scheduleTestReminder()` (trigger TIME_INTERVAL, channel `reminder_tests_v2`) utilisent la
  catégorie `mmg_reminder_actions`. `addReminderOpenListener()` déduplique les réponses,
  retire la notification, efface la dernière réponse native après traitement et route vers
  `/goal/[id]` à chaud comme à froid. `takePresentedReminders()` inspecte les notifications
  présentes à l'ouverture. L'écran projet attend l'hydratation du store avant de décider qu'un
  projet manque. Les ouvertures et gestes issus du test ne sont pas envoyés à Supabase.
  Aucun son personnalisé n'est déclaré : cela évite qu'Android interprète `default` comme un
  fichier absent du binaire.
  ⚠️ expo-notifications est chargé **paresseusement** : indisponible sur web et Expo Go
  Android (crash à l'import sinon) — support complet sur iOS Expo Go et dev builds.
- **Où** : `src/lib/notifications.ts` (unique point d'accès au module), `src/app/_layout.tsx`,
  `src/lib/notification-model.ts`, `src/components/pending-reminder-modal.tsx`,
  `src/components/app-header.tsx`, `src/app/goal/[id].tsx`.

## 10. Menu / switcher de projets (⋯)

- **Quoi** : accessible depuis tous les écrans — liste « Mes projets » (nom, % atteint,
  restants, badge Actif, Supprimer avec confirmation), puis Nouveau projet, Accueil,
  Ajuster ce plan, Voir un exemple, Ajuster mon budget, Confidentialité et CGU. Le projet
  actuellement consulté est toujours présenté en tête de liste, sans modifier l'ordre stocké.
- **Où** : `src/components/menu-modal.tsx`, ouvert par `src/components/app-header.tsx`.

## 11. Exemple et pages légales

- **Quoi** : `/example` = plan statique de démonstration (récap sombre + « ensuite, chaque
  mois » pédagogique). `/legal` = éditeur et contact, positionnement (pas une banque),
  données locales, tracking pseudonymisé détaillé, notifications, suppression et droits,
  CGU de phase de test. Contact : `mymoneygest@mail.com`.
- **Où** : `src/app/example.tsx`, `src/app/legal.tsx`.

## 12. Persistance locale

- **Quoi** : budget, projets (dont leur rythme et leurs éventuelles échéances reportée/mensuelle),
  versements, dernier projet consulté,
  installId — tout survit au redémarrage, uniquement sur le téléphone.
- **Comment** : zustand + middleware `persist` sur AsyncStorage (`mmg-store-v1`).
  `installId` généré une fois (`install-<timestamp>-<aléa>`, format de l'ancienne app).
- **Où** : `src/lib/store.ts`, types dans `src/lib/types.ts`.

## 13. Tracking de rétention (Supabase)

- **Quoi** : événements pseudonymisés dans la table `events` du projet MMG-LAB — `app_open`,
  `goal_created` (catégorie générale + rythme), `contribution_logged` (type
  deposit/withdrawal + bucket de montant),
  `reminder_opened`, `reminder_postponed`, `goal_deleted`. Aucune donnée utilisateur.
- **Comment** : `track()` fire-and-forget, no-op si `.env` absent. Montants bucketisés
  (`0_50`, `50_100`, `100_250`, `250_plus`). RLS « anon insert only » → jamais de `.select()`.
  Les notifications marquées `isTest` et les gestes déclenchés depuis leurs actions sont
  volontairement exclus du tracking afin de ne pas fausser la mesure de rétention.
- **Où** : `src/lib/analytics.ts`, `src/lib/supabase.ts`, buckets dans `src/lib/plan.ts`.

## 14. Thème et composants UI

- **Quoi** : tokens de la direction visuelle (fond `#F4EFE6`, accent terracotta `#B5432A`,
  sombre `#2B211A`, radius généreux) et primitives (Screen, Card, Button 4 variantes, Field,
  ProgressBar, Eyebrow). Les champs sont compacts, bordés, signalent clairement le focus et
  les erreurs ; `Screen` centralise l'évitement du clavier et le défilement des formulaires.
  `KeyboardSafeScrollView` révèle le champ dès le focus, conserve 64 px d'espace avec le clavier,
  puis recalcule sa position après l'animation Android, sans attendre la première frappe.
- **Où** : `src/constants/theme.ts`, `src/components/ui.tsx`.
