import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const source = fs.readFileSync(path.join(process.cwd(), 'src/lib/plan.ts'), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const loaded = { exports: {} };
new Function('exports', 'module', 'require', compiled)(loaded.exports, loaded, () => ({}));

const {
  canPostponeReminderTo,
  daysBeforeRegularReminder,
  nextRegularReminderAfterCurrent,
  postponeDateLimit,
  postponeNeedsRegularChoice,
  recentDeposits,
  reminderStateAfterContribution,
  upcomingSchedule,
} = loaded.exports;
const goal = {
  id: 'goal-1',
  name: 'Voiture',
  category: 'car',
  targetAmount: 5000,
  alreadyAvailable: 0,
  targetDate: '2027-12-31T09:00:00.000Z',
  reminderDay: 11,
  rhythm: 'stable',
  nextReminderAt: '2026-07-11T09:00:00+02:00',
  createdAt: '2026-01-01T09:00:00.000Z',
  contributions: [],
};
const now = new Date(2026, 6, 12, 12, 0, 0);

assert.deepEqual(nextRegularReminderAfterCurrent(goal, now), new Date(2026, 7, 11, 9, 0, 0));
assert.deepEqual(postponeDateLimit(goal, now), new Date(2026, 7, 10, 9, 0, 0));
assert.equal(canPostponeReminderTo(goal, new Date(2026, 6, 13), now), true);
assert.equal(canPostponeReminderTo(goal, new Date(2026, 7, 10), now), true);
assert.equal(canPostponeReminderTo(goal, new Date(2026, 7, 11), now), false);
assert.equal(canPostponeReminderTo(goal, new Date(2026, 7, 12), now), false);
assert.equal(canPostponeReminderTo(goal, new Date(2026, 6, 12), now), false);

const futureGoal = { ...goal, nextReminderAt: new Date(2026, 6, 20, 9).toISOString() };
assert.deepEqual(postponeDateLimit(futureGoal, now), new Date(2026, 7, 10, 9, 0, 0));

const day28Goal = {
  ...goal,
  reminderDay: 28,
  nextReminderAt: new Date(2026, 6, 28, 9).toISOString(),
};
assert.deepEqual(nextRegularReminderAfterCurrent(day28Goal, now), new Date(2026, 7, 28, 9));
assert.deepEqual(postponeDateLimit(day28Goal, now), new Date(2026, 7, 27, 9));
assert.equal(canPostponeReminderTo(day28Goal, new Date(2026, 7, 27), now), true);
assert.equal(canPostponeReminderTo(day28Goal, new Date(2026, 7, 28), now), false);
assert.equal(daysBeforeRegularReminder(day28Goal, new Date(2026, 7, 25), now), 3);
assert.equal(postponeNeedsRegularChoice(day28Goal, new Date(2026, 7, 25), now), true);
assert.equal(postponeNeedsRegularChoice(day28Goal, new Date(2026, 7, 27), now), true);
assert.equal(postponeNeedsRegularChoice(day28Goal, new Date(2026, 7, 24), now), false);

const keptGoal = { ...day28Goal, followingReminderAt: new Date(2026, 7, 28, 9).toISOString() };
assert.deepEqual(reminderStateAfterContribution(keptGoal, new Date(2026, 7, 10, 10)), {
  nextReminderAt: new Date(2026, 7, 28, 9),
  canIgnoreCurrentReminder: true,
});
assert.deepEqual(reminderStateAfterContribution(day28Goal, new Date(2026, 7, 27, 10)), {
  nextReminderAt: new Date(2026, 8, 28, 9),
  canIgnoreCurrentReminder: false,
});

const contributionGoal = {
  ...day28Goal,
  contributions: [
    { id: 'recent', type: 'deposit', amount: 120, date: new Date(2026, 7, 25, 8).toISOString() },
    { id: 'old', type: 'deposit', amount: 80, date: new Date(2026, 7, 24, 8).toISOString() },
    { id: 'withdrawal', type: 'withdrawal', amount: 20, date: new Date(2026, 7, 27, 8).toISOString() },
  ],
};
assert.deepEqual(
  recentDeposits(contributionGoal, new Date(2026, 7, 28, 10)).map((item) => item.id),
  ['recent'],
);

const scheduleBase = {
  ...day28Goal,
  nextReminderAt: new Date(2026, 7, 10, 9).toISOString(),
  targetDate: new Date(2026, 11, 31, 9).toISOString(),
};
const keptSchedule = upcomingSchedule(
  { ...scheduleBase, followingReminderAt: new Date(2026, 7, 28, 9).toISOString() },
  new Date(2026, 7, 1, 10),
  3,
).map((row) => row.date);
assert.deepEqual(keptSchedule, [
  new Date(2026, 7, 10, 9),
  new Date(2026, 7, 28, 9),
  new Date(2026, 8, 28, 9),
]);
const fullKeptSchedule = upcomingSchedule(
  { ...scheduleBase, followingReminderAt: new Date(2026, 7, 28, 9).toISOString() },
  new Date(2026, 7, 1, 10),
);
assert.equal(
  Math.round(fullKeptSchedule.reduce((sum, row) => sum + row.amount, 0) * 100) / 100,
  5000,
);
assert.ok(fullKeptSchedule[0].amount < 5000);

const skippedGoal = {
  ...scheduleBase,
  nextReminderAt: new Date(2026, 7, 27, 9).toISOString(),
  skippedRegularReminderAt: new Date(2026, 7, 28, 9).toISOString(),
};
assert.deepEqual(
  upcomingSchedule(skippedGoal, new Date(2026, 7, 1, 10), 3).map((row) => row.date),
  [new Date(2026, 7, 27, 9), new Date(2026, 8, 28, 9), new Date(2026, 9, 28, 9)],
);
assert.deepEqual(
  upcomingSchedule(skippedGoal, new Date(2026, 7, 29, 10), 1).map((row) => row.date),
  [new Date(2026, 8, 28, 9)],
);

const actionsSource = fs.readFileSync(path.join(process.cwd(), 'src/lib/actions.ts'), 'utf8');
assert.match(
  actionsSource,
  /if \(!canPostponeReminderTo\(goal, date\)\) return \{ ok: false, reason: 'date' \}/,
  'La borne doit aussi être imposée par la logique métier, pas seulement par la fenêtre.',
);
assert.match(actionsSource, /followingReminderAt = options\.keepRegularReminder/);
assert.match(actionsSource, /export async function ignoreCurrentReminder/);

console.log("Tests report : report futur autorisé jusqu'à la veille, rappel mensuel exclu.");
