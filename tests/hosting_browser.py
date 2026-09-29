"""Real HTTP/HTTPS campaign QA. Reads snapshots; all mutations use browser controls.
BROWSER_EXECUTABLE optionally selects a local browser; CI installs each engine.
"""
import argparse, functools, http.server, json, math, os, threading
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'qa';OUT.mkdir(exist_ok=True)
PKG=json.loads((ROOT/'package.json').read_text())
ROUTES=json.loads((ROOT/'tests/campaign40-solutions.json').read_text())
def room_id(id):return next(i+1 for i,r in enumerate(ROUTES) if r['levelId']==id)
parser=argparse.ArgumentParser()
parser.add_argument('--engine',choices=['chromium','webkit','firefox'],default='chromium')
parser.add_argument('--base-url');parser.add_argument('--smoke',action='store_true')
parser.add_argument('--fixture',action='store_true',help='Local sandbox only: in-memory HTML, no HTTP/storage claim')
parser.add_argument('--layout-only',action='store_true');parser.add_argument('--from-stage',type=int,default=1)
args=parser.parse_args();report=[]
class Handler(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
server=None
if args.base_url:URL=args.base_url.rstrip('/')+'/'
else:
 server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Handler,directory=str(ROOT/'site-ready')))
 threading.Thread(target=server.serve_forever,daemon=True).start();URL=f'http://127.0.0.1:{server.server_port}/'
