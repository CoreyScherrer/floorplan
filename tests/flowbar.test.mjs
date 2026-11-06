import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../skills/floorplan/assets/viewer.html', import.meta.url), 'utf8');

test('a playing flow card sits on the left under the bar, not over the middle of the map', () => {
  assert.match(html, /#flowbar \{ position: fixed; left: 8px; top: calc\(var\(--hh, 64px\) \+ 4px\); width: min\(320px, calc\(100% - 16px\)\);/);
  assert.doesNotMatch(html, /#flowbar \{[^}]*translateX\(-50%\)/);
});

test('the map keeps clear of the flow card and pans the step boxes into view', () => {
  assert.match(html, /if \(!sheet && r\.width - panelW - side - 16 >= 200\) left = side; else top = Math\.max\(top, b\.bottom - r\.top \+ 8\);/);
  assert.match(html, /return \{ x: left, y: top, w: Math\.max\(200, r\.width - panelW - left - 16\)/);
  assert.match(html, /showBoxes\(\[pa, pb\]\);/);
  assert.match(html, /function showBoxes\(ids\) \{/);
});
