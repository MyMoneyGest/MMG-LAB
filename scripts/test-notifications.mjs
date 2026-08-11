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
assert.deepEqual(
  pendingReminderFromNotification(
    notification('notif-nudge', {
      goalId: 'goal-1',
      reminderKind: 'mid_cycle_nudge',
      cycleId: 'cycle-august',
    }),
  ),
  {
    notificationId: 'notif-nudge',
    goalId: 'goal-1',
    isTest: false,
    reminderKind: 'mid_cycle_nudge',
    cycleId: 'cycle-august',
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
assert.match(notificationsSource, /goalSavingsMode\(goal\) === 'free'/);
assert.match(notificationsSource, /Mets de côté le montant qui te convient aujourd'hui/);
assert.match(notificationsSource, /remainingAmount\(goal\) <= 0/);
assert.doesNotMatch(notificationsSource, /suggestedAmount <= 0/);
assert.match(notificationsSource, /reminder\.reminderKind !== 'mid_cycle_nudge'/);

// Les coups de pouce sont programmés GLOBALEMENT (plafond partagé entre projets)
// par scheduleNudges via le planificateur pur planNudges — plus cycle par cycle.
assert.match(notificationsSource, /import \{ planNudges \} from '\.\/nudge-planner'/);
assert.match(notificationsSource, /import \{ hashSeed, nudgeMessage, nudgeTitle \} from '\.\/nudge-copy'/);
const scheduleNudges = notificationsSource.match(
  /export async function scheduleNudges\(\)[\s\S]*?\n}/,
)?.[0];
assert.ok(scheduleNudges, 'scheduleNudges doit exister');
assert.match(scheduleNudges, /planNudges\(/, 'la décision vient du planificateur pur');
assert.match(scheduleNudges, /channelId: NUDGE_CHANNEL_ID/, 'canal dédié');
assert.match(scheduleNudges, /interruptionLevel: 'passive'/, 'passif sur iOS');
assert.match(scheduleNudges, /reminderKind: 'mid_cycle_nudge'/);
assert.match(scheduleNudges, /nudgeTrigger: nudge\.trigger/, 'déclencheur A/B transmis dans les données');
assert.match(scheduleNudges, /body: nudgeMessage\(context, seed\)/, 'corps tiré du pool qui tourne');
assert.match(scheduleNudges, /title: nudgeTitle\(seed \+ 1\)/, 'titre varié');
assert.doesNotMatch(scheduleNudges, /categoryIdentifier/, 'aucune action native');
// Tracing des affichages avec le déclencheur — jamais compté comme rétention.
assert.match(
  scheduleNudges,
  /track\('nudge_shown', \{ goalId: scheduled\.goalId, metadata: \{ trigger: scheduled\.trigger \}/
);

// scheduleGoalReminders ne programme plus AUCUN coup de pouce.
const scheduleGoal = notificationsSource.match(
  /export async function scheduleGoalReminders[\s\S]*?\n}/,
)?.[0];
assert.ok(scheduleGoal, 'scheduleGoalReminders doit exister');
assert.doesNotMatch(
  scheduleGoal,
  /midCycleNudgeEnabled|nudgeMessage|NUDGE_CHANNEL_ID/,
  'plus de coup de pouce dans la programmation des rappels',
);

// Canal du coup de pouce en importance basse ; le rappel mensuel reste sur le canal HIGH.
assert.match(notificationsSource, /NUDGE_CHANNEL_ID = 'mid_cycle_nudges'/);
assert.match(
  notificationsSource,
  /ensureAndroidNudgeChannel[\s\S]*?importance: N\.AndroidImportance\.LOW/,
  'le canal du coup de pouce doit être en importance basse',
);
assert.match(notificationsSource, /channelId: CHANNEL_ID/);

// Aperçu du coup de pouce (test rapide) : fidèle au vrai, sans action, hors mesure.
const nudgeTest = notificationsSource.match(
  /export async function scheduleTestNudge[\s\S]*?\n}/,
)?.[0];
assert.ok(nudgeTest, 'scheduleTestNudge doit exister');
assert.match(nudgeTest, /reminderKind: 'mid_cycle_nudge'/);
assert.match(nudgeTest, /interruptionLevel: 'passive'/);
assert.match(nudgeTest, /channelId: NUDGE_CHANNEL_ID/, 'l’aperçu utilise le canal discret réel');
// L'aperçu pioche dans le même pool, avec un aléa pour montrer la variété.
assert.match(nudgeTest, /body: nudgeMessage\(nudgeContext, previewSeed\)/);
assert.match(nudgeTest, /title: nudgeTitle\(previewSeed \+ 1\)/);
assert.match(nudgeTest, /isTest: true/, 'l’aperçu ne doit jamais alimenter la mesure');
assert.match(nudgeTest, /seconds: 5/);
assert.doesNotMatch(nudgeTest, /categoryIdentifier/, 'l’aperçu ne propose aucune action native');

console.log('Tests notifications : routage, déduplication, retrait et configuration sonore validés.');
