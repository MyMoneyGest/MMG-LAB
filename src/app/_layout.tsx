import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { PendingReminderModal } from '@/components/pending-reminder-modal';
import type { PendingReminderChoice } from '@/components/pending-reminder-modal';
import { colors } from '@/constants/theme';
import { track } from '@/lib/analytics';
import { mergePendingReminders } from '@/lib/notification-model';
import type { PendingReminder } from '@/lib/notification-model';
import {
  addReminderOpenListener,
  addReminderReceivedListener,
  openedByMidCycleNudge,
  scheduleNudges,
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
  const country = useStore((state) => state.country);
  const currencyCode = useStore((state) => state.currencyCode);
  const appOpenTracked = useRef(false);
  const [pendingReminders, setPendingReminders] = useState<PendingReminder[]>([]);
  const enqueueReminders = useCallback((reminders: PendingReminder[]) => {
    setPendingReminders((current) => mergePendingReminders(current, reminders));
  }, []);

  // app_open : une seule fois, après hydratation ET choix du pays. Un nouveau
  // lancement V2 n'est donc jamais classé « pays inconnu » avant confirmation.
  useEffect(() => {
    const send = async () => {
      if (appOpenTracked.current) return;
      const state = useStore.getState();
      if (!state.country) return;
      appOpenTracked.current = true;
      if (await openedByMidCycleNudge()) return;
      track('app_open', {
        metadata: { country: state.country, currencyCode: state.currencyCode },
      });
    };
    if (useStore.persist.hasHydrated()) void send();
    else return useStore.persist.onFinishHydration(() => void send());
  }, [country, currencyCode]);

  // Réarme le déclencheur d'inactivité et reprogramme tous les coups de pouce
  // (plafond partagé) à chaque passage au premier plan. Trace aussi, une fois,
  // ceux dont l'heure est passée depuis la dernière fois.
  useEffect(() => {
    const refresh = async () => {
      await waitForStoreHydration();
      useStore.getState().recordAppOpen();
      await scheduleNudges();
    };
    void refresh();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refresh();
    });
    return () => subscription.remove();
  }, []);

  // Boucle de rétention : notification → deep link vers le bon projet.
  useEffect(
    () =>
      addReminderOpenListener((reminder) => {
        const { notificationId, goalId, responseKey, action, isTest, reminderKind } = reminder;
        void (async () => {
          await waitForStoreHydration();
          const goal = useStore.getState().goals.find((candidate) => candidate.id === goalId);
          const cycle = reminder.cycleId
            ? goal?.reminderCycles?.find((candidate) => candidate.id === reminder.cycleId)
            : undefined;
          if (!goal || cycle?.settledAt) return;
          setPendingReminders((current) =>
            current.filter((reminder) => reminder.notificationId !== notificationId)
          );
          if (reminderKind === 'mid_cycle_nudge') {
            router.push({
              pathname: '/goal/[id]',
              params: { id: goalId, from: 'mid-cycle-nudge' },
            });
            return;
          }
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
      const goals = useStore.getState().goals;
      enqueueReminders(
        reminders.filter((reminder) => {
          const goal = goals.find((candidate) => candidate.id === reminder.goalId);
          if (!goal) return false;
          const cycle = reminder.cycleId
            ? goal.reminderCycles?.find((candidate) => candidate.id === reminder.cycleId)
            : undefined;
          return !cycle?.settledAt;
        })
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
