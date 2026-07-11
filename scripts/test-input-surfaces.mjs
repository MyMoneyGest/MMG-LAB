import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const read = (relativePath) => fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

const ui = read('src/components/ui.tsx');
const amountModal = read('src/components/amount-modal.tsx');
const reportModal = read('src/components/report-modal.tsx');
const newGoal = read('src/app/onboarding/new-goal.tsx');

assert.match(ui, /<KeyboardAvoidingView/);
assert.match(ui, /keyboardDismissMode=/);
assert.match(ui, /fieldWrapFocused/);
assert.match(ui, /Boolean\(error\) && styles\.fieldWrapError/);

for (const [name, source] of [
  ['amount-modal', amountModal],
  ['report-modal', reportModal],
]) {
  assert.match(source, /<KeyboardAvoidingView/, `${name} doit éviter le clavier`);
  assert.match(source, /<ScrollView/, `${name} doit rester défilable avec le clavier`);
  assert.match(
    source,
    /style={styles\.backdrop} onPress={onClose}/,
    `${name} doit rester fermable par appui sur l'arrière-plan`,
  );
}

for (const [name, source] of [
  ['new-goal', newGoal],
  ['report-modal', reportModal],
]) {
  assert.match(source, /setDateText\(formatDateInput\(t\)\)/, `${name} doit appliquer le masque date`);
  assert.match(source, /keyboardType="number-pad"/, `${name} doit afficher le clavier numérique`);
  assert.doesNotMatch(source, /keyboardType="numbers-and-punctuation"/);
}

console.log('Tests saisie : focus, erreurs, masque date, clavier et défilement protégés.');
