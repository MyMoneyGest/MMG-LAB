import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const source = fs.readFileSync(path.join(process.cwd(), 'src/lib/currency.ts'), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const loaded = { exports: {} };
new Function('exports', 'module', compiled)(loaded.exports, loaded);

const {
  formatMoney,
  normalizeMoney,
  convertMoney,
  defaultCurrencyForCountry,
  CURRENCIES,
} = loaded.exports;

// EUR : rendu IDENTIQUE à la V1 (formatEuro) — pas de « ,00 » sur un entier.
assert.equal(formatMoney(300, 'EUR'), '300\u00a0€');
assert.equal(formatMoney(204.42, 'EUR'), '204,42\u00a0€');
assert.equal(formatMoney(1350, 'EUR'), '1\u202f350\u00a0€');
assert.equal(formatMoney(1234567.5, 'EUR'), '1\u202f234\u202f567,50\u00a0€');
assert.equal(formatMoney(0, 'EUR'), '0\u00a0€');

// XAF / XOF (FCFA) : AUCUNE décimale, symbole « FCFA » après.
assert.equal(formatMoney(2500, 'XAF'), '2\u202f500\u00a0FCFA');
assert.equal(formatMoney(2500.9, 'XAF'), '2\u202f501\u00a0FCFA'); // arrondi à l'entier
assert.equal(formatMoney(1000000, 'XOF'), '1\u202f000\u202f000\u00a0FCFA');
assert.equal(formatMoney(0, 'XAF'), '0\u00a0FCFA');
assert.equal(normalizeMoney(2500.9, 'XAF'), 2501);
assert.equal(normalizeMoney(12.345, 'EUR'), 12.35);
assert.equal(convertMoney(100, 655.957, 'XAF'), 65596);
assert.equal(convertMoney(65596, 1 / 655.957, 'EUR'), 100);

// USD : 2 décimales, toujours affichées (réglage provisoire).
assert.equal(formatMoney(2500, 'USD'), '2\u202f500,00\u00a0$');

// Devise inconnue → repli EUR.
assert.equal(formatMoney(10, 'ZZZ'), '10\u00a0€');

// Pays → devise par défaut (pré-remplissage du sélecteur).
assert.equal(defaultCurrencyForCountry('GA'), 'XAF'); // Gabon
assert.equal(defaultCurrencyForCountry('ci'), 'XOF'); // Côte d'Ivoire (casse ignorée)
assert.equal(defaultCurrencyForCountry('FR'), 'EUR');
assert.equal(defaultCurrencyForCountry('US'), 'USD');
assert.equal(defaultCurrencyForCountry(undefined), 'EUR'); // fallback
assert.equal(defaultCurrencyForCountry('XX'), 'EUR'); // pays inconnu → fallback

// FCFA sans centimes, euro avec : contrat central du multi-devises.
assert.equal(CURRENCIES.XAF.decimals, 0);
assert.equal(CURRENCIES.EUR.decimals, 2);

console.log('Tests devises : EUR (rendu V1), FCFA sans centimes, repli et pays→devise validés.');
