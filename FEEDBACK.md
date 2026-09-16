# Retours utilisateurs — MMG

Journal des retours reçus pendant la phase de test. **On note tout, on n'implémente rien
pendant le test** (gel des fonctionnalités). Évaluation groupée à la fin des 3-4 mois, à la
lumière des données de rétention.

Pour chaque retour : source, date, l'idée, l'analyse (Claude Code), et le verdict/horizon.
Chercher les **motifs récurrents** (plusieurs personnes) plutôt que réagir à un retour isolé.

**Micro-ajustements cosmétiques** (copie, ponctuation, espacements…) : ne rien refaire au coup
par coup. On les **groupe pour le prochain build obligatoire** (avant l'expiration TestFlight
~90 j) → coût zéro, pas de churn réactive en plein test.

---

## 🎉 2026-09-16 — LE TRACKING FONCTIONNE. Bloqueur du 19/08 CLOS.

Premier utilisateur réel mesuré : **`install-1784896946511-qob00bzw2d`**, iOS,
2.1.0, TestFlight. `app_open` à 10h13:36, puis `contribution_logged` à
10h14:13 — **37 secondes**. Quelqu'un a ouvert l'app et essayé la boucle
principale dans la foulée.

La même journée, un Android (le téléphone de Patrick, APK 2.1.0) a produit la
séquence complète : `app_open`, `goal_created`, `goal_deleted`,
`contribution_logged`. **Les deux plateformes remontent sur la version
publiée**, et toute la boucle est instrumentée.

### Pourquoi on a cru pendant deux jours que rien ne marchait

Rien n'était cassé. Vérifié dans l'ordre, avant de trouver :

1. Les chaînes exactes du `.env` (URL **et** clé anon) sont bien présentes dans
   le `.aab` publié — inspecté avec `strings` sur le bytecode Hermes. Un
   `grep` direct ne les trouve pas : c'est du binaire, pas du texte.
2. Cette clé accepte toujours les écritures (`201` à la demande).
3. `anon` ne peut pas lire `events_reels` (`permission denied`) — la sécurité
   tient, mais ça empêche tout diagnostic depuis l'extérieur.
4. La table `events` contenait les données depuis le début. **Le Table Editor
   de Supabase trie par clé primaire CROISSANTE** : la première page montre
   les lignes les plus anciennes. En restant sur cette page, la dernière date
   visible était le 10/08 — d'où la conviction que plus rien n'arrivait. Les
   événements récents étaient à la dernière page.

**La leçon** : deux outils ont menti par omission, chacun à un bout. La vue
`events_reels` masque des lignes par conception ; le Table Editor en affiche
l'autre extrémité. Réflexe à prendre pour tout diagnostic :

```sql
select count(*) as total, max(created_at) as plus_recent from public.events;
```

Sur la table BRUTE, avec un tri explicite. Jamais sur la vue, jamais en se
fiant à l'ordre par défaut d'une interface.

### Écart corrigé au passage

`scripts/retention-queries.sql` annonçait 3 exclusions ; la base n'en
appliquait qu'**une**. Le script avait été mis à jour le 19/08 mais jamais
exécuté dans Supabase. À ne pas refaire : modifier le fichier ne change rien
tant qu'on ne lance pas le `create or replace`.

---

## 📡 2026-09-16 — Quelques installations par APK au Gabon, NON exclues

Deux ou trois personnes au Gabon passent par un VPN, ce qui rend l'app
indisponible depuis le Play Store. Le Gabon est pourtant bien ciblé par la
piste Alpha (vérifié en console) : c'est la région détectée qui est faussée,
rien à corriger côté distribution. Elles reçoivent donc l'APK directement
(build `preview` 2.1.0, versionCode 4).

**Décision de Patrick : on ne les exclut pas de `events_reels`** — elles sont
minoritaires. À garder en tête en lisant la rétention : ces `install_id`
correspondent à des proches sollicités pour donner un avis, pas à des
utilisateurs qui ont découvert l'app d'eux-mêmes.

⚠️ Rappel : **les installations par APK ne comptent pas** dans les 12 testeurs
exigés par Google. Seule la piste Alpha fait avancer ce compteur.

---

## 🐞 2026-09-16 — Prénom du premier lancement : corrigé, mais PAS dans le 2.1.0 en ligne

**Si un testeur signale que son prénom ne s'affiche pas, c'est ça. Ne pas
rouvrir l'enquête : le correctif est déjà sur `v2` (commit `b2dd748`).**

