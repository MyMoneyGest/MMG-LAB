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
