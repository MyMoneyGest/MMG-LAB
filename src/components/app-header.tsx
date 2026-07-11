import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/theme';
import { scheduleTestReminder } from '@/lib/notifications';
import { remainingAmount, suggestedAmount } from '@/lib/plan';
import { useStore } from '@/lib/store';
import { MenuModal } from './menu-modal';

export function AppHeader({ showBack, currentGoalId }: { showBack?: boolean; currentGoalId?: string }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [testPending, setTestPending] = useState(false);
  const goals = useStore((s) => s.goals);
  const lastViewedGoalId = useStore((s) => s.lastViewedGoalId);

  const preferredGoal =
    goals.find((goal) => goal.id === currentGoalId) ??
    goals.find((goal) => goal.id === lastViewedGoalId);
  const testGoal =
    (preferredGoal && remainingAmount(preferredGoal) > 0 ? preferredGoal : undefined) ??
    goals.find((goal) => remainingAmount(goal) > 0) ??
    preferredGoal;

  const testNotification = async () => {
    if (testPending) return;
    if (!testGoal) {
      Alert.alert('Aucun projet à tester', 'Crée d’abord un projet, puis maintiens le M à nouveau.');
      return;
    }
    setTestPending(true);
    try {
      const result = await scheduleTestReminder(testGoal, suggestedAmount(testGoal));
      if (result.ok) {
        Alert.alert(
          'Rappel test programmé',
          `Il apparaîtra dans 15 secondes pour « ${testGoal.name} ». Déplie la notification pour voir les trois actions.`
        );
      } else if (result.reason === 'unsupported') {
        Alert.alert(
          'Test indisponible ici',
          'Utilise le dev build Android : les notifications ne sont pas disponibles sur le web ni dans Expo Go Android.'
        );
      } else if (result.reason === 'permission') {
        Alert.alert('Notifications désactivées', 'Autorise les notifications MMG dans les réglages du téléphone.');
      } else if (result.reason === 'completed') {
        Alert.alert('Projet déjà atteint', 'Choisis un projet qui a encore un montant à financer.');
      } else {
        Alert.alert('Test non programmé', 'Une erreur est survenue. Réessaie dans quelques instants.');
      }
    } finally {
      setTestPending(false);
    }
  };

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Programmer un rappel test"
        accessibilityHint="Maintenir appuyé pour recevoir un rappel dans 15 secondes"
        delayLongPress={700}
        disabled={testPending}
        onLongPress={testNotification}
        style={[styles.logo, testPending && styles.logoPending]}>
        <Text style={styles.logoLetter}>M</Text>
      </Pressable>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>MMG</Text>
        <Text style={styles.subtitle}>MyMoneyGest</Text>
      </View>
      {showBack ? (
        <Pressable
          style={styles.iconButton}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/home'))}>
          <Text style={styles.iconLabel}>‹</Text>
        </Pressable>
      ) : null}
      <Pressable style={styles.iconButton} onPress={() => setMenuOpen(true)}>
        <Text style={[styles.iconLabel, { letterSpacing: 1, fontSize: 20 }]}>⋯</Text>
      </Pressable>
      <MenuModal visible={menuOpen} onClose={() => setMenuOpen(false)} currentGoalId={currentGoalId} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
  logo: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLetter: { color: '#FFFFFF', fontSize: 26, fontWeight: '800' },
  logoPending: { opacity: 0.65 },
  title: { fontSize: 24, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginTop: -2 },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLabel: { fontSize: 26, fontWeight: '700', color: colors.text, marginTop: -2 },
});
