import { StyleSheet, Text } from 'react-native';

import { AppHeader } from '@/components/app-header';
import { Card, Eyebrow, Screen } from '@/components/ui';
import { colors } from '@/constants/theme';

export default function LegalScreen() {
  return (
    <Screen>
      <AppHeader showBack />

      <Card>
        <Eyebrow>Informations</Eyebrow>
        <Text style={styles.title}>Éditeur et contact</Text>
        <Text style={styles.paragraph}>
          MMG est éditée, pour cette phase de test, sous le nom MyMoneyGest par Patrick
          NGOUALA, responsable du traitement des données au sens du RGPD. Pour toute question
          sur l'app, tes données ou les présentes conditions, écris à :
        </Text>
        <Text selectable style={styles.contact}>mymoneygest@gmail.com</Text>
      </Card>

      <Card>
        <Eyebrow>Le service</Eyebrow>
        <Text style={styles.title}>Ce que MMG est — et n'est pas</Text>
        <Text style={styles.paragraph}>
          MMG est un outil de méthode pour préparer et suivre des projets d'épargne manuels.
          MMG n'est pas une banque, n'est pas connectée à ta banque, ne détient aucun fonds et
          ne demande aucun compte à créer. Les virements restent toujours réalisés par toi,
          depuis ta banque habituelle.
        </Text>
      </Card>

      <Card>
        <Eyebrow>Confidentialité</Eyebrow>
        <Text style={styles.title}>Données conservées sur ton téléphone</Text>
        <Text style={styles.paragraph}>
          Ton budget global, les noms et montants de tes projets, le solde réel que tu confirmes,
          sa répartition en enveloppes virtuelles et l'historique de tes versements sont stockés
          localement sur ton téléphone. Les anciens retraits éventuellement enregistrés restent
          lisibles dans leur historique. Ces informations financières ne sont pas envoyées à
          Supabase et MMG ne collecte aucune donnée bancaire.
        </Text>

        <Text style={styles.section}>Mesure d'usage pendant le test</Text>
        <Text style={styles.paragraph}>
          Pour vérifier la fiabilité du rituel et améliorer l'app, MMG transmet à Supabase des
          événements techniques pseudonymisés : ouverture de l'app, création ou suppression
          d'un projet, versement confirmé, rappel ouvert ou reporté, confirmation périodique du
          solde et choix face à une proposition de réajustement. Le solde réel n'est jamais
          transmis. Ces événements sont reliés à un identifiant d'installation aléatoire, pas à
          un nom, une adresse e-mail ou un compte.
        </Text>
        <Text style={styles.paragraph}>
          Les événements peuvent contenir l'identifiant technique du projet, sa catégorie
          générale et le rythme choisi, la plateforme, la version de l'app et, pour un
          mouvement, une tranche de montant. Les montants exacts, le nom des projets et le
          détail du budget ne sont jamais transmis. Ces données ne servent ni à la publicité
          ni à la revente.
        </Text>
        <Text style={styles.paragraph}>
          La base légale de cette mesure est l'intérêt légitime de MyMoneyGest à vérifier la
          fiabilité du rituel et à améliorer l'app pendant sa phase de test, sans traiter
          aucune donnée personnelle identifiante. Tu peux t'opposer à tout moment à cette
          mesure en écrivant à mymoneygest@gmail.com. Ces événements pseudonymisés sont
          conservés 12 mois au maximum, puis supprimés.
        </Text>

        <Text style={styles.section}>Notifications</Text>
        <Text style={styles.paragraph}>
          La permission de notification est demandée lors de la création du premier projet.
          Les rappels sont programmés localement sur le téléphone et servent uniquement au
          rituel choisi. Tu peux les désactiver dans les réglages Android ou iOS ; cela
          n'efface pas tes projets, mais empêche les rappels et leur report.
        </Text>

        <Text style={styles.section}>Suppression et droits</Text>
        <Text style={styles.paragraph}>
          Tu peux supprimer un projet et son historique depuis le menu de l'app. Supprimer
          l'application retire ses données locales actives du téléphone ; selon tes réglages,
          une sauvegarde système du téléphone peut toutefois en conserver une copie.
        </Text>
        <Text style={styles.paragraph}>
          Pour toute question ou demande concernant les événements techniques pseudonymisés,
          contacte mymoneygest@gmail.com. Tu peux également adresser une réclamation à la CNIL.
        </Text>
      </Card>

      <Card>
        <Eyebrow>CGU — phase de test</Eyebrow>
        <Text style={styles.title}>Conditions d'utilisation</Text>
        <Text style={styles.paragraph}>
          MMG est mise à disposition gratuitement dans le cadre d'un test. En utilisant
          l'application, tu acceptes les présentes conditions. Les fonctionnalités peuvent
          évoluer, être corrigées ou être temporairement indisponibles pendant cette phase.
        </Text>
        <Text style={styles.paragraph}>
          Les plans et diagnostics sont des estimations fondées sur les informations que tu
          saisis. Ils ne constituent pas un conseil financier, fiscal ou juridique. Tu restes
          responsable de vérifier les montants et dates, puis d'effectuer toi-même les
          opérations auprès de ta banque.
        </Text>
        <Text style={styles.paragraph}>
          Utilise MMG uniquement à des fins personnelles et licites. L'équipe MyMoneyGest
          apporte un soin raisonnable au fonctionnement du service, sans pouvoir garantir une
          disponibilité continue pendant le test. La version des conditions affichée dans
          l'app est la version applicable.
        </Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '800', color: colors.text, lineHeight: 35, marginBottom: 12 },
  section: { fontSize: 20, fontWeight: '800', color: colors.text, marginTop: 10, marginBottom: 8 },
  paragraph: { fontSize: 16, color: colors.textSecondary, lineHeight: 24, marginBottom: 12 },
  contact: { fontSize: 18, fontWeight: '800', color: colors.accent, marginBottom: 4 },
});
