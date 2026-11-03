// The overview has one title: the map's name in the top bar, a little bigger, with its summary on one
// line under it (click for all of it). No second heading sits on the map, and a map opens at 100%
// from its left edge instead of shrunk to fit; a phone still fits the whole map.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const assets = path.join(here, '..', 'skills', 'floorplan', 'assets');
const html = fs.readFileSync(path.join(assets, 'viewer.html'), 'utf8');
const bp = fs.readFileSync(path.join(assets, 'ui', '06-blueprint.js'), 'utf8');

test('the overview draws no second heading over the map where the top bar shows the title', () => {
  const rc = html.slice(html.indexOf('function renderContext('), html.indexOf("if (state.container === 'q:answer')", html.indexOf('function renderContext(')));
  assert.match(rc, /\$\('#context'\)\.classList\.toggle\('root', state\.container === 'root'\);/, 'set before any branch returns');
  assert.match(html, /\n#context\.root \{ display: none; \}/);
});

test('where the top bar hides the title (narrow windows, phones) the overview heading shows instead', () => {
  const narrow = html.slice(html.indexOf('@media (max-width: 999px), (max-width: 1279px) and (pointer: coarse) {'));
  const block = narrow.slice(0, narrow.indexOf('\n}\n'));
  assert.match(block, /\.brand #proj-name, \.brand #proj-sub \{ display: none; \}\n  #context\.root \{ display: block; \}/);
});

test('the top bar title is bigger and carries the summary under it', () => {
  assert.match(html, /<div class="bn"><div class="bn-row"><span id="proj-name"><\/span><\/div><button type="button" id="proj-sub"/);
  assert.match(html, /#proj-name \{ font-size: 17px;/);
  assert.match(html, /#proj-sub \{[^}]*white-space: nowrap; overflow: hidden; text-overflow: ellipsis;/);
  assert.match(html, /sub\.hidden = false; sub\.textContent = text;/);
});

test('one Blueprint pill on screen: in the top bar on a wide screen, in the map heading where the bar hides the title', () => {
  assert.match(bp, /document\.querySelectorAll\('\.brand \.bn-row, #context \.k'\)/);
  assert.match(bp, /#context \.bp-pill \{ display: none; \}\n    @media \(max-width: 999px\), \(max-width: 1279px\) and \(pointer: coarse\) \{\n      \.brand \.bp-pill \{ display: none; \}\n      #context \.bp-pill \{ display: inline-flex; \}/);
});

test('a map opens at 100% from its left edge; a phone fits it', () => {
  const home = html.match(/function home\(animate\) \{[\s\S]*?\n\}/)[0];
  assert.match(home, /if \(isPhone\(\)\) return fit\(animate\);/);
  assert.match(home, /const seen = \(state\.boxes \|\| \[\]\)\.filter\(\(c\) => c\.x < b\.x \+ a\.w - 8\);/);
  assert.match(home, /setT\(\{ k: 1, x: a\.x \+ 8 - b\.x, y \}, animate\);/);
  assert.match(html, /if \(opts\.keepTransform\) applyTransform\(\); else home\(false\);/);
  assert.match(html, /\$\('#z-fit'\)\.onclick = \(\) => fit\(true\);/);
});
