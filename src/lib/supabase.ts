import { createClient } from '@supabase/supabase-js';

// Supabase sert uniquement au tracking d'événements (table `events`) —
// aucune donnée utilisateur (budget, projets, versements) n'y est envoyée.

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const supabase =
  url && anonKey
    ? createClient(url, anonKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null;
