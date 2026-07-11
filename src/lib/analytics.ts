import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { useStore } from './store';
import { supabase } from './supabase';

// Nomenclature reprise de l'ancienne table events : app_open, goal_created,
// contribution_logged (+ reminder_opened / reminder_postponed / goal_deleted
// pour mesurer la boucle de rétention). Les montants ne partent jamais en
// clair : uniquement des buckets (cf. plan.bucketAmount).

export type EventType =
  | 'app_open'
  | 'goal_created'
  | 'contribution_logged'
  | 'reminder_opened'
  | 'reminder_postponed'
  | 'goal_deleted';

export function track(
  eventType: EventType,
  params?: { goalId?: string; metadata?: Record<string, unknown> }
): void {
  if (!supabase) return; // .env absent : l'app fonctionne, sans tracking
  const installId = useStore.getState().installId;
  supabase
    .from('events')
    .insert({
      install_id: installId,
      event_type: eventType,
      goal_id: params?.goalId ?? null,
      metadata: params?.metadata ?? null,
      platform: Platform.OS,
      app_version: Constants.expoConfig?.version ?? null,
    })
    .then(({ error }) => {
      if (error && __DEV__) console.warn('[analytics]', eventType, error.message);
    });
}
