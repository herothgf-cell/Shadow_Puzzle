const test=require('node:test'), assert=require('node:assert/strict');
const C=require('../src/core.js');
function game(extra={}){
 return C.createTestGame({id:'alignment',start:{x:400,y:500,a:1},goal:{x:800,y:800,w:130,h:130},walls:[],devices:[],sensors:[],axisMovement:true,lights:[{x:200,y:100,movable:true}],...extra});
}
function move(g,dx,dy){g.setInputMode('light');g.begin();g.moveLight(dx,dy);g.end();}
test('release near horizontal axis aligns the light without moving the box',()=>{
 const g=game();move(g,0,394);assert.equal(g.lights[0].y,500);assert.equal(g.lights[0].x,200);assert.equal(g.state.x,400);assert.equal(g.state.y,500);
});
test('release near vertical axis aligns light and undo restores the original position',()=>{
 const g=game();move(g,196,0);assert.equal(g.lights[0].x,400);assert.equal(g.lights[0].y,100);g.undo();assert.equal(g.lights[0].x,200);assert.equal(g.lights[0].y,100);
});
test('distant diagonal placement is not snapped',()=>{const g=game();move(g,0,379);assert.equal(g.lights[0].y,479);});
test('alignment never moves a light outside its allowed bounds',()=>{
 const g=game({lights:[{x:200,y:100,movable:true,bounds:{x1:80,y1:80,x2:900,y2:495}}]});move(g,0,500);assert.equal(g.lights[0].y,495);
});
test('alignment never collapses the light onto the box',()=>{const g=game();move(g,195,395);assert.equal(g.lights[0].x,395);assert.equal(g.lights[0].y,495);});
test('free-movement rooms preserve continuous light positioning',()=>{const g=game({axisMovement:false});move(g,0,394);assert.equal(g.lights[0].y,494);});
test('a mode or selection change alone never snaps a light',()=>{const g=game({lights:[{x:200,y:494,movable:true}]});g.begin();g.setInputMode('light');g.end();assert.equal(g.lights[0].y,494);});
