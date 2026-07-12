import { useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';

import { colors, radius } from '@/constants/theme';
import { formatDate, formatEuro } from '@/lib/format';
import type { GlobalRebalanceProposal } from '@/lib/plan';
import { Button, KeyboardSafeScrollView } from './ui';

export function RebalanceModal({
  proposal,
  reason,
  onApply,
  onKeep,
}: {
  proposal: GlobalRebalanceProposal | null;
  reason: 'budget' | 'balance';
  onApply: () => Promise<void> | void;
  onKeep: () => void;
}) {
  const [saving, setSaving] = useState(false);
  useEffect(() => setSaving(false), [proposal]);
  if (!proposal) return null;
  const excessive = proposal.currentEffort > proposal.capacity;

  const apply = async () => {
    setSaving(true);
    try {
      await onApply();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onKeep}>
      <View style={styles.backdrop}>
        <View accessibilityViewIsModal style={styles.sheet}>
          <KeyboardSafeScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}>
            <Text style={styles.eyebrow}>Réajustement proposé</Text>
            <Text style={styles.title}>
              {proposal.possible
                ? excessive
                  ? 'Tes plans dépassent ta capacité actuelle'
                  : 'Ta situation permet un nouvel échéancier'
                : 'Aucun échéancier réaliste pour le moment'}
            </Text>
            <Text style={styles.body}>
              {reason === 'budget'
                ? 'Ton nouveau budget est enregistré.'
                : 'Ton solde réel est enregistré et les enveloppes sont recalées.'}{' '}
              Effort cumulé au mois le plus exigeant : {formatEuro(proposal.currentEffort)}.
              Capacité prudente globale : {formatEuro(proposal.capacity)}.
            </Text>
            {!proposal.possible ? (
              <View style={styles.warning}>
                <Text style={styles.warningText}>
                  MMG ne peut pas proposer d’épargner plus que ton reste disponible. Garde tes
                  plans pour l’instant, puis ajuste ton budget, tes objectifs ou leurs échéances.
                </Text>
              </View>
            ) : (
              <View style={styles.list}>
                {proposal.goals.map((goal) => (
                  <View key={goal.goalId} style={styles.row}>
                    <Text style={styles.goalName}>{goal.goalName}</Text>
                    <Text style={styles.change}>
                      Cible {formatDate(goal.currentTargetDate)} →{' '}
                      {formatDate(goal.proposedTargetDate)}
                    </Text>
                    <Text style={styles.monthly}>
                      Environ {formatEuro(goal.proposedMonthly)} au prochain rappel
                    </Text>
                  </View>
                ))}
              </View>
            )}
            <View style={styles.buttons}>
              <Button
                label="Garder mes plans"
                variant="secondary"
                onPress={onKeep}
                disabled={saving}
                style={{ flex: 1 }}
              />
              {proposal.possible ? (
                <Button
                  label={saving ? 'Application…' : 'Appliquer'}
                  onPress={() => void apply()}
                  disabled={saving}
                  style={{ flex: 1 }}
                />
              ) : null}
            </View>
          </KeyboardSafeScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'rgba(30, 22, 16, 0.45)',
  },
  sheet: { maxHeight: '84%', backgroundColor: colors.card, borderRadius: radius.card },
  content: { padding: 20, gap: 10 },
  eyebrow: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  title: { color: colors.text, fontSize: 23, fontWeight: '800' },
  body: { color: colors.textSecondary, fontSize: 14, lineHeight: 20 },
  warning: { backgroundColor: colors.banner, borderRadius: radius.field, padding: 12 },
  warningText: { color: colors.text, fontSize: 14, lineHeight: 20, fontWeight: '700' },
  list: { gap: 8 },
  row: { backgroundColor: colors.cardSoft, borderRadius: radius.field, padding: 12 },
  goalName: { color: colors.text, fontSize: 15, fontWeight: '800' },
  change: { color: colors.text, fontSize: 13, fontWeight: '700', marginTop: 4 },
  monthly: { color: colors.textSecondary, fontSize: 12, marginTop: 3 },
  buttons: { flexDirection: 'row', gap: 10, marginTop: 4 },
});
