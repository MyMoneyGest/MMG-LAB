// Logique de plan, 100% pure (pas d'accès store/IO) pour rester testable.
//
// Principe non-punitif : n'importe quel montant rattaché à un cycle le solde ;
// un surplus reste volontairement hors cycle. Tout écart avec le conseil est
// absorbé par le recalcul, jamais par une pénalité ou un blocage.

import {
  Budget,
  BalanceSnapshot,
  Contribution,
  ContributionAllocation,
  Goal,
  RebalanceReview,
  ReminderCycle,
  SavingsRhythm,
} from './types';

/** Part du reste à vivre gardée en réserve pour éviter un plan trop serré. */
export const SAFETY_MARGIN = 0.2;
export const CLOSE_REMINDER_DAYS = 3;
export const CLOSE_CONTRIBUTION_DAYS = 3;
export const BALANCE_CHECK_DAYS = 90;
export const REBALANCE_REVIEW_DAYS = 14;
const DAY_MS = 24 * 60 * 60 * 1000;

function calendarDayNumber(date: Date): number {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY_MS;
}

export function resteAVivre(b: Budget): number {
  return Math.max(0, b.income - b.fixedCharges - b.variableExpenses);
}

export function prudentCapacity(b: Budget): number {
  return Math.floor(resteAVivre(b) * (1 - SAFETY_MARGIN));
}

/** Total mis de côté : déjà disponible + versements − retraits. */
export function savedTotal(goal: Goal): number {
  const confirmedAt = goal.balanceConfirmedAt
    ? new Date(goal.balanceConfirmedAt).getTime()
    : null;
  const moves = goal.contributions.reduce(
    (sum, c) => {
      if (confirmedAt !== null && new Date(c.date).getTime() <= confirmedAt) return sum;
      return sum + (c.type === 'deposit' ? c.amount : -c.amount);
    },
    0
  );
  return Math.max(0, (goal.confirmedBalance ?? goal.alreadyAvailable) + moves);
}

export function remainingAmount(goal: Goal): number {
  return Math.max(0, Math.round((goal.targetAmount - savedTotal(goal)) * 100) / 100);
}

/** Pourcentage atteint, entier 0..100. */
export function progressPct(goal: Goal): number {
  if (goal.targetAmount <= 0) return 100;
  return Math.min(100, Math.floor((savedTotal(goal) / goal.targetAmount) * 100));
}

/** Nombre de mois calendaires restants jusqu'à la date cible (minimum 1). */
export function monthsLeft(goal: Goal, now: Date = new Date()): number {
  const target = new Date(goal.targetDate);
  const diff =
    (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth());
  return Math.max(1, diff);
}

/** Nombre d'occurrences mensuelles entre la première échéance et la cible, borné à 1. */
export function scheduledMonths(firstReminder: Date, target: Date): number {
  const diff =
    (target.getFullYear() - firstReminder.getFullYear()) * 12 +
    (target.getMonth() - firstReminder.getMonth()) +
    1;
  return Math.max(1, diff);
}

/**
 * Répartit un montant en mensualités dont la somme reste exacte au centime.
 * Progressif : poids linéaires de 0,7 à 1,3 ; régressif : ordre inverse.
 * La moyenne des poids vaut toujours 1, donc seul le profil change.
 */
export function plannedAmounts(
  total: number,
  months: number,
  rhythm: SavingsRhythm = 'stable'
): number[] {
  const count = Math.max(1, Math.round(months));
  const totalCents = Math.max(0, Math.round(total * 100));
  const weights = Array.from({ length: count }, (_, index) => {
    if (rhythm === 'stable' || count === 1) return 1;
    const progressiveWeight = 0.7 + (0.6 * index) / (count - 1);
    return rhythm === 'progressive' ? progressiveWeight : 2 - progressiveWeight;
  });
  const weightSum = weights.reduce((sum, weight) => sum + weight, 0);
  const rawCents = weights.map((weight) => (totalCents * weight) / weightSum);
  const allocatedCents = rawCents.map(Math.floor);
  const centsToAllocate = totalCents - allocatedCents.reduce((sum, cents) => sum + cents, 0);
  const remainderOrder = rawCents
    .map((raw, index) => ({ index, fraction: raw - Math.floor(raw) }))
    .sort((a, b) => b.fraction - a.fraction || a.index - b.index);

  for (let i = 0; i < centsToAllocate; i++) {
    allocatedCents[remainderOrder[i % remainderOrder.length].index] += 1;
  }
  return allocatedCents.map((cents) => cents / 100);
}

