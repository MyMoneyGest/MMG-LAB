import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { AppHeader } from '@/components/app-header';
import { PlanSummaryDark } from '@/components/plan-summary';
import { Button, Card, Eyebrow, Screen } from '@/components/ui';
import { colors } from '@/constants/theme';
import { CurrencyCode } from '@/lib/currency';
import { useStore } from '@/lib/store';
import { useMoney } from '@/lib/use-money';

// Exemple statique de plan, pour montrer la méthode sans rien saisir.
// Les montants sont adaptés à la devise active : des chiffres en euros
// relabellés en FCFA (« 3 500 FCFA » ≈ 5 €) paraîtraient irréalistes pour un
// public d'Afrique centrale/de l'Ouest. Chaque jeu reste cohérent :
// cible − déjà = restant ; mensualité × 5 mois = restant ; mensualité ≤ capacité.

interface ExampleFigures {
  target: number;
  available: number;
  capacity: number;
  monthly: number;
  remaining: number;
}

const EUR_FIGURES: ExampleFigures = {
  target: 3500,
  available: 1600,
  capacity: 480,
  monthly: 380,
  remaining: 1900,
};

// FCFA (parité fixe ~655,957/€) : mêmes proportions, chiffres ronds réalistes.
const FCFA_FIGURES: ExampleFigures = {
  target: 2000000,
  available: 900000,
  capacity: 280000,
  monthly: 220000,
  remaining: 1100000,
};

const EXAMPLE_FIGURES: Record<CurrencyCode, ExampleFigures> = {
  EUR: EUR_FIGURES,
  USD: EUR_FIGURES,
  XAF: FCFA_FIGURES,
  XOF: FCFA_FIGURES,
};

export default function ExampleScreen() {
  const { money, currencyCode } = useMoney();
  const router = useRouter();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const ex = EXAMPLE_FIGURES[currencyCode] ?? EUR_FIGURES;

  return (
    <Screen>
      <AppHeader showBack />
      <Card>
        <Eyebrow>Exemple</Eyebrow>
        <Text style={styles.title}>Un fonds d'urgence, concrètement</Text>
        <Text style={styles.body}>
          Objectif : {money(ex.target)}, dont {money(ex.available)} déjà de côté. Voici le plan
          que MMG proposerait avec une capacité prudente de {money(ex.capacity)} / mois.
        </Text>
      </Card>

      <PlanSummaryDark
        description="Avoir une marge de sécurité."
        monthly={`${money(ex.monthly)} / mois`}
        targetDate="31/12/2026"
        months="5 mois"
        remaining={money(ex.remaining)}
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

      {/* Depuis le 11/11 cet écran a DEUX portes d'entrée : le menu, et le lien
          discret sous le formulaire de création. Le bouton doit donc faire deux
          choses différentes.
          Venu de la création, on revient en arrière — sinon on empile un second
          formulaire par-dessus le premier, et le bouton « Retour » du téléphone
          renvoie à l'exemple au lieu de sortir. Vérifié à l'écran : `navigate`
          ne suffit PAS ici, malgré la doc qui annonce qu'il remonte à une route
          déjà empilée (deux formulaires montés après l'aller-retour).
          Venu du menu, il n'y a aucun formulaire derrière : on y va. */}
      <Button
        label="Créer mon projet"
        onPress={() => {
          if (from === 'new-goal' && router.canGoBack()) router.back();
          else router.navigate('/onboarding/new-goal');
        }}
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
