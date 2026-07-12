import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const read = (relativePath) => fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

const ui = read('src/components/ui.tsx');
const amountModal = read('src/components/amount-modal.tsx');
const reportModal = read('src/components/report-modal.tsx');
const newGoal = read('src/app/onboarding/new-goal.tsx');
const goalScreen = read('src/app/goal/[id].tsx');
const recentContributionModal = read('src/components/recent-contribution-modal.tsx');
const contributionChoiceModal = read('src/components/contribution-choice-modal.tsx');
const reminderDayModal = read('src/components/reminder-day-modal.tsx');

assert.match(ui, /<KeyboardAvoidingView/);
assert.match(ui, /keyboardDismissMode=/);
assert.match(ui, /scrollResponderScrollNativeHandleToKeyboard/);
assert.match(ui, /KEYBOARD_FIELD_GAP = 64/);
assert.match(ui, /revealFocusedField\(event\.nativeEvent\.target\)/);
assert.match(ui, /fieldWrapFocused/);
assert.match(ui, /Boolean\(error\) && styles\.fieldWrapError/);
assert.match(ui, /export function DateField/);
assert.equal((ui.match(/styles\.dateSeparator}>\/<\/Text>/g) ?? []).length, 2);
assert.match(ui, /placeholder="JJ"/);
assert.match(ui, /placeholder="MM"/);
assert.match(ui, /placeholder="AAAA"/);

for (const [name, source] of [
  ['amount-modal', amountModal],
  ['report-modal', reportModal],
]) {
  assert.match(source, /<KeyboardAvoidingView/, `${name} doit éviter le clavier`);
  assert.match(source, /<KeyboardSafeScrollView/, `${name} doit rester défilable avec le clavier`);
  assert.match(
    source,
    /style={styles\.backdrop} onPress={onClose}/,
    `${name} doit rester fermable par appui sur l'arrière-plan`,
  );
}

assert.match(reportModal, /canPostponeReminderTo\(goal, date\)/);
assert.match(reportModal, /\.filter\(\(option\) => canPostponeReminderTo\(goal, option\.date\)\)/);
assert.match(reportModal, /postponeIsNearNextAnchor\(goal, selectedDate\)/);
assert.doesNotMatch(reportModal, /Alert\.alert/);
assert.match(reportModal, /Votre prochain rappel régulier reste prévu/);
assert.doesNotMatch(reportModal, /Garder le rappel du/);
assert.match(goalScreen, /Jour mensuel : le \{goal\.reminderDay\} · Modifier/);
assert.match(goalScreen, /setReminderDayOpen\(true\)/);
assert.doesNotMatch(goalScreen, /pathname: '\/onboarding\/new-goal'.*editId/);
assert.match(reminderDayModal, /Jour du mois \(1 à 28\)/);
assert.match(reminderDayModal, /day < 1 \|\| day > 28/);
assert.match(goalScreen, /recentDeposits\(currentGoal\)/);
assert.doesNotMatch(goalScreen, /Ignorer ce rappel/);
assert.match(goalScreen, /contributionPlan\(currentGoal\)/);
assert.match(contributionChoiceModal, /C’est un extra/);
assert.match(contributionChoiceModal, /C’est mon versement de/);
assert.match(contributionChoiceModal, /intent: ContributionIntent/);
assert.match(recentContributionModal, /contributions\.map/);
assert.match(recentContributionModal, /formatEuro\(contribution\.amount\)/);
assert.match(recentContributionModal, /formatDate\(contribution\.date\)/);

assert.match(newGoal, /<DateField/);
assert.match(reportModal, /<DateField/);
assert.doesNotMatch(newGoal, /placeholder="JJ\/MM\/AAAA"/);
assert.doesNotMatch(reportModal, /placeholder="JJ\/MM\/AAAA"/);

console.log('Tests saisie : focus, erreurs, masque date, clavier et défilement protégés.');
