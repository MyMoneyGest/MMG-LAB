import { useRouter } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { AppHeader } from '@/components/app-header';
import { PlanSummaryDark } from '@/components/plan-summary';
import { Button, Card, Eyebrow, Screen } from '@/components/ui';
import { colors } from '@/constants/theme';
import { useStore } from '@/lib/store';
import { useMoney } from '@/lib/use-money';

// Exemple statique de plan, pour montrer la méthode sans rien saisir.

export default function ExampleScreen() {
  const { money } = useMoney();
  const router = useRouter();
  const budget = useStore((s) => s.budget);

  return (
    <Screen>
      <AppHeader showBack />
      <Card>
        <Eyebrow>Exemple</Eyebrow>
        <Text style={styles.title}>Un fonds d'urgence, concrètement</Text>
        <Text style={styles.body}>
          Objectif : {money(3500)}, dont {money(1600)} déjà de côté. Voici le plan que MMG
          proposerait avec une capacité prudente de {money(480)} / mois.
        </Text>
      </Card>

      <PlanSummaryDark
        description="Avoir une marge de sécurité."
        monthly={`${money(380)} / mois`}
        targetDate="31/12/2026"
        months="5 mois"
        remaining={money(1900)}
        diagnostic="Confortable"
        reminderDay={1}
      />

      <Card>
        <Text style={styles.how}>Ensuite, chaque mois :</Text>
        <Text style={styles.step}>1. Un rappel arrive le jour choisi, avec le montant conseillé.</Text>
        <Text style={styles.step}>2. Tu mets cette somme de côté avec ton moyen habituel.</Text>
        <Text style={styles.step}>3. Un tap pour confirmer — même moins que prévu, c'est déjà bien.</Text>
        <Text style={styles.step}>4. Le plan se recalcule tout seul, sans pénalité.</Text>
      </Card>

      <Button
        label={budget ? 'Créer mon plan' : 'Estimer ma capacité'}
        onPress={() => router.push(budget ? '/onboarding/new-goal' : '/onboarding/budget')}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '800', color: colors.text, lineHeight: 35, marginBottom: 10 },
  body: { fontSize: 16, color: colors.textSecondary, lineHeight: 24 },
  how: { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 12 },
  step: { fontSize: 16, color: colors.textSecondary, lineHeight: 24, marginBottom: 8 },
});
