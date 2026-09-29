const assert=require('node:assert/strict'),C=require('../src/core.js');
function step(g,action,{strict=true}={}){
 if(g.state.won)return;
 const [kind,a,b,c]=action;g.begin();
 if(kind==='target')g.setTarget(a);
 else if(kind==='select'){g.setTarget('box');g.selectShadow(a);}
 else if(kind==='platform'){g.setTarget(a);g.setPlatformLength(a,b);if(strict)assert.ok(Math.abs(g.state.platforms[a]-b)<.02,`platform ${a} ${b} => ${g.state.platforms[a]}`);}
 else if(kind==='aspect'){g.setTarget('box');g.setAspect(a);if(strict)assert.ok(Math.abs(g.state.a-a)<.01,`aspect ${a} => ${g.state.a}`);}
 else if(kind==='light'){g.setInputMode('light');g.selectLight(a);g.moveLight(b-g.lights[a].x,c-g.lights[a].y);}
 else if(kind==='box'){g.setTarget('box');g.moveShadow((a-g.state.x)*1.5,(b-g.state.y)*1.5);}
 else throw new Error('unknown action '+kind);
 g.end();
 if(strict&&kind==='box')assert.ok(Math.hypot(g.state.x-a,g.state.y-b)<.05,`expected ${a},${b}, actual ${g.state.x},${g.state.y} aspect=${g.state.a}`);
 assert.ok(!C.collides(g.level,g.state),'collided after '+action);
}
function replay(g,route,options){for(let i=0;i<route.length;i++){try{step(g,route[i],options);}catch(e){throw new Error(`Room ${g.index+1}/${g.level.id}, action ${i+1}: ${JSON.stringify(route[i])}: ${e.message}`);}}return g;}
module.exports={step,replay};
