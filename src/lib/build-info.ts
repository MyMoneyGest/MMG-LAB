import Constants from 'expo-constants';

import { TEST_TOOLS_ENABLED } from './test-tools';

// Identité du build, en un seul endroit.
//
// Deux pannes de mesure (août et septembre 2026) ont coûté un mois chacune, et
// les deux enquêtes ont buté sur la même question : « sur quelle version est la
// personne qui dit que ça ne marche pas ? » APK ou Play Store ? preview ou
// production ? Sans réponse, impossible de distinguer un bug d'une variable
// d'environnement absente. Ce module donne la réponse à l'écran (menu) et dans
// la mesure (métadonnée), à partir de la même valeur.
//
// Pas de dépendance ajoutée : expo-constants est déjà là. expo-application
// donnerait le numéro de build natif (le « (72) » de Paykko), mais il n'est pas
// installé et la chaîne Expo vient tout juste d'être remise d'aplomb — on ne la
// rouvre pas pour une ligne d'affichage.

/**
 * Canal de distribution, posé par `env` dans chaque profil de `eas.json`.
 * Absent quand l'app tourne depuis `expo start` : c'est alors du local.
 */
export type BuildChannel =
  | 'development'
  | 'preview'
  | 'preview-test'
  | 'production'
  | 'local';

const RAW_CHANNEL = process.env.EXPO_PUBLIC_MMG_CHANNEL;

const KNOWN: readonly BuildChannel[] = [
  'development',
  'preview',
  'preview-test',
  'production',
];

/**
 * Un canal inconnu ne doit PAS se faire passer pour `local` : ce serait un
 * nouveau profil de build qui se déguiserait en poste de développement.
 * On le laisse tel quel et c'est la lecture qui tranchera.
 */
export const BUILD_CHANNEL: string =
  RAW_CHANNEL && RAW_CHANNEL.length > 0 ? RAW_CHANNEL : 'local';

export const IS_KNOWN_CHANNEL = KNOWN.includes(BUILD_CHANNEL as BuildChannel);

export const APP_VERSION: string = Constants.expoConfig?.version ?? '?';

/**
 * Ce build fausse-t-il la mesure ?
 *
 * Volontairement calqué sur `TEST_TOOLS_ENABLED` et sur rien d'autre : un build
 * qui embarque les outils de test est par définition un build de test. Le canal
 * sert à affiner après coup, pas à décider ici.
 *
 * ⚠️ `preview` n'est PAS un build de test. L'APK `preview` est ce que reçoivent
 * les personnes au Gabon pour qui le Play Store est indisponible (VPN) —
 * décision de Patrick du 16/09 : elles comptent. Les écarter ici reviendrait à
 * supprimer silencieusement de vrais utilisateurs de la rétention.
 */
export const IS_TEST_BUILD = TEST_TOOLS_ENABLED;

/** Libellé compact pour le pied du menu : « 2.2.0 · production ». */
export const BUILD_LABEL = `${APP_VERSION} · ${BUILD_CHANNEL}`;
