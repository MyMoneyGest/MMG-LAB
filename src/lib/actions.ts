import { track } from './analytics';
import {
  bucketAmount,
  canPostponeReminderTo,
  nextReminderAfter,
  nextRegularReminderAfterCurrent,
  reminderStateAfterContribution,
  reminderAfterConfirmation,
  remainingAmount,
  suggestedAmount,
} from './plan';
import {
  cancelGoalReminder,
  hasNotificationPermission,
  requestNotificationPermission,
  scheduleGoalReminders,
} from './notifications';
import { newGoalId, useStore } from './store';
import { Goal, GoalCategory, SavingsRhythm } from './types';

// Orchestration store + notifications + tracking, partagée entre les écrans.

export interface NewGoalInput {
  name: string;
  category: GoalCategory;
  targetAmount: number;
  alreadyAvailable: number;
  targetDate: Date;
  reminderDay: number;
  rhythm: SavingsRhythm;
}

export type ContributionSource = 'one_tap' | 'custom_amount' | 'test_notification';

export async function createGoal(input: NewGoalInput): Promise<Goal> {
  const state = useStore.getState();
  const now = new Date();
  const goal: Goal = {
    id: newGoalId(),
    name: input.name,
    category: input.category,
    targetAmount: input.targetAmount,
    alreadyAvailable: input.alreadyAvailable,
    targetDate: input.targetDate.toISOString(),
    reminderDay: input.reminderDay,
    rhythm: input.rhythm,
    nextReminderAt: nextReminderAfter(now, input.reminderDay).toISOString(),
    createdAt: now.toISOString(),
    contributions: [],
  };

  // Dans le parcours normal, permission demandée uniquement ici, jamais à l'ouverture.
  // L'appui long de test est l'autre geste explicite pouvant la demander.
  if (!state.notifPermissionAsked) {
    await requestNotificationPermission();
    state.setNotifPermissionAsked();
  }

  state.addGoal(goal);
  const scheduled = await scheduleGoalReminders(goal, suggestedAmount(goal, now));
  state.updateGoal(goal.id, scheduled);

  track('goal_created', {
    goalId: goal.id,
    metadata: { goalId: goal.id, category: goal.category, rhythm: goal.rhythm },
  });
  return goal;
}

async function reschedule(goalId: string): Promise<void> {
  const goal = useStore.getState().goals.find((g) => g.id === goalId);
  if (!goal) return;
  const scheduled = await scheduleGoalReminders(goal, suggestedAmount(goal));
  useStore.getState().updateGoal(goalId, scheduled);
}

/**
 * Confirme le versement du mois. N'importe quel montant > 0 marque le mois
 * comme fait ; l'écart est absorbé par le recalcul du plan (non-punitif).
 */
export async function confirmContribution(
  goal: Goal,
  amount: number,
  source: ContributionSource
): Promise<void> {
  const state = useStore.getState();
  const now = new Date();
  state.logContribution(goal.id, 'deposit', amount);
  const reminderState = reminderStateAfterContribution(goal, now);
  const afterDeposit = useStore.getState().goals.find((candidate) => candidate.id === goal.id);
  state.updateGoal(goal.id, {
    nextReminderAt: reminderState.nextReminderAt.toISOString(),
    followingReminderAt: undefined,
    skippedRegularReminderAt: undefined,
    canIgnoreCurrentReminder:
      Boolean(afterDeposit && remainingAmount(afterDeposit) > 0) &&
      reminderState.canIgnoreCurrentReminder,
  });
  await reschedule(goal.id);
  // Le test modifie bien le plan, mais n'alimente pas la mesure de rétention.
  if (source !== 'test_notification') {
    track('contribution_logged', {
      goalId: goal.id,
      metadata: { type: 'deposit', goalId: goal.id, amountBucket: bucketAmount(amount), source },
    });
  }
}

export async function withdraw(goal: Goal, amount: number): Promise<void> {
  useStore.getState().logContribution(goal.id, 'withdrawal', amount);
  await reschedule(goal.id);
  track('contribution_logged', {
    goalId: goal.id,
    metadata: { type: 'withdrawal', goalId: goal.id, amountBucket: bucketAmount(amount) },
  });
}

/** Reporte le rappel. Échoue si la permission de notification manque. */
export async function postponeReminder(
  goal: Goal,
  date: Date,
  options: { keepRegularReminder: boolean; source?: 'app' | 'test_notification' }
): Promise<{ ok: true } | { ok: false; reason: 'permission' | 'date' }> {
  if (!canPostponeReminderTo(goal, date)) return { ok: false, reason: 'date' };
  if (!(await hasNotificationPermission())) {
    const granted = await requestNotificationPermission();
    if (!granted) return { ok: false, reason: 'permission' };
  }
  const at = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 9, 0, 0, 0);
  const followingReminderAt = options.keepRegularReminder
    ? nextRegularReminderAfterCurrent(goal).toISOString()
    : undefined;
  const skippedRegularReminderAt = options.keepRegularReminder
    ? undefined
    : nextRegularReminderAfterCurrent(goal).toISOString();
  useStore.getState().updateGoal(goal.id, {
    nextReminderAt: at.toISOString(),
    followingReminderAt,
    canIgnoreCurrentReminder: false,
    skippedRegularReminderAt,
  });
  await reschedule(goal.id);
  if (options.source !== 'test_notification') {
    track('reminder_postponed', { goalId: goal.id, metadata: { goalId: goal.id } });
  }
  return { ok: true };
}

/** Le rappel mensuel conservé devient le rappel courant lorsqu'il arrive. */
export async function activateFollowingReminder(goalId: string): Promise<void> {
  const state = useStore.getState();
  const goal = state.goals.find((candidate) => candidate.id === goalId);
  if (!goal?.followingReminderAt) return;
  state.updateGoal(goal.id, {
    nextReminderAt: goal.followingReminderAt,
    followingReminderAt: undefined,
    canIgnoreCurrentReminder: false,
    skippedRegularReminderAt: undefined,
  });
  await reschedule(goal.id);
}

/** Ignore explicitement un rappel mensuel conservé, sans enregistrer de versement. */
export async function ignoreCurrentReminder(goal: Goal, now: Date = new Date()): Promise<boolean> {
  if (!goal.canIgnoreCurrentReminder || new Date(goal.nextReminderAt) > now) return false;
  useStore.getState().updateGoal(goal.id, {
    nextReminderAt: reminderAfterConfirmation(goal, now).toISOString(),
    followingReminderAt: undefined,
    canIgnoreCurrentReminder: false,
    skippedRegularReminderAt: undefined,
  });
  await reschedule(goal.id);
  return true;
}

export async function removeGoal(goal: Goal): Promise<void> {
  await cancelGoalReminder(goal);
  useStore.getState().deleteGoal(goal.id);
  track('goal_deleted', { goalId: goal.id, metadata: { goalId: goal.id } });
}