export type Diagnostic = 'Confortable' | 'Juste' | 'Trop serré';

export function diagnostic(monthly: number, budget: Budget | undefined): Diagnostic | null {
  if (!budget) return null;
  if (monthly <= prudentCapacity(budget)) return 'Confortable';
  if (monthly <= resteAVivre(budget)) return 'Juste';
  return 'Trop serré';
}

/** Une action est en attente si l'échéance du rappel est passée (due ou en retard). */
export function hasPendingAction(goal: Goal, now: Date = new Date()): boolean {
  return (
    remainingAmount(goal) > 0 &&
    normalizedReminderCycles(goal, now).some(
      (cycle) => !cycle.settledAt && reminderAtForCycle(cycle) <= now
    )
  );
}

/** Première occurrence du jour de rappel strictement après `from`, à 9h. */
export function nextReminderAfter(from: Date, reminderDay: number): Date {
  const day = Math.min(28, Math.max(1, Math.round(reminderDay)));
  const d = new Date(from.getFullYear(), from.getMonth(), day, 9, 0, 0, 0);
  if (d <= from) d.setMonth(d.getMonth() + 1);
  return d;
}

function cycleId(anchorAt: Date): string {
  const year = anchorAt.getFullYear();
  const month = String(anchorAt.getMonth() + 1).padStart(2, '0');
  const day = String(anchorAt.getDate()).padStart(2, '0');
  return `cycle-${year}-${month}-${day}`;
}

function cycleFromAnchor(anchorAt: Date): ReminderCycle {
  return { id: cycleId(anchorAt), anchorAt: anchorAt.toISOString() };
}

function previousAnchorOnOrBefore(date: Date, reminderDay: number): Date {
  const day = Math.min(28, Math.max(1, Math.round(reminderDay)));
  const anchor = new Date(date.getFullYear(), date.getMonth(), day, 9, 0, 0, 0);
  if (anchor > date) anchor.setMonth(anchor.getMonth() - 1);
  return anchor;
}

/** Date réellement présentée pour un cycle : report ponctuel ou ancre. */
export function reminderAtForCycle(cycle: ReminderCycle): Date {
  return new Date(cycle.postponedTo ?? cycle.anchorAt);
}

/**
 * Migration paresseuse des anciens projets puis ajout de trois ancres d'avance.
 * Les anciens champs ne sont lus qu'ici ; les cycles deviennent ensuite la source de vérité.
 */
export function normalizedReminderCycles(
  goal: Goal,
  now: Date = new Date(),
  futureCount: number = 3
): ReminderCycle[] {
  let cycles = (goal.reminderCycles ?? []).map((cycle) => ({ ...cycle }));
  if (!cycles.length) {
    const primary = new Date(goal.nextReminderAt);
    const isAnchor = primary.getDate() === goal.reminderDay;
    const anchor = isAnchor ? primary : previousAnchorOnOrBefore(primary, goal.reminderDay);
    cycles.push({
      ...cycleFromAnchor(anchor),
      ...(isAnchor ? {} : { postponedTo: primary.toISOString() }),
      anchorNotificationId: goal.notificationId,
    });
    if (goal.followingReminderAt) {
      const following = new Date(goal.followingReminderAt);
      cycles.push({
        ...cycleFromAnchor(following),
        anchorNotificationId: goal.followingNotificationId,
      });
    }
  }

  const byId = new Map(cycles.map((cycle) => [cycle.id, cycle]));
  cycles = [...byId.values()].sort(
    (a, b) => new Date(a.anchorAt).getTime() - new Date(b.anchorAt).getTime()
  );

  const lastKnown = cycles.at(-1);
  let cursor = lastKnown ? new Date(lastKnown.anchorAt) : nextReminderAfter(now, goal.reminderDay);
  if (!lastKnown) cycles.push(cycleFromAnchor(cursor));
  let future = cycles.filter((cycle) => new Date(cycle.anchorAt) > now).length;
  while (future < futureCount) {
    cursor = nextReminderAfter(cursor, goal.reminderDay);
    const next = cycleFromAnchor(cursor);
    if (!cycles.some((cycle) => cycle.id === next.id)) cycles.push(next);
    future += 1;
  }
  return cycles.sort(
    (a, b) => new Date(a.anchorAt).getTime() - new Date(b.anchorAt).getTime()
  );
}

