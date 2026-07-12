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

assert.match(ui, /<KeyboardAvoidingView/);
assert.match(ui, /keyboardDismissMode=/);
assert.match(ui, /scrollResponderScrollNativeHandleToKeyboard/);
assert.match(ui, /KEYBOARD_FIELD_GAP = 64/);
assert.match(ui, /revealFocusedField\(event\.nativeEvent\.target\)/);
assert.match(ui, /fieldWrapFocused/);
assert.match(ui, /Boolean\(error\) && styles\.fieldWrapError/);

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
assert.match(reportModal, /postponeNeedsRegularChoice\(goal, date\)/);
assert.match(reportModal, /Garder le rappel du/);
assert.match(goalScreen, /Jour mensuel : le \{goal\.reminderDay\} · Modifier/);
assert.match(goalScreen, /recentDeposits\(currentGoal\)/);
assert.match(goalScreen, /Ignorer ce rappel/);
assert.match(recentContributionModal, /contributions\.map/);
assert.match(recentContributionModal, /formatEuro\(contribution\.amount\)/);
assert.match(recentContributionModal, /formatDate\(contribution\.date\)/);

for (const [name, source] of [
  ['new-goal', newGoal],
  ['report-modal', reportModal],
]) {
  assert.match(source, /setDateText\(formatDateInput\(t\)\)/, `${name} doit appliquer le masque date`);
  assert.match(source, /keyboardType="number-pad"/, `${name} doit afficher le clavier numérique`);
  assert.doesNotMatch(source, /keyboardType="numbers-and-punctuation"/);
}

console.log('Tests saisie : focus, erreurs, masque date, clavier et défilement protégés.');
