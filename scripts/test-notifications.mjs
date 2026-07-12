import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const root = process.cwd();
const modelPath = path.join(root, 'src/lib/notification-model.ts');
const source = fs.readFileSync(modelPath, 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const loaded = { exports: {} };
new Function('exports', 'module', 'require', compiled)(loaded.exports, loaded, () => {
  throw new Error('notification-model.ts doit rester sans dépendance native.');
});

const {
  createReminderInbox,
  mergePendingReminders,
  pendingReminderFromNotification,
  reminderActionFromIdentifier,
} = loaded.exports;

const notification = (identifier, data = { goalId: 'goal-1' }) => ({
  request: { identifier, content: { data } },
});

assert.equal(reminderActionFromIdentifier('done'), 'done');
assert.equal(reminderActionFromIdentifier('edit'), 'edit');
assert.equal(reminderActionFromIdentifier('postpone'), 'postpone');
assert.equal(reminderActionFromIdentifier('expo.modules.notifications.actions.DEFAULT'), 'open');

assert.deepEqual(pendingReminderFromNotification(notification('notif-1')), {
  notificationId: 'notif-1',
  goalId: 'goal-1',
  isTest: false,
  reminderKind: 'anchor',
  cycleId: undefined,
});
assert.deepEqual(
  pendingReminderFromNotification(
    notification('notif-postponed', { goalId: 'goal-1', reminderKind: 'postponed', cycleId: 'cycle-july' }),
  ),
  {
    notificationId: 'notif-postponed',
    goalId: 'goal-1',
    isTest: false,
    reminderKind: 'postponed',
    cycleId: 'cycle-july',
  },
);
assert.equal(pendingReminderFromNotification(notification('invalid', {})), null);

const dismissed = [];
const inbox = createReminderInbox();
const first = await inbox.consume(notification('notif-2', { goalId: 'goal-2', isTest: true }), async (id) => {
  dismissed.push(id);
});
assert.equal(first.isTest, true);
assert.deepEqual(dismissed, ['notif-2']);
assert.equal(await inbox.consume(notification('notif-2'), async () => {}), null);

await inbox.dismissResponse(notification('notif-3'), async (id) => dismissed.push(id));
assert.deepEqual(dismissed, ['notif-2', 'notif-3']);

assert.deepEqual(
  mergePendingReminders(
    [first],
    [first, { notificationId: 'notif-4', goalId: 'goal-4', isTest: false, reminderKind: 'anchor' }],
  ),
  [first, { notificationId: 'notif-4', goalId: 'goal-4', isTest: false, reminderKind: 'anchor' }]
);

const notificationsSource = fs.readFileSync(path.join(root, 'src/lib/notifications.ts'), 'utf8');
assert.doesNotMatch(
  notificationsSource,
  /sound\s*:\s*['"]default['"]/,
  "'default' ne doit pas être déclaré comme un fichier audio personnalisé"
);
assert.match(notificationsSource, /cycleId: cycle\.id/);
assert.match(notificationsSource, /surplusForCycle/);
assert.match(notificationsSource, /getPresentedNotificationsAsync/);
assert.match(notificationsSource, /notification\.request\.content\.data\?\.goalId === goalId/);
assert.match(notificationsSource, /notification\.request\.content\.data\?\.cycleId === cycleId/);

console.log('Tests notifications : routage, déduplication, retrait et configuration sonore validés.');
