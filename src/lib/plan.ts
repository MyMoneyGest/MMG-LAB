// Logique de plan, 100% pure (pas d'accès store/IO) pour rester testable.
//
// Principe non-punitif : n'importe quel montant versé marque le mois comme
// fait ; l'écart avec le montant conseillé est absorbé par le recalcul
// (remaining / mois restants), jamais par une pénalité ou un blocage.

import { Budget, Goal, SavingsRhythm } from './types';

/** Part du reste à vivre gardée en réserve pour éviter un plan trop serré. */
export const SAFETY_MARGIN = 0.2;

export function resteAVivre(b: Budget): number {
  return Math.max(0, b.income - b.fixedCharges - b.variableExpenses);
}

export function prudentCapacity(b: Budget): number {
  return Math.floor(resteAVivre(b) * (1 - SAFETY_MARGIN));
}

/** Total mis de côté : déjà disponible + versements − retraits. */
export function savedTotal(goal: Goal): number {
  const moves = goal.contributions.reduce(
    (sum, c) => sum + (c.type === 'deposit' ? c.amount : -c.amount),
    0
  );
  return Math.max(0, goal.alreadyAvailable + moves);
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
  return remainingAmount(goal) > 0 && new Date(goal.nextReminderAt) <= now;
}

/** Première occurrence du jour de rappel strictement après `from`, à 9h. */
export function nextReminderAfter(from: Date, reminderDay: number): Date {
  const day = Math.min(28, Math.max(1, Math.round(reminderDay)));
  const d = new Date(from.getFullYear(), from.getMonth(), day, 9, 0, 0, 0);
  if (d <= from) d.setMonth(d.getMonth() + 1);
  return d;
}

/** Dernière date de report autorisée : l'occurrence mensuelle suivant le rappel courant. */
export function postponeDateLimit(goal: Goal, now: Date = new Date()): Date {
  const currentReminder = new Date(goal.nextReminderAt);
  const reference = currentReminder > now ? currentReminder : now;
  return nextReminderAfter(reference, goal.reminderDay);
}

/** Un report doit être futur et ne jamais dépasser le prochain rappel mensuel. */
export function canPostponeReminderTo(goal: Goal, date: Date, now: Date = new Date()): boolean {
  const at = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 9, 0, 0, 0);
  return at > now && at <= postponeDateLimit(goal, now);
}

/**
 * Échéance suivante après confirmation d'un versement : le versement marque
 * le mois en cours comme fait, donc prochain rappel = occurrence du jour de
 * rappel le mois suivant. Payer en avance ne fait pas sauter de mois, payer
 * en retard ne déclenche pas de rappel « de rattrapage » immédiat.
 */
export function reminderAfterConfirmation(goal: Goal, now: Date = new Date()): Date {
  const day = Math.min(28, Math.max(1, Math.round(goal.reminderDay)));
  return new Date(now.getFullYear(), now.getMonth() + 1, day, 9, 0, 0, 0);
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
  let cursor = new Date(goal.nextReminderAt);
  if (cursor < now) cursor = nextReminderAfter(now, goal.reminderDay);
  const months = scheduledMonths(cursor, target);
  const amounts = plannedAmounts(remaining, months, goal.rhythm ?? 'stable');
  for (let i = 0; i < months && i < maxRows; i++) {
    rows.push({ date: new Date(cursor), amount: amounts[i] });
    cursor = nextReminderAfter(cursor, goal.reminderDay);
  }
  return rows;
}

/** Montant conseillé à la prochaine échéance, selon le rythme choisi. */
export function suggestedAmount(goal: Goal, now: Date = new Date()): number {
  return upcomingSchedule(goal, now, 1)[0]?.amount ?? 0;
}

/** Bucket anonymisé pour le tracking (mêmes valeurs que l'ancienne app). */
export function bucketAmount(amount: number): string {
  if (amount < 50) return '0_50';
  if (amount < 100) return '50_100';
  if (amount < 250) return '100_250';
  return '250_plus';
}
