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

## 🔥 2026-11-01 — Revue complète par un développeur (Bénin, n=1, démo écran partagé)  ⭐⭐⭐

Premier retour d'un **profil technique** (développeur, Bénin — zone XOF, déjà couverte).
Démo de 44 min en écran partagé, l'app tournant **sur le PC de Patrick (simulateur)**, pas
sur un téléphone. Source : `Point MMG DAVI BENIN_original.txt` (transcription automatique
**très dégradée** — une partie des remarques ci-dessous est une **reconstruction**, marquée
« ⚠️ à confirmer » quand le sens exact reste incertain).

C'est le retour le plus dense reçu à ce jour, et le plus inconfortable : il attaque **deux
décisions structurantes déjà prises et livrées**. Chaque point a été **vérifié dans le code**
avant d'être qualifié — aucun n'est un faux problème (contrairement à l'avis IA du 13/08).

> ⚠️ **Biais à garder en tête** : c'est exactement le profil que Patrick disait vouloir éviter
> (cf. 39:41 de l'échange — « je ne voulais pas que ce soit des gens trop techniques, ils vont
> tester l'application, pas le produit et l'idée »). Il teste effectivement beaucoup la
> mécanique. Mais ses deux points structurants, eux, portent bien sur le produit.

### ⭐⭐⭐ 1. « La création de projet ne peut pas être dans le parcours initial »

Son point le plus insistant, répété six fois entre 04:54 et 06:40 :

- « Il faudrait que la personne… il faut la créer **vous d'abord**, avant de commencer à lui
  parler de créer un projet. »
- « Une page d'accueil où il atterrit. Pas de création de projet en même temps dans le
  processus d'inscription, ou dans le parcours initial. Il faudrait que ça soit **séparé**. »
- « La personne qui vient d'arriver tombe dans un projet créé… ça ne marche pas,
  **l'espérance est déjà gâtée**. »
- « Il peut créer un projet **à tout moment**. Mais pas dans le parcours initial. »

*Vérifié* : il a raison sur les faits. `src/app/index.tsx:32` — aucun projet ⇒
`Redirect` direct vers `/onboarding/new-goal`. Premier lancement = **pays → formulaire de
création**. Il n'y a ni écran d'accueil, ni écran de présentation.

*Analyse* : **c'est le point dur.** Ce flux n'est pas un oubli, c'est la décision ⭐⭐ du
13/08 (voir entrée « simplifier + inverser une partie de l'onboarding ») — retirer l'écran
d'accueil pour réduire le parcours au minimum. Patrick l'a défendue en direct (05:42 :
« l'idée c'était de réduire le parcours utilisateur le plus possible »), le dev n'a pas cédé.

Les deux ont un argument valable et **ils ne parlent pas de la même chose** :
- Patrick optimise le **coût** du premier pas (moins d'écrans = moins d'abandon).
- Le dev optimise la **compréhension** avant le premier pas (on me demande un montant cible
  alors que je ne sais pas encore ce qu'est cette app).

Ce ne sont pas des positions réconciliables par compromis mou : c'est à **arbitrer sur
données**. Et la donnée existe, ou presque — c'est précisément ce que le tracking mesure.
`goal_created` suivant de près `app_open` = le flux court fonctionne ; `app_open` sans
`goal_created` = il perd des gens à l'écran de création. **À regarder avant de décider.**
Aujourd'hui l'échantillon est trop petit pour trancher (1 appareil actif/mois).

*Verdict* : **ne rien changer maintenant.** Ouvrir la question quand il y aura assez
d'installations pour lire le taux de chute à l'écran de création. Si on devait bouger, la piste
la moins coûteuse est son point 2 ci-dessous (un seul écran de présentation), pas une refonte.

### ⭐⭐ 2. Un écran de présentation avant tout (09:16)

« Une fois ouvert, on passe de l'attention à l'écran de [création], alors qu'il faut un écran
de présentation qui explique la fonctionnalité — **même si c'est un seul écran** qui présente
brièvement l'application. »

*Vérifié* : il n'existe pas. `onboarding/` ne contient que `country`, `budget`, `new-goal`.

*Analyse* : **la version faible et peu coûteuse du point 1**, et de loin la plus défendable.
Un écran, un paragraphe, un bouton — ça ne rallonge pas vraiment le parcours (c'est un tap,
pas un formulaire) et ça répond à l'objection « je ne sais pas où je suis » sans renoncer au
flux court.

**Et l'écran existe déjà.** `src/app/example.tsx` fait exactement ce travail — Patrick le lui
a montré pendant la démo (27:07 : « tu peux voir un exemple d'un projet ? ça t'explique
l'objectif… »). Mais il n'est atteignable que depuis le menu (`menu-modal.tsx:192`), donc le
dev ne l'a découvert **qu'à la 27ᵉ minute**, dix-huit minutes après avoir réclamé un écran de
présentation. L'explication n'est pas absente : elle est hors du chemin.

*Verdict* : **meilleur candidat du lot**, à spécifier pour la refonte onboarding. Faible
risque, répond à une objection réelle, et probablement **sans écrire d'écran** — reste à
décider comment le proposer au premier lancement (un lien discret sous le formulaire plutôt
qu'une étape imposée, pour ne pas rallonger le parcours que le point 1 défend).

### ⭐⭐⭐ 3. Tout-local = perte de données à la désinstallation (02:35 → 04:54, repris 14:23)

Le sujet sur lequel il est revenu le plus souvent après le point 1.

- « Il faut que l'application **suive à la désinstallation**… qu'elle demande de sauvegarder
  en base. Et non local. »
- « Quelqu'un suit un projet sérieusement, il tient les étapes, et après **recommencer à
  zéro** — ça ne marche pas. »
- Deux pistes proposées : (a) **une inscription minimale, le mail seul suffit** ;
  (b) **deux modes explicites, local ou sauvegardé, c'est l'utilisateur qui décide**.

*Vérifié* : exact. `src/lib/store.ts` persiste tout dans AsyncStorage (`mmg-store-v1`), et
Supabase ne reçoit **que** des événements d'usage — jamais un montant, jamais un projet
(`analytics.ts` : « AUCUNE donnée liée au montant n'est transmise »). Désinstallation, perte
ou changement de téléphone ⇒ **tout est perdu, définitivement**. Il n'y a même pas d'export.

*Analyse* : c'est le retour le plus **sérieux** du lot, parce qu'il ne porte pas sur un écran
mais sur une promesse. Une app d'épargne sur 24 mois qui perd 24 mois d'historique, c'est un
défaut de conception, pas une préférence. Et c'est **la rançon directe** du choix « pas de
compte » — choix lui-même bien fondé (Patrick, 02:44 : les gens n'ouvrent pas un compte pour
une app qu'ils ne connaissent pas ; le dev l'a d'ailleurs **validé**, 03:19).

Donc le vrai sujet n'est pas « compte ou pas compte », c'est : **comment ne pas perdre les
données sans exiger un compte à l'entrée ?** Trois niveaux, du moins cher au plus cher :

1. **Export / import d'un fichier** (JSON ou presse-papiers), depuis le menu. Zéro backend,
   zéro compte, zéro RGPD supplémentaire. Ne protège pas du téléphone perdu, mais couvre le
   changement d'appareil et la désinstallation volontaire. **Quelques heures de travail.**
2. **Sauvegarde système** (iCloud / Android Auto Backup). À vérifier : AsyncStorage *peut*
   être inclus dans la sauvegarde Android, mais ce n'est ni garanti ni contrôlable, et ça ne
   se teste pas honnêtement sans deux appareils. À ne pas annoncer à l'utilisateur.
3. **Compte + sauvegarde optionnelle** (sa proposition). Change la nature du produit :
   auth, RLS sur des données personnelles, politique de confidentialité à réécrire,
   synchronisation et conflits. **C'est un chantier, pas un correctif.**

*Verdict* : le niveau 1 est **le bon prochain pas** et il est quasi gratuit — à mettre dans
le lot de la prochaine livraison. Le niveau 3 est à garder comme direction, pas comme tâche.
À noter que ça rejoint la V2 « connectée au mobile money » déjà évoquée (35:41) : le compte
viendra de toute façon avec elle, autant ne pas le bricoler avant.

### ⭐⭐ 4. Montant mensuel : laisser saisir le sien — **2ᵉ occurrence, motif confirmé**

- 19:13 : « Pourquoi des montants prédéfinis **sans explication**, alors que tu peux même pas
  personnaliser ? »
- 20:16 : « En plus de lui proposer, il faut **lui permettre de mettre lui-même son montant**. »
- 20:42 : « Vous ne trouverez pas avec vos options cadrées toutes les positions. »

*Vérifié* : exact et c'est structurel. `new-goal.tsx` ne propose que `RHYTHMS`
(stable / progressif / régressif) et le montant est **toujours dérivé** de
cible − disponible ÷ mois (`plannedAmounts`). **Aucun champ ne permet de dire « je veux mettre
X par mois »**. De plus les trois rythmes sont eux-mêmes cachés derrière « Options avancées ·
rythme » (`new-goal.tsx:565`), donc l'utilisateur voit un montant tomber du ciel sans voir d'où
il vient — ce qui explique précisément son « sans explication ».

*Analyse* : 🔁 **C'est mot pour mot le « double sens de calcul » que Patrick avait proposé lui
même le 13/08** (entrée ci-dessous, point 2 : « l'utilisateur indique ce qu'il peut mettre de
côté chaque mois → l'app dit quand il atteindra son objectif »). **Deux personnes
indépendantes, à trois mois d'écart, sur le même manque.** Le journal demande de chercher les
motifs récurrents : en voici un, et c'est le seul du lot.

Le diagnostic d'août reste valable et n'est pas allégé par cette confirmation : ça touche
`plannedAmounts` (qui ne résout que dans un sens) et le diagnostic
Confortable/Juste/Trop serré, qui doit s'exprimer différemment selon le sens choisi.

*Verdict* : **passe de « à creuser » à priorité haute du lot refonte**, avec une session de
conception dédiée avant tout code. Un sous-ensemble est livrable bien plus tôt et sans toucher
au calcul : **expliquer d'où vient le montant proposé** (une ligne : « calculé sur ton reste à
vivre »), et **sortir les rythmes de « Options avancées »**.

### ⭐⭐ 5. Ne pas cacher le choix du démarrage derrière « Options avancées » (15:54 → 17:08)

« Je ne pense pas bien d'aller cacher quelque chose… il faut que ça **sorte** de l'option
avancée. Ça fait partie du processus de création de projet, et je dois choisir
**consciemment** maintenant ou plus tard. »

*Vérifié* : exact. `new-goal.tsx:373-421` — « Quand veux-tu commencer ? » (Dès maintenant /
Plus tard) est bien dans le bloc replié `advancedOpen`, fermé par défaut (`:90`).

*Analyse* : **il a raison, et c'est le point le moins cher du lot.** Le démarrage différé
n'est pas un réglage d'expert : c'est le retour ⭐ du 24/07 (« date de début différée »,
priorité haute post-test) qu'on a implémenté puis **rangé dans un tiroir fermé**. Résultat :
la fonctionnalité existe et personne ne la voit, donc elle ne sert à rien. Son argument sur le
défaut silencieux est juste aussi — « Dès maintenant » s'applique sans que l'utilisateur
sache qu'il a choisi.

*Verdict* : **à faire au prochain build.** Déplier le bloc, ou le remonter hors du toggle.
Modification locale, aucun risque, répond en plus à un retour antérieur.

### ⭐⭐ 6. L'heure du rappel n'existe pas (22:04 → 22:57)

« Est-ce qu'on peut le rappeler **à une heure donnée** ? À quel moment du jour ? Rappel le 2 :
demain 1 h, demain 10 h ? Il faut savoir. » Puis : « change l'heure ».

*Vérifié* : **codée en dur à 9 h 00**, six fois dans `src/lib/plan.ts`
(`:163`, `:181`, `:209`, `:393`, `:404`, `:444`). Jamais affichée, jamais réglable.

*Analyse* : deux défauts distincts, de coûts très différents.
- **L'heure n'est pas dite.** L'app promet « rappel le 2 de chaque mois » et ne dit pas quand
  dans la journée. Corriger le texte coûte une ligne et devrait être fait.
- **L'heure n'est pas réglable.** Plus lourd (six points d'appel, plus la reprogrammation des
  notifications déjà planifiées), et 9 h est un défaut défendable. Patrick a proposé en direct
  de la calquer sur l'heure de création du projet (22:24) — à écarter : elle serait alors
  invisible *et* arbitraire, le pire des deux.

*Verdict* : **afficher l'heure** dans le lot cosmétique du prochain build. **Rendre l'heure
réglable** : prochaine version, sous forme d'un réglage par projet à côté du jour.

### 🐞 7. Aucune borne sur le montant cible (07:35 → 07:51, repris 10:05)

Il a saisi un montant absurde ; rien ne l'a arrêté. Patrick, en direct : « il faut qu'il y ait
une limite, ouais ».

*Vérifié* : `new-goal.tsx:194-211`, `validate()` n'exige que `parsedTarget > 0`. Pas de
plafond, et pas de `maxLength` sur le champ. Un montant délirant traverse donc tout le
calcul de plan et l'affichage.

*Verdict* : **vrai défaut, correction simple.** Plafond par devise (l'ordre de grandeur n'est
pas le même en XAF et en EUR) + message d'erreur. Prochain build.

### 🐞 8. Aucune limite de longueur sur le nom du projet

Constaté par Patrick lui-même pendant la démo (23:18 : « faudra réduire, selon le nombre de
caractères »).

*Vérifié* : le champ nom de `new-goal.tsx` n'a **pas** de `maxLength`, alors que
`name-modal.tsx:62` (prénom) et `country.tsx:150` en ont un. Incohérence interne.

*Verdict* : `maxLength` sur le champ, aligné sur ce que l'affichage supporte. Prochain build.

### 🐞 9. Après un report, l'écran reparle du mois précédent — **à reproduire**

Patrick, 30:35 : « tout à l'heure on avait déjà fait un report au 2 décembre, et il parle
encore de novembre… c'est revenu à novembre et ça a sauté. En tout cas ça, c'est à revoir. »

*Analyse, non conclusive* : la piste la plus plausible est une **désynchronisation entre la
source de vérité et le champ affiché**. Les cycles font foi (`nextReminderFromCycles`), mais
l'écran projet lit le champ dénormalisé `goal.nextReminderAt`
(`goal/[id].tsx:525`, `:543`, `:572`). Ce champ *est* réécrit à chaque mutation
(`actions.ts:149`, `:254`, `:276`), donc je n'ai **pas** reproduit le défaut par lecture seule.
Deux autres suspects : `cycleToPostpone` (`plan.ts:353`) renvoie le premier cycle non soldé —
si le cycle de novembre a été soldé pendant la démo, le report a visé **décembre** sans que
l'écran le dise ; et `postponeDateLimit` (`:367`) borne alors le report à l'ancre elle-même,
ce qui rend l'action silencieusement inopérante.

*Verdict* : **à reproduire sur appareil avant de corriger** — scénario exact : jour de rappel
le 2, créer le projet, enregistrer un versement pour le cycle en cours, puis ouvrir le report.
Ne pas corriger à l'aveugle : les trois suspects demandent des correctifs opposés.

### ⭐ 10. Le champ prénom n'est pas lisible comme un champ (01:41 → 02:22)

Il est passé devant sans le voir et a cliqué « Continuer ». Sa demande : que le champ soit
**explicite**, et qu'on puisse très bien demander le prénom franchement même si ce n'est pas
obligatoire.

*Vérifié* : `country.tsx:344-345` — « Bienvenue » suivi d'une **pastille** « Ton prénom ✎ »,
puis le titre « Où épargnes-tu ? ». Aucun libellé. Le seul indice est le placeholder et un
crayon : ça se lit comme une décoration, pas comme une saisie.

*Analyse* : cohérent avec le choix « le prénom est facultatif et discret » (commentaire
`country.tsx:47`), mais le résultat dépasse l'intention — un développeur attentif ne l'a pas
vu. Un libellé court ne le rend pas obligatoire pour autant. ⚠️ Nuance à ne pas perdre : il ne
demande **pas** une étape dédiée, juste un champ qui se voie.

*Verdict* : lot cosmétique du prochain build — ajouter un libellé au-dessus de la pastille.

### ✅ Déjà corrigé, pas encore livré : le prénom du premier lancement

Constaté une fois de plus pendant la démo (21:30 et 27:43 : « ici on devrait avoir bonjour
avec le prénom »). **Corrigé le 16/09** (`b2dd748`, `country.tsx:116`) mais absent du 2.1.0 en
ligne — voir l'entrée du 16/09. **Troisième signalement du même défaut** : à livrer.

### 🧠 Sa remarque sur la méthode (06:40)

« Quand on n'a pas une expertise poussée derrière, [l'IA] va te convaincre que c'est bien
alors que ça ne l'est pas. »

À noter sans complaisance : sur ce lot précis, il a **raison trois fois sur trois** là où il
attaque une décision validée en interne (flux initial, montants prédéfinis, options
avancées) — et deux de ces trois décisions avaient déjà reçu un avis IA favorable ou neutre.
Le journal note aussi (13/08) que l'avis IA de Google s'était trompé **deux fois sur quatre**.
C'est un argument pour le garder dans la boucle, pas un argument contre l'outil.

### ⚠️ À re-vérifier : artefacts de la démo, pas forcément des défauts

L'app tournait **sur PC en simulateur**, et plusieurs blocages constatés en direct ont été
attribués à ça par Patrick lui-même (10:15 : « c'est peut-être parce que c'est sur le PC »,
30:11 : « j'arrive pas à écrire, je suis sur le PC »). Ne pas ouvrir de ticket sur ces points
sans les rejouer sur un téléphone :
- l'horizon de temps qui semblait bloqué sur 6 mois (09:36) — les chips 3 m / 1 an / 2 ans /
  Date précise existent bien (`new-goal.tsx:45-51`), c'est un `ScrollView` horizontal dont
  l'amorce de défilement se voit mal ⇒ plutôt un **défaut d'affordance** qu'un blocage ;
- la saisie de texte impossible dans certains champs ;
- les clics sans effet sur le calendrier.

### 📌 Divers

- **Historique vs échéancier** (23:39, 26:10) : il ne voyait pas le lien entre les deux, et
  demandait l'heure dans l'historique. ⚠️ Transcription trop dégradée pour en tirer une
  demande précise — **à redemander**.
- **Cible confirmée** : il n'a pas contesté le positionnement (personnes ayant déjà un
  revenu, avec un projet daté), ni le tout-manuel comme point d'entrée.
- **Il pousse implicitement à mesurer plus** (14:43 : « même les montants choisis ? », surpris
  de la réponse négative). *À ne pas suivre* : `analytics.ts` exclut les montants **par
  principe** (« AUCUNE donnée liée au montant n'est transmise, ni exact, ni tranche »), et
  c'est ce qui permet de dire honnêtement qu'aucune donnée financière ne quitte le téléphone —
  argument d'entrée bien plus précieux qu'une mesure plus fine. La rétention se lit très bien
  avec les seuls types d'événements. À distinguer soigneusement du point 3 : **sauvegarder pour
  l'utilisateur** et **collecter pour soi** sont deux choses opposées, et seule la première est
  demandée.

### 🎯 Le concurrent qu'il citait : **Paykko** (lien reçu le 01/11) — et ce qu'on y trouve

`paykko.com` · Play Store `com.paykko` · **Gara SAS** · **100 k+ téléchargements**,
**4,5 ★ sur 1 520 avis**, mise à jour le **29 oct. 2026** (donc très actif). Ses chiffres
annoncés sont exacts, vérifiés sur le Store.

**Ce que c'est** : la **tontine digitale** adossée au Mobile Money (MTN, Orange Money, Wave,
Free Money…), via des partenaires de paiement certifiés (Kkiapay, InTouch), dans 10+ pays.
L'argent transite réellement, donc : vérification d'identité obligatoire (carte CIP), retraits,
reçus. Le modèle est un **score de crédit** construit sur la régularité d'épargne, qui ouvre
l'accès au crédit via des microfinances partenaires. Marketplace annoncée.

**Ce n'est pas le même produit que MMG**, et c'est important de ne pas se laisser
impressionner par le « 100 000 téléchargements » : Paykko **détient l'argent**, MMG n'y touche
pas. D'où des coûts que MMG n'a pas (KYC, conformité, partenaires financiers, support sur des
fonds réels — un avis dit « j'ai eu peur pour mon argent ») et une confiance que MMG n'a pas à
demander. L'épargne individuelle est d'ailleurs une **arrivée récente** chez eux (« ✨ NOUVEAU :
ÉPARGNE INDIVIDUELLE »), explicitement positionnée comme un **« tremplin vers le groupe »** :
c'est un entonnoir vers la tontine, pas le produit.

**🔥 Et voici le point à retenir.** Avis d'un utilisateur Paykko (elom ATAYI, 28/08/2026,
jugé utile par 12 personnes) :

> « ça serait vraiment cool si vous ajoutez une **épargne à volonté**, c'est-à-dire on peut
> épargner la somme qu'on veut et quand on le veut sans forcément avoir de date précise ou une
> somme fixe »

Réponse officielle de Gara SAS, le lendemain :

> « il n'y a pas d'option pour épargner la somme que vous voulez, **c'est pas le rôle de
> Paykko**. »

**C'est exactement le mode « Épargne libre » de MMG** — l'insight ⭐⭐ du 24/07 issu du
dogfooding de Patrick. Demandé par un utilisateur du leader du marché, et **refusé par
principe**. C'est la première validation externe de ce mode, et elle vient du terrain, pas
d'un avis d'ami. À noter aussi : le même avis réclame de la **souplesse sur la vérification
d'identité** — un besoin que MMG satisfait par construction, puisqu'il n'y a pas de compte.

⚠️ **Le revers, à ne pas se cacher** : la V2 « connectée au mobile money » (évoquée à 35:41 de
l'échange) emmène MMG droit **dans la catégorie de Paykko**, où ils ont 100 k installations,
les intégrations de paiement, les partenaires microfinance et deux ans d'avance. Tant que MMG
ne touche pas à l'argent, il joue sur un terrain que Paykko a explicitement refusé d'occuper.
C'est un argument sérieux pour **soigner le tout-manuel comme un produit à part entière**
plutôt que comme une étape vers la V2.

### 📱 Parcours de premier lancement de Paykko — relevé le 01/11 (20 captures)

Patrick a installé l'app et créé un compte. Séquence complète observée :

1. **4 écrans de présentation** (tontine · score de fiabilité · traçabilité des transactions ·
   parrainage), puis CTA **« Créer un compte »**.
2. **Numéro WhatsApp** → **code OTP à 6 chiffres** reçu sur WhatsApp.
3. **Nom, prénom, genre**, avec une alerte « doivent correspondre à votre pièce d'identité ».
4. **Mot de passe** (5 critères).
5. Écran **« Votre compte a été créé avec succès ! »**.
6. **Atterrissage sur un accueil** : solde masqué, « Nouvelle tontine » / « Rejoindre tontine »,
   bandeau « Vérification d'identité » (le retrait est bloqué tant qu'elle n'est pas faite),
   bandeau de parrainage, bouton flottant « Tutoriel ».
7. **Modale de bienvenue** : « Paykko t'offre 1000 FCFA » si tu termines une épargne de
   10 000 FCFA → « Je lance ma première épargne ».
8. **Bulle d'aide contextuelle** pointant « Nouvelle tontine » : « Créons ta toute première
   épargne avec Paykko », avec **« Passer » / « Suivant »**.
9. Création en **3 étapes**, dont « à quelle fréquence souhaitez-vous déposer ? »
   (jour / semaine / mois), **« Par jour » pré-sélectionné**.

**Le dev ne décrivait pas une théorie : il décrivait ce parcours.** Présentation d'abord,
compte ensuite, accueil, puis invitation à créer — avec une porte de sortie. Sur la forme, il
avait donc un modèle en tête, et ce modèle existe.

#### Mais ça ne tranche pas la question (1), et il faut le dire

**Paykko n'a pas le choix d'avoir un compte** : il détient l'argent, donc OTP, nom légal et
vérification d'identité sont imposés par la réglementation, pas par l'UX. Compter les écrans
avant de voir quoi que ce soit : **huit**. C'est exactement ce que Patrick voulait éviter — et
Paykko peut se le permettre parce qu'un utilisateur qui vient confier de l'argent accepte la
procédure. MMG ne demande rien de tout ça, donc **n'a aucune raison d'imposer un compte**, et
leurs 100 k installations ne prouvent pas que le parcours long fonctionne : on ne voit pas leur
taux d'abandon. **La donnée de rétention de MMG reste le seul juge.**

Ce qui **est** transposable, en revanche, c'est le motif séparé du compte :
**atterrir sur un accueil, puis inviter à créer, avec un « Passer »**. Plus leur **bulle
d'aide contextuelle** — qui est précisément l'idée « étiquettes contextuelles » du 13/08,
ici validée par un produit à 100 k installations.

#### Ce que MMG fait déjà mieux (à ne pas copier par mimétisme)

- **Suggestions de mot de passe en clair, dérivées du prénom** (`Chris&22qc`, `Chris@39nz`).
  Prévisible et lisible par-dessus l'épaule. Mauvaise pratique franche.
- **Permission de notification demandée sur le tout premier écran**, avant d'avoir montré la
  moindre valeur. MMG la demande après la création du projet, en contexte — meilleur, et c'est
  aussi ce qui donne un taux d'acceptation plus élevé.
- **Case CGU pré-cochée** et opt-out marketing formulé en double négation
  (« Décocher ici si vous ne souhaitez pas »). Juridiquement discutable en UE.
- **Formatage monétaire brut** : « 500.0 EUR », point décimal anglo-saxon, décimale inutile —
  et un bonus annoncé en FCFA sur un compte en EUR. MMG a un module entier pour ça
  (`currency.ts` : espace fine insécable, décimales par devise, `hideZeroDecimals`).
- **Coquille** : « Bienvenu sur Paykko ! ».
- **Le plus parlant** : à la seconde où le plan est créé, l'écran affiche
  **« Tours en attente (contributions en attente des tours manqués) · Tour 01 · à payer »**
  en rouge. L'utilisateur est **en retard dès l'instant zéro**. C'est l'exact opposé de la
  doctrine MMG (« Même moins, c'est déjà bien »), et c'est le genre de cadrage qui fait
  désinstaller. À garder comme contre-exemple.
- Note d'intérêt : **« Par jour » est le défaut** de la fréquence, poussé par la bulle d'aide
  (« Commençons par des versements quotidiens »). Chaque dépôt passe par Mobile Money, donc
  par des frais d'opérateur. Le défaut n'est pas neutre.

#### Ce qui vaut d'être repris

- **Solde masqué par défaut** avec un œil pour révéler. Un téléphone se prête, en Afrique
  comme ailleurs. Peu coûteux, et cohérent avec la sobriété de MMG.
- **Bulle d'aide contextuelle avec « Passer »** — déjà dans le journal (13/08), désormais
  validée sur le terrain.
- **Compte à rebours jusqu'au prochain dépôt**. ⚠️ Chez eux il est anxiogène parce qu'adossé
  à une dette ; chez MMG il ne tiendrait que relié à un rappel, pas à un retard.

#### Deuxième série de captures (création de l'épargne, profil, OTP)

**Leur écran de création, étape 1/3** : nom de l'épargne (**pré-rempli** : « Précieux
Trésor »), « Pourquoi souhaitez-vous créer cette épargne ? » (liste déroulante, « Épargne
générale »), puis **« Choisissez une icône »** — huit emoji au choix.

- Le **nom pré-rempli** et le **motif** sont exactement les `CATEGORY_LABELS` /
  `GoalCategory` de MMG. Convergence, pas inspiration : c'est le bon motif.
- L'**icône séparée** est la seule chose qu'ils ont de plus. Mais **chez eux elle est mal
  faite** : le motif dit « Épargne générale » et l'icône sélectionnée est une **voiture**.
  Deux taxonomies qui se recouvrent et qui ne s'accordent pas. MMG dérive l'emoji de la
  catégorie (`CATEGORY_EMOJI`, `types.ts:132`) — **une seule taxonomie, rien à désynchroniser**.
  Si on ajoute un jour un choix d'icône libre, il faudra assumer de casser ce lien.

**Incohérence de vocabulaire, et elle est sévère.** Le même objet s'appelle, selon l'écran :
- « **tontine** » (accueil « Solde total des tontines », notification « Votre tontine Précieux
  Trésor est maintenant active ») ;
- « **épargne personnelle** » (titre de l'écran d'édition) ;
- « **caisse d'épargne** » (section « Mes Caisses D'épargne ») ;
- « **épargne** » tout court (« Quel nom souhaitez-vous donner à votre épargne ? »).

Et ce n'est pas qu'un mot : une épargne **solo** est annoncée comme une **tontine**, alors que
la tontine est par définition collective. MMG dit « **projet** » partout. **C'est un avantage
réel à préserver** — la cohérence du vocabulaire est ce qui fait qu'on comprend un produit
sans tutoriel, et eux ont dû ajouter un bouton « Tutoriel » flottant.

**Le profil demande 5 champs obligatoires** : nom, prénom, **adresse e-mail**, **date de
naissance**, genre. Le parcours avant de voir quoi que ce soit est donc encore plus long que
compté plus haut.

**Aucun garde-fou sur le montant, et c'est pire que chez MMG.** Le plan créé est
**500,0 EUR par jour pendant 20 jours** — soit 10 000 € — accepté sans un mot, sur un compte
dont le bonus de bienvenue est libellé en FCFA (« 1000 FCFA si tu termines une épargne de
10 000 FCFA »). Le montant a visiblement été saisi comme s'il s'agissait de francs CFA et
affiché en euros. C'est **exactement le défaut (7) relevé sur MMG** — à ceci près que chez eux
il porte sur de l'argent réel. Argument supplémentaire pour plafonner **par devise**, pas dans
l'absolu.

**Le code OTP arrive d'un expéditeur WhatsApp nommé « Gara Twilio BA »** (compte professionnel,
numéro d'origine France). Le nom de leur prestataire technique fuite dans le nom d'expéditeur,
au moment le plus sensible du parcours — celui où l'utilisateur décide s'il fait confiance.
À retenir si MMG ajoute un jour une vérification par SMS/WhatsApp : **le nom d'expéditeur fait
partie du produit**.

**Fautes supplémentaires** : « Votre tontine d'**epargne** […] est maintenant **actif** »
(accord et accent), après « Bienvenu sur Paykko ! ». Trois coquilles sur les deux seules
notifications envoyées.

#### Leur écran « Mon Compte » — trois choses que MMG n'a pas

- **Verrouillage par PIN** (« application sécurisée avec code PIN »). Même logique que le
  solde masqué, poussée plus loin. À débattre pour MMG : chez eux il protège de l'argent réel.
- **Désactiver le compte · supprimer définitivement votre compte**, depuis l'app. C'est
  **obligatoire sur le Play Store** dès qu'une app a des comptes : à intégrer d'office au
  chantier « inscription », pas à découvrir au moment de la soumission.
- **`Version 0.0.41 (72) | PROD | PLAY STORE`** en pied d'écran : version, build,
  environnement et canal de distribution d'un coup d'œil. **C'est le meilleur emprunt du
  lot.** Les deux pannes de mesure ont duré des semaines en partie parce qu'on ne savait pas
  quel build tournait chez qui. Tout est déjà disponible côté MMG (`Constants.expoConfig`,
  `TEST_TOOLS_ENABLED`) — il manque juste la ligne qui l'affiche.

Aussi : un bouton **« Noter Paykko »** (levier d'acquisition — 1 520 avis), un changement de
**langue**, et le raccourci **Tutoriel** est désactivable depuis ce menu. Et une donnée qui
remet les choses à leur place : **l'app est en version 0.0.41** avec 100 000 téléchargements.

*Note* : le compte de test a été créé avec le vrai numéro et le vrai e-mail de Patrick, donc
il est dans leur base marketing. La case d'opt-out était décochée (= il reçoit les
communications).

---

## 🗂️ 2026-11-01 — Suivi des chantiers : tout est désormais dans un tableau

Décision de Patrick (01/11), après les retours de David : **arrêter de piocher dans le
journal au coup par coup**. Tout ce qui est remonté depuis juillet est rassemblé dans un
tableau de suivi unique, avec un statut par ligne.

🔗 **https://claude.ai/artifact/JMV4BwuTYf3k125Fx3xchj**

**46 chantiers**, répartis en sept lots : Exploitation, Prochain build, À reproduire,
Prochaine livraison, Refonte onboarding, Chantiers de fond, Dette technique. Chaque ligne
porte une priorité (P0-P3), un effort (S/M/L/XL), sa source, et un **avis** — à retenir, à
débattre, à écarter — qui reste une proposition : le statut est la décision de Patrick.

Ce journal (`FEEDBACK.md`) garde son rôle : il consigne **le raisonnement** derrière chaque
retour. Le tableau consigne **l'état d'avancement**. Ne pas dupliquer l'analyse là-bas.

**Inflexion de doctrine, actée le 01/11.** Le journal posait « on note tout, on n'implémente
rien pendant le test ». Patrick la lève partiellement : *« il faut savoir s'adapter »*, et le
parcours avec présentation et création de compte existait déjà dans la version antérieure
liée au mobile money — *« ça reste l'objectif, ce qu'on construit aujourd'hui n'en est que la
porte d'entrée »*. Les retours de David ne sont donc pas un renoncement aux convictions de
départ, c'est un retour à la trajectoire. Le gel ne tient plus que sur ce qui pourrait
**fausser la mesure** (la relance par inactivité, notamment), pas sur les correctifs.

### Verdict global et horizon

**Rien n'est implémenté maintenant** — le gel des fonctionnalités tient, et ce retour est
`n=1` sur un profil technique explicitement non ciblé.

| | Quoi | Quand |
|---|---|---|
| 🐞 | Montant cible sans plafond (7) · nom de projet sans `maxLength` (8) | prochain build |
| ⭐⭐ | Sortir le démarrage des « Options avancées » (5) | prochain build |
| ⭐ | Libellé du champ prénom (10) · afficher l'heure du rappel (6a) · expliquer d'où vient le montant proposé (4 partiel) | prochain build, lot cosmétique |
| ✅ | Livrer le correctif prénom `b2dd748` | prochain build |
| 🐞 | Report qui reparle du mois précédent (9) | reproduire d'abord |
| ⭐⭐⭐ | Export/import des données (3, niveau 1) | prochaine livraison |
| ⭐⭐ | Écran de présentation (2) · heure de rappel réglable (6b) | lot refonte onboarding |
| ⭐⭐ | Double sens de calcul (4) — **motif récurrent, 2ᵉ occurrence** | lot refonte, conception d'abord |
| ⭐⭐⭐ | Création de projet hors du parcours initial (1) | **arbitrer sur les données de rétention**, pas sur un avis |
| ⭐⭐⭐ | Compte + sauvegarde serveur (3, niveau 3) | direction, avec la V2 mobile money |
| 🎯 | ~~Installer Paykko, étudier son premier lancement~~ **fait le 01/11** — ne tranche pas (1) | — |
| ⭐ | Solde masqué par défaut (œil) · bulle d'aide contextuelle avec « Passer » | lot refonte onboarding |

Le seul point à ne **pas** trancher sur conviction est le (1) : c'est une décision déjà prise,
contestée par une personne, et mesurable. Les autres ne demandent pas d'arbitrage, juste du
travail.

**Le gain inattendu de ce retour** n'est pas dans ses critiques, c'est dans le lien vers
Paykko : le leader du marché a **refusé publiquement** de faire l'épargne libre, que MMG fait
déjà. C'est le premier signal de marché du projet, et il est favorable.

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
