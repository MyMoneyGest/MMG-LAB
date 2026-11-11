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
  goalReminderHour,
  midCycleNudgeAt,
  nextRegularReminderAfterCurrent,
  nextReminderFromCycles,
  normalizedReminderCycles,
  oldestUnsettledDebt,
  postponeDateFloor,
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

// Le coup de pouce reste au milieu des ancres, indépendamment d'un éventuel report.
const augustCycle = { id: 'cycle-2026-08-28', anchorAt: at(2026, 8, 28).toISOString() };
assert.deepEqual(midCycleNudgeAt(augustCycle), at(2026, 8, 13));
assert.deepEqual(
  midCycleNudgeAt({ ...augustCycle, postponedTo: at(2026, 9, 5).toISOString() }),
  at(2026, 8, 13),
);
assert.deepEqual(
  midCycleNudgeAt({ id: 'cycle-2026-03-28', anchorAt: at(2026, 3, 28).toISOString() }),
  at(2026, 3, 14),
);

// Avant l'ancre, on peut DÉJÀ la dépasser. Règle changée le 11/11 : l'app
// n'impose plus de garder une échéance jusqu'au jour J — quelqu'un qui sait le
// 12 qu'il sera absent le 28 décale tout de suite. La seule borne haute est la
// veille de l'ancre suivante, pour qu'un cycle ne déborde pas sur le suivant.
assert.deepEqual(nextRegularReminderAfterCurrent(baseGoal, july12), at(2026, 8, 28));
assert.deepEqual(postponeDateLimit(baseGoal, july12), at(2026, 8, 27));
assert.equal(canPostponeReminderTo(baseGoal, at(2026, 7, 28), july12), true);
assert.equal(canPostponeReminderTo(baseGoal, at(2026, 7, 29), july12), true);
assert.equal(canPostponeReminderTo(baseGoal, at(2026, 8, 27), july12), true);
assert.equal(canPostponeReminderTo(baseGoal, at(2026, 8, 28), july12), false);
// Mais jamais en arrière : le 27 juillet est avant le rappel qu'il prétend
// reporter, même s'il est bien dans le futur.
assert.deepEqual(postponeDateFloor(baseGoal, july12), at(2026, 7, 28));
assert.equal(canPostponeReminderTo(baseGoal, at(2026, 7, 27), july12), false);
assert.equal(canPostponeReminderTo(baseGoal, at(2026, 7, 13), july12), false);

// Le jour de l'ancre, le report peut aller jusqu'à la veille de l'ancre suivante.
const july28 = at(2026, 7, 28, 10);
assert.deepEqual(postponeDateLimit(baseGoal, july28), at(2026, 8, 27));
assert.equal(canPostponeReminderTo(baseGoal, at(2026, 7, 29), july28), true);
assert.equal(canPostponeReminderTo(baseGoal, at(2026, 8, 27), july28), true);
assert.equal(canPostponeReminderTo(baseGoal, at(2026, 8, 28), july28), false);
assert.equal(daysBeforeRegularReminder(baseGoal, at(2026, 8, 25), july28), 3);
assert.equal(postponeIsNearNextAnchor(baseGoal, at(2026, 8, 25), july28), true);
assert.equal(postponeIsNearNextAnchor(baseGoal, at(2026, 8, 24), july28), false);

const reportedCycles = cyclesAfterPostpone(baseGoal, at(2026, 8, 5), july28);
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

