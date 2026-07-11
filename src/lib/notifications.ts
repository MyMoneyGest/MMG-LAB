import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

import { formatEuro } from './format';
import { Goal } from './types';

// Un rappel local par objectif actif, programmé à sa date d'échéance (9h),
// avec le montant conseillé dans le message. Le tap ouvre l'app en deep link
// sur le bon projet (data.goalId, géré dans app/_layout.tsx).
//
// expo-notifications est chargé paresseusement : sur web il n'existe pas, et
// dans Expo Go Android le module jette une erreur dès l'import (retiré du
// client depuis le SDK 53). Dans ces deux environnements tout est neutralisé —
// le rituel complet se teste sur iPhone (Expo Go) et via le dev build Android.

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

export const notificationsSupported =
  Platform.OS !== 'web' && !(Platform.OS === 'android' && isExpoGo);

type NotificationsModule = typeof import('expo-notifications');

let cachedModule: NotificationsModule | null = null;

function getNotifications(): NotificationsModule | null {
  if (!notificationsSupported) return null;
  if (!cachedModule) {
    cachedModule = require('expo-notifications') as NotificationsModule;
    cachedModule.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
  }
  return cachedModule;
}

const CHANNEL_ID = 'reminders';

async function ensureAndroidChannel(N: NotificationsModule): Promise<void> {
  if (Platform.OS !== 'android') return;
  await N.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Rappels mensuels',
    importance: N.AndroidImportance.HIGH,
  });
}

/**
 * Demande la permission de notification. À appeler uniquement à la création
 * du premier objectif — jamais à l'ouverture de l'app.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  const N = getNotifications();
  if (!N) return false;
  await ensureAndroidChannel(N);
  const current = await N.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const asked = await N.requestPermissionsAsync();
  return asked.granted;
}

export async function hasNotificationPermission(): Promise<boolean> {
  const N = getNotifications();
  if (!N) return false;
  const current = await N.getPermissionsAsync();
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
  const N = getNotifications();
  if (!N) return null;
  try {
    await cancelGoalReminder(goal);
    const when = new Date(goal.nextReminderAt);
    if (when <= new Date() || suggestedAmount <= 0) return null;
    await ensureAndroidChannel(N);
    return await N.scheduleNotificationAsync({
      content: {
        title: 'MMG — ton rituel du mois',
        body: `Mets ${formatEuro(suggestedAmount)} de côté pour « ${goal.name} ». Même moins, c'est déjà bien.`,
        data: { goalId: goal.id, url: `mmg://goal/${goal.id}` },
      },
      trigger: {
        type: N.SchedulableTriggerInputTypes.DATE,
        date: when,
        channelId: CHANNEL_ID,
      },
    });
  } catch {
    return null;
  }
}

export async function cancelGoalReminder(goal: Goal): Promise<void> {
  const N = getNotifications();
  if (!N || !goal.notificationId) return;
  await N.cancelScheduledNotificationAsync(goal.notificationId).catch(() => {});
}

/**
 * Boucle de rétention : appelle `onOpen(goalId, responseKey)` quand l'app est
 * ouverte via une notification (à chaud comme à froid). Retourne la fonction
 * de désabonnement. `responseKey` sert à dédupliquer les ouvertures.
 */
export function addReminderOpenListener(
  onOpen: (goalId: string, responseKey: string) => void
): () => void {
  const N = getNotifications();
  if (!N) return () => {};

  const handle = (response: import('expo-notifications').NotificationResponse) => {
    const goalId = response.notification.request.content.data?.goalId as string | undefined;
    if (goalId) onOpen(goalId, response.notification.request.identifier);
  };

  // Ouverture à froid depuis une notification.
  N.getLastNotificationResponseAsync().then((response) => {
    if (response) handle(response);
  });
  const subscription = N.addNotificationResponseReceivedListener(handle);
  return () => subscription.remove();
}
