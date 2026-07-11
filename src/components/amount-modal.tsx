import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius } from '@/constants/theme';
import { formatEuro, parseAmountInput } from '@/lib/format';
import { Button, Field } from './ui';

export function AmountModal({
  visible,
  title,
  subtitle,
  confirmLabel,
  maxAmount,
  onConfirm,
  onClose,
}: {
  visible: boolean;
  title: string;
  subtitle?: string;
  confirmLabel: string;
  /** Plafond (ex : retrait limité à ce qui est déjà de côté) */
  maxAmount?: number;
  onConfirm: (amount: number) => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setValue('');
      setError(null);
    }
  }, [visible]);

  const submit = () => {
    const amount = parseAmountInput(value);
    if (amount === null || amount <= 0) {
      setError('Entre un montant valide.');
      return;
    }
    if (maxAmount !== undefined && amount > maxAmount) {
      setError(`Maximum possible : ${formatEuro(maxAmount)}.`);
      return;
    }
    onConfirm(amount);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          <Field
            value={value}
            onChangeText={(t) => {
              setValue(t);
              setError(null);
            }}
            keyboardType="decimal-pad"
            placeholder="0"
            suffix="EUR"
            autoFocus
            error={error}
          />
          <View style={styles.buttons}>
            <Button label="Annuler" variant="secondary" onPress={onClose} style={{ flex: 1 }} />
            <Button label={confirmLabel} onPress={submit} style={{ flex: 1 }} />
          </View>
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
    paddingTop: 120,
  },
  sheet: { backgroundColor: colors.card, borderRadius: radius.card, padding: 22 },
  title: { fontSize: 26, fontWeight: '800', color: colors.text, marginBottom: 6 },
  subtitle: { fontSize: 15, color: colors.textSecondary, lineHeight: 21, marginBottom: 14 },
  buttons: { flexDirection: 'row', gap: 12, marginTop: 6 },
});
