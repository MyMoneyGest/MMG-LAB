# Guide de maintenance de MMG

Ce guide est écrit pour **toi, Patrick**, pour que tu puisses comprendre et entretenir MMG
**seul**, même sans l'aide d'une IA. Il ne suppose aucune connaissance de développeur. Chaque
notion technique est expliquée en français simple, avec des exemples concrets.

Prends ton temps : tu n'as pas besoin de tout retenir. Sers-t'en comme d'un manuel où tu
reviens chercher la bonne page au bon moment.

---

## 0. Les 5 règles d'or (à ne jamais oublier)

1. **Toujours pousser ton travail sur GitHub** après une modification (voir §6). C'est la
   sauvegarde en ligne. La première version du projet a été perdue faute de l'avoir fait.
2. **Ne jamais mettre de mot de passe ou de clé secrète dans le code.** Ces valeurs vivent
   dans le fichier `.env` (voir §7), qui n'est jamais envoyé sur GitHub.
3. **Une modification à la fois**, puis on vérifie qu'elle marche avant de continuer.
4. **Avant de pousser, lancer les vérifications** (`npx tsc --noEmit` et les tests, voir §5).
   Si quelque chose est rouge, ne pas pousser tant que ce n'est pas réglé.
5. **En cas de doute, ne pas supprimer.** Renommer, mettre de côté, demander — mais ne pas
   effacer un fichier ou des données qu'on ne comprend pas.

---

## 1. C'est quoi MMG, techniquement, en une page

MMG est une **application mobile** (Android et iPhone) construite avec un outil appelé
**Expo / React Native**. Cela permet d'écrire l'app **une seule fois** et de la faire tourner
sur les deux types de téléphone.

Trois idées à retenir :

- **Toutes les données de l'utilisateur (budget, projets, versements) restent sur son
  téléphone.** MMG n'est pas connectée à une banque et ne stocke rien de personnel sur
  Internet. Si l'utilisateur désinstalle l'app, ses données disparaissent avec elle.
- **Le seul élément en ligne est un compteur d'usage anonyme** (Supabase, voir §2 et §8) :
  il sert uniquement à mesurer combien de personnes reviennent utiliser l'app. Aucune donnée
  d'argent réelle n'y est envoyée.
- **Le cœur de l'app est un rituel mensuel** : un rappel arrive → l'utilisateur ouvre l'app →
  il confirme son versement en un seul geste. Cette boucle est la chose la plus importante à
  ne jamais casser.

---

## 2. Les outils du projet : à quoi sert chacun

Voici tous les outils utilisés, expliqués simplement. Tu n'as pas à les « faire fonctionner »
au quotidien : ils sont déjà installés. Ce tableau sert à comprendre **qui fait quoi**.

| Outil | À quoi ça sert | Quand tu le croises |
|---|---|---|
| **Node.js** | Le moteur qui fait tourner tous les autres outils sur ton Mac. | Invisible, mais tout en dépend. Installé via **Volta**. |
| **Volta** | Gère la bonne version de Node automatiquement. | Si une commande dit « command not found », voir §9. |
| **Expo** | La boîte à outils qui construit l'app et la lance sur ton téléphone. | Commande `npx expo start`. |
| **EAS** | Le service d'Expo « dans le nuage » qui fabrique les fichiers installables (APK Android, app iPhone). | Commande `eas build`. Voir §4. |
| **Supabase** | Une base de données en ligne. Ici, uniquement le compteur d'usage anonyme (table `events`). | Tu y vas via ton navigateur, sur supabase.com. Voir §8. |
| **GitHub** | La sauvegarde en ligne de tout le code + l'historique des modifications. | Commandes `git`. Voir §6. |
| **TestFlight** | Le service d'Apple pour distribuer l'app iPhone à tes testeurs avant l'App Store. | Depuis le site App Store Connect. |
| **Le code** | Les fichiers texte qui décrivent l'app, dans le dossier `src`. | Voir §3. |

---

## 3. Comment le code est organisé

Tout le code vit dans le dossier `src`. Voici la carte, du plus visible au plus caché :

