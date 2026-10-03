const test = require('node:test');
const assert = require('node:assert/strict');
const { createAlbum } = require('../dist/album.js');

const ids = ['a', 'b'];
const key = 'test.album';

test('favorites and visited IDs persist across album instances', () => {
  let value = null;
  const storage = {
    getItem: () => value,
    setItem: (_key, next) => { value = next; }
  };
  const first = createAlbum(storage, ids, key);
  assert.equal(first.toggle('a'), true);
  assert.equal(first.visit('b'), true);

  const reloaded = createAlbum(storage, ids, key);
  assert.deepEqual([...reloaded.favorites], ['a']);
  assert.deepEqual([...reloaded.seen], ['b']);
});

test('malformed data and unknown IDs are safely discarded', () => {
  const storage = { getItem: () => '{bad json', setItem() {} };
  let album = createAlbum(storage, ids, key);
  assert.equal(album.favorites.size, 0);
  assert.equal(album.seen.size, 0);

  storage.getItem = () => JSON.stringify({ favorites: ['b', 'missing'], seen: ['a', 42] });
  album = createAlbum(storage, ids, key);
  assert.deepEqual([...album.favorites], ['b']);
  assert.deepEqual([...album.seen], ['a']);
  assert.equal(album.toggle('missing'), false);
  assert.equal(album.visit('missing'), false);
});

test('storage read and write exceptions mark the album as session-only', () => {
  const unreadable = { getItem() { throw new Error('denied'); }, setItem() {} };
  assert.equal(createAlbum(unreadable, ids, key).persistent, false);

  const unwritable = { getItem: () => null, setItem() { throw new Error('denied'); } };
  const album = createAlbum(unwritable, ids, key);
  assert.equal(album.persistent, true);
  album.visit('a');
  assert.equal(album.persistent, false);
});

test('missing storage remains usable in memory', () => {
  const album = createAlbum(null, ids, key);
  assert.equal(album.persistent, false);
  assert.equal(album.toggle('a'), true);
  assert.ok(album.favorites.has('a'));
});
