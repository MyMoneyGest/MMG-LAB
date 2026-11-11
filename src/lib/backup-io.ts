// Écriture, partage et lecture du fichier de sauvegarde. Tout ce qui touche au
// système de fichiers est ici ; la construction et la validation du contenu
// restent dans `backup.ts`, pur et testable.

import Constants from 'expo-constants';
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { backupFileName, buildBackup, parseBackup, type BackupFile } from './backup';
import { scheduleGoalReminders, scheduleNudges } from './notifications';
import { suggestedAmount } from './plan';
import { useStore } from './store';

export type ExportResult = { ok: true } | { ok: false; reason: string };
export type ReadResult =
  | { ok: true; backup: BackupFile }
  | { ok: false; reason: string }
  | { cancelled: true };

/**
 * Écrit la sauvegarde puis ouvre la feuille de partage du système.
 *
 * Le fichier est posé dans le cache : il n'a pas à survivre: ce qui compte est
 * la copie que l'utilisateur envoie où il veut (Fichiers, Drive, un mail à
 * lui-même). Garder un double dans l'app ne protégerait de rien, puisque la
 * désinstallation est précisément le cas qu'on veut couvrir.
 */
export async function exportBackup(): Promise<ExportResult> {
  try {
    if (!(await Sharing.isAvailableAsync())) {
      return { ok: false, reason: "Le partage de fichiers n'est pas disponible sur cet appareil." };
    }
    const state = useStore.getState();
    const exportedAt = new Date();
    const backup = buildBackup(
      {
        country: state.country,
        currencyCode: state.currencyCode,
        userName: state.userName,
        budget: state.budget,
        goals: state.goals,
        balanceSnapshots: state.balanceSnapshots ?? [],
        rebalanceReview: state.rebalanceReview,
        lastViewedGoalId: state.lastViewedGoalId,
      },
      { exportedAt, appVersion: Constants.expoConfig?.version ?? null }
    );

    const file = new File(Paths.cache, backupFileName(exportedAt));
    // Une sauvegarde précédente peut traîner dans le cache : `create` échoue si
    // le fichier existe, on repart donc d'une page blanche.
    if (file.exists) file.delete();
    file.create();
    file.write(JSON.stringify(backup, null, 2));

    await Sharing.shareAsync(file.uri, {
      mimeType: 'application/json',
      UTI: 'public.json',
      dialogTitle: 'Sauvegarder mes données MMG',
    });
    return { ok: true };
  } catch (cause) {
    return {
      ok: false,
      reason: cause instanceof Error ? cause.message : "La sauvegarde n'a pas pu être créée.",
    };
  }
}

/** Ouvre le sélecteur de fichiers et valide ce qui en revient, sans rien écrire. */
export async function pickBackup(): Promise<ReadResult> {
  try {
    const picked = await DocumentPicker.getDocumentAsync({
      type: ['application/json', 'text/plain', '*/*'],
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (picked.canceled || !picked.assets?.length) return { cancelled: true };
    const text = await new File(picked.assets[0].uri).text();
    return parseBackup(text);
  } catch (cause) {
    return {
      ok: false,
      reason: cause instanceof Error ? cause.message : "Ce fichier n'a pas pu être lu.",
    };
  }
}

/**
 * Applique une sauvegarde déjà validée, PUIS reprogramme tous les rappels.
 *
 * L'ordre compte : les identifiants de notification du fichier ne désignent
 * rien sur cet appareil. Sans cette reprogrammation, l'écran afficherait un
 * plan restauré dont aucun rappel ne partirait jamais. Même enchaînement que
 * `changeLocale`, pour la même raison.
 */
export async function restoreBackup(backup: BackupFile): Promise<void> {
  useStore.getState().restoreUserData(backup.data);
  for (const goal of useStore.getState().goals) {
    const scheduled = await scheduleGoalReminders(goal, suggestedAmount(goal));
    useStore.getState().updateGoal(goal.id, scheduled);
  }
  await scheduleNudges();
}
