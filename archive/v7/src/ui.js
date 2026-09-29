/* V7 touch UI. No dependencies, telemetry, network calls, or gameplay timers. */
(() => {
 'use strict';
 const $=id=>document.getElementById(id),C=window.ShadowCore;
 const canvas=$('board'),ctx=canvas.getContext('2d'),pad=$('touchpad'),slider=$('shapeSlider');
 const KEY='shadow-morph-v7-platforms',LEGACY_KEY='shadow-morph-v6-rebuild',game=new C.Game();
 let completed=new Set(),fine=false,storageOK=true,active=null,pending=0,keyFrame=0,keyTime=0;
 let effects=new Map(),lastPickIndex=-1;const keys=new Set(),dialogs=[...document.querySelectorAll('dialog')];
 const reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 function fail(error){$('bootNotice').innerHTML='<strong>게임을 초기화하지 못했어요</strong><span>파일 미리보기가 아닌 웹페이지에서 다시 열어주세요. 오류: </span>';$('bootNotice').lastChild.textContent+=''+(error.message||error);$('boardShell').classList.remove('ready');console.error(error);}
 try {
  const raw=JSON.parse(localStorage.getItem(KEY)||localStorage.getItem(LEGACY_KEY)||'null');
  if(raw&&game.restore(raw.game)){fine=!!raw.fine;completed=new Set((Array.isArray(raw.completed)?raw.completed:[]).filter(i=>Number.isInteger(i)&&i>=0&&i<C.LEVELS.length));}
 }catch(_){storageOK=false;}
 function save(){try{localStorage.setItem(KEY,JSON.stringify({game:game.serialize(),fine,completed:[...completed]}));storageOK=true;}catch(_){storageOK=false;}$('saveNote').textContent=storageOK?'V7 진행을 이 브라우저에 저장해요. V6의 같은 방 진행은 이어받고 이전 저장은 그대로 남겨요.':'이 환경에서는 저장이 제한돼요. 현재 게임은 플레이할 수 있지만 닫으면 진행이 사라질 수 있어요.';}
 function message(text,type=''){$('status').textContent=text;$('status').className='status-line '+type;}
 function deckFeedback(p){
  const info=C.platformInfo(p,game.state);
  if(!info.connected)return `${p.name}이 짧아요 · 양쪽 땅까지 늘려 보세요`;
  if(!info.fits)return `${p.name}은 연결됐지만 상자가 설 폭이 좁아요`;
  return `${p.name} 연결 완료 · 상자를 선택해 건너세요`;
 }
 function selectTarget(id){
  stopInput();game.begin();if(id==='@light')game.setInputMode('light');else game.setTarget(id);game.end();
  message(id==='box'?'이제 상자 그림자를 움직여요.':id==='@light'?'빛을 옮겨 상자 그림자를 보내세요.':deckFeedback(game.selectedPlatform()));
  save();sync();requestAnimationFrame(fitBoard);
 }
 function objective(){
  if(game.selectedPlatform())return deckFeedback(game.selectedPlatform());
  const off=game.level.devices.find(d=>!game.deviceOpen(d.id));
  if(off){const c=game.level.sensors.find(c=>c.id===off.sensorId);return `${c.accept==='box'?'상자 → ○ 버튼':'그림자 → '+(c.w?'그늘판':'◇ 장치')} → ${off.type==='bridge'?'다리 펼치기':'문 열기'}`;}
  if(game.level.devices.some(d=>!game.level.sensors.find(c=>c.id===d.sensorId).latch))return '그늘을 유지하며 통과 → 출구';
  return game.level.axisMovement?'점선 방향으로 이동 → 출구':'상자 전체를 출구에 넣고 손 떼기';
 }
 function sync(){
  $('stageNum').textContent=`STAGE ${String(game.index+1).padStart(2,'0')} / ${C.LEVELS.length} · ${game.level.chapter}`;
  $('stageName').textContent=game.level.name;$('stageTip').textContent=game.level.tip;$('objective').textContent=objective();
  const platform=game.selectedPlatform(),hasPlatforms=game.level.platforms.length>0;
  document.querySelector('.control-panel').classList.toggle('platform-selected',!!platform);
  $('shapeControl').hidden=!platform&&!game.level.allowMorph;$('firstRule').hidden=!!platform||game.level.allowMorph;
  $('shapeLabel').textContent=platform?'발판 길이':'상자 형태';
  const value=game.controlValue();
  $('shapeName').textContent=platform?(value<-30?'짧게':value>30?'길게':'중간'):game.state.a<.72?'세로형':game.state.a>1.38?'가로형':'기본형';
  slider.value=String(Math.round(value));slider.setAttribute('aria-label',platform?'발판 길이. 오른쪽으로 늘리면 폭은 줄어듭니다.':'상자 형태. 왼쪽은 세로형, 오른쪽은 가로형');
  slider.setAttribute('aria-valuetext',platform?`길이 ${(C.platformInfo(platform,game.state).length/50).toFixed(1)}칸`:`${$('shapeName').textContent} ${game.state.a.toFixed(2)}`);
  slider.disabled=game.inputMode==='light'||(!platform&&!game.level.allowMorph);
  document.querySelectorAll('.preset').forEach((b,i)=>{b.disabled=slider.disabled;const on=platform?Math.abs(value-[-100,0,100][i])<1:Math.abs(Math.log(Number(b.dataset.aspect)/game.state.a))<.04;b.classList.toggle('selected',on);b.setAttribute('aria-pressed',String(on));b.querySelector('.preset-label').textContent=platform?['짧게','중간','길게'][i]:['세로','기본','가로'][i];});
  const movable=game.lights.some(l=>l.movable),multi=game.lights.length>1;
  $('modeRow').hidden=hasPlatforms||(!movable&&!multi);$('modeLight').hidden=!movable;
  $('modeShadow').classList.toggle('active',game.inputMode==='shadow');$('modeShadow').setAttribute('aria-pressed',String(game.inputMode==='shadow'));
  $('modeLight').classList.toggle('active',game.inputMode==='light');$('modeLight').setAttribute('aria-pressed',String(game.inputMode==='light'));
  $('objectRow').hidden=!hasPlatforms;
  if(lastPickIndex!==game.index){
   lastPickIndex=game.index;$('lightSelector').replaceChildren();$('objectSelector').replaceChildren();
   if(hasPlatforms){
    const targets=[{id:'box',name:'상자'},...game.level.platforms.map(p=>({id:p.id,name:p.name})),...(movable?[{id:'@light',name:'빛 이동'}]:[])];
    for(const t of targets){const b=document.createElement('button');b.dataset.target=t.id;b.textContent=t.name;b.setAttribute('aria-label',t.id==='@light'?'빛 이동 모드':`${t.name} 그림자 선택`);b.onclick=()=>selectTarget(t.id);$('objectSelector').appendChild(b);}
   }
   if(multi)game.lights.forEach((l,i)=>{const b=document.createElement('button');b.textContent=String.fromCharCode(65+i);b.dataset.light=String(i);b.title=`${l.name} · ${l.movable?'옮길 수 있는 빛':'고정된 빛'}`;b.setAttribute('aria-label',`${l.name} 그림자 선택`);b.onclick=()=>selectLight(i);$('lightSelector').appendChild(b);});
  }
  $('lightSelector').querySelectorAll('button').forEach(b=>{const n=Number(b.dataset.light),selected=game.inputMode==='light'?game.activeLight:game.activeShadow,on=n===selected;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on));});
  $('objectSelector').querySelectorAll('button').forEach(b=>{const on=b.dataset.target===(game.inputMode==='light'?'@light':game.target);b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on));});
  $('moveTitle').textContent=platform?'발판 늘이기':game.inputMode==='light'?'빛 이동':game.level.axisMovement?'그림자 · 점선 방향':'그림자 이동';
  $('padText').textContent=platform?(platform.axis==='y'?'아래 길게 · 위 짧게':'오른쪽 길게 · 왼쪽 짧게'):game.inputMode==='light'?'상자는 그대로, 그림자만':game.level.axisMovement?'점선 방향으로 쓸어요':'손가락 방향으로 움직여요';
  $('formNote').textContent=platform?`길이 ${(C.platformInfo(platform,game.state).length/50).toFixed(1)}칸 · 폭 ${(C.platformInfo(platform,game.state).width/50).toFixed(1)}칸`:game.inputMode==='light'?'형태는 그림자 모드에서 바꿔요.':'길어질수록 얇아져요.';
  $('undoBtn').disabled=!game.history.length;$('fineBtn').setAttribute('aria-pressed',String(fine));$('fineLabel').textContent=fine?'정밀 ON':'정밀 OFF';
  const legend=$('legend'),html=[];
  if(game.level.sensors.some(c=>c.accept==='box'))html.push('<span class="box-legend">○ 상자로 누르기</span>');
  if(game.level.sensors.some(c=>c.accept==='shadow'))html.push(hasPlatforms?'<span>◇ 상자 그림자로 덮기</span>':'<span>◇ 그림자로 덮기</span>');
  if(game.level.sensors.some(c=>!c.latch))html.push('<span>그늘판: 덮는 동안만</span>');
  if(game.level.axisMovement)html.push('<span class="light-legend">점선 = 이동 방향</span>');
  if(hasPlatforms&&!platform)html.push('<span class="deck-legend">발판 그림자로 길 만들기</span>');
  legend.innerHTML=html.join('');$('hintText').textContent=game.level.hint;
  canvas.dataset.stage=String(game.index+1);requestPaint();
 }
 const colorFor=c=>c?.accept==='box'?'#f4c777':'#c4a6fb';
 const rr=(c,x,y,w,h,r=8)=>{r=Math.min(r,w/2,h/2);c.beginPath();c.moveTo(x+r,y);c.lineTo(x+w-r,y);c.quadraticCurveTo(x+w,y,x+w,y+r);c.lineTo(x+w,y+h-r);c.quadraticCurveTo(x+w,y+h,x+w-r,y+h);c.lineTo(x+r,y+h);c.quadraticCurveTo(x,y+h,x,y+h-r);c.lineTo(x,y+r);c.quadraticCurveTo(x,y,x+r,y);c.closePath();};
 function text(c,str,x,y,size,color,weight=650){c.fillStyle=color;c.font=`${weight} ${size}px -apple-system,BlinkMacSystemFont,"Noto Sans KR",sans-serif`;c.textAlign='center';c.textBaseline='middle';c.fillText(str,x,y);}
 function circle(c,x,y,r,fill,stroke,w=3){c.beginPath();c.arc(x,y,r,0,Math.PI*2);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=w;c.stroke();}}
 function deviceAmount(d,g,time,mini){
  if(mini)return g.deviceOpen(d.id)?1:0;const fx=effects.get(d.id);if(!fx)return g.deviceOpen(d.id)?1:0;
  const p=Math.min(1,(time-fx.at)/450),u=p*p*(3-2*p);return fx.open?u:1-u;
 }
 function platformGhost(p,g){
  const r=C.platformRect(p,g.state),light=g.lights[g.activeShadow]||g.lights[0],q=C.shadowFromBox(p,light),scale=.7;
  return {x:q.x,y:q.y,w:r.w*scale,h:r.h*scale,axis:p.axis};
 }
 function drawDeck(c,p,g,mini){
  const r=C.platformRect(p,g.state),selected=g.target===p.id,info=C.platformInfo(p,g.state);
  rr(c,r.x,r.y,r.w,r.h,5);c.fillStyle=selected?'#3a9687':'#2d766e';c.fill();c.strokeStyle=selected?'#a5f9dc':'#6eafa3';c.lineWidth=selected?6:3;c.stroke();
  c.save();c.beginPath();c.rect(r.x,r.y,r.w,r.h);c.clip();c.strokeStyle='#b9efd04c';c.lineWidth=3;
  if(p.axis==='x'){for(let x=r.x+14;x<r.x+r.w;x+=25){c.beginPath();c.moveTo(x,r.y);c.lineTo(x,r.y+r.h);c.stroke();}}
  else{for(let y=r.y+14;y<r.y+r.h;y+=25){c.beginPath();c.moveTo(r.x,y);c.lineTo(r.x+r.w,y);c.stroke();}}
  c.restore();circle(c,p.x,p.y,9,'#1c3737','#caefdc',3);
  // Bank sockets mark the two endpoints the player is trying to reach.
  for(const edge of [p.spanStart,p.spanEnd])if(Number.isFinite(edge)){
   const x=p.axis==='y'?p.x:edge,y=p.axis==='y'?edge:p.y;circle(c,x,y,12,info.connected?'#a2e9c5':'#344153',info.connected?'#d1ffe9':'#f4bf7c',3);
  }
  if(!mini&&Math.hypot(g.state.x-p.x,g.state.y-p.y)<90)return;
  if(!mini)text(c,p.name,Math.max(90,Math.min(910,p.x)),Math.max(45,r.y-25),24,'#abeed6');
 }
 function drawDeckShadow(c,p,g,mini){
  const q=platformGhost(p,g),selected=g.target===p.id;c.save();c.globalAlpha=selected?1:.4;
  c.beginPath();c.moveTo(p.x,p.y);c.lineTo(q.x,q.y);c.setLineDash([8,10]);c.strokeStyle='#af9cda77';c.lineWidth=2;c.stroke();
  rr(c,q.x-q.w/2,q.y-q.h/2,q.w,q.h,10);c.fillStyle='#211633c0';c.fill();c.strokeStyle=selected?'#d7baff':'#9c8db9';c.lineWidth=selected?5:2;c.stroke();c.setLineDash([]);
  const len=p.axis==='y'?q.h:q.w;
  if(selected&&!mini){for(const sign of [-1,1]){const x=q.x+(p.axis==='x'?sign*len/2:0),y=q.y+(p.axis==='y'?sign*len/2:0);circle(c,x,y,29,'#f0e4ff','#8a70a4',4);text(c,p.axis==='y'?'↕':'↔',x,y,28,'#3a2b52');}}
  if(!mini){const inside=q.x>30&&q.x<970&&q.y>30&&q.y<970,x=Math.max(100,Math.min(900,q.x)),y=Math.max(48,Math.min(940,q.y+q.h/2+29));text(c,p.name+' 그림자',x,y,24,selected?'#e0c8ff':'#b8a6ce');if(!inside)circle(c,Math.max(40,Math.min(960,q.x)),Math.max(40,Math.min(960,q.y)),20,'#4c3d65','#c7b0eb');}
  c.restore();
 }
 function renderScene(c,target,g,time=0,mini=false){
  const s=g.state,l=g.level,d=C.dimensions(s.a),sh=g.shadows();
  c.setTransform(target.width/1000,0,0,target.height/1000,0,0);c.clearRect(0,0,1000,1000);
  c.fillStyle=g.index<5?'#1b2432':g.index<8?'#1c292e':'#20263a';c.fillRect(0,0,1000,1000);
  c.strokeStyle='#74829e15';c.lineWidth=1.2;c.beginPath();for(let a=50;a<1000;a+=50){c.moveTo(a,0);c.lineTo(a,1000);c.moveTo(0,a);c.lineTo(1000,a);}c.stroke();
  c.strokeStyle='#73809850';c.lineWidth=2;c.strokeRect(24,24,952,952);
  const goal=C.goalRect(l);c.fillStyle='#7bdfb425';c.fillRect(goal.l,goal.t,goal.r-goal.l,goal.b-goal.t);c.strokeStyle='#8fe0bd';c.lineWidth=5;c.setLineDash([15,9]);c.strokeRect(goal.l,goal.t,goal.r-goal.l,goal.b-goal.t);c.setLineDash([]);if(!mini)text(c,'출구',l.goal.x,l.goal.y,30,'#b8f2d9');
  // Physical solids: stone and voids are deliberately different materials.
  for(const w of l.walls){
   c.fillStyle=w.kind==='pit'?'#0c1521':'#465368';c.fillRect(w.x,w.y,w.w,w.h);
   c.save();c.beginPath();c.rect(w.x,w.y,w.w,w.h);c.clip();c.strokeStyle=w.kind==='pit'?'#2f66815c':'#53657a';c.lineWidth=w.kind==='pit'?3:5;
   for(let k=w.x-w.h;k<w.x+w.w+w.h;k+=w.kind==='pit'?44:34){c.beginPath();c.moveTo(k,w.y);c.lineTo(k+w.h,w.y+w.h);c.stroke();}c.restore();
   c.strokeStyle=w.kind==='pit'?'#53829a':'#8290a4';c.lineWidth=3;c.strokeRect(w.x+1,w.y+1,w.w-2,w.h-2);
  }
  for(const p of l.platforms)drawDeck(c,p,g,mini);
  // Each device has a visible cable to its actual driver, not a hidden checklist.
  l.devices.forEach(v=>{
   const sensor=l.sensors.find(q=>q.id===v.sensorId),on=g.deviceOpen(v.id),color=colorFor(sensor),x=v.x+v.w/2,y=v.y+v.h/2;
   c.beginPath();c.moveTo(sensor.x,sensor.y);c.lineTo(x,sensor.y);c.lineTo(x,y);c.strokeStyle=on?color+'a0':color+'48';c.lineWidth=on?5:3;c.setLineDash(on?[]:[8,10]);c.stroke();c.setLineDash([]);
   const fx=!mini&&effects.get(v.id);if(fx&&time-fx.at<850){const p=(time-fx.at)/850,mid=Math.abs(x-sensor.x),end=mid+Math.abs(y-sensor.y),dist=p*end,px=dist<mid?sensor.x+(x-sensor.x)*(dist/(mid||1)):x,py=dist<mid?sensor.y:sensor.y+(y-sensor.y)*((dist-mid)/(end-mid||1));circle(c,px,py,9,color,null);}
   const amount=deviceAmount(v,g,time,mini);
   if(v.type==='bridge'){
    c.fillStyle='#0b1422';c.fillRect(v.x,v.y,v.w,v.h);c.strokeStyle='#5798ae';c.lineWidth=4;c.strokeRect(v.x,v.y,v.w,v.h);
    c.save();c.beginPath();c.rect(v.x,v.y,v.w,v.h);c.clip();
    if(amount>0){const vertical=v.w>v.h,gw=vertical?v.w:v.w*amount,gh=vertical?v.h*amount:v.h;c.fillStyle='#3c887b';c.fillRect(v.x,v.y,gw,gh);c.strokeStyle='#91dbbc';c.lineWidth=4;if(vertical){for(let q=v.y;q<v.y+gh;q+=22){c.beginPath();c.moveTo(v.x,q);c.lineTo(v.x+gw,q);c.stroke();}}else{for(let q=v.x;q<v.x+gw;q+=22){c.beginPath();c.moveTo(q,v.y);c.lineTo(q,v.y+gh);c.stroke();}}}
    c.restore();if(!mini)text(c,amount>.95?'다리':'끊긴 길',x,y,25,amount>.95?'#caffea':'#8bb4c7');
   }else{
    c.fillStyle=color+'18';c.fillRect(v.x,v.y,v.w,v.h);c.strokeStyle=color;c.lineWidth=4;c.strokeRect(v.x,v.y,v.w,v.h);
    const vertical=v.h>v.w,part=(vertical?v.h:v.w)*(1-amount)/2;c.fillStyle=color+'b8';
    if(vertical){c.fillRect(v.x,v.y,v.w,part);c.fillRect(v.x,v.y+v.h-part,v.w,part);}else{c.fillRect(v.x,v.y,part,v.h);c.fillRect(v.x+v.w-part,v.y,part,v.h);}
    if(amount<.9&&!mini){circle(c,x,y,19,'#293142',color);text(c,'문',x,y,22,'#ffffff');}
   }
  });
  // Sensors have different silhouettes as well as different colours.
  l.sensors.forEach(q=>{
   const state=g.sensorState(q),color=colorFor(q),on=state.active;
   if(q.w&&q.h){rr(c,q.x-q.w/2,q.y-q.h/2,q.w,q.h,14);c.fillStyle=on?'#7864b65e':'#6a558f24';c.fill();c.strokeStyle=on?'#d2baff':'#a18dcd';c.lineWidth=4;c.setLineDash([9,6]);c.stroke();c.setLineDash([]);if(!mini){text(c,'그늘판',q.x,q.y-15,28,'#d5c5f5');if(q.w>180)text(c,'그림자 중심을 안에',q.x,q.y+23,22,'#b5a4d3');}}
   else if(q.accept==='box'){circle(c,q.x,q.y+4,40,'#171c26','#827050',4);circle(c,q.x,q.y+(on?6:-2),30,on?'#70bf9e':'#d6ad69',on?'#b1ecd1':'#ffe0a0',4);if(!mini)text(c,on?'✓':'○',q.x,q.y+(on?6:-2),27,'#222c2e');}
   else{c.beginPath();c.moveTo(q.x,q.y-38);c.lineTo(q.x+38,q.y);c.lineTo(q.x,q.y+38);c.lineTo(q.x-38,q.y);c.closePath();c.fillStyle=on?'#5e9a88':'#332b4a';c.fill();c.strokeStyle=on?'#acedd3':color;c.lineWidth=4;c.stroke();if(!mini)text(c,on?'✓':'◇',q.x,q.y,30,on?'#d8ffec':color);}
   if(!mini&&!q.w)text(c,q.accept==='box'?'상자로 누르기':l.platforms.length?'상자 그림자로':'그림자로 덮기',q.x,q.y+65,24,color);
  });
  // Projected links, plus the exact allowed radial axis from stage 10.
  g.lights.forEach((light,i)=>{
   const selected=i===g.activeShadow;
   if(l.axisMovement&&selected&&!mini){const vx=s.x-light.x,vy=s.y-light.y,n=Math.hypot(vx,vy)||1;c.strokeStyle='#ddd5fe6e';c.lineWidth=3;c.setLineDash([11,12]);c.beginPath();c.moveTo(s.x-vx/n*1600,s.y-vy/n*1600);c.lineTo(s.x+vx/n*1600,s.y+vy/n*1600);c.stroke();c.setLineDash([]);}
   c.strokeStyle=selected?'#bfa5ea60':'#8590ad39';c.lineWidth=2;c.beginPath();c.moveTo(light.x,light.y);c.lineTo(s.x,s.y);c.lineTo(sh[i].x,sh[i].y);c.stroke();
  });
  for(const p of l.platforms)drawDeckShadow(c,p,g,mini);
  sh.forEach((p,i)=>{
   const selected=g.target==='box'&&i===g.activeShadow,inside=p.x>=20&&p.x<=980&&p.y>=20&&p.y<=980;
   c.beginPath();c.ellipse(p.x,p.y,d.w*.61,d.h*.39,0,0,Math.PI*2);c.fillStyle=selected?'#171126ec':'#171329b0';c.fill();c.strokeStyle=selected?'#d0b2ff':'#9383b1';c.lineWidth=selected?5:3;c.setLineDash([8,6]);c.stroke();c.setLineDash([]);
   if(!mini&&inside)text(c,g.lights.length>1?`그림자 ${String.fromCharCode(65+i)}`:'그림자',Math.max(80,Math.min(920,p.x)),Math.max(40,Math.min(960,p.y+d.h*.39+25)),25,selected?'#d5baff':'#a599bb');
   if(!mini&&!inside){const x=Math.max(36,Math.min(964,p.x)),y=Math.max(36,Math.min(964,p.y));circle(c,x,y,24,'#352943','#b4a1d6',3);text(c,g.lights.length>1?String.fromCharCode(65+i):'◒',x,y,25,'#d6c0f4');if(g.lights.length===1)text(c,'그림자',Math.max(80,Math.min(920,x)),y>900?y-42:y+42,23,'#d6c0f4');}
  });
  const r=C.rect(s),gradient=c.createLinearGradient(r.l,r.t,r.r,r.b);gradient.addColorStop(0,'#ffe0a2');gradient.addColorStop(1,'#d49b48');rr(c,r.l,r.t,d.w,d.h,8);c.fillStyle=gradient;c.fill();c.strokeStyle='#ffe8b8';c.lineWidth=3;c.stroke();c.strokeStyle='#7a4d2a4a';c.lineWidth=3;c.strokeRect(r.l+9,r.t+9,d.w-18,d.h-18);const boxLabelY=Math.min(960,s.y+d.h/2+23),nearSensorLabel=l.sensors.some(q=>!q.w&&Math.abs(q.x-s.x)<90&&Math.abs(q.y+65-boxLabelY)<32);if(!mini&&!nearSensorLabel)text(c,'상자',s.x,boxLabelY,24,'#f5d096');
  g.lights.forEach((light,i)=>{
   const selected=g.inputMode==='light'?i===g.activeLight:i===g.activeShadow;
   if(selected&&(l.axisMovement||light.movable)){circle(c,light.x,light.y,30,null,'#efd48b6c',4);}
   circle(c,light.x,light.y,14,light.movable?'#ffe08c':'#c0b68f','#fff0c2',3);
   if(!mini&&(light.movable||g.lights.length>1))text(c,`${String.fromCharCode(65+i)} · ${light.movable?'이동':'고정'}`,Math.max(64,Math.min(936,light.x)),Math.max(31,light.y-40),21,'#ddd1a7');
  });
 }
 function paint(time=performance.now()){
  pending=0;try{renderScene(ctx,canvas,game,time);$('boardShell').classList.add('ready');}catch(e){fail(e);return;}
  if(!reduced&&[...effects.values()].some(f=>time-f.at<900))requestPaint();
 }
 function requestPaint(){if(!pending)pending=requestAnimationFrame(paint);}
 function fitBoard(){const r=$('boardStage').getBoundingClientRect(),side=Math.floor(Math.min(r.width-2,r.height-2,620));if(side<1)return;$('boardShell').style.setProperty('--board-px',side+'px');const n=Math.round(side*Math.min(window.devicePixelRatio||1,3));if(canvas.width!==n||canvas.height!==n){canvas.width=n;canvas.height=n;}requestPaint();}
 function afterMutation(result){
  const events=game.consumeEvents();for(const e of events)effects.set(e.id,{open:e.open,at:performance.now()-(reduced?900:0)});
  if(events.length){const e=events[events.length-1],sensor=game.level.sensors.find(c=>c.id===e.sensorId);message(e.open?`${sensor.accept==='box'?'상자가 버튼을 눌러':'그림자가 장치를 덮어'} ${e.kind==='bridge'?'다리가 펼쳐졌어요!':'문이 열렸어요!'}`:'그림자가 벗어나 문이 닫혔어요.','success');}
  else if(result.blocked)message(result.reason==='support'?'상자를 받칠 바닥이 사라져서 더 바꿀 수 없어요.':result.reason==='stone'?'발판이 벽이나 화면 끝에 닿았어요.':'상자가 걸렸어요. 모양을 바꿀 때는 땅 쪽으로 조금 물러나세요.','warn');
  else if(game.selectedPlatform())message(deckFeedback(game.selectedPlatform()));
  else if(!result.changed&&game.level.axisMovement&&game.inputMode==='shadow')message('점선 방향으로 쓸거나, 빛을 옮겨 방향을 바꿔요.');
  else if(game.inputMode==='light')message('상자는 그대로 · 빛을 움직이면 그림자가 이동해요.');
  else message(game.level.devices.length?objective():'상자 전체를 출구에 넣고 손을 떼세요.');
  sync();
 }
 function dialogOpen(id){stopInput();dialogs.forEach(d=>{if(d.open)closeDialog(d);});const d=$(id);if(typeof d.showModal==='function')d.showModal();else{d.setAttribute('open','');d.classList.add('fallback-modal');}}
 function closeDialog(d){if(typeof d.close==='function')d.close();else d.removeAttribute('open');}
 const hasDialog=()=>dialogs.some(d=>d.open);
 function showWin(){completed.add(game.index);save();$('winEyebrow').textContent=`STAGE ${String(game.index+1).padStart(2,'0')} CLEAR`;$('winTitle').textContent=game.index===C.LEVELS.length-1?'내 손으로 길을 만들었어요.':'이번 방에서 달라진 것';$('winText').textContent=game.level.meaning;$('nextBtn').textContent=game.index===C.LEVELS.length-1?'모든 방 다시 보기 →':'다음 방 →';dialogOpen('winDialog');}
 function finish(){if(!active&&!game.before)return;active=null;pad.classList.remove('active');$('padKnob').style.transform='';game.end();save();sync();if(game.state.won&&!$('winDialog').open)showWin();}
 function stopInput(){keys.clear();if(keyFrame)cancelAnimationFrame(keyFrame);keyFrame=0;if(active||game.before)finish();}
 function load(i){stopInput();dialogs.forEach(d=>{if(d.open)closeDialog(d);});game.load(i);effects.clear();lastPickIndex=-1;message(game.level.tip);save();sync();requestAnimationFrame(fitBoard);}
 function selectLight(i){stopInput();game.begin();game.selectShadow(i);if(game.inputMode==='light'&&!game.lights[i].movable)game.setInputMode('shadow');game.end();message(`${game.lights[i].name}의 그림자를 선택했어요.`);save();sync();}
 function point(e){const r=canvas.getBoundingClientRect();return {x:(e.clientX-r.left)*1000/r.width,y:(e.clientY-r.top)*1000/r.height};}
 function startDrag(e,element){
  if(active||hasDialog()||game.state.won||e.button>0)return;e.preventDefault();
  let stretchSign=0;
  if(element===canvas){
   const p=point(e),radius=Math.max(64,24*1000/canvas.getBoundingClientRect().width);
   const selectedBoxHit=game.target==='box'&&game.shadows().some(q=>Math.hypot(p.x-Math.max(36,Math.min(964,q.x)),p.y-Math.max(36,Math.min(964,q.y)))<radius);
   if(game.inputMode!=='light'&&game.level.platforms.length&&!selectedBoxHit){
    let hit=null;
    for(const platform of [...game.level.platforms].reverse()){
     const q=platformGhost(platform,game),len=platform.axis==='y'?q.h:q.w;
     for(const sign of [-1,1]){const hx=q.x+(platform.axis==='x'?sign*len/2:0),hy=q.y+(platform.axis==='y'?sign*len/2:0);if(Math.hypot(p.x-hx,p.y-hy)<radius)hit={platform,sign};}
     if(!hit&&Math.abs(p.x-q.x)<q.w/2&&Math.abs(p.y-q.y)<q.h/2)hit={platform,sign:0};
     if(hit)break;
    }
    if(hit){game.begin();game.setTarget(hit.platform.id);stretchSign=hit.sign;
     active={type:'move',id:e.pointerId,el:element,x:e.clientX,y:e.clientY,sx:e.clientX,sy:e.clientY,stretchSign};
     if(element.setPointerCapture)element.setPointerCapture(e.pointerId);sync();return;
    }
   }
   const arr=game.inputMode==='light'?game.lights:game.shadows().map(s=>({x:Math.max(36,Math.min(964,s.x)),y:Math.max(36,Math.min(964,s.y))}));
   let best=-1,bestD=Infinity;arr.forEach((s,i)=>{const d=Math.hypot(p.x-s.x,p.y-s.y);if(d<radius&&d<bestD){best=i;bestD=d;}});
   if(best<0){message(game.inputMode==='light'?'빛을 잡거나 아래 패드를 사용하세요.':'보라색 그림자를 잡거나 아래 패드를 사용하세요.');return;}
   if(game.inputMode==='light'&&!game.lights[best].movable){message('이 빛은 고정돼 있어요. 그림자를 선택해 보세요.','warn');return;}
   game.begin();if(game.inputMode!=='light')game.setTarget('box');game.selectShadow(best);
  }else game.begin();
  active={type:'move',id:e.pointerId,el:element,x:e.clientX,y:e.clientY,sx:e.clientX,sy:e.clientY};
  if(element.setPointerCapture)element.setPointerCapture(e.pointerId);if(element===pad)pad.classList.add('active');sync();
 }
 function drag(e){
  if(!active||active.type!=='move'||e.pointerId!==active.id)return;e.preventDefault();
  const dx=e.clientX-active.x,dy=e.clientY-active.y;active.x=e.clientX;active.y=e.clientY;
  const gain=(active.el===pad?3.2:1000/canvas.getBoundingClientRect().width)*(fine?.4:1);
  const stretch=game.selectedPlatform(),result=stretch&&active.stretchSign?game.resizePlatform((stretch.axis==='y'?dy:dx)*gain*active.stretchSign*2/.7):game.moveControl(dx*gain,dy*gain);
  if(active.el===pad)$('padKnob').style.transform=`translate(${Math.max(-24,Math.min(24,(e.clientX-active.sx)*.25))}px,${Math.max(-20,Math.min(20,(e.clientY-active.sy)*.25))}px)`;
  afterMutation(result);
 }
 for(const el of [canvas,pad]){el.addEventListener('pointerdown',e=>startDrag(e,el));el.addEventListener('pointermove',drag);for(const name of ['pointerup','pointercancel','lostpointercapture'])el.addEventListener(name,e=>{if(active?.type==='move'&&active.id===e.pointerId)finish();});el.addEventListener('contextmenu',e=>e.preventDefault());}
 slider.addEventListener('pointerdown',e=>{if(active||slider.disabled){e.preventDefault();return;}game.begin();active={type:'shape',id:e.pointerId};});
 slider.addEventListener('input',()=>{if(slider.disabled||(active&&active.type!=='shape')){sync();return;}if(!game.before)game.begin();afterMutation(game.setControlValue(Number(slider.value)));});
 slider.addEventListener('change',()=>{if(!active||active.type==='shape')finish();});
 for(const name of ['pointerup','pointercancel'])window.addEventListener(name,e=>{if(active?.type==='shape'&&active.id===e.pointerId)finish();});
 document.querySelectorAll('.preset').forEach(b=>b.onclick=()=>{if(active||game.state.won||b.disabled)return;game.begin();afterMutation(game.selectedPlatform()?game.setControlValue(Number(b.dataset.aspect)===.25?-100:Number(b.dataset.aspect)===4?100:0):game.setAspect(Number(b.dataset.aspect)));finish();});
 for(const [id,mode] of [['modeShadow','shadow'],['modeLight','light']])$(id).onclick=()=>{stopInput();game.begin();game.setInputMode(mode);game.end();message(mode==='light'?'빛을 옮겨 그림자와 방향을 바꿔 보세요.':'그림자를 당겨 상자를 움직여요.');save();sync();};
 $('undoBtn').onclick=()=>{stopInput();game.undo();effects.clear();message('이동과 장치 변화를 함께 되돌렸어요.');save();sync();};
 $('resetBtn').onclick=()=>load(game.index);$('fineBtn').onclick=()=>{fine=!fine;message(fine?'정밀 ON · 천천히 움직여요.':'기본 속도로 움직여요.');save();sync();};
 function stagePicker(){
  const grid=$('stageGrid');grid.replaceChildren();let chapter='';
  C.LEVELS.forEach((l,i)=>{if(l.chapter!==chapter){chapter=l.chapter;const title=document.createElement('div');title.className='chapter-row';title.textContent=chapter;grid.appendChild(title);}const b=document.createElement('button');b.className='stage-card'+(i===game.index?' current':'');b.dataset.stage=String(i+1);b.innerHTML=`<canvas width="240" height="240" aria-hidden="true"></canvas><b>${String(i+1).padStart(2,'0')}</b><span>${l.name}</span><small>${l.tag}</small>${completed.has(i)?'<i class="check">✓</i>':''}`;b.onclick=()=>load(i);grid.appendChild(b);const cv=b.querySelector('canvas');renderScene(cv.getContext('2d'),cv,new C.Game(i),0,true);});dialogOpen('stageDialog');
 }
 // Some touch browsers omit the compatibility click just after a swipe.
 // Activate real taps on pointerup, cancel drags, suppress only their duplicate click.
 let pendingTap=null,lastTap=null;
 document.addEventListener('pointerdown',e=>{
  if(e.pointerType!=='touch')return;const b=e.target.closest('button');
  if(!b||b.disabled||active)return;e.preventDefault();pendingTap={b,id:e.pointerId,x:e.clientX,y:e.clientY};
 },true);
 document.addEventListener('pointerup',e=>{
  if(!pendingTap||pendingTap.id!==e.pointerId)return;const t=pendingTap;pendingTap=null;const r=t.b.getBoundingClientRect();
  if(Math.hypot(e.clientX-t.x,e.clientY-t.y)>14||e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)return;
  e.preventDefault();lastTap={b:t.b,time:performance.now()};if(!t.b.disabled)t.b.click();
 },true);
 document.addEventListener('pointercancel',()=>{pendingTap=null;},true);
 document.addEventListener('click',e=>{
  if(e.isTrusted&&(e.pointerType==='touch'||e.detail>0)&&lastTap&&performance.now()-lastTap.time<650&&e.target.closest('button')===lastTap.b){e.preventDefault();e.stopImmediatePropagation();}
 },true);
 $('newRoomsBtn').onclick=()=>load(14);$('stagesBtn').onclick=stagePicker;$('helpBtn').onclick=()=>dialogOpen('helpDialog');$('hintBtn').onclick=()=>{dialogOpen('helpDialog');$('hintText').scrollIntoView({block:'center'});};
 document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>closeDialog(b.closest('dialog')));$('nextBtn').onclick=()=>game.index===C.LEVELS.length-1?stagePicker():load(game.index+1);$('replayBtn').onclick=()=>load(game.index);
 function keyTick(time){
  if(!keys.size){keyFrame=0;return;}const dt=Math.min(.035,(time-keyTime)/1000||.016);keyTime=time;
  let dx=(keys.has('arrowright')?1:0)-(keys.has('arrowleft')?1:0),dy=(keys.has('arrowdown')?1:0)-(keys.has('arrowup')?1:0),n=Math.hypot(dx,dy)||1,rate=(fine?150:400)*dt;
  const result=game.moveControl(dx/n*rate,dy/n*rate);
  if(game.inputMode==='shadow'){const da=(keys.has('d')?1:0)-(keys.has('a')?1:0);if(da){const r=game.selectedPlatform()?game.resizePlatform(da*dt*240):game.setAspect(game.state.a*Math.exp(da*dt*1.8));result.changed||=r.changed;result.blocked||=r.blocked;}}
  afterMutation(result);keyFrame=requestAnimationFrame(keyTick);
 }
 window.addEventListener('keydown',e=>{const k=e.key.toLowerCase();if(hasDialog()||['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName))return;if(['arrowup','arrowdown','arrowleft','arrowright','a','d'].includes(k)){if(game.state.won||(active&&active.type!=='keyboard'))return;e.preventDefault();if(!active){game.begin();active={type:'keyboard'};}keys.add(k);if(!keyFrame){keyTime=performance.now();keyFrame=requestAnimationFrame(keyTick);}}else if(k==='r'){e.preventDefault();load(game.index);}else if(k==='z'){e.preventDefault();$('undoBtn').click();}});
 window.addEventListener('keyup',e=>{keys.delete(e.key.toLowerCase());if(!keys.size&&active?.type==='keyboard')stopInput();});
 window.addEventListener('blur',stopInput);document.addEventListener('visibilitychange',()=>{if(document.hidden)stopInput();});window.addEventListener('pagehide',()=>{stopInput();save();});window.addEventListener('resize',()=>{stopInput();fitBoard();});if(window.visualViewport)window.visualViewport.addEventListener('resize',fitBoard);if(window.ResizeObserver)new ResizeObserver(fitBoard).observe($('boardStage'));
 // Read-only QA surface: test tools cannot mutate live game state through it.
 window.ShadowMorph=Object.freeze({version:'7.1.0',snapshot:()=>({index:game.index,...game.snapshot(),historyLength:game.history.length,fine,storageOK,active:active?.type||null,ready:$('boardShell').classList.contains('ready')}),levels:()=>C.LEVELS.map(l=>({id:l.id,name:l.name,tag:l.tag}))});
 try{save();sync();fitBoard();requestAnimationFrame(fitBoard);if(game.state.won)showWin();}catch(e){fail(e);}
})();
