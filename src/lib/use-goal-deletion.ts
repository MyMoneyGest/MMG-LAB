import { useRouter } from 'expo-router';
import { useState } from 'react';

import { removeGoal } from '@/lib/actions';
import { setPendingFeedback } from '@/lib/pending-feedback';
import { useStore } from '@/lib/store';
import { waitForMinimumLoading } from '@/lib/timing';
import type { Goal } from '@/lib/types';

// Suppression d'un projet, partagée par ses deux points d'entrée : la liste du
// menu et l'écran « Ajuster ». La logique vit ici pour n'exister qu'une fois —
// elle porte un ordre sensible aux courses de navigation (cf. ci-dessous) qu'on
// ne veut pas voir diverger entre deux copies.
//
// `navigate` diffère selon l'appelant : depuis un modal on remplace la route
// courante (router.replace), depuis un écran empilé on la dépile
// (router.dismissTo).

export function useGoalDeletion({
  navigate,
}: {
  navigate: 'replace' | 'dismissTo';
}) {
  const router = useRouter();
  const goals = useStore((state) => state.goals);
  const lastViewedGoalId = useStore((state) => state.lastViewedGoalId);
  const [goalToDelete, setGoalToDelete] = useState<Goal | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const askDelete = (goal: Goal) => {
    setDeleteError(null);
    setGoalToDelete(goal);
  };

  const closeDelete = () => {
    if (deletePending) return;
    setDeleteError(null);
    setGoalToDelete(null);
  };

  const confirmDelete = async () => {
    if (!goalToDelete || deletePending) return;
    const deleted = goalToDelete;
    const remaining = goals.filter((candidate) => candidate.id !== deleted.id);
    const destination =
      remaining.find((candidate) => candidate.id === lastViewedGoalId) ?? remaining[0];
    const feedbackId = String(Date.now());
    const loadingStartedAt = Date.now();
    setDeleteError(null);
    setDeletePending(true);
    try {
      await waitForMinimumLoading(loadingStartedAt);
      if (!destination) {
        // Signal transitoire posé AVANT removeGoal : sur web, la redirection
        // réactive d'index.tsx vers /onboarding/new-goal (dès que le store
        // passe à zéro projet) peut gagner la course sur notre propre
        // navigation ci-dessous (cf. pending-feedback.ts).
        setPendingFeedback({
          key: feedbackId,
          title: 'Projet supprimé',
          detail: `« ${deleted.name} » et son historique ont été supprimés.`,
        });
      }
      await removeGoal(deleted);
      setGoalToDelete(null);
      const go = navigate === 'replace' ? router.replace : router.dismissTo;
      if (destination) {
        go({
          pathname: '/goal/[id]',
          params: {
            id: destination.id,
            feedback: 'deleted',
            feedbackId,
            feedbackName: deleted.name,
          },
        });
      } else {
        go('/onboarding/new-goal');
      }
    } catch {
      setDeleteError('La suppression n’a pas abouti. Réessaie dans quelques instants.');
    } finally {
      setDeletePending(false);
    }
  };

  return { goalToDelete, deletePending, deleteError, askDelete, closeDelete, confirmDelete };
}
