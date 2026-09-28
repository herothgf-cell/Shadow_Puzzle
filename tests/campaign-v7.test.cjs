const test=require('node:test'),assert=require('node:assert/strict'),C=require('../src/core.js'),legacy=require('./legacy-levels.cjs');
const gesture=(g,f)=>{g.begin();const r=f();g.end();return r;};
test('V7 preserves all fourteen original room objects and appends five new rooms',()=>{assert.deepEqual(C.LEVELS.slice(0,14),legacy);assert.equal(C.LEVELS.length,19);});
test('new rooms have no invisible numbered conditions, valid deck geometry and start on land',()=>{
 assert.equal(C.LEVELS.length,19);
 for(let i=14;i<19;i++){const g=new C.Game(i);assert.equal(g.state.won,false);assert.equal(C.insideGoal(g.level,g.state),false);assert.equal(C.collides(g.level,g.state),false);assert.equal(g.level.checkpoints?.length||0,0);assert.ok(g.level.platforms.length);for(const p of g.level.platforms){assert.ok(p.minLength<=p.length&&p.length<=p.maxLength);assert.equal(C.platformGeometryValid(g.level,g.state,p),true,`deck geometry stage ${i+1}`);}}
});
test('new room silhouettes are not repeated under rotations or mirrors',()=>{
 assert.equal(C.LEVELS.length,19);const seen=new Map();
 for(const [i,l] of C.LEVELS.entries()){
  const shapes=[...l.walls,...l.devices],grid=Array.from({length:40},(_,y)=>Array.from({length:40},(_,x)=>shapes.some(w=>x*25+12>w.x&&x*25+12<w.x+w.w&&y*25+12>w.y&&y*25+12<w.y+w.h)?'1':'0'));
  const variants=[];let a=grid;for(let r=0;r<4;r++){variants.push(a.flat().join(''),a.map(row=>[...row].reverse()).flat().join(''));a=a.map((row,y)=>row.map((v,x)=>a[39-x][y]));}
  const key=variants.sort()[0];assert.ok(!seen.has(key),`stage ${i+1} duplicates ${seen.get(key)}`);seen.set(key,i+1);
 }
});
test('stage16 longest deck is too narrow, middle length supports basic box',()=>{assert.equal(C.LEVELS.length,19);const g=new C.Game(15),p=g.level.platforms[0];assert.equal(g.level.allowMorph,false);g.setPlatformLength(p.id,p.maxLength);assert.equal(C.platformInfo(p,g.state).fits,false);g.setPlatformLength(p.id,(p.minLength+p.maxLength)/2);assert.equal(C.platformInfo(p,g.state).fits,true);});
test('stage17 requires both an extended deck and a non-square crossing shape',()=>{assert.equal(C.LEVELS.length,19);const g=new C.Game(16),p=g.level.platforms[0];g.moveBox(1000,0);assert.ok(g.state.x<320);g.setPlatformLength(p.id,p.maxLength);g.moveBox(1000,0);assert.ok(g.state.x<320);g.moveBox(-125,0);g.setAspect(4);g.moveBox(710,0);assert.ok(g.state.x>780);});
test('V7 lengths and target round trip; invalid restores do not alter running state',()=>{assert.equal(C.LEVELS.length,19);const g=new C.Game(14);gesture(g,()=>g.setPlatformLength('deck-a',400));const data=g.serialize(),n=new C.Game();assert.equal(n.restore(data),true);assert.deepEqual(n.serialize(),data);const before=n.snapshot();for(const length of [NaN,-20,99999]){const bad=JSON.parse(JSON.stringify(data));bad.state.platforms['deck-a']=length;assert.equal(n.restore(bad),false);assert.deepEqual(n.snapshot(),before);} });
test('V6 save in an unchanged room migrates without erasing learned progress',()=>{const g=new C.Game(8);g.begin();g.moveLight(0,100);g.end();const data=g.serialize();data.version=6;delete data.state.platforms;delete data.target;const n=new C.Game();assert.equal(n.restore(data),true);assert.equal(n.index,8);assert.equal(n.serialize().version,7);assert.deepEqual(n.lights,g.lights);});
