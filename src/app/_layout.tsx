import * as Notifications from 'expo-notifications';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';

import { colors } from '@/constants/theme';
import { track } from '@/lib/analytics';
// L'import installe aussi le notification handler au démarrage (hors web).
import { notificationsSupported } from '@/lib/notifications';
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
  useEffect(() => {
    if (!notificationsSupported) return;
    const openFromResponse = (response: Notifications.NotificationResponse) => {
      const goalId = response.notification.request.content.data?.goalId as string | undefined;
      const key = response.notification.request.identifier;
      if (!goalId || handledResponse.current === key) return;
      handledResponse.current = key;
      track('reminder_opened', { goalId, metadata: { goalId } });
      router.push({ pathname: '/goal/[id]', params: { id: goalId, from: 'reminder' } });
    };

    // Ouverture à froid depuis une notification.
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) openFromResponse(response);
    });
    const subscription = Notifications.addNotificationResponseReceivedListener(openFromResponse);
    return () => subscription.remove();
  }, [router]);

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
