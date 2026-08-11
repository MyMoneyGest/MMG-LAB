import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const source = fs.readFileSync(path.join(process.cwd(), 'src/lib/nudge-copy.ts'), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const loaded = { exports: {} };
new Function('exports', 'module', compiled)(loaded.exports, loaded);

const { nudgeMessage, nudgeTitle, hashSeed } = loaded.exports;

const NAME = 'Fonds Vacances';
const principal = { goalName: NAME, isStarting: false, isFree: false };
const starting = { goalName: NAME, isStarting: true, isFree: false };
const free = { goalName: NAME, isStarting: false, isFree: true };

// Le nom du projet est toujours injecté (levier émotionnel), jamais le token brut.
for (let i = 0; i < 30; i++) {
  for (const ctx of [principal, starting, free]) {
    const message = nudgeMessage(ctx, i);
    assert.ok(message.includes(NAME), `le nom doit apparaître : "${message}"`);
    assert.doesNotMatch(message, /\{name\}/, 'le token ne doit jamais rester brut');
  }
}

// Garde-fous de contenu : aucun verbe d'action ni pointage du restant sur tout le pool.
for (let i = 0; i < 60; i++) {
  for (const ctx of [principal, starting, free]) {
    const message = nudgeMessage(ctx, i);
    assert.doesNotMatch(message, /\bverse\b|\bajoute\b|\bmets\b/i, `pas d'impératif : "${message}"`);
    assert.doesNotMatch(message, /il te reste|restant|manque/i, `pas de pointage du restant : "${message}"`);
  }
}

// Déterminisme + variété : même index => même message ; le pool n'est pas figé sur un seul.
assert.equal(nudgeMessage(principal, 3), nudgeMessage(principal, 3));
const principalMessages = new Set(
  Array.from({ length: 20 }, (_, i) => nudgeMessage(principal, i))
);
assert.ok(principalMessages.size >= 5, 'le pool principal doit offrir de la variété');

// Sélection du pool : démarrage > libre > principal.
// Un message « démarrage » n'apparaît QUE pour isStarting.
const startingCorpus = Array.from({ length: 12 }, (_, i) => nudgeMessage(starting, i)).join(' ');
assert.match(startingCorpus, /Première pierre|Le plus dur|ne fait que commencer/);
const principalCorpus = Array.from({ length: 30 }, (_, i) => nudgeMessage(principal, i)).join(' ');
assert.doesNotMatch(principalCorpus, /Première pierre/i, 'pas de message démarrage hors démarrage');

// Épargne libre : on écarte toute cible/échéance, on parle habitude.
const freeCorpus = Array.from({ length: 30 }, (_, i) => nudgeMessage(free, i)).join(' ');
assert.match(freeCorpus, /sans date limite|Pas d'objectif chiffré|vraie régularité/);
assert.doesNotMatch(freeCorpus, /un pas de plus vers|finit par arriver/, 'pas de cible en épargne libre');

// isStarting l'emporte sur isFree (le plus spécifique gagne).
const startingFree = { goalName: NAME, isStarting: true, isFree: true };
assert.match(
  Array.from({ length: 12 }, (_, i) => nudgeMessage(startingFree, i)).join(' '),
  /Première pierre|Le plus dur|ne fait que commencer/
);

// Titres : dans le set attendu, jamais « Coucou » (l'effet que Patrick voulait fuir).
for (let i = 0; i < 30; i++) {
  const title = nudgeTitle(i);
  assert.match(title, /^MMG — /, `titre attendu : "${title}"`);
  assert.doesNotMatch(title, /coucou/i, 'pas de « Coucou » en titre');
}

// hashSeed : déterministe, positif, et sensible à la graine.
assert.equal(hashSeed('install-1:24312'), hashSeed('install-1:24312'));
assert.ok(hashSeed('install-1:24312') >= 0);
assert.notEqual(hashSeed('install-1:24312'), hashSeed('install-1:24313'));

console.log('Tests coup de pouce : injection du nom, garde-fous, pools démarrage/libre, titres et hash validés.');
