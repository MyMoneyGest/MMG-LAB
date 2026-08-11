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

// Ton familier, parlé, concret (pas « coach »/développement personnel) : le public
// inclut des gens qui commencent tout juste à épargner (Afrique francophone, Gabon…).
// Le nom du projet est précédé de « ton projet » là où un nom court le rendrait
// bancal ; là où la phrase commence par « {name} », elle a été pensée pour tenir.
// Version « assez bonne » — affinée ensuite avec les premiers testeurs sur place.

/** Pool principal : projet avec au moins un cycle complet derrière lui. */
const PRINCIPAL: string[] = [
  "Ton projet « {name} » suit son cours, tranquille. Rien à faire, on voulait juste te le dire.",
  "Petit à petit, « {name} » se remplit. Et c'est toi qui fais ça.",
  "Un mois de plus, un pas de plus vers « {name} ». Ça continue d'avancer.",
  "Tu as lancé ton projet « {name} » — beaucoup y pensent, peu se lancent. Toi, tu l'as fait.",
  "Mois après mois, « {name} » prend forme. C'est comme ça qu'on y arrive.",
  "« {name} », tu ne fais pas qu'y penser : tu le construis pour de vrai.",
  "Vite ou doucement, peu importe : tant que « {name} » avance, tu es sur la bonne voie.",
  "Un projet qu'on suit finit par arriver. Et ton projet « {name} », tu le suis bien.",
  "Mettre de côté un peu, souvent — c'est déjà une belle habitude pour « {name} ».",
  "Ton projet « {name} » est toujours là, et toi aussi. C'est tout ce qu'il faut.",
];

/** Sous-ensemble « démarrage » : les messages « sur ta lancée » sonnent faux au tout début. */
const DEMARRAGE: string[] = [
  "Ton projet « {name} » démarre. Le plus dur — s'y mettre — c'est déjà fait.",
  "Première pierre posée pour « {name} ». Le reste suit, à ton rythme.",
  "« {name} » ne fait que commencer. Pas de course, juste un cap.",
];

/** Sous-ensemble « épargne libre » : on écarte toute cible/échéance, on parle habitude. */
const LIBRE: string[] = [
  PRINCIPAL[0], // suit son cours
  PRINCIPAL[1], // se remplit, c'est toi qui fais ça
  PRINCIPAL[3], // tu as lancé
  PRINCIPAL[5], // tu le construis pour de vrai
  PRINCIPAL[8], // belle habitude
  PRINCIPAL[9], // toujours là
  "Mettre de côté pour « {name} », mois après mois — voilà la vraie régularité.",
  "« {name} » avance à ton tempo, sans date limite. Comme tu veux.",
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
