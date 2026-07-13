import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const read = (relativePath) => fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

const ui = read('src/components/ui.tsx');
const amountModal = read('src/components/amount-modal.tsx');
const reportModal = read('src/components/report-modal.tsx');
const newGoal = read('src/app/onboarding/new-goal.tsx');
const adjustGoal = read('src/app/adjust-goal.tsx');
const goalScreen = read('src/app/goal/[id].tsx');
const recentContributionModal = read('src/components/recent-contribution-modal.tsx');
const contributionChoiceModal = read('src/components/contribution-choice-modal.tsx');
const reminderDayModal = read('src/components/reminder-day-modal.tsx');
const balanceModal = read('src/components/balance-modal.tsx');
const rebalanceModal = read('src/components/rebalance-modal.tsx');
const budgetScreen = read('src/app/onboarding/budget.tsx');

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
assert.match(reportModal, /loadingLabel="Programmation…"/);
assert.match(reportModal, /waitForMinimumLoading\(loadingStartedAt, MIN_INLINE_LOADING_MS\)/);
assert.doesNotMatch(reportModal, /Garder le rappel du/);
assert.match(goalScreen, /Jour de rappel : le \{goal\.reminderDay\} · Modifier/);
assert.match(goalScreen, /setReminderDayOpen\(true\)/);
assert.doesNotMatch(goalScreen, /pathname: '\/onboarding\/new-goal'.*editId/);
assert.match(reminderDayModal, /Jour du mois \(1 à 28\)/);
assert.match(reminderDayModal, /day < 1 \|\| day > 28/);
assert.match(reminderDayModal, /loadingLabel="Mise à jour…"/);
assert.match(goalScreen, /Mettre à jour le solde réel/);
assert.match(goalScreen, /Ton échéancier mérite une vérification/);
assert.match(goalScreen, /label="Dans 14 jours"/);
assert.match(goalScreen, /rebalanceReviewDue\(rebalanceReview\)/);
assert.doesNotMatch(goalScreen, /label="Retrait"/);
assert.match(balanceModal, /Solde réel global/);
assert.match(balanceModal, /Estimation actuelle/);
assert.match(balanceModal, /loadingLabel="Recalcul…"/);
assert.match(rebalanceModal, /Garder mes plans/);
assert.match(rebalanceModal, /Appliquer/);
assert.match(rebalanceModal, /conserver ton ancien échéancier/);
assert.match(rebalanceModal, /loadingLabel="Application…"/);
assert.match(budgetScreen, /buildGlobalRebalanceProposal\(goals, draft\)/);
assert.match(budgetScreen, /<RebalanceModal/);
assert.match(budgetScreen, /deferGlobalRebalance\('budget'\)/);
assert.match(budgetScreen, /pas aux entrées d'un compte bancaire particulier/);
assert.match(newGoal, /Effort total avec tes autres projets/);
assert.match(newGoal, /L'effort cumulé de tes projets dépasse ton reste disponible/);
assert.match(adjustGoal, /<DateField/);
assert.match(adjustGoal, /label="Jour de rappel \(1 à 28\)"/);
assert.match(adjustGoal, /savedTotal\(goal\)/);
assert.match(adjustGoal, /parsedTarget < saved/);
assert.match(adjustGoal, /scheduleGoalReminders\(updated, suggestedAmount\(updated\)\)/);
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
