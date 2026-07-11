import { StyleSheet, Text } from 'react-native';

import { AppHeader } from '@/components/app-header';
import { Card, Eyebrow, Screen } from '@/components/ui';
import { colors } from '@/constants/theme';

export default function LegalScreen() {
  return (
    <Screen>
      <AppHeader showBack />
      <Card>
        <Eyebrow>Confidentialité et CGU</Eyebrow>
        <Text style={styles.title}>Ce que MMG est — et n'est pas</Text>
        <Text style={styles.paragraph}>
          MMG n'est pas une banque. L'app n'est pas connectée à ta banque, ne détient aucun fonds et ne
          demande aucun compte à créer. C'est un outil de méthode : les virements, c'est toi qui les fais,
          depuis ta banque habituelle.
        </Text>

        <Text style={styles.section}>Tes données</Text>
        <Text style={styles.paragraph}>
          Ton budget, tes projets et tes versements sont stockés uniquement sur ce téléphone. Ils ne sont
          envoyés sur aucun serveur. Si tu supprimes l'app, ces données disparaissent avec elle.
        </Text>
        <Text style={styles.paragraph}>
          Pour améliorer l'app pendant la phase de test, MMG enregistre des événements d'usage anonymes
          (ouverture de l'app, création d'un projet, versement confirmé…) liés à un identifiant
          d'installation aléatoire. Les montants exacts ne sont jamais transmis — seulement des ordres de
          grandeur. Aucune donnée nominative n'est collectée.
        </Text>

        <Text style={styles.section}>Conditions d'utilisation (phase de test)</Text>
        <Text style={styles.paragraph}>
          MMG est fourni tel quel, gratuitement, dans le cadre d'un test. Les plans proposés sont des
          calculs indicatifs, pas des conseils financiers. L'équipe peut interrompre ou modifier le service
          pendant la phase de test.
        </Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '800', color: colors.text, lineHeight: 35, marginBottom: 12 },
  section: { fontSize: 20, fontWeight: '800', color: colors.text, marginTop: 10, marginBottom: 8 },
  paragraph: { fontSize: 16, color: colors.textSecondary, lineHeight: 24, marginBottom: 12 },
});
