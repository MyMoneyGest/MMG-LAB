import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { useStore } from './store';
import { supabase } from './supabase';

// Nomenclature reprise de l'ancienne table events et étendue à la boucle réelle :
// ouverture, projet, contribution, rappels, confirmation de solde et décision
// de réajustement. AUCUNE donnée liée au montant n'est transmise (ni exact, ni
// tranche) : seul le fait qu'un versement a eu lieu compte pour la rétention.

export type EventType =
  | 'app_open'
  | 'goal_created'
  | 'contribution_logged'
  | 'balance_confirmed'
  | 'rebalance_decided'
  | 'reminder_opened'
  | 'reminder_postponed'
  // Coup de pouce affiché (déclencheur A/B en metadata). JAMAIS un signal de
  // rétention/engagement : à exclure des mesures d'activité (cf. retention-queries.sql).
  | 'nudge_shown'
  | 'goal_deleted';

/**
 * Ligne prête à insérer. Mise en file quand l'envoi échoue, donc elle doit
 * rester sérialisable en JSON — pas de Date, pas de fonction.
 */
export interface EventRow {
  install_id: string;
  event_type: EventType;
  goal_id: string | null;
  metadata: Record<string, unknown> | null;
  platform: string;
  app_version: string | null;
}

function buildRow(
  eventType: EventType,
  params?: { goalId?: string; metadata?: Record<string, unknown> }
): EventRow {
  return {
    install_id: useStore.getState().installId,
    event_type: eventType,
    goal_id: params?.goalId ?? null,
    // `occurred_at` est l'heure RÉELLE de l'événement, côté appareil. La colonne
    // `created_at` de la table vaut `now()` à la réception : pour un événement
    // rejoué après une panne de plusieurs jours, elle daterait du rejeu et
    // fausserait toute lecture de rétention. On ne l'envoie pas explicitement —
    // l'insertion actuelle est la seule forme éprouvée (201), et on ne sait pas
    // si `anon` a le droit d'écrire cette colonne. En analyse, préférer
    // `metadata->>'occurred_at'` quand il est présent.
    metadata: { ...params?.metadata, occurred_at: new Date().toISOString() },
    platform: Platform.OS,
    app_version: Constants.expoConfig?.version ?? null,
  };
}

/** Envoie un lot. Retourne le message d'erreur, ou null si tout est passé. */
async function send(rows: EventRow[]): Promise<string | null> {
  if (!supabase) return 'Supabase non configuré';
  try {
    const { error } = await supabase.from('events').insert(rows);
    return error ? error.message : null;
  } catch (cause) {
    // Hôte injoignable (projet en pause, avion, DNS) : `insert` rejette au lieu
    // de renvoyer une erreur applicative.
    return cause instanceof Error ? cause.message : 'Envoi impossible';
  }
}

/**
 * Trace un événement. Jamais bloquant : un échec de mesure ne doit pas gêner
 * l'utilisateur. Mais il n'est plus silencieux non plus — l'événement part en
 * file d'attente locale et la panne est consignée dans le store.
 *
 * Deux pannes de mesure (août et septembre 2026) sont passées inaperçues
 * plusieurs semaines parce que l'échec n'était tracé que sous `__DEV__`, donc
 * jamais en production. Les événements émis pendant ces périodes n'existent
 * nulle part : ils n'étaient ni réessayés, ni conservés.
 */
export function track(
  eventType: EventType,
  params?: { goalId?: string; metadata?: Record<string, unknown> }
): void {
  const row = buildRow(eventType, params);
  void send([row]).then((error) => {
    if (!error) return;
    useStore.getState().queueEvents([row], error);
  });
}

/**
 * Rejoue les événements mis en file. Appelé à chaque passage au premier plan :
 * c'est le moment où le réseau est le plus souvent revenu.
 *
 * Tout part en une seule insertion — la table l'accepte comme tableau, et un
 * lot évite de marteler un serveur qui vient de se réveiller. En cas d'échec
 * la file est conservée telle quelle, donc rien n'est perdu ; en cas de succès
 * seules les lignes envoyées sont retirées, pour ne pas effacer un événement
 * arrivé entre-temps.
 */
export async function flushPendingEvents(): Promise<void> {
  const { pendingEvents } = useStore.getState();
  if (!pendingEvents.length) return;
  const batch = pendingEvents;
  const error = await send(batch);
  if (error) {
    useStore.getState().recordTrackFailure(error);
    return;
  }
  useStore.getState().clearQueuedEvents(batch.length);
}
