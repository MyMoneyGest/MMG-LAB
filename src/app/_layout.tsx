import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';

import { colors } from '@/constants/theme';
import { track } from '@/lib/analytics';
import { addReminderOpenListener } from '@/lib/notifications';
import { useStore } from '@/lib/store';

export default function RootLayout() {
  const router = useRouter();
  const handledResponse = useRef<string | null>(null);

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
      addReminderOpenListener((goalId, responseKey) => {
        if (handledResponse.current === responseKey) return;
        handledResponse.current = responseKey;
        track('reminder_opened', { goalId, metadata: { goalId } });
        router.push({ pathname: '/goal/[id]', params: { id: goalId, from: 'reminder' } });
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
