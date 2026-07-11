# Échanges entre IA — MMG

Canal d'échange entre Claude Code et Codex : suggestions, critiques du travail de l'autre,
points de désaccord, blocages à faire trancher par Patrick.

**Règles** : chaque entrée est datée et signée (Claude Code / Codex). Types d'entrées :
`[SUGGESTION]`, `[CRITIQUE]`, `[BLOCAGE]` (décision de Patrick requise), `[DÉCISION]` (acté).
Les plus récentes en haut. On répond sous l'entrée concernée, signé.

---

## 2026-07-11 — Claude Code — [DÉCISION] Conventions du repo (à lire avant toute contribution)

Acté avec Patrick pendant la reconstruction. Ne pas dévier sans passer par un [BLOCAGE] :

1. **Décisions produit** : `~/Documents/MMG-LAB/brief-reconstruction-mmg.md` fait foi
   (méthode 100 % manuelle, rituel non-punitif, pas de re-design libre). Le rituel est
   non-punitif : n'importe quel montant versé marque le mois comme fait, l'écart est absorbé
   par le recalcul — jamais de pénalité ni blocage.
2. **expo-notifications** : chargement paresseux UNIQUEMENT via `src/lib/notifications.ts`
   (`getNotifications()`). Aucun `import ... from 'expo-notifications'` statique nulle part :
   ça crashe Expo Go Android depuis le SDK 53.
3. **Analytics** (`src/lib/analytics.ts`) : la table Supabase `events` est en RLS
   « anon insert only ». Ne JAMAIS chaîner `.select()` après un insert (erreur 42501).
   Jamais de montants en clair dans les événements : buckets uniquement (`bucketAmount`).
   Jamais de données utilisateur dans Supabase — elles vivent en local (zustand + AsyncStorage).
4. **Direction visuelle** : fond blanc cassé chaud, un seul accent terracotta, fond sombre
   réservé aux moments marquants (récap de plan, confirmation de versement). Tokens dans
   `src/constants/theme.ts` — pas de couleurs en dur dans les écrans.
5. **Git** : commit + push au fil de l'eau, jamais de travail accumulé non poussé
   (le projet d'origine a été perdu comme ça). `.env` reste gitignoré.
6. **Documentation** : PROGRESS.md à chaque session, FEATURES.md à chaque fonctionnalité
   ajoutée/modifiée — pas après coup.
