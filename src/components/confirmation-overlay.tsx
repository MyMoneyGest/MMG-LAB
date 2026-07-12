import { Modal, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/theme';
import { formatDate, formatEuro, formatMonth } from '@/lib/format';
import { Button } from './ui';

// Le « moment marquant » : écran sombre réservé à la confirmation d'un
// versement. Ton non-punitif et encourageant.

export function ConfirmationOverlay({
  visible,
  amount,
  goalName,
  nextReminderAt,
  nextAmount,
  done,
  cycleAnchorAt,
  onClose,
}: {
  visible: boolean;
  amount: number;
  goalName: string;
  nextReminderAt?: string;
  nextAmount?: number;
  /** true si l'objectif est atteint avec ce versement */
  done?: boolean;
  cycleAnchorAt?: string;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.badge}>
          <Text style={styles.badgeCheck}>✓</Text>
        </View>
        <Text style={styles.eyebrow}>C'est noté</Text>
        <Text style={styles.amount}>{formatEuro(amount)}</Text>
        <Text style={styles.message}>
          {done
            ? `« ${goalName} » est financé. Objectif atteint 🎉`
            : `mis de côté pour « ${goalName} ». Même moins que prévu, c'est déjà bien : le plan s'ajuste tout seul.`}
        </Text>
        {cycleAnchorAt ? (
          <Text style={styles.cycleInfo}>Ce versement compte pour {formatMonth(cycleAnchorAt)}.</Text>
        ) : null}
        {!done && nextReminderAt && nextAmount !== undefined && nextAmount > 0 ? (
          <View style={styles.nextCard}>
            <Text style={styles.nextLabel}>Prochain rappel</Text>
            <Text style={styles.nextValue}>
              {formatDate(nextReminderAt)} · {formatEuro(nextAmount)} conseillés
            </Text>
          </View>
        ) : null}
        <Button label="Continuer" variant="light-on-dark" onPress={onClose} style={styles.cta} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  badge: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 26,
  },
  badgeCheck: { color: '#FFFFFF', fontSize: 42, fontWeight: '800' },
  eyebrow: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textOnDarkMuted,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  amount: { fontSize: 52, fontWeight: '800', color: colors.textOnDark, marginBottom: 14 },
  message: {
    fontSize: 17,
    color: colors.textOnDarkMuted,
    textAlign: 'center',
    lineHeight: 25,
    marginBottom: 28,
  },
  cycleInfo: {
    color: colors.textOnDark,
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: -16,
    marginBottom: 24,
  },
  nextCard: {
    backgroundColor: 'rgba(247, 242, 234, 0.08)',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 30,
  },
  nextLabel: { fontSize: 13, fontWeight: '700', color: colors.textOnDarkMuted, textTransform: 'uppercase', letterSpacing: 1 },
  nextValue: { fontSize: 17, fontWeight: '700', color: colors.textOnDark, marginTop: 4 },
  cta: { alignSelf: 'stretch' },
});