### `src/app/` — les écrans (ce que l'utilisateur voit)
Chaque fichier = un écran.
- `home.tsx` — l'écran d'accueil (« Un projet. Un geste par mois. »)
- `onboarding/budget.tsx` — l'écran du budget
- `onboarding/new-goal.tsx` — la création d'un projet
- `goal/[id].tsx` — l'écran d'un projet (le cœur de l'app : montant du mois, versement…)
- `adjust-goal.tsx` — l'ajustement d'un plan existant
- `example.tsx` — l'exemple de démonstration
- `legal.tsx` — la page Confidentialité et CGU
- `_layout.tsx` — la « colonne vertébrale » qui relie les écrans (à ne pas toucher sans aide)

### `src/components/` — les briques réutilisées
Des morceaux d'interface utilisés sur plusieurs écrans : boutons, fenêtres (« modales »),
le menu, l'en-tête, etc. Par exemple `report-modal.tsx` est la fenêtre « Quand te le
rappeler ? ».

### `src/constants/theme.ts` — les couleurs et les tailles
**C'est ici qu'on change l'apparence générale** (voir §4). Les couleurs officielles :
- fond chaud : `#F4EFE6`
- couleur d'accent (terracotta) : `#B5432A`
- couleur sombre (moments marquants) : `#2B211A`

### `src/lib/` — la « logique » (les calculs, invisible à l'écran)
C'est le cerveau. **À ne modifier qu'avec précaution.**
- `plan.ts` — tous les calculs du plan (montant conseillé, échéances, diagnostic…)
- `store.ts` — la mémoire locale du téléphone (budget, projets, versements)
- `notifications.ts` — les rappels
- `analytics.ts` — l'envoi du compteur d'usage anonyme à Supabase
- `actions.ts` — relie les écrans, la mémoire et les rappels
- `supabase.ts`, `format.ts`, `types.ts`, `timing.ts`, `notification-model.ts` — outillage

### Les fichiers de suivi (à la racine, pas dans `src`)
- `FEATURES.md` — la liste de toutes les fonctionnalités et **où** elles vivent dans le code.
  **Ton meilleur point de départ** quand tu cherches où se trouve quelque chose.
- `PROGRESS.md` — le journal de tout ce qui a été fait, séance par séance.
- `EXCHANGES.md` — les décisions prises et les débats entre les IA.
- `README.md` — le résumé technique du projet.

---

## 4. Comment lancer et voir l'app

Ouvre l'application **Terminal** sur ton Mac, puis tape ces deux lignes (l'une après
l'autre, en appuyant sur Entrée) :

```
cd ~/Documents/mmg-app
npx expo start
```

Un carré de points noirs (un « QR code ») apparaît.
- **Sur ton iPhone** : ouvre l'app **Expo Go** et scanne ce carré (iPhone et Mac sur le même
  Wi-Fi).
- **Sur Android** : les rappels ne marchent pas dans Expo Go. Pour tout tester, il faut le
  fichier installable produit par EAS (ci-dessous).
- Pour voir l'app dans le navigateur du Mac : appuie sur la touche **`w`**.

Pour **arrêter**, reviens dans le Terminal et fais **Ctrl + C**.

### Fabriquer un fichier installable (build)
Quand tu veux une vraie app à installer (pour tes testeurs) :

```
cd ~/Documents/mmg-app
eas build --profile preview --platform android
```

À la fin, EAS te donne un **lien** : ouvre-le sur le téléphone Android pour installer l'APK.
Pour l'iPhone, c'est `--platform ios` puis une soumission à TestFlight (plus complexe, à
faire accompagné la première fois).

---

## 5. Modifier un texte, un bouton, une couleur (les cas les plus courants)

**Règle générale : une modification, on enregistre, on regarde le résultat dans l'app (§4),
et si c'est bon on sauvegarde sur GitHub (§6).**

### Changer un texte affiché
1. Trouve l'écran concerné dans `FEATURES.md` (colonne « Où »).
2. Ouvre le fichier correspondant dans `src/app/`.
3. Cherche le texte entre guillemets et remplace-le. Exemple : pour changer la phrase
   d'accueil, dans `src/app/home.tsx`, cherche `Un projet. Un geste par mois.` et modifie-la.
4. Enregistre. L'app se recharge toute seule si elle tourne.

### Changer une couleur
1. Ouvre `src/constants/theme.ts`.
2. Change la valeur voulue. Exemple : pour une autre teinte d'accent, remplace `#B5432A`
   par un autre code couleur.
3. **Avantage** : comme tout l'app puise ses couleurs ici, le changement s'applique partout
   d'un coup. **Attention** : c'est justement pour ça qu'il faut être sûr de son choix.

### Changer le libellé d'un bouton
Les boutons sont dans les fichiers d'écran (`src/app/`) ou de composants
(`src/components/`). Cherche le texte du bouton entre guillemets et remplace-le. Exemple
donné dans les échanges : si « Montant différent » est trop long sur petit écran, on peut le
raccourcir en « Autre montant ».

### Ce qu'il ne faut PAS faire seul
- Toucher aux fichiers de `src/lib/` (les calculs) sans aide : une erreur y est invisible à
  l'œil mais peut fausser tous les plans.