// --- Un report ne peut JAMAIS ramener un rappel plus tôt ---------------------
// Scénario rejoué d'après la démo du 01/11 : jour de rappel le 2, on est le 1er
// novembre, et le testeur vient d'enregistrer son versement de novembre. Le
// cycle courant est donc soldé et « Reporter » vise le cycle de DÉCEMBRE, dont
// l'ancre est à un mois. Les raccourcis du modal (demain, dans 3 jours, dans
// 7 jours) tombent tous en novembre : appliqués tels quels, ils ramenaient le
// rappel de décembre un mois plus tôt, et l'écran se remettait à parler de
// novembre. C'est exactement ce que Patrick a constaté en direct.
const nov1 = at(2026, 11, 1, 12);
const novGoal = {
  ...baseGoal,
  reminderDay: 2,
  nextReminderAt: at(2026, 11, 2).toISOString(),
  createdAt: at(2026, 10, 1).toISOString(),
};
const novCycles = normalizedReminderCycles(novGoal, nov1);
assert.deepEqual(new Date(novCycles[0].anchorAt), at(2026, 11, 2));
const settledNov = {
  ...novGoal,
  reminderCycles: settleReminderCycle(novCycles, novCycles[0].id, 'contrib-nov', nov1),
};
// L'écran annonce bien décembre une fois novembre soldé.
assert.deepEqual(nextReminderFromCycles(settledNov.reminderCycles), at(2026, 12, 2));
// Les trois raccourcis du modal doivent être refusés : ils sont AVANT le rappel
// qu'ils prétendent reporter.
assert.equal(canPostponeReminderTo(settledNov, at(2026, 11, 2), nov1), false);
assert.equal(canPostponeReminderTo(settledNov, at(2026, 11, 4), nov1), false);
assert.equal(canPostponeReminderTo(settledNov, at(2026, 11, 8), nov1), false);
// En revanche les raccourcis comptés DEPUIS LE RAPPEL tombent en décembre et
// sont acceptés : le modal propose donc quelque chose d'utile, au lieu d'une
// liste vide ou de dates qui ramènent en arrière.
assert.deepEqual(postponeDateFloor(settledNov, nov1), at(2026, 12, 2));
assert.equal(canPostponeReminderTo(settledNov, at(2026, 12, 3), nov1), true);
assert.equal(canPostponeReminderTo(settledNov, at(2026, 12, 5), nov1), true);
assert.equal(canPostponeReminderTo(settledNov, at(2026, 12, 9), nov1), true);
// Et toujours pas au-delà de la veille de l'ancre de janvier.
assert.deepEqual(postponeDateLimit(settledNov, nov1), at(2027, 1, 1));
assert.equal(canPostponeReminderTo(settledNov, at(2027, 1, 2), nov1), false);
// Et le rappel annoncé ne retombe pas en novembre.
assert.deepEqual(
  nextReminderFromCycles(cyclesAfterPostpone(settledNov, at(2026, 12, 2), nov1)),
  at(2026, 12, 2),
);
// Un report déjà posé ne se laisse pas non plus ramener en arrière.
const alreadyPostponed = {
  ...baseGoal,
  reminderCycles: normalizedReminderCycles(baseGoal, july28).map((cycle, i) =>
    i === 0 ? { ...cycle, postponedTo: at(2026, 8, 5).toISOString() } : cycle,
  ),
};
assert.equal(canPostponeReminderTo(alreadyPostponed, at(2026, 8, 1), july28), false);
assert.equal(canPostponeReminderTo(alreadyPostponed, at(2026, 8, 10), july28), true);

// --- Heure du rappel réglable (chantier liv-heure-reglable) ----------------
// L'heure est GRAVÉE dans chaque anchorAt. Écrire `reminderHour` sans
// reconstruire les ancres ferait mentir l'app : l'écran annoncerait 20 h et la
// notification partirait à 9 h. C'est ce que ce bloc empêche.

// Par défaut, rien ne change pour les projets existants : 9 h.
assert.equal(goalReminderHour(baseGoal), 9);
assert.equal(goalReminderHour({ reminderHour: 20 }), 20);
// Une valeur aberrante ne doit pas produire une date invalide : on retombe sur
// le défaut plutôt que de programmer un rappel à l'heure -3.
for (const aberrante of [-1, 24, 9.5, NaN, null, undefined, '20']) {
  assert.equal(goalReminderHour({ reminderHour: aberrante }), 9, `heure ${aberrante}`);
}

