import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius } from '@/constants/theme';
import { formatDate, formatMonth } from '@/lib/format';
import type { ContributionIntent } from '@/lib/plan';
import { Button } from './ui';

export function ContributionChoiceModal({
  visible,
  anchorAt,
  value,
  onChange,
  onConfirm,
  onClose,
}: {
  visible: boolean;
  anchorAt?: string;
  value: ContributionIntent;
  onChange: (value: ContributionIntent) => void;
  onConfirm: () => void;
  onClose: () => void;
}) {
  if (!anchorAt) return null;
  const anchor = new Date(anchorAt);
  const following = new Date(anchor);
  following.setMonth(following.getMonth() + 1);

  const option = (intent: ContributionIntent, label: string) => {
    const selected = value === intent;
    return (
      <Pressable
        accessibilityRole="radio"
        accessibilityState={{ checked: selected }}
        onPress={() => onChange(intent)}
        style={[styles.option, selected && styles.optionSelected]}>
        <View style={[styles.radio, selected && styles.radioSelected]}>
          {selected ? <View style={styles.radioDot} /> : null}
        </View>
        <Text style={styles.optionLabel}>{label}</Text>
      </Pressable>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View accessibilityViewIsModal style={styles.sheet}>
          <Text style={styles.eyebrow}>Ce versement</Text>
          <Text style={styles.title}>Comment veux-tu le compter ?</Text>
          <Text style={styles.body}>L’extra est sélectionné par défaut pour préserver ton rituel.</Text>
          <View accessibilityRole="radiogroup" style={styles.options}>
            {option(
              'surplus',
              `C’est un extra — mon rappel du ${formatDate(anchor)} est maintenu`
            )}
            {option(
              'settle_current',
              `C’est mon versement de ${formatMonth(anchor)} — prochain rappel le ${formatDate(following)}`
            )}
          </View>
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
  options: { gap: 9 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    padding: 13,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.field,
  },
  optionSelected: { borderColor: colors.accent, backgroundColor: colors.cardSoft },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.textSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { borderColor: colors.accent },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent },
  optionLabel: { flex: 1, color: colors.text, fontSize: 14, lineHeight: 20, fontWeight: '700' },
  buttons: { flexDirection: 'row', gap: 10 },
});
