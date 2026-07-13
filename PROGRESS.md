# Journal d'avancement — MMG

Journal partagé entre les IA (Claude Code, Codex) et Patrick. Objectif : celui qui prend le
relais sait exactement où on en est, sans relire tout l'historique git.

**Règles** : mise à jour à CHAQUE session de travail (pas en fin de chantier). Entrées datées,
signées, les plus récentes en haut. Chaque entrée dit : ce qui a été fait, ce qui est en cours,
ce qui vient ensuite.

---

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
