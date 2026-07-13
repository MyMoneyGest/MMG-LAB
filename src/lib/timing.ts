export const MIN_PRIMARY_LOADING_MS = 1_200;
export const MIN_INLINE_LOADING_MS = 900;

/**
 * Maintient un retour de chargement assez longtemps pour qu'il soit réellement perçu.
 * Le délai ne s'ajoute qu'à la partie manquante : une opération déjà longue n'est pas ralentie.
 */
export async function waitForMinimumLoading(
  startedAt: number,
  minimumDuration = MIN_PRIMARY_LOADING_MS
): Promise<void> {
  const remaining = minimumDuration - (Date.now() - startedAt);
  if (remaining <= 0) return;
  await new Promise<void>((resolve) => setTimeout(resolve, remaining));
}
