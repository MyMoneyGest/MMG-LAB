import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

import { formatEuro } from './format';
import {
  currentUpcomingCycle,
  nextReminderFromCycles,
  normalizedReminderCycles,
  oldestUnsettledDebt,
  reminderAtForCycle,
  surplusForCycle,
} from './plan';
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
import { Goal, ReminderCycle } from './types';

// Des rappels datés par cycle, programmés à 9h : un éventuel report ponctuel
// et plusieurs ancres mensuelles indépendantes. Le tap ouvre l'app en deep link
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
  cycleId?: string;
}

export type TestReminderResult =
  | { ok: true }
  | { ok: false; reason: 'unsupported' | 'permission' | 'completed' | 'error' };

export interface ScheduledGoalReminders {
  reminderCycles: ReminderCycle[];
  nextReminderAt: string;
  notificationId: undefined;
  followingNotificationId: undefined;
  followingReminderAt: undefined;
  canIgnoreCurrentReminder: false;
  skippedRegularReminderAt: undefined;
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
  const now = new Date();
  const cleanCycles = normalizedReminderCycles(goal, now).map((cycle) => ({
    ...cycle,
    anchorNotificationId: undefined,
    postponedNotificationId: undefined,
  }));
  const result = (reminderCycles: ReminderCycle[]): ScheduledGoalReminders => ({
    reminderCycles,
    nextReminderAt: nextReminderFromCycles(reminderCycles).toISOString(),
    notificationId: undefined,
    followingNotificationId: undefined,
    followingReminderAt: undefined,
    canIgnoreCurrentReminder: false,
    skippedRegularReminderAt: undefined,
  });
  const N = getNotifications();
  if (!N) return result(cleanCycles);
  try {
    await cancelGoalReminder(goal);
    if (suggestedAmount <= 0) {
      return result(cleanCycles);
    }
    await ensureAndroidChannel(N);
    await ensureReminderActions(N);
    const scheduleCycle = async (cycle: ReminderCycle): Promise<ReminderCycle> => {
      if (cycle.settledAt) return cycle;
      const when = reminderAtForCycle(cycle);
      if (when <= now) return cycle;
      const isPostponed = Boolean(cycle.postponedTo);
      const surplus = isPostponed ? 0 : surplusForCycle(goal, cycle);
      const body =
        surplus > 0
          ? `Tu as déjà mis ${formatEuro(surplus)} ce mois-ci. Ton versement prévu (${formatEuro(suggestedAmount)}) — fait, ou tu ajustes ?`
          : `Mets ${formatEuro(suggestedAmount)} de côté pour « ${goal.name} ». Même moins, c'est déjà bien.`;
      const notificationId = await N.scheduleNotificationAsync({
        content: {
          title: 'MMG — ton rituel du mois',
          body,
          data: {
            goalId: goal.id,
            cycleId: cycle.id,
            url: `mmg://goal/${goal.id}`,
            reminderKind: isPostponed ? 'postponed' : 'anchor',
          },
          categoryIdentifier: ACTION_CATEGORY_ID,
        },
        trigger: {
          type: N.SchedulableTriggerInputTypes.DATE,
          date: when,
          channelId: CHANNEL_ID,
        },
      });
      return isPostponed
        ? { ...cycle, postponedNotificationId: notificationId }
        : { ...cycle, anchorNotificationId: notificationId };
    };
    const reminderCycles = await Promise.all(
      cleanCycles.map((cycle) => scheduleCycle(cycle).catch(() => cycle))
    );
    return result(reminderCycles);
  } catch {
    return result(cleanCycles);
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
    const cycle = oldestUnsettledDebt(goal) ?? currentUpcomingCycle(goal);
    const surplus = cycle ? surplusForCycle(goal, cycle) : 0;
    const body =
      surplus > 0
        ? `Tu as déjà mis ${formatEuro(surplus)} ce mois-ci. Ton versement prévu (${formatEuro(suggestedAmount)}) — fait, ou tu ajustes ?`
        : `Mets ${formatEuro(suggestedAmount)} de côté pour « ${goal.name} ». Même moins, c'est déjà bien.`;
    if (lastTestNotificationId) {
      await N.cancelScheduledNotificationAsync(lastTestNotificationId).catch(() => {});
    }
    lastTestNotificationId = await N.scheduleNotificationAsync({
      content: {
        title: 'MMG — rappel test',
        body,
        data: {
          goalId: goal.id,
          cycleId: cycle?.id,
          reminderKind: cycle?.postponedTo ? 'postponed' : 'anchor',
          url: `mmg://goal/${goal.id}`,
          isTest: true,
        },
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
  const ids = [
    goal.notificationId,
    goal.followingNotificationId,
    ...(goal.reminderCycles ?? []).flatMap((cycle) => [
      cycle.anchorNotificationId,
      cycle.postponedNotificationId,
    ]),
  ].filter(
    (id): id is string => Boolean(id)
  );
  await Promise.all(ids.map((id) => N.cancelScheduledNotificationAsync(id).catch(() => {})));
}

/** Retire uniquement une notification déjà affichée pour le cycle qui vient d'être soldé. */
export async function dismissPresentedCycle(goalId: string, cycleId: string): Promise<void> {
  const N = getNotifications();
  if (!N) return;
  const presented = await N.getPresentedNotificationsAsync().catch(() => []);
  const presentedIds = presented
    .filter(
      (notification) =>
        notification.request.content.data?.goalId === goalId &&
        notification.request.content.data?.cycleId === cycleId
    )
    .map((notification) => notification.request.identifier);
  await Promise.all(
    presentedIds.map((id) => N.dismissNotificationAsync(id).catch(() => {}))
  );
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
