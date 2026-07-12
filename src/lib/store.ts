import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  Budget,
  Contribution,
  ContributionAllocation,
  ContributionType,
  Goal,
} from './types';

// Le store est la seule source de vérité des données utilisateur, persistée
// en local (AsyncStorage). Supabase ne reçoit que des événements d'usage.

function makeInstallId(): string {
  return `install-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

interface MMGState {
  installId: string;
  budget?: Budget;
  goals: Goal[];
  lastViewedGoalId?: string;
  notifPermissionAsked: boolean;

  setBudget: (budget: Budget) => void;
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
}

export const useStore = create<MMGState>()(
  persist(
    (set, get) => ({
      installId: makeInstallId(),
      goals: [],
      notifPermissionAsked: false,

      setBudget: (budget) => set({ budget }),

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
