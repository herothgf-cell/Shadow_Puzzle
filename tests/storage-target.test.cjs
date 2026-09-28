const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../src/core.js');

for (const index of [14, 15, 16, 17]) {
  test(`room ${index + 1}: reload preserves an explicitly selected box instead of the default deck`, () => {
    const game = new C.Game(index);
    assert.notEqual(game.target, 'box', 'fixture starts with a deck selected');
    game.begin();
    game.setPlatformLength(game.level.platforms[0].id, game.level.platforms[0].maxLength);
    game.setTarget('box');
    game.end();
    const saved = game.serialize();
    const loaded = new C.Game();
    assert.equal(loaded.restore(JSON.parse(JSON.stringify(saved))), true);
    assert.deepEqual(loaded.serialize(), saved);
  });
}

test('reload preserves light input mode without restoring a stale platform target', () => {
  const game = new C.Game(18);
  game.begin();
  game.setInputMode('light');
  game.end();
  const saved = game.serialize();
  const loaded = new C.Game();
  assert.equal(loaded.restore(saved), true);
  assert.deepEqual(loaded.serialize(), saved);
});
