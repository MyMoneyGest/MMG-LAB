import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

import { formatEuro } from './format';
import {
  createReminderInbox,
  REMINDER_ACTION_IDENTIFIERS,
  reminderActionFromIdentifier,
} from './notification-model';
import type {
  PendingReminder,
  ReminderKind,
  ReminderNotificationAction,
} from './notification-model';
import { Goal } from './types';

// Un rappel local par objectif actif, ou deux pendant un report conservant
// l'occurrence mensuelle suivante, programmés à 9h,
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
const TEST_CHANNEL_ID = 'reminder_tests_v2';
const ACTION_CATEGORY_ID = 'mmg_reminder_actions';

export interface ReminderNotificationResponse {
  notificationId: string;
  goalId: string;
  responseKey: string;
  action: ReminderNotificationAction;
  isTest: boolean;
  reminderKind: ReminderKind;
}

export type TestReminderResult =
  | { ok: true }
  | { ok: false; reason: 'unsupported' | 'permission' | 'completed' | 'error' };

export interface ScheduledGoalReminders {
  notificationId: string | undefined;
  followingNotificationId: string | undefined;
}

let lastTestNotificationId: string | null = null;
const deliveredResponseKeys = new Set<string>();
const reminderInbox = createReminderInbox();

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
  });
}

async function ensureReminderActions(N: NotificationsModule): Promise<void> {
  await N.setNotificationCategoryAsync(ACTION_CATEGORY_ID, [
    {
      identifier: REMINDER_ACTION_IDENTIFIERS.done,
      buttonTitle: 'Fait',
      options: {
        opensAppToForeground: true,
        isAuthenticationRequired: false,
        isDestructive: false,
      },
    },
    {
      identifier: REMINDER_ACTION_IDENTIFIERS.edit,
      buttonTitle: 'Modifier',
      options: {
        opensAppToForeground: true,
        isAuthenticationRequired: false,
        isDestructive: false,
      },
    },
    {
      identifier: REMINDER_ACTION_IDENTIFIERS.postpone,
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
 * (Re)programme l'échéance courante et, si nécessaire, le rappel mensuel conservé.
 * Retourne leurs identifiants natifs éventuels.
 */
export async function scheduleGoalReminders(
  goal: Goal,
  suggestedAmount: number
): Promise<ScheduledGoalReminders> {
  const N = getNotifications();
  if (!N) return { notificationId: undefined, followingNotificationId: undefined };
  try {
    await cancelGoalReminder(goal);
    if (suggestedAmount <= 0) {
      return { notificationId: undefined, followingNotificationId: undefined };
    }
    await ensureAndroidChannel(N);
    await ensureReminderActions(N);
    const now = new Date();
    const scheduleAt = async (when: Date, reminderKind: 'primary' | 'following') => {
      if (when <= now) return undefined;
      return N.scheduleNotificationAsync({
        content: {
          title: 'MMG — ton rituel du mois',
          body: `Mets ${formatEuro(suggestedAmount)} de côté pour « ${goal.name} ». Même moins, c'est déjà bien.`,
          data: { goalId: goal.id, url: `mmg://goal/${goal.id}`, reminderKind },
          categoryIdentifier: ACTION_CATEGORY_ID,
        },
        trigger: {
          type: N.SchedulableTriggerInputTypes.DATE,
          date: when,
          channelId: CHANNEL_ID,
        },
      });
    };
    const notificationId = await scheduleAt(new Date(goal.nextReminderAt), 'primary').catch(
      () => undefined
    );
    const followingNotificationId = goal.followingReminderAt
      ? await scheduleAt(new Date(goal.followingReminderAt), 'following').catch(() => undefined)
      : undefined;
    return { notificationId, followingNotificationId };
  } catch {
    return { notificationId: undefined, followingNotificationId: undefined };
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

/** Retire du tiroir système les rappels MMG déjà présentés et les retourne à l'interface. */
export async function takePresentedReminders(): Promise<PendingReminder[]> {
  const N = getNotifications();
  if (!N) return [];
  try {
    const notifications = await N.getPresentedNotificationsAsync();
    const reminders = await Promise.all(
      [...notifications]
        .sort((a, b) => a.date - b.date)
        .map((notification) =>
          reminderInbox.consume(notification, (notificationId) =>
            N.dismissNotificationAsync(notificationId).catch(() => {})
          )
        )
    );
    return reminders.filter((reminder): reminder is PendingReminder => reminder !== null);
  } catch {
    return [];
  }
}

/** Capte aussi un rappel reçu pendant que l'application reste au premier plan. */
export function addReminderReceivedListener(
  onReceived: (reminder: PendingReminder) => void
): () => void {
  const N = getNotifications();
  if (!N) return () => {};
  const subscription = N.addNotificationReceivedListener((notification) => {
    void reminderInbox
      .consume(notification, (notificationId) =>
        N.dismissNotificationAsync(notificationId).catch(() => {})
      )
      .then((reminder) => {
        if (reminder) onReceived(reminder);
      });
  });
  return () => subscription.remove();
}

export async function cancelGoalReminder(goal: Goal): Promise<void> {
  const N = getNotifications();
  if (!N) return;
  const ids = [goal.notificationId, goal.followingNotificationId].filter(
    (id): id is string => Boolean(id)
  );
  await Promise.all(ids.map((id) => N.cancelScheduledNotificationAsync(id).catch(() => {})));
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

  const handle = async (response: import('expo-notifications').NotificationResponse) => {
    const responseKey = `${response.notification.request.identifier}:${response.actionIdentifier}`;
    if (deliveredResponseKeys.has(responseKey)) return;
    deliveredResponseKeys.add(responseKey);
    const pending = await reminderInbox.dismissResponse(response.notification, (notificationId) =>
      N.dismissNotificationAsync(notificationId).catch(() => {})
    );
    if (!pending) return;
    const action = reminderActionFromIdentifier(response.actionIdentifier);
    onOpen({
      ...pending,
      responseKey,
      action,
    });
    await N.clearLastNotificationResponseAsync().catch(() => {});
  };

  // Ouverture à froid depuis une notification.
  N.getLastNotificationResponseAsync().then((response) => {
    if (response) void handle(response);
  });
  const subscription = N.addNotificationResponseReceivedListener(handle);
  return () => subscription.remove();
}
