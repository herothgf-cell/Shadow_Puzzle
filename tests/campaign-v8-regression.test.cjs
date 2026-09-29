const test=require('node:test'),assert=require('node:assert/strict');
const C=require('./v8-core.cjs');
test('active campaign has forty unique rooms and no new mechanic types',()=>{
 assert.equal(C.LEVELS.length,40);
 assert.equal(new Set(C.LEVELS.map(l=>l.id)).size,40);
 for(const l of C.LEVELS){
  assert.ok(!l.checkpoints?.length);assert.ok(l.lights.length<=2);assert.ok((l.platforms||[]).length<=2);
  for(const c of l.sensors||[])assert.ok(['box','shadow'].includes(c.accept));
  for(const d of l.devices||[])assert.ok(['gate','bridge'].includes(d.type));
 }
});
test('all forty rooms start on valid floor, outside the goal and not completed',()=>{
 assert.equal(C.LEVELS.length,40);
 for(let i=0;i<40;i++){const g=new C.Game(i);assert.ok(!C.collides(g.level,g.state),`start ${i+1}`);assert.ok(!C.insideGoal(g.level,g.state),`start goal ${i+1}`);assert.ok(!g.state.won);for(const p of g.level.platforms)assert.ok(C.platformGeometryValid(g.level,g.state,p),`deck ${i+1} ${p.id}`);}
});
const {step,replay}=require('./campaign-driver.cjs'),solutions=require('./v8-solutions.json');
for(const route of solutions)test(`campaign40 room ${route.stage}: actual gesture engine witness and save round-trip`,()=>{
 const g=new C.Game(route.stage-1);
 for(const action of route.steps){if(g.state.won)break;step(g,action);const saved=g.serialize(),loaded=new C.Game();assert.equal(loaded.restore(saved),true,`room ${route.stage} ${action}`);assert.deepEqual(loaded.serialize(),saved);}
 assert.equal(g.state.won,true);
});
test('forty collision silhouettes are distinct under rotation and reflection',()=>{
 const seen=new Map();for(const [i,l] of C.LEVELS.entries()){
  const solids=[...l.walls,...l.devices];let grid=Array.from({length:40},(_,y)=>Array.from({length:40},(_,x)=>solids.some(w=>x*25+12>w.x&&x*25+12<w.x+w.w&&y*25+12>w.y&&y*25+12<w.y+w.h)?'1':'0'));
  const variants=[];for(let r=0;r<4;r++){variants.push(grid.flat().join(''),grid.map(row=>[...row].reverse()).flat().join(''));grid=grid.map((row,y)=>row.map((v,x)=>grid[39-x][y]));}
  const signature=variants.sort()[0];assert.ok(!seen.has(signature),`room ${i+1} repeats ${seen.get(signature)}`);seen.set(signature,i+1);
 }
});
test('17: maximal deck extension does not support the exit-required tall shape',()=>{
 const g=new C.Game(16),p=g.level.platforms[0];g.setPlatformLength(p.id,p.maxLength);g.setAspect(.25);g.moveBox(570,0);assert.ok(g.state.x<320);assert.equal(g.state.won,false);
});
test('15: a closed physical gate stops deck growth; opening it permits extension',()=>{
 const g=new C.Game(14);g.setPlatformLength('deck-a',500);assert.ok(g.state.platforms['deck-a']<500);g.moveBox(0,-520);assert.equal(g.deviceOpen('gate'),true);g.setPlatformLength('deck-a',500);assert.equal(g.state.platforms['deck-a'],500);
});
test('26: both decks maximized cannot provide the morph worktable; shortening A is necessary for this route',()=>{
 const g=new C.Game(25);replay(g,solutions[25].steps.slice(0,5));g.setAspect(1);assert.ok(g.state.a>1.05);assert.equal(g.state.won,false);
 const before=g.snapshot();g.begin();g.setPlatformLength('deck-a',520);g.setAspect(1);g.end();assert.ok(Math.abs(g.state.a-1)<.001);g.undo();assert.deepEqual(g.snapshot(),before);
});
test('29: stationary shape change reaches the remote dot sensor',()=>{
 const g=new C.Game(28),x=g.state.x,y=g.state.y;assert.equal(g.deviceOpen('bridge'),false);g.setAspect(4);assert.equal(g.state.x,x);assert.equal(g.state.y,y);assert.equal(g.deviceOpen('bridge'),true);
});
test('33: each gate has its own required real driver on the witnessed route',()=>{
 for(const id of ['one','two']){const l=JSON.parse(JSON.stringify(C.LEVELS[32]));l.sensors.find(s=>s.id===id).x=-5000;const g=C.createTestGame(l);replay(g,solutions[32].steps,{strict:false});assert.equal(g.state.won,false,`disabled ${id}`);}
});
test('39: two preparation orders both open the actual bridges and reach the exit',()=>{
 for(const steps of [solutions[38].steps,solutions[38].alternateSteps]){const g=new C.Game(38);replay(g,steps);assert.equal(g.state.won,true);assert.equal(g.deviceOpen('upper'),true);assert.equal(g.deviceOpen('lower'),true);}
});
test('tutorials include every existing mechanic by room12 and later do not add kinds',()=>{
 const intro=C.LEVELS.slice(0,12);assert.ok(intro.some(l=>(l.platforms||[]).length));assert.ok(intro.some(l=>l.lights.length===2));assert.ok(intro.some(l=>l.axisMovement));assert.ok(intro.some(l=>l.sensors.some(s=>!s.latch)));assert.ok(intro.some(l=>l.devices.some(d=>d.type==='bridge')));
});
test('approved plan is preserved byte-for-byte',()=>{
 const fs=require('node:fs'),crypto=require('node:crypto');const bytes=fs.readFileSync(require('node:path').join(__dirname,'../docs/Shadow_Puzzle_40Stage_Expansion_Plan.md'));
 assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),'5d40618ae78ad1a79d628b56cc24c8af7fe476ebf7762e33a1c34d987b241b26');
});
test('40: a subpixel approach offset still leaves space to morph on the final landing',()=>{
 const g=new C.Game(39);replay(g,solutions[39].steps.slice(0,20));
 // Perturb the physically valid land approach, simulating pointer rounding
 // before following the fixed radial axis. The collision engine stays active.
 g.moveBox(-.8,0);g.moveShadow(0,-570*1.5);assert.equal(C.collides(g.level,g.state),false);
 g.setAspect(1);assert.ok(Math.abs(g.state.a-1)<.001,'landing must not demand a pixel-perfect deck centre');
});
test('34: the first deck is described as a worksite, not an impossible bank-to-bank bridge',()=>{
 const p=C.LEVELS[33].platforms[0];assert.equal(p.purpose,'worksite');assert.ok(p.x+p.maxLength/2>=p.spanEnd);
});
