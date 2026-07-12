import { Modal, StyleSheet, Text, View } from 'react-native';

import { colors, radius } from '@/constants/theme';
import { formatDate, formatEuro } from '@/lib/format';
import type { Contribution } from '@/lib/types';
import { Button } from './ui';

export function RecentContributionModal({
  visible,
  amount,
  contributions,
  onConfirm,
  onClose,
}: {
  visible: boolean;
  amount: number;
  contributions: Contribution[];
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View accessibilityViewIsModal style={styles.sheet}>
          <Text style={styles.eyebrow}>Vérification</Text>
          <Text style={styles.title}>Deux versements sont très proches</Text>
          <Text style={styles.body}>
            Tu vas ajouter {formatEuro(amount)}. Voici les versements enregistrés ces trois
            derniers jours :
          </Text>
          <View style={styles.list}>
            {contributions.map((contribution) => (
              <View key={contribution.id} style={styles.row}>
                <Text style={styles.date}>{formatDate(contribution.date)}</Text>
                <Text style={styles.amount}>{formatEuro(contribution.amount)}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.question}>Confirmer ce nouveau versement ?</Text>
          <View style={styles.buttons}>
            <Button label="Annuler" variant="secondary" onPress={onClose} style={{ flex: 1 }} />
            <Button label="Confirmer ce versement" onPress={onConfirm} style={{ flex: 1 }} />
          </View>
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
  sheet: { backgroundColor: colors.card, borderRadius: radius.card, padding: 20, gap: 10 },
  eyebrow: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  title: { color: colors.text, fontSize: 23, fontWeight: '800' },
  body: { color: colors.textSecondary, fontSize: 14, lineHeight: 20 },
  list: { backgroundColor: colors.cardSoft, borderRadius: radius.field, padding: 12, gap: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  date: { color: colors.text, fontSize: 14, fontWeight: '700' },
  amount: { color: colors.accent, fontSize: 14, fontWeight: '800' },
  question: { color: colors.text, fontSize: 14, fontWeight: '700' },
  buttons: { flexDirection: 'row', gap: 10 },
});
