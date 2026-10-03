const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

function boot({ hash = '', badStorage = false, saved = null } = {}) {
  const dom = new JSDOM(read('dist/index.html'), {
    url: `https://miaopedia.test/${hash}`,
    runScripts: 'outside-only',
    pretendToBeVisual: true
  });
  const { window } = dom;
  window.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {} });
  window.HTMLElement.prototype.scrollIntoView = function() {};
  window.HTMLDialogElement.prototype.showModal = function() {
    this.setAttribute('open', '');
    this.querySelector('[autofocus]')?.focus();
  };
  window.HTMLDialogElement.prototype.close = function() {
    this.removeAttribute('open');
    this.dispatchEvent(new window.Event('close'));
  };
  if (saved !== null) window.localStorage.setItem('miaopedia.album.v1', saved);
  if (badStorage) {
    window.Storage.prototype.getItem = function() { throw new Error('storage denied'); };
    window.Storage.prototype.setItem = function() { throw new Error('storage denied'); };
  }
  for (const file of ['dist/cats.js', 'dist/album.js', 'dist/app.js']) window.eval(read(file));
  return dom;
}

const click = (window, selector) => {
  const element = window.document.querySelector(selector);
  assert.ok(element, `missing element: ${selector}`);
  element.click();
  return element;
};

test('favorite survives a reload and album tabs filter favorites and explored cats', () => {
  let dom = boot();
  let { window } = dom;
  click(window, '#catalog [data-favorite="b1"]');
  click(window, '#catalog [data-cat="b2"]');
  click(window, '#cat-dialog .close-dialog');
  const stored = window.localStorage.getItem('miaopedia.album.v1');
  dom.window.close();

  dom = boot({ saved: stored });
  window = dom.window;
  click(window, '#album-button');
  assert.ok(window.document.querySelector('#catalog [data-cat="b1"]'));
  assert.equal(window.document.querySelector('#catalog [data-cat="b2"]'), null);
  click(window, '[data-album-tab="seen"]');
  assert.ok(window.document.querySelector('#catalog [data-cat="b2"]'));
  assert.equal(window.document.querySelector('#catalog [data-cat="b1"]'), null);
  dom.window.close();
});

test('removing an open favorite leaves the opening navigation sequence intact', () => {
  const dom = boot();
  const { window } = dom;
  click(window, '#catalog [data-favorite="b1"]');
  click(window, '#catalog [data-cat="b1"]');
  click(window, '#cat-details [data-favorite="b1"]');
  click(window, '#next-cat');
  assert.equal(window.document.querySelector('#cat-title').textContent, 'Maine Coon');
  dom.window.close();
});

test('curiosity reveal and history disclosure respond to user activation', () => {
  const dom = boot();
  const { window } = dom;
  click(window, '#catalog [data-cat="b1"]');
  const reveal = click(window, '#reveal-fact');
  assert.equal(reveal.getAttribute('aria-expanded'), 'true');
  assert.equal(window.document.querySelector('#discovery-answer').hidden, false);
  click(window, '#reveal-fact');
  assert.equal(window.document.querySelector('#discovery-answer').hidden, true);
  const history = window.document.querySelector('.cat-history');
  assert.ok(history);
  click(window, '.cat-history summary');
  assert.equal(history.open, true);
  dom.window.close();
});

test('closing a cat opened from the initial hash restores focus to its catalog card', () => {
  const dom = boot({ hash: '#b1' });
  const { window } = dom;
  assert.equal(window.document.querySelector('#cat-dialog').open, true);
  click(window, '#cat-dialog .close-dialog');
  assert.equal(window.document.activeElement, window.document.querySelector('#catalog [data-cat="b1"]'));
  dom.window.close();
});

test('unavailable localStorage does not prevent the catalog from loading', () => {
  const dom = boot({ badStorage: true });
  const { window } = dom;
  assert.ok(window.document.querySelector('#catalog [data-cat="b1"]'));
  assert.match(window.document.querySelector('#storage-note').textContent, /solo in questa sessione/);
  click(window, '#catalog [data-favorite="b1"]');
  assert.equal(window.document.querySelector('#favorite-count').textContent, '1');
  dom.window.close();
});
