# Retours utilisateurs — MMG

Journal des retours reçus pendant la phase de test. **On note tout, on n'implémente rien
pendant le test** (gel des fonctionnalités). Évaluation groupée à la fin des 3-4 mois, à la
lumière des données de rétention.

Pour chaque retour : source, date, l'idée, l'analyse (Claude Code), et le verdict/horizon.
Chercher les **motifs récurrents** (plusieurs personnes) plutôt que réagir à un retour isolé.

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
