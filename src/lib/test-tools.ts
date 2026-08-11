// Outils de test réservés au développement et aux builds de test explicites,
// JAMAIS présents en distribution :
//   - le rappel de test (appui long sur le M), dont les actions Fait/Modifier/
//     Reporter modifieraient le vrai plan de l'utilisateur ;
//   - l'aperçu du coup de pouce à mi-parcours (« Voir un aperçu »).
//
// Activé par `__DEV__` (dev local) ou par la variable d'environnement
// EXPO_PUBLIC_MMG_TEST_TOOLS=1, positionnée uniquement par le profil de build
// « preview-test » (cf. eas.json). Les profils `preview` et `production` de
// distribution ne la définissent pas → ces outils y sont absents.
export const TEST_TOOLS_ENABLED =
  __DEV__ || process.env.EXPO_PUBLIC_MMG_TEST_TOOLS === '1';
