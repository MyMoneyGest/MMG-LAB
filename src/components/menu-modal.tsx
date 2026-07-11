import { useRouter } from 'expo-router';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, radius } from '@/constants/theme';
import { removeGoal } from '@/lib/actions';
import { formatEuro } from '@/lib/format';
import { progressPct, remainingAmount } from '@/lib/plan';
import { useStore } from '@/lib/store';
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
  const goals = useStore((s) => s.goals);

  const go = (fn: () => void) => {
    onClose();
    // Laisse le modal se fermer avant de naviguer.
    setTimeout(fn, 50);
  };

  const confirmDelete = (goalId: string) => {
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return;
    Alert.alert('Supprimer ce projet ?', `« ${goal.name} » et son historique seront effacés de ce téléphone.`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: () =>
          go(async () => {
            await removeGoal(goal);
            router.replace('/');
          }),
      },
    ]);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.eyebrow}>Menu</Text>
            <Text style={styles.title}>Mes projets</Text>

            {goals.map((g) => {
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
                  {active ? <Text style={styles.goalAction}>Actif</Text> : null}
                  <Pressable onPress={() => confirmDelete(g.id)} hitSlop={8}>
                    <Text style={styles.goalAction}>Supprimer</Text>
                  </Pressable>
                </Pressable>
              );
            })}

            <View style={{ gap: 12, marginTop: goals.length ? 14 : 4 }}>
              <Button label="Nouveau projet" variant="dark" onPress={() => go(() => router.push('/onboarding/new-goal'))} />
              <Button label="Accueil" variant="secondary" onPress={() => go(() => router.push('/home'))} />
              {currentGoalId ? (
                <Button
                  label="Ajuster ce plan"
                  variant="dark"
                  onPress={() =>
                    go(() => router.push({ pathname: '/onboarding/new-goal', params: { editId: currentGoalId } }))
                  }
                />
              ) : null}
              <Button label="Voir un exemple" variant="dark" onPress={() => go(() => router.push('/example'))} />
              <Button label="Ajuster mon budget" variant="dark" onPress={() => go(() => router.push('/onboarding/budget'))} />
              <Button label="Confidentialité et CGU" variant="secondary" onPress={() => go(() => router.push('/legal'))} />
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(30, 22, 16, 0.45)',
    justifyContent: 'flex-start',
    padding: 16,
    paddingTop: 90,
  },
  sheet: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    padding: 22,
    maxHeight: '86%',
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.accent,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: { fontSize: 30, fontWeight: '800', color: colors.text, marginBottom: 16 },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
  },
  goalRowActive: { backgroundColor: colors.cardSoft, borderColor: colors.cardSoftBorder },
  goalName: { fontSize: 18, fontWeight: '700', color: colors.text },
  goalMeta: { fontSize: 14, color: colors.textSecondary, marginTop: 2 },
  goalAction: { fontSize: 16, fontWeight: '700', color: colors.accent },
});
