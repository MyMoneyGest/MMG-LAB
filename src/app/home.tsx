import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Button, Screen } from '@/components/ui';
import { colors } from '@/constants/theme';
import { useStore } from '@/lib/store';

export default function Home() {
  const router = useRouter();
  const budget = useStore((s) => s.budget);
  const goals = useStore((s) => s.goals);

  return (
    <Screen contentContainerStyle={styles.screen}>
      <View style={styles.brandMoment}>
        <View style={styles.logo}><Text style={styles.logoLetter}>M</Text></View>
        <View style={styles.copy}>
          <Text style={styles.hero}>Un projet.{`\n`}Un geste par mois.</Text>
          <Text style={styles.body}>MMG transforme ton objectif en un rythme réaliste.</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Button
          label={budget ? (goals.length ? 'Voir mes projets' : 'Créer mon projet') : 'Commencer'}
          onPress={() =>
            budget
              ? goals.length
                ? router.replace('/')
                : router.push('/onboarding/new-goal')
              : router.push('/onboarding/budget')
          }
        />
        <Button label="Voir un exemple" variant="secondary" onPress={() => router.push('/example')} />
        <Text style={styles.trust}>Aucun compte bancaire connecté</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { flexGrow: 1, justifyContent: 'space-between', paddingBottom: 24 },
  brandMoment: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24, paddingVertical: 44 },
  logo: {
    width: 104,
    height: 104,
    borderRadius: 30,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLetter: { color: '#FFFFFF', fontSize: 54, fontWeight: '800' },
  copy: { alignItems: 'center', gap: 10, maxWidth: 310 },
  hero: { fontSize: 32, fontWeight: '800', color: colors.text, lineHeight: 38, textAlign: 'center' },
  body: { fontSize: 16, color: colors.textSecondary, lineHeight: 23, textAlign: 'center' },
  actions: { gap: 10 },
  trust: { fontSize: 13, color: colors.textSecondary, textAlign: 'center', marginTop: 4 },
});
