// Système de devises manuel (fr-FR), sans dépendre d'Intl (Hermes).
// V2 — Lot A : ajoute le multi-devises en GARDANT l'euro à l'identique de la V1.
//
// Fichier VOLONTAIREMENT autonome (aucun import) : les tests (.mjs) transpilent
// chaque fichier isolément, donc `currency.ts` doit se suffire à lui-même.
// `formatEuro` reste dans format.ts pour la compatibilité des anciens tests ;
// les écrans V2 utilisent `formatMoney(montant, currencyCode)` via useMoney.

export type CurrencyCode = 'EUR' | 'XAF' | 'XOF' | 'USD';

export interface CurrencyDef {
  code: CurrencyCode;
  /** Symbole affiché (« € », « FCFA », « $ »). */
  symbol: string;
  /** Symbole placé APRÈS le montant (true) ou avant (false). */
  symbolAfter: boolean;
  /** Nombre de décimales (0 pour le FCFA — pas de centimes). */
  decimals: number;
  /** Masquer « ,00 » quand le montant est entier (comportement V1 de l'euro). */
  hideZeroDecimals: boolean;
  /** Nom lisible. */
  name: string;
}

export const CURRENCIES: Record<CurrencyCode, CurrencyDef> = {
  EUR: {
    code: 'EUR',
    symbol: '€',
    symbolAfter: true,
    decimals: 2,
    hideZeroDecimals: true,
    name: 'Euro',
  },
  // FCFA Afrique centrale (Gabon, Cameroun, Congo…). Pas de centimes en usage.
  XAF: {
    code: 'XAF',
    symbol: 'FCFA',
    symbolAfter: true,
    decimals: 0,
    hideZeroDecimals: true,
    name: 'Franc CFA (Afrique centrale)',
  },
  // FCFA Afrique de l'Ouest (Sénégal, Côte d'Ivoire…). Même parité fixe à l'euro.
  XOF: {
    code: 'XOF',
    symbol: 'FCFA',
    symbolAfter: true,
    decimals: 0,
    hideZeroDecimals: true,
    name: "Franc CFA (Afrique de l'Ouest)",
  },
  // Dollar : réglages provisoires (devise « plus tard » selon la roadmap).
  USD: {
    code: 'USD',
    symbol: '$',
    symbolAfter: true,
    decimals: 2,
    hideZeroDecimals: false,
    name: 'Dollar US',
  },
};

export const DEFAULT_CURRENCY: CurrencyCode = 'EUR';

function groupThousands(intStr: string): string {
  let grouped = '';
  let rest = intStr;
  while (rest.length > 3) {
    grouped = '\u202f' + rest.slice(-3) + grouped;
    rest = rest.slice(0, -3);
  }
  return rest + grouped;
}

/**
 * Formate un montant dans la devise donnée (fr-FR : espace fine insécable pour
 * les milliers, virgule pour les décimales). L'euro reproduit exactement le
 * rendu V1, y compris l'espace insécable avant le symbole.
 */
export function formatMoney(amount: number, code: CurrencyCode = DEFAULT_CURRENCY): string {
  const def = CURRENCIES[code] ?? CURRENCIES[DEFAULT_CURRENCY];
  const factor = Math.pow(10, def.decimals);
  const rounded = Math.round(amount * factor) / factor;
  const sign = rounded < 0 ? '-' : '';
  const abs = Math.abs(rounded);
  const int = Math.trunc(abs);
  const grouped = groupThousands(String(int));

  let decStr = '';
  if (def.decimals > 0) {
    const dec = Math.round((abs - int) * factor);
    if (dec > 0 || !def.hideZeroDecimals) {
      decStr = ',' + String(dec).padStart(def.decimals, '0');
    }
  }

  const number = `${sign}${grouped}${decStr}`;
  return def.symbolAfter ? `${number}\u00a0${def.symbol}` : `${def.symbol}${number}`;
}

/** Pays proposés au premier lancement (starter — Codex peut étendre). */
export interface CountryDef {
  code: string; // ISO 3166-1 alpha-2
  name: string;
  flag: string;
  currency: CurrencyCode;
}

export const COUNTRIES: CountryDef[] = [
  // Afrique centrale (XAF)
  { code: 'GA', name: 'Gabon', flag: '🇬🇦', currency: 'XAF' },
  { code: 'CM', name: 'Cameroun', flag: '🇨🇲', currency: 'XAF' },
  { code: 'CG', name: 'Congo', flag: '🇨🇬', currency: 'XAF' },
  { code: 'TD', name: 'Tchad', flag: '🇹🇩', currency: 'XAF' },
  { code: 'CF', name: 'République centrafricaine', flag: '🇨🇫', currency: 'XAF' },
  { code: 'GQ', name: 'Guinée équatoriale', flag: '🇬🇶', currency: 'XAF' },
  // Afrique de l'Ouest (XOF)
  { code: 'SN', name: 'Sénégal', flag: '🇸🇳', currency: 'XOF' },
  { code: 'CI', name: "Côte d'Ivoire", flag: '🇨🇮', currency: 'XOF' },
  { code: 'ML', name: 'Mali', flag: '🇲🇱', currency: 'XOF' },
  { code: 'BF', name: 'Burkina Faso', flag: '🇧🇫', currency: 'XOF' },
  { code: 'BJ', name: 'Bénin', flag: '🇧🇯', currency: 'XOF' },
  { code: 'TG', name: 'Togo', flag: '🇹🇬', currency: 'XOF' },
  { code: 'NE', name: 'Niger', flag: '🇳🇪', currency: 'XOF' },
  // Zone euro (échantillon)
  { code: 'FR', name: 'France', flag: '🇫🇷', currency: 'EUR' },
  { code: 'BE', name: 'Belgique', flag: '🇧🇪', currency: 'EUR' },
  // Dollar
  { code: 'US', name: 'États-Unis', flag: '🇺🇸', currency: 'USD' },
];

const COUNTRY_CURRENCY: Record<string, CurrencyCode> = COUNTRIES.reduce(
  (acc, c) => {
    acc[c.code] = c.currency;
    return acc;
  },
  {} as Record<string, CurrencyCode>
);

/** Devise par défaut d'un pays (fallback EUR). Sert au pré-remplissage. */
export function defaultCurrencyForCountry(country?: string): CurrencyCode {
  if (!country) return DEFAULT_CURRENCY;
  return COUNTRY_CURRENCY[country.toUpperCase()] ?? DEFAULT_CURRENCY;
}
