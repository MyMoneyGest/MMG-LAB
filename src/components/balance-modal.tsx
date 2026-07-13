import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius } from '@/constants/theme';
import { formatDate, formatEuro, parseAmountInput } from '@/lib/format';
import { Button, Field, KeyboardSafeScrollView } from './ui';

export function BalanceModal({
  visible,
  estimatedBalance,
  lastConfirmedAt,
  onConfirm,
  onClose,
}: {
  visible: boolean;
  estimatedBalance: number;
  lastConfirmedAt?: string;
  onConfirm: (amount: number) => Promise<void> | void;
  onClose: () => void;
}) {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setValue('');
    setError(null);
    setSaving(false);
  }, [visible]);

  const submit = async () => {
    const amount = parseAmountInput(value);
    if (amount === null || amount < 0) {
      setError('Entre un solde valide, même s’il est de 0 €.');
      return;
    }
    setSaving(true);
    try {
      await onConfirm(amount);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoider}
        behavior={process.env.EXPO_OS === 'ios' ? 'padding' : 'height'}>
        <KeyboardSafeScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled">
          <Pressable style={styles.backdrop} onPress={onClose}>
            <Pressable accessibilityViewIsModal style={styles.sheet} onPress={() => {}}>
              <Text style={styles.eyebrow}>Solde réel</Text>
              <Text style={styles.title}>Combien as-tu réellement de côté ?</Text>
              <Text style={styles.body}>
                Indique le total disponible pour l’ensemble de tes projets. MMG recale les
                enveloppes virtuelles, puis te propose un nouvel échéancier si nécessaire.
              </Text>
              <View style={styles.estimateCard}>
                <Text style={styles.estimateLabel}>Estimation actuelle</Text>
                <Text style={styles.estimateValue}>{formatEuro(estimatedBalance)}</Text>
                {lastConfirmedAt ? (
                  <Text style={styles.estimateDate}>
                    Dernière confirmation : {formatDate(lastConfirmedAt)}
                  </Text>
                ) : null}
              </View>
              <Field
                label="Solde réel global"
                value={value}
                onChangeText={(text) => {
                  setValue(text);
                  setError(null);
                }}
                keyboardType="decimal-pad"
                placeholder="0"
                suffix="EUR"
                autoFocus
                error={error}
              />
              <View style={styles.buttons}>
                <Button
                  label="Annuler"
                  variant="secondary"
                  onPress={onClose}
                  disabled={saving}
                  style={{ flex: 1 }}
                />
                <Button
                  label="Confirmer le solde"
                  onPress={() => void submit()}
                  loading={saving}
                  loadingLabel="Recalcul…"
                  style={{ flex: 1 }}
                />
              </View>
            </Pressable>
          </Pressable>
        </KeyboardSafeScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  keyboardAvoider: { flex: 1 },
  scrollContent: { flexGrow: 1 },
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
  estimateCard: { backgroundColor: colors.cardSoft, borderRadius: radius.field, padding: 12 },
  estimateLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: '800' },
  estimateValue: { color: colors.text, fontSize: 23, fontWeight: '800', marginTop: 2 },
  estimateDate: { color: colors.textSecondary, fontSize: 12, marginTop: 3 },
  buttons: { flexDirection: 'row', gap: 10 },
});
