export type GoalCategory = 'emergency' | 'car' | 'moving' | 'travel' | 'housing' | 'other';

export type SavingsRhythm = 'stable' | 'progressive' | 'regressive';

export type SavingsMode = 'guided' | 'free';

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
  /** Message facultatif et non interactif placé à mi-chemin du cycle. */
  midCycleNotificationId?: string;
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
  /**
   * Heure du rappel (0..23). Absente sur les projets créés avant le réglage :
   * ils restent à `REMINDER_HOUR`, qui était leur comportement.
   *
   * ⚠️ Ce champ ne suffit PAS à déplacer un rappel. L'heure est gravée dans
   * l'`anchorAt` de chaque cycle au moment où il est créé : la changer impose
   * de reconstruire les ancres à venir, pas seulement d'écrire ici.
   */
  reminderHour?: number;
  /** Rythme d'épargne. Absent sur les anciens projets, qui restent stables. */
  rhythm?: SavingsRhythm;
  /**
   * Montant mensuel FIXÉ par la personne, au lieu d'être déduit de la date
   * cible. Présent = c'est le montant qui est l'engagement, pas la date : un
   * mois creux allonge le plan, il n'augmente jamais l'effort du mois suivant.
   *
   * Le dernier versement est le reste, forcément plus petit. Et `rhythm` est
   * ignoré dans ce régime : « je mets 200 € par mois » ne veut rien dire
   * d'autre que 200 € chaque mois.
   */
  plannedMonthly?: number;
  /** Mode libre sans montant conseillé. Absent sur les anciens projets, qui restent guidés. */
  savingsMode?: SavingsMode;
  /**
   * Date locale à partir de laquelle le plan et ses rappels deviennent actifs.
   * Absente sur les anciens projets et les démarrages immédiats.
   */
  startDate?: string;
  /**
   * Repère facultatif indiquant où l'épargne du projet est conservée.
   * Cette valeur libre reste locale et n'est jamais envoyée aux analytics.
   */
  savingsLocation?: string;
  /** Coup de pouce non-punitif entre deux rappels, désactivé par défaut. */
  midCycleNudgeEnabled?: boolean;
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

/**
 * Un coup de pouce programmé (planificateur global). Persisté pour pouvoir
 * l'annuler à la prochaine reprogrammation, alimenter le plafond glissant et
 * tracer (une seule fois) les coups de pouce dont l'heure est passée.
 */
export interface ScheduledNudge {
  id: string;
  /** ISO datetime de déclenchement. */
  at: string;
  trigger: 'mid_cycle' | 'inactivity';
  goalId: string;
}

export const CATEGORY_LABELS: Record<GoalCategory, string> = {
  emergency: "Fonds d'urgence",
  car: 'Voiture',
  moving: 'Déménagement',
  travel: 'Vacances',
  housing: 'Immobilier',
  other: 'Autre projet',
};

/** Pastille illustrative du projet, à côté de son objectif mensuel. */
export const CATEGORY_EMOJI: Record<GoalCategory, string> = {
  emergency: '🛟',
  car: '🚗',
  moving: '🏠',
  travel: '✈️',
  housing: '🏡',
  other: '🎯',
};

export const CATEGORY_DESCRIPTIONS: Record<GoalCategory, string> = {
  emergency: 'Construire une réserve de sécurité avant les grands projets.',
  car: 'Financer la voiture sans passer par le crédit.',
  moving: 'Préparer le déménagement sereinement.',
  travel: 'Préparer le départ sans toucher au reste.',
  housing: 'Avancer vers ton projet immobilier, à ton rythme.',
  other: 'Avancer vers ton objectif, à ton rythme.',
};
