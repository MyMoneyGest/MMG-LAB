# Retours utilisateurs — MMG

Journal des retours reçus pendant la phase de test. **On note tout, on n'implémente rien
pendant le test** (gel des fonctionnalités). Évaluation groupée à la fin des 3-4 mois, à la
lumière des données de rétention.

Pour chaque retour : source, date, l'idée, l'analyse (Claude Code), et le verdict/horizon.
Chercher les **motifs récurrents** (plusieurs personnes) plutôt que réagir à un retour isolé.

**Micro-ajustements cosmétiques** (copie, ponctuation, espacements…) : ne rien refaire au coup
par coup. On les **groupe pour le prochain build obligatoire** (avant l'expiration TestFlight
~90 j) → coût zéro, pas de churn réactive en plein test.

---

## Cosmétique — à grouper sur le prochain build

- ~~**2026-08-10 (Patrick)** : les très gros montants FCFA (> 100 000 000) étaient mal affichés —
  « FCFA » cassait sur deux lignes, et l'en-tête « Mis de côté / restants » se décalait /
  tronquait dès que le montant mis de côté était lui aussi élevé (deux gros nombres côte à
  côte).~~ **✅ CORRIGÉ (Claude Code, Session 43)** : helper déterministe `fitFontSize`
  (`format.ts`) + en-tête projet passé en disposition verticale (gros montant pleine largeur).
  Vérifié à l'écran (150 000 000 / 12 187 500 FCFA), non-régression euro OK, tests + tsc verts.

- **2026-07-24 (n=1)** : les points de « Un projet. Un geste par mois. » (accueil) trouvés un
  peu secs. Ponctuation volontaire (rythme slogan). Alternative si on change : virgule
  (« Un projet, un geste par mois. »), plus douce. Fichier : `src/app/home.tsx`. Ne changer
  que si le retour se répète. Cosmétique, sans effet sur la mesure.
  - **Intégré V2 — 2026-08-10** : formulation adoucie dans le Lot B groupé avec le
    multi-devises.
- ~~**2026-08-XX (Claude Code — vérif Lot A)** : l'écran Exemple réutilisait les chiffres euro
  relabellés en FCFA (« 3 500 FCFA » ≈ 5 €), magnitude irréaliste pour un public gabonais.~~
  **✅ CORRIGÉ (Claude Code)** : `example.tsx` a désormais un jeu de figures par devise —
  FCFA réaliste (objectif 2 000 000, 220 000/mois, reste 1 100 000, cohérent : cible − déjà =
  reste, mensualité × 5 = reste, mensualité ≤ capacité → Confortable). EUR inchangé, tsc OK,
  vérifié à l'écran (Gabon → FCFA, France → EUR), zéro erreur console.
