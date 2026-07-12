import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius } from '@/constants/theme';
import type { PendingReminder, ReminderNotificationAction } from '@/lib/notification-model';
import { suggestedAmount } from '@/lib/plan';
import { useStore } from '@/lib/store';
import { formatEuro } from '@/lib/format';
import { Button } from './ui';

export type PendingReminderChoice = Exclude<ReminderNotificationAction, 'open'> | 'ignore' | 'skip';

export function PendingReminderModal({
  reminder,
  onChoice,
}: {
  reminder: PendingReminder | null;
  onChoice: (choice: PendingReminderChoice) => void;
}) {
  const goal = useStore((state) =>
    reminder ? state.goals.find((candidate) => candidate.id === reminder.goalId) : undefined
  );

  if (!reminder || !goal) return null;
  const amount = suggestedAmount(goal);
  const canSkip =
    goal.canIgnoreCurrentReminder === true && new Date(goal.nextReminderAt) <= new Date();

  return (
    <Modal
      visible
      transparent
      statusBarTranslucent
      animationType="fade"
      onRequestClose={() => onChoice('ignore')}>
      <View style={styles.backdrop}>
        <View accessibilityViewIsModal style={styles.sheet}>
          <Text style={styles.eyebrow}>{reminder.isTest ? 'Rappel test' : 'Rappel en attente'}</Text>
          <Text style={styles.title}>{goal.name}</Text>
          <Text style={styles.body}>
            La notification a été retirée du téléphone. Que veux-tu faire pour ce projet ?
          </Text>

          <Button label={`Fait (${formatEuro(amount)})`} onPress={() => onChoice('done')} />
          <View style={styles.secondaryActions}>
            <Button
              label="Modifier"
              variant="secondary"
              onPress={() => onChoice('edit')}
              style={styles.secondaryButton}
            />
            <Button
              label="Reporter"
              variant="secondary"
              onPress={() => onChoice('postpone')}
              style={styles.secondaryButton}
            />
          </View>
          {canSkip ? (
            <Button
              label="Ignorer ce rappel"
              variant="secondary"
              onPress={() => onChoice('skip')}
            />
          ) : null}
          <Pressable
            accessibilityRole="button"
            onPress={() => onChoice('ignore')}
            style={({ pressed }) => [styles.ignore, pressed && styles.ignorePressed]}>
            <Text style={styles.ignoreLabel}>Fermer pour le moment</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(30, 22, 16, 0.45)',
  },
  sheet: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.card,
    borderRadius: radius.card,
    padding: 20,
    gap: 12,
  },
  eyebrow: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  title: { color: colors.text, fontSize: 24, fontWeight: '800' },
  body: { color: colors.textSecondary, fontSize: 15, lineHeight: 21, marginBottom: 2 },
  secondaryActions: { flexDirection: 'row', gap: 10 },
  secondaryButton: { flex: 1, paddingVertical: 14 },
  ignore: { alignItems: 'center', paddingVertical: 8 },
  ignorePressed: { opacity: 0.65 },
  ignoreLabel: { color: colors.textSecondary, fontSize: 14, fontWeight: '700' },
});
