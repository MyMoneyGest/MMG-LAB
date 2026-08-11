// Coups de pouce à mi-parcours : une batterie de messages qui tournent, pour que
// la notification ait un vrai impact (reconnexion au « pourquoi » du projet, et
// micro-valorisation de l'épargne) plutôt que de dire seulement « coucou ».
//
// Garde-fous de contenu (non négociables) : aucun verbe d'action (« verse »,
// « ajoute »…), aucun montant, aucun pointage du restant. Registre chaleureux,
// jamais culpabilisant. Le nom du projet est toujours injecté (levier émotionnel).
//
// Module VOLONTAIREMENT autonome (aucun import) : testable en isolation, et prêt
// à être un jour complété par une source distante sans réécriture (cf. spec §7).

const NAME_TOKEN = '{name}';

/** Pool principal : projet avec au moins un cycle complet derrière lui. */
const PRINCIPAL: string[] = [
  "Ce projet « {name} », c'est toi qui l'as choisi — et tu es en train de le construire, tranquillement.",
  "« {name} » avance dans le bon sens. Rien à courir après aujourd'hui, juste à le savoir.",
  "Chaque mois, tu te rapproches un peu plus de « {name} ». C'est déjà en marche.",
  "Tu as déjà commencé « {name} » — et commencer, c'est la partie que la plupart ne font jamais.",
  "Épargner petit à petit bat épargner d'un coup : « {name} » en est la preuve vivante.",
  "« {name} » n'est pas un rêve lointain, c'est un plan que tu suis. Nuance importante.",
  "Ton rythme sur « {name} » t'appartient — vite ou doucement, l'important c'est que ça continue.",
  "Un projet qu'on suit aboutit bien plus souvent qu'un projet gardé en tête — et « {name} », tu le suis.",
  "Mettre de côté régulièrement, même un peu, c'est déjà une habitude précieuse pour « {name} ».",
  "« {name} » est toujours là, et toi aussi. C'est tout ce qu'il faut pour y arriver.",
];

/** Sous-ensemble « démarrage » : les messages « sur ta lancée » sonnent faux au tout début. */
const DEMARRAGE: string[] = [
  "« {name} » vient de commencer — et le plus dur, c'était de s'y mettre.",
  "Tu as posé la première pierre de « {name} ». La suite est déjà tracée.",
  "« {name} » démarre à ton rythme. Pas de course, juste un cap.",
];

/** Sous-ensemble « épargne libre » : on écarte toute cible/échéance, on parle habitude. */
const LIBRE: string[] = [
  PRINCIPAL[0],
  PRINCIPAL[3],
  PRINCIPAL[4],
  PRINCIPAL[6],
  PRINCIPAL[7],
  PRINCIPAL[8],
  PRINCIPAL[9],
  "Mettre de côté pour « {name} », mois après mois — c'est ça, la vraie régularité.",
  "« {name} » avance au fil de tes versements, sans date butoir. À ton tempo.",
  "Pas d'objectif chiffré sur « {name} », juste une bonne habitude qui s'installe.",
];

/** Titres variés, tirés indépendamment du corps. (Volontairement PAS de « Coucou ».) */
const NUDGE_TITLES: string[] = [
  'MMG — un petit point',
  'MMG — sur ta lancée',
  'MMG — juste un mot',
];

export interface NudgeContext {
  goalName: string;
  /** Projet de moins d'un cycle complet (0 ou 1 versement). */
  isStarting: boolean;
  /** Mode épargne libre (pas de cible ni d'échéance). */
  isFree: boolean;
}

function fill(template: string, goalName: string): string {
  return template.split(NAME_TOKEN).join(goalName);
}

/** Sélection du pool applicable : démarrage > libre > principal (le plus spécifique gagne). */
function poolFor(context: NudgeContext): string[] {
  if (context.isStarting) return DEMARRAGE;
  if (context.isFree) return LIBRE;
  return PRINCIPAL;
}

/**
 * Hash déterministe d'une graine (djb2). Sert à choisir un message/titre stable
 * par utilisateur et par cycle, mais qui varie de l'un à l'autre — sans rien
 * persister. Toujours positif.
 */
export function hashSeed(input: string): number {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash + input.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/** Corps du coup de pouce : pool applicable + rotation déterministe par index. */
export function nudgeMessage(context: NudgeContext, index: number): string {
  const pool = poolFor(context);
  const safe = Number.isFinite(index) ? Math.abs(Math.trunc(index)) : 0;
  return fill(pool[safe % pool.length], context.goalName);
}

/** Titre du coup de pouce, choisi indépendamment du corps. */
export function nudgeTitle(index: number): string {
  const safe = Number.isFinite(index) ? Math.abs(Math.trunc(index)) : 0;
  return NUDGE_TITLES[safe % NUDGE_TITLES.length];
}