def snap(p):return p.evaluate('ShadowMorph.snapshot()')
def frames(p):p.evaluate('()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))')
def check(name,ok,detail=None):
 report.append(dict(check=name,passed=bool(ok),detail=detail));print(('PASS ' if ok else 'FAIL ')+name,flush=True)
 (OUT/f'campaign40-{args.engine}.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
 if not ok:raise AssertionError(f'{name}: {detail}')
def fail(p,msg):
 (OUT/f'failure-{args.engine}.json').write_text(json.dumps(dict(message=msg,snapshot=snap(p)),ensure_ascii=False,indent=2))
 p.screenshot(path=str(OUT/f'failure-{args.engine}.png'));raise AssertionError(msg+' '+json.dumps(snap(p),ensure_ascii=False))
def boot(b,w=393,h=852,touch=True,deny=False,nojs=False,legacy=None):
 opt=dict(viewport=dict(width=w,height=h),has_touch=touch and args.engine!='firefox',device_scale_factor=2 if touch else 1,java_script_enabled=not nojs)
 if args.engine!='firefox':opt['is_mobile']=touch
 c=b.new_context(**opt)
 if deny:c.add_init_script("Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Blocked','SecurityError')}})")
 if legacy:c.add_init_script("localStorage.setItem('shadow-morph-v7-platforms',"+json.dumps(json.dumps(legacy))+ ");")
 p=c.new_page();errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
 if args.fixture:p.set_content((ROOT/'site-ready/index.html').read_text())
 else:
  r=p.goto(URL,wait_until='load',timeout=45000);assert r and r.status==200
 if not nojs:p.wait_for_function('window.ShadowMorph && ShadowMorph.snapshot().ready');frames(p)
 return c,p,errors

def pick(p,n):
 if p.locator('#winDialog').is_visible():p.locator('#replayBtn').click()
 p.locator('#stagesBtn').click();p.locator(f'[data-stage="{n}"].stage-card').click();frames(p)
 assert snap(p)['index']==n-1

def choose_box(p):
 if p.locator('[data-target="box"]').count():p.locator('[data-target="box"]').click()
 elif snap(p)['inputMode']!='shadow':p.locator('#modeShadow').click()
def choose_light(p,i):
 if p.locator('[data-target="@light"]').count():p.locator('[data-target="@light"]').click()
 else:p.locator('#modeLight').click()
 if p.locator(f'[data-light="{i}"]').count():p.locator(f'[data-light="{i}"]').click()
def fine(p,on):
 if snap(p)['fine']!=on:p.locator('#fineBtn').click()
def pad(p,dx,dy):
 p.bring_to_front();p.locator('#touchpad').focus();r=p.locator('#touchpad').bounding_box()
 x=round(r['x']+r['width']/2);y=round(r['y']+r['height']/2)
 p.mouse.move(x,y);p.mouse.down();frames(p)
 if snap(p)['active']!='move':p.mouse.up();fail(p,'pad did not capture pointer')
 p.mouse.move(x+round(dx),y+round(dy),steps=2);frames(p);p.mouse.up();frames(p)
def move_to(p,x,y,index=None):
 if index is None:choose_box(p)
 else:choose_light(p,index)
 previous=snap(p)['fine']
 if index is None and p.evaluate('ShadowCore.LEVELS[ShadowMorph.snapshot().index].axisMovement'):
  # A real pointer can arrive a CSS pixel off the authored witness. A fixed
  # radial light preserves that actual line; follow its projection, rather
  # than demanding an impossible lateral correction. No game-state writes.
  actual=snap(p);box=actual['state'];lamp=actual['lights'][actual['activeShadow']]
  ux,uy=box['x']-lamp['x'],box['y']-lamp['y'];length=math.hypot(ux,uy)
  if length<1e-6:fail(p,'undefined radial movement axis')
  ux/=length;uy/=length;t=(x-box['x'])*ux+(y-box['y'])*uy
  px,py=box['x']+ux*t,box['y']+uy*t
  if math.hypot(px-x,py-y)>12:fail(p,'witness is too far from the actual radial axis')
  x,y=px,py
 for _ in range(90):
  state=snap(p);a=state['state'] if index is None else state['lights'][index]
  dist=math.hypot(x-a['x'],y-a['y'])
  if state['state']['won'] or dist<=2.2:
   if not state['state']['won']:fine(p,previous)
   return
  fine(p,dist<30);gain=3.2*(.4 if dist<30 else 1);ratio=1.5 if index is None else 1
  dx=(x-a['x'])*ratio/gain;dy=(y-a['y'])*ratio/gain;k=min(1,52/max(abs(dx),abs(dy)))
  pad(p,dx*k,dy*k)
  after=snap(p);z=after['state'] if index is None else after['lights'][index]
  if math.hypot(z['x']-a['x'],z['y']-a['y'])<.0001:fail(p,f'blocked before {x,y}, light={index}')
 fail(p,'too many pad gestures')
def range_to(p,value):
 """Keyboard range input moves monotonically, never teleports slider state."""
 value=round(value);slider=p.locator('#shapeSlider');assert slider.is_visible() and slider.is_enabled()
 slider.focus()
 for _ in range(205):
  if snap(p)['state']['won']:return
  current=round(float(slider.input_value()))
  if current==value:return
  slider.press('ArrowRight' if value>current else 'ArrowLeft')
 fail(p,f'range blocked before {value}')
def route(p,steps):
 for stepno,action in enumerate(steps):
  if snap(p)['state']['won']:break
  kind,*a=action
  try:
   if kind=='box':move_to(p,*a)
   elif kind=='light':move_to(p,a[1],a[2],a[0])
   elif kind=='target':
    if a[0]=='box':choose_box(p)
    else:p.locator(f'[data-target="{a[0]}"]').click()
   elif kind=='select':choose_box(p);p.locator(f'[data-light="{a[0]}"]').click()
   elif kind=='platform':
    p.locator(f'[data-target="{a[0]}"]').click()
    meta=p.evaluate('(id)=>ShadowCore.LEVELS[ShadowMorph.snapshot().index].platforms.find(d=>d.id===id)',a[0])
    value=(a[1]-meta['minLength'])/(meta['maxLength']-meta['minLength'])*200-100
    range_to(p,value)
   elif kind=='aspect':
    choose_box(p)
    if a[0] in [.25,1,4]:p.locator(f'[data-aspect="{a[0]:g}"]').click()
    else:range_to(p,math.log(a[0],4)*100)
   else:raise AssertionError('Unknown action '+kind)
  except Exception as e:fail(p,f'room {snap(p)["index"]+1} action {stepno+1} {action}: {e}')

def layouts(b):
 sizes=[(320,568),(360,640),(393,852),(844,390),(768,1024),(1365,768),(1920,1080)] if not args.smoke else [(393,852),(1365,768)]
 for w,h in sizes:
  c,p,errors=boot(b,w,h,w<1000)
  for n in ([1,7,12,17,26,33,35,40] if not args.smoke else [1,17,40]):
   pick(p,n);board=p.locator('#board').bounding_box();controls=p.locator('.control-panel').bounding_box()
   def fits(r):return r['x']>=-1 and r['y']>=-1 and r['x']+r['width']<=w+1 and r['y']+r['height']<=h+1
   check(f'{w}x{h} room {n} square board',fits(board) and abs(board['width']-board['height'])<2 and board['width']>=100,board)
   overlap=not(board['x']+board['width']<=controls['x'] or controls['x']+controls['width']<=board['x'] or board['y']+board['height']<=controls['y'] or controls['y']+controls['height']<=board['y'])
   check(f'{w}x{h} room {n} usable separate controls',fits(controls) and not overlap,controls)
   if n==40:
    for selector in ['[data-light="0"]','[data-light="1"]','[data-target="deck-a"]','[data-target="deck-b"]','[data-target="@light"]']:
     check(f'{w}x{h} final room {selector}',p.locator(selector).is_visible() and fits(p.locator(selector).bounding_box()))
  check(f'{w}x{h} no runtime exception',not errors,errors)
  p.screenshot(path=str(OUT/f'{args.engine}-{w}x{h}-room40.png'));c.close()

def run():
 with sync_playwright() as pw:
  opts=dict(headless=True)
  if os.getenv('BROWSER_EXECUTABLE'):opts['executable_path']=os.environ['BROWSER_EXECUTABLE']
  if args.engine=='chromium':opts['args']=['--no-sandbox']
  b=getattr(pw,args.engine).launch(**opts)
  try:
   layouts(b)
   if args.layout_only:return
   c,p,errors=boot(b)
   version=json.loads((ROOT/'site-ready/version.json').read_text()) if args.fixture else p.evaluate("()=>fetch('version.json',{cache:'no-store'}).then(r=>r.json())")
   check('build identity (fixture)' if args.fixture else 'served campaign identity',version['stages']==40 and version['version']==PKG['version'],version)
   if args.base_url and os.getenv('EXPECTED_SHA'):check('published commit matches main build',version['commit']==os.environ['EXPECTED_SHA'],version)
   stages=[1,5,11,12,23,29,35,37,38,39,40] if args.smoke else range(args.from_stage,41)
   for n in stages:
    pick(p,n);route(p,ROUTES[n-1]['steps'])
    check(f'room {n} cleared using actual UI',snap(p)['state']['won']);check(f'room {n} completion visible',p.locator('#winDialog').is_visible())
   pick(p,6);range_to(p,100);check('deck feedback responds to physical connection','연결 완료' in p.locator('#objective').inner_text())
   alt=room_id('campaign40-39');pick(p,alt);route(p,ROUTES[alt-1]['alternateSteps']);check('independent preparation order still clears after reorder',snap(p)['state']['won'])
   pick(p,40);p.locator('[data-light="1"]').click();check('deck room can select second shadow',snap(p)['activeShadow']==1)
   p.locator('[data-target="deck-a"]').click();range_to(p,-90);p.locator('[data-target="box"]').click()
   before=snap(p)
   if not args.fixture:p.reload(wait_until='load');p.wait_for_function('window.ShadowMorph&&ShadowMorph.snapshot().ready')
   rest=snap(p)
   if not args.fixture:check('reload restores box/deck/light and selected object',before['state']==rest['state'] and before['target']==rest['target'] and before['activeShadow']==rest['activeShadow'])
   p.set_viewport_size(dict(width=844,height=390));frames(p);check('rotation keeps puzzle state',snap(p)['state']==rest['state'])
   check('active campaign no runtime errors',not errors,errors);c.close()
   c,p,errors=boot(b,1365,768,False)
   for n in ([26] if args.smoke else [5,11,12,23,29,35,37,40]):
    pick(p,n);route(p,ROUTES[n-1]['steps']);check(f'PC room {n} actual input route',snap(p)['state']['won'])
   pick(p,1);p.locator('#touchpad').focus();s=snap(p)['state'];p.keyboard.down('ArrowRight');p.wait_for_timeout(200);p.keyboard.up('ArrowRight');check('PC held arrow moves',snap(p)['state']['x']>s['x']+5)
   p.keyboard.press('z');check('PC Z restores gesture',abs(snap(p)['state']['x']-s['x'])<.01)
   pick(p,3);p.locator('#touchpad').focus();p.keyboard.down('d');p.wait_for_timeout(180);p.keyboard.up('d');check('PC D morphs',snap(p)['state']['a']>1.1)
   p.keyboard.press('r');check('PC R resets',abs(snap(p)['state']['a']-1)<.01)
   check('PC has no exceptions',not errors,errors);c.close()
   if args.engine=='chromium':
    c,p,errors=boot(b);s=snap(p)['state'];r=p.locator('#touchpad').bounding_box();x=r['x']+r['width']/2;y=r['y']+r['height']/2;cdp=c.new_cdp_session(p)
    cdp.send('Input.dispatchTouchEvent',dict(type='touchStart',touchPoints=[dict(x=x,y=y)]));cdp.send('Input.dispatchTouchEvent',dict(type='touchMove',touchPoints=[dict(x=x+30,y=y)]));cdp.send('Input.dispatchTouchEvent',dict(type='touchEnd',touchPoints=[]))
    check('native touch drag moves box',snap(p)['state']['x']>s['x']);p.locator('#undoBtn').tap();check('immediate touch tap undoes',abs(snap(p)['state']['x']-s['x'])<.01);c.close()
   c,p,errors=boot(b,deny=True);pad(p,20,0);check('denied storage still playable',snap(p)['state']['x']>230 and not snap(p)['storageOK'] and not errors);c.close()
   c,p,errors=boot(b,nojs=True);check('no-JS preview explains nonplayable state',p.locator('#staticBoard').is_visible() and p.locator('#bootNotice').is_visible());c.close()
   if not args.fixture:
    old={'game':None,'completed':[0,5,14],'fine':True}
    c,p,errors=boot(b,legacy=old);stored=p.evaluate("JSON.parse(localStorage.getItem('shadow-morph-campaign40-v8'))");unchanged=p.evaluate("JSON.parse(localStorage.getItem('shadow-morph-v7-platforms'))")
    check('legacy completion IDs migrate without rewriting original',len(stored['completedIds'])==3 and unchanged==old)
    p.locator('#stagesBtn').click();check('all40 thumbnails present',p.locator('.stage-card').count()==40);check('old deck completion follows ID into stage6',p.locator('[data-stage="6"] .check').is_visible());c.close()
  finally:b.close()
try:run()
finally:
 if server:server.shutdown()
print(f'{args.engine}: {len(report)} checks passed. Mode: {'fixture' if args.fixture else 'HTTP'}; URL: {URL}',flush=True)
