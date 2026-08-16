// Direction visuelle MMG : premium et sobre, mais chaleureux.
// Fond blanc cassé chaud (pas blanc pur, pas de dark mode par défaut),
// une seule couleur d'accent (terracotta), le fond sombre est réservé
// aux moments marquants (récap de plan, confirmation de versement).

export const colors = {
  background: '#F9F6F0',
  card: '#FBF8F1',
  cardSoft: '#F6E0D5',
  cardSoftBorder: '#C97A5E',

  accent: '#C04A31',
  accentPressed: '#A63F29',

  dark: '#2B211A',
  textOnDark: '#F7F2EA',
  textOnDarkMuted: '#B7ACA0',

  text: '#231F1A',
  textSecondary: '#6E675C',
  border: '#E7DFD2',

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
    other: '#6E675C',
  },
} as const;

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