Le prénom saisi à la première connexion n'était pas enregistré. `commitName()`
n'était appelé que par le `onBlur` du champ, jamais par le bouton « Continuer »
— et `onBlur` ne se déclenchait pas, l'écran défilant en
`keyboardShouldPersistTaps="handled"` (le tap est consommé par le bouton sans
retirer le focus). Quiconque tapait son prénom puis touchait directement
« Continuer » perdait sa saisie. Ceux qui touchaient ailleurs avant ne voyaient
rien.

**Décision de Patrick (16/09) : pas de 2.1.1, on groupe avec la prochaine
livraison.** Le bug est bénin — rien n'est perdu, le prénom se renseigne depuis
le menu, le parcours n'est pas bloqué. Mais il touche le tout premier geste d'un
nouvel utilisateur, donc **tous les testeurs recrutés d'ici la prochaine version
le rencontreront**. Une phrase dans le message de recrutement suffit à le
désamorcer.

---

## ✅ 2026-09-15 — 2.1.0 EN LIGNE sur la piste Alpha

Examen Google terminé, puis publication le **15/09 à 10:27**. La piste
« Tests fermés — Alpha » est active sur MMG 2.1.0, 14 pays/régions,
« disponible pour certains testeurs ». Côté Apple, la vérification est
également passée.

⚠️ **Piège à connaître pour les prochaines fois** : le compte a la
**publication gérée activée**. Une version approuvée par Google n'est donc
PAS diffusée automatiquement — elle reste en attente dans « Vue d'ensemble
de la publication » jusqu'à ce qu'on clique « Publier ». Et la console ne
le signale pas : elle change juste le titre de la section, de « en cours
d'examen » à « prêtes à être publiées ». On a cru attendre Google pendant
deux jours alors que la balle était dans notre camp. Le réglage se désactive
dans le menu déroulant du même écran.

📌 À vérifier avant le **30/09/2026** : une notification du 08/09 rappelle
d'enregistrer les applications pour la **validation des développeurs
Android**. Le tableau de bord affiche « toutes vos applis ont bien été
enregistrées », donc c'est probablement fait — mais l'échéance est proche et
mérite une confirmation de deux minutes.

---

## 🚀 2026-09-13 — 2.1.0 envoyé sur les deux plateformes