export function nextReminderFromCycles(cycles: ReminderCycle[]): Date {
  const open = cycles.filter((cycle) => !cycle.settledAt).sort((a, b) => {
    const aAt = reminderAtForCycle(a).getTime();
    const bAt = reminderAtForCycle(b).getTime();
    return aAt - bAt;
  });
  return reminderAtForCycle(open[0]);
}

/** Dette la plus ancienne : cycle non soldé dont l'ancre est arrivée. */
export function oldestUnsettledDebt(goal: Goal, now: Date = new Date()): ReminderCycle | null {
  return (
    normalizedReminderCycles(goal, now).find(
      (cycle) => !cycle.settledAt && new Date(cycle.anchorAt) <= now
    ) ?? null
  );
}

/** Cycle courant pouvant être explicitement soldé avant son ancre. */
export function currentUpcomingCycle(goal: Goal, now: Date = new Date()): ReminderCycle | null {
  return (
    normalizedReminderCycles(goal, now).find(
      (cycle) => !cycle.settledAt && new Date(cycle.anchorAt) > now
    ) ?? null
  );
}

export type ContributionIntent = 'surplus' | 'settle_current';

export interface ContributionPlan {
  allocation: ContributionAllocation;
  cycleId?: string;
  cycleAnchorAt?: string;
  forcedDebt: boolean;
}

/** Rattachement déterministe : dette d'abord, sinon extra par défaut. */
export function contributionPlan(
  goal: Goal,
  intent: ContributionIntent = 'surplus',
  now: Date = new Date()
): ContributionPlan {
  const debt = oldestUnsettledDebt(goal, now);
  if (debt) {
    return {
      allocation: 'cycle',
      cycleId: debt.id,
      cycleAnchorAt: debt.anchorAt,
      forcedDebt: true,
    };
  }
  const current = currentUpcomingCycle(goal, now);
  if (intent === 'settle_current' && current) {
    return {
      allocation: 'cycle',
      cycleId: current.id,
      cycleAnchorAt: current.anchorAt,
      forcedDebt: false,
    };
  }
  return { allocation: 'surplus', forcedDebt: false };
}

export function settleReminderCycle(
  cycles: ReminderCycle[],
  cycleIdToSettle: string,
  contributionId: string,
  settledAt: Date
): ReminderCycle[] {
  return cycles.map((cycle) =>
    cycle.id === cycleIdToSettle
      ? {
          ...cycle,
          settledAt: settledAt.toISOString(),
          settledByContributionId: contributionId,
        }
      : cycle
  );
}

/** Surplus saisis entre l'ancre précédente et l'ancre de ce cycle. */
export function surplusForCycle(goal: Goal, cycle: ReminderCycle): number {
  const anchor = new Date(cycle.anchorAt);
  const previous = new Date(anchor);
  previous.setMonth(previous.getMonth() - 1);
  return goal.contributions.reduce((sum, contribution) => {
    if (contribution.type !== 'deposit' || contribution.allocation !== 'surplus') return sum;
    const at = new Date(contribution.date);
    return at > previous && at <= anchor ? sum + contribution.amount : sum;
  }, 0);
}

function cycleToPostpone(goal: Goal, now: Date): ReminderCycle {
  const cycles = normalizedReminderCycles(goal, now);
  return cycles.find((cycle) => !cycle.settledAt)!;
}

/** Occurrence mensuelle suivant le cycle reporté, selon l'ancre du plan. */
export function nextRegularReminderAfterCurrent(goal: Goal, now: Date = new Date()): Date {
  return nextReminderAfter(new Date(cycleToPostpone(goal, now).anchorAt), goal.reminderDay);
}

/**
 * Avant le jour de l'ancre, le report reste borné à cette ancre. À partir de
 * ce jour seulement, il peut aller jusqu'à la veille de l'ancre suivante.
 */
export function postponeDateLimit(goal: Goal, now: Date = new Date()): Date {
  const currentAnchor = new Date(cycleToPostpone(goal, now).anchorAt);
  if (calendarDayNumber(now) < calendarDayNumber(currentAnchor)) return currentAnchor;
  const limit = nextRegularReminderAfterCurrent(goal, now);
  limit.setDate(limit.getDate() - 1);
  return limit;
}

/** Nombre de jours calendaires entre le report choisi et le rappel mensuel conservable. */
export function daysBeforeRegularReminder(goal: Goal, date: Date, now: Date = new Date()): number {
  const regular = nextRegularReminderAfterCurrent(goal, now);
  return calendarDayNumber(regular) - calendarDayNumber(date);
}

