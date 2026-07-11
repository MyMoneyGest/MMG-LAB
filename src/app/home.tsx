import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/app-header';
import { Button, Card, Eyebrow, Screen } from '@/components/ui';
import { colors } from '@/constants/theme';
import { useStore } from '@/lib/store';

const CHECKLIST = [
  { title: 'Ton reste à vivre', text: 'Ce qui reste après charges et dépenses variables.' },
  { title: 'Ta marge de sécurité', text: 'Une réserve pour éviter un plan trop serré.' },
  { title: 'Un objectif finançable', text: 'Un plan réaliste, pas un vœu pieux.' },
];

export default function Home() {
  const router = useRouter();
  const budget = useStore((s) => s.budget);
  const goals = useStore((s) => s.goals);

  return (
    <Screen>
      <AppHeader />

      <Card>
        <Eyebrow>Avant le projet</Eyebrow>
        <Text style={styles.hero}>Combien peux-tu mettre de côté sans te serrer ?</Text>
        <Text style={styles.body}>
          MMG estime ta capacité d'épargne, puis propose un plan réaliste pour ton objectif.
        </Text>

        <View style={{ gap: 12, marginTop: 18 }}>
          {!budget ? (
            <Button label="Estimer ma capacité" onPress={() => router.push('/onboarding/budget')} />
          ) : goals.length > 0 ? (
            <>
              <Button label="Voir mes plans" onPress={() => router.push('/')} />
              <Button
                label="Créer un nouveau plan"
                variant="secondary"
                onPress={() => router.push('/onboarding/new-goal')}
              />
            </>
          ) : (
            <Button label="Créer un nouveau plan" onPress={() => router.push('/onboarding/new-goal')} />
          )}
          <Button label="Voir un exemple" variant="secondary" onPress={() => router.push('/example')} />
        </View>

        <Text style={styles.trust}>Pas de compte bancaire connecté. Pas de crédit. Pas de publicité.</Text>
      </Card>

      <Card>
        <Text style={styles.checklistTitle}>Ce que MMG vérifie d'abord</Text>
        {CHECKLIST.map((item) => (
          <View key={item.title} style={styles.checkRow}>
            <View style={styles.checkBadge}>
              <Text style={styles.checkMark}>✓</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.checkTitle}>{item.title}</Text>
              <Text style={styles.checkText}>{item.text}</Text>
            </View>
          </View>
        ))}
      </Card>

      <Text style={styles.footnote}>
        MMG n'est pas une banque et n'est pas connectée à ta banque. Pas de compte à créer : la méthode,
        c'est toi qui fais le geste, MMG tient le rituel.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { fontSize: 33, fontWeight: '800', color: colors.text, lineHeight: 40, marginBottom: 14 },
  body: { fontSize: 17, color: colors.textSecondary, lineHeight: 25 },
  trust: { fontSize: 14, color: colors.textSecondary, marginTop: 16, lineHeight: 20 },
  checklistTitle: { fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: 16 },
  checkRow: { flexDirection: 'row', gap: 14, marginBottom: 16 },
  checkBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.cardSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: { color: colors.accent, fontSize: 20, fontWeight: '800' },
  checkTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  checkText: { fontSize: 15, color: colors.textSecondary, lineHeight: 21, marginTop: 2 },
  footnote: { fontSize: 13, color: colors.textSecondary, lineHeight: 19, paddingHorizontal: 6 },
});
