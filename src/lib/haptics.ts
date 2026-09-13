import * as Haptics from 'expo-haptics';

// Retour physique réservé aux moments qui comptent : un versement enregistré,
// un objectif atteint. Rien sur la navigation ordinaire — l'effet vient de la
// rareté, et une app qui vibre à chaque appui devient du bruit qu'on finit par
// désactiver. C'est la même logique que le reste du premium sobre : peu de
// signaux, mais au bon endroit.
//
// Jamais bloquant. Sur un appareil sans moteur haptique, sur le web sans
// autorisation de vibration, ou dans un onglet en arrière-plan, l'appel échoue
// — et un versement ne doit jamais échouer parce que le téléphone n'a pas
// vibré. D'où le `catch` vide, seul endroit du projet où il se justifie.

function fire(run: () => Promise<unknown>): void {
  try {
    void run().catch(() => {});
  } catch {
    // Certaines plateformes lèvent de façon synchrone plutôt que de rejeter.
  }
}

/** Versement enregistré : une pulsation de confirmation. */
export function hapticContributionLogged(): void {
  fire(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
}

/**
 * Objectif atteint : deux temps au lieu d'un. L'aboutissement d'un projet suivi
 * pendant des mois mérite d'être distingué du versement de routine, comme
 * l'écran le fait déjà visuellement avec la pastille « Objectif atteint ».
 */
export function hapticGoalReached(): void {
  fire(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await new Promise((resolve) => setTimeout(resolve, 140));
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  });
}
