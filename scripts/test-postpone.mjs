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

const { canPostponeReminderTo, postponeDateLimit } = loaded.exports;
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

assert.deepEqual(postponeDateLimit(goal, now), new Date(2026, 7, 11, 9, 0, 0));
assert.equal(canPostponeReminderTo(goal, new Date(2026, 6, 13), now), true);
assert.equal(canPostponeReminderTo(goal, new Date(2026, 7, 11), now), true);
assert.equal(canPostponeReminderTo(goal, new Date(2026, 7, 12), now), false);
assert.equal(canPostponeReminderTo(goal, new Date(2026, 6, 12), now), false);

const futureGoal = { ...goal, nextReminderAt: new Date(2026, 6, 20, 9).toISOString() };
assert.deepEqual(postponeDateLimit(futureGoal, now), new Date(2026, 7, 11, 9, 0, 0));

const actionsSource = fs.readFileSync(path.join(process.cwd(), 'src/lib/actions.ts'), 'utf8');
assert.match(
  actionsSource,
  /if \(!canPostponeReminderTo\(goal, date\)\) return \{ ok: false, reason: 'date' \}/,
  'La borne doit aussi être imposée par la logique métier, pas seulement par la fenêtre.',
);

console.log('Tests report : date future autorisée, prochaine échéance acceptée, dépassement refusé.');
