import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

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
      <KeyboardAvoidingView
        style={styles.keyboardAvoider}
        behavior={process.env.EXPO_OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardDismissMode={process.env.EXPO_OS === 'ios' ? 'interactive' : 'on-drag'}
          keyboardShouldPersistTaps="handled">
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
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  keyboardAvoider: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(30, 22, 16, 0.45)',
    justifyContent: 'center',
    padding: 20,
  },
  sheet: { backgroundColor: colors.card, borderRadius: radius.card, padding: 20 },
  title: { fontSize: 24, fontWeight: '800', color: colors.text, marginBottom: 5 },
  subtitle: { fontSize: 14, color: colors.textSecondary, lineHeight: 20, marginBottom: 12 },
  buttons: { flexDirection: 'row', gap: 10, marginTop: 4 },
});
