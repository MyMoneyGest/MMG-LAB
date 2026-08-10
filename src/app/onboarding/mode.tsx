import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/app-header';
import { Card, Screen } from '@/components/ui';
import { colors, radius } from '@/constants/theme';
import { useStore } from '@/lib/store';
import type { SavingsMode } from '@/lib/types';

const MODES: {
  key: SavingsMode;
  eyebrow: string;
  title: string;
  description: string;
  detail: string;
}[] = [
  {
    key: 'guided',
    eyebrow: 'Revenus réguliers',
    title: 'Plan guidé',
    description: 'MMG calcule un montant réaliste à mettre de côté chaque mois.',
    detail: 'Budget, rythme stable ou progressif, échéancier recalculé.',
  },
  {
    key: 'free',
    eyebrow: 'Revenus irréguliers',
    title: 'Épargne libre',
    description: 'Tu mets de côté ce que tu peux, quand tu peux.',
    detail: 'Aucun budget imposé ni montant calculé. Le rappel mensuel reste là.',
  },
];

export default function SavingsModeScreen() {
  const router = useRouter();
  const budget = useStore((state) => state.budget);

  const choose = (mode: SavingsMode) => {
    if (mode === 'guided' && !budget) {
      router.push({ pathname: '/onboarding/budget', params: { next: 'guided' } });
      return;
    }
    router.push({ pathname: '/onboarding/new-goal', params: { mode } });
  };

  return (
    <Screen>
      <AppHeader showBack title="Nouveau projet" />
      <Card>
        <Text style={styles.title}>Quel mode te convient ?</Text>
        <Text style={styles.body}>
          Choisis le cadre qui ressemble à tes revenus. Tu pourras utiliser un mode différent
          pour un autre projet.
        </Text>

        <View accessibilityRole="radiogroup" style={styles.choices}>
          {MODES.map((mode) => (
            <Pressable
              key={mode.key}
              accessibilityRole="button"
              accessibilityLabel={`${mode.title}. ${mode.description}`}
              onPress={() => choose(mode.key)}
              style={({ pressed }) => [styles.choice, pressed && styles.choicePressed]}>
              <View style={styles.choiceHeader}>
                <View style={styles.choiceCopy}>
                  <Text style={styles.eyebrow}>{mode.eyebrow}</Text>
                  <Text style={styles.choiceTitle}>{mode.title}</Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </View>
              <Text style={styles.choiceDescription}>{mode.description}</Text>
              <Text style={styles.choiceDetail}>{mode.detail}</Text>
            </Pressable>
          ))}
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: 23, lineHeight: 29, fontWeight: '800' },
  body: { color: colors.textSecondary, fontSize: 15, lineHeight: 21, marginTop: 7 },
  choices: { gap: 12, marginTop: 20 },
  choice: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.field,
    backgroundColor: colors.card,
    padding: 15,
  },
  choicePressed: { backgroundColor: colors.cardSoft, borderColor: colors.cardSoftBorder },
  choiceHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  choiceCopy: { flex: 1 },
  eyebrow: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  choiceTitle: { color: colors.text, fontSize: 20, fontWeight: '800', marginTop: 2 },
  chevron: { color: colors.accent, fontSize: 28, lineHeight: 30, fontWeight: '500' },
  choiceDescription: { color: colors.text, fontSize: 15, lineHeight: 21, fontWeight: '700', marginTop: 10 },
  choiceDetail: { color: colors.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 4 },
});
