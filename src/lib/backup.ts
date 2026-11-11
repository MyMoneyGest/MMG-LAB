// Sauvegarde et restauration des données, 100% pure (pas d'accès fichier ni de
// store) pour rester testable comme le reste de la logique.
//
// Pourquoi ce module existe : tout vit dans le stockage local du téléphone
// (`mmg-store-v1`). Désinstaller l'app, perdre ou changer d'appareil efface
// définitivement l'historique, et il n'existait aucun moyen de l'emporter. Pour
// une app d'épargne suivie sur deux ans, c'est un défaut de conception, pas une
// préférence — c'est le retour le plus sérieux de la revue du 01/11.
//
// Ce que ce fichier NE fait pas : aucun compte, aucun serveur, aucune donnée
// qui sort du téléphone sans un geste explicite. L'utilisateur produit un
// fichier, il en fait ce qu'il veut.

import type {
  BalanceSnapshot,
  Budget,
  Contribution,
  Goal,
  RebalanceReview,
  ReminderCycle,
} from './types';
import type { CurrencyCode } from './currency';

/** Marqueur de format. Sert à refuser poliment un fichier qui n'est pas une sauvegarde MMG. */
export const BACKUP_FORMAT = 'mmg-backup';

/**
 * Version du format. À incrémenter dès qu'un champ change de sens.
 * Une sauvegarde d'une version PLUS RÉCENTE est refusée plutôt que lue de
 * travers : mieux vaut dire « mets l'app à jour » que restaurer à moitié.
 */
export const BACKUP_VERSION = 1;

/**
 * Données emportées. Volontairement limité à ce qui appartient à l'utilisateur.
 *
 * Sont EXCLUS, et ce n'est pas un oubli :
 * - `installId` et `pendingEvents`, qui décrivent l'appareil et la file de
 *   mesure, pas l'épargne. Restaurer un `installId` dédoublerait un même
 *   appareil dans les statistiques de rétention.
 * - `nudgePlan`, `notifPermissionAsked` et les identifiants de notification,
 *   qui ne valent que sur le téléphone qui les a créés.
 */
export interface BackupData {
  country?: string;
  currencyCode: CurrencyCode;
  userName?: string;
  budget?: Budget;
  goals: Goal[];
  balanceSnapshots: BalanceSnapshot[];
  rebalanceReview?: RebalanceReview;
  lastViewedGoalId?: string;
}

export interface BackupFile {
  format: typeof BACKUP_FORMAT;
  version: number;
  exportedAt: string;
  appVersion: string | null;
  data: BackupData;
}

export type BackupParseResult =
  | { ok: true; backup: BackupFile }
  | { ok: false; reason: string };

const CURRENCY_CODES = ['EUR', 'XAF', 'XOF', 'USD'];

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Retire les identifiants natifs de notification : ils ne désignent rien sur un
 * autre téléphone, et `scheduleGoalReminders` les réattribue de toute façon à la
 * restauration. Les laisser ne ferait qu'alourdir le fichier et laisser croire
 * qu'un rappel est programmé alors qu'il ne l'est pas.
 */
function stripDeviceIds(goal: Goal): Goal {
  const cycles = goal.reminderCycles?.map((cycle: ReminderCycle) => {
    const {
      anchorNotificationId: _anchor,
      postponedNotificationId: _postponed,
      midCycleNotificationId: _mid,
      ...rest
    } = cycle;
    return rest;
  });
  const { notificationId: _n, followingNotificationId: _f, ...rest } = goal;
  return { ...rest, ...(cycles ? { reminderCycles: cycles } : {}) };
}

/** Construit le contenu du fichier de sauvegarde. */
export function buildBackup(
  data: BackupData,
  options: { exportedAt?: Date; appVersion?: string | null } = {}
): BackupFile {
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: (options.exportedAt ?? new Date()).toISOString(),
    appVersion: options.appVersion ?? null,
    data: {
      ...data,
      goals: data.goals.map(stripDeviceIds),
    },
  };
}

/** Nom de fichier daté, pour que plusieurs sauvegardes cohabitent sans s'écraser. */
export function backupFileName(exportedAt: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const y = exportedAt.getFullYear();
  const m = pad(exportedAt.getMonth() + 1);
  const d = pad(exportedAt.getDate());
  const h = pad(exportedAt.getHours());
  const min = pad(exportedAt.getMinutes());
  return `mmg-sauvegarde-${y}-${m}-${d}-${h}h${min}.json`;
}

