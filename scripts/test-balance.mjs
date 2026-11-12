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
  cyclesAfterReminderDayChange,
  estimatedGlobalBalance,
  fixedMonthlyAmounts,
  goalActivationDate,
  goalPlannedMonthly,
  monthsForMonthly,
  projectedEndDate,
  goalActivationDelayDays,
  goalSavingsMode,
  goalStartsInFuture,
  nextRebalanceReviewAt,
  peakScheduledAmount,
  rebalanceReviewDue,
  savedTotal,
  upcomingSchedule,
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

// Un refus est relancé dans l'app après 14 jours, jamais avant.
const deferredAt = new Date(2026, 6, 12, 12);
const nextReviewAt = nextRebalanceReviewAt(deferredAt);
assert.equal(nextReviewAt.toISOString(), new Date(2026, 6, 26, 12).toISOString());
const review = {
  reason: 'budget',
  deferredAt: deferredAt.toISOString(),
  nextReviewAt: nextReviewAt.toISOString(),
};
assert.equal(rebalanceReviewDue(review, new Date(2026, 6, 26, 11, 59)), false);
assert.equal(rebalanceReviewDue(review, new Date(2026, 6, 26, 12)), true);

// Un rythme variable est contrôlé sur son mois-pic, pas seulement sur la prochaine échéance.
const progressive = {
  ...makeGoal('progressive', 0, 600),
  targetDate: at(2026, 9, 28),
  rhythm: 'progressive',
};
assert.equal(peakScheduledAmount(progressive, new Date(2026, 6, 12, 12)), 260);

// Le mode libre garde les dates de rappel, mais ne calcule aucun montant et
// n'entre jamais dans la capacité budgétaire. Les anciens projets restent guidés.
const free = { ...makeGoal('free', 0, 600), savingsMode: 'free' };
assert.equal(goalSavingsMode(first), 'guided');
assert.equal(goalSavingsMode(free), 'free');
assert.ok(upcomingSchedule(free, new Date(2026, 6, 12, 12)).length > 0);
assert.ok(
  upcomingSchedule(free, new Date(2026, 6, 12, 12)).every((row) => row.amount === 0)
);
assert.equal(peakScheduledAmount(free, new Date(2026, 6, 12, 12)), 0);

// Un démarrage différé n'ouvre aucun cycle avant la date choisie. Les anciens
// projets sans startDate restent immédiatement actifs.
const deferred = {
  ...makeGoal('deferred', 0, 600),
  createdAt: at(2026, 8, 10, 12),
  startDate: at(2026, 10, 15, 0),
  nextReminderAt: at(2026, 10, 28),
};
assert.equal(goalStartsInFuture(deferred, new Date(2026, 7, 10, 12)), true);
assert.equal(goalStartsInFuture(deferred, new Date(2026, 9, 15, 0)), false);
assert.equal(goalStartsInFuture(first, new Date(2026, 0, 2, 12)), false);
assert.equal(goalActivationDate(deferred).toISOString(), at(2026, 10, 15, 0));
assert.equal(goalActivationDelayDays(deferred), 66);
const deferredSchedule = upcomingSchedule(deferred, new Date(2026, 7, 10, 12));
assert.equal(deferredSchedule[0].date.toISOString(), at(2026, 10, 28));
assert.ok(deferredSchedule.every((row) => row.date >= new Date(deferred.startDate)));
assert.equal(balanceCheckDue([deferred], [], new Date(2027, 0, 12, 12)), false);
assert.equal(balanceCheckDue([deferred], [], new Date(2027, 0, 13, 12)), true);
const deferredDayChange = cyclesAfterReminderDayChange(
  deferred,
  5,
  new Date(2026, 7, 10, 12),
);
assert.equal(deferredDayChange[0].anchorAt, at(2026, 10, 28));
assert.equal(deferredDayChange[1].anchorAt, at(2026, 11, 5));

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
const proposalWithFree = buildGlobalRebalanceProposal(
  [first, free],
  budget,
  new Date(2026, 6, 12, 12),
);
assert.deepEqual(proposalWithFree.goals.map((goal) => goal.goalId), ['one']);
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
assert.match(actionsSource, /export function deferGlobalRebalance/);
assert.match(actionsSource, /nextRebalanceReviewAt\(now\)/);
assert.match(actionsSource, /clearGlobalRebalanceReview\(\)/);
assert.match(actionsSource, /startDate: startDate\?\.toISOString\(\)/);
assert.match(actionsSource, /nextReminderAfter\(scheduleReference, input\.reminderDay\)/);
// AUCUNE donnée liée au montant n'est transmise (amountBucket retiré, cf. contre-audit Codex).
assert.doesNotMatch(actionsSource, /amountBucket|bucketAmount|amountInEurReference/);

// --- Montant fixé par la personne (chantier onb-double-sens) ---------------
// Sens inverse du calcul : au lieu de déduire la mensualité d'une date cible,
// la personne pose sa mensualité et la date devient la conséquence.

