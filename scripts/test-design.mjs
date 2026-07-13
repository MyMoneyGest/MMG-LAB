import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const ui = read('src/components/ui.tsx');
const header = read('src/components/app-header.tsx');
const home = read('src/app/home.tsx');
const budget = read('src/app/onboarding/budget.tsx');
const newGoal = read('src/app/onboarding/new-goal.tsx');
const goal = read('src/app/goal/[id].tsx');
const menu = read('src/components/menu-modal.tsx');
const report = read('src/components/report-modal.tsx');
const confirmation = read('src/components/confirmation-overlay.tsx');

assert.match(home, /Un projet\./);
assert.match(home, /Un geste par mois\./);
assert.doesNotMatch(home, /CHECKLIST/);
assert.doesNotMatch(home, /<AppHeader/);

assert.match(ui, /footer\?: ReactNode/);
assert.match(ui, /styles\.screenFooter/);
assert.match(ui, /export function StepIndicator/);
assert.match(ui, /ActivityIndicator/);
assert.match(ui, /withTiming/);
assert.match(ui, /ReduceMotion\.System/);

assert.match(header, /delayLongPress=\{700\}/);
assert.match(header, /title\?: string/);
assert.match(header, /width: 40/);

assert.match(budget, /<StepIndicator current=\{1\}/);
assert.match(budget, /marge de sécurité de 20/);

assert.match(newGoal, /useState<2 \| 3>\(2\)/);
assert.match(newGoal, /<StepIndicator current=\{step\}/);
assert.match(newGoal, /\['emergency', 'car', 'moving', 'travel', 'other'\]/);
assert.match(newGoal, /CATEGORY_LABELS\[c\]/);
assert.match(newGoal, /Continuer vers le rythme/);
assert.match(newGoal, /loading=\{saving\}/);
assert.match(newGoal, /rhythmCardSelected: \{ backgroundColor: colors\.cardSoft/);

assert.match(goal, /<Screen footer=\{tabBar\}>/);
assert.match(goal, /schedule\.slice\(0, 2\)/);
assert.match(goal, /label=\{`Versement fait \(\$\{formatEuro\(suggested\)\}\)`\}/);
assert.match(goal, /loading=\{actionLoading\}/);
assert.match(goal, /accessibilityRole="tab"/);
assert.match(goal, /tabActive: \{ backgroundColor: colors\.accent/);

assert.match(menu, /justifyContent: 'flex-end'/);
assert.match(menu, /styles\.grabber/);
assert.doesNotMatch(menu, /label="Accueil"/);
assert.doesNotMatch(menu, /variant="dark"/);
assert.match(menu, /const orderedGoals = activeGoal/);
assert.match(menu, /\[activeGoal, \.\.\.goals\.filter/);

assert.match(report, /loading=\{saving\}/);
assert.match(confirmation, /ZoomIn/);

console.log('Design mobile validé : accueil, parcours, projet, menu, chargements et animations.');
