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
      handleNotification: async (notification) => ({
        shouldShowBanner: true,
        shouldShowList: true,
        // Le test doit rester visible même si l'app est encore au premier plan.
        shouldPlaySound: notification.request.content.data?.isTest === true,
        shouldSetBadge: false,
      }),
    });
  }
  return cachedModule;
}

const CHANNEL_ID = 'reminders';
const TEST_CHANNEL_ID = 'reminder_tests';
const ACTION_CATEGORY_ID = 'mmg_reminder_actions';

const ACTION_DONE = 'done';
const ACTION_EDIT = 'edit';
const ACTION_POSTPONE = 'postpone';

export type ReminderNotificationAction = 'open' | 'done' | 'edit' | 'postpone';

export interface ReminderNotificationResponse {
  goalId: string;
  responseKey: string;
  action: ReminderNotificationAction;
  isTest: boolean;
}

export type TestReminderResult =
  | { ok: true }
  | { ok: false; reason: 'unsupported' | 'permission' | 'completed' | 'error' };

let lastTestNotificationId: string | null = null;
const deliveredResponseKeys = new Set<string>();

async function ensureAndroidChannel(N: NotificationsModule): Promise<void> {
  if (Platform.OS !== 'android') return;
  await N.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Rappels mensuels',
    importance: N.AndroidImportance.HIGH,
  });
}

async function ensureAndroidTestChannel(N: NotificationsModule): Promise<void> {
  if (Platform.OS !== 'android') return;
  await N.setNotificationChannelAsync(TEST_CHANNEL_ID, {
    name: 'Tests de rappels',
    importance: N.AndroidImportance.HIGH,
    sound: 'default',
  });
}

async function ensureReminderActions(N: NotificationsModule): Promise<void> {
  await N.setNotificationCategoryAsync(ACTION_CATEGORY_ID, [
    {
      identifier: ACTION_DONE,
      buttonTitle: 'Fait',
      options: {
        opensAppToForeground: true,
        isAuthenticationRequired: false,
        isDestructive: false,
      },
    },
    {
      identifier: ACTION_EDIT,
      buttonTitle: 'Modifier',
      options: {
        opensAppToForeground: true,
        isAuthenticationRequired: false,
        isDestructive: false,
      },
    },
    {
      identifier: ACTION_POSTPONE,
      buttonTitle: 'Reporter',
      options: {
        opensAppToForeground: true,
        isAuthenticationRequired: false,
        isDestructive: false,
      },
    },
  ]);
}

/**
 * Demande la permission de notification. À appeler à la création du premier
 * objectif ou après une action explicite de test — jamais à l'ouverture de l'app.
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
    await ensureReminderActions(N);
    return await N.scheduleNotificationAsync({
      content: {
        title: 'MMG — ton rituel du mois',
        body: `Mets ${formatEuro(suggestedAmount)} de côté pour « ${goal.name} ». Même moins, c'est déjà bien.`,
        data: { goalId: goal.id, url: `mmg://goal/${goal.id}` },
        categoryIdentifier: ACTION_CATEGORY_ID,
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

/**
 * Programme un rappel interactif 15 secondes après l'appui long sur le M.
 * Une seule notification de test reste programmée à la fois.
 */
export async function scheduleTestReminder(
  goal: Goal,
  suggestedAmount: number
): Promise<TestReminderResult> {
  const N = getNotifications();
  if (!N) return { ok: false, reason: 'unsupported' };
  if (suggestedAmount <= 0) return { ok: false, reason: 'completed' };

  try {
    if (!(await hasNotificationPermission()) && !(await requestNotificationPermission())) {
      return { ok: false, reason: 'permission' };
    }
    await ensureAndroidTestChannel(N);
    await ensureReminderActions(N);
    if (lastTestNotificationId) {
      await N.cancelScheduledNotificationAsync(lastTestNotificationId).catch(() => {});
    }
    lastTestNotificationId = await N.scheduleNotificationAsync({
      content: {
        title: 'MMG — rappel test',
        body: `Mets ${formatEuro(suggestedAmount)} de côté pour « ${goal.name} ». Même moins, c'est déjà bien.`,
        data: { goalId: goal.id, url: `mmg://goal/${goal.id}`, isTest: true },
        categoryIdentifier: ACTION_CATEGORY_ID,
        sound: 'default',
      },
      trigger: {
        type: N.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 15,
        channelId: TEST_CHANNEL_ID,
      },
    });
    return { ok: true };
  } catch {
    return { ok: false, reason: 'error' };
  }
}

export async function cancelGoalReminder(goal: Goal): Promise<void> {
  const N = getNotifications();
  if (!N || !goal.notificationId) return;
  await N.cancelScheduledNotificationAsync(goal.notificationId).catch(() => {});
}

/**
 * Boucle de rétention : décrit l'action choisie quand l'app est ouverte via une
 * notification (à chaud comme à froid). Les réponses sont dédupliquées et la
 * dernière réponse native est effacée après traitement pour éviter sa relecture.
 */
export function addReminderOpenListener(
  onOpen: (response: ReminderNotificationResponse) => void
): () => void {
  const N = getNotifications();
  if (!N) return () => {};

  const handle = (response: import('expo-notifications').NotificationResponse) => {
    const goalId = response.notification.request.content.data?.goalId as string | undefined;
    if (!goalId) return;
    const action: ReminderNotificationAction =
      response.actionIdentifier === ACTION_DONE
        ? 'done'
        : response.actionIdentifier === ACTION_EDIT
          ? 'edit'
          : response.actionIdentifier === ACTION_POSTPONE
            ? 'postpone'
            : 'open';
    const responseKey = `${response.notification.request.identifier}:${response.actionIdentifier}`;
    if (deliveredResponseKeys.has(responseKey)) return;
    deliveredResponseKeys.add(responseKey);
    onOpen({
      goalId,
      responseKey,
      action,
      isTest: response.notification.request.content.data?.isTest === true,
    });
    N.clearLastNotificationResponseAsync().catch(() => {});
  };

  // Ouverture à froid depuis une notification.
  N.getLastNotificationResponseAsync().then((response) => {
    if (response) handle(response);
  });
  const subscription = N.addNotificationResponseReceivedListener(handle);
  return () => subscription.remove();
}
