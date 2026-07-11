import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { formatEuro } from './format';
import { Goal } from './types';

// Un rappel local par objectif actif, programmé à sa date d'échéance (9h),
// avec le montant conseillé dans le message. Le tap ouvre l'app en deep link
// sur le bon projet (data.goalId, géré dans app/_layout.tsx).
//
// Sur web, expo-notifications n'est pas disponible : tout est neutralisé
// (l'app web sert de démo, le rituel complet se teste sur mobile).

export const notificationsSupported = Platform.OS !== 'web';

if (notificationsSupported) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

const CHANNEL_ID = 'reminders';

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Rappels mensuels',
    importance: Notifications.AndroidImportance.HIGH,
  });
}

/**
 * Demande la permission de notification. À appeler uniquement à la création
 * du premier objectif — jamais à l'ouverture de l'app.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!notificationsSupported) return false;
  await ensureAndroidChannel();
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted;
}

export async function hasNotificationPermission(): Promise<boolean> {
  if (!notificationsSupported) return false;
  const current = await Notifications.getPermissionsAsync();
  return current.granted;
}

/**
 * (Re)programme le rappel d'un objectif à son échéance courante.
 * Retourne l'identifiant de notification, ou null si rien n'a été programmé.
 */
export async function scheduleGoalReminder(
  goal: Goal,
  suggestedAmount: number
): Promise<string | null> {
  if (!notificationsSupported) return null;
  try {
    await cancelGoalReminder(goal);
    const when = new Date(goal.nextReminderAt);
    if (when <= new Date() || suggestedAmount <= 0) return null;
    await ensureAndroidChannel();
    return await Notifications.scheduleNotificationAsync({
      content: {
        title: 'MMG — ton rituel du mois',
        body: `Mets ${formatEuro(suggestedAmount)} de côté pour « ${goal.name} ». Même moins, c'est déjà bien.`,
        data: { goalId: goal.id, url: `mmg://goal/${goal.id}` },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: when,
        channelId: CHANNEL_ID,
      },
    });
  } catch {
    return null;
  }
}

export async function cancelGoalReminder(goal: Goal): Promise<void> {
  if (!notificationsSupported || !goal.notificationId) return;
  await Notifications.cancelScheduledNotificationAsync(goal.notificationId).catch(() => {});
}
