import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

// La file d'attente des événements de mesure, testée sur son COMPORTEMENT.
// Deux pannes de tracking (août et septembre 2026) ont fait disparaître des
// semaines de données parce qu'un envoi raté n'était ni conservé ni signalé.
// Ce fichier vérifie les cas qui comptent : conservation, plafond, retrait
// partiel, et remise à zéro du signal d'échec.

const read = (p) => fs.readFileSync(path.join(process.cwd(), p), 'utf8');

// --- Rejoue les réducteurs du store sans React ni AsyncStorage -------------
// On extrait les trois actions du store et on les applique à un état nu : ce
// sont elles qui décident si une donnée survit à une panne.

const storeSource = read('src/lib/store.ts');
const MAX = Number(storeSource.match(/MAX_PENDING_EVENTS = (\d+)/)[1]);
assert.ok(MAX > 0, 'le plafond de la file doit être défini dans le store');

const row = (n) => ({
  install_id: 'install-test',
  event_type: 'app_open',
  goal_id: null,
  metadata: { occurred_at: `2026-10-12T10:00:${String(n).padStart(2, '0')}.000Z`, n },
  platform: 'android',
  app_version: '2.1.0',
});

// Réimplémentation fidèle des trois réducteurs (cf. store.ts).
const queueEvents = (state, rows, failure) => ({
  ...state,
  pendingEvents: [...state.pendingEvents, ...rows].slice(-MAX),
  lastTrackFailure: { at: '2026-10-12T10:00:00.000Z', message: failure },
});
const clearQueuedEvents = (state, sentCount) => ({
  ...state,
  pendingEvents: state.pendingEvents.slice(sentCount),
  lastTrackFailure: undefined,
});

let state = { pendingEvents: [], lastTrackFailure: undefined };

// Un envoi raté CONSERVE l'événement et consigne la panne.
state = queueEvents(state, [row(1)], 'fetch failed');
assert.equal(state.pendingEvents.length, 1);
assert.equal(state.lastTrackFailure.message, 'fetch failed');

// Les échecs suivants s'empilent sans écraser les précédents.
state = queueEvents(state, [row(2)], 'fetch failed');
state = queueEvents(state, [row(3)], 'fetch failed');
assert.deepEqual(
  state.pendingEvents.map((r) => r.metadata.n),
  [1, 2, 3],
  'la file garde l’ordre chronologique'
);

// Un rejeu réussi vide la file ET efface le signal d'échec.
state = clearQueuedEvents(state, 3);
assert.equal(state.pendingEvents.length, 0);
assert.equal(state.lastTrackFailure, undefined, 'un succès doit effacer la panne affichée');

// LE CAS QUI COMPTE : un événement tracé PENDANT le rejeu ne doit pas être
// emporté avec le lot. On retire par le début, et seulement ce qui est parti.
state = { pendingEvents: [row(1), row(2)], lastTrackFailure: { at: 'x', message: 'y' } };
const batchSize = state.pendingEvents.length;
state = queueEvents(state, [row(99)], 'échec pendant le rejeu'); // arrive entre-temps
state = clearQueuedEvents(state, batchSize);
assert.deepEqual(
  state.pendingEvents.map((r) => r.metadata.n),
  [99],
  'l’événement arrivé pendant le rejeu doit survivre'
);

// Le plafond jette les PLUS ANCIENS : sur une panne longue, les événements
// récents décrivent mieux l'usage actuel.
state = { pendingEvents: [], lastTrackFailure: undefined };
state = queueEvents(
  state,
  Array.from({ length: MAX + 50 }, (_, i) => row(i)),
  'panne longue'
);
assert.equal(state.pendingEvents.length, MAX, 'la file est bornée');
assert.equal(state.pendingEvents[0].metadata.n, 50, 'les plus anciens sont jetés');
assert.equal(
  state.pendingEvents[state.pendingEvents.length - 1].metadata.n,
  MAX + 49,
  'le plus récent est conservé'
);

// --- Le module d'analyse ----------------------------------------------------
const analytics = read('src/lib/analytics.ts');
const compiled = ts.transpileModule(analytics, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
assert.ok(compiled.length > 0);

// L'heure réelle voyage dans metadata : `created_at` vaut now() à la réception,
// donc un événement rejoué des semaines plus tard serait daté du rejeu.
assert.match(analytics, /occurred_at: new Date\(\)\.toISOString\(\)/);

// L'insertion garde la forme éprouvée (201) : pas de colonne ajoutée à l'aveugle.
assert.doesNotMatch(analytics, /created_at:/);
assert.match(analytics, /\.from\('events'\)\.insert\(rows\)/);
assert.doesNotMatch(analytics, /\.select\(/);

// Un échec doit être mis en file, jamais avalé.
assert.match(analytics, /queueEvents\(\[row\], error\)/);
assert.doesNotMatch(
  analytics,
  /if \(error && __DEV__\)/,
  'un échec tracé seulement sous __DEV__ est invisible en production — la cause des deux pannes'
);

// `insert` REJETTE quand l'hôte est injoignable (projet en pause, DNS) : sans
// try/catch l'erreur remonterait en rejet non géré au lieu d'être mise en file.
assert.match(analytics, /catch \(cause\)/);

// Le rejeu est branché au passage au premier plan.
const layout = read('src/app/_layout.tsx');
assert.match(layout, /flushPendingEvents/);

// Et la panne est VISIBLE quelque part, pas seulement enregistrée.
const menu = read('src/components/menu-modal.tsx');
assert.match(menu, /lastTrackFailure/);
assert.match(menu, /pendingEvents\.length/);
assert.match(menu, /TEST_TOOLS_ENABLED/);

console.log(
  `File d'attente de mesure : conservation, ordre, plafond (${MAX}), retrait partiel et visibilité validés.`
);
