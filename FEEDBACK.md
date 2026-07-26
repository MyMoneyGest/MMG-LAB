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

- **2026-07-24 (n=1)** : les points de « Un projet. Un geste par mois. » (accueil) trouvés un
  peu secs. Ponctuation volontaire (rythme slogan). Alternative si on change : virgule
  (« Un projet, un geste par mois. »), plus douce. Fichier : `src/app/home.tsx`. Ne changer
  que si le retour se répète. Cosmétique, sans effet sur la mesure.

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

4. **Simulateur de prêts (comparaison de taux) + vitrine de placements**
   - *Analyse* : viole le positionnement fondateur (« pas une banque, outil de méthode, rien
     d'autre »). Risque réglementaire réel (recommandation de produits financiers = conseil
     en investissement / courtage encadrés). Contredit la CGU (« ne constitue pas un conseil
     financier »). Décrit en réalité une autre app (agrégateur fintech). Besoin sous-jacent
     réel (« que faire de l'argent épargné ? ») mais mauvaise réponse.
   - *Verdict* : à écarter, même à long terme, sauf pivot produit assumé.

---

## 2026-07-24 — Testeur : date de début différée du projet  ⭐ (priorité haute post-test)

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
- *Verdict* : après test (gel), mais **priorité plus haute** que anglais / FCFA / gamification.
  À prioriser si le retour se répète.
