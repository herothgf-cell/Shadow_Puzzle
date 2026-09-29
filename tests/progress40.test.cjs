const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const file=require('node:path').join(__dirname,'../src/progress.js');
test('progress adapter maps old completed indexes to stable room IDs and retains retired IDs',()=>{
 assert.ok(fs.existsSync(file),'progress adapter is implemented');const P=require(file);
 const old={game:{levelId:'rebuild-01',index:0},completed:[0,5,14,999,-1,'2'],fine:true};const n=P.normalize(old);
 assert.deepEqual(n.completedIds,['rebuild-01',P.LEGACY_IDS[5],P.LEGACY_IDS[14]]);assert.equal(n.fine,true);assert.deepEqual(n.game,old.game);
});
test('progress adapter preserves current ID saves without converting them to numbers',()=>{
 assert.ok(fs.existsSync(file),'progress adapter is implemented');const P=require(file);assert.deepEqual(P.normalize({completedIds:['campaign40-40','campaign40-40',null,7],fine:false}).completedIds,['campaign40-40']);
});
test('progress adapter ignores corrupt primary save and reads legacy without changing storage',()=>{
 assert.ok(fs.existsSync(file),'progress adapter is implemented');const P=require(file);const store={getItem:k=>k===P.KEY?'{bad':k==='shadow-morph-v7-platforms'?JSON.stringify({completed:[14],fine:true}):null,setItem:()=>assert.fail('read must not write')};const n=P.read(store);assert.deepEqual(n.completedIds,[P.LEGACY_IDS[14]]);assert.ok(n.fine);
});
