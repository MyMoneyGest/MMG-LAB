import {
  MutableRefObject,
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
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
  ReduceMotion,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import Svg, { Circle } from 'react-native-svg';

import { colors, fonts, progressColor, radius, spacing } from '@/constants/theme';
import { fitFontSize, formatDate } from '@/lib/format';

const KeyboardScrollContext = createContext<(target: number) => void>(() => {});
const KEYBOARD_FIELD_GAP = 64;
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/**
 * ScrollView qui révèle le champ dès le focus, puis une seconde fois à la fin
 * de l'animation du clavier. Le second passage évite d'attendre la première
 * frappe sur Android pour obtenir la bonne hauteur visible.
 */
export function KeyboardSafeScrollView({
  scrollRef: externalRef,
  ...props
}: ScrollViewProps & { scrollRef?: MutableRefObject<ScrollView | null> }) {
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
      <ScrollView
        {...props}
        ref={(node) => {
          scrollRef.current = node;
          if (externalRef) externalRef.current = node;
        }}
      />
    </KeyboardScrollContext.Provider>
  );
}

export function Screen({
  children,
  footer,
  contentContainerStyle,
  scrollRef,
}: {
  children: ReactNode;
  footer?: ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  /** Pour amener l'utilisateur sur une section qui vient d'apparaître. */
  scrollRef?: MutableRefObject<ScrollView | null>;
}) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoider}
        behavior={process.env.EXPO_OS === 'ios' ? 'padding' : 'height'}>
        <KeyboardSafeScrollView
          scrollRef={scrollRef}
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

/**
 * Déclencheur de calendrier : affiche la date retenue en clair et laisse
 * l'écran hôte ouvrir un CalendarModal. Remplace la saisie JJ/MM/AAAA — plus
 * rien à formater ni à valider côté frappe, et aucune date impossible.
 */
export function DatePickerField({
  label,
  value,
  placeholder = 'Choisir une date',
  error,
  onPress,
}: {
  label?: string;
  value: Date | null;
  placeholder?: string;
  error?: string | null;
  onPress: () => void;
}) {
  return (
    <View style={styles.field}>
      {label ? <Text style={styles.fieldLabel}>{label}</Text> : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={value ? `${label ?? 'Date'} : ${formatDate(value)}. Modifier` : label}
        onPress={onPress}
        style={({ pressed }) => [
          styles.fieldWrap,
          styles.dateTrigger,
          pressed && styles.fieldWrapFocused,
          Boolean(error) && styles.fieldWrapError,
        ]}>
        <Text style={[styles.dateTriggerValue, !value && styles.dateTriggerPlaceholder]}>
          {value ? formatDate(value) : placeholder}
        </Text>
        <Text style={styles.dateTriggerIcon}>📅</Text>
      </Pressable>
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

/**
 * Anneau de progression : le montant s'affiche en son centre, avec la taille
 * dynamique de `fitFontSize` pour qu'un très gros montant (FCFA) reste sur une
 * ligne sans déborder de l'anneau. Remplace ProgressBar sur l'écran projet.
 */
export function ProgressRing({
  pct,
  amount,
  amountLabel = 'mis de côté',
  size = 180,
  strokeWidth = 14,
}: {
  pct: number;
  amount: string;
  amountLabel?: string;
  size?: number;
  strokeWidth?: number;
}) {
  const target = Math.min(100, Math.max(0, pct));
  const radiusPx = (size - strokeWidth) / 2;
  const circumference = radiusPx * 2 * Math.PI;
  const progress = useSharedValue(0);

  useEffect(() => {
    if (target >= 100) progress.value = 0;
    progress.value = withTiming(target, {
      duration: target >= 100 ? 1_400 : 650,
      reduceMotion: ReduceMotion.System,
    });
  }, [target]);

  // L'anneau change de teinte en avançant, comme le faisait la barre qu'il
  // remplace : brun discret au départ, terracotta en rythme de croisière, ocre
  // en approche, vert une fois l'objectif financé.
  //
  // La teinte suit la valeur cible et ne s'interpole pas pendant le remplissage.
  // Un `stroke` passé en `animatedProps` n'est appliqué qu'à sa valeur initiale
  // par react-native-svg : l'anneau restait brun à 100 %.
  const ringColor = progressColor(target);

  const animatedCircleProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference - (progress.value / 100) * circumference,
  }));

  return (
    <View style={[styles.ringContainer, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radiusPx}
          stroke={colors.border}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radiusPx}
          stroke={ringColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          animatedProps={animatedCircleProps}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.ringTextContainer} pointerEvents="none">
        <Text
          numberOfLines={1}
          style={[styles.ringAmount, { fontSize: fitFontSize(amount, 26) }]}>
          {amount}
        </Text>
        <Text style={styles.ringAmountLabel}>{amountLabel}</Text>
        <Text style={[styles.ringPercentage, { color: ringColor }]}>
          {Math.round(target)}%
        </Text>
        <Text style={styles.ringAttain}>ATTEINT</Text>
      </View>
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
  // La carte a le même blanc que la page : son contour est donc la SEULE chose
  // qui la délimite. D'où 1 px plein et non `hairlineWidth` — qui vaut 0,33 px
  // sur un écran 3x, rend de façon irrégulière et peut disparaître selon la
  // luminosité. Un filet plutôt qu'une ombre reste le vocabulaire du premium
  // sobre ; ici c'est aussi le seul repère de structure, il doit tenir.
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
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
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  fieldWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.field,
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
  dateTrigger: { justifyContent: 'space-between', paddingVertical: 12 },
  dateTriggerValue: { fontSize: 16, fontWeight: '600', color: colors.text },
  dateTriggerPlaceholder: { color: colors.textSecondary, fontWeight: '500' },
  dateTriggerIcon: { fontSize: 15 },
  steps: { gap: 7, marginBottom: 15 },
  stepLabels: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  stepLabel: { flex: 1, fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  stepLabelActive: { color: colors.accent },
  stepTracks: { flexDirection: 'row', gap: 6 },
  stepTrack: { flex: 1, height: 5, borderRadius: 3, backgroundColor: colors.border },
  stepTrackActive: { backgroundColor: colors.accent },
  ringContainer: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  ringTextContainer: { position: 'absolute', alignItems: 'center' },
  // Chiffres tabulaires : le montant et le pourcentage changent sous les yeux,
  // et des largeurs de chiffres variables les feraient sautiller.
  ringAmount: {
    fontFamily: fonts.sansBold,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  ringAmountLabel: {
    fontFamily: fonts.sansRegular,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: -2,
  },
  ringPercentage: {
    fontFamily: fonts.sansBold,
    fontSize: 22,
    marginTop: 10,
    fontVariant: ['tabular-nums'],
  },
  ringAttain: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 10,
    color: colors.textSecondary,
    letterSpacing: 1,
  },
});
