import os
"""V7 UI regressions: DOM input, native Chromium touch, storage fixtures, no live-state setters."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json,math
P=Path(__file__).resolve().parents[1];HTML=(P/'qa/legacy-v7/index.html').read_text();report=[]
def check(name,ok,detail=None):
 if not ok:raise AssertionError(f'{name}: {detail}')
 report.append({'check':name,'pass':True,'detail':detail});print('PASS',name,flush=True)
 (P/'qa/v7-browser-partial.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
def snap(p):return p.evaluate('ShadowMorph.snapshot()')
def boot(b,w=390,h=844,stored=None):
 c=b.new_context(viewport={'width':w,'height':h},is_mobile=True,has_touch=True,device_scale_factor=2)
 p=c.new_page();errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
 html=HTML
 if stored is not None:
  setup="<script>window.__stored="+json.dumps(stored)+";Object.defineProperty(window,'localStorage',{value:{getItem:k=>window.__stored[k]||null,setItem:(k,v)=>{window.__stored[k]=v;}}});</script>"
  html=html.replace('<script>/* V7 touch UI',setup+'<script>/* V7 touch UI')
 p.set_content(html);p.wait_for_function('window.ShadowMorph && ShadowMorph.snapshot().ready');return c,p,errors
def pick(p,n):
 if p.locator('#winDialog').is_visible():p.locator('#replayBtn').click()
 p.locator('#stagesBtn').click();p.locator(f'[data-stage="{n}"].stage-card').click();p.wait_for_timeout(30);assert snap(p)['index']==n-1

def pad(p,dx,dy):
 r=p.locator('#touchpad').bounding_box();x=r['x']+r['width']/2;y=r['y']+r['height']/2
 p.mouse.move(x,y);p.mouse.down();p.mouse.move(x+dx,y+dy,steps=2);p.mouse.up()
def box_to(p,x,y):
 p.locator('[data-target="box"]').click()
 for _ in range(30):
  s=snap(p)['state'];dx=(x-s['x'])*1.5/3.2;dy=(y-s['y'])*1.5/3.2
  if math.hypot(dx,dy)<.01 or s['won']:return
  k=min(1,50/max(abs(dx),abs(dy)));pad(p,dx*k,dy*k)
  n=snap(p)['state']
  if math.hypot(n['x']-s['x'],n['y']-s['y'])<.001:return
 raise AssertionError('Unexpected long route')

def preset(p,val):p.locator(f'[data-aspect="{val}"]').click()
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path=os.environ.get('BROWSER_EXECUTABLE'),args=['--no-sandbox'])
 try:
  c,p,err=boot(b);p.locator('#newRoomsBtn').click();p.wait_for_timeout(50)
  check('15+ opens first new room without replaying old rooms',snap(p)['index']==14)
  check('room15 has visible box/platform selector',p.locator('[data-target="deck-a"]').is_visible())
  check('room15 displays total 19', '/ 19' in p.locator('#stageNum').inner_text())
  check('intro selects platform and exposes length control',snap(p)['target']=='deck-a' and p.locator('#shapeLabel').inner_text()=='발판 길이')
  before=snap(p);preset(p,4);after=snap(p)
  check('platform preset extends actual deck',abs(after['state']['platforms']['deck-a']-500)<.01)
  check('platform preset does not move or morph box',all(before['state'][k]==after['state'][k] for k in ['x','y','a']))
  check('bridge connection feedback names next action','상자를 선택' in p.locator('#objective').inner_text())
  check('dimensions state their grid unit','칸' in p.locator('#formNote').inner_text())
  p.wait_for_timeout(80);p.screenshot(path=str(P/'qa/mobile-stage15-connected.png'))
  p.locator('#undoBtn').click();check('undo restores actual deck length',snap(p)['state']['platforms']['deck-a']==180)
  # Drag the positive endpoint of the visible platform shadow.
  cv=p.locator('#board').bounding_box();x=cv['x']+563/1000*cv['width'];y=cv['y']+570/1000*cv['height']
  p.mouse.move(x,y);p.mouse.down();p.mouse.move(x+45,y,steps=3);p.mouse.up()
  check('on-board shadow end handle changes real length',snap(p)['state']['platforms']['deck-a']>300)
  check('end handle leaves box stationary',snap(p)['state']['x']==220)
  p.locator('#resetBtn').click();p.locator('[data-target="box"]').click();box_to(p,800,420)
  check('fast repeated swipes cannot cross unconnected river',snap(p)['state']['x']<350 and not snap(p)['state']['won'])
  p.locator('#resetBtn').click();preset(p,4);box_to(p,570,420)
  check('box can stand on constructed deck',abs(snap(p)['state']['x']-570)<.1)
  p.locator('[data-target="deck-a"]').click();preset(p,.25)
  check('shrink under passenger stops before floor disappears',snap(p)['state']['platforms']['deck-a']>=220-.01)
  check('blocked floor removal explains why','바닥' in p.locator('#status').inner_text())
  p.locator('#undoBtn').click();check('undo support-limited shrink restores full deck',abs(snap(p)['state']['platforms']['deck-a']-500)<.1)
  pick(p,16);preset(p,4)
  check('longest bridge warns about width','폭이 좁' in p.locator('#objective').inner_text())
  box_to(p,650,800);check('basic box cannot cross an overly thin bridge',snap(p)['state']['y']<340)
  p.locator('[data-target="deck-a"]').click();preset(p,1)
  check('balanced bridge is described as connected','연결 완료' in p.locator('#objective').inner_text())
  box_to(p,650,800);check('balanced width enables actual traversal',snap(p)['state']['y']>750)
  pick(p,18);before=snap(p);preset(p,4);p.locator('[data-target="deck-b"]').click();preset(p,4);after=snap(p)
  check('two platforms keep independent lengths',after['state']['platforms']=={'deck-a':440,'deck-b':500})
  check('multi-target controls do not change box',before['state']['x']==after['state']['x'] and before['state']['y']==after['state']['y'])
  p.wait_for_timeout(80);p.screenshot(path=str(P/'qa/mobile-stage18-two-platforms.png'))
  # Native touch, immediately followed by switching the object.
  pick(p,15);bb=p.locator('#touchpad').bounding_box();x=bb['x']+bb['width']/2;y=bb['y']+bb['height']/2;cdp=c.new_cdp_session(p)
  cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x,'y':y}]});cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':x+30,'y':y}]});cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
  check('native touch swipes resize selected platform',snap(p)['state']['platforms']['deck-a']>250)
  p.locator('[data-target="box"]').tap();check('target tap works immediately after native touch',snap(p)['target']=='box')
  saved=snap(p);p.set_viewport_size({'width':844,'height':390});p.wait_for_timeout(100)
  check('rotation preserves puzzle state',snap(p)['state']==saved['state'])
  cv=p.locator('#board').bounding_box();check('rotated board remains square',abs(cv['width']-cv['height'])<2)
  p.screenshot(path=str(P/'qa/mobile-v7-landscape.png'))
  p.set_viewport_size({'width':390,'height':844});pick(p,19)
  check('combined room starts with box controls',snap(p)['target']=='box')
  p.locator('[data-target="@light"]').click();check('combined-room light control disables shape edits',p.locator('#shapeSlider').is_disabled())
  p.locator('[data-target="deck-a"]').click();check('choosing deck exits light mode and re-enables resizing',snap(p)['inputMode']=='shadow' and not p.locator('#shapeSlider').is_disabled())
  check('no page errors in platform interactions',not err,err);c.close()
  # Persist a real played state, recreate the document, and verify restore.
  c,p,err=boot(b,stored={});p.locator('#newRoomsBtn').click();preset(p,4);played=snap(p);stored=p.evaluate('window.__stored');c.close()
  c,p,err=boot(b,stored=stored);check('played deck length and target restore across reload',snap(p)['state']==played['state'] and snap(p)['target']==played['target'] and snap(p)['index']==played['index']);c.close()
  # Legacy same-room migration; the original storage record remains byte-identical.
  import subprocess
  js="const C=require('./tests/v7-core.cjs'),g=new C.Game(8);let v=g.serialize();v.version=6;delete v.target;delete v.state.platforms;console.log(JSON.stringify({game:v,completed:[0,1,2],fine:true}));"
  legacy=subprocess.check_output(['node','-e',js],cwd=P,text=True).strip()
  c,p,err=boot(b,stored={'shadow-morph-v6-rebuild':legacy});check('V6 room9 progress migrates into V7',snap(p)['index']==8 and snap(p)['fine']);check('legacy storage key is never overwritten',p.evaluate('window.__stored["shadow-morph-v6-rebuild"]')==legacy);c.close()
  for w,h in [(360,640),(390,844),(844,390)]:
   c,p,err=boot(b,w,h)
   for n in [15,16,18,19]:
    pick(p,n)
    for target in ['deck-a','box']:
     p.locator(f'[data-target="{target}"]').click();p.wait_for_timeout(40)
     cv=p.locator('#board').bounding_box();ctrl=p.locator('.control-panel').bounding_box()
     overlap=not(cv['x']+cv['width']<=ctrl['x'] or ctrl['x']+ctrl['width']<=cv['x'] or cv['y']+cv['height']<=ctrl['y'] or ctrl['y']+ctrl['height']<=cv['y'])
     check(f'{w}x{h} room{n} {target}: square map and usable controls',abs(cv['width']-cv['height'])<2 and not overlap and ctrl['y']+ctrl['height']<=h+1 and cv['width']>=165,(cv['width'],ctrl['y']+ctrl['height']))
     check(f'{w}x{h} room{n} {target}: touch target >=44px',min(p.locator('[data-target]').evaluate_all('(els)=>els.map(e=>e.getBoundingClientRect().height)'))>=44)
   check(f'{w}x{h} platform layouts no runtime errors',not err,err);c.close()
  (P/'qa/v7-browser-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print(f'V7 browser assertions: {len(report)} PASS',flush=True)
 finally:b.close()
