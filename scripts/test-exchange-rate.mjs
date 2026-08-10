import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const source = fs.readFileSync(path.join(process.cwd(), 'src/lib/exchange-rate.ts'), 'utf8');
const conversionSource = fs.readFileSync(
  path.join(process.cwd(), 'src/lib/currency-conversion.ts'),
  'utf8'
);
const currencySource = fs.readFileSync(path.join(process.cwd(), 'src/lib/currency.ts'), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const conversionCompiled = ts.transpileModule(conversionSource, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const currencyCompiled = ts.transpileModule(currencySource, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;

const fakeFetch = async () => ({
  ok: true,
  status: 200,
  json: async () => ({ date: '2026-08-10', rate: 1.25 }),
});
const loaded = { exports: {} };
const currencyLoaded = { exports: {} };
new Function('exports', 'module', currencyCompiled)(currencyLoaded.exports, currencyLoaded);
new Function('exports', 'module', 'require', 'fetch', compiled)(
  loaded.exports,
  loaded,
  (specifier) => {
    if (specifier === './currency') return {};
    throw new Error(`Import de test non géré : ${specifier}`);
  },
  fakeFetch
);

const {
  fetchSuggestedExchangeRate,
  fixedExchangeRate,
  formatExchangeRateInput,
  parseExchangeRateInput,
} = loaded.exports;

assert.equal(fixedExchangeRate('EUR', 'XAF').rate, 655.957);
assert.equal(fixedExchangeRate('XAF', 'XOF').rate, 1);
assert.ok(Math.abs(fixedExchangeRate('XAF', 'EUR').rate - 1 / 655.957) < 1e-12);
assert.equal(fixedExchangeRate('EUR', 'USD'), null);

assert.equal(parseExchangeRateInput('655,957'), 655.957);
assert.equal(parseExchangeRateInput(' 0,00152449 '), 0.00152449);
assert.equal(parseExchangeRateInput('0'), null);
assert.equal(formatExchangeRateInput(655.957), '655,957');

const eurUsd = await fetchSuggestedExchangeRate('EUR', 'USD');
assert.equal(eurUsd.rate, 1.25);
assert.equal(eurUsd.date, '2026-08-10');
const usdXaf = await fetchSuggestedExchangeRate('USD', 'XAF');
assert.ok(Math.abs(usdXaf.rate - 655.957 / 1.25) < 1e-12);

const conversionLoaded = { exports: {} };
new Function('exports', 'module', 'require', conversionCompiled)(
  conversionLoaded.exports,
  conversionLoaded,
  (specifier) => {
    if (specifier === './currency') return currencyLoaded.exports;
    if (specifier === './types') return {};
    throw new Error(`Import de test non géré : ${specifier}`);
  }
);
const converted = conversionLoaded.exports.convertFinancialData(
  {
    budget: { income: 2000, fixedCharges: 900, variableExpenses: 500 },
    goals: [
      {
        id: 'goal-1',
        name: 'Test',
        category: 'other',
        targetAmount: 3500,
        alreadyAvailable: 100,
        confirmedBalance: 125,
        targetDate: '2027-08-10T00:00:00.000Z',
        reminderDay: 10,
        nextReminderAt: '2026-09-10T09:00:00.000Z',
        createdAt: '2026-08-10T00:00:00.000Z',
        contributions: [{ id: 'c-1', type: 'deposit', amount: 25, date: '2026-08-10' }],
      },
    ],
    balanceSnapshots: [
      {
        id: 'b-1',
        amount: 140,
        date: '2026-08-10',
        allocations: { 'goal-1': 125 },
        unallocatedAmount: 15,
      },
    ],
  },
  655.957,
  'XAF'
);
assert.deepEqual(converted.budget, {
  income: 1311914,
  fixedCharges: 590361,
  variableExpenses: 327979,
});
assert.equal(converted.goals[0].targetAmount, 2295850);
assert.equal(converted.goals[0].alreadyAvailable, 65596);
assert.equal(converted.goals[0].confirmedBalance, 81995);
assert.equal(converted.goals[0].contributions[0].amount, 16399);
assert.equal(converted.balanceSnapshots[0].amount, 91834);
assert.equal(converted.balanceSnapshots[0].allocations['goal-1'], 81995);
assert.equal(converted.balanceSnapshots[0].unallocatedAmount, 9839);

console.log('Tests change : parité CFA, taux USD, saisie manuelle et données converties.');