function validateGoal(value: unknown, index: number): string | null {
  if (!isObject(value)) return `Le projet n°${index + 1} est illisible.`;
  if (!isNonEmptyString(value.id)) return `Le projet n°${index + 1} n'a pas d'identifiant.`;
  if (!isNonEmptyString(value.name)) return `Le projet n°${index + 1} n'a pas de nom.`;
  if (typeof value.targetAmount !== 'number' || !Number.isFinite(value.targetAmount)) {
    return `Le projet « ${value.name} » n'a pas de montant cible valide.`;
  }
  if (!isNonEmptyString(value.targetDate)) {
    return `Le projet « ${value.name} » n'a pas de date cible.`;
  }
  if (
    typeof value.reminderDay !== 'number' ||
    value.reminderDay < 1 ||
    value.reminderDay > 28
  ) {
    return `Le projet « ${value.name} » a un jour de rappel hors des 1 à 28.`;
  }
  if (!Array.isArray(value.contributions)) {
    return `Le projet « ${value.name} » n'a pas d'historique de versements.`;
  }
  for (const contribution of value.contributions as Contribution[]) {
    if (!isObject(contribution)) {
      return `Un versement du projet « ${value.name} » est illisible.`;
    }
    if (typeof contribution.amount !== 'number' || !Number.isFinite(contribution.amount)) {
      return `Un versement du projet « ${value.name} » n'a pas de montant valide.`;
    }
    if (!isNonEmptyString(contribution.date)) {
      return `Un versement du projet « ${value.name} » n'a pas de date.`;
    }
  }
  return null;
}

/**
 * Lit et valide un fichier de sauvegarde.
 *
 * La validation est volontairement bavarde : une restauration remplace TOUT, et
 * quelqu'un qui se trompe de fichier doit l'apprendre avant, pas après. On
 * préfère refuser un fichier douteux plutôt que d'écraser deux ans d'historique
 * avec des données à moitié lues.
 */
export function parseBackup(text: string): BackupParseResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, reason: "Ce fichier n'est pas lisible. Choisis un fichier .json exporté depuis MMG." };
  }
  if (!isObject(raw)) {
    return { ok: false, reason: "Ce fichier ne contient pas une sauvegarde MMG." };
  }
  if (raw.format !== BACKUP_FORMAT) {
    return { ok: false, reason: "Ce fichier ne vient pas de MMG." };
  }
  if (typeof raw.version !== 'number' || !Number.isInteger(raw.version) || raw.version < 1) {
    return { ok: false, reason: "La version de cette sauvegarde est illisible." };
  }
  if (raw.version > BACKUP_VERSION) {
    return {
      ok: false,
      reason: "Cette sauvegarde vient d'une version plus récente de MMG. Mets l'application à jour avant de la restaurer.",
    };
  }
  if (!isObject(raw.data)) {
    return { ok: false, reason: "Cette sauvegarde ne contient aucune donnée." };
  }

  const data = raw.data;
  if (typeof data.currencyCode !== 'string' || !CURRENCY_CODES.includes(data.currencyCode)) {
    return { ok: false, reason: "La devise de cette sauvegarde n'est pas reconnue." };
  }
  if (!Array.isArray(data.goals)) {
    return { ok: false, reason: "Cette sauvegarde ne contient pas de liste de projets." };
  }
  for (let i = 0; i < data.goals.length; i += 1) {
    const problem = validateGoal(data.goals[i], i);
    if (problem) return { ok: false, reason: problem };
  }
  if (data.balanceSnapshots !== undefined && !Array.isArray(data.balanceSnapshots)) {
    return { ok: false, reason: "L'historique des soldes de cette sauvegarde est illisible." };
  }

  return {
    ok: true,
    backup: {
      format: BACKUP_FORMAT,
      version: raw.version,
      exportedAt: typeof raw.exportedAt === 'string' ? raw.exportedAt : '',
      appVersion: typeof raw.appVersion === 'string' ? raw.appVersion : null,
      data: {
        country: typeof data.country === 'string' ? data.country : undefined,
        currencyCode: data.currencyCode as CurrencyCode,
        userName: typeof data.userName === 'string' ? data.userName : undefined,
        budget: isObject(data.budget) ? (data.budget as unknown as Budget) : undefined,
        goals: (data.goals as Goal[]).map(stripDeviceIds),
        balanceSnapshots: Array.isArray(data.balanceSnapshots)
          ? (data.balanceSnapshots as BalanceSnapshot[])
          : [],
        rebalanceReview: isObject(data.rebalanceReview)
          ? (data.rebalanceReview as unknown as RebalanceReview)
          : undefined,
        lastViewedGoalId:
          typeof data.lastViewedGoalId === 'string' ? data.lastViewedGoalId : undefined,
      },
    },
  };
}

/** Résumé affiché avant d'écraser les données, pour que le choix soit éclairé. */
export function describeBackup(backup: BackupFile): string {
  const count = backup.data.goals.length;
  const projets = count === 0 ? 'aucun projet' : count === 1 ? '1 projet' : `${count} projets`;
  const versements = backup.data.goals.reduce(
    (total, goal) => total + (goal.contributions?.length ?? 0),
    0
  );
  const gestes =
    versements === 0 ? 'aucun versement' : versements === 1 ? '1 versement' : `${versements} versements`;
  const date = backup.exportedAt ? new Date(backup.exportedAt) : null;
  const quand =
    date && !Number.isNaN(date.getTime())
      ? ` du ${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`
      : '';
  return `Sauvegarde${quand} : ${projets}, ${gestes}.`;
}
