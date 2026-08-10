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

assert.match(analytics, /\| 'balance_confirmed'/);
assert.match(analytics, /\| 'rebalance_decided'/);
assert.match(analytics, /\.from\('events'\)\s*\.insert\(/s);
assert.doesNotMatch(analytics, /\.select\(/);
assert.doesNotMatch(supabase, /\.select\(/);

assert.match(
  actions,
  /rhythm: goal\.rhythm,[\s\S]*country: state\.country \?\? 'unknown',[\s\S]*currencyCode: state\.currencyCode/,
  'goal_created doit conserver rythme, pays et devise',
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
assert.match(legal, /le pays et la devise sélectionnés dans MMG/);
assert.match(retentionQueries, /Répartition des installations par pays choisi/);
assert.match(retentionQueries, /Même mesure, séparée par pays choisi/);
assert.match(retentionQueries, /group by c\.country/);

console.log('Tests analytics : rythme, solde, décisions et insert-only Supabase validés.');
