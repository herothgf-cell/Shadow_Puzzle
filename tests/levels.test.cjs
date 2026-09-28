const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const C=require('../src/core.js'),solutions=require('./solutions.json');
function step(g,action){
 g.begin();const [kind,a,b,c]=action;
 if(kind==='select')g.selectShadow(a);
 if(kind==='target')g.setTarget(a);
 if(kind==='platform'){g.setTarget(a);g.setPlatformLength(a,b);assert.ok(Math.abs(g.state.platforms[a]-b)<.01);}
 if(kind==='aspect')g.setAspect(a);
 if(kind==='light'){g.selectLight(a);g.moveLight(b-g.lights[a].x,c-g.lights[a].y);}
 if(kind==='box')g.moveShadow((a-g.state.x)*(1+C.SHADOW_SCALE),(b-g.state.y)*(1+C.SHADOW_SCALE));
 g.end();
 if(kind==='box')assert.ok(Math.hypot(g.state.x-a,g.state.y-b)<.02,`Stage ${g.index+1} expected ${a},${b}, actual ${g.state.x},${g.state.y} @ aspect ${g.state.a}`);
 assert.equal(C.collides(g.level,g.state),false,`stage ${g.index+1} collided after ${action}`);
}
module.exports={step};
test('14 rebuilt stages have no numeric/checkpoint win requirements',()=>{assert.deepEqual(C.LEVELS.slice(0,14),require('./legacy-levels.cjs'));for(const l of C.LEVELS)assert.equal(l.checkpoints?.length||0,0);});
test('initial positions and goals do not collide or overlap',()=>{for(let i=0;i<14;i++){const g=new C.Game(i);assert.equal(C.collides(g.level,g.state),false,`start ${i+1}`);assert.equal(C.insideGoal(g.level,g.state),false,`goal-start ${i+1}`);const s={...g.state,x:g.level.goal.x,y:g.level.goal.y};assert.equal(C.collides(g.level,s),false,`goal ${i+1}`);}});
test('all devices have exactly one visible driver of a valid kind',()=>{for(const l of C.LEVELS){const ids=l.sensors.map(c=>c.id);assert.equal(new Set(ids).size,ids.length);for(const d of l.devices){assert.ok(ids.includes(d.sensorId));assert.ok(['gate','bridge'].includes(d.type));}for(const c of l.sensors)assert.ok(['box','shadow'].includes(c.accept));}});
test('no identical or rotated/reflected collision-map silhouettes',()=>{
 const keys=new Map();
 for(let i=0;i<14;i++){
  const l=C.LEVELS[i],shapes=[...l.walls,...l.devices],grid=Array.from({length:40},(_,y)=>Array.from({length:40},(_,x)=>shapes.some(w=>x*25+12>w.x&&x*25+12<w.x+w.w&&y*25+12>w.y&&y*25+12<w.y+w.h)?'1':'0'));
  const variants=[];let a=grid;
  for(let r=0;r<4;r++){variants.push(a.flat().join(''),a.map(row=>[...row].reverse()).flat().join(''));a=a.map((row,y)=>row.map((v,x)=>a[39-x][y]));}
  const key=variants.sort()[0];assert.ok(!keys.has(key),`Stage ${i+1} duplicates ${keys.get(key)}`);keys.set(key,i+1);
 }
});
for(const solution of solutions)test(`stage ${solution.stage}: complete through real gesture/collision engine`,()=>{const g=new C.Game(solution.stage-1);for(const action of solution.steps)step(g,action);assert.equal(g.state.won,true);});
test('save/restore includes gates, latches and lights; old layout saves are rejected',()=>{
 const g=new C.Game(8);step(g,['light',0,400,820]);const restored=new C.Game();assert.equal(restored.restore(g.serialize()),true);assert.deepEqual(restored.serialize(),g.serialize());assert.equal(restored.restore({version:4,index:8,state:{x:300,y:500,a:1}}),false);
});
test('selecting light does not teleport the box or reset an environment switch',()=>{const g=new C.Game(12);step(g,['box',680,320]);const before=JSON.stringify(g.state);g.selectShadow(1);assert.equal(JSON.stringify(g.state),before);});
test('stage 13 non-selected shadow holds the gate while the selected one moves',()=>{
 const g=new C.Game(12);step(g,['box',680,320]);g.selectShadow(1);step(g,['box',680,570]);assert.equal(g.sensorState(g.level.sensors[0]).active,true);assert.equal(g.deviceOpen('door'),true);assert.ok(g.shadow(0).x>900);assert.equal(g.shadow(1).x,680);
});
