import { ReactNode, createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  ScrollViewProps,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  interpolateColor,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { colors, radius, spacing } from '@/constants/theme';

const KeyboardScrollContext = createContext<(target: number) => void>(() => {});
const KEYBOARD_FIELD_GAP = 64;
const PROGRESS_COLOR_STOPS = [0, 35, 70, 100];
const PROGRESS_COLORS = [
  colors.progress.start,
  colors.progress.steady,
  colors.progress.advanced,
  colors.progress.complete,
];

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
      scrollRef.current?.scrollResponderScrollNativeHandleToKeyboard(
        target,
        KEYBOARD_FIELD_GAP,
        true
      );
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

export function Screen({
  children,
  footer,
  contentContainerStyle,
}: {
  children: ReactNode;
  footer?: ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
}) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoider}
        behavior={process.env.EXPO_OS === 'ios' ? 'padding' : 'height'}>
        <KeyboardSafeScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
          contentInsetAdjustmentBehavior="automatic"
          automaticallyAdjustKeyboardInsets={process.env.EXPO_OS === 'ios'}
          keyboardDismissMode={process.env.EXPO_OS === 'ios' ? 'interactive' : 'on-drag'}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {children}
        </KeyboardSafeScrollView>
        {footer ? <View style={styles.screenFooter}>{footer}</View> : null}
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
  loading = false,
  loadingLabel,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  loadingLabel?: string;
  style?: ViewStyle;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        variant === 'primary' && { backgroundColor: pressed ? colors.accentPressed : colors.accent },
        variant === 'secondary' && [styles.buttonSecondary, pressed && { opacity: 0.7 }],
        variant === 'dark' && { backgroundColor: pressed ? '#3D3128' : colors.dark },
        variant === 'light-on-dark' && [styles.buttonLightOnDark, pressed && { opacity: 0.85 }],
        (disabled || loading) && { opacity: 0.55 },
        style,
      ]}>
      {loading ? (
        <View style={styles.buttonLoadingContent}>
          <ActivityIndicator
            color={variant === 'secondary' || variant === 'light-on-dark' ? colors.text : '#FFFFFF'}
          />
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.82}
            style={[
              styles.buttonLabel,
              variant === 'secondary' && { color: colors.text },
              variant === 'light-on-dark' && { color: colors.dark },
            ]}>
            {loadingLabel ?? label}
          </Text>
        </View>
      ) : (
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.82}
          style={[
            styles.buttonLabel,
            variant === 'secondary' && { color: colors.text },
            variant === 'light-on-dark' && { color: colors.dark },
          ]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

export function StepIndicator({
  current,
  labels = ['Projet', 'Rythme'],
}: {
  current: number;
  labels?: string[];
}) {
  const total = labels.length;
  return (
    <View style={styles.steps} accessibilityLabel={`Étape ${current} sur ${total}`}>
      <View style={styles.stepLabels}>
        {labels.map((label, index) => (
          <Text key={label} style={[styles.stepLabel, index + 1 <= current && styles.stepLabelActive]}>
            {label}
          </Text>
        ))}
      </View>
      <View style={styles.stepTracks}>
        {labels.map((label, index) => (
          <View key={label} style={[styles.stepTrack, index + 1 <= current && styles.stepTrackActive]} />
        ))}
      </View>
    </View>
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

/** Une seule ligne de date dont les séparateurs restent toujours visibles. */
export function DateField({
  label,
  value,
  onChangeText,
  error,
}: {
  label?: string;
  value: string;
  onChangeText: (value: string) => void;
  error?: string | null;
}) {
  const [focused, setFocused] = useState(false);
  const revealFocusedField = useContext(KeyboardScrollContext);
  const dayRef = useRef<TextInput>(null);
  const monthRef = useRef<TextInput>(null);
  const yearRef = useRef<TextInput>(null);
  const parts = value.split('/');
  const day = (parts[0] ?? '').replace(/\D/g, '').slice(0, 2);
  const month = (parts[1] ?? '').replace(/\D/g, '').slice(0, 2);
  const year = (parts[2] ?? '').replace(/\D/g, '').slice(0, 4);
  const emit = (nextDay: string, nextMonth: string, nextYear: string) =>
    onChangeText(`${nextDay}/${nextMonth}/${nextYear}`);
  const focus = (target: number) => {
    setFocused(true);
    revealFocusedField(target);
  };

  return (
    <View style={styles.field}>
      {label ? <Text style={styles.fieldLabel}>{label}</Text> : null}
      <View
        style={[
          styles.fieldWrap,
          styles.dateFieldWrap,
          focused && styles.fieldWrapFocused,
          Boolean(error) && styles.fieldWrapError,
        ]}>
        <TextInput
          ref={dayRef}
          accessibilityLabel="Jour"
          value={day}
          onChangeText={(text) => {
            const next = text.replace(/\D/g, '').slice(0, 2);
            emit(next, month, year);
            if (next.length === 2) monthRef.current?.focus();
          }}
          onFocus={(event) => focus(event.nativeEvent.target)}
          onBlur={() => setFocused(false)}
          keyboardType="number-pad"
          maxLength={2}
          placeholder="JJ"
          placeholderTextColor={colors.textSecondary}
          selectionColor={colors.accent}
          style={[styles.fieldInput, styles.datePart, styles.datePartShort]}
        />
        <Text style={styles.dateSeparator}>/</Text>
        <TextInput
          ref={monthRef}
          accessibilityLabel="Mois"
          value={month}
          onChangeText={(text) => {
            const next = text.replace(/\D/g, '').slice(0, 2);
            emit(day, next, year);
            if (next.length === 2) yearRef.current?.focus();
          }}
          onKeyPress={({ nativeEvent }) => {
            if (nativeEvent.key === 'Backspace' && !month) dayRef.current?.focus();
          }}
          onFocus={(event) => focus(event.nativeEvent.target)}
          onBlur={() => setFocused(false)}
          keyboardType="number-pad"
          maxLength={2}
          placeholder="MM"
          placeholderTextColor={colors.textSecondary}
          selectionColor={colors.accent}
          style={[styles.fieldInput, styles.datePart, styles.datePartShort]}
        />
        <Text style={styles.dateSeparator}>/</Text>
        <TextInput
          ref={yearRef}
          accessibilityLabel="Année"
          value={year}
          onChangeText={(text) => emit(day, month, text.replace(/\D/g, '').slice(0, 4))}
          onKeyPress={({ nativeEvent }) => {
            if (nativeEvent.key === 'Backspace' && !year) monthRef.current?.focus();
          }}
          onFocus={(event) => focus(event.nativeEvent.target)}
          onBlur={() => setFocused(false)}
          keyboardType="number-pad"
          maxLength={4}
          placeholder="AAAA"
          placeholderTextColor={colors.textSecondary}
          selectionColor={colors.accent}
          style={[styles.fieldInput, styles.datePart, styles.datePartYear]}
        />
      </View>
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

export function ProgressBar({ pct, label }: { pct: number; label?: string }) {
  const target = Math.min(100, Math.max(0, pct));
  const progress = useSharedValue(0);
  const animatedFillStyle = useAnimatedStyle(() => ({
    width: `${progress.value}%`,
    backgroundColor: interpolateColor(progress.value, PROGRESS_COLOR_STOPS, PROGRESS_COLORS),
  }));
  const animatedLabelStyle = useAnimatedStyle(() => ({
    color: interpolateColor(progress.value, PROGRESS_COLOR_STOPS, PROGRESS_COLORS),
  }));
  const animatedArrowStyle = useAnimatedStyle(() => ({
    borderBottomColor: interpolateColor(
      progress.value,
      PROGRESS_COLOR_STOPS,
      PROGRESS_COLORS
    ),
  }));
  const markerPosition: ViewStyle =
    target <= 14
      ? { left: `${target}%` }
      : target >= 86
        ? { right: `${100 - target}%` }
        : { left: `${target}%`, transform: [{ translateX: -46 }] };

  useEffect(() => {
    if (target >= 100) progress.value = 0;
    progress.value = withTiming(target, {
      duration: target >= 100 ? 1_400 : 650,
      reduceMotion: ReduceMotion.System,
    });
  }, [target]);

  return (
    <View style={styles.progressContainer}>
      <View
        style={styles.progressTrack}
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: 100, now: target }}>
        <Animated.View style={[styles.progressFill, animatedFillStyle]} />
      </View>
      {label ? (
        <View style={styles.progressMarkerArea}>
          <View style={[styles.progressMarker, markerPosition]}>
            <Animated.View
              style={[
                styles.progressMarkerArrow,
                animatedArrowStyle,
                target <= 14 && styles.progressMarkerArrowStart,
                target >= 86 && styles.progressMarkerArrowEnd,
              ]}
            />
            <Animated.Text
              numberOfLines={1}
              style={[styles.progressMarkerLabel, animatedLabelStyle]}>
              {label}
            </Animated.Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  keyboardAvoider: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.screen, paddingBottom: 40 },
  screenFooter: {
    backgroundColor: colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.screen,
    paddingTop: 8,
    paddingBottom: 4,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    padding: spacing.card,
    marginBottom: 12,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.accent,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  button: {
    borderRadius: radius.button,
    minHeight: 44,
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSecondary: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonLightOnDark: { backgroundColor: colors.textOnDark },
  buttonLabel: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  buttonLoadingContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  field: { marginBottom: 10 },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 5 },
  fieldWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.field,
    paddingHorizontal: 12,
  },
  fieldWrapFocused: { borderColor: colors.accent, backgroundColor: colors.card },
  fieldWrapError: { borderColor: colors.accent },
  fieldInput: { flex: 1, fontSize: 16, fontWeight: '600', color: colors.text, paddingVertical: 10 },
  fieldSuffix: { fontSize: 13, fontWeight: '800', color: colors.textSecondary, marginLeft: 8 },
  fieldError: { color: colors.accent, fontSize: 13, marginTop: 5, fontWeight: '600' },
  dateFieldWrap: { justifyContent: 'flex-start', gap: 6 },
  datePart: { flex: 0, paddingHorizontal: 0, textAlign: 'center' },
  datePartShort: { width: 34 },
  datePartYear: { width: 64 },
  dateSeparator: { color: colors.text, fontSize: 19, fontWeight: '800' },
  progressContainer: { marginTop: 12, marginBottom: 10 },
  progressTrack: {
    height: 9,
    borderRadius: 5,
    backgroundColor: '#EBE2D2',
    overflow: 'hidden',
  },
  progressFill: { height: 9, borderRadius: 5, backgroundColor: colors.progress.start },
  progressMarkerArea: { position: 'relative', height: 30 },
  progressMarker: { position: 'absolute', top: 2, width: 92 },
  progressMarkerArrow: {
    alignSelf: 'center',
    width: 0,
    height: 0,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderBottomWidth: 5,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: colors.progress.start,
  },
  progressMarkerArrowStart: { alignSelf: 'flex-start' },
  progressMarkerArrowEnd: { alignSelf: 'flex-end' },
  progressMarkerLabel: {
    color: colors.progress.start,
    fontSize: 12,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
    paddingTop: 2,
  },
  steps: { gap: 7, marginBottom: 15 },
  stepLabels: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  stepLabel: { flex: 1, fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  stepLabelActive: { color: colors.accent },
  stepTracks: { flexDirection: 'row', gap: 6 },
  stepTrack: { flex: 1, height: 5, borderRadius: 3, backgroundColor: colors.border },
  stepTrackActive: { backgroundColor: colors.accent },
});
