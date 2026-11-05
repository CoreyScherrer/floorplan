// Embedded in the admin page (?embed=1 inside a frame) the map hides its own search box and right-hand
// buttons, reports them to the page around it, and presses one when that page asks. Nothing else can.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const html = fs.readFileSync(path.join(here, '..', 'skills', 'floorplan', 'assets', 'viewer.html'), 'utf8');
const bridge = html.slice(html.indexOf('// Embedded: tell the page around the map'), html.indexOf('<!--__UI_EXTENSIONS__-->'));

test('embed mode needs both a frame and ?embed=1, and is set before the body draws', () => {
  const at = html.indexOf("document.documentElement.classList.add('embedded')");
  assert.ok(at > 0 && at < html.indexOf('<body>'));
  assert.match(html, /if \(window\.parent !== window && \/\[\?&\]embed=1\(&\|\$\)\/\.test\(location\.search\)\)/);
});

test('embedded, the search box and right-hand buttons hide but their menus still open', () => {
  assert.match(html, /html\.embedded \.hc, html\.embedded \.hr > \.btn, html\.embedded \.hr > \.rel > \.btn, html\.embedded #hdr-ext \{ display: none !important; \}/);
  assert.match(html, /html\.embedded #flowmenu, html\.embedded #legend \{ position: fixed; top: 8px; right: 8px; left: auto; \}/);
});

test('the bridge listens only to the parent window and presses only this map\'s own top-bar buttons', () => {
  assert.ok(bridge.length > 0, 'bridge sits before the UI extensions so their buttons are seen by the observer');
  assert.match(bridge, /if \(ev\.source !== window\.parent \|\| !ev\.data \|\| typeof ev\.data !== 'object'\) return;/);
  assert.match(bridge, /const b = controls\(\)\.find\(\(c\) => c\.id === String\(ev\.data\.id\)\);/);
  assert.match(bridge, /header\.querySelectorAll\('\.hc \.btn, \.hr \.btn'\)\]\.filter\(\(b\) => b\.id && !b\.closest\('#zoom, \.menu'\)\)/);
});

test('the bridge sends names and states only, never markup', () => {
  const snap = bridge.slice(bridge.indexOf('const snapshot'), bridge.indexOf('let queued'));
  assert.doesNotMatch(snap, /innerHTML|outerHTML/);
  assert.match(snap, /textContent/);
});
