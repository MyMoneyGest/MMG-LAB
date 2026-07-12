import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { PendingReminderModal } from '@/components/pending-reminder-modal';
import type { PendingReminderChoice } from '@/components/pending-reminder-modal';
import { colors } from '@/constants/theme';
import { activateFollowingReminder, ignoreCurrentReminder } from '@/lib/actions';
import { track } from '@/lib/analytics';
import { mergePendingReminders } from '@/lib/notification-model';
import type { PendingReminder } from '@/lib/notification-model';
import {
  addReminderOpenListener,
  addReminderReceivedListener,
  takePresentedReminders,
} from '@/lib/notifications';
import { useStore } from '@/lib/store';

function waitForStoreHydration(): Promise<void> {
  if (useStore.persist.hasHydrated()) return Promise.resolve();
  return new Promise((resolve) => {
    const unsubscribe = useStore.persist.onFinishHydration(() => {
      unsubscribe();
      resolve();
    });
    if (useStore.persist.hasHydrated()) {
      unsubscribe();
      resolve();
    }
  });
}

export default function RootLayout() {
  const router = useRouter();
  const [pendingReminders, setPendingReminders] = useState<PendingReminder[]>([]);
  const enqueueReminders = useCallback((reminders: PendingReminder[]) => {
    setPendingReminders((current) => mergePendingReminders(current, reminders));
  }, []);

  // app_open : après hydratation du store pour tracer avec le bon install_id.
  useEffect(() => {
    if (useStore.persist.hasHydrated()) {
      track('app_open');
      return;
    }
    return useStore.persist.onFinishHydration(() => track('app_open'));
  }, []);

  // Boucle de rétention : notification → deep link vers le bon projet.
  useEffect(
    () =>
      addReminderOpenListener((reminder) => {
        const { notificationId, goalId, responseKey, action, isTest, reminderKind } = reminder;
        void (async () => {
          await waitForStoreHydration();
          if (reminderKind === 'following') await activateFollowingReminder(goalId);
          setPendingReminders((current) =>
            current.filter((reminder) => reminder.notificationId !== notificationId)
          );
          if (!isTest) {
            if (useStore.persist.hasHydrated()) {
              track('reminder_opened', { goalId, metadata: { goalId } });
            } else {
              const unsubscribe = useStore.persist.onFinishHydration(() => {
                unsubscribe();
                track('reminder_opened', { goalId, metadata: { goalId } });
              });
            }
          }
          router.push({
            pathname: '/goal/[id]',
            params: {
              id: goalId,
              from: isTest ? 'test-reminder' : 'reminder',
              ...(action === 'open'
                ? {}
                : {
                    notificationAction: action,
                    notificationIsTest: isTest ? '1' : '0',
                    responseKey,
                  }),
            },
          });
        })();
      }),
    [router]
  );

  // Ouverture normale de l'app : retire les rappels du tiroir Android et propose leurs actions.
  useEffect(() => {
    let active = true;

    const enqueueIfGoalExists = async (reminders: PendingReminder[]) => {
      if (!reminders.length) return;
      await waitForStoreHydration();
      if (!active) return;
      for (const reminder of reminders) {
        if (reminder.reminderKind === 'following') {
          await activateFollowingReminder(reminder.goalId);
        }
      }
      const goals = useStore.getState().goals;
      const followingGoalIds = new Set(
        reminders
          .filter((reminder) => reminder.reminderKind === 'following')
          .map((reminder) => reminder.goalId)
      );
      enqueueReminders(
        reminders.filter(
          (reminder) =>
            goals.some((goal) => goal.id === reminder.goalId) &&
            (reminder.reminderKind === 'following' || !followingGoalIds.has(reminder.goalId))
        )
      );
    };

    const inspectPresented = async () => {
      const reminders = await takePresentedReminders();
      await enqueueIfGoalExists(reminders);
    };

    void inspectPresented();
    const removeReceivedListener = addReminderReceivedListener((reminder) => {
      void enqueueIfGoalExists([reminder]);
    });
    const appStateSubscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void inspectPresented();
    });

    return () => {
      active = false;
      removeReceivedListener();
      appStateSubscription.remove();
    };
  }, [enqueueReminders]);

  const handlePendingChoice = (choice: PendingReminderChoice) => {
    const reminder = pendingReminders[0];
    if (!reminder) return;
    setPendingReminders((current) => current.slice(1));
    if (choice === 'ignore') return;
    if (choice === 'skip') {
      const goal = useStore.getState().goals.find((candidate) => candidate.id === reminder.goalId);
      if (goal) void ignoreCurrentReminder(goal);
      return;
    }
    router.push({
      pathname: '/goal/[id]',
      params: {
        id: reminder.goalId,
        from: reminder.isTest ? 'test-reminder' : 'reminder',
        notificationAction: choice,
        notificationIsTest: reminder.isTest ? '1' : '0',
        responseKey: `pending:${reminder.notificationId}:${choice}`,
      },
    });
  };

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      />
      <PendingReminderModal
        reminder={pendingReminders[0] ?? null}
        onChoice={handlePendingChoice}
      />
    </>
  );
}
