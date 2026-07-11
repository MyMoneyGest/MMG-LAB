import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { colors } from '@/constants/theme';
import { track } from '@/lib/analytics';
import { addReminderOpenListener } from '@/lib/notifications';
import { useStore } from '@/lib/store';

export default function RootLayout() {
  const router = useRouter();

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
      addReminderOpenListener(({ goalId, responseKey, action, isTest }) => {
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
      }),
    [router]
  );

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      />
    </>
  );
}
