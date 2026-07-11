import { ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radius, spacing } from '@/constants/theme';

export function Screen({ children }: { children: ReactNode }) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <Text style={styles.eyebrow}>{children}</Text>;
}

type ButtonVariant = 'primary' | 'secondary' | 'dark' | 'light-on-dark';

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  style?: ViewStyle;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        variant === 'primary' && { backgroundColor: pressed ? colors.accentPressed : colors.accent },
        variant === 'secondary' && [styles.buttonSecondary, pressed && { opacity: 0.7 }],
        variant === 'dark' && { backgroundColor: pressed ? '#3D3128' : colors.dark },
        variant === 'light-on-dark' && [styles.buttonLightOnDark, pressed && { opacity: 0.85 }],
        disabled && { opacity: 0.4 },
        style,
      ]}>
      <Text
        style={[
          styles.buttonLabel,
          variant === 'secondary' && { color: colors.text },
          variant === 'light-on-dark' && { color: colors.dark },
        ]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function Field({
  label,
  suffix,
  error,
  ...inputProps
}: TextInputProps & { label?: string; suffix?: string; error?: string | null }) {
  return (
    <View style={{ marginBottom: 14 }}>
      {label ? <Text style={styles.fieldLabel}>{label}</Text> : null}
      <View style={styles.fieldWrap}>
        <TextInput
          placeholderTextColor={colors.textSecondary}
          style={styles.fieldInput}
          {...inputProps}
        />
        {suffix ? <Text style={styles.fieldSuffix}>{suffix}</Text> : null}
      </View>
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

export function ProgressBar({ pct }: { pct: number }) {
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${Math.min(100, Math.max(0, pct))}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.screen, paddingBottom: 48 },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    padding: spacing.card,
    marginBottom: 16,
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.accent,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  button: {
    borderRadius: radius.button,
    paddingVertical: 17,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSecondary: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonLightOnDark: { backgroundColor: colors.textOnDark },
  buttonLabel: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
  fieldLabel: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 8 },
  fieldWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1E7D8',
    borderRadius: radius.field,
    paddingHorizontal: 16,
  },
  fieldInput: { flex: 1, fontSize: 19, fontWeight: '600', color: colors.text, paddingVertical: 15 },
  fieldSuffix: { fontSize: 15, fontWeight: '600', color: colors.textSecondary, marginLeft: 8 },
  fieldError: { color: colors.accent, fontSize: 14, marginTop: 6, fontWeight: '600' },
  progressTrack: {
    height: 9,
    borderRadius: 5,
    backgroundColor: '#EBE2D2',
    overflow: 'hidden',
    marginTop: 14,
    marginBottom: 12,
  },
  progressFill: { height: 9, borderRadius: 5, backgroundColor: colors.accent },
});
