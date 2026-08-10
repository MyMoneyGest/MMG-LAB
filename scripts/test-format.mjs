import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

function compile(file) {
  const source = fs.readFileSync(path.join(process.cwd(), file), 'utf8');
  return ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
}

const currencyLoaded = { exports: {} };
new Function('exports', 'module', compile('src/lib/currency.ts'))(
  currencyLoaded.exports,
  currencyLoaded
);
const loaded = { exports: {} };
new Function('exports', 'module', 'require', compile('src/lib/format.ts'))(
  loaded.exports,
  loaded,
  (specifier) => {
    if (specifier === './currency') return currencyLoaded.exports;
    throw new Error(`Import de test non géré : ${specifier}`);
  }
);

const {
  fitFontSize,
  formatAmountInput,
  formatDateInput,
  formatReminderDay,
  parseDateInput,
  parseAmountInput,
} = loaded.exports;

// fitFontSize : les montants courts (euro) gardent la taille de base ; les gros
// montants FCFA rétrécissent pour tenir sur une ligne, avec un plancher à 50 %.
assert.equal(fitFontSize('300 €', 36), 36); // 5 caractères → intact
assert.equal(fitFontSize('123 456 €', 36), 36); // 9 caractères → intact (sous la limite)
assert.equal(fitFontSize('1 234 567 €', 36), 32); // 11 caractères → léger rétrécissement
assert.equal(fitFontSize('12 187 500 FCFA', 36), 24); // 15 car. → floor(360/15)
assert.equal(fitFontSize('137 812 500 FCFA', 36), 22); // 16 car. → floor(360/16)
assert.equal(fitFontSize('123 456 789 012 345 FCFA', 36), 18); // très long → plancher base×0.5

assert.equal(formatDateInput(''), '');
assert.equal(formatDateInput('1'), '1');
assert.equal(formatDateInput('120'), '12/0');
assert.equal(formatDateInput('1207'), '12/07');
assert.equal(formatDateInput('12072027'), '12/07/2027');
assert.equal(formatDateInput('12/07/2027'), '12/07/2027');
assert.equal(formatDateInput('1a2b0c72027xyz'), '12/07/2027');
assert.equal(formatDateInput('120720271234'), '12/07/2027');

assert.ok(parseDateInput('29/02/2028'));
assert.equal(parseDateInput('29/02/2027'), null);
assert.equal(parseDateInput('31/04/2027'), null);
assert.equal(formatReminderDay(1), '1er');
assert.equal(formatReminderDay(2), '2');
assert.equal(formatReminderDay(28), '28');

assert.equal(parseAmountInput('1 250,50', 'EUR'), 1250.5);
assert.equal(parseAmountInput('1\u202f250,50\u00a0€', 'EUR'), 1250.5);
assert.equal(parseAmountInput('2 500 FCFA', 'XAF'), 2500);
assert.equal(parseAmountInput('2 500,9 FCFA', 'XOF'), 2501);
assert.equal(parseAmountInput('$1 250.50', 'USD'), 1250.5);
assert.equal(parseAmountInput('-1', 'EUR'), null);
assert.equal(parseAmountInput('montant', 'EUR'), null);
assert.equal(formatAmountInput('2500000', 'XAF'), '2 500 000');
assert.equal(formatAmountInput('2 500 000 FCFA', 'XOF'), '2 500 000');
assert.equal(formatAmountInput('0002500', 'XAF'), '2 500');
assert.equal(formatAmountInput('2500', 'EUR'), '2 500');
assert.equal(formatAmountInput('2500,', 'EUR'), '2 500,');
assert.equal(formatAmountInput('2500,5', 'EUR'), '2 500,5');
assert.equal(formatAmountInput('2 500,50 €', 'EUR'), '2 500,50');
assert.equal(formatAmountInput('2500.50', 'USD'), '2 500,50');
assert.equal(formatAmountInput('0002500,567', 'EUR'), '2 500,56');
assert.equal(formatAmountInput(',5', 'EUR'), '0,5');
assert.equal(parseAmountInput(formatAmountInput('2500,50', 'EUR'), 'EUR'), 2500.5);

console.log('Tests format : dates et saisies EUR/FCFA/USD validées.');
