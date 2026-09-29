// Run the CURRENT unchanged engine against frozen V8 maps, in the same realm.
const fs=require('node:fs');const box={exports:{}};
new Function('require','module',fs.readFileSync(require.resolve('../src/core.js'),'utf8'))(
 p=>p==='./levels.js'?require('./v8-levels.cjs'):require(p),box);
module.exports=box.exports;
