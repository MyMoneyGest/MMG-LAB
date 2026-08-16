import { create } from 'zustand';

import type { FeedbackMessage } from '@/components/feedback-banner';

// Signal transitoire pour transmettre un message ponctuel (ex. « Projet
// supprimé ») à travers une navigation, sans passer par l'URL.
//
// Sur web, expo-router ne propage pas les paramètres de query « libres »
// (hors segments dynamiques de la route) lors d'un router.replace() sur une
// route STATIQUE — contrairement aux routes dynamiques (ex. /goal/[id]), où
// ce même pattern fonctionne. Un simple module-level variable ne suffit pas
// non plus : sur web, expo-router semble garder l'écran cible déjà instancié
// d'une navigation à l'autre, donc un effet au montage (ou même
// useFocusEffect) ne se redéclenche pas de façon fiable. Un store Zustand
// dédié, lui, notifie TOUT composant abonné de façon synchrone dès que la
// valeur change, indépendamment du cycle de montage/focus — c'est le seul
// mécanisme qui traverse cette navigation de façon fiable ici.
//
// Store séparé du store principal (pas persisté) : cette valeur n'a de sens
// que pendant la session en cours.

interface PendingFeedbackState {
  message: FeedbackMessage | null;
  set: (message: FeedbackMessage) => void;
  take: () => FeedbackMessage | null;
}

export const usePendingFeedbackStore = create<PendingFeedbackState>()((set, get) => ({
  message: null,
  set: (message) => set({ message }),
  take: () => {
    const message = get().message;
    if (message) set({ message: null });
    return message;
  },
}));

export function setPendingFeedback(message: FeedbackMessage): void {
  usePendingFeedbackStore.getState().set(message);
}
