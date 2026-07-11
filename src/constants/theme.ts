// Direction visuelle MMG : premium et sobre, mais chaleureux.
// Fond blanc cassé chaud (pas blanc pur, pas de dark mode par défaut),
// une seule couleur d'accent (terracotta), le fond sombre est réservé
// aux moments marquants (récap de plan, confirmation de versement).

export const colors = {
  background: '#F4EFE6',
  card: '#FBF8F1',
  cardSoft: '#F6E0D5',
  cardSoftBorder: '#C97A5E',

  accent: '#B5432A',
  accentPressed: '#9C3823',

  dark: '#2B211A',
  textOnDark: '#F7F2EA',
  textOnDarkMuted: '#B7ACA0',

  text: '#231F1A',
  textSecondary: '#6E675C',
  border: '#E7DFD2',

  success: '#5BA97C',
  banner: '#F3DCCF',

  category: {
    emergency: '#2E7D8A',
    car: '#3A6EA5',
    moving: '#C08A2D',
    travel: '#8A3A62',
    other: '#6E675C',
  },
} as const;

export const radius = {
  card: 26,
  button: 22,
  field: 16,
} as const;

export const spacing = {
  screen: 18,
  card: 22,
} as const;
