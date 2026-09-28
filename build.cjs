'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const pkg = JSON.parse(read('package.json'));
let html = read('src/shell.html');
for (const [token, file] of [['STYLES', 'style.css'], ['LEVELS', 'levels.js'], ['CORE', 'core.js'], ['UI', 'ui.js']]) {
  const marker = `/* ${token} */`;
  if (html.split(marker).length !== 2) throw new Error(`Expected exactly one ${marker}`);
  html = html.replace(marker, () => read(`src/${file}`));
}
html = html.replace('</head>', `<meta name="build-version" content="${pkg.version}"></head>`);
const out = path.join(root, 'site-ready');
fs.mkdirSync(out, {recursive: true});
fs.writeFileSync(path.join(out, 'index.html'), html);
fs.writeFileSync(path.join(out, '.nojekyll'), '');
fs.writeFileSync(path.join(out, 'version.json'), JSON.stringify({
  version: pkg.version,
  commit: process.env.GITHUB_SHA || 'local',
  stages: require('./src/levels.js').length
}, null, 2) + '\n');
fs.writeFileSync(path.join(root, 'shadow_morph_v7_platforms.html'), html);
console.log(`Built V${pkg.version}: ${Buffer.byteLength(html)} bytes, 19 stages.`);
