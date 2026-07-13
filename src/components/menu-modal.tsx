import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius } from '@/constants/theme';
import { removeGoal } from '@/lib/actions';
import { formatEuro } from '@/lib/format';
import { progressPct, remainingAmount } from '@/lib/plan';
import { useStore } from '@/lib/store';
import { waitForMinimumLoading } from '@/lib/timing';
import type { Goal } from '@/lib/types';
import { AppDialog } from './app-dialog';
import { Button } from './ui';

// Switcher de projets + navigation générale, accessible depuis tous les écrans.

export function MenuModal({
  visible,
  onClose,
  currentGoalId,
}: {
  visible: boolean;
  onClose: () => void;
  currentGoalId?: string;
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [goalToDelete, setGoalToDelete] = useState<Goal | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const goals = useStore((s) => s.goals);
  const activeGoal = currentGoalId ? goals.find((goal) => goal.id === currentGoalId) : undefined;
  const orderedGoals = activeGoal
    ? [activeGoal, ...goals.filter((goal) => goal.id !== activeGoal.id)]
    : goals;

  const go = (fn: () => void) => {
    onClose();
    // Laisse le modal se fermer avant de naviguer.
    setTimeout(fn, 50);
  };

  const confirmDelete = (goalId: string) => {
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return;
    setDeleteError(null);
    setGoalToDelete(goal);
    onClose();
  };

  const deleteSelectedGoal = async () => {
    if (!goalToDelete || deletePending) return;
    const deletedGoal = goalToDelete;
    const remainingGoals = goals.filter((goal) => goal.id !== deletedGoal.id);
    const destination =
      remainingGoals.find((goal) => goal.id === currentGoalId) ?? remainingGoals[0];
    const loadingStartedAt = Date.now();
    setDeleteError(null);
    setDeletePending(true);
    try {
      await waitForMinimumLoading(loadingStartedAt);
      await removeGoal(deletedGoal);
      const feedbackId = String(Date.now());
      setGoalToDelete(null);
      onClose();
      if (destination) {
        router.replace({
          pathname: '/goal/[id]',
          params: {
            id: destination.id,
            feedback: 'deleted',
            feedbackId,
            feedbackName: deletedGoal.name,
          },
        });
      } else {
        router.replace({
          pathname: '/home',
          params: { feedback: 'deleted', feedbackId, feedbackName: deletedGoal.name },
        });
      }
    } catch {
      setDeleteError('La suppression n’a pas abouti. Réessaie dans quelques instants.');
    } finally {
      setDeletePending(false);
    }
  };

  const action = (label: string, onPress: () => void) => (
    <Pressable
      accessibilityRole="button"
      onPress={() => go(onPress)}
      style={({ pressed }) => [styles.actionItem, pressed && styles.actionItemPressed]}>
      <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85} style={styles.actionLabel}>
        {label}
      </Text>
      <Text style={styles.actionChevron}>›</Text>
    </Pressable>
  );

  return (
    <>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom + 8, 20) }]}
          onPress={() => {}}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            contentInsetAdjustmentBehavior="automatic"
            showsVerticalScrollIndicator={false}>
            <View style={styles.grabber} />
            <Text style={styles.title}>Mes projets</Text>

            {orderedGoals.map((g) => {
              const active = g.id === currentGoalId;
              return (
                <Pressable
                  key={g.id}
                  onPress={() => go(() => router.push({ pathname: '/goal/[id]', params: { id: g.id } }))}
                  style={[styles.goalRow, active && styles.goalRowActive]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.goalName}>{g.name}</Text>
                    <Text style={styles.goalMeta}>
                      {progressPct(g)} % atteint · {formatEuro(remainingAmount(g))} restants
                    </Text>
                  </View>
                  <View style={styles.goalActions}>
                    {active ? <Text style={styles.activeBadge}>Actif</Text> : null}
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Supprimer ${g.name}`}
                      onPress={(event) => {
                        event.stopPropagation();
                        confirmDelete(g.id);
                      }}
                      hitSlop={8}>
                      <Text style={styles.deleteAction}>Supprimer</Text>
                    </Pressable>
                  </View>
                </Pressable>
              );
            })}

            <View style={[styles.actions, { marginTop: goals.length ? 10 : 2 }]}>
              <Button label="Nouveau projet" onPress={() => go(() => router.push('/onboarding/new-goal'))} />
              <View style={styles.actionList}>
                {currentGoalId
                  ? action('Ajuster le plan', () =>
                      router.push({
                        pathname: '/adjust-goal',
                        params: { id: currentGoalId },
                      })
                    )
                  : null}
                {action(currentGoalId ? 'Budget' : 'Ajuster mon budget', () =>
                  router.push({
                    pathname: '/onboarding/budget',
                    params: { standalone: '1' },
                  })
                )}
                {action('Voir un exemple', () => router.push('/example'))}
                {action('Confidentialité · CGU', () => router.push('/legal'))}
              </View>
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
      </Modal>
      <AppDialog
        visible={goalToDelete !== null}
        eyebrow="Action sensible"
        title={deleteError ? 'Suppression interrompue' : 'Supprimer ce projet ?'}
        message={
          deleteError ??
          `« ${goalToDelete?.name ?? ''} » et tout son historique seront supprimés de ce téléphone. Cette action est définitive.`
        }
        tone="danger"
        cancelLabel="Annuler"
        confirmLabel={deleteError ? 'Réessayer' : 'Supprimer'}
        loading={deletePending}
        loadingLabel="Suppression…"
        onClose={() => {
          if (deletePending) return;
          setDeleteError(null);
          setGoalToDelete(null);
        }}
        onConfirm={() => void deleteSelectedGoal()}
      />
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(30, 22, 16, 0.45)',
    justifyContent: 'flex-end',
    paddingHorizontal: 12,
  },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
    paddingHorizontal: 16,
    paddingTop: 8,
    maxHeight: '88%',
  },
  scrollContent: { paddingBottom: 2 },
  grabber: {
    width: 42,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: 10,
  },
  title: { fontSize: 21, fontWeight: '800', color: colors.text, marginBottom: 10 },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 15,
    padding: 10,
    marginBottom: 6,
  },
  goalRowActive: { backgroundColor: colors.cardSoft, borderColor: colors.cardSoftBorder },
  goalName: { fontSize: 15, fontWeight: '700', color: colors.text },
  goalMeta: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  goalActions: { alignItems: 'flex-end', gap: 5 },
  activeBadge: {
    color: colors.accent,
    backgroundColor: colors.card,
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
    fontSize: 11,
    fontWeight: '800',
    overflow: 'hidden',
  },
  deleteAction: { fontSize: 12, fontWeight: '700', color: colors.accent },
  actions: { gap: 8 },
  actionList: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.field,
    overflow: 'hidden',
  },
  actionItem: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  actionItemPressed: { backgroundColor: colors.cardSoft },
  actionLabel: { flex: 1, fontSize: 14, fontWeight: '700', color: colors.text },
  actionChevron: { fontSize: 20, lineHeight: 22, fontWeight: '500', color: colors.textSecondary },
});
