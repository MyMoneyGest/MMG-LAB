import { track } from './analytics';
import {
  bucketAmount,
  allocateGlobalBalance,
  buildGlobalRebalanceProposal,
  canPostponeReminderTo,
  contributionPlan,
  cyclesAfterPostpone,
  cyclesAfterReminderDayChange,
  goalActivationDelayDays,
  nextReminderAfter,
  nextRebalanceReviewAt,
  nextReminderFromCycles,
  normalizedReminderCycles,
  remainingAmount,
  settleReminderCycle,
  suggestedAmount,
} from './plan';
import type { ContributionIntent, ContributionPlan } from './plan';
import type { GlobalRebalanceProposal } from './plan';
import {
  cancelGoalReminder,
  dismissPresentedCycle,
  hasNotificationPermission,
  requestNotificationPermission,
  scheduleGoalReminders,
} from './notifications';
import { newGoalId, useStore } from './store';
import { Goal, GoalCategory, SavingsMode, SavingsRhythm } from './types';
import type { RebalanceReason } from './types';
import { amountInEurReference, normalizeMoney } from './currency';
import type { CurrencyCode } from './currency';

// Orchestration store + notifications + tracking, partagée entre les écrans.

export interface NewGoalInput {
  name: string;
  category: GoalCategory;
  targetAmount: number;
  alreadyAvailable: number;
  targetDate: Date;
  reminderDay: number;
  rhythm: SavingsRhythm;
  savingsMode: SavingsMode;
  startDate?: Date;
}

export type ContributionSource = 'one_tap' | 'custom_amount' | 'test_notification';

/** Change le pays/la devise, avec conversion explicite optionnelle des données locales. */
export async function changeLocale(
  country: string,
  currencyCode: CurrencyCode,
  conversionRate?: number
): Promise<void> {
  const state = useStore.getState();
  if (conversionRate && Number.isFinite(conversionRate) && conversionRate > 0) {
    state.convertLocale({ country, currencyCode, rate: conversionRate });
  } else {
    state.setLocale({ country, currencyCode });
  }
  for (const goal of useStore.getState().goals) {
    const scheduled = await scheduleGoalReminders(goal, suggestedAmount(goal));
    useStore.getState().updateGoal(goal.id, scheduled);
  }
}

export async function createGoal(input: NewGoalInput): Promise<Goal> {
  const state = useStore.getState();
  const now = new Date();
  const startDate = input.startDate && input.startDate > now ? input.startDate : undefined;
  const scheduleReference = startDate ?? now;
  const goal: Goal = {
    id: newGoalId(),
    name: input.name,
    category: input.category,
    targetAmount: input.targetAmount,
    alreadyAvailable: input.alreadyAvailable,
    targetDate: input.targetDate.toISOString(),
    reminderDay: input.reminderDay,
    rhythm: input.rhythm,
    savingsMode: input.savingsMode,
    startDate: startDate?.toISOString(),
    nextReminderAt: nextReminderAfter(scheduleReference, input.reminderDay).toISOString(),
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
    metadata: {
      goalId: goal.id,
      category: goal.category,
      rhythm: goal.rhythm,
      savingsMode: goal.savingsMode ?? 'guided',
      activationDelayDays: goalActivationDelayDays(goal),
      country: state.country ?? 'unknown',
      currencyCode: state.currencyCode,
    },
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
  const normalizedAmount = normalizeMoney(amount, state.currencyCode);
  const now = new Date();
  const cycles = normalizedReminderCycles(goal, now);
  const plan = contributionPlan({ ...goal, reminderCycles: cycles }, intent, now);
  const contribution = state.logContribution(
    goal.id,
    'deposit',
    normalizedAmount,
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
      metadata: {
        type: 'deposit',
        goalId: goal.id,
        // Bucket sur une base euro commune : sans normalisation, tout versement
        // FCFA tomberait dans « 250_plus » et la métrique serait muette.
        amountBucket: bucketAmount(amountInEurReference(normalizedAmount, state.currencyCode)),
        source,
      },
    });
  }
  return plan;
}

export async function withdraw(goal: Goal, amount: number): Promise<void> {
  const currencyCode = useStore.getState().currencyCode;
  useStore.getState().logContribution(goal.id, 'withdrawal', amount);
  await reschedule(goal.id);
  track('contribution_logged', {
    goalId: goal.id,
    metadata: {
      type: 'withdrawal',
      goalId: goal.id,
      amountBucket: bucketAmount(amountInEurReference(amount, currencyCode)),
    },
  });
}

/** Confirme le solde réel global et recale les enveloppes virtuelles. */
export async function reconcileGlobalBalance(
  amount: number
): Promise<GlobalRebalanceProposal | null> {
  const state = useStore.getState();
  const now = new Date();
  const distribution = allocateGlobalBalance(state.goals, amount);
  const snapshot = {
    id: `balance-${Date.now()}`,
    amount,
    date: now.toISOString(),
    allocations: distribution.allocations,
    unallocatedAmount: distribution.unallocatedAmount,
  };
  for (const goal of state.goals) {
    state.updateGoal(goal.id, {
      confirmedBalance: distribution.allocations[goal.id] ?? 0,
      balanceConfirmedAt: snapshot.date,
    });
  }
  state.addBalanceSnapshot(snapshot);
  track('balance_confirmed');
  for (const goal of state.goals) await reschedule(goal.id);
  const updatedGoals = useStore.getState().goals;
  const budget = useStore.getState().budget;
  return budget ? buildGlobalRebalanceProposal(updatedGoals, budget, now) : null;
}

export function deferGlobalRebalance(
  reason: RebalanceReason,
  choice: 'kept' | 'deferred' = 'kept',
  now: Date = new Date()
): void {
  useStore.getState().setRebalanceReview({
    reason,
    deferredAt: now.toISOString(),
    nextReviewAt: nextRebalanceReviewAt(now).toISOString(),
  });
  track('rebalance_decided', { metadata: { choice } });
}

export function clearGlobalRebalanceReview(): void {
  useStore.getState().setRebalanceReview(undefined);
}

/** Applique uniquement une proposition explicitement acceptée. */
export async function applyGlobalRebalance(
  proposal: GlobalRebalanceProposal
): Promise<void> {
  const state = useStore.getState();
  for (const item of proposal.goals) {
    state.updateGoal(item.goalId, { targetDate: item.proposedTargetDate });
  }
  for (const item of proposal.goals) await reschedule(item.goalId);
  clearGlobalRebalanceReview();
  track('rebalance_decided', { metadata: { choice: 'applied' } });
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

/** Active ou coupe le coup de pouce du projet, sans produire d'événement analytics. */
export async function changeMidCycleNudge(
  goal: Goal,
  enabled: boolean
): Promise<{ ok: true } | { ok: false; reason: 'permission' }> {
  if (enabled && !(await hasNotificationPermission())) {
    const granted = await requestNotificationPermission();
    if (!granted) return { ok: false, reason: 'permission' };
  }
  useStore.getState().updateGoal(goal.id, { midCycleNudgeEnabled: enabled });
  await reschedule(goal.id);
  return { ok: true };
}

export async function removeGoal(goal: Goal): Promise<void> {
  await cancelGoalReminder(goal);
  useStore.getState().deleteGoal(goal.id);
  track('goal_deleted', { goalId: goal.id, metadata: { goalId: goal.id } });
}