- **Android** : app bundle 4 (2.1.0) déposé sur la piste « Tests fermés — Alpha »,
  release « MMG 2.1.0 — test fermé », notes fr-FR, déploiement complet.
  Envoyé pour examen → *en cours d'examen*. Google annonce **jusqu'à 7 jours**,
  y compris pour un test fermé : ce n'est pas instantané, contrairement à ce
  qu'on supposait. Le bundle 3 (2.0.0) passe en « non inclus ».
  Avertissement sans gravité : pas de fichier de désobscurcissement (R8/ProGuard
  n'est pas actif sur un build Expo standard). **0 appareil perdu** — 12 477
  téléphones, 6 684 tablettes.
- **iOS** : build 2.1.0 (6) chargé sur App Store Connect, visible dans TestFlight.
  Groupes existants : « publics testers » (3 externes), « Team (Expo) » (8 internes).

⚠️ **Déséquilibre à exploiter** : ~11 testeurs côté iOS, **1 seul côté Android**.
Si une partie d'entre eux possède aussi un Android, c'est le chemin le plus court
vers les 12 inscrits — et donc vers le démarrage des 14 jours.

---

## 🚧 2026-09-13 — Le vrai goulot : 12 testeurs Play, et il y en a 1

Relevé dans la Play Console le 13/09. L'accès à la production pour un compte
personnel exige trois conditions, affichées noir sur blanc :

- [x] Publier une version de test fermé
- [ ] **Avoir au moins 12 testeurs inscrits** — *1 testeur actuellement inscrit*
- [ ] **Exécuter le test fermé avec au moins 12 testeurs pendant au moins 14 jours**

État de l'app : piste « Tests fermés — Alpha », 14 pays/régions, MMG 2.0.0
depuis le 13/08. **Audience ayant installé : 0.**

**Ce que ça corrige dans notre compréhension du tracking.** Le bloqueur
ci-dessous attend « un `app_open` d'un utilisateur réel » pour se refermer. Il
ne pouvait pas se refermer : il n'y a aucun utilisateur. Le bug des variables
d'environnement était bien réel et bien corrigé — mais même réparé, le 2.0.0
n'aurait rien remonté, faute d'installations.

Les deux causes se masquaient l'une l'autre. **Le chemin critique n'est pas
technique, c'est le recrutement** : 12 testeurs par adresse mail, puis 14 jours
consécutifs. Et ces mêmes testeurs fourniront les premiers `app_open` d'un
`install_id` inconnu — le recrutement débloque la production ET prouve le
tracking. Un seul chantier, pas deux.

⏱️ À noter : le compte de 14 jours ne démarre qu'une fois les 12 testeurs
inscrits. Chaque semaine sans recrutement retarde d'autant l'accès production.

---

## ✅ 2026-08-19 — (CLOS le 16/09) Tracking à rétablir avant le build de production

**Sans cette étape, aucun utilisateur du Store n'est mesuré — et la panne est
silencieuse : `track()` n'émet ni erreur ni trace hors développement.**

> **13/09/2026 — builds 2.1.0 terminés** (Android versionCode 4 `.aab`,
> iOS buildNumber 6 `.ipa`), depuis `v2`, avec `eas.json` et son
> `environment: production`. EAS a confirmé au build le chargement des deux
> variables Supabase — c'est précisément ce qui manquait au 2.0.0. Un APK
> `preview` a été installé et validé sur Android le même jour.
>
> C'est le premier build de production censé remonter des événements. Le seul
> point encore ouvert ci-dessous se vérifie APRÈS publication : si aucun `app_open`
> d'un `install_id` inconnu n'arrive dans les jours qui suivent, la panne n'est
> pas corrigée et il faut reprendre le diagnostic ici.

Le 2.0.0 publié le 11/08 n'a jamais envoyé un seul événement. Deux causes :

1. `.env` est gitignoré, donc jamais transmis au serveur EAS, et aucun profil
   de build ne déclarait d'`environment` → `supabase` valait `null` dans l'app
   installée.
2. La variable `EXPO_PUBLIC_SUPABASE_ANON_KEY` contenait l'URL au lieu de la
   clé (les deux valeurs faisaient 40 caractères, le prompt masque la saisie).

Corrigé côté EAS le 19/08, et vérifié sur `preview` : l'APK remonte bien
`app_open` et `goal_created`.

### Ce qu'il reste à faire

- [x] **Reporter le commit `c848372` (eas.json) sur la branche qui livre.**
      Fait le 13/09 : `v2-ui-premium` a été fusionnée dans `v2`, `eas.json`
      arrive avec. Les quatre profils y déclarent leur `environment`.
      ⚠️ `main` ne l'a toujours pas — ne pas construire depuis `main`.
- [x] Vérifier l'environnement de production avant de construire.
      Fait le 13/09 : les deux variables sont présentes sur `production`, et
      la clé anon y est identique à celle du `.env` local (46 caractères).
      L'API REST répond — insertion réelle testée, `201`.
- [x] Après publication, confirmer qu'un `app_open` d'un utilisateur réel
      arrive dans `public.events` (un `install_id` absent de la liste
      d'exclusion de `events_reels`).

### Piste pour ne plus tenir d'inventaire

La vue `events_reels` exclut les appareils de test par `install_id`, et chaque
réinstallation en crée un nouveau (trois entrées au 19/08). Un oubli fausse la
rétention sans prévenir. Le profil `preview-test` pose déjà
`EXPO_PUBLIC_MMG_TEST_TOOLS=1` : si `track()` transmettait ce drapeau en
métadonnée, une seule condition suffirait à écarter tous les builds de test.

---

## 2026-08-13 — Patrick : idées design « plus tard » (inspiré de Copilot Money)

Notées pendant la discussion UI. **Pas pour maintenant** — pistes de fond, à prioriser plus tard.

1. **Mode sombre** : à ajouter. L'app a déjà des moments sombres (overlay de confirmation,
   `PlanSummaryDark`) et une palette centralisée (`src/constants/theme.ts` → `colors`). Un vrai
   mode sombre = palette sombre + bascule de thème (clair/sombre/système). Attendu « premium »,
   cohérent avec la sobriété. Chantier de theming non-trivial.
2. **Choix du visuel de progression** : le **rond de progression** (façon Copilot Money) plaît.
   Idée plus large : proposer **plusieurs représentations** (barre, rond, **sablier**, triangle…)
   et laisser l'utilisateur **choisir** celle qui lui parle. Personnalisation douce, on-position
   (agency, non-punitif). Le rond seul relèverait déjà l'écran principal (lié au « premium
   polish »). Aujourd'hui : `ProgressBar` dans `src/components/ui`, utilisé sur la fiche projet.

---

## 2026-08-14 — Lot premium (1/2) livré : polices + anneau de progression

Charte fournie par Patrick (Figma + autre IA) intégrée : fond `#F9F6F0`, accent `#C04A31`,
Playfair Display (titres) + Inter (reste), `ProgressRing` (SVG animé) qui remplace la barre
linéaire sur l'écran projet. Vérifié FCFA + EUR à l'écran, 11 suites vertes. Commit `cc18ea3`.

