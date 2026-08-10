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

const { formatDateInput, parseDateInput, parseAmountInput } = loaded.exports;

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

assert.equal(parseAmountInput('1 250,50', 'EUR'), 1250.5);
assert.equal(parseAmountInput('1\u202f250,50\u00a0€', 'EUR'), 1250.5);
assert.equal(parseAmountInput('2 500 FCFA', 'XAF'), 2500);
assert.equal(parseAmountInput('2 500,9 FCFA', 'XOF'), 2501);
assert.equal(parseAmountInput('$1 250.50', 'USD'), 1250.5);
assert.equal(parseAmountInput('-1', 'EUR'), null);
assert.equal(parseAmountInput('montant', 'EUR'), null);

console.log('Tests format : dates et saisies EUR/FCFA/USD validées.');
