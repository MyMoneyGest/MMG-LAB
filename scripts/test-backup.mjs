import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const source = fs.readFileSync(path.join(process.cwd(), 'src/lib/backup.ts'), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const loaded = { exports: {} };
new Function('exports', 'module', 'require', compiled)(loaded.exports, loaded, () => ({}));

const {
  BACKUP_FORMAT,
  BACKUP_VERSION,
  buildBackup,
  backupFileName,
  parseBackup,
  describeBackup,
} = loaded.exports;

const goal = {
  id: 'goal-1',
  name: 'Voiture',
  category: 'car',
  targetAmount: 3500,
  alreadyAvailable: 0,
  targetDate: '2027-05-11T07:00:00.000Z',
  reminderDay: 11,
  rhythm: 'stable',
  nextReminderAt: '2026-12-11T08:00:00.000Z',
  createdAt: '2026-11-11T07:00:00.000Z',
  contributions: [
    { id: 'c1', type: 'deposit', amount: 583.34, date: '2026-11-11T07:30:00.000Z' },
  ],
  // Identifiants natifs : ils ne désignent rien sur un autre téléphone.
  notificationId: 'notif-abc',
  followingNotificationId: 'notif-def',
  reminderCycles: [
    {
      id: 'cycle-2026-11-11',
      anchorAt: '2026-11-11T08:00:00.000Z',
      settledAt: '2026-11-11T07:30:00.000Z',
      anchorNotificationId: 'notif-ghi',
      midCycleNotificationId: 'notif-jkl',
    },
  ],
};

const data = {
  country: 'FR',
  currencyCode: 'EUR',
  userName: 'Chris',
  goals: [goal],
  balanceSnapshots: [],
};

// --- Construction -----------------------------------------------------------
const exportedAt = new Date(2026, 10, 11, 9, 5);
const backup = buildBackup(data, { exportedAt, appVersion: '2.1.0' });
assert.equal(backup.format, BACKUP_FORMAT);
assert.equal(backup.version, BACKUP_VERSION);
assert.equal(backup.appVersion, '2.1.0');
assert.equal(backup.exportedAt, exportedAt.toISOString());

// Les identifiants de notification ne partent JAMAIS dans le fichier : ils ne
// valent que sur le téléphone qui les a créés, et les laisser ferait croire
// qu'un rappel est programmé alors qu'il ne l'est pas.
const exported = backup.data.goals[0];
assert.equal(exported.notificationId, undefined);
assert.equal(exported.followingNotificationId, undefined);
assert.equal(exported.reminderCycles[0].anchorNotificationId, undefined);
assert.equal(exported.reminderCycles[0].midCycleNotificationId, undefined);
// Mais tout le reste survit, y compris ce qui dit qu'un cycle est soldé.
assert.equal(exported.reminderCycles[0].settledAt, '2026-11-11T07:30:00.000Z');
assert.equal(exported.contributions.length, 1);
assert.equal(exported.name, 'Voiture');
// L'objet d'origine n'est pas modifié au passage.
assert.equal(goal.notificationId, 'notif-abc');

// --- Aller-retour complet ---------------------------------------------------
const roundTrip = parseBackup(JSON.stringify(backup));
assert.equal(roundTrip.ok, true);
assert.equal(roundTrip.backup.data.goals[0].name, 'Voiture');
assert.equal(roundTrip.backup.data.goals[0].contributions[0].amount, 583.34);
assert.equal(roundTrip.backup.data.userName, 'Chris');
assert.equal(roundTrip.backup.data.currencyCode, 'EUR');

// --- Nom de fichier ---------------------------------------------------------
// Daté à la minute : deux sauvegardes du même jour ne s'écrasent pas.
assert.equal(backupFileName(new Date(2026, 10, 11, 9, 5)), 'mmg-sauvegarde-2026-11-11-09h05.json');
assert.notEqual(
  backupFileName(new Date(2026, 10, 11, 9, 5)),
  backupFileName(new Date(2026, 10, 11, 9, 6))
);

// --- Refus ------------------------------------------------------------------
// Une restauration écrase TOUT : mieux vaut refuser un fichier douteux que
// d'écraser deux ans d'historique avec des données à moitié lues.
const refuse = (text, extrait) => {
  const result = parseBackup(text);
  assert.equal(result.ok, false, `aurait dû être refusé : ${text.slice(0, 60)}`);
  assert.match(result.reason, extrait);
};

refuse('pas du json', /n'est pas lisible/);
refuse('[]', /ne contient pas une sauvegarde/);
refuse('{"format":"autre-app","version":1,"data":{}}', /ne vient pas de MMG/);
refuse(`{"format":"${BACKUP_FORMAT}","version":0,"data":{}}`, /version .* illisible/);
// Une sauvegarde plus récente est refusée plutôt que lue de travers.
refuse(
  `{"format":"${BACKUP_FORMAT}","version":${BACKUP_VERSION + 1},"data":{"currencyCode":"EUR","goals":[]}}`,
  /version plus récente/
);
refuse(`{"format":"${BACKUP_FORMAT}","version":1}`, /aucune donnée/);
refuse(
  `{"format":"${BACKUP_FORMAT}","version":1,"data":{"currencyCode":"BTC","goals":[]}}`,
  /devise .* n'est pas reconnue/
);
refuse(
  `{"format":"${BACKUP_FORMAT}","version":1,"data":{"currencyCode":"EUR"}}`,
  /pas de liste de projets/
);

const withGoals = (goals) =>
  JSON.stringify({
    format: BACKUP_FORMAT,
    version: 1,
    data: { currencyCode: 'XAF', goals, balanceSnapshots: [] },
  });

refuse(withGoals([{ ...goal, name: '' }]), /n'a pas de nom/);
refuse(withGoals([{ ...goal, targetAmount: 'beaucoup' }]), /montant cible valide/);
refuse(withGoals([{ ...goal, targetAmount: Number.POSITIVE_INFINITY }]), /montant cible valide/);
refuse(withGoals([{ ...goal, reminderDay: 31 }]), /jour de rappel hors des 1 à 28/);
refuse(withGoals([{ ...goal, contributions: undefined }]), /historique de versements/);
refuse(
  withGoals([{ ...goal, contributions: [{ id: 'x', amount: 10 }] }]),
  /versement .* n'a pas de date/
);
// Le message nomme le projet fautif : avec plusieurs projets, « le n°2 » ne
// suffit pas à savoir lequel rouvrir.
const deux = parseBackup(withGoals([goal, { ...goal, id: 'goal-2', name: 'Vacances', reminderDay: 40 }]));
assert.equal(deux.ok, false);
assert.match(deux.reason, /Vacances/);

// Un fichier vide mais valide passe : quelqu'un qui n'a pas encore de projet
// doit pouvoir sauvegarder sa devise et son prénom.
const vide = parseBackup(withGoals([]));
assert.equal(vide.ok, true);
assert.equal(vide.backup.data.goals.length, 0);
assert.equal(vide.backup.data.currencyCode, 'XAF');

// --- Résumé affiché avant d'écraser ----------------------------------------
assert.match(describeBackup(backup), /11\/11\/2026/);
assert.match(describeBackup(backup), /1 projet, 1 versement/);
const troisProjets = buildBackup(
  { currencyCode: 'EUR', goals: [goal, { ...goal, id: 'g2' }, { ...goal, id: 'g3' }], balanceSnapshots: [] },
  { exportedAt }
);
assert.match(describeBackup(troisProjets), /3 projets, 3 versements/);
assert.match(describeBackup(buildBackup({ currencyCode: 'EUR', goals: [], balanceSnapshots: [] }, { exportedAt })), /aucun projet, aucun versement/);

console.log('Tests sauvegarde : format, aller-retour, nommage, refus et résumé validés.');
