const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const C=require('../src/core'),old=require('./v8-levels.cjs');
test('difficulty-first: hard dual-light and sustained-placement rooms do not precede simple form rooms',()=>{
 assert.equal(C.LEVELS[4].id,old[12].id);
 assert.equal(C.LEVELS[9].id,old[13].id);
 assert.equal(C.LEVELS.findIndex(l=>l.lights.length>1),22);
 assert.equal(C.LEVELS.findIndex(l=>l.sensors.some(s=>!s.latch)),28);
 assert.equal(C.LEVELS[22].id,old[10].id);assert.equal(C.LEVELS[28].id,old[11].id);
});
test('forty rooms with twelve rebuilt identities, unchanged reused puzzle geometry',()=>{
 assert.equal(C.LEVELS.length,40);assert.equal(new Set(C.LEVELS.map(l=>l.id)).size,40);
 assert.equal(C.LEVELS.filter(l=>l.id.startsWith('rebalance81-')).length,12);
 for(const l of C.LEVELS){const b=old.find(o=>o.id===l.id);if(!b)continue;
  for(const k of ['start','goal','walls','sensors','devices','platforms','lights','axisMovement','allowMorph'])assert.deepEqual(l[k],b[k],l.id+' '+k);
 }
});
test('late chapter does not fall back to independent latch-only errands',()=>{
 for(const l of C.LEVELS.slice(28))assert.ok(l.sensors.some(s=>!s.latch),l.id);
 for(const l of C.LEVELS.slice(34))assert.ok(l.lights.length===2&&(l.platforms||[]).length>=1,l.id);
});
test('stage brief is goal-facing, exact steps stay behind the existing hint button',()=>{
 for(const l of C.LEVELS.slice(16))assert.ok(!/①|②|LIGHT|→/.test(l.tip),l.id);
});
const {replay,step}=require('./campaign-driver.cjs'),routes=require('./campaign40-solutions.json');
test('save restores a previously grown deck after its real gate closes, without opening the gate',()=>{
 const g=new C.Game(34);let found=false;
 for(const a of routes[34].steps){step(g,a);if(g.level.platforms.some(p=>!C.platformGeometryValid(g.level,g.state,p))){found=true;const saved=g.serialize(),other=new C.Game();assert.equal(other.restore(saved),true,'reachable gate-over-deck state must survive reload');assert.deepEqual(other.serialize(),saved);assert.ok(!C.collides(other.level,other.state));break;}}
 assert.ok(found,'fixture actually closes a gate over an existing deck');
});
test('a forged deck outside the board or through permanent stone still cannot restore',()=>{
 const g=new C.Game(34),saved=g.serialize();saved.state.platforms['deck-b']=9999;assert.equal(new C.Game().restore(saved),false);
 const q=new C.Game(10),s=q.serialize();s.state.platforms['deck-a']=500;
 // Closed doors remain solid for the box even when a stored deck runs below them.
 s.state.x=680;s.state.y=600;assert.equal(new C.Game().restore(s),false);
});
test('37 and 38 each require a second maintained condition instead of a single independent errand',()=>{
 for(const n of [37,38])assert.equal(C.LEVELS[n-1].sensors.filter(s=>!s.latch).length,2);
});
for(const n of [27,28,30,34,35,36,37,38,39,40])for(const s of C.LEVELS[n-1].sensors)test(`${n}: removing ${s.id} blocks the published witness (not an exhaustive proof)`,()=>{
 const level=structuredClone(C.LEVELS[n-1]);Object.assign(level.sensors.find(v=>v.id===s.id),{x:-5000,y:-5000});const g=C.createTestGame(level);replay(g,routes[n-1].steps,{strict:false});assert.equal(g.state.won,false);
});
for(const n of [35,37,40])test(`${n}: one-time deck presets alone cannot execute the intended route`,()=>{
 const g=new C.Game(n-1),seen=new Set();const steps=routes[n-1].steps.filter(v=>{if(v[0]!=='platform')return true;if(seen.has(v[1]))return false;seen.add(v[1]);return true;});replay(g,steps,{strict:false});assert.equal(g.state.won,false);
});
test('all unchanged V8 saves follow their ID; twelve retired identities do not attach to a new room',()=>{
 const V8=require('./v8-core.cjs');let retained=0,retired=0;
 for(let i=0;i<40;i++){const a=new V8.Game(i),id=a.level.id,j=C.LEVELS.findIndex(l=>l.id===id),g=new C.Game();if(j<0){assert.equal(g.restore(a.serialize()),false);retired++;}else {assert.equal(g.restore(a.serialize()),true);assert.equal(g.index,j);assert.equal(g.level.id,id);retained++;}}
 assert.equal(retained,28);assert.equal(retired,12);
});
test('public help and direct-start point follow the rebalanced introductions',()=>{
 const html=fs.readFileSync(require.resolve('../src/shell.html'),'utf8');
 assert.match(html,/17번 방부터/);assert.match(html,/발판 · 6번부터/);assert.match(html,/23\+/);
 assert.ok(!html.includes('9번 방부터 옮길'));assert.ok(!html.includes('17번 본격 퍼즐'));
});
