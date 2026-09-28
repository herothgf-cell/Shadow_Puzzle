const test=require('node:test'), assert=require('node:assert/strict');
const C=require('../src/core.js');
const make=(extra={})=>C.createTestGame({id:'test',name:'Test',start:{x:200,y:300,a:1},goal:{x:850,y:850,w:130,h:130},walls:[],checkpoints:[],lights:[{id:'a',x:100,y:100,movable:true}],sensors:[],devices:[],...extra});
const gesture=(g,f)=>{g.begin();const out=f();g.end();return out;};
const gate={id:'door',type:'gate',x:480,y:0,w:40,h:1000,sensorId:'pad'};
const button={id:'pad',accept:'box',x:300,y:300,r:32,latch:true};
const shadowPad={id:'pad',accept:'shadow',x:400,y:400,r:32,latch:true};

test('shadow drag and box motion have the same sign in rebuilt campaign',()=>{const g=make();const b=g.state.x;g.moveShadow(90,0);assert.ok(g.state.x>b);});
test('floor button opens a real door and stays latched after leaving',()=>{
 const g=make({sensors:[button],devices:[gate]});assert.equal(typeof g.deviceOpen,'function');
 assert.equal(g.deviceOpen('door'),false);g.moveBox(100,0);assert.equal(g.deviceOpen('door'),true);
 g.moveBox(-100,0);assert.equal(g.deviceOpen('door'),true);g.moveBox(550,0);assert.ok(g.state.x>600);
});
test('locked door cannot be tunnelled by a large drag',()=>{
 const g=make({sensors:[{...button,y:800}],devices:[gate]});assert.equal(typeof g.moveBox,'function');g.moveBox(2000,0);assert.ok(g.state.x<440);assert.equal(g.deviceOpen('door'),false);
});
test('shadow receiver responds to the shadow, not box contact',()=>{
 const g=make({start:{x:400,y:400,a:1},sensors:[shadowPad],devices:[gate]});assert.equal(typeof g.deviceOpen,'function');assert.equal(g.deviceOpen('door'),false);
 g.moveLight(600,0);g.moveLight(0,600);assert.equal(g.state.x,400);assert.equal(g.deviceOpen('door'),false);
 g.moveLight(-200,-200); // light 500,500 gives shadow 350,350, no hit
 assert.equal(g.deviceOpen('door'),false);
 g.moveLight(-100,-100); // light 400,400 puts the shadow over its receiver
 assert.equal(g.deviceOpen('door'),true);
});
test('floor button is not pressed by a shadow',()=>{
 const g=make({sensors:[{...button,x:250,y:400}],devices:[gate]});assert.equal(typeof g.deviceOpen,'function');assert.equal(g.deviceOpen('door'),false);
});
test('shadow-held door closes when the shadow leaves its zone',()=>{
 const g=make({start:{x:200,y:500,a:1},lights:[{id:'a',x:100,y:500,movable:true}],sensors:[{id:'pad',accept:'shadow',x:250,y:500,w:180,h:140,latch:false}],devices:[gate]});
 assert.equal(typeof g.deviceOpen,'function');assert.equal(g.deviceOpen('door'),true);g.moveLight(0,300);assert.equal(g.deviceOpen('door'),false);
});
test('bridge deck is collision until its button unfolds it',()=>{
 const g=make({sensors:[button],devices:[{...gate,id:'bridge',type:'bridge'}]});assert.equal(typeof g.deviceOpen,'function');g.moveBox(60,0);g.moveBox(140,0);assert.equal(g.deviceOpen('bridge'),true);g.moveBox(300,0);assert.ok(g.state.x>600);
});
test('undo restores box and physical environment together',()=>{
 const g=make({sensors:[button],devices:[gate]});assert.equal(typeof g.moveBox,'function');gesture(g,()=>g.moveBox(100,0));assert.equal(g.deviceOpen('door'),true);g.undo();assert.equal(g.state.x,200);assert.equal(g.deviceOpen('door'),false);
});
test('axis motion cannot slide off its radial line on a wall',()=>{
 const g=make({axisMovement:true,start:{x:300,y:300,a:1},walls:[{x:480,y:100,w:40,h:800}]});g.moveShadow(800,800);assert.ok(Math.abs(g.state.x-g.state.y)<1e-5);
});
test('non-finite light movement is rejected',()=>{
 const g=make();const before=JSON.stringify(g.lights);g.moveLight(NaN,Infinity);assert.equal(JSON.stringify(g.lights),before);
});
test('morph stays outside solid geometry throughout the change',()=>{
 const g=make({start:{x:300,y:500,a:.25},walls:[{x:336,y:460,w:80,h:80}]});g.setAspect(4);assert.equal(C.collides(g.level,g.state),false);assert.ok(g.state.a<1);
});
test('cannot win without reaching actual goal, even after button press',()=>{
 const g=make({sensors:[button],devices:[gate]});assert.equal(typeof g.moveBox,'function');gesture(g,()=>g.moveBox(100,0));assert.equal(g.state.won,false);
});
test('moving light across a receiver latches it even in one fast gesture',()=>{const g=make({start:{x:400,y:400,a:1},sensors:[shadowPad],devices:[gate]});g.moveLight(600,600);assert.equal(g.deviceOpen('door'),true);});
test('anti-crush keeps an open gate safe, and closes it after box exits',()=>{
 const g=make({start:{x:200,y:500,a:1},lights:[{x:100,y:500,movable:true}],sensors:[{id:'pad',accept:'shadow',x:540,y:500,w:800,h:120,latch:false}],devices:[gate]});
 assert.equal(g.deviceOpen('door'),true);g.moveBox(300,0);assert.equal(g.state.x,500);g.moveLight(0,300);
 assert.equal(g.deviceOpen('door'),true);g.moveBox(150,0);assert.equal(g.deviceOpen('door'),false);assert.equal(C.collides(g.level,g.state),false);
});
