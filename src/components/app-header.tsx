import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/theme';
import { scheduleTestReminder } from '@/lib/notifications';
import { remainingAmount, suggestedAmount } from '@/lib/plan';
import { useStore } from '@/lib/store';
import { AppDialog } from './app-dialog';
import type { AppDialogTone } from './app-dialog';
import { MenuModal } from './menu-modal';

export function AppHeader({
  showBack,
  currentGoalId,
  title = 'MMG',
  subtitle,
  showTestMark = !showBack,
}: {
  showBack?: boolean;
  currentGoalId?: string;
  title?: string;
  subtitle?: string;
  showTestMark?: boolean;
}) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [testPending, setTestPending] = useState(false);
  const [dialog, setDialog] = useState<{
    title: string;
    message: string;
    tone: AppDialogTone;
  } | null>(null);
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
      setDialog({
        title: 'Aucun projet à tester',
        message: 'Crée d’abord un projet, puis maintiens le M à nouveau.',
        tone: 'info',
      });
      return;
    }
    setTestPending(true);
    try {
      const result = await scheduleTestReminder(testGoal, suggestedAmount(testGoal));
      if (result.ok) {
        setDialog({
          title: 'Rappel test programmé',
          message: `Il apparaîtra dans 15 secondes pour « ${testGoal.name} ». Déplie la notification pour voir les trois actions.`,
          tone: 'success',
        });
      } else if (result.reason === 'unsupported') {
        setDialog({
          title: 'Test indisponible ici',
          message:
            'Utilise le dev build Android : les notifications ne sont pas disponibles sur le web ni dans Expo Go Android.',
          tone: 'info',
        });
      } else if (result.reason === 'permission') {
        setDialog({
          title: 'Notifications désactivées',
          message: 'Autorise les notifications MMG dans les réglages du téléphone.',
          tone: 'danger',
        });
      } else if (result.reason === 'completed') {
        setDialog({
          title: 'Projet déjà atteint',
          message: 'Choisis un projet qui a encore un montant à financer.',
          tone: 'info',
        });
      } else {
        setDialog({
          title: 'Test non programmé',
          message: 'Une erreur est survenue. Réessaie dans quelques instants.',
          tone: 'danger',
        });
      }
    } finally {
      setTestPending(false);
    }
  };

  return (
    <>
      <View style={styles.row}>
      {showBack ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Retour"
          style={styles.iconButton}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/home'))}>
          <Text style={styles.iconLabel}>‹</Text>
        </Pressable>
      ) : showTestMark ? (
        __DEV__ ? (
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
        ) : (
          // Production : le M reste un simple élément de marque. Le rappel de test
          // (appui long) est réservé aux builds de développement, car ses actions
          // Fait/Modifier/Reporter modifieraient le vrai plan de l'utilisateur.
          <View style={styles.logo}>
            <Text style={styles.logoLetter}>M</Text>
          </View>
        )
      ) : (
        <View style={styles.iconPlaceholder} />
      )}
      <View style={styles.heading}>
        <Text numberOfLines={1} style={styles.title}>{title}</Text>
        {subtitle ? <Text numberOfLines={1} style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Ouvrir le menu" style={styles.iconButton} onPress={() => setMenuOpen(true)}>
        <Text style={[styles.iconLabel, { letterSpacing: 1, fontSize: 20 }]}>⋯</Text>
      </Pressable>
        <MenuModal visible={menuOpen} onClose={() => setMenuOpen(false)} currentGoalId={currentGoalId} />
      </View>
      <AppDialog
        visible={dialog !== null}
        eyebrow="Rappel test"
        title={dialog?.title ?? ''}
        message={dialog?.message ?? ''}
        tone={dialog?.tone}
        onClose={() => setDialog(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 44,
    marginBottom: 18,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLetter: { color: '#FFFFFF', fontSize: 21, fontWeight: '800' },
  logoPending: { opacity: 0.65 },
  heading: { flex: 1 },
  title: { fontSize: 18, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginTop: 1 },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPlaceholder: { width: 40, height: 40 },
  iconLabel: { fontSize: 24, fontWeight: '700', color: colors.text, marginTop: -2 },
});