// Le montant tapé reste le montant tapé, et le reste part au dernier versement.
assert.deepEqual(fixedMonthlyAmounts(3500, 200), [
  ...Array.from({ length: 17 }, () => 200),
  100,
]);
assert.equal(monthsForMonthly(3500, 200), 18);
// Quand ça tombe juste, aucun versement bâtard en fin de plan.
assert.deepEqual(fixedMonthlyAmounts(600, 200), [200, 200, 200]);
assert.equal(monthsForMonthly(600, 200), 3);
// Et le total versé est TOUJOURS l'objectif, jamais un centime de plus :
// faire épargner plus que demandé serait un abus de confiance.
for (const [total, monthly] of [[3500, 200], [1000, 300], [99.99, 10], [5, 2], [2_000_000, 220_000]]) {
  const amounts = fixedMonthlyAmounts(total, monthly);
  const somme = Math.round(amounts.reduce((s, a) => s + a, 0) * 100) / 100;
  assert.equal(somme, Math.round(total * 100) / 100, `${total} à ${monthly}`);
  assert.ok(amounts.every((a) => a <= monthly + 0.001), 'aucun versement au-dessus du montant choisi');
  assert.equal(amounts.length, monthsForMonthly(total, monthly));
}

// Dans l'échéancier, c'est le MONTANT qui borne, plus la date cible.
const fixe = { ...makeGoal('fixe', 0, 3500), plannedMonthly: 200 };
const le12juillet = new Date(2026, 6, 12, 12);
const planFixe = upcomingSchedule(fixe, le12juillet, 600);
assert.equal(planFixe.length, 18);
assert.equal(planFixe[0].amount, 200);
assert.equal(planFixe.at(-1).amount, 100);
assert.equal(peakScheduledAmount(fixe, le12juillet), 200);

// ⚠️ LE POINT QUI COMPTE : un mois creux allonge le plan, il n'augmente jamais
// l'effort. C'est l'engagement que la personne a pris en fixant son montant,
// et l'inverse du régime classique où le montant remonte pour tenir la date.
const moisCreux = {
  ...fixe,
  contributions: [{ id: 'c1', type: 'deposit', amount: 100, date: at(2026, 7, 28) }],
};
const planApres = upcomingSchedule(moisCreux, new Date(2026, 7, 1, 12), 600);
assert.equal(planApres[0].amount, 200, "le montant ne bouge pas après un mois creux");
assert.equal(planApres.length, 17, 'il reste 3 400 € à 200 €, soit 17 versements');
// Et les deux régimes sont bien distincts — prouvé, pas supposé. Avec une date
// cible trop courte pour le montant choisi, le régime classique COMPRIME les
// versements pour tenir la date, là où le montant fixé l'ignore et allonge.
const dateTropCourte = { ...fixe, targetDate: at(2027, 1, 28) };
assert.equal(upcomingSchedule(dateTropCourte, le12juillet, 600)[0].amount, 200);
assert.equal(upcomingSchedule(dateTropCourte, le12juillet, 600).length, 18);
const memeDateSansMontant = { ...dateTropCourte, plannedMonthly: undefined };
const comprime = upcomingSchedule(memeDateSansMontant, le12juillet, 600);
assert.ok(comprime.length < 18, 'le régime classique s’arrête à la date cible');
assert.ok(comprime[0].amount > 200, 'et remonte le montant pour y arriver');

// Un projet sans montant fixé n'est pas affecté, et le mode libre l'ignore.
assert.equal(goalPlannedMonthly(makeGoal('sans', 0, 1000)), null);
assert.equal(goalPlannedMonthly({ ...fixe, savingsMode: 'free' }), null);
assert.equal(goalPlannedMonthly({ ...fixe, plannedMonthly: 0 }), null);
assert.equal(goalPlannedMonthly({ ...fixe, plannedMonthly: -5 }), null);
assert.equal(goalPlannedMonthly(fixe), 200);

// La date affichée suit le plan : elle recule quand un mois est creux, puisque
// c'est le montant qui est l'engagement. Sur un plan classique elle ne bouge
// pas, c'est elle l'engagement.
// Comparaison à DATE ÉGALE, sinon le mois écoulé masque l'effet : deux projets
// identiques au 1er août, l'un qui a versé ses 200 €, l'autre rien.
const aJour = {
  ...fixe,
  contributions: [{ id: 'plein', type: 'deposit', amount: 200, date: at(2026, 7, 28) }],
};
const rienVerse = { ...fixe, contributions: [] };
const le1erAout = new Date(2026, 7, 1, 12);
assert.ok(
  projectedEndDate(rienVerse, le1erAout) > projectedEndDate(aJour, le1erAout),
  "un mois sauté repousse l'arrivée d'un cran",
);
assert.equal(
  projectedEndDate(makeGoal('classique2', 0, 1000), le12juillet).toISOString(),
  at(2027, 12, 28),
  'un plan classique garde sa date cible',
);

console.log('Tests solde : réconciliation, trimestre, capacité globale, relance douce et montant fixé validés.');
