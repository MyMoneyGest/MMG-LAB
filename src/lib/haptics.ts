import * as Haptics from 'expo-haptics';

// LA RÈGLE (décidée le 12/11, chantier liv-haptique-etendu) :
//
//   Une vibration marque un changement de donnée du plan qui ne s'annule pas
//   d'un geste. Rien d'autre ne vibre.
//
// Elle se lit comme une décision, dans cet ordre :
//   1. Le geste change-t-il une donnée du plan ? Non → silence. Cela écarte
//      toute la navigation, l'ouverture d'une modale, le défilement, et toute
//      sélection intermédiaire qu'on peut encore changer d'avis.
//   2. S'annule-t-il d'un geste ? Oui → silence. Cela écarte les interrupteurs
//      (coup de pouce, masquage des montants) : on les rebascule aussitôt, et
//      une vibration par bascule serait du bruit.
//   3. Sinon, vibrer — à l'intensité du moment, parmi les quatre ci-dessous.
//
// Avant cette règle, la liste des endroits autorisés était gardée par un test
// énumérant des écrans interdits, qu'il fallait allonger à chaque nouvel écran.
// La règle se raisonne, une liste se recopie.
//
// L'effet vient de la rareté : dans une app qu'on ouvre une fois par mois,
// chacun de ces moments reste exceptionnel. C'est la même logique que le reste
// du premium sobre — peu de signaux, mais au bon endroit.
//
// ⚠️ Jamais deux vibrations pour un même geste. Quand un écran enchaîne deux
// actions instrumentées (ajuster un projet déclenche aussi un changement de
// jour de rappel), c'est l'écran qui vibre une fois, pas chaque action.
//
// ⚠️ Un RETRAIT ne vibre pas, et c'est délibéré. Une pulsation de succès y
// serait déplacée, un avertissement serait un reproche — or MMG promet « même
// moins que prévu, c'est déjà bien ». Le silence est la seule réponse juste.
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

/**
 * Réglage appliqué : un effleurement, pas une pulsation.
 *
 * Jour ou heure de rappel, solde réel confirmé, réajustement accepté, projet
 * ajusté, report d'échéance, changement de pays. Ces gestes engagent — ils ne
 * se défont pas d'un tap — mais ils ne valent pas un versement. `selectionAsync`
 * est le plus discret des trois retours : il dit « c'est pris en compte », pas
 * « bravo ».
 */
export function hapticSettingApplied(): void {
  fire(() => Haptics.selectionAsync());
}

/**
 * Geste destructeur : suppression d'un projet, restauration d'une sauvegarde
 * qui écrase tout.
 *
 * `Warning` et non `Success` : ces deux gestes effacent des mois d'historique,
 * et le corps doit le sentir différemment d'un réglage. Ce n'est pas un
 * reproche — l'utilisateur a confirmé dans un dialogue explicite — c'est la
 * marque physique d'un seuil franchi.
 */
export function hapticDestructive(): void {
  fire(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning));
}
