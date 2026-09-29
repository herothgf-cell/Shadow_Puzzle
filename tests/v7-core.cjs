/* Legacy room fixtures exercised by the active engine, not a frozen engine. */
const fs=require('node:fs'),path=require('node:path');
const m={exports:{}};
new Function('module','exports','require',fs.readFileSync(path.join(__dirname,'../src/core.js'),'utf8'))(m,m.exports,p=>p==='./levels.js'?require('../archive/v7/src/levels.js'):require(p));
module.exports=m.exports;
