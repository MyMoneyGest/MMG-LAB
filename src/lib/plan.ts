// Logique de plan, 100% pure (pas d'accès store/IO) pour rester testable.
//
// Principe non-punitif : n'importe quel montant versé marque le mois comme
// fait ; l'écart avec le montant conseillé est absorbé par le recalcul
// (remaining / mois restants), jamais par une pénalité ou un blocage.

import { Budget, Goal } from './types';

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

/** Montant conseillé du mois : le restant lissé sur les mois restants. */
export function suggestedAmount(goal: Goal, now: Date = new Date()): number {
  const remaining = remainingAmount(goal);
  if (remaining <= 0) return 0;
  return Math.ceil((remaining / monthsLeft(goal, now)) * 100) / 100;
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
  const months = Math.max(
    1,
    (target.getFullYear() - cursor.getFullYear()) * 12 + (target.getMonth() - cursor.getMonth()) + 1
  );
  const amount = Math.ceil((remaining / months) * 100) / 100;
  for (let i = 0; i < months && i < maxRows; i++) {
    rows.push({ date: new Date(cursor), amount });
    cursor = nextReminderAfter(cursor, goal.reminderDay);
  }
  return rows;
}

/** Bucket anonymisé pour le tracking (mêmes valeurs que l'ancienne app). */
export function bucketAmount(amount: number): string {
  if (amount < 50) return '0_50';
  if (amount < 100) return '50_100';
  if (amount < 250) return '100_250';
  return '250_plus';
}
