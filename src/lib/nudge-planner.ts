// Planificateur PUR des coups de pouce (aucun accès store/IO/notifs) : décide,
// à partir de l'état, la liste ordonnée des coups de pouce à programmer sur un
// horizon. Toute la logique délicate (plafond global, priorité, cas « ne rien
// envoyer ») vit ici pour être testable — la couche notifications ne fait que
// construire l'entrée et programmer la sortie.
//
// Deux sources de déclenchement (spec §2), un seul plafond partagé (spec §4) :
//   A. mi-cycle calendaire (une fois par cycle, entre deux ancres) ;
//   B. inactivité (l'app n'a pas été ouverte depuis N jours).

const DAY = 24 * 60 * 60 * 1000;

export type NudgeTrigger = 'mid_cycle' | 'inactivity';

/** Réglages par défaut (spec) — surchargeable pour les tests. */
export const NUDGE_INACTIVITY_DAYS = 10;
export const NUDGE_CAP_DAYS = 15; // « une quinzaine », tous projets confondus
export const NUDGE_MIN_DAYS_BEFORE_REMINDER = 4;
export const NUDGE_HORIZON_DAYS = 90;
export const NUDGE_MAX_INACTIVITY = 3; // ne pas harceler un compte durablement inactif

export interface MidCycleCandidate {
  /** Instant (ms) du point mi-cycle. */
  at: number;
  /** Instant (ms) du rappel mensuel de ce cycle (règle « pas trop près »). */
  reminderAt: number;
  /** Un cycle déjà soldé ne produit aucun coup de pouce. */
  settled: boolean;
}

export interface NudgeCandidateGoal {
  goalId: string;
  /** Réglage activé sur ce projet (sinon aucun coup de pouce). */
  nudgeEnabled: boolean;
  /** Projet atteint/terminé → plus aucun coup de pouce. */
  reached: boolean;
  /** Aucun coup de pouce avant cette date (démarrage différé). */
  activationAt: number;
  /** Dernier « contact » (versement/interaction) : priorité au plus délaissé. */
  lastTouchedAt: number;
  /** Points mi-cycle candidats de ce projet. */
  midCycleNudges: MidCycleCandidate[];
}

export interface NudgePlanConfig {
  now: number;
  lastAppOpenAt: number;
  /** Instant (ms) du dernier coup de pouce déjà programmé/passé, pour le plafond. */
  lastNudgeAt: number;
  inactivityDays?: number;
  capDays?: number;
  minDaysBeforeReminder?: number;
  horizonDays?: number;
  maxInactivity?: number;
}

export interface PlannedNudge {
  goalId: string;
  at: number;
  trigger: NudgeTrigger;
}

interface Candidate extends PlannedNudge {
  lastTouchedAt: number;
}

/**
 * Décide la liste ordonnée des coups de pouce à programmer. Garantit :
 *  - au plus un coup de pouce par `capDays`, tous projets et déclencheurs confondus ;
 *  - à instant égal, priorité au projet le plus anciennement « touché » ;
 *  - aucun envoi sur projet atteint, cycle soldé, avant activation, ou à moins de
 *    `minDaysBeforeReminder` du rappel mensuel ;
 *  - inactivité seulement si au moins un projet a le coup de pouce activé.
 */
export function planNudges(
  goals: NudgeCandidateGoal[],
  config: NudgePlanConfig
): PlannedNudge[] {
  const now = config.now;
  const inactivityDays = config.inactivityDays ?? NUDGE_INACTIVITY_DAYS;
  const capDays = config.capDays ?? NUDGE_CAP_DAYS;
  const minBefore = config.minDaysBeforeReminder ?? NUDGE_MIN_DAYS_BEFORE_REMINDER;
  const horizonDays = config.horizonDays ?? NUDGE_HORIZON_DAYS;
  const maxInactivity = config.maxInactivity ?? NUDGE_MAX_INACTIVITY;
  const horizonEnd = now + horizonDays * DAY;

  const eligible = goals.filter((goal) => goal.nudgeEnabled && !goal.reached);
  const candidates: Candidate[] = [];

  // Source A — mi-cycle calendaire.
  for (const goal of eligible) {
    for (const midCycle of goal.midCycleNudges) {
      if (midCycle.settled) continue;
      if (midCycle.at <= now || midCycle.at > horizonEnd) continue;
      if (midCycle.at < goal.activationAt) continue;
      if (midCycle.reminderAt - midCycle.at < minBefore * DAY) continue;
      candidates.push({
        goalId: goal.goalId,
        at: midCycle.at,
        trigger: 'mid_cycle',
        lastTouchedAt: goal.lastTouchedAt,
      });
    }
  }

  // Source B — inactivité. Cible le projet éligible le plus anciennement touché.
  if (eligible.length > 0) {
    const target = eligible.reduce((oldest, goal) =>
      goal.lastTouchedAt < oldest.lastTouchedAt ? goal : oldest
    );
    let fireAt = Math.max(config.lastAppOpenAt + inactivityDays * DAY, now, target.activationAt);
    for (let count = 0; count < maxInactivity && fireAt <= horizonEnd; count++) {
      candidates.push({
        goalId: target.goalId,
        at: fireAt,
        trigger: 'inactivity',
        lastTouchedAt: target.lastTouchedAt,
      });
      fireAt += capDays * DAY;
    }
  }

  // Ordre : par instant ; à égalité, projet le plus anciennement touché, puis mi-cycle
  // avant inactivité (on préfère montrer le cycle propre du projet).
  candidates.sort(
    (a, b) =>
      a.at - b.at ||
      a.lastTouchedAt - b.lastTouchedAt ||
      (a.trigger === b.trigger ? 0 : a.trigger === 'mid_cycle' ? -1 : 1)
  );

  // Plafond glissant partagé : au plus un coup de pouce par `capDays`.
  const selected: PlannedNudge[] = [];
  let lastAt = config.lastNudgeAt || 0;
  for (const candidate of candidates) {
    if (candidate.at - lastAt >= capDays * DAY) {
      selected.push({ goalId: candidate.goalId, at: candidate.at, trigger: candidate.trigger });
      lastAt = candidate.at;
    }
  }
  return selected;
}
