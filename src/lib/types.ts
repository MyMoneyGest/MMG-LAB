export type GoalCategory = 'emergency' | 'car' | 'moving' | 'travel' | 'other';

export type SavingsRhythm = 'stable' | 'progressive' | 'regressive';

export type ContributionType = 'deposit' | 'withdrawal';

export interface Contribution {
  id: string;
  type: ContributionType;
  amount: number;
  /** ISO datetime du geste */
  date: string;
}

export interface Goal {
  id: string;
  name: string;
  category: GoalCategory;
  targetAmount: number;
  /** Somme déjà de côté au moment de la création du plan */
  alreadyAvailable: number;
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
  /** Rappel mensuel conservé pendant qu'un rappel plus ancien est reporté. */
  followingReminderAt?: string;
  /** Identifiant natif du rappel mensuel conservé. */
  followingNotificationId?: string;
  /** Le rappel courant suit un versement reporté et peut être ignoré explicitement. */
  canIgnoreCurrentReminder?: boolean;
  /** Date exacte du rappel mensuel refusé après un report proche. */
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
