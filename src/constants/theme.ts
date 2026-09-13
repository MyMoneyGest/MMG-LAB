// Direction visuelle MMG : premium et sobre, mais chaleureux.
// Fond blanc cassé chaud (pas blanc pur, pas de dark mode par défaut),
// une seule couleur d'accent (terracotta), le fond sombre est réservé
// aux moments marquants (récap de plan, confirmation de versement).

export const colors = {
  // Le fond est un sable chaud, franchement plus profond que les cartes : elles
  // n'ont ni ombre ni relief, donc c'est le seul écart qui les détache. Il était
  // de 1,93 sur 255 (0,8 %) — invisible, et les sections d'un écran se
  // confondaient. Il est maintenant d'environ 16, soit huit fois plus, ce qui
  // reste loin d'un gris franc : on cherche la lisibilité, pas le contraste.
  background: '#F1EADE',
  card: '#FDFBF7',
  cardSoft: '#F6E0D5',
  cardSoftBorder: '#C97A5E',

  accent: '#C04A31',
  accentPressed: '#A63F29',

  dark: '#2B211A',
  textOnDark: '#F7F2EA',
  textOnDarkMuted: '#B7ACA0',

  text: '#231F1A',
  textSecondary: '#6E675C',
  border: '#E3D8C6',

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
