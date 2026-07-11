import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';

import { hasPendingAction } from '@/lib/plan';
import { useStore } from '@/lib/store';

// Aiguillage d'ouverture : « qu'est-ce qui a besoin de moi maintenant ? »
// 1. Projet avec action en attente (échéance la plus urgente en premier).
// 2. Sinon, dernier projet consulté.
// 3. Sinon, premier projet existant, ou accueil.

export default function Index() {
  const [hydrated, setHydrated] = useState(useStore.persist.hasHydrated());
  const goals = useStore((s) => s.goals);
  const lastViewedGoalId = useStore((s) => s.lastViewedGoalId);

  useEffect(() => useStore.persist.onFinishHydration(() => setHydrated(true)), []);

  if (!hydrated) return null;

  const now = new Date();
  const pending = goals
    .filter((g) => hasPendingAction(g, now))
    .sort((a, b) => new Date(a.nextReminderAt).getTime() - new Date(b.nextReminderAt).getTime());

  const target = pending[0] ?? goals.find((g) => g.id === lastViewedGoalId) ?? goals[0];

  if (target) return <Redirect href={{ pathname: '/goal/[id]', params: { id: target.id } }} />;
  return <Redirect href="/home" />;
}
