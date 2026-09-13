// Direction visuelle MMG : premium et sobre, mais chaleureux.
// La page est blanche et ce sont les CARTES qui portent la chaleur, teintées
// et plus foncées qu'elle. Le terracotta reste réservé à l'accent, et le fond
// sombre aux moments marquants (récap de plan, confirmation de versement).
// Pas de dark mode pour l'instant.

export const colors = {
  // Page blanche. La séparation des sections vient donc des cartes, qui sont
  // plus FONCÉES que la page — l'inverse de la disposition habituelle, et le
  // seul moyen de garder des sections lisibles sur un fond blanc.
  //
  // Le fond valait #F9F6F0 dans la version publiée, à 1,93 de luminance des
  // cartes sur 255 (0,8 %) : invisible, les sections se confondaient. L'écart
  // est maintenant de 20,7. Les cartes n'ayant ni ombre ni relief, c'est lui
  // qui fait tout le travail — voir le garde-fou dans test-design.mjs.
  background: '#FFFFFF',

  // Parchemin taupe : chaud, mais désaturé et sans jaune doré. La nuance
  // décide du registre — un crème plus sucré (#F7F3EC, essayé) évoque le
  // papier de pâtisserie, pas la valeur. On garde la chaleur, on retire le
  // sucre, et le terracotta reste le seul vrai accent au lieu d'être
  // concurrencé par la surface qui l'entoure.
  card: '#EFEAE0',
  // Mise en avant SUR une carte. Elle ne ressort que de 6,5 en luminance : c'est
  // le contraste de TEINTE qui fait le travail, ce rose chaud contre le taupe
  // désaturé de la carte. Ne pas la juger au seul écart de clarté.
  cardSoft: '#F6E0D5',
  cardSoftBorder: '#C97A5E',

  // Surfaces en creux posées SUR une carte : champs de saisie, recherche,
  // boutons de mois du calendrier. Distinct de `background`, qui est la page.
  // Les deux ont longtemps eu la même valeur, tant que la page était quasi
  // blanche — au point qu'une tentative de teinter la page a transformé chaque
  // champ en pastille colorée rivalisant avec l'accent. Un creux doit
  // s'effacer, pas attirer l'œil : il se règle donc par rapport à `card`.
  field: '#E4DDD0',

  accent: '#C04A31',
  accentPressed: '#A63F29',

  dark: '#2B211A',
  textOnDark: '#F7F2EA',
  textOnDarkMuted: '#B7ACA0',

  text: '#231F1A',
  textSecondary: '#6E675C',
  border: '#DED6C8',

  success: '#5BA97C',
  banner: '#F3DCCF',

  // Progression encourageante : jamais de rouge d'alerte au démarrage.
  // Les teintes restent assez sombres pour conserver la lisibilité du pourcentage.
  progress: {
    start: '#8A6554',
    steady: '#B5432A',
    advanced: '#96641F',
    complete: '#3F7D59',
  },

  category: {
    emergency: '#2E7D8A',
    car: '#3A6EA5',
    moving: '#C08A2D',
    travel: '#8A3A62',
    housing: '#4F8B5B',
    other: '#6E675C',
  },
} as const;

/** Paliers de la progression, en pourcentage atteint. */
const PROGRESS_THRESHOLDS = [
  { from: 100, color: colors.progress.complete },
  { from: 70, color: colors.progress.advanced },
  { from: 35, color: colors.progress.steady },
  { from: 0, color: colors.progress.start },
] as const;

/**
 * Couleur de l'avancement. La teinte porte une partie de l'information : voir
 * un anneau vert suffit à savoir où on en est sans lire le pourcentage.
 *
 * Calculé en JS plutôt qu'interpolé par une animation : sur `react-native-svg`,
 * un `stroke` passé en `animatedProps` n'est appliqué qu'à la valeur initiale
 * et ne suit pas l'animation — l'anneau restait brun à 100 %. Même raison que
 * `fitFontSize` : on veut un résultat identique sur web et natif.
 */
export function progressColor(pct: number): string {
  const value = Math.min(100, Math.max(0, pct));
  return (PROGRESS_THRESHOLDS.find((step) => value >= step.from) ?? PROGRESS_THRESHOLDS[3]).color;
}

// Titres de questions et noms de projet en serif éditorial ; tout le reste
// (chiffres, libellés, paragraphes) en Sans, pour un rendu "rigoureux et bancaire".
export const fonts = {
  serifBold: 'Serif-Bold',
  serifItalic: 'Serif-Italic',
  sansRegular: 'Sans-Regular',
  sansSemiBold: 'Sans-SemiBold',
  sansBold: 'Sans-Bold',
} as const;

export const radius = {
  card: 22,
  button: 18,
  field: 14,
} as const;

export const spacing = {
  screen: 16,
  card: 18,
} as const;
