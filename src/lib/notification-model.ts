export const REMINDER_ACTION_IDENTIFIERS = {
  done: 'done',
  edit: 'edit',
  postpone: 'postpone',
} as const;

export type ReminderNotificationAction = 'open' | 'done' | 'edit' | 'postpone';
export type ReminderKind = 'anchor' | 'postponed';

export interface ReminderNotificationLike {
  request: {
    identifier: string;
    content: {
      data?: Record<string, unknown>;
    };
  };
}

export interface PendingReminder {
  notificationId: string;
  goalId: string;
  isTest: boolean;
  reminderKind: ReminderKind;
  cycleId?: string;
}

export function reminderActionFromIdentifier(identifier: string): ReminderNotificationAction {
  if (identifier === REMINDER_ACTION_IDENTIFIERS.done) return 'done';
  if (identifier === REMINDER_ACTION_IDENTIFIERS.edit) return 'edit';
  if (identifier === REMINDER_ACTION_IDENTIFIERS.postpone) return 'postpone';
  return 'open';
}

export function pendingReminderFromNotification(
  notification: ReminderNotificationLike
): PendingReminder | null {
  const goalId = notification.request.content.data?.goalId;
  if (typeof goalId !== 'string' || !goalId) return null;
  return {
    notificationId: notification.request.identifier,
    goalId,
    isTest: notification.request.content.data?.isTest === true,
    reminderKind:
      notification.request.content.data?.reminderKind === 'postponed' ? 'postponed' : 'anchor',
    cycleId:
      typeof notification.request.content.data?.cycleId === 'string'
        ? notification.request.content.data.cycleId
        : undefined,
  };
}

export function mergePendingReminders(
  current: PendingReminder[],
  incoming: PendingReminder[]
): PendingReminder[] {
  const known = new Set(current.map((reminder) => reminder.notificationId));
  return [
    ...current,
    ...incoming.filter((reminder) => {
      if (known.has(reminder.notificationId)) return false;
      known.add(reminder.notificationId);
      return true;
    }),
  ];
}

export function createReminderInbox() {
  const consumedNotificationIds = new Set<string>();

  return {
    async consume(
      notification: ReminderNotificationLike,
      dismiss: (notificationId: string) => Promise<void>
    ): Promise<PendingReminder | null> {
      const pending = pendingReminderFromNotification(notification);
      if (!pending || consumedNotificationIds.has(pending.notificationId)) return null;
      consumedNotificationIds.add(pending.notificationId);
      await dismiss(pending.notificationId);
      return pending;
    },

    async dismissResponse(
      notification: ReminderNotificationLike,
      dismiss: (notificationId: string) => Promise<void>
    ): Promise<PendingReminder | null> {
      const pending = pendingReminderFromNotification(notification);
      if (!pending) return null;
      consumedNotificationIds.add(pending.notificationId);
      await dismiss(pending.notificationId);
      return pending;
    },
  };
}
