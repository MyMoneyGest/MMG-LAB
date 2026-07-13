import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp, ReduceMotion } from 'react-native-reanimated';

import { colors, radius } from '@/constants/theme';
import { Button } from './ui';

export type AppDialogTone = 'info' | 'success' | 'danger';

export function AppDialog({
  visible,
  eyebrow = 'MMG',
  title,
  message,
  tone = 'info',
  confirmLabel = 'Compris',
  cancelLabel,
  loading = false,
  loadingLabel,
  onConfirm,
  onClose,
}: {
  visible: boolean;
  eyebrow?: string;
  title: string;
  message: string;
  tone?: AppDialogTone;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  loadingLabel?: string;
  onConfirm?: () => void;
  onClose: () => void;
}) {
  const symbol = tone === 'success' ? '✓' : tone === 'danger' ? '!' : 'i';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => {
        if (!loading) onClose();
      }}>
      <Pressable
        style={styles.backdrop}
        onPress={() => {
          if (!loading) onClose();
        }}>
        <Animated.View
          accessibilityViewIsModal
          entering={FadeInUp.duration(360).reduceMotion(ReduceMotion.System)}
          style={styles.card}>
          <Pressable onPress={() => {}}>
            <View style={[styles.symbol, tone === 'success' && styles.symbolSuccess]}>
              <Text style={[styles.symbolText, tone === 'success' && styles.symbolTextSuccess]}>
                {symbol}
              </Text>
            </View>
            <Text style={styles.eyebrow}>{eyebrow}</Text>
            <Text style={styles.title}>{title}</Text>
            <Text selectable style={styles.message}>{message}</Text>
            <View style={styles.buttons}>
              {cancelLabel ? (
                <Button
                  label={cancelLabel}
                  variant="secondary"
                  onPress={onClose}
                  disabled={loading}
                  style={{ flex: 1 }}
                />
              ) : null}
              <Button
                label={confirmLabel}
                onPress={onConfirm ?? onClose}
                loading={loading}
                loadingLabel={loadingLabel}
                style={{ flex: 1 }}
              />
            </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 22,
    backgroundColor: 'rgba(30, 22, 16, 0.48)',
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.card,
    borderRadius: radius.card,
    padding: 20,
  },
  symbol: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.banner,
    marginBottom: 14,
  },
  symbolSuccess: { backgroundColor: '#DDEEE4' },
  symbolText: { color: colors.accent, fontSize: 22, fontWeight: '900' },
  symbolTextSuccess: { color: colors.success },
  eyebrow: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  title: { color: colors.text, fontSize: 22, lineHeight: 27, fontWeight: '800' },
  message: { color: colors.textSecondary, fontSize: 14, lineHeight: 21, marginTop: 8 },
  buttons: { flexDirection: 'row', gap: 10, marginTop: 20 },
});
