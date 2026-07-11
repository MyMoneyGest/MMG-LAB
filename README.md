# MMG — MyMoneyGest

App d'épargne de projet **100 % manuelle** : budget → capacité d'épargne → plan réaliste →
versements manuels confirmés → encouragements. Ce n'est pas une banque, elle n'est pas connectée
à ta banque, pas de compte à créer. Le tout-manuel est la méthode (référence YNAB), pas une
contrainte technique.

Reconstruction complète après perte du code d'origine — les décisions produit de référence sont
dans `../brief-reconstruction-mmg.md`.

## Démarrage

```bash
npm install
cp .env.example .env   # puis renseigner EXPO_PUBLIC_SUPABASE_ANON_KEY
npx expo start         # i = iOS (Expo Go), a = Android, w = web
```

Sans `.env` renseigné, l'app fonctionne normalement — seul le tracking d'événements est désactivé.

## Vérifications avant livraison

```bash
npm run test:notifications  # routage, retrait, déduplication et configuration sonore
npx tsc --noEmit            # cohérence TypeScript de toute l'application
npx expo export --platform android --output-dir /tmp/mmg-android-check
```

Ces contrôles sont exécutés par l'IA avant qu'une modification soit annoncée comme prête. Le
test sur téléphone sert ensuite de confirmation du comportement natif Android.

## Architecture

- `src/app/` — écrans (expo-router, deep-linkables). `index.tsx` fait l'aiguillage d'ouverture :
  projet avec versement dû/en retard (le plus urgent d'abord) → sinon dernier projet consulté.
- `src/lib/plan.ts` — logique pure du plan : capacité prudente (reste à vivre − marge 20 %),
  répartition stable, progressive ou régressive du reste à financer, recalcul non-punitif
  après tout versement (n'importe quel montant marque le mois comme fait).
- `src/lib/notifications.ts` — un rappel local par objectif à son échéance (9h), montant conseillé
  dans le message, deep link `mmg://goal/[id]`. Permission demandée uniquement à la création du
  premier objectif. Inactif sur web.
- `src/lib/analytics.ts` — insertion d'événements dans la table Supabase `events`
  (tracking de rétention uniquement, aucune donnée utilisateur) : `app_open`, `goal_created`,
  `contribution_logged` (montants bucketisés), `reminder_opened`, `reminder_postponed`,
  `goal_deleted`.
- `src/lib/store.ts` — état persistant local (zustand + AsyncStorage), seule source de vérité
  des données utilisateur.

## Boucle de rétention (priorité n°1)

Notification locale → deep link vers le bon projet → **confirmation du versement en un tap**
(« Versement fait (X €) ») → écran sombre de confirmation → rappel suivant reprogrammé.
C'est cette boucle qui conditionne la validité du test de rétention au 3e rappel.

## Builds

- **Android (APK, lien direct)** : `eas build --profile preview --platform android`
- **Dev build Android** : `eas build --profile development --platform android`
- **iOS (TestFlight)** : `eas build --profile production --platform ios` puis `eas submit`
- Compte Expo : `mymoneygest` (projet historique : `mmg-france-expo-go-lab`).

## Suivi de rétention

Requêtes SQL directes dans Supabase (projet MMG-LAB, ref `ffoxlogtnstbagxitein`), pas de
dashboard. Seuils de décision et protocole : voir le brief, section 5.
