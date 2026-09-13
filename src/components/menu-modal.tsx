import { useGlobalSearchParams, usePathname, useRouter } from 'expo-router';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius } from '@/constants/theme';
import { progressPct, remainingAmount } from '@/lib/plan';
import { useStore } from '@/lib/store';
import { useGoalDeletion } from '@/lib/use-goal-deletion';
import { useMoney } from '@/lib/use-money';
import { AppDialog } from './app-dialog';
import { Button } from './ui';

// Switcher de projets + navigation générale, accessible depuis tous les écrans.
// Chaque ligne porte un « Supprimer » discret : c'est d'ici qu'on gère ses
// projets, y compris pour en retirer un. La confirmation passe par un dialogue
// (action définitive), et l'écran « Ajuster » propose la même action.
//
// Choisir l'écran où l'on se trouve déjà ferme simplement le menu. Sans ça
// chaque sélection empilait une copie de l'écran courant, et il fallait ensuite
// autant de retours qu'on avait tapé pour ressortir.

/**
 * Identifie l'écran affiché, pour reconnaître celui qu'on occupe déjà.
 * `pathname` ne suffit pas partout : l'écran pays sert à la fois d'accueil et
 * de réglage, et seul le paramètre `settings` les distingue.
 */
function screenKey(pathname: string, params: { settings?: string }): string {
  if (pathname === '/onboarding/country') {
    return params.settings === '1' ? 'country-settings' : 'country-welcome';
  }
  return pathname;
}

export function MenuModal({
  visible,
  onClose,
  currentGoalId,
}: {
  visible: boolean;
  onClose: () => void;
  currentGoalId?: string;
}) {
  const { money } = useMoney();
  const router = useRouter();
  const pathname = usePathname();
  // `useGlobalSearchParams` et non `useLocalSearchParams` : ce dernier renvoyait
  // `settings: undefined` sur /onboarding/country?settings=1, et l'écran de
  // réglage passait alors pour l'écran d'accueil — donc il s'empilait quand même.
  const searchParams = useGlobalSearchParams<{ settings?: string }>();
  const currentKey = screenKey(pathname, searchParams);
  const insets = useSafeAreaInsets();
  const goals = useStore((s) => s.goals);
  const { goalToDelete, deletePending, deleteError, askDelete, closeDelete, confirmDelete } =
    useGoalDeletion({ navigate: 'replace' });
  const activeGoal = currentGoalId ? goals.find((goal) => goal.id === currentGoalId) : undefined;
  const orderedGoals = activeGoal
    ? [activeGoal, ...goals.filter((goal) => goal.id !== activeGoal.id)]
    : goals;

  const go = (fn: () => void) => {
    onClose();
    // Laisse le modal se fermer avant de naviguer.
    setTimeout(fn, 50);
  };

  const action = (label: string, targetKey: string, onPress: () => void) => {
    const current = targetKey === currentKey;
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected: current }}
        onPress={() => (current ? onClose() : go(onPress))}
        style={({ pressed }) => [styles.actionItem, pressed && styles.actionItemPressed]}>
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.85}
          style={[styles.actionLabel, current && styles.actionLabelCurrent]}>
          {label}
        </Text>
        {current ? (
          <Text style={styles.currentBadge}>Ici</Text>
        ) : (
          <Text style={styles.actionChevron}>›</Text>
        )}
      </Pressable>
    );
  };

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
              // Le projet déjà ouvert : on ferme, sans réempiler sa fiche.
              const onGoalScreen = active && pathname === `/goal/${g.id}`;
              return (
                <Pressable
                  key={g.id}
                  accessibilityState={{ selected: onGoalScreen }}
                  onPress={() =>
                    onGoalScreen
                      ? onClose()
                      : go(() => router.push({ pathname: '/goal/[id]', params: { id: g.id } }))
                  }
                  style={[styles.goalRow, active && styles.goalRowActive]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.goalName}>{g.name}</Text>
                    <Text style={styles.goalMeta}>
                      {progressPct(g)} % atteint · {money(remainingAmount(g))} restants
                    </Text>
                  </View>
                  <View style={styles.goalActions}>
                    {active ? <Text style={styles.activeBadge}>Actif</Text> : null}
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Supprimer ${g.name}`}
                      onPress={(event) => {
                        event.stopPropagation();
                        askDelete(g);
                        onClose();
                      }}
                      hitSlop={8}>
                      <Text style={styles.deleteAction}>Supprimer</Text>
                    </Pressable>
                  </View>
                </Pressable>
              );
            })}

            <View style={[styles.actions, { marginTop: goals.length ? 10 : 2 }]}>
              <Button
                label="Nouveau projet"
                onPress={() =>
                  currentKey === '/onboarding/new-goal'
                    ? onClose()
                    : go(() => router.push('/onboarding/new-goal'))
                }
              />
              <View style={styles.actionList}>
                {currentGoalId
                  ? action(
                      activeGoal?.savingsMode === 'free' ? 'Ajuster le projet' : 'Ajuster le plan',
                      '/adjust-goal',
                      () =>
                        router.push({
                          pathname: '/adjust-goal',
                          params: { id: currentGoalId },
                        })
                    )
                  : null}
                {action(currentGoalId ? 'Budget' : 'Ajuster mon budget', '/onboarding/budget', () =>
                  router.push({
                    pathname: '/onboarding/budget',
                    params: { standalone: '1' },
                  })
                )}
                {action('Voir un exemple', '/example', () => router.push('/example'))}
                {action('Pays et devise', 'country-settings', () =>
                  router.push({
                    pathname: '/onboarding/country',
                    params: { settings: '1' },
                  })
                )}
                {action('Confidentialité · CGU', '/legal', () => router.push('/legal'))}
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
        onClose={closeDelete}
        onConfirm={() => void confirmDelete()}
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
  deleteAction: { fontSize: 12, fontWeight: '700', color: colors.accent },
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
  actionLabelCurrent: { color: colors.textSecondary },
  actionChevron: { fontSize: 20, lineHeight: 22, fontWeight: '500', color: colors.textSecondary },
  // Même traitement que la pastille « Actif » des projets : on dit où l'on est,
  // pour qu'un appui sans navigation ne passe pas pour un bouton mort.
  currentBadge: {
    color: colors.accent,
    backgroundColor: colors.cardSoft,
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
    fontSize: 11,
    fontWeight: '800',
    overflow: 'hidden',
  },
});