- **2026-07-24 (Patrick)** : jour de rappel « le 1 » → « le **1er** » (règle FR : seul le
  jour 1 prend l'ordinal ; les jours 2-31 restent cardinaux « le 2 », « le 3 »…). Fichiers :
  `src/components/plan-summary.tsx` et `src/app/goal/[id].tsx`. À inclure au prochain build.
  - **Intégré V2 — 2026-08-10** : helper commun `formatReminderDay()` appliqué au
    récapitulatif, à l'écran projet et à la comparaison Avant → après.

---

## 2026-07-24 — Ami de Patrick (installation APK Android, n=1)

Contexte : premiers retours d'un proche. Aucune friction ni bug signalé (bon signe : le cœur
a assez bien marché pour qu'il se projette en v2). Les 4 idées vont toutes vers l'expansion.

1. **Version anglaise**
   - *Analyse* : aucun testeur actuel (forums FR) concerné. Infra multilingue à maintenir
     pendant une phase qui doit rester stable. Question d'expansion, pas de test.
   - *Verdict* : après test, faible priorité, conditionné à l'ambition internationale.

2. **Accroches pour faire revenir (type Duolingo, relances)**
   - *Analyse* : ⚠️ risque direct pour la MESURE — fabriquer de l'engagement artificiel
     corromprait le signal de rétention qu'on cherche à mesurer. Contredit le positionnement
     acté (non-punitif, sobre, « pas une app de trading »). Le mécanisme de retour existe
     déjà = le rappel mensuel, et c'est précisément ce qu'on teste.
   - *Verdict* : NE PAS ajouter pendant le test. À reconsidérer APRÈS, sobrement, seulement
     si la rétention mesurée est faible.

3. **Autres devises (ex. FCFA)**
   - *Analyse* : trahit une intuition de marché (Afrique francophone). Techniquement borné
     (montants formatés à la main dans `format.ts`). MAIS : dans ces marchés l'épargne passe
     surtout par le mobile money (Orange Money, MoMo), pas le virement bancaire — le modèle
     « fais le virement depuis ta banque » ne colle peut-être pas. Décision de marché cible,
     pas un simple changement d'étiquette.
   - *Verdict* : après test, si le marché Afrique francophone devient une cible. À creuser.
   - **MISE À JOUR 2026-08 (montée d'un cran)** : la campagne de recrutement en ligne (APK
     sur r/BetaTests/Discord) est un **fiasco** — quasi aucune installation. Patrick se rabat
     sur son **réseau perso Facebook** (camarades lycée/école), en majorité **francophone
     d'Afrique**. Il anticipe que beaucoup buteront sur l'**absence de FCFA**. → Le FCFA
     n'est plus une idée isolée : il révèle QUI est réellement à portée de Patrick. Signal de
     **marché**, pas de feature. Rappel : FCFA seul ne suffit pas (mobile money vs virement
     bancaire = le vrai chantier). ACTION : utiliser le post FB comme mini-étude (« l'utiliseriez-
     vous ? qu'est-ce qui manque ? comment épargnez-vous aujourd'hui ? ») et récolter les
     réponses ici avant toute décision.

4. **Simulateur de prêts (comparaison de taux) + vitrine de placements**
   - *Analyse* : viole le positionnement fondateur (« pas une banque, outil de méthode, rien
     d'autre »). Risque réglementaire réel (recommandation de produits financiers = conseil
     en investissement / courtage encadrés). Contredit la CGU (« ne constitue pas un conseil
     financier »). Décrit en réalité une autre app (agrégateur fintech). Besoin sous-jacent
     réel (« que faire de l'argent épargné ? ») mais mauvaise réponse.
   - *Verdict* : à écarter, même à long terme, sauf pivot produit assumé.

---

## 2026-07-24 — Testeur : date de début différée du projet  ⭐ (priorité haute post-test)

**Statut V2 — implémenté le 2026-08-10** : choix facultatif **Plus tard** à la création,
première ancre calculée après la date choisie, écran planifié sans action anticipée et aucune
notification avant l'activation. La rétention utilise un délai en jours dans `goal_created`
plutôt que la date exacte ; les requêtes démarrent donc la cohorte au bon moment.

Idée : pouvoir créer un projet dont le démarrage (plan + rappels) commence à une **date
future** choisie (« je m'y mets dans 2-3 mois »).

- *Analyse* : **meilleur retour reçu à ce jour** — il renforce le cœur (planifier = méthode),
  ne dilue pas le positionnement, et répond à un cas réel (projet en cours à finir, prime à
  venir…). Pas de workaround propre aujourd'hui (le « Reporter » est borné, ne saute pas des
  mois).
- ⚠️ *Piège de conception à ne PAS oublier à l'implémentation* : la « date d'activation »
  servant au calcul de rétention devra démarrer à la **date de début choisie**, pas à la date
  de `goal_created`. Sinon un « démarrage différé » ressemble à un abandon immédiat dans les
  requêtes (cf. `scripts/retention-queries.sql`, section 3) → mesure faussée. Même famille de
  piège que la notif de test.
- *Verdict* : intégré à la V2 avec compatibilité des anciens projets.

---

## 2026-07-24 — Patrick (dogfooding) : mode « épargne libre » sans budget/revenus  ⭐⭐ (insight structurant)

**Statut V2 — implémenté le 2026-08-10** : second cadre de projet, choisi avant la création.
Budget et montant conseillé sont retirés, mais l'objectif, la progression et le rappel mensuel
restent présents. Les projets libres sont exclus des réajustements budgétaires et séparés dans
les requêtes de rétention (`savingsMode=free`).

Découvert par Patrick en essayant d'utiliser l'app pour son propre cas : entrepreneur à
revenus **irréguliers et non quantifiables à l'avance**. Il « subit » des rentrées d'argent
distinctes du salaire, ne peut pas les budgéter, mais veut en mettre une partie de côté au fil
de l'eau (« comme un fichier Excel qu'on remplit quand l'argent rentre »).

- *Constat* : MMG suppose aujourd'hui un revenu régulier et quantifiable (budget → capacité
  prudente → montant conseillé). Cette hypothèse fondatrice exclut une grosse population :
  entrepreneurs, freelances, commissions, saisonniers. C'est un **second mode** possible :
  « épargne libre » = un objectif + des versements quand on peut, **sans budget imposé ni
  montant mensuel calculé**, mais **avec le rappel conservé**.
- *On-positionnement* : oui — reste méthode manuelle + rituel, pas de produit à côté. Élargit
  QUI la méthode sert plutôt que de la dénaturer.
- ⚠️ *Tension stratégique* : si on retire budget + montant conseillé, qu'est-ce qui distingue
  MMG d'un simple tableur (que Patrick cite lui-même) ? Réponse : le **rituel** (rappel qui
  fait revenir) + la visualisation de progression. → en mode libre, GARDER le rappel, sinon
  MMG *devient* l'Excel.
- ⚠️ *Piège mesure* : l'épargnant irrégulier verse par à-coups (gros dépôt ponctuel, puis
  rien). Il peut être fidèle sans coller à la cadence mensuelle → risque de passer pour un
  abandon dans la métrique actuelle. À gérer si ce mode est développé.
- *Verdict* : après test (gel), **priorité stratégique haute** — remet en cause l'hypothèse
  « tout le monde a un revenu régulier à budgéter ». Possiblement le retour le plus structurant
  reçu. À croiser avec les données de rétention (les revenus irréguliers churnent-ils plus ?).
