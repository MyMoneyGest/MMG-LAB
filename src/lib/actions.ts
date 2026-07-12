import { track } from './analytics';
import {
  bucketAmount,
  canPostponeReminderTo,
  contributionPlan,
  cyclesAfterPostpone,
  cyclesAfterReminderDayChange,
  nextReminderAfter,
  nextReminderFromCycles,
  normalizedReminderCycles,
  remainingAmount,
  settleReminderCycle,
  suggestedAmount,
} from './plan';
import type { ContributionIntent, ContributionPlan } from './plan';
import {
  cancelGoalReminder,
  dismissPresentedCycle,
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

/** Enregistre un versement avec rattachement dette/cycle ou surplus explicite. */
export async function confirmContribution(
  goal: Goal,
  amount: number,
  source: ContributionSource,
  intent: ContributionIntent = 'surplus'
): Promise<ContributionPlan> {
  const state = useStore.getState();
  const now = new Date();
  const cycles = normalizedReminderCycles(goal, now);
  const plan = contributionPlan({ ...goal, reminderCycles: cycles }, intent, now);
  const contribution = state.logContribution(
    goal.id,
    'deposit',
    amount,
    plan.allocation,
    plan.cycleId
  );
  const updatedCycles = plan.cycleId
    ? settleReminderCycle(cycles, plan.cycleId, contribution.id, now)
    : cycles;
  if (plan.cycleId) await dismissPresentedCycle(goal.id, plan.cycleId);
  state.updateGoal(goal.id, {
    reminderCycles: updatedCycles,
    nextReminderAt: nextReminderFromCycles(updatedCycles).toISOString(),
    followingReminderAt: undefined,
    followingNotificationId: undefined,
    notificationId: undefined,
    skippedRegularReminderAt: undefined,
    canIgnoreCurrentReminder: false,
  });
  await reschedule(goal.id);
  // Le test modifie bien le plan, mais n'alimente pas la mesure de rétention.
  if (source !== 'test_notification') {
    track('contribution_logged', {
      goalId: goal.id,
      metadata: { type: 'deposit', goalId: goal.id, amountBucket: bucketAmount(amount), source },
    });
  }
  return plan;
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
  options: { source?: 'app' | 'test_notification' } = {}
): Promise<{ ok: true } | { ok: false; reason: 'permission' | 'date' }> {
  if (!canPostponeReminderTo(goal, date)) return { ok: false, reason: 'date' };
  if (!(await hasNotificationPermission())) {
    const granted = await requestNotificationPermission();
    if (!granted) return { ok: false, reason: 'permission' };
  }
  const cycles = cyclesAfterPostpone(goal, date);
  useStore.getState().updateGoal(goal.id, {
    reminderCycles: cycles,
    nextReminderAt: nextReminderFromCycles(cycles).toISOString(),
    followingReminderAt: undefined,
    followingNotificationId: undefined,
    notificationId: undefined,
    canIgnoreCurrentReminder: false,
    skippedRegularReminderAt: undefined,
  });
  await reschedule(goal.id);
  if (options.source !== 'test_notification') {
    track('reminder_postponed', { goalId: goal.id, metadata: { goalId: goal.id } });
  }
  return { ok: true };
}

/** Change l'ancre sans altérer les dettes ni les cycles déjà échus. */
export async function changeReminderDay(goal: Goal, reminderDay: number): Promise<void> {
  await cancelGoalReminder(goal);
  const cycles = cyclesAfterReminderDayChange(goal, reminderDay);
  useStore.getState().updateGoal(goal.id, {
    reminderDay,
    reminderCycles: cycles,
    nextReminderAt: nextReminderFromCycles(cycles).toISOString(),
    followingReminderAt: undefined,
    followingNotificationId: undefined,
    notificationId: undefined,
    canIgnoreCurrentReminder: false,
    skippedRegularReminderAt: undefined,
  });
  await reschedule(goal.id);
}

export async function removeGoal(goal: Goal): Promise<void> {
  await cancelGoalReminder(goal);
  useStore.getState().deleteGoal(goal.id);
  track('goal_deleted', { goalId: goal.id, metadata: { goalId: goal.id } });
}
