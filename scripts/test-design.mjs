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
const theme = read('src/constants/theme.ts');
const planSummary = read('src/components/plan-summary.tsx');

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
assert.match(ui, /numberOfLines=\{1\}/);
assert.match(ui, /adjustsFontSizeToFit/);
assert.match(ui, /minimumFontScale=\{0\.82\}/);
assert.match(ui, /minHeight: 44/);
assert.match(ui, /paddingVertical: 12/);
assert.match(ui, /label\?: string/);
assert.match(ui, /target <= 14/);
assert.match(ui, /target >= 86/);
assert.match(ui, /styles\.progressMarkerArrow/);
assert.match(theme, /card: 22/);
assert.match(theme, /button: 18/);
assert.match(theme, /screen: 16/);
assert.match(theme, /card: 18/);
assert.match(planSummary, /padding: 18/);

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
assert.match(newGoal, /Ton budget mensuel/);
assert.match(newGoal, />Revenus</);
assert.match(newGoal, />Charges fixes</);
assert.match(newGoal, />Dépenses</);
assert.match(newGoal, />Reste à vivre</);
assert.match(newGoal, /Capacité prudente :/);
assert.match(newGoal, /accessibilityLabel="Ajuster le budget"/);
assert.match(newGoal, /params: \{ returnToGoal: '1' \}/);
assert.match(budget, /returnToGoal === '1'/);

assert.match(goal, /<Screen footer=\{tabBar\}>/);
assert.match(goal, /schedule\.slice\(0, 2\)/);
assert.match(goal, /label=\{`Versement fait \(\$\{formatEuro\(suggested\)\}\)`\}/);
assert.match(goal, /loading=\{actionLoading\}/);
assert.match(goal, /accessibilityRole="tab"/);
assert.match(goal, /tabActive: \{ backgroundColor: colors\.accent/);
assert.match(goal, /<ProgressBar pct=\{pct\} label=\{`\$\{pct\} % atteint`\}/);
assert.match(goal, /styles\.progressFooter/);
assert.match(goal, /Cible \{formatDate\(goal\.targetDate\)\}/);
assert.match(goal, /Solde global pas encore confirmé/);
assert.match(goal, /accessibilityLabel="Expliquer le solde réel"/);
assert.match(goal, /À quoi sert le solde réel/);
assert.match(goal, /Rien n’est connecté à ta banque/);

assert.match(menu, /justifyContent: 'flex-end'/);
assert.match(menu, /styles\.grabber/);
assert.doesNotMatch(menu, /label="Accueil"/);
assert.doesNotMatch(menu, /variant="dark"/);
assert.match(menu, /const orderedGoals = activeGoal/);
assert.match(menu, /\[activeGoal, \.\.\.goals\.filter/);

assert.match(report, /loading=\{saving\}/);
assert.match(report, /label="Valider la date"/);
assert.match(report, /style=\{\{ flex: 1\.2 \}\}/);
assert.match(confirmation, /ZoomIn/);

console.log('Design mobile validé : accueil, parcours, projet, menu, chargements et animations.');
