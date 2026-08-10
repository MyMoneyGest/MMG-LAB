import type { CurrencyCode } from './currency';

const CFA_PER_EURO = 655.957;
const RATE_ENDPOINT = 'https://api.frankfurter.dev/v2/rate/EUR/USD?providers=ECB';
const REQUEST_TIMEOUT_MS = 7_000;

export interface ExchangeRateSuggestion {
  /** Nombre d'unités de la devise cible pour une unité de la devise source. */
  rate: number;
  date: string;
  source: 'Parité fixe EUR/FCFA' | 'Banque centrale européenne via Frankfurter';
}

function fixedUnitsPerEuro(code: CurrencyCode): number | null {
  if (code === 'EUR') return 1;
  if (code === 'XAF' || code === 'XOF') return CFA_PER_EURO;
  return null;
}

export function fixedExchangeRate(
  from: CurrencyCode,
  to: CurrencyCode
): ExchangeRateSuggestion | null {
  if (from === to) {
    return { rate: 1, date: new Date().toISOString().slice(0, 10), source: 'Parité fixe EUR/FCFA' };
  }
  const fromUnits = fixedUnitsPerEuro(from);
  const toUnits = fixedUnitsPerEuro(to);
  if (fromUnits === null || toUnits === null) return null;
  return {
    rate: toUnits / fromUnits,
    date: new Date().toISOString().slice(0, 10),
    source: 'Parité fixe EUR/FCFA',
  };
}

type FrankfurterRate = { date?: string; rate?: number };

/**
 * Propose un taux sans jamais envoyer les montants de l'utilisateur. Pour les
 * paires avec USD, seule la paire technique EUR/USD est demandée au réseau.
 */
export async function fetchSuggestedExchangeRate(
  from: CurrencyCode,
  to: CurrencyCode
): Promise<ExchangeRateSuggestion> {
  const fixed = fixedExchangeRate(from, to);
  if (fixed) return fixed;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(RATE_ENDPOINT, { signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = (await response.json()) as FrankfurterRate;
    if (!data.rate || !Number.isFinite(data.rate) || data.rate <= 0) {
      throw new Error('Taux indisponible');
    }

    const unitsPerEuro: Record<CurrencyCode, number> = {
      EUR: 1,
      XAF: CFA_PER_EURO,
      XOF: CFA_PER_EURO,
      USD: data.rate,
    };
    return {
      rate: unitsPerEuro[to] / unitsPerEuro[from],
      date: data.date ?? new Date().toISOString().slice(0, 10),
      source: 'Banque centrale européenne via Frankfurter',
    };
  } finally {
    clearTimeout(timeout);
  }
}

export function parseExchangeRateInput(value: string): number | null {
  const normalized = value.replace(/[\s  ]/g, '').replace(',', '.');
  if (!normalized) return null;
  const rate = Number(normalized);
  return Number.isFinite(rate) && rate > 0 ? rate : null;
}

export function formatExchangeRateInput(rate: number): string {
  const decimals = rate >= 100 ? 3 : rate >= 1 ? 6 : 9;
  return rate.toFixed(decimals).replace(/0+$/, '').replace(/\.$/, '').replace('.', ',');
}