- Modifier `_layout.tsx`.
- Changer la logique du rituel (rappel → versement en un geste).

Pour ces cas, repasse par une IA en lui donnant le contexte (le fichier `EXCHANGES.md` sert
exactement à ça).

---

## 6. Ajouter ou retirer une petite fonctionnalité

Le vrai « ajout de fonctionnalité » demande d'écrire du code — c'est le travail d'une IA ou
d'un développeur. **Ton rôle à toi**, c'est surtout de :

1. **Décrire précisément ce que tu veux** (quel écran, quel comportement, dans quel cas).
2. **Vérifier le résultat** sur ton téléphone.
3. **Sauvegarder sur GitHub** une fois que c'est validé.

Si tu veux **retirer** un élément simple (un bouton, une ligne de texte), tu peux le faire
comme au §5 : trouver le fichier via `FEATURES.md`, supprimer le morceau, tester, sauvegarder.
En cas de doute, **mets le texte en commentaire plutôt que de le supprimer** : entoure la
ligne de `{/*` et `*/}` — elle disparaît de l'app mais reste dans le fichier, récupérable.

Après **toute** modification de code, avant de sauvegarder, lance les vérifications :

```
cd ~/Documents/mmg-app
npx tsc --noEmit
npm run test:format && npm run test:inputs && npm run test:postpone && npm run test:notifications && npm run test:balance && npm run test:analytics && npm run test:design
```

- `npx tsc --noEmit` vérifie qu'il n'y a pas d'erreur technique. S'il n'affiche rien ou
  « OK », c'est bon.
- Les `npm run test:…` vérifient que les calculs importants marchent toujours. Chaque ligne
  doit dire « réussis » / « validés ».
- **Si quelque chose est rouge ou dit « erreur », ne sauvegarde pas** : le problème doit être
  corrigé d'abord (repasse par une IA avec le message d'erreur copié tel quel).

---

## 7. Sauvegarder sur GitHub, toi-même, étape par étape

C'est **la** compétence à maîtriser. Voici la recette, à suivre à la lettre. Ouvre le
Terminal et tape ces commandes une par une.

**1. Aller dans le projet :**
```
cd ~/Documents/mmg-app
```

**2. Voir ce qui a changé** (facultatif mais rassurant) :
```
git status
```
Les fichiers modifiés apparaissent en rouge.

**3. Préparer tous les changements :**
```
git add -A
```

**4. Enregistrer, avec un petit message qui décrit ce que tu as fait :**
```
git commit -m "Décris ici ta modification en quelques mots"
```
Exemple : `git commit -m "Change la phrase d'accueil"`.

**5. Envoyer sur GitHub (la sauvegarde en ligne) :**
```
git push
```

C'est tout. Si `git push` te demande un identifiant, c'est le compte **MyMoneyGest** et un
**jeton** (pas ton mot de passe habituel — voir §9 si besoin de le refaire). Une fois qu'il
a été accepté une première fois, ton Mac s'en souvient.

**Pour vérifier que c'est bien en ligne** : va sur
`https://github.com/MyMoneyGest/MMG-LAB` dans ton navigateur — tes fichiers et ton message
doivent y apparaître.

---

## 8. Les secrets, le fichier `.env` et Supabase

### Le fichier `.env`
À la racine du projet se trouve un fichier nommé `.env`. Il contient les **clés de connexion
à Supabase**. Ce fichier est **volontairement invisible pour GitHub** (il est listé dans un
fichier `.gitignore` qui dit « n'envoie jamais ça en ligne »).

- **Ne jamais** copier le contenu de `.env` dans un autre fichier du code.
- **Ne jamais** l'envoyer par message ou le publier.
- Si tu changes de Mac, c'est le seul fichier que tu devras recréer à la main (les valeurs
  sont dans ton tableau de bord Supabase).

### La table `events` de Supabase
- Va sur `supabase.com`, connecte-toi, choisis le projet **MMG-LAB**.
- Il n'y a **qu'une seule table : `events`**. Chaque ligne = un événement anonyme (ouverture
  de l'app, création d'un projet, versement confirmé…). **Aucun montant réel, aucun nom.**
- La règle de sécurité de cette table autorise **uniquement l'ajout** de lignes depuis l'app,
  pas la lecture. C'est normal et voulu. Toi, tu lis les données depuis le tableau de bord
  Supabase (qui a tous les droits).