/** À trois jours ou moins, l'interface affiche une information non bloquante. */
export function postponeIsNearNextAnchor(
  goal: Goal,
  date: Date,
  now: Date = new Date()
): boolean {
  const gap = daysBeforeRegularReminder(goal, date, now);
  return gap >= 1 && gap <= CLOSE_REMINDER_DAYS;
}

/** Un report doit être futur et respecter la borne dépendant de l'arrivée de l'ancre. */
export function canPostponeReminderTo(goal: Goal, date: Date, now: Date = new Date()): boolean {
  const at = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 9, 0, 0, 0);
  return at > now && at <= postponeDateLimit(goal, now);
}

/** Applique un report au seul cycle ciblé, sans jamais toucher à l'ancre suivante. */
export function cyclesAfterPostpone(
  goal: Goal,
  date: Date,
  now: Date = new Date()
): ReminderCycle[] {
  const target = cycleToPostpone(goal, now);
  const at = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 9, 0, 0, 0);
  return normalizedReminderCycles(goal, now).map((cycle) =>
    cycle.id === target.id
      ? {
          ...cycle,
          postponedTo: at.toISOString(),
        }
      : cycle
  );
}

/** Versements effectués dans les trois derniers jours calendaires, du plus récent au plus ancien. */
export function recentDeposits(
  goal: Goal,
  at: Date = new Date(),
  withinDays: number = CLOSE_CONTRIBUTION_DAYS
): Contribution[] {
  const currentDay = calendarDayNumber(at);
  return goal.contributions
    .filter((contribution) => {
      if (contribution.type !== 'deposit') return false;
      const difference = currentDay - calendarDayNumber(new Date(contribution.date));
      return difference >= 0 && difference <= withinDays;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/** Change l'ancre du cycle courant si le nouveau jour est encore à venir. */
export function cyclesAfterReminderDayChange(
  goal: Goal,
  newReminderDay: number,
  now: Date = new Date()
): ReminderCycle[] {
  const day = Math.min(28, Math.max(1, Math.round(newReminderDay)));
  const cycles = normalizedReminderCycles(goal, now);
  const pastOrDue = cycles.filter((cycle) => new Date(cycle.anchorAt) <= now);
  const current = cycles.find((cycle) => new Date(cycle.anchorAt) > now);
  if (!current) return pastOrDue;

  const oldAnchor = new Date(current.anchorAt);
  const candidate = new Date(oldAnchor.getFullYear(), oldAnchor.getMonth(), day, 9, 0, 0, 0);
  const first = candidate > now ? cycleFromAnchor(candidate) : { ...current };
  const rebuilt = [...pastOrDue, first];
  let cursor = new Date(first.anchorAt);
  for (let index = 0; index < 3; index += 1) {
    cursor = nextReminderAfter(cursor, day);
    rebuilt.push(cycleFromAnchor(cursor));
  }
  return rebuilt;
}

/** Échéancier prévisionnel : occurrences mensuelles jusqu'à la date cible. */
export function upcomingSchedule(
  goal: Goal,
  now: Date = new Date(),
  maxRows: number = 24
): { date: Date; amount: number }[] {
  const remaining = remainingAmount(goal);
  if (remaining <= 0) return [];
  const rows: { date: Date; amount: number }[] = [];
  const target = new Date(goal.targetDate);
  const cycles = normalizedReminderCycles(goal, now, 3).filter((cycle) => !cycle.settledAt);
  const dates = cycles.map(reminderAtForCycle).filter((date) => date >= now && date <= target);
  let cursor = cycles.length
    ? new Date(cycles.at(-1)!.anchorAt)
    : nextReminderAfter(now, goal.reminderDay);
  while (cursor <= target && dates.length < 600) {
    cursor = nextReminderAfter(cursor, goal.reminderDay);
    if (cursor <= target) dates.push(new Date(cursor));
  }
  if (!dates.length) dates.push(new Date(cursor));
  const amounts = plannedAmounts(remaining, dates.length, goal.rhythm ?? 'stable');
  for (let i = 0; i < dates.length && i < maxRows; i++) {
    rows.push({ date: dates[i], amount: amounts[i] });
  }
  return rows;
}

/** Montant conseillé à la prochaine échéance, selon le rythme choisi. */
export function suggestedAmount(goal: Goal, now: Date = new Date()): number {
  return upcomingSchedule(goal, now, 1)[0]?.amount ?? 0;
}

/** Effort mensuel le plus élevé encore prévu pour un plan. */
export function peakScheduledAmount(goal: Goal, now: Date = new Date()): number {
  const schedule = upcomingSchedule(goal, now, 600);
  return schedule.length ? Math.max(...schedule.map((row) => row.amount)) : 0;
}

export function latestBalanceSnapshot(
  snapshots: BalanceSnapshot[] | undefined
): BalanceSnapshot | null {
  return (
    [...(snapshots ?? [])].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )[0] ?? null
  );
}

/**
 * Avant une première confirmation, le total est la somme des enveloppes estimées.
 * Ensuite, il repart toujours du dernier solde réel et n'ajoute que les mouvements
 * plus récents. Une création/suppression de projet ne fabrique donc pas d'argent.
 */
export function estimatedGlobalBalance(
  goals: Goal[],
  snapshots: BalanceSnapshot[] | undefined
): number {
  const latest = latestBalanceSnapshot(snapshots);
  if (!latest) {
    return Math.round(goals.reduce((sum, goal) => sum + savedTotal(goal), 0) * 100) / 100;
  }
  const confirmedAt = new Date(latest.date).getTime();
  const movesSinceConfirmation = goals.reduce(
    (total, goal) =>
      total +
      goal.contributions.reduce((sum, contribution) => {
        if (new Date(contribution.date).getTime() <= confirmedAt) return sum;
        return sum + (contribution.type === 'deposit' ? contribution.amount : -contribution.amount);
      }, 0),
    0
  );
  return Math.max(0, Math.round((latest.amount + movesSinceConfirmation) * 100) / 100);
}

export function balanceCheckDue(
  goals: Goal[],
  snapshots: BalanceSnapshot[] | undefined,
  now: Date = new Date()
): boolean {
  if (!goals.length) return false;
  const latest = latestBalanceSnapshot(snapshots);
  const reference = latest
    ? new Date(latest.date)
    : new Date(Math.min(...goals.map((goal) => new Date(goal.createdAt).getTime())));
  return calendarDayNumber(now) - calendarDayNumber(reference) >= BALANCE_CHECK_DAYS;
}

export function nextRebalanceReviewAt(from: Date = new Date()): Date {
  const next = new Date(from);
  next.setDate(next.getDate() + REBALANCE_REVIEW_DAYS);
  return next;
}

export function rebalanceReviewDue(
  review: RebalanceReview | undefined,
  now: Date = new Date()
): boolean {
  return Boolean(review && new Date(review.nextReviewAt) <= now);
}

export interface BalanceAllocation {
  allocations: Record<string, number>;
  unallocatedAmount: number;
}

/**
 * Répartit le solde réel selon les enveloppes estimées existantes, sans jamais
 * dépasser la cible d'un projet. Le surplus global reste non affecté.
 */
export function allocateGlobalBalance(goals: Goal[], amount: number): BalanceAllocation {
  const totalCents = Math.max(0, Math.round(amount * 100));
  const caps = new Map(goals.map((goal) => [goal.id, Math.max(0, Math.round(goal.targetAmount * 100))]));
  const allocatable = Math.min(
    totalCents,
    [...caps.values()].reduce((sum, cents) => sum + cents, 0)
  );
  const allocations = new Map(goals.map((goal) => [goal.id, 0]));
  let eligible = goals.map((goal) => goal.id);
  let remaining = allocatable;

  while (eligible.length && remaining > 0) {
    const rawWeights = eligible.map((id) => {
      const goal = goals.find((candidate) => candidate.id === id)!;
      return Math.max(0, Math.min(savedTotal(goal), goal.targetAmount));
    });
    const rawSum = rawWeights.reduce((sum, weight) => sum + weight, 0);
    const weights = rawSum > 0
      ? rawWeights
      : eligible.map((id) => caps.get(id) ?? 0);
    const weightSum = weights.reduce((sum, weight) => sum + weight, 0);
    if (weightSum <= 0) break;

    const cappedIds: string[] = [];
    eligible.forEach((id, index) => {
      const capLeft = (caps.get(id) ?? 0) - (allocations.get(id) ?? 0);
      const fairShare = (remaining * weights[index]) / weightSum;
      if (fairShare >= capLeft) cappedIds.push(id);
    });

    if (!cappedIds.length) {
      const raw = eligible.map((id, index) => ({
        id,
        cents: (remaining * weights[index]) / weightSum,
      }));
      const floors = raw.map((item) => ({ ...item, floor: Math.floor(item.cents) }));
      let leftover = remaining - floors.reduce((sum, item) => sum + item.floor, 0);
      floors
        .sort((a, b) => b.cents - b.floor - (a.cents - a.floor))
        .forEach((item) => {
          const extra = leftover > 0 ? 1 : 0;
          allocations.set(item.id, (allocations.get(item.id) ?? 0) + item.floor + extra);
          leftover -= extra;
        });
      remaining = 0;
      break;
    }

    for (const id of cappedIds) {
      const capLeft = (caps.get(id) ?? 0) - (allocations.get(id) ?? 0);
      allocations.set(id, (allocations.get(id) ?? 0) + capLeft);
      remaining -= capLeft;
    }
    eligible = eligible.filter((id) => !cappedIds.includes(id));
  }

  return {
    allocations: Object.fromEntries(
      [...allocations.entries()].map(([id, cents]) => [id, cents / 100])
    ),
    unallocatedAmount: (totalCents - allocatable) / 100,
  };
}

export interface GoalRebalanceProposal {
  goalId: string;
  goalName: string;
  currentTargetDate: string;
  proposedTargetDate: string;
  currentMonthly: number;
  proposedMonthly: number;
}

export interface GlobalRebalanceProposal {
  capacity: number;
  currentEffort: number;
  direction: 'accelerate' | 'relax';
  possible: boolean;
  goals: GoalRebalanceProposal[];
}

function targetDateForCapacity(
  goal: Goal,
  monthlyCapacity: number,
  now: Date
): { date: Date; monthly: number } | null {
  const remaining = remainingAmount(goal);
  if (remaining <= 0) return { date: new Date(goal.targetDate), monthly: 0 };
  if (monthlyCapacity <= 0) return null;
  for (let months = 1; months <= 600; months += 1) {
    const amounts = plannedAmounts(remaining, months, goal.rhythm ?? 'stable');
    const peak = Math.max(...amounts);
    if (peak <= monthlyCapacity + 0.01) {
      let date = nextReminderAfter(now, goal.reminderDay);
      for (let index = 1; index < months; index += 1) {
        date = nextReminderAfter(date, goal.reminderDay);
      }
      return { date, monthly: amounts[0] };
    }
  }
  return null;
}

/** Proposition globale : la somme des parts n'excède jamais la capacité prudente. */
export function buildGlobalRebalanceProposal(
  goals: Goal[],
  budget: Budget,
  now: Date = new Date()
): GlobalRebalanceProposal {
  const active = goals.filter((goal) => remainingAmount(goal) > 0);
  const currentAmounts = active.map((goal) => peakScheduledAmount(goal, now));
  const currentEffort = currentAmounts.reduce((sum, amount) => sum + amount, 0);
  const capacity = prudentCapacity(budget);
  const fallbackWeights = active.map((goal) => remainingAmount(goal));
  const weightSum = currentEffort > 0
    ? currentEffort
    : fallbackWeights.reduce((sum, amount) => sum + amount, 0);
  const goalsProposal: GoalRebalanceProposal[] = [];
  let possible = active.length === 0 || (capacity > 0 && weightSum > 0);

  active.forEach((goal, index) => {
    const weight = currentEffort > 0 ? currentAmounts[index] : fallbackWeights[index];
    const share = weightSum > 0 ? (capacity * weight) / weightSum : 0;
    const target = targetDateForCapacity(goal, share, now);
    if (!target) {
      possible = false;
      return;
    }
    goalsProposal.push({
      goalId: goal.id,
      goalName: goal.name,
      currentTargetDate: goal.targetDate,
      proposedTargetDate: target.date.toISOString(),
      currentMonthly: currentAmounts[index],
      proposedMonthly: target.monthly,
    });
  });

  return {
    capacity,
    currentEffort: Math.round(currentEffort * 100) / 100,
    direction: capacity >= currentEffort ? 'accelerate' : 'relax',
    possible,
    goals: goalsProposal,
  };
}

/** Bucket anonymisé pour le tracking (mêmes valeurs que l'ancienne app). */
export function bucketAmount(amount: number): string {
  if (amount < 50) return '0_50';
  if (amount < 100) return '50_100';
  if (amount < 250) return '100_250';
  return '250_plus';
}
