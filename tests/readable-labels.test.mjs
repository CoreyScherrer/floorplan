// Zoomed out, a box's own title draws at 4-8px. Names then move to a screen-space layer at 12px,
// one per box, and a name that would land on another is moved above or below its box, or left off.
// The zoom controls sit bottom right, clear of the details panel, with the zoom level on the fit button.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const html = fs.readFileSync(path.join(here, '..', 'skills', 'floorplan', 'assets', 'viewer.html'), 'utf8');

function fn(name) {
  const start = html.indexOf(`function ${name}(`);
  assert.ok(start > 0, name);
  let i = html.indexOf('{', start), depth = 0;
  for (; i < html.length; i++) { if (html[i] === '{') depth++; else if (html[i] === '}' && --depth === 0) break; }
  return html.slice(start, i + 1);
}

const cls = () => { const s = new Set(); return { add: (c) => s.add(c), remove: (c) => s.delete(c), contains: (c) => s.has(c), toggle: (c, on) => (on ? s.add(c) : s.delete(c)), s }; };
const label = (id, x, y, ext = false, w = 100, h = 18) => ({ id, ext, w, h, c: { x, y, width: 300, height: 150 }, el: { classList: cls(), style: {} } });

function run(labels, k, W = 1440, H = 800) {
  const ctx = {
    state: { labels, t: { x: 0, y: 0, k }, chipEls: new Map() },
    svg: { classList: cls() },
    labelsEl: { hidden: true, clientWidth: W, clientHeight: H },
    LABEL_K: 0.42, LABEL_GAP: 4,
  };
  vm.runInNewContext(`${fn('placeLabels')}; placeLabels();`, ctx);
  return ctx;
}
const shown = (l) => !l.el.classList.contains('off');

test('zoomed out, names show at screen size and the boxes hide their own titles', () => {
  const ls = [label('n:a', 0, 0), label('n:b', 2000, 0)];
  const ctx = run(ls, 0.2);
  assert.equal(ctx.labelsEl.hidden, false);
  assert.ok(ctx.svg.classList.contains('lod-labels'));
  assert.ok(ls.every(shown));
  assert.match(html, /\.flab \{[^}]*font-size: 12px;/);
  assert.match(html, /svg\.lod-labels \.node \.title, svg\.lod-labels \.card\.connector \.lbl \{ visibility: hidden; \}/);
});

test('zoomed in far enough to read the boxes, the layer steps aside', () => {
  const ctx = run([label('n:a', 0, 0)], 0.6);
  assert.equal(ctx.labelsEl.hidden, true);
  assert.equal(ctx.svg.classList.contains('lod-labels'), false);
});

test('a name that would overlap moves above its box before it is left off', () => {
  // two boxes on the same row, 60px apart on screen: the second name cannot sit on its box
  const a = label('n:a', 0, 1000), b = label('n:b', 300, 1000);
  run([a, b], 0.2);
  assert.ok(shown(a) && shown(b));
  assert.notEqual(a.el.style.transform, b.el.style.transform);
  const yOf = (l) => Number(/,(-?\d+)px\)/.exec(l.el.style.transform)[1]);
  assert.ok(yOf(b) < yOf(a), 'moved above');
});

test('with no free spot the less important name is left off, never drawn on top', () => {
  const ls = [label('n:a', 0, 1000), label('n:b', 10, 1000), label('n:c', 20, 1000), label('n:d', 30, 1000)];
  run(ls, 0.2);
  assert.deepEqual(ls.map(shown), [true, true, true, false]);
});

test('inside parts win collisions over outside services', () => {
  assert.match(html, /state\.labels\.sort\(\(a, b\) => \(a\.ext - b\.ext\) \|\| \(b\.area - a\.area\)\);/);
});

test('names of boxes outside a selection fade with them', () => {
  const a = label('n:a', 0, 0), b = label('n:b', 3000, 0);
  const ctx = {
    state: { labels: [a, b], t: { x: 0, y: 0, k: 0.2 }, chipEls: new Map([['n:a', { classList: { contains: (c) => c === 'hl' } }]]) },
    svg: { classList: { ...cls(), contains: (c) => c === 'dim', toggle() {} } },
    labelsEl: { hidden: true, clientWidth: 1440, clientHeight: 800 }, LABEL_K: 0.42, LABEL_GAP: 4,
  };
  vm.runInNewContext(`${fn('placeLabels')}; placeLabels();`, ctx);
  assert.equal(a.el.classList.contains('faint'), false);
  assert.equal(b.el.classList.contains('faint'), true);
});

test('zoom controls: bottom right, clear of the panel, 40px, and the fit button shows the zoom level', () => {
  assert.match(html, /#zoom \{ position: absolute; right: calc\(var\(--pw\) \+ 16px\); bottom: 16px;/);
  assert.match(html, /#zoom button \{ width: 40px; height: 40px;/);
  assert.match(html, /<button id="z-fit" title="Fit to screen \(F\)" aria-label="Zoom 100%\. Fit to screen">100%<\/button>/);
  assert.match(fn('applyTransform'), /zf\.textContent = pct; zf\.setAttribute\('aria-label', `Zoom \$\{pct\}\. Fit to screen`\);/);
});

test('between 42% and 73% zoom a box title grows so it never draws under 11px on screen', () => {
  assert.match(html, /\.title \{ font-size: max\(15px, calc\(11px \/ var\(--k, 1\)\)\);/);
  assert.match(html, /\.title\.mono \{[^}]*font-size: max\(13px, calc\(11px \/ var\(--k, 1\)\)\);/);
  assert.match(fn('applyTransform'), /svg\.style\.setProperty\('--k', k\.toFixed\(3\)\);/);
});
