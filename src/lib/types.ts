export type GoalCategory = 'emergency' | 'car' | 'moving' | 'travel' | 'other';

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
  /** ISO datetime de la prochaine action attendue (rappel à 9h) */
  nextReminderAt: string;
  /** Identifiant de la notification locale programmée */
  notificationId?: string;
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
