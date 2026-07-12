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
  allocateGlobalBalance,
  balanceCheckDue,
  buildGlobalRebalanceProposal,
  estimatedGlobalBalance,
  peakScheduledAmount,
  savedTotal,
} = loaded.exports;

const at = (year, month, day, hour = 9) => new Date(year, month - 1, day, hour).toISOString();
const makeGoal = (id, available, target = 1000) => ({
  id,
  name: `Projet ${id}`,
  category: 'other',
  targetAmount: target,
  alreadyAvailable: available,
  targetDate: at(2027, 12, 28),
  reminderDay: 28,
  rhythm: 'stable',
  nextReminderAt: at(2026, 7, 28),
  createdAt: at(2026, 1, 1),
  contributions: [],
});

// Une confirmation de solde remplace l'ancien historique pour le calcul exact.
const reconciled = {
  ...makeGoal('one', 100),
  confirmedBalance: 500,
  balanceConfirmedAt: at(2026, 8, 1),
  contributions: [
    { id: 'old', type: 'deposit', amount: 200, date: at(2026, 7, 20) },
    { id: 'new', type: 'deposit', amount: 100, date: at(2026, 8, 2) },
  ],
};
assert.equal(savedTotal(reconciled), 600);
const snapshot = {
  id: 'balance-one',
  amount: 700,
  date: at(2026, 8, 1),
  allocations: { one: 500 },
  unallocatedAmount: 200,
};
assert.equal(estimatedGlobalBalance([reconciled], [snapshot]), 800);
assert.equal(
  estimatedGlobalBalance([reconciled, makeGoal('created-later', 300)], [snapshot]),
  800,
  'une nouvelle enveloppe virtuelle ne doit pas augmenter le solde global confirmé',
);

// Répartition proportionnelle exacte, puis surplus non affecté au-delà des cibles.
const first = makeGoal('one', 100);
const second = makeGoal('two', 300);
const allocation = allocateGlobalBalance([first, second], 800);
assert.deepEqual(allocation.allocations, { one: 200, two: 600 });
assert.equal(allocation.unallocatedAmount, 0);
assert.equal(estimatedGlobalBalance([first, second], []), 400);
const overTargets = allocateGlobalBalance([first, second], 2500);
assert.deepEqual(overTargets.allocations, { one: 1000, two: 1000 });
assert.equal(overTargets.unallocatedAmount, 500);

// La vérification devient due à 90 jours, pas avant.
assert.equal(balanceCheckDue([first], [], new Date(2026, 2, 31, 12)), false);
assert.equal(balanceCheckDue([first], [], new Date(2026, 3, 1, 12)), true);

// Un rythme variable est contrôlé sur son mois-pic, pas seulement sur la prochaine échéance.
const progressive = {
  ...makeGoal('progressive', 0, 600),
  targetDate: at(2026, 9, 28),
  rhythm: 'progressive',
};
assert.equal(peakScheduledAmount(progressive, new Date(2026, 6, 12, 12)), 260);

// La somme proposée respecte la capacité globale ; une capacité nulle est signalée impossible.
const budget = { income: 2000, fixedCharges: 1000, variableExpenses: 500 };
const proposal = buildGlobalRebalanceProposal(
  [first, second],
  budget,
  new Date(2026, 6, 12, 12),
);
assert.equal(proposal.capacity, 400);
assert.equal(proposal.possible, true);
assert.ok(proposal.goals.reduce((sum, goal) => sum + goal.proposedMonthly, 0) <= 400.01);
const impossible = buildGlobalRebalanceProposal(
  [first],
  { income: 1000, fixedCharges: 800, variableExpenses: 200 },
  new Date(2026, 6, 12, 12),
);
assert.equal(impossible.capacity, 0);
assert.equal(impossible.possible, false);

const actionsSource = fs.readFileSync(path.join(process.cwd(), 'src/lib/actions.ts'), 'utf8');
assert.match(actionsSource, /export async function reconcileGlobalBalance/);
assert.match(actionsSource, /state\.addBalanceSnapshot\(snapshot\)/);
assert.match(actionsSource, /confirmedBalance: distribution\.allocations/);
assert.match(actionsSource, /export async function applyGlobalRebalance/);

console.log('Tests solde : réconciliation, trimestre et capacité globale validés.');