// Changement d'heure seul : les ancres à venir bougent, les passées restent.
const avecHistorique = {
  ...baseGoal,
  reminderCycles: [
    { id: 'cycle-2026-06-28', anchorAt: at(2026, 6, 28).toISOString(), settledAt: at(2026, 6, 28).toISOString() },
    { id: 'cycle-2026-07-28', anchorAt: at(2026, 7, 28).toISOString() },
  ],
};
const a20h = cyclesAfterReminderDayChange(avecHistorique, 28, july12, 20);
const passe = a20h.find((c) => c.id === 'cycle-2026-06-28');
const aVenir = a20h.filter((c) => new Date(c.anchorAt) > july12);
assert.equal(new Date(passe.anchorAt).getHours(), 9, 'une ancre passée ne se réécrit pas');
assert.ok(aVenir.length >= 2);
for (const cycle of aVenir) {
  assert.equal(new Date(cycle.anchorAt).getHours(), 20, 'toute ancre à venir prend la nouvelle heure');
}
// Et le jour n'a pas bougé au passage.
assert.equal(new Date(aVenir[0].anchorAt).getDate(), 28);

// Jour ET heure ensemble : un seul chemin, un seul recalcul.
// Le 5 est déjà passé le 12, donc le cycle courant GARDE sa date — on ne
// ressuscite pas un rappel. Mais il prend tout de même la nouvelle heure :
// sans ça, régler « le 5 à 7 h » ferait sonner le prochain rappel à 9 h, et
// la personne croirait à un bug.
const le5a7h = cyclesAfterReminderDayChange(avecHistorique, 5, july12, 7);
const aVenir5 = le5a7h.filter((c) => new Date(c.anchorAt) > july12);
assert.equal(new Date(aVenir5[0].anchorAt).getDate(), 28, 'le cycle courant ne recule pas');
assert.equal(new Date(aVenir5[0].anchorAt).getHours(), 7, "mais il prend la nouvelle heure");
// Les suivants, eux, passent bien au 5.
assert.equal(new Date(aVenir5[1].anchorAt).getDate(), 5);
assert.equal(new Date(aVenir5[1].anchorAt).getHours(), 7);

// ⚠️ On ne ressuscite jamais un rappel déjà passé. Le 28 à 9 h est derrière
// nous le 28 à 14 h : reculer l'heure à 7 h ne doit pas faire repartir le
// rappel du jour, sinon une notification tomberait dans le passé.
const le28a14h = at(2026, 7, 28, 14);
const recule = cyclesAfterReminderDayChange(avecHistorique, 28, le28a14h, 7);
for (const cycle of recule) {
  assert.ok(
    new Date(cycle.anchorAt) <= le28a14h || new Date(cycle.anchorAt).getHours() === 7,
    'une ancre future doit porter la nouvelle heure',
  );
}
assert.ok(
  recule.filter((c) => new Date(c.anchorAt) > le28a14h).every((c) => new Date(c.anchorAt) > le28a14h),
  'aucune ancre reconstruite ne tombe dans le passé',
);

// Le coup de pouce de mi-parcours suit l'heure du projet, lui aussi.
assert.deepEqual(midCycleNudgeAt(augustCycle, 20), at(2026, 8, 13, 20));
assert.deepEqual(midCycleNudgeAt(augustCycle), at(2026, 8, 13, 9));

// Un report se pose à l'heure du projet, pas à 9 h en dur.
const projet20h = { ...avecHistorique, reminderHour: 20 };
const reporte = cyclesAfterPostpone(projet20h, at(2026, 8, 3), july12);
const cible = reporte.find((c) => c.postponedTo);
assert.equal(new Date(cible.postponedTo).getHours(), 20);

console.log('Tests cycles : reports, dettes, extras, extinction, changement d’ancre, heure réglable et sens du report validés.');
