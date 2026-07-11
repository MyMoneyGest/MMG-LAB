import { ReactNode, createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  ScrollViewProps,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radius, spacing } from '@/constants/theme';

const KeyboardScrollContext = createContext<(target: number) => void>(() => {});

/**
 * ScrollView qui révèle le champ dès le focus, puis une seconde fois à la fin
 * de l'animation du clavier. Le second passage évite d'attendre la première
 * frappe sur Android pour obtenir la bonne hauteur visible.
 */
export function KeyboardSafeScrollView(props: ScrollViewProps) {
  const scrollRef = useRef<ScrollView>(null);
  const focusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const revealFocusedField = useCallback((target: number) => {
    const reveal = () =>
      scrollRef.current?.scrollResponderScrollNativeHandleToKeyboard(target, 28, true);
    requestAnimationFrame(reveal);
    if (focusTimer.current) clearTimeout(focusTimer.current);
    focusTimer.current = setTimeout(reveal, 320);
  }, []);

  useEffect(
    () => () => {
      if (focusTimer.current) clearTimeout(focusTimer.current);
    },
    []
  );

  return (
    <KeyboardScrollContext.Provider value={revealFocusedField}>
      <ScrollView {...props} ref={scrollRef} />
    </KeyboardScrollContext.Provider>
  );
}

export function Screen({ children }: { children: ReactNode }) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoider}
        behavior={process.env.EXPO_OS === 'ios' ? 'padding' : 'height'}>
        <KeyboardSafeScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          contentInsetAdjustmentBehavior="automatic"
          automaticallyAdjustKeyboardInsets={process.env.EXPO_OS === 'ios'}
          keyboardDismissMode={process.env.EXPO_OS === 'ios' ? 'interactive' : 'on-drag'}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {children}
        </KeyboardSafeScrollView>
      </KeyboardAvoidingView>
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
  onBlur,
  onFocus,
  style,
  ...inputProps
}: TextInputProps & { label?: string; suffix?: string; error?: string | null }) {
  const [focused, setFocused] = useState(false);
  const revealFocusedField = useContext(KeyboardScrollContext);
  return (
    <View style={styles.field}>
      {label ? <Text style={styles.fieldLabel}>{label}</Text> : null}
      <View
        style={[
          styles.fieldWrap,
          focused && styles.fieldWrapFocused,
          Boolean(error) && styles.fieldWrapError,
        ]}>
        <TextInput
          placeholderTextColor={colors.textSecondary}
          selectionColor={colors.accent}
          style={[styles.fieldInput, style]}
          onFocus={(event) => {
            setFocused(true);
            revealFocusedField(event.nativeEvent.target);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
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
  keyboardAvoider: { flex: 1 },
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
  field: { marginBottom: 12 },
  fieldLabel: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 6 },
  fieldWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.field,
    paddingHorizontal: 14,
  },
  fieldWrapFocused: { borderColor: colors.accent, backgroundColor: colors.card },
  fieldWrapError: { borderColor: colors.accent },
  fieldInput: { flex: 1, fontSize: 17, fontWeight: '600', color: colors.text, paddingVertical: 12 },
  fieldSuffix: { fontSize: 13, fontWeight: '800', color: colors.textSecondary, marginLeft: 8 },
  fieldError: { color: colors.accent, fontSize: 13, marginTop: 5, fontWeight: '600' },
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
