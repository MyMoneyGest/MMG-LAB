// Formatage manuel fr-FR pour ne pas dépendre du support Intl de Hermes.

/**
 * Taille de police adaptée à la longueur d'un montant affiché en gros.
 * Les montants FCFA sont ~655× plus longs que l'euro (« 12 187 500 FCFA ») et
 * débordaient / coupaient le symbole. Modèle : si ~10 caractères tiennent à la
 * taille de base, N caractères tiennent à base×10/N. Déterministe (web ET natif),
 * contrairement à `adjustsFontSizeToFit` qui est ignoré sur le web.
 */
export function fitFontSize(text: string, base: number): number {
  const len = text.length;
  if (len <= 10) return base;
  return Math.max(Math.round(base * 0.5), Math.floor((base * 10) / len));
}

import { CURRENCIES, DEFAULT_CURRENCY } from './currency';
import type { CurrencyCode } from './currency';

export function formatEuro(amount: number): string {
  const rounded = Math.round(amount * 100) / 100;
  const sign = rounded < 0 ? '-' : '';
  const abs = Math.abs(rounded);
  const int = Math.trunc(abs);
  const cents = Math.round((abs - int) * 100);

  let intStr = String(int);
  let grouped = '';
  while (intStr.length > 3) {
    grouped = ' ' + intStr.slice(-3) + grouped;
    intStr = intStr.slice(0, -3);
  }
  grouped = intStr + grouped;

  const centsStr = cents > 0 ? ',' + String(cents).padStart(2, '0') : '';
  return `${sign}${grouped}${centsStr} €`;
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

export function formatDayMonth(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}`;
}

const MONTHS = [
  'janvier',
  'février',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'août',
  'septembre',
  'octobre',
  'novembre',
  'décembre',
];

export function formatMonth(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return MONTHS[d.getMonth()];
}

/** En français, seul le premier jour du mois prend l'ordinal « 1er ». */
export function formatReminderDay(day: number): string {
  return Math.round(day) === 1 ? '1er' : String(Math.round(day));
}

/**
 * Rend les grands montants lisibles pendant la frappe, quelle que soit la
 * devise. Les espaces sont purement visuels et parseAmountInput les ignore.
 * Pour les devises à centimes, la virgule et les décimales déjà saisies sont
 * conservées : « 2500,50 » devient « 2 500,50 ».
 */
export function formatAmountInput(
  value: string,
  code: CurrencyCode = DEFAULT_CURRENCY
): string {
  const decimals = CURRENCIES[code]?.decimals ?? CURRENCIES[DEFAULT_CURRENCY].decimals;

  if (decimals === 0) {
    const digits = value.replace(/\D/g, '');
    if (!digits) return '';
    const normalized = digits.replace(/^0+(?=\d)/, '');
    return normalized.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }

  const sanitized = value.replace(/[^\d.,]/g, '').replace('.', ',');
  if (!sanitized) return '';

  const separatorIndex = sanitized.indexOf(',');
  const integerSource = separatorIndex >= 0 ? sanitized.slice(0, separatorIndex) : sanitized;
  const integerDigits = integerSource.replace(/\D/g, '');
  const normalizedInteger = (integerDigits || '0').replace(/^0+(?=\d)/, '');
  const groupedInteger = normalizedInteger.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

  if (separatorIndex < 0) return groupedInteger;

  const decimalDigits = sanitized
    .slice(separatorIndex + 1)
    .replace(/\D/g, '')
    .slice(0, decimals);
  return `${groupedInteger},${decimalDigits}`;
}

/** Insère automatiquement les séparateurs d'une saisie JJ/MM/AAAA. */
export function formatDateInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

/** Parse une saisie JJ/MM/AAAA. Retourne null si invalide. */
export function parseDateInput(value: string): Date | null {
  const m = value.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = Number(m[3]);
  const d = new Date(year, month - 1, day);
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) return null;
  return d;
}

/**
 * Parse une saisie de montant ("1 250,50", "2 500 FCFA" ou "$1250.5").
 * Le résultat respecte la précision de la devise : aucun centime en XAF/XOF.
 */
export function parseAmountInput(
  value: string,
  code: CurrencyCode = DEFAULT_CURRENCY
): number | null {
  const cleaned = value
    .replace(/FCFA|XAF|XOF|EUR|USD/gi, '')
    .replace(/[\s  €$]/g, '')
    .replace(',', '.');
  if (!cleaned) return null;
  const n = Number(cleaned);
  if (!Number.isFinite(n) || n < 0) return null;
  const decimals = CURRENCIES[code]?.decimals ?? CURRENCIES[DEFAULT_CURRENCY].decimals;
  const factor = 10 ** decimals;
  return Math.round(n * factor) / factor;
}
