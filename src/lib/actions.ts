import { track } from './analytics';
import {
  bucketAmount,
  canPostponeReminderTo,
  nextReminderAfter,
  reminderAfterConfirmation,
  suggestedAmount,
} from './plan';
import {
  cancelGoalReminder,
  hasNotificationPermission,
  requestNotificationPermission,
  scheduleGoalReminder,
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
  const notificationId = await scheduleGoalReminder(goal, suggestedAmount(goal, now));
  if (notificationId) state.updateGoal(goal.id, { notificationId });

  track('goal_created', {
    goalId: goal.id,
    metadata: { goalId: goal.id, category: goal.category, rhythm: goal.rhythm },
  });
  return goal;
}

async function reschedule(goalId: string): Promise<void> {
  const goal = useStore.getState().goals.find((g) => g.id === goalId);
  if (!goal) return;
  const notificationId = await scheduleGoalReminder(goal, suggestedAmount(goal));
  useStore.getState().updateGoal(goalId, { notificationId: notificationId ?? undefined });
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
  state.logContribution(goal.id, 'deposit', amount);
  state.updateGoal(goal.id, {
    nextReminderAt: reminderAfterConfirmation(goal).toISOString(),
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
  source: 'app' | 'test_notification' = 'app'
): Promise<{ ok: true } | { ok: false; reason: 'permission' | 'date' }> {
  if (!canPostponeReminderTo(goal, date)) return { ok: false, reason: 'date' };
  if (!(await hasNotificationPermission())) {
    const granted = await requestNotificationPermission();
    if (!granted) return { ok: false, reason: 'permission' };
  }
  const at = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 9, 0, 0, 0);
  useStore.getState().updateGoal(goal.id, { nextReminderAt: at.toISOString() });
  await reschedule(goal.id);
  if (source !== 'test_notification') {
    track('reminder_postponed', { goalId: goal.id, metadata: { goalId: goal.id } });
  }
  return { ok: true };
}

export async function removeGoal(goal: Goal): Promise<void> {
  await cancelGoalReminder(goal);
  useStore.getState().deleteGoal(goal.id);
  track('goal_deleted', { goalId: goal.id, metadata: { goalId: goal.id } });
}