- Pour compter la rétention, utilise l'onglet **SQL Editor** de Supabase. **Toutes les
  requêtes prêtes à copier-coller sont dans le fichier `scripts/retention-queries.sql`** du
  projet : santé de la base, entonnoir d'activation, **rétention au 3e rappel** (la mesure
  clé, avec les seuils 40 % / 20 %), courbe rappel par rappel, et analyses par catégorie /
  rythme. Ouvre ce fichier, copie la requête voulue, colle-la dans le SQL Editor, lance.
- **Deux entretiens à faire à la main** (aussi dans ce fichier, section 0) :
  1. **Avant de diffuser l'app** : vider les données de test, une seule fois, juste avant de
     partager le lien (sinon tes propres tests re-salissent la table) :
     `truncate table events restart identity;`
  2. **Tous les trois mois environ (RGPD)** : effacer les événements de plus de 12 mois, comme
     l'annonce la page Confidentialité :
     `delete from events where created_at < now() - interval '12 months';`
- La clé utilisée par l'app est une clé « publique » par nature (elle est de toute façon dans
  l'app installée) ; ce sont les règles de la table qui protègent les données, pas le secret
  de la clé. **La clé à ne JAMAIS exposer**, elle, est la clé « service_role » du tableau de
  bord : ne la mets jamais dans le code ni dans `.env` de l'app.
- **Les clés dans les builds** : quand une IA ou toi fabriquez un build (Android/iPhone) via
  EAS, le fichier `.env` local n'est PAS envoyé (il est gitignoré). Les clés Supabase sont
  donc enregistrées séparément dans EAS (déjà fait pour `preview` et `production`). Pour les
  revoir : `eas env:list production`. Sans elles, un build fonctionnerait mais n'enverrait
  aucun événement — le suivi de rétention serait muet.

---

## 9. En cas de problème : quoi faire, qui contacter

### « command not found » (par exemple `npx` ou `node` introuvable)
Ton Terminal ne trouve pas les outils. Solutions, dans l'ordre :
1. Ferme complètement la fenêtre du Terminal et rouvre-en une neuve.
2. Si ça persiste, tape : `source ~/.zshenv` puis réessaie.

### L'app ne se lance pas / écran d'erreur rouge dans Expo
1. Arrête (Ctrl + C) et relance `npx expo start`.
2. Lis le message : il pointe souvent le fichier et la ligne en cause.
3. Si tu viens de modifier un fichier, annule ta dernière modification et réessaie. Pour tout
   remettre comme la dernière sauvegarde : `git checkout -- .` (attention : ça efface les
   changements non sauvegardés).

### Un « build » EAS échoue
1. Ouvre le lien fourni par EAS : la page montre les journaux et souvent la cause.
2. Vérifie que tu es bien connecté : `eas whoami` (doit afficher `mymoneygest`).
3. Relance la commande de build. Beaucoup d'échecs sont temporaires (file d'attente, réseau).

### Une notification ne part pas
1. **Rappel** : les notifications ne fonctionnent PAS dans Expo Go sur Android — c'est normal,
   il faut le build EAS. Sur iPhone (Expo Go) et sur les builds, elles marchent.
2. Vérifie que la permission de notification est bien accordée à MMG dans les réglages du
   téléphone.
3. Il existe un test intégré : **appui long sur le M** dans l'app déclenche une notification
   de test au bout de 15 secondes.

### Les données de l'app ne s'affichent plus
Les données vivent sur le téléphone. Si elles ont disparu, c'est presque toujours une
réinstallation de l'app ou un vidage de ses données. Il **n'y a pas** de copie en ligne
(c'est un choix de conception : MMG ne stocke rien de personnel). Rien à « réparer » côté
serveur.

### Le compteur Supabase semble vide
1. Vérifie que le fichier `.env` existe bien et contient les deux lignes Supabase.
2. Sans `.env`, l'app marche normalement mais n'envoie aucun événement — c'est volontaire.

### Quand demander de l'aide, et à qui
- **Pour du code** (bug, nouvelle fonctionnalité, erreur qui persiste) : repasse par une IA
  (Claude Code ou Codex). Donne-lui le **message d'erreur copié tel quel** et dis-lui de lire
  `EXCHANGES.md` et `FEATURES.md` d'abord — tout le contexte y est.
- **Contact du projet** : `mymoneygest@mail.com`.

---

## 10. Le réflexe de fin de séance

Avant de fermer, pose-toi trois questions :
1. Est-ce que mes modifications marchent dans l'app ? (testé sur téléphone ou dans le
   navigateur)
2. Est-ce que les vérifications sont vertes ? (`npx tsc --noEmit` + les tests)
3. Est-ce que j'ai **sauvegardé sur GitHub** ? (`git add -A`, `git commit -m "…"`, `git push`)

Si les trois réponses sont « oui », tu peux fermer tranquille. Ton travail est en sécurité.
