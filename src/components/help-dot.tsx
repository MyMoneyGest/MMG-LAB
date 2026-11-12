import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colors } from '@/constants/theme';
import { AppDialog } from './app-dialog';

/**
 * Bulle d'aide contextuelle : une pastille « i » qui ouvre une explication.
 *
 * Le motif existait déjà, en un seul exemplaire et écrit à la main sur la fiche
 * projet (« À quoi sert le solde réel ? »). Il est ici factorisé pour être
 * posable ailleurs sans le réinventer — mais POSÉ AU CAS PAR CAS, jamais semé.
 *
 * ⚠️ La tentation, en ayant ce composant sous la main, est d'en mettre partout.
 * C'est exactement le bruit que MMG fuit : un écran couvert de « i » dit que
 * rien n'est clair. Chaque emplacement se décide, et la règle est qu'une bulle
 * répond à un doute qu'on a VU quelqu'un avoir — pas à un doute imaginé. Un
 * libellé qu'on peut rendre clair se corrige, il ne se commente pas.
 *
 * Volontairement muette par défaut : rien ne s'ouvre tant que personne ne
 * touche. Un tutoriel qui se lance tout seul est un tutoriel qu'on referme.
 */
export function HelpDot({
  label,
  eyebrow,
  title,
  message,
}: {
  /** Ce que la pastille explique, pour les lecteurs d'écran. */
  label: string;
  eyebrow: string;
  title: string;
  message: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        hitSlop={10}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.dot, pressed && styles.dotPressed]}>
        <Text style={styles.dotText}>i</Text>
      </Pressable>
      <AppDialog
        visible={open}
        eyebrow={eyebrow}
        title={title}
        message={message}
        onClose={() => setOpen(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  // Plus petite que le bouton « i » de la fiche projet, qui est une action à
  // part entière dans une rangée de boutons. Ici la pastille accompagne un
  // libellé : elle doit se voir sans peser. `hitSlop` rattrape la cible
  // tactile, qui reste confortable.
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotPressed: { backgroundColor: colors.cardSoft },
  dotText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
    color: colors.textSecondary,
  },
});
