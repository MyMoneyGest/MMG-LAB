export type GoalCategory = 'emergency' | 'car' | 'moving' | 'travel' | 'other';

export type SavingsRhythm = 'stable' | 'progressive' | 'regressive';

export type ContributionType = 'deposit' | 'withdrawal';

export type ContributionAllocation = 'cycle' | 'surplus';

export interface ReminderCycle {
  /** Identifiant stable : date d'ancre ISO de création du cycle. */
  id: string;
  /** Échéance mensuelle de ce cycle, à 9 h. */
  anchorAt: string;
  /** Report ponctuel éventuel de ce cycle. */
  postponedTo?: string;
  /** Un cycle soldé ne doit plus produire aucune notification. */
  settledAt?: string;
  settledByContributionId?: string;
  /** Identifiants natifs, renouvelés à chaque reprogrammation. */
  anchorNotificationId?: string;
  postponedNotificationId?: string;
}

export interface Contribution {
  id: string;
  type: ContributionType;
  amount: number;
  /** ISO datetime du geste */
  date: string;
  /** Rattachement explicite : un versement solde un cycle ou reste un surplus. */
  allocation?: ContributionAllocation;
  cycleId?: string;
}

export interface BalanceSnapshot {
  id: string;
  /** Solde réel global déclaré par l'utilisateur. */
  amount: number;
  date: string;
  /** Répartition virtuelle appliquée aux projets au moment de la confirmation. */
  allocations: Record<string, number>;
  /** Part du solde dépassant les cibles de tous les projets. */
  unallocatedAmount: number;
}

export type RebalanceReason = 'budget' | 'balance';

export interface RebalanceReview {
  reason: RebalanceReason;
  deferredAt: string;
  nextReviewAt: string;
}

export interface Goal {
  id: string;
  name: string;
  category: GoalCategory;
  targetAmount: number;
  /** Somme déjà de côté au moment de la création du plan */
  alreadyAvailable: number;
  /** Part du dernier solde global confirmé attribuée à ce projet. */
  confirmedBalance?: number;
  balanceConfirmedAt?: string;
  /** ISO date de la cible */
  targetDate: string;
  /** Jour du mois du rappel (1..28) */
  reminderDay: number;
  /** Rythme d'épargne. Absent sur les anciens projets, qui restent stables. */
  rhythm?: SavingsRhythm;
  /** ISO datetime de la prochaine action attendue (rappel à 9h) */
  nextReminderAt: string;
  /** Identifiant de la notification locale programmée */
  notificationId?: string;
  /** Cycles mensuels et reports ponctuels (source de vérité des rappels). */
  reminderCycles?: ReminderCycle[];
  /** Anciens champs conservés uniquement pour migrer les projets locaux existants. */
  followingReminderAt?: string;
  followingNotificationId?: string;
  canIgnoreCurrentReminder?: boolean;
  skippedRegularReminderAt?: string;
  createdAt: string;
  contributions: Contribution[];
}

export interface Budget {
  income: number;
  fixedCharges: number;
  variableExpenses: number;
}

export const CATEGORY_LABELS: Record<GoalCategory, string> = {
  emergency: "Fonds d'urgence",
  car: 'Voiture',
  moving: 'Déménagement',
  travel: 'Vacances',
  other: 'Autre projet',
};

export const CATEGORY_DESCRIPTIONS: Record<GoalCategory, string> = {
  emergency: 'Construire une réserve de sécurité avant les grands projets.',
  car: 'Financer la voiture sans passer par le crédit.',
  moving: 'Préparer le déménagement sereinement.',
  travel: 'Préparer le départ sans toucher au reste.',
  other: 'Avancer vers ton objectif, à ton rythme.',
};
