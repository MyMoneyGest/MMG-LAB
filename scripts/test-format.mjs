import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const source = fs.readFileSync(path.join(process.cwd(), 'src/lib/format.ts'), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const loaded = { exports: {} };
new Function('exports', 'module', compiled)(loaded.exports, loaded);

const { formatDateInput, parseDateInput } = loaded.exports;

assert.equal(formatDateInput(''), '');
assert.equal(formatDateInput('1'), '1');
assert.equal(formatDateInput('120'), '12/0');
assert.equal(formatDateInput('1207'), '12/07');
assert.equal(formatDateInput('12072027'), '12/07/2027');
assert.equal(formatDateInput('12/07/2027'), '12/07/2027');
assert.equal(formatDateInput('1a2b0c72027xyz'), '12/07/2027');
assert.equal(formatDateInput('120720271234'), '12/07/2027');

assert.ok(parseDateInput('29/02/2028'));
assert.equal(parseDateInput('29/02/2027'), null);
assert.equal(parseDateInput('31/04/2027'), null);

console.log('Tests format : masque JJ/MM/AAAA et validation calendaire réussis.');