**Reste à faire (2/2)** : balayage Serif-Bold/Italic sur les titres de question (accueil, pays,
création de projet) et les noms de projet — fait aujourd'hui seulement au niveau
polices/couleurs/ring, pas encore appliqué aux `<Text>` eux-mêmes à travers l'app.

---

## 2026-08-13 — Avis externe (IA Google) + Patrick : refonte de l'onboarding  ⭐⭐

Suite à un descriptif complet de l'app soumis à l'IA de Google pour avis UX (voir échange
complet, résumé ci-dessous). Deux de ses points étaient basés sur une lecture **obsolète** du
produit (voir corrections) ; deux idées de Patrick issues de cet échange sont solides et à
prioriser.

### Corrections factuelles (pour ne pas ré-ouvrir un faux problème plus tard)
- **Friction budget-avant-projet** : signalée comme un risque de décrochage par l'IA, mais
  **déjà résolue** dans le code actuel — vérifié : depuis l'accueil, le CTA mène directement à
  `/onboarding/mode` puis à la création du projet ; le budget est optionnel et différé, jamais
  un préalable. La confusion venait de l'ordre des puces dans le descriptif fourni à l'IA, pas
  du produit réel.
- **Notification "Fait" qui court-circuiterait l'attachement à l'app** : **déjà résolue**,
  vérifié dans `notifications.ts`/`goal/[id].tsx` — `opensAppToForeground: true` sur les 3
  actions, et en mode guidé l'action "Fait" déclenche `confirm()` qui affiche bien l'écran
  "moment marquant" (`ConfirmationOverlay`). L'app s'ouvre et célèbre déjà, même via notif.

