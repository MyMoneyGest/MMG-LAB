import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const source = fs.readFileSync(path.join(process.cwd(), 'src/lib/plan.ts'), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const loaded = { exports: {} };
new Function('exports', 'module', 'require', compiled)(loaded.exports, loaded, () => ({}));

const {
  canPostponeReminderTo,
  contributionPlan,
  currentUpcomingCycle,
  cyclesAfterPostpone,
  cyclesAfterReminderDayChange,
  daysBeforeRegularReminder,
  nextRegularReminderAfterCurrent,
  normalizedReminderCycles,
  oldestUnsettledDebt,
  postponeDateLimit,
  postponeIsNearNextAnchor,
  recentDeposits,
  reminderAtForCycle,
  settleReminderCycle,
  surplusForCycle,
} = loaded.exports;

const at = (year, month, day, hour = 9) => new Date(year, month - 1, day, hour, 0, 0, 0);
const july12 = at(2026, 7, 12, 12);
const baseGoal = {
  id: 'goal-1',
  name: 'Voiture',
  category: 'car',
  targetAmount: 5000,
  alreadyAvailable: 0,
  targetDate: at(2027, 12, 31).toISOString(),
  reminderDay: 28,
  rhythm: 'stable',
  nextReminderAt: at(2026, 7, 28).toISOString(),
  createdAt: at(2026, 1, 1).toISOString(),
  contributions: [],
};

// Report ponctuel : juillet va au 5 août, l'ancre d'août reste indépendante.
assert.deepEqual(nextRegularReminderAfterCurrent(baseGoal, july12), at(2026, 8, 28));
assert.deepEqual(postponeDateLimit(baseGoal, july12), at(2026, 8, 27));
assert.equal(canPostponeReminderTo(baseGoal, at(2026, 8, 27), july12), true);
assert.equal(canPostponeReminderTo(baseGoal, at(2026, 8, 28), july12), false);
assert.equal(daysBeforeRegularReminder(baseGoal, at(2026, 8, 25), july12), 3);
assert.equal(postponeIsNearNextAnchor(baseGoal, at(2026, 8, 25), july12), true);
assert.equal(postponeIsNearNextAnchor(baseGoal, at(2026, 8, 24), july12), false);

const reportedCycles = cyclesAfterPostpone(baseGoal, at(2026, 8, 5), july12);
assert.deepEqual(reminderAtForCycle(reportedCycles[0]), at(2026, 8, 5));
assert.deepEqual(new Date(reportedCycles[1].anchorAt), at(2026, 8, 28));

// Le versement du 5 août solde obligatoirement juillet, pas août.
const august5Goal = { ...baseGoal, reminderCycles: reportedCycles };
const julyDebtPlan = contributionPlan(august5Goal, 'surplus', at(2026, 8, 5, 10));
assert.equal(julyDebtPlan.forcedDebt, true);
assert.equal(julyDebtPlan.cycleId, reportedCycles[0].id);
const cyclesAfterJulyPayment = settleReminderCycle(
  reportedCycles,
  julyDebtPlan.cycleId,
  'contribution-july',
  at(2026, 8, 5, 10),
);
const julyPaidGoal = {
  ...august5Goal,
  reminderCycles: cyclesAfterJulyPayment,
  contributions: [
    {
      id: 'contribution-july',
      type: 'deposit',
      amount: 100,
      date: at(2026, 8, 5, 10).toISOString(),
      allocation: 'cycle',
      cycleId: julyDebtPlan.cycleId,
    },
  ],
};
assert.equal(oldestUnsettledDebt(julyPaidGoal, at(2026, 8, 10, 10)), null);
assert.deepEqual(new Date(currentUpcomingCycle(julyPaidGoal, at(2026, 8, 10, 10)).anchorAt), at(2026, 8, 28));

// Sans dette, extra par défaut ; le choix explicite peut solder août.
assert.deepEqual(contributionPlan(julyPaidGoal, 'surplus', at(2026, 8, 10, 10)), {
  allocation: 'surplus',
  forcedDebt: false,
});
const augustPlan = contributionPlan(julyPaidGoal, 'settle_current', at(2026, 8, 10, 10));
assert.equal(augustPlan.cycleId, cyclesAfterJulyPayment[1].id);
assert.equal(augustPlan.forcedDebt, false);

// Les surplus du cycle d'août alimentent le message contextuel, pas le rattrapage de juillet.
const extrasGoal = {
  ...julyPaidGoal,
  contributions: [
    ...julyPaidGoal.contributions,
    { id: 'extra-1', type: 'deposit', amount: 30, date: at(2026, 8, 10, 10).toISOString(), allocation: 'surplus' },
    { id: 'extra-2', type: 'deposit', amount: 40, date: at(2026, 8, 18, 10).toISOString(), allocation: 'surplus' },
    { id: 'extra-3', type: 'deposit', amount: 50, date: at(2026, 8, 22, 10).toISOString(), allocation: 'surplus' },
  ],
};
assert.equal(surplusForCycle(extrasGoal, cyclesAfterJulyPayment[1]), 120);

// Deux versements le même jour : le second n'est plus rattaché à juillet et reste extra.
assert.deepEqual(contributionPlan(julyPaidGoal, 'surplus', at(2026, 8, 5, 11)), {
  allocation: 'surplus',
  forcedDebt: false,
});
assert.deepEqual(
  recentDeposits(julyPaidGoal, at(2026, 8, 5, 11)).map((item) => item.id),
  ['contribution-july'],
);

// Changement d'ancre : jour encore à venir appliqué au cycle, jour passé au cycle suivant.
const changedTo20 = cyclesAfterReminderDayChange(baseGoal, 20, july12);
assert.deepEqual(new Date(changedTo20[0].anchorAt), at(2026, 7, 20));
const changedTo5 = cyclesAfterReminderDayChange(baseGoal, 5, july12);
assert.deepEqual(new Date(changedTo5[0].anchorAt), at(2026, 7, 28));
assert.deepEqual(new Date(changedTo5[1].anchorAt), at(2026, 8, 5));

// La normalisation maintient plusieurs ancres futures sans fusionner les cycles.
assert.ok(normalizedReminderCycles(baseGoal, july12).length >= 3);

console.log('Tests cycles : reports, dettes, extras, extinction et changement d’ancre validés.');
