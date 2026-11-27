const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { setImmediate: tick } = require('node:timers/promises');

async function main() {
  const handlers = {};
  let renders = 0;
  const slot = { isConnected: true, html: '', get innerHTML() { return this.html; }, set innerHTML(value) { this.html = value; renders++; } };
  const style = () => ({ values: {}, setProperty(key, value) { this.values[key] = value; } });
  const status = {
    textContent: '', setAttribute() {}, style: style(),
    classList: {
      values: new Set(),
      add(name) { this.values.add(name); },
      remove(name) { this.values.delete(name); },
      contains(name) { return this.values.has(name); },
    },
  };
  const stage = {
    classList: { toggle() {} },
    scrollTop: 0, before() {},
    addEventListener(name, handler) { handlers[name] = handler; },
  };
  const doc = { createElement: () => status };
  let requests = 0;
  let invalidations = 0;
  let nextPage = Promise.resolve([{ id: 'old', title: 'Old product' }]);
  const context = vm.createContext({
    setTimeout: callback => queueMicrotask(callback),
    document: doc,
    parent: { document: { querySelector: () => ({ contentDocument: doc }) } },
    view: { style: style(), closest: () => stage, querySelector: selector => selector === '#mobile-products' ? slot : null },
    page: 'results', query: 'test',
    mobileScreens: {
      products: new Map(), invalidate() { invalidations++; },
      async *catalog() { requests++; yield await nextPage; },
    },
    syncParts() {}, finderMatch: () => 'Catalog match',
    liveGrid: rows => rows.map(row => row.title).join(','), escapeHTML: value => value,
  });
  const source = fs.readFileSync(__dirname + '/screens/catalog-ui.js', 'utf8');
  vm.runInContext(source.slice(source.indexOf('function startCatalog()'), source.indexOf("document.addEventListener('click'")) + '\nstartCatalog();', context);
  await tick();
  assert.match(slot.innerHTML, /Old product/);
  const touch = (x, y, extra = {}) => ({
    touches: [{ clientX: x, clientY: y }],
    target: { closest: () => null }, preventDefault() {}, ...extra,
  });
  function pull(dx = 0, dy = 130) {
    handlers.touchstart(touch(10, 20));
    handlers.touchmove(touch(10 + dx, 20 + dy));
    handlers.touchend(touch(10 + dx, 20 + dy));
  }
  stage.scrollTop = 50;
  pull();
  stage.scrollTop = 0;
  pull(0, 30);
  pull(150, 110);
  handlers.touchstart(touch(10, 20));
  handlers.touchmove(touch(10, 150));
  handlers.touchcancel();
  handlers.touchend(touch(10, 150));
  handlers.touchstart(touch(10, 20, { target: { closest: () => ({}) } }));
  handlers.touchmove(touch(10, 150));
  handlers.touchend(touch(10, 150));
  assert.equal(invalidations, 0, 'Scrolling, short/horizontal pulls, cancelled touches, and form inputs must not refresh');

  let finish;
  nextPage = new Promise(resolve => { finish = resolve; });
  const beforeRefreshRenders = renders;
  handlers.touchstart(touch(10, 20));
  handlers.touchmove(touch(10, 150));
  assert.equal(status.style.values['--pull'], '58.5px', 'Indicator follows the pull with resistance');
  assert.match(status.textContent, /Release/);
  handlers.touchcancel();
  assert.equal(status.classList.contains('visible'), false, 'Cancelled pull retracts');
  pull();
  assert.equal(invalidations, 1);
  assert.equal(status.classList.contains('visible'), true);
  assert.equal(status.style.values['--pull'], '54px', 'Spinner settles into a stable position');
  assert.match(status.textContent, /Refreshing/);
  assert.match(slot.innerHTML, /Old product/, 'Keep products visible during refresh');
  assert.equal(renders, beforeRefreshRenders, 'Do not rebuild cards or restart images when refresh begins');
  pull();
  assert.equal(invalidations, 1, 'Ignore a second pull while refreshing');
  finish([{ id: 'new', title: 'Updated product' }]);
  await tick();
  assert.match(slot.innerHTML, /Updated product/);
  assert.doesNotMatch(slot.innerHTML, /Old product/);
  assert.equal(renders, beforeRefreshRenders + 1, 'Render fresh cards once when refresh completes');
  assert.equal(status.classList.contains('visible'), false);
  assert.equal(status.style.values['--pull'], '0px');

  nextPage = Promise.resolve().then(() => { throw new Error('Network unavailable'); });
  pull();
  await tick();
  assert.match(slot.innerHTML, /Updated product/);
  assert.match(slot.innerHTML, /Network unavailable/);
  assert.match(slot.innerHTML, /Try again/);
  assert.equal(status.classList.contains('visible'), false, 'Stop spinner after failure');
  nextPage = Promise.resolve([{ id: 'retry', title: 'Retry succeeded' }]);
  slot.onclick({ target: { closest: selector => selector === '[data-refresh]' } });
  await tick();
  assert.match(slot.innerHTML, /Retry succeeded/);
  assert.equal(requests, 4);
  console.log('PASS: pull threshold, scroll position, gesture cancellation, busy guard, fresh data, retained products, error and retry.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
