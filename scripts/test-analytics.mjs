import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const read = (relativePath) => fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

const analytics = read('src/lib/analytics.ts');
const actions = read('src/lib/actions.ts');
const goalScreen = read('src/app/goal/[id].tsx');
const budgetScreen = read('src/app/onboarding/budget.tsx');
const legal = read('src/app/legal.tsx');
const supabase = read('src/lib/supabase.ts');
const layout = read('src/app/_layout.tsx');
const retentionQueries = read('scripts/retention-queries.sql');
const notifications = read('src/lib/notifications.ts');

assert.match(analytics, /\| 'balance_confirmed'/);
assert.match(analytics, /\| 'rebalance_decided'/);
assert.match(analytics, /\.from\('events'\)\s*\.insert\(/s);
assert.doesNotMatch(analytics, /\.select\(/);
assert.doesNotMatch(supabase, /\.select\(/);

assert.match(
  actions,
  /rhythm: goal\.rhythm,[\s\S]*savingsMode: goal\.savingsMode \?\? 'guided',[\s\S]*activationDelayDays: goalActivationDelayDays\(goal\),[\s\S]*country: state\.country \?\? 'unknown',[\s\S]*currencyCode: state\.currencyCode/,
  'goal_created doit conserver rythme, mode, délai d’activation, pays et devise',
);
assert.match(layout, /const appOpenTracked = useRef\(false\)/);
assert.match(layout, /if \(!state\.country\) return/);
assert.match(layout, /track\('app_open', \{\s*metadata: \{ country: state\.country, currencyCode: state\.currencyCode \}/s);
assert.match(layout, /appOpenTracked\.current = true/);
assert.match(actions, /state\.addBalanceSnapshot\(snapshot\);\s*track\('balance_confirmed'\);/s);
assert.match(actions, /track\('rebalance_decided', \{ metadata: \{ choice \} \}\)/);
assert.match(
  actions,
  /track\('rebalance_decided', \{ metadata: \{ choice: 'applied' \} \}\)/,
);
assert.match(
  actions,
  /track\('balance_confirmed'\);/,
  'balance_confirmed doit rester sans métadonnée financière',
);

// Identité du build dans chaque ligne (chantiers `liv-version-visible` et
// `dette-flag-test`). Les deux pannes de mesure ont commencé par la même
// question sans réponse : sur quelle version est la personne qui signale ?
const buildInfo = read('src/lib/build-info.ts');
const menu = read('src/components/menu-modal.tsx');
const easJson = read('eas.json');
assert.match(analytics, /build: BUILD_CHANNEL/);
assert.match(analytics, /IS_TEST_BUILD \? \{ test_build: true \} : null/);
// ⚠️ L'invariant qui protège de vrais utilisateurs : `preview` est l'APK reçu
// par les personnes au Gabon, que le VPN prive du Play Store. Décision de
// Patrick du 16/09 : elles comptent. Si le drapeau de test se mettait à couvrir
// `preview`, elles disparaîtraient de la rétention sans un mot. Le drapeau est
// donc calqué sur TEST_TOOLS_ENABLED et sur rien d'autre.
assert.match(buildInfo, /export const IS_TEST_BUILD = TEST_TOOLS_ENABLED;/);
assert.doesNotMatch(buildInfo, /IS_TEST_BUILD[\s\S]{0,120}'preview'/);
// Chaque profil de build déclare son canal, sinon la métadonnée vaut « local »
// sur un vrai build et ne dit plus rien.
for (const channel of ['development', 'preview', 'preview-test', 'production']) {
  assert.match(
    easJson,
    new RegExp(`"EXPO_PUBLIC_MMG_CHANNEL": "${channel}"`),
    `le profil ${channel} doit déclarer son canal`,
  );
}
// Visible par tout le monde, pas seulement sur un build de test : c'est la
// personne qui dit « ça ne marche pas » qui doit pouvoir le lire, et elle n'a
// jamais un build de test.
assert.match(menu, /<Text selectable style=\{styles\.buildInfo\}>/);
assert.doesNotMatch(menu, /TEST_TOOLS_ENABLED && .{0,40}BUILD_LABEL/);
// Ce qui part de l'appareil doit rester énuméré sur l'écran Confidentialité.
assert.match(legal, /canal de distribution/);

assert.match(budgetScreen, /deferGlobalRebalance\('budget'\)/);
assert.match(goalScreen, /deferGlobalRebalance\(rebalanceReview\.reason, 'deferred'\)/);
assert.match(goalScreen, /rebalanceReason === 'review' \? 'deferred' : 'kept'/);
assert.match(legal, /Le solde réel n'est jamais\s+transmis/s);
assert.match(legal, /le pays et la devise\s+sélectionnés dans MMG/);
assert.match(legal, /le mode guidé ou libre choisis/);
assert.match(legal, /nombre de jours avant le démarrage/);
assert.match(legal, /jamais sa date exacte/);
assert.match(retentionQueries, /Répartition des installations par pays choisi/);
assert.match(retentionQueries, /Même mesure, séparée par pays choisi/);
assert.match(retentionQueries, /group by c\.country/);
assert.match(retentionQueries, /activationDelayDays/);
assert.match(retentionQueries, /make_interval/);
assert.match(layout, /if \(await openedByMidCycleNudge\(\)\) return/);
assert.match(
  layout,
  /if \(reminderKind === 'mid_cycle_nudge'\)[\s\S]*?from: 'mid-cycle-nudge'[\s\S]*?return;/,
);
const nudgeAction = actions.match(
  /export async function changeMidCycleNudge[\s\S]*?\n}\n\nexport async function removeGoal/,
)?.[0];
assert.ok(nudgeAction, 'l’action du coup de pouce doit exister');
assert.doesNotMatch(nudgeAction, /track\(/);
// notifications.ts ne trace QUE l'affichage d'un coup de pouce, et jamais un signal
// de rétention (app_open / reminder_opened restent dans _layout).
assert.match(notifications, /track\('nudge_shown'/);
assert.doesNotMatch(notifications, /track\('reminder_opened'|track\('app_open'/);

console.log('Tests analytics : rythme, solde, décisions et insert-only Supabase validés.');
