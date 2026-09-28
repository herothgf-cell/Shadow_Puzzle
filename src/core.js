/* Shadow Morph V7: deterministic, viewport-independent simulation.
 * The swept AABB and log-space morph checks retain the V5 collision model.
 * Sensors drive tangible geometry, never invisible goal checklists.
 */
(function(root,factory){
  if(typeof module==='object'&&module.exports) module.exports=factory(require('./levels.js'));
  else root.ShadowCore=factory(root.ShadowLevels);
})(typeof globalThis!=='undefined'?globalThis:this,function(LEVELS){
  'use strict';
  const SIZE=1000, MARGIN=24, BASE=90, MIN_A=.25, MAX_A=4, SHADOW_SCALE=.5, EPS=1e-7;
  const clone=v=>JSON.parse(JSON.stringify(v));
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const nothing=()=>({changed:false,blocked:false});
  function normalizeLevel(raw){
    const l=clone(raw);l.walls=l.walls||[];l.sensors=l.sensors||[];l.devices=l.devices||[];
    l.lights=(l.lights?.length?l.lights:[{x:500,y:80}]).map((v,i)=>({...v,id:v.id||`light-${i}`,movable:!!v.movable,name:v.name||`빛 ${String.fromCharCode(65+i)}`}));
    l.platforms=(l.platforms||[]).map(p=>({...p,axis:p.axis==='y'?'y':'x'}));
    l.axisMovement=!!l.axisMovement;l.allowMorph=l.allowMorph!==false;return l;
  }
  function dimensions(a){const r=Math.sqrt(a);return {w:BASE*r,h:BASE/r};}
  function rect(s){const d=dimensions(s.a);return {l:s.x-d.w/2,r:s.x+d.w/2,t:s.y-d.h/2,b:s.y+d.h/2};}
  function wallRect(w){return {l:w.x,r:w.x+w.w,t:w.y,b:w.y+w.h};}
  function goalRect(l){const g=l.goal;return {l:g.x-g.w/2,r:g.x+g.w/2,t:g.y-g.h/2,b:g.y+g.h/2};}
  function overlap(a,b){return a.l<b.r-EPS&&a.r>b.l+EPS&&a.t<b.b-EPS&&a.b>b.t+EPS;}
  function shadowFromBox(s,l){return {x:s.x+(s.x-l.x)*SHADOW_SCALE,y:s.y+(s.y-l.y)*SHADOW_SCALE};}
  function axisBoxDelta(s,l,dx,dy){const vx=s.x-l.x,vy=s.y-l.y,n=Math.hypot(vx,vy);if(n<EPS)return {dx:0,dy:0};const ux=vx/n,uy=vy/n,k=(dx*ux+dy*uy)/(1+SHADOW_SCALE);return {dx:ux*k,dy:uy*k};}
  // Platforms are floors, not obstacles. Only their intersection with void is
  // subtracted: stone and closed device geometry are never made passable.
  function platformLength(p,s){return s.platforms?.[p.id]??p.length;}
  function platformRect(p,s){
    const length=platformLength(p,s),width=p.area/length;
    const w=p.axis==='y'?width:length,h=p.axis==='y'?length:width;
    return {x:p.x-w/2,y:p.y-h/2,w,h};
  }
  function platformInfo(p,s){
    const length=platformLength(p,s),width=p.area/length,center=p.axis==='y'?p.y:p.x;
    const connected=Number.isFinite(p.spanStart)&&Number.isFinite(p.spanEnd)?center-length/2<=p.spanStart+EPS&&center+length/2>=p.spanEnd-EPS:true;
    const box=dimensions(s.a),crossSize=p.axis==='y'?box.w:box.h;
    return {length,width,connected,fits:connected&&crossSize<=width+EPS};
  }
  function subtractRect(a,b){
    const x=Math.max(a.x,b.x),y=Math.max(a.y,b.y),r=Math.min(a.x+a.w,b.x+b.w),bottom=Math.min(a.y+a.h,b.y+b.h);
    if(r<=x+EPS||bottom<=y+EPS)return [a];
    return [
      {x:a.x,y:a.y,w:a.w,h:y-a.y},
      {x:a.x,y:bottom,w:a.w,h:a.y+a.h-bottom},
      {x:a.x,y,w:x-a.x,h:bottom-y},
      {x:r,y,w:a.x+a.w-r,h:bottom-y}
    ].filter(q=>q.w>EPS&&q.h>EPS);
  }
  function solids(l,s){
    const decks=(l.platforms||[]).map(p=>platformRect(p,s)),out=[];
    for(const w of l.walls){
      if(w.kind!=='pit'||!decks.length){out.push(w);continue;}
      let pieces=[w];for(const d of decks)pieces=pieces.flatMap(a=>subtractRect(a,d));out.push(...pieces);
    }
    out.push(...l.devices.filter(d=>!s.devices?.[d.id]));return out;
  }
  // Exact interval of an anchored deck intersecting each stone, even if both
  // endpoints are clear. Stretching increases one extent and decreases the other.
  function platformFraction(l,s,p,target){
    const old=platformLength(p,s),delta=target-old;if(Math.abs(delta)<EPS)return 1;let t=1;
    const along=p.axis==='y'?p.y:p.x,cross=p.axis==='y'?p.x:p.y;
    const lower=Math.max(p.minLength,p.area/(2*Math.min(cross-MARGIN,SIZE-MARGIN-cross)));
    const upper=Math.min(p.maxLength,2*Math.min(along-MARGIN,SIZE-MARGIN-along));
    if(target<lower)t=Math.min(t,(lower-old)/delta);if(target>upper)t=Math.min(t,(upper-old)/delta);
    for(const w of [...l.walls.filter(w=>w.kind!=='pit'),...l.devices.filter(d=>!s.devices?.[d.id])]){
      const wx=p.axis==='y'?w.y:w.x,wy=p.axis==='y'?w.x:w.y,ww=p.axis==='y'?w.h:w.w,wh=p.axis==='y'?w.w:w.h;
      const da=Math.max(wx-along,along-wx-ww,0),dc=Math.max(wy-cross,cross-wy-wh,0);
      const lo=2*da,hi=dc<EPS?Infinity:p.area/(2*dc);if(lo>=hi-EPS)continue;
      const ta=(lo-old)/delta,tb=(hi-old)/delta,enter=Math.min(ta,tb),exit=Math.max(ta,tb);
      if(exit>Math.max(0,enter)+EPS&&enter<1&&exit>0)t=Math.min(t,Math.max(0,enter-1e-8));
    }
    return clamp(t,0,1);
  }
  function platformGeometryValid(l,s,p){
    const r=platformRect(p,s);if(![r.x,r.y,r.w,r.h].every(Number.isFinite)||r.w<=0||r.h<=0)return false;
    if(r.x<MARGIN-EPS||r.y<MARGIN-EPS||r.x+r.w>SIZE-MARGIN+EPS||r.y+r.h>SIZE-MARGIN+EPS)return false;
    return ![...l.walls.filter(w=>w.kind!=='pit'),...l.devices.filter(d=>!s.devices?.[d.id])].some(w=>overlap(wallRect(r),wallRect(w)));
  }
  function collides(l,s){
    if(!s||![s.x,s.y,s.a].every(Number.isFinite)||s.a<MIN_A-EPS||s.a>MAX_A+EPS)return true;
    const r=rect(s);if(r.l<MARGIN-EPS||r.r>SIZE-MARGIN+EPS||r.t<MARGIN-EPS||r.b>SIZE-MARGIN+EPS)return true;
    return solids(l,s).some(w=>overlap(r,wallRect(w)));
  }
  function insideGoal(l,s){const r=rect(s),g=goalRect(l);return r.l>=g.l-EPS&&r.r<=g.r+EPS&&r.t>=g.t-EPS&&r.b<=g.b+EPS;}
  const canWin=(l,s)=>insideGoal(l,s)&&!collides(l,s);
  function segmentEntry(x,y,dx,dy,b){
    let enter=-Infinity,exit=Infinity;
    for(const [p,v,lo,hi] of [[x,dx,b.l,b.r],[y,dy,b.t,b.b]]){
      if(Math.abs(v)<EPS){if(p<=lo+EPS||p>=hi-EPS)return null;continue;}
      const a=(lo-p)/v,z=(hi-p)/v;enter=Math.max(enter,Math.min(a,z));exit=Math.min(exit,Math.max(a,z));
    }
    if(exit<=Math.max(0,enter)+EPS||enter>1||exit<0)return null;return Math.max(0,enter);
  }
  function sweep(l,s,dx,dy){
    const d=dimensions(s.a),hw=d.w/2,hh=d.h/2;let t=1;
    if(dx>0)t=Math.min(t,(SIZE-MARGIN-hw-s.x)/dx);if(dx<0)t=Math.min(t,(MARGIN+hw-s.x)/dx);
    if(dy>0)t=Math.min(t,(SIZE-MARGIN-hh-s.y)/dy);if(dy<0)t=Math.min(t,(MARGIN+hh-s.y)/dy);
    for(const w of solids(l,s)){const hit=segmentEntry(s.x,s.y,dx,dy,{l:w.x-hw,r:w.x+w.w+hw,t:w.y-hh,b:w.y+w.h+hh});if(hit!==null)t=Math.min(t,Math.max(0,hit-1e-8));}
    return clamp(t,0,1);
  }
  function morphFraction(l,s,target){
    const from=Math.log(s.a),delta=Math.log(target)-from;if(Math.abs(delta)<EPS)return 1;let t=1;
    const maxW=2*Math.min(s.x-MARGIN,SIZE-MARGIN-s.x),maxH=2*Math.min(s.y-MARGIN,SIZE-MARGIN-s.y);
    const lower=Math.max(MIN_A,(BASE/maxH)**2),upper=Math.min(MAX_A,(maxW/BASE)**2);
    if(target<lower)t=Math.min(t,(Math.log(lower)-from)/delta);if(target>upper)t=Math.min(t,(Math.log(upper)-from)/delta);
    for(const w of solids(l,s)){
      const dx=Math.max(w.x-s.x,s.x-w.x-w.w,0),dy=Math.max(w.y-s.y,s.y-w.y-w.h,0);
      const lo=dx===0?-Infinity:Math.log((2*dx/BASE)**2),hi=dy===0?Infinity:Math.log((BASE/(2*dy))**2);
      if(lo>=hi-EPS)continue;const ta=(lo-from)/delta,tb=(hi-from)/delta,enter=Math.min(ta,tb),exit=Math.max(ta,tb);
      if(exit>Math.max(enter,0)+EPS&&enter<1&&exit>0)t=Math.min(t,Math.max(0,enter-1e-8));
    }
    return clamp(t,0,1);
  }
  function initial(l){return {...l.start,a:l.start.a||1,won:false,moves:0,latches:{},devices:{},platforms:Object.fromEntries((l.platforms||[]).map(p=>[p.id,p.length]))};}
  function sensorTouch(c,s,lights){
    if(c.accept==='box'){
      const r=rect(s),x=clamp(c.x,r.l,r.r),y=clamp(c.y,r.t,r.b);
      return Math.hypot(c.x-x,c.y-y)<=(c.r||28)*.55;
    }
    const d=dimensions(s.a);
    return lights.some(l=>{
      const p=shadowFromBox(s,l);
      // Long pressure zones use the visible shadow centre, not its bounding box.
      if(c.w&&c.h)return Math.abs(p.x-c.x)<=c.w/2+EPS&&Math.abs(p.y-c.y)<=c.h/2+EPS;
      return ((c.x-p.x)/(d.w*.61))**2+((c.y-p.y)/(d.h*.39))**2<=1+EPS;
    });
  }
  class Game {
    constructor(index=0,customLevel=null){this.customLevel=customLevel;this.load(index);}
    get level(){return this._level;}
    load(index){
      this.index=this.customLevel?0:clamp(Math.trunc(index)||0,0,LEVELS.length-1);
      this._level=normalizeLevel(this.customLevel||LEVELS[this.index]);this.state=initial(this._level);
      this.lights=clone(this._level.lights);this.activeShadow=0;this.activeLight=0;this.inputMode='shadow';
      this.target=this._level.platforms.some(p=>p.id===this._level.defaultTarget)?this._level.defaultTarget:'box';
      this.history=[];this.before=null;this.events=[];this.updateWorld(false);
    }
    snapshot(){return {state:clone(this.state),lights:clone(this.lights),activeShadow:this.activeShadow,activeLight:this.activeLight,inputMode:this.inputMode,target:this.target};}
    begin(){if(!this.before&&!this.state.won)this.before=this.snapshot();}
    end(){
      if(!this.before)return false;const before=this.before;this.before=null;
      if(JSON.stringify(before)===JSON.stringify(this.snapshot()))return false;
      this.history.push(before);if(this.history.length>100)this.history.shift();this.state.moves=before.state.moves+1;
      if(canWin(this.level,this.state))this.state.won=true;return true;
    }
    undo(){if(!this.history.length)return false;this.before=null;const b=this.history.pop();this.state=clone(b.state);this.lights=clone(b.lights);this.activeShadow=b.activeShadow;this.activeLight=b.activeLight;this.inputMode=b.inputMode;this.target=b.target||'box';this.events=[];return true;}
    shadows(){return this.lights.map(l=>shadowFromBox(this.state,l));}
    shadow(i=this.activeShadow){return this.shadows()[clamp(i,0,this.lights.length-1)];}
    deviceOpen(id){return !!this.state.devices[id];}
    sensorState(c){const touch=sensorTouch(c,this.state,this.lights);return {touch,active:touch||!!this.state.latches[c.id]};}
    updateWorld(emit=true){
      for(const c of this.level.sensors)if(c.latch&&sensorTouch(c,this.state,this.lights))this.state.latches[c.id]=true;
      for(const d of this.level.devices){
        const c=this.level.sensors.find(c=>c.id===d.sensorId),old=!!this.state.devices[d.id];
        const powered=!!c&&this.sensorState(c).active;
        // Anti-crush: only an ALREADY OPEN device may stay open around the box.
        // Evaluating this against a future candidate position would allow tunnelling.
        const hold=old&&overlap(rect(this.state),wallRect(d));
        const open=powered||hold;this.state.devices[d.id]=open;
        if(emit&&old!==open)this.events.push({type:'device',id:d.id,kind:d.type,open,sensorId:d.sensorId});
      }
    }
    consumeEvents(){const e=this.events;this.events=[];return e;}
    selectShadow(i){if(!Number.isInteger(i)||i<0||i>=this.lights.length)return false;this.activeShadow=this.activeLight=i;return true;}
    selectLight(i){return this.selectShadow(i);}
    setInputMode(mode){if(mode==='light'&&this.lights.some(l=>l.movable)){this.target='box';this.inputMode='light';if(!this.lights[this.activeLight].movable)this.activeLight=this.lights.findIndex(l=>l.movable);}else this.inputMode='shadow';return this.inputMode;}
    setTarget(id){
      if(id!=='box'&&!this.level.platforms.some(p=>p.id===id))return false;
      this.target=id;this.inputMode='shadow';return true;
    }
    selectedPlatform(){return this.level.platforms.find(p=>p.id===this.target)||null;}
    setPlatformLength(id,target){
      const p=this.level.platforms.find(p=>p.id===id);
      if(!p||!Number.isFinite(target)||this.state.won)return nothing();
      target=clamp(target,p.minLength,p.maxLength);const old=platformLength(p,this.state);
      const t=platformFraction(this.level,this.state,p,target);let accepted=old+(target-old)*t,reason=t<1-EPS?'stone':'';
      const candidate=clone(this.state);candidate.platforms[id]=accepted;
      if(collides(this.level,candidate)){
        // A fixed box's support interval is convex in deck length. Find its
        // boundary without temporarily accepting an unsupported state.
        let low=0,high=1;
        for(let i=0;i<45;i++){const mid=(low+high)/2;candidate.platforms[id]=old+(accepted-old)*mid;if(collides(this.level,candidate))high=mid;else low=mid;}
        accepted=old+(accepted-old)*low;reason='support';
      }
      this.state.platforms[id]=accepted;this.updateWorld();
      return {changed:Math.abs(accepted-old)>EPS,blocked:Math.abs(accepted-target)>1e-5,reason};
    }
    resizePlatform(delta){const p=this.selectedPlatform();return p&&Number.isFinite(delta)?this.setPlatformLength(p.id,platformLength(p,this.state)+delta):nothing();}
    moveControl(dx,dy){
      const p=this.selectedPlatform();if(p)return this.resizePlatform(p.axis==='y'?dy:dx);
      return this.inputMode==='light'?this.moveLight(dx,dy):this.moveShadow(dx,dy);
    }
    controlValue(){const p=this.selectedPlatform();return p?(platformLength(p,this.state)-p.minLength)/(p.maxLength-p.minLength)*200-100:Math.log(this.state.a)/Math.log(4)*100;}
    setControlValue(value){
      if(!Number.isFinite(value))return nothing();const p=this.selectedPlatform(),v=clamp(value,-100,100);
      return p?this.setPlatformLength(p.id,p.minLength+(v+100)/200*(p.maxLength-p.minLength)):this.setAspect(Math.pow(4,v/100));
    }
    moveBox(dx,dy,slide=!this.level.axisMovement){
      if(this.state.won||![dx,dy].every(Number.isFinite))return nothing();
      dx=clamp(dx,-4000,4000);dy=clamp(dy,-4000,4000);const old=JSON.stringify(this.state);
      const count=Math.max(1,Math.ceil(Math.hypot(dx,dy)/3)),sx=dx/count,sy=dy/count;let blocked=false;
      for(let i=0;i<count;i++){
        const x=this.state.x,y=this.state.y,t=sweep(this.level,this.state,sx,sy);
        this.state.x+=sx*t;this.state.y+=sy*t;this.updateWorld();
        if(t<1-EPS){
          blocked=true;
          if(slide){for(const [ax,ay] of [[sx*(1-t),0],[0,sy*(1-t)]]){const u=sweep(this.level,this.state,ax,ay);this.state.x+=ax*u;this.state.y+=ay*u;this.updateWorld();}}
          if(Math.hypot(this.state.x-x,this.state.y-y)<EPS)break;
        }
      }
      return {changed:JSON.stringify(this.state)!==old,blocked};
    }
    moveShadow(dx,dy){
      if(![dx,dy].every(Number.isFinite))return nothing();
      const delta=this.level.axisMovement?axisBoxDelta(this.state,this.lights[this.activeShadow],dx,dy):{dx:dx/(1+SHADOW_SCALE),dy:dy/(1+SHADOW_SCALE)};
      return this.moveBox(delta.dx,delta.dy,!this.level.axisMovement);
    }
    moveLight(dx,dy){
      const l=this.lights[this.activeLight];if(!l?.movable||this.state.won||![dx,dy].every(Number.isFinite))return nothing();
      const b=l.bounds||{x1:60,y1:60,x2:940,y2:940},x=clamp(l.x+dx,b.x1,b.x2),y=clamp(l.y+dy,b.y1,b.y2),ox=l.x,oy=l.y;
      const n=Math.max(1,Math.ceil(Math.hypot(x-ox,y-oy)/4));
      for(let i=1;i<=n;i++){l.x=ox+(x-ox)*i/n;l.y=oy+(y-oy)*i/n;this.updateWorld();}
      return {changed:Math.hypot(x-ox,y-oy)>EPS,blocked:false};
    }
    setAspect(target){
      if(this.state.won||!this.level.allowMorph||!Number.isFinite(target))return nothing();
      target=clamp(target,MIN_A,MAX_A);const old=this.state.a,from=Math.log(old),to=Math.log(target),n=Math.max(1,Math.ceil(Math.abs(to-from)/.02));let blocked=false;
      for(let i=1;i<=n;i++){
        const next=Math.exp(from+(to-from)*i/n),t=morphFraction(this.level,this.state,next);
        this.state.a=Math.exp(Math.log(this.state.a)+(Math.log(next)-Math.log(this.state.a))*t);this.updateWorld();
        if(t<1-EPS){blocked=true;break;}
      }
      return {changed:Math.abs(this.state.a-old)>EPS,blocked};
    }
    serialize(){return {version:7,levelId:this.level.id,index:this.index,...this.snapshot()};}
    restore(data){
      if(!data||![6,7].includes(data.version)||!Number.isInteger(data.index)||!LEVELS[data.index]||data.levelId!==LEVELS[data.index].id)return false;
      if(data.version===6&&(LEVELS[data.index].platforms||[]).length)return false;
      const candidate=new Game(data.index),s=data.state;
      if(!s||![s.x,s.y,s.a].every(Number.isFinite)||!Number.isInteger(s.moves)||s.moves<0)return false;
      candidate.state={...initial(candidate.level),x:s.x,y:s.y,a:s.a,moves:s.moves};
      if(!candidate.level.allowMorph&&Math.abs(s.a-1)>EPS)return false;
      for(const c of candidate.level.sensors)if(c.latch&&s.latches?.[c.id]===true)candidate.state.latches[c.id]=true;
      if(!Array.isArray(data.lights)||data.lights.length!==candidate.lights.length)return false;
      for(let i=0;i<candidate.lights.length;i++){
        const l=candidate.lights[i],v=data.lights[i];if(!v||![v.x,v.y].every(Number.isFinite))return false;
        if(l.movable){const b=l.bounds||{x1:60,y1:60,x2:940,y2:940};l.x=clamp(v.x,b.x1,b.x2);l.y=clamp(v.y,b.y1,b.y2);}
      }
      if(candidate.level.platforms.length){
        if(!s.platforms||typeof s.platforms!=='object')return false;
        for(const p of candidate.level.platforms){const v=s.platforms[p.id];if(!Number.isFinite(v)||v<p.minLength-EPS||v>p.maxLength+EPS)return false;candidate.state.platforms[p.id]=v;}
      }
      // Persist only the anti-crush hold of a previously open gate.
      for(const d of candidate.level.devices)if(s.devices?.[d.id]===true&&overlap(rect(candidate.state),wallRect(d)))candidate.state.devices[d.id]=true;
      candidate.updateWorld(false);if(collides(candidate.level,candidate.state)||candidate.level.platforms.some(p=>!platformGeometryValid(candidate.level,candidate.state,p)))return false;
      candidate.state.won=!!s.won&&canWin(candidate.level,candidate.state);
      for(const key of ['activeShadow','activeLight'])candidate[key]=Number.isInteger(data[key])?clamp(data[key],0,candidate.lights.length-1):0;
      candidate.setInputMode(data.inputMode);if(data.version===7&&candidate.level.platforms.some(p=>p.id===data.target))candidate.setTarget(data.target);this.customLevel=null;this.index=candidate.index;this._level=candidate._level;
      this.state=candidate.state;this.lights=candidate.lights;this.activeShadow=candidate.activeShadow;this.activeLight=candidate.activeLight;this.inputMode=candidate.inputMode;this.target=candidate.target;this.history=[];this.before=null;this.events=[];return true;
    }
  }
  return {SIZE,MARGIN,BASE,MIN_A,MAX_A,SHADOW_SCALE,LEVELS,normalizeLevel,dimensions,rect,wallRect,goalRect,shadowFromBox,axisBoxDelta,collides,insideGoal,canWin,sensorTouch,initial,sweep,platformRect,platformLength,platformInfo,platformGeometryValid,solids,Game,createTestGame:l=>new Game(0,l)};
});
