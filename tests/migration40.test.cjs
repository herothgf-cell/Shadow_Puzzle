const test=require('node:test'),assert=require('node:assert/strict'),C=require('../src/core.js'),V7=require('./v7-core.cjs');
test('migrate unchanged deck room by stable ID instead of its former number',()=>{
 const old=new V7.Game(14);old.begin();old.setPlatformLength('deck-a',430);old.setTarget('box');old.end();
 const save=old.serialize(),g=new C.Game();assert.equal(g.restore(save),true);
 assert.equal(g.level.id,old.level.id);assert.equal(g.index,C.LEVELS.findIndex(l=>l.id===old.level.id));assert.deepEqual(g.state,old.state);assert.equal(g.target,'box');
});
test('removed rooms are not silently assigned to their old stage number',()=>{
 const old=new V7.Game(5),g=new C.Game(2),before=g.serialize();assert.equal(g.restore(old.serialize()),false);assert.deepEqual(g.serialize(),before);
});
test('all retained rooms restore selected light, target, and initial state under their new index',()=>{
 for(let i=0;i<V7.LEVELS.length;i++){
  const j=C.LEVELS.findIndex(l=>l.id===V7.LEVELS[i].id);if(j<0)continue;
  const old=new V7.Game(i);old.begin();old.setTarget('box');if(old.lights.length>1)old.selectShadow(1);old.end();
  const g=new C.Game();assert.equal(g.restore(old.serialize()),true,`room ${i+1}`);assert.equal(g.index,j);assert.deepEqual(g.state,old.state);assert.equal(g.activeShadow,old.activeShadow);
 }
});
