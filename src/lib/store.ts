import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { EventRow } from './analytics';
import { CurrencyCode, DEFAULT_CURRENCY } from './currency';
import { convertFinancialData } from './currency-conversion';
import {
  Budget,
  BalanceSnapshot,
  Contribution,
  ContributionAllocation,
  ContributionType,
  Goal,
  RebalanceReview,
  ScheduledNudge,
} from './types';

// Le store est la seule source de vérité des données utilisateur, persistée
// en local (AsyncStorage). Supabase ne reçoit que des événements d'usage.

function makeInstallId(): string {
  return `install-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

interface MMGState {
  installId: string;
  /** V2 — Lot A : pays (ISO alpha-2) et devise choisis au premier lancement. */
  country?: string;
  currencyCode: CurrencyCode;
  budget?: Budget;
  balanceSnapshots: BalanceSnapshot[];
  rebalanceReview?: RebalanceReview;
  goals: Goal[];
  lastViewedGoalId?: string;
  notifPermissionAsked: boolean;
  /** Prénom facultatif, saisi à la création d'un projet, pour personnaliser les salutations. */
  userName?: string;
  /** Dernière ouverture de l'app (ISO) : base du déclencheur d'inactivité. */
  lastAppOpenAt?: string;
  /** Instant (ISO) du dernier coup de pouce dont l'heure est passée : plafond glissant. */
  lastNudgeAt?: string;
  /** Coups de pouce actuellement programmés (annulation + plafond + tracing). */
  nudgePlan?: ScheduledNudge[];
  /**
   * Événements de mesure dont l'envoi a échoué, rejoués au prochain passage au
   * premier plan. Persistés : une panne de serveur dure parfois des semaines, et
   * sans cette file les événements de cette période n'existent nulle part.
   */
  pendingEvents: EventRow[];
  /**
   * Dernier échec d'envoi. Sert à RENDRE LA PANNE VISIBLE : deux pannes de
   * mesure sont passées inaperçues faute de signal. Affiché dans le menu sur un
   * build de test.
   */
  lastTrackFailure?: { at: string; message: string };

  setLocale: (locale: { country?: string; currencyCode: CurrencyCode }) => void;
  convertLocale: (locale: {
    country?: string;
    currencyCode: CurrencyCode;
    rate: number;
  }) => void;
  setBudget: (budget: Budget) => void;
  addBalanceSnapshot: (snapshot: BalanceSnapshot) => void;
  setRebalanceReview: (review?: RebalanceReview) => void;
  addGoal: (goal: Goal) => void;
  updateGoal: (id: string, patch: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  logContribution: (
    goalId: string,
    type: ContributionType,
    amount: number,
    allocation?: ContributionAllocation,
    cycleId?: string
  ) => Contribution;
  setLastViewed: (goalId: string) => void;
  setNotifPermissionAsked: () => void;
  setUserName: (userName?: string) => void;
  recordAppOpen: () => void;
  setNudgePlan: (plan: ScheduledNudge[], lastNudgeAt?: string) => void;
  queueEvents: (rows: EventRow[], failure: string) => void;
  clearQueuedEvents: (sentCount: number) => void;
  recordTrackFailure: (message: string) => void;
}

/**
 * Plafond de la file d'attente. Au-delà on jette les PLUS ANCIENS : sur une
 * panne longue, les événements récents disent mieux l'usage actuel, et une file
 * sans borne finirait par peser sur le stockage local d'un téléphone.
 */
const MAX_PENDING_EVENTS = 300;

export const useStore = create<MMGState>()(
  persist(
    (set, get) => ({
      installId: makeInstallId(),
      currencyCode: DEFAULT_CURRENCY,
      goals: [],
      balanceSnapshots: [],
      notifPermissionAsked: false,
      pendingEvents: [],

      // Les anciens utilisateurs (store persisté sans ces champs) retombent sur
      // EUR par défaut via le merge de zustand/persist — aucune migration requise.
      setLocale: ({ country, currencyCode }) => set({ country, currencyCode }),

      convertLocale: ({ country, currencyCode, rate }) =>
        set((state) => {
          const converted = convertFinancialData(state, rate, currencyCode);
          return {
            country,
            currencyCode,
            ...converted,
          };
        }),

      setBudget: (budget) => set({ budget }),

      addBalanceSnapshot: (snapshot) =>
        set((state) => ({
          balanceSnapshots: [...(state.balanceSnapshots ?? []), snapshot],
        })),

      setRebalanceReview: (rebalanceReview) => set({ rebalanceReview }),

      addGoal: (goal) => set((s) => ({ goals: [...s.goals, goal], lastViewedGoalId: goal.id })),

      updateGoal: (id, patch) =>
        set((s) => ({
          goals: s.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)),
        })),

      deleteGoal: (id) =>
        set((s) => ({
          goals: s.goals.filter((g) => g.id !== id),
          lastViewedGoalId: s.lastViewedGoalId === id ? undefined : s.lastViewedGoalId,
        })),

      logContribution: (goalId, type, amount, allocation, cycleId) => {
        const contribution: Contribution = {
          id: `contrib-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          type,
          amount,
          date: new Date().toISOString(),
          allocation,
          cycleId,
        };
        set((s) => ({
          goals: s.goals.map((g) =>
            g.id === goalId ? { ...g, contributions: [...g.contributions, contribution] } : g
          ),
        }));
        return contribution;
      },

      setLastViewed: (goalId) => {
        if (get().lastViewedGoalId !== goalId) set({ lastViewedGoalId: goalId });
      },

      setNotifPermissionAsked: () => set({ notifPermissionAsked: true }),

      setUserName: (userName) => set({ userName: userName?.trim() || undefined }),

      recordAppOpen: () => set({ lastAppOpenAt: new Date().toISOString() }),

      setNudgePlan: (nudgePlan, lastNudgeAt) =>
        set((state) => ({
          nudgePlan,
          lastNudgeAt: lastNudgeAt ?? state.lastNudgeAt,
        })),

      queueEvents: (rows, failure) =>
        set((state) => ({
          pendingEvents: [...state.pendingEvents, ...rows].slice(-MAX_PENDING_EVENTS),
          lastTrackFailure: { at: new Date().toISOString(), message: failure },
        })),

      // On retire par le DÉBUT et seulement le nombre envoyé : un événement
      // tracé pendant le rejeu doit rester en file, pas disparaître avec le lot.
      clearQueuedEvents: (sentCount) =>
        set((state) => ({
          pendingEvents: state.pendingEvents.slice(sentCount),
          lastTrackFailure: undefined,
        })),

      recordTrackFailure: (message) =>
        set({ lastTrackFailure: { at: new Date().toISOString(), message } }),
    }),
    {
      name: 'mmg-store-v1',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export function newGoalId(): string {
  // Même format que l'ancienne app (cf. export events : goal-<timestamp>).
  return `goal-${Date.now()}`;
}