### ✅ Idée retenue et priorisée : retours haptiques (`expo-haptics`)
Vibration subtile au moment de "Versement fait" — sensation physique de "devoir accompli",
cohérent avec le premium sobre (pas d'effet visuel ajouté).

**Implémenté le 2026-09-13** (`src/lib/haptics.ts`, déclenché par
`confirmation-overlay.tsx`). Deux nuances : une pulsation pour un versement,
deux temps quand l'objectif est atteint — l'écran distingue déjà ces deux
moments visuellement avec la pastille « Objectif atteint ».

⚠️ **Périmètre volontairement étroit** : rien ne vibre ailleurs. L'effet vient
de la rareté, et une app qui vibre à chaque appui se fait désactiver. Un test
(`test-design.mjs`) vérifie que l'accueil, la création, le budget, le menu et
les dialogues n'en ont pas — c'est la dérive à laquelle il faut résister.

**Vérifié sur appareil (Android, APK 2.1.0, 13/09/2026)** : la vibration est
bien présente au versement. C'est la première confirmation réelle — jusque-là
on n'avait que l'API Vibration du navigateur.

#### 📌 Demandé pour une prochaine version : étendre aux autres actions
Patrick (13/09/2026) : étendre le retour haptique aux **autres actions
importantes** — changement de nom de projet, de date, etc.

- *Analyse* : cohérent, mais c'est exactement ce que le périmètre ci-dessus
  interdit aujourd'hui, et le test le verrouille. Il faudra donc **décider une
  règle** plutôt qu'ajouter des vibrations au cas par cas, sinon on retombe sur
  l'app qui vibre partout. Piste : ne vibrer que sur ce qui **modifie une
  donnée du plan** et que l'utilisateur ne peut pas annuler d'un geste — nom,
  date cible, jour de rappel, solde réel, suppression. Et **jamais** sur la
  navigation, l'ouverture d'un écran ou d'un modal.
- *À faire en même temps* : mettre à jour la liste `screensWithoutHaptics` de
  `test-design.mjs`, qui interdit actuellement toute vibration hors
  confirmation de versement. Le test doit suivre la nouvelle règle, pas être
  supprimé — c'est lui qui empêche la dérive.
- *Nuance à garder* : trois niveaux existent déjà côté sensation (pulsation
  simple, deux temps). Une modification de réglage mérite plus discret qu'un
  versement — probablement `selectionAsync()` plutôt qu'une notification.
- *Verdict* : **prochaine version**, pas maintenant. Le 2.1.0 part comme il est.

### ⭐⭐ Idée structurante de Patrick : simplifier + inverser une partie de l'onboarding
Née en réaction à l'échange, réflexion en cours ("bon à creuser, je réfléchis en écrivant") :

1. **Retirer l'écran d'accueil actuel** ("Commencer" / "Voir un exemple" — Patrick le pensait
   déjà peu utile). Nouveau flux pour un premier lancement : **pays → écran de création du
   projet directement** (nom, objectif, délai, déjà disponible) → **projet créé** → **c'est
   SEULEMENT ENSUITE** qu'on propose de vérifier le budget, cadré comme une validation
   ("c'est beau, vérifions que c'est faisable pour toi") plutôt qu'une case du formulaire.
   *Analyse Claude Code* : cohérent avec ce qui existe déjà (budget déjà optionnel/différé),
   change surtout le cadrage et cible surtout le tout premier lancement (les retours vers un
   projet existant sont déjà directs). Risque faible, bon candidat à spécifier proprement.
2. **Double sens de calcul du plan** (idée encore à creuser, pas figée) : aujourd'hui on
   saisit toujours objectif + date → l'app calcule la mensualité. Idée : permettre aussi le sens
   inverse — l'utilisateur indique ce qu'il peut mettre de côté chaque mois → l'app dit ce qu'il
   aura et/ou quand il atteindra son objectif. *Analyse Claude Code* : plus structurant qu'il n'y
   paraît — touche le calcul (`plannedAmounts` ne résout aujourd'hui que dans un sens) et le
   diagnostic "Confortable/Juste/Trop serré", qui devrait s'exprimer différemment selon le sens
   choisi. Bonne intuition (cohérente avec le principe déjà acté "budget optionnel" — parfois on
   connaît l'objectif, parfois la capacité), mais à **spécifier avant d'implémenter**, pas un
   simple réordonnancement d'écrans.

*Verdict* : les deux idées vont dans le lot **refonte onboarding**, à traiter avec le lot
premium UI. Le point 2 nécessite une session de conception dédiée avant tout code.

---

## 2026-08-13 — Patrick : aide à l'onboarding ciblée (étiquettes contextuelles)

Idée pour une prochaine version : ajouter de petites **étiquettes/info-bulles** expliquant à
l'utilisateur ce que fait un champ, un bouton, ou une étape — **pas partout**, seulement là où
un doute peut freiner (ex. « Déjà disponible » à la création d'un projet, « Rythme » guidé,
premier écran « Coup de pouce »). Patrick est explicite : pas un tutoriel intrusif généralisé,
juste des points d'aide ciblés qui restent discrets tant qu'on ne les sollicite pas.

- *Analyse (Claude Code)* : cohérent avec le positionnement sobre — l'app a déjà quelques
  précédents (placeholders explicites, hints sous les champs comme « Aucun rappel ne partira
  avant cette date »). Le risque à éviter : sur-mettre des `?` partout et recréer le bruit qu'on
  fuit. Bon candidat pour un composant réutilisable (`InfoTooltip`/`FieldHint`) posé au cas par
  cas, pas un moteur d'onboarding générique.
- *Verdict* : à prioriser dans le lot « prochain build » (avec pays alphabétique, estimation des
  dépenses complète, et le lot premium UI). Choisir 3-5 emplacements à fort doute AVANT
  d'implémenter, plutôt que d'en semer partout.

---

## 2026-08-13 — Retours : « pas assez premium » vs positionnement sobre  ⭐ (direction UI)

Des retours trouvent l'UI **pas assez premium**. Tension à ne pas mal résoudre : le sobre est un
**choix assumé** (non-punitif, « pas une app de trading ») — on ne veut PAS lumières/animations
partout ni cartes tape-à-l'œil. Patrick n'a pas de référence iPhone, d'où la difficulté à voir la
cible.

- *Analyse (Claude Code)* : « sobre » et « premium » ne s'opposent pas — les apps les plus
  premium SONT sobres (Apple Wallet/Health, Monzo, Copilot Money, Things, Linear). Le premium
  sobre ne vient pas d'effets ajoutés mais du **soin des détails invisibles** : typographie
  (échelle de tailles, graisses, chiffres tabulaires alignés), **rythme d'espacement** (grille
  8pt, respiration), **profondeur subtile** (ombres très douces ou filets fins, pas d'ombres
  lourdes), **discipline de couleur** (gris légèrement teintés chauds, un seul accent maîtrisé),
  **cohérence micro** (rayons, alignements au pixel, cibles tactiles), et **1-2 animations
  parfaites** plutôt que partout. Le risque actuel = « plat » (peut sembler cheap) vs « minimal
  raffiné » (premium). La différence est du craft, pas du flash.
- *Verdict* : direction à travailler au **prochain build** (« lot premium polish »), en priorité
  typographie + espacement (levier le plus fort, zéro flash). Claude Code propose de produire une
  maquette avant/après d'UN écran (fiche projet) pour rendre la cible tangible avant d'implémenter.

---

## 2026-08-12 — Patrick : 2 ajustements pour la prochaine version (à grouper)

**Statut — les deux sont implémentés le 2026-09-13 sur `v2`.**

Notés pendant le lancement Play Store (les builds V2 actuels sont déjà produits → à intégrer au
**prochain build**, avec iOS build 6 + maintenance Expo 57).

1. ✅ **Pays par ordre alphabétique** : la liste du sélecteur de pays était **groupée par
   région** (Afrique centrale, Afrique de l'Ouest, zone euro, dollar). Patrick veut un **tri
   alphabétique** (plus simple à parcourir quand la liste s'allongera).
   → Fait : `COUNTRIES_ALPHABETICAL` dans `src/lib/currency.ts`, consommé par
   `src/components/country-list.tsx`. `COUNTRIES` garde son ordre par zone monétaire (il
   documente les devises couvertes) et le pré-remplissage depuis la locale est intact.
   Le tri passe par un repli d'accents explicite, sans `Intl` : sinon « Côte d'Ivoire » et
   « États-Unis » partaient en fin de liste. Le même repli rend la **recherche insensible aux
   accents** — « senegal » trouve « Sénégal », ce qui ne marchait pas avant.

2. ✅ **Aide à l'estimation des dépenses = TOUTES les dépenses** : le modal
   `src/components/expense-estimate-modal.tsx` n'estimait que les **dépenses variables**.
   Patrick veut que l'aide couvre **tout** (charges fixes ET variables).
   → Fait : deux sections (5 postes de charges fixes, 5 de dépenses variables), chacune avec
   son sous-total, qui remplissent les deux champs de l'écran Budget.
   Règle retenue : **une section laissée vide ne touche à rien**. Quelqu'un qui connaît déjà
   ses charges fixes et vient estimer ses courses ne doit pas les voir écrasées par un zéro.

---

## 2026-08-10 — Patrick : retrouver où l'épargne de chaque projet est gardée

**Statut V2 — implémenté le 2026-08-10** : un repère **Où ?** apparaît discrètement sous le
montant de la fiche projet. Il ouvre une petite fenêtre à un seul champ libre et reste entièrement
facultatif ; aucune étape n'a été ajoutée à la création.

- *Besoin* : lorsqu'une personne suit plusieurs projets, elle peut oublier si l'argent se trouve
  sur un compte épargne, un portefeuille mobile, un autre compte ou en espèces.
- *Décision* : saisie libre plutôt qu'une liste figée. Une liste réellement fiable devrait être
  adaptée et maintenue par pays, banque et opérateur ; le champ libre couvre immédiatement
  « Livret A », « Airtel Money », « Orange Money », « espèces » ou tout autre support.
- *Confidentialité* : cette indication reste dans le stockage local du projet et n'est jamais
  jointe aux événements Supabase.

---

## Cosmétique — à grouper sur le prochain build

- ~~**2026-08-10 (Patrick)** : les très gros montants FCFA (> 100 000 000) étaient mal affichés —
  « FCFA » cassait sur deux lignes, et l'en-tête « Mis de côté / restants » se décalait /
  tronquait dès que le montant mis de côté était lui aussi élevé (deux gros nombres côte à
  côte).~~ **✅ CORRIGÉ (Claude Code, Session 43)** : helper déterministe `fitFontSize`
  (`format.ts`) + en-tête projet passé en disposition verticale (gros montant pleine largeur).
  Vérifié à l'écran (150 000 000 / 12 187 500 FCFA), non-régression euro OK, tests + tsc verts.

- **2026-07-24 (n=1)** : les points de « Un projet. Un geste par mois. » (accueil) trouvés un
  peu secs. Ponctuation volontaire (rythme slogan). Alternative si on change : virgule
  (« Un projet, un geste par mois. »), plus douce. Fichier : `src/app/home.tsx`. Ne changer
  que si le retour se répète. Cosmétique, sans effet sur la mesure.
  - **Intégré V2 — 2026-08-10** : formulation adoucie dans le Lot B groupé avec le
    multi-devises.
- ~~**2026-08-XX (Claude Code — vérif Lot A)** : l'écran Exemple réutilisait les chiffres euro
  relabellés en FCFA (« 3 500 FCFA » ≈ 5 €), magnitude irréaliste pour un public gabonais.~~
  **✅ CORRIGÉ (Claude Code)** : `example.tsx` a désormais un jeu de figures par devise —
  FCFA réaliste (objectif 2 000 000, 220 000/mois, reste 1 100 000, cohérent : cible − déjà =
  reste, mensualité × 5 = reste, mensualité ≤ capacité → Confortable). EUR inchangé, tsc OK,
  vérifié à l'écran (Gabon → FCFA, France → EUR), zéro erreur console.
- **2026-07-24 (Patrick)** : jour de rappel « le 1 » → « le **1er** » (règle FR : seul le
  jour 1 prend l'ordinal ; les jours 2-31 restent cardinaux « le 2 », « le 3 »…). Fichiers :
  `src/components/plan-summary.tsx` et `src/app/goal/[id].tsx`. À inclure au prochain build.
  - **Intégré V2 — 2026-08-10** : helper commun `formatReminderDay()` appliqué au
    récapitulatif, à l'écran projet et à la comparaison Avant → après.

---

## 2026-07-24 — Ami de Patrick (installation APK Android, n=1)

Contexte : premiers retours d'un proche. Aucune friction ni bug signalé (bon signe : le cœur
a assez bien marché pour qu'il se projette en v2). Les 4 idées vont toutes vers l'expansion.

1. **Version anglaise**
   - *Analyse* : aucun testeur actuel (forums FR) concerné. Infra multilingue à maintenir
     pendant une phase qui doit rester stable. Question d'expansion, pas de test.
   - *Verdict* : après test, faible priorité, conditionné à l'ambition internationale.

2. **Accroches pour faire revenir (type Duolingo, relances)**
   - *Analyse* : ⚠️ risque direct pour la MESURE — fabriquer de l'engagement artificiel
     corromprait le signal de rétention qu'on cherche à mesurer. Contredit le positionnement
     acté (non-punitif, sobre, « pas une app de trading »). Le mécanisme de retour existe
     déjà = le rappel mensuel, et c'est précisément ce qu'on teste.
   - *Verdict* : NE PAS ajouter pendant le test. À reconsidérer APRÈS, sobrement, seulement
     si la rétention mesurée est faible.
   - **RECADRAGE 2026-08-11 (Patrick — décision)** : le projet n'est plus un *test de rétention
     pur* mais un **mini-déploiement** (pivot FCFA, réseau Facebook, multi-pays euro + Afrique +
     USD/Belgique). Dans ce cadre, **capter l'attention devient un objectif légitime**, pas
     seulement mesurer l'implication. → une relance douce est **acceptée**, incarnée par le
     **coup de pouce** (cf. [[EXCHANGES.md]] et FEATURES §Coup de pouce), en deux temps :
     - *Étape 1 (faite)* : coup de pouce **mi-cycle calendaire** (neutre pour la mesure) avec
       une batterie de messages motivants.
     - *Étape 2 (à venir)* : ajout du déclenchement **par inactivité** (Logique B) — c'est la
       vraie relance comportementale. Condition d'hygiène posée par Claude Code : **tracer le
       déclencheur (A vs B)** pour pouvoir isoler les retours provoqués et garder le chiffre de
       rétention *lisible* plutôt que silencieusement gonflé. Reste non-punitif : aucun impératif,
       aucun montant, notification discrète.
   - **Décision V2 — 2026-08-10** : un compromis borné a été retenu après l'élargissement de la
     V2. Le **coup de pouce à mi-cycle** est facultatif, désactivé par défaut, sans action,
     streak ou culpabilisation. Son ouverture et l'ouverture d'app correspondante sont exclues
     des événements de rétention ; il ne peut donc pas gonfler artificiellement le signal.

3. **Autres devises (ex. FCFA)**
   - *Analyse* : trahit une intuition de marché (Afrique francophone). Techniquement borné
     (montants formatés à la main dans `format.ts`). MAIS : dans ces marchés l'épargne passe
     surtout par le mobile money (Orange Money, MoMo), pas le virement bancaire — le modèle
     « fais le virement depuis ta banque » ne colle peut-être pas. Décision de marché cible,
     pas un simple changement d'étiquette.
   - *Verdict* : après test, si le marché Afrique francophone devient une cible. À creuser.
   - **MISE À JOUR 2026-08 (montée d'un cran)** : la campagne de recrutement en ligne (APK
     sur r/BetaTests/Discord) est un **fiasco** — quasi aucune installation. Patrick se rabat
     sur son **réseau perso Facebook** (camarades lycée/école), en majorité **francophone
     d'Afrique**. Il anticipe que beaucoup buteront sur l'**absence de FCFA**. → Le FCFA
     n'est plus une idée isolée : il révèle QUI est réellement à portée de Patrick. Signal de
     **marché**, pas de feature. Rappel : FCFA seul ne suffit pas (mobile money vs virement
     bancaire = le vrai chantier). ACTION : utiliser le post FB comme mini-étude (« l'utiliseriez-
     vous ? qu'est-ce qui manque ? comment épargnez-vous aujourd'hui ? ») et récolter les
     réponses ici avant toute décision.

4. **Simulateur de prêts (comparaison de taux) + vitrine de placements**
   - *Analyse* : viole le positionnement fondateur (« pas une banque, outil de méthode, rien
     d'autre »). Risque réglementaire réel (recommandation de produits financiers = conseil
     en investissement / courtage encadrés). Contredit la CGU (« ne constitue pas un conseil
     financier »). Décrit en réalité une autre app (agrégateur fintech). Besoin sous-jacent
     réel (« que faire de l'argent épargné ? ») mais mauvaise réponse.
   - *Verdict* : à écarter, même à long terme, sauf pivot produit assumé.

---

## 2026-07-24 — Testeur : date de début différée du projet  ⭐ (priorité haute post-test)

**Statut V2 — implémenté le 2026-08-10** : choix facultatif **Plus tard** à la création,
première ancre calculée après la date choisie, écran planifié sans action anticipée et aucune
notification avant l'activation. La rétention utilise un délai en jours dans `goal_created`
plutôt que la date exacte ; les requêtes démarrent donc la cohorte au bon moment.

Idée : pouvoir créer un projet dont le démarrage (plan + rappels) commence à une **date
future** choisie (« je m'y mets dans 2-3 mois »).

- *Analyse* : **meilleur retour reçu à ce jour** — il renforce le cœur (planifier = méthode),
  ne dilue pas le positionnement, et répond à un cas réel (projet en cours à finir, prime à
  venir…). Pas de workaround propre aujourd'hui (le « Reporter » est borné, ne saute pas des
  mois).
- ⚠️ *Piège de conception à ne PAS oublier à l'implémentation* : la « date d'activation »
  servant au calcul de rétention devra démarrer à la **date de début choisie**, pas à la date
  de `goal_created`. Sinon un « démarrage différé » ressemble à un abandon immédiat dans les
  requêtes (cf. `scripts/retention-queries.sql`, section 3) → mesure faussée. Même famille de
  piège que la notif de test.
- *Verdict* : intégré à la V2 avec compatibilité des anciens projets.

---

## 2026-07-24 — Patrick (dogfooding) : mode « épargne libre » sans budget/revenus  ⭐⭐ (insight structurant)

**Statut V2 — implémenté le 2026-08-10** : second cadre de projet, choisi avant la création.
Budget et montant conseillé sont retirés, mais l'objectif, la progression et le rappel mensuel
restent présents. Les projets libres sont exclus des réajustements budgétaires et séparés dans
les requêtes de rétention (`savingsMode=free`).

Découvert par Patrick en essayant d'utiliser l'app pour son propre cas : entrepreneur à
revenus **irréguliers et non quantifiables à l'avance**. Il « subit » des rentrées d'argent
distinctes du salaire, ne peut pas les budgéter, mais veut en mettre une partie de côté au fil
de l'eau (« comme un fichier Excel qu'on remplit quand l'argent rentre »).

- *Constat* : MMG suppose aujourd'hui un revenu régulier et quantifiable (budget → capacité
  prudente → montant conseillé). Cette hypothèse fondatrice exclut une grosse population :
  entrepreneurs, freelances, commissions, saisonniers. C'est un **second mode** possible :
  « épargne libre » = un objectif + des versements quand on peut, **sans budget imposé ni
  montant mensuel calculé**, mais **avec le rappel conservé**.
- *On-positionnement* : oui — reste méthode manuelle + rituel, pas de produit à côté. Élargit
  QUI la méthode sert plutôt que de la dénaturer.
- ⚠️ *Tension stratégique* : si on retire budget + montant conseillé, qu'est-ce qui distingue
  MMG d'un simple tableur (que Patrick cite lui-même) ? Réponse : le **rituel** (rappel qui
  fait revenir) + la visualisation de progression. → en mode libre, GARDER le rappel, sinon
  MMG *devient* l'Excel.
- ⚠️ *Piège mesure* : l'épargnant irrégulier verse par à-coups (gros dépôt ponctuel, puis
  rien). Il peut être fidèle sans coller à la cadence mensuelle → risque de passer pour un
  abandon dans la métrique actuelle. À gérer si ce mode est développé.
- *Verdict* : après test (gel), **priorité stratégique haute** — remet en cause l'hypothèse
  « tout le monde a un revenu régulier à budgéter ». Possiblement le retour le plus structurant
  reçu. À croiser avec les données de rétention (les revenus irréguliers churnent-ils plus ?).
