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

assert.match(analytics, /\| 'balance_confirmed'/);
assert.match(analytics, /\| 'rebalance_decided'/);
assert.match(analytics, /\.from\('events'\)\s*\.insert\(/s);
assert.doesNotMatch(analytics, /\.select\(/);
assert.doesNotMatch(supabase, /\.select\(/);

assert.match(
  actions,
  /metadata: \{ goalId: goal\.id, category: goal\.category, rhythm: goal\.rhythm \}/,
  'goal_created doit conserver le rythme choisi',
);
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

console.log('Tests analytics : rythme, solde, décisions et insert-only Supabase validés.');
