const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const root = path.resolve(__dirname, '..');

test('build produces a deployable self-contained page and version identity', () => {
  execFileSync(process.execPath, ['build.cjs'], {cwd: root});
  const output = path.join(root, 'site-ready');
  assert.ok(fs.existsSync(path.join(output, 'version.json')), 'version.json missing');
  const version = JSON.parse(fs.readFileSync(path.join(output, 'version.json'), 'utf8'));
  const html = fs.readFileSync(path.join(output, 'index.html'), 'utf8');
  assert.equal(version.stages, 19);
  assert.equal(version.version, require('../package.json').version);
  assert.match(html, /name="build-version"/);
  assert.ok(!html.match(/\/\* (STYLES|LEVELS|CORE|UI) \*\//));
  assert.ok(!html.match(/<script[^>]+src=/), 'runtime must not require external scripts');
  assert.ok(fs.existsSync(path.join(output, '.nojekyll')));
});
