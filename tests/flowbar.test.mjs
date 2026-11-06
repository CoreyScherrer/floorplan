import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../skills/floorplan/assets/viewer.html', import.meta.url), 'utf8');

test('the list of flows and the playing step share one left column, one width', () => {
  assert.match(html, /#flowdock \{ position: fixed; left: 8px; top: calc\(var\(--hh, 64px\) \+ 4px\); width: min\(320px, calc\(100% - 16px\)\);/);
  assert.match(html, /<div id="flowdock" hidden><section class="fd glass" id="fd-flows" hidden>.*<section class="fd glass" id="flowbar" hidden>/);
  assert.match(html, /fm\.classList\.remove\('glass'\); fdFlows\.append\(fm\);/);
  assert.doesNotMatch(html, /#flowmenu, #legend/);
  assert.match(html, /gap: 8px; z-index: 9; \} \/\* under the bar \(10\)/, 'the bar\'s menus open over the column');
});

test('each section collapses from the arrow at its top right', () => {
  assert.equal((html.match(/<button type="button" class="fd-tog" aria-expanded="true"/g) || []).length, 2);
  assert.match(html, /#flowdock \.fd\.collapsed > :not\(\.fd-h\), #flowdock \.fd\.collapsed #flowmenu \{ display: none; \}/);
  assert.match(html, /const sec = b\.closest\('\.fd'\), shut = sec\.classList\.toggle\('collapsed'\);/);
});

test('the list stays open while a flow plays and marks the one playing', () => {
  assert.match(html, /function closeFlows\(\) \{ if \(!state\.flow\) fm\.classList\.remove\('open'\); \}/);
  assert.doesNotMatch(html, /r\.onclick = \(\) => \{ fm\.classList\.remove\('open'\); startFlow/);
  assert.match(html, /r\.classList\.toggle\('on', r\.dataset\.flow === f\.id\)/);
  assert.match(html, /\(fm\.classList\.contains\('open'\) && !state\.flow\)/, 'Escape still exits a playing flow');
  assert.match(html, /function stopFlow\(\) \{[^\n]*fdFlows\.classList\.remove\('collapsed'\)/, 'exiting a flow opens the list again next time');
  assert.match(html, /\$\('#fb-body'\)\.innerHTML = `<div class="ft"><div class="fk">\$\{h\(f\.title\)\}<\/div>/, 'the step card names its flow');
  assert.match(html, /freeArea\(\)\.x === 16 && stageRect\(\)\.bottom - dock\.getBoundingClientRect\(\)\.bottom < 260\) \{ fdFlows\.classList\.add\('collapsed'\)/, 'a cramped window folds the list away');
});

test('the map keeps clear of the column and shows both step boxes', () => {
  assert.match(html, /const b = \$\('#flowdock'\)\.getBoundingClientRect\(\), side = b\.right - r\.left \+ 16;/);
  assert.match(html, /if \(!sheet && r\.width - panelW - side - 16 >= 200\) left = side; else top = Math\.max\(top, \$\('header'\)\.offsetHeight \+ 4 \+ b\.height - r\.top \+ 8\);/);
  assert.match(html, /showBoxes\(\[pa, pb\]\);/);
});

test('every inline script in the viewer parses', () => {
  for (const [, code] of html.matchAll(/<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/g)) {
    try { new Function(code); } catch (e) { if (!/import|export|await/.test(e.message)) throw e; }
  }
});
