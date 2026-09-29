const test=require('node:test'),assert=require('node:assert/strict'),C=require('../src/core');
const {step,replay}=require('./campaign-driver.cjs'),solutions=require('./campaign40-solutions.json');
for(const route of solutions)test(`active V8.1 room ${route.stage}: legal real input and save round-trip`,()=>{
 const g=new C.Game(route.stage-1);assert.equal(g.level.id,route.levelId);
 assert.ok(!C.collides(g.level,g.state));assert.ok(!C.insideGoal(g.level,g.state));
 for(const p of g.level.platforms)assert.ok(C.platformGeometryValid(g.level,g.state,p));
 for(const action of route.steps){if(g.state.won)break;step(g,action);const saved=g.serialize(),loaded=new C.Game();assert.equal(loaded.restore(saved),true);assert.deepEqual(loaded.serialize(),saved);}
 assert.equal(g.state.won,true);
 if(route.alternateSteps){const a=new C.Game(route.stage-1);replay(a,route.alternateSteps);assert.equal(a.state.won,true);}
});
test('active collision silhouettes have no exact rotation or reflection clones',()=>{
 const seen=new Map();for(const [i,l] of C.LEVELS.entries()){
  const solids=[...l.walls,...l.devices];let grid=Array.from({length:40},(_,y)=>Array.from({length:40},(_,x)=>solids.some(w=>x*25+12>w.x&&x*25+12<w.x+w.w&&y*25+12>w.y&&y*25+12<w.y+w.h)?'1':'0'));
  const variants=[];for(let r=0;r<4;r++){variants.push(grid.flat().join(''),grid.map(row=>[...row].reverse()).flat().join(''));grid=grid.map((row,y)=>row.map((v,x)=>grid[39-x][y]));}
  const signature=variants.sort()[0];assert.ok(!seen.has(signature),`room ${i+1} repeats ${seen.get(signature)}`);seen.set(signature,i+1);
 }
});
