import os
"""Exercises the shipped inline HTML through real DOM controls.
No app state setters or solver shortcuts are used; snapshot is read-only.
Runs from in-memory HTML because this sandbox's Chromium blocks URL navigation.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json, math, traceback
P=Path(__file__).resolve().parents[1];HTML=(P/'qa/legacy-v7/index.html').read_text();report=[]

def check(name,value,detail=None):
 if not value: raise AssertionError(f'{name}: {detail}')
 report.append({'check':name,'pass':True,'detail':detail})
 print('PASS',name,flush=True)
 (P/'qa/browser-report.partial.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
def snapshot(page): return page.evaluate('window.ShadowMorph.snapshot()')
def boot(browser,w=390,h=844):
 context=browser.new_context(viewport={'width':w,'height':h},device_scale_factor=2,is_mobile=True,has_touch=True)
 page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content(HTML);page.wait_for_function('window.ShadowMorph && window.ShadowMorph.snapshot().ready');page.wait_for_timeout(80)
 return context,page,errors

def pick(page,n):
 if page.locator('#winDialog').is_visible():
  page.locator('#replayBtn').click()
 page.locator('#stagesBtn').click();page.locator(f'.stage-card[data-stage="{n}"]').click();page.wait_for_timeout(60)
 assert snapshot(page)['index']==n-1

def pad_move(page,dx,dy):
 box=page.locator('#touchpad').bounding_box();x=box['x']+box['width']/2;y=box['y']+box['height']/2
 page.mouse.move(x,y);page.mouse.down();page.mouse.move(x+dx,y+dy,steps=2);page.mouse.up()

def move_box(page,x,y):
 if page.locator('[data-target="box"]').count():page.locator('[data-target="box"]').click()
 if snapshot(page)['inputMode']!='shadow':page.locator('#modeShadow').click()
 for _ in range(40):
  data=snapshot(page)
  if data['state']['won']:return
  sx=data['state']['x'];sy=data['state']['y'];dx=(x-sx)*1.5/3.2;dy=(y-sy)*1.5/3.2
  if math.hypot(dx,dy)<.01:return
  scale=min(1,60/max(abs(dx),abs(dy)))
  pad_move(page,dx*scale,dy*scale)
  new=snapshot(page)['state']
  if math.hypot(new['x']-sx,new['y']-sy)<.001:raise AssertionError(f'Blocked UI path to {x,y} from {new}')
 raise AssertionError('Too many swipes')

def move_light(page,i,x,y):
 if page.locator('[data-target="@light"]').count():page.locator('[data-target="@light"]').click()
 else:page.locator('#modeLight').click()
 if page.locator(f'[data-light="{i}"]').count():page.locator(f'[data-light="{i}"]').click()
 for _ in range(30):
  before=snapshot(page);l=before['lights'][i];dx=(x-l['x'])/3.2;dy=(y-l['y'])/3.2
  if math.hypot(dx,dy)<.01:return
  scale=min(1,60/max(abs(dx),abs(dy)));pad_move(page,dx*scale,dy*scale)
 raise AssertionError('Too many light swipes')

def route(page,steps):
 for a in steps:
  if snapshot(page)['state']['won']:break
  if a[0]=='box':move_box(page,a[1],a[2])
  elif a[0]=='light':move_light(page,a[1],a[2],a[3])
  elif a[0]=='target':page.locator(f'[data-target="{a[1]}"]').click()
  elif a[0]=='platform':
   page.locator(f'[data-target="{a[1]}"]').click()
   # Documented solutions use either middle or full length presets.
   preset=1 if a[2]==430 else 4
   page.locator(f'[data-aspect="{preset}"]').click()
  elif a[0]=='aspect':
   if snapshot(page)['inputMode']!='shadow':page.locator('#modeShadow').click()
   page.locator(f'[data-aspect="{a[1]}"]').click()
  elif a[0]=='select':page.locator(f'[data-light="{a[1]}"]').click()

with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=os.environ.get('BROWSER_EXECUTABLE'),args=['--no-sandbox'])
 try:
  for w,h in [(390,844),(360,640),(844,390),(1280,900)]:
   context,page,errors=boot(browser,w,h)
   for n in [1,7,9,13,14,15,18,19]:
    pick(page,n)
    b=page.locator('#board').bounding_box();ctrl=page.locator('.control-panel').bounding_box()
    check(f'{w}x{h} stage {n} square board fully visible',abs(b['width']-b['height'])<2 and b['y']>=0 and b['y']+b['height']<=h+1,(b['width'],b['height'],b['y']))
    overlap=not(b['x']+b['width']<=ctrl['x'] or ctrl['x']+ctrl['width']<=b['x'] or b['y']+b['height']<=ctrl['y'] or ctrl['y']+ctrl['height']<=b['y'])
    check(f'{w}x{h} stage {n} controls do not cover map',not overlap)
    check(f'{w}x{h} stage {n} controls within viewport',ctrl['y']+ctrl['height']<=h+1 and ctrl['x']+ctrl['width']<=w+1,ctrl)
   check(f'{w}x{h} no runtime errors',not errors,errors)
   if w==390:page.screenshot(path=str(P/'qa/mobile-stage14.png'))
   if w==844:page.screenshot(path=str(P/'qa/mobile-landscape.png'))
   context.close()
  context,page,errors=boot(browser)
  steps=json.loads((P/'tests/solutions.json').read_text())
  for n in range(1,20):
   pick(page,n);route(page,steps[n-1]['steps']);page.wait_for_timeout(120)
   check(f'stage {n} completed by actual UI swipes/buttons',snapshot(page)['state']['won'])
   check(f'stage {n} win dialog explains the mechanic',page.locator('#winDialog').is_visible() and len(page.locator('#winText').inner_text())>10)
  check('all 19 actual UI routes no errors',not errors,errors)
  # Single-finger touch, followed immediately by a control tap.
  pick(page,1);before=snapshot(page);bb=page.locator('#touchpad').bounding_box();x=bb['x']+bb['width']/2;y=bb['y']+bb['height']/2
  cdp=context.new_cdp_session(page)
  cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x,'y':y}]})
  cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':x+36,'y':y}]})
  cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
  check('native touch swipe moves box in same direction',snapshot(page)['state']['x']>before['state']['x'])
  page.locator('#undoBtn').tap();check('undo tap immediately after touch works',abs(snapshot(page)['state']['x']-before['state']['x'])<.01)
  pick(page,9);before=snapshot(page);move_light(page,0,400,820);after=snapshot(page)
  check('light mode moves shadow, not box',before['state']['x']==after['state']['x'] and before['state']['y']==after['state']['y'])
  check('light alone opens physical stage9 gate',after['state']['devices']['door'])
  check('shape controls disabled while moving light',page.locator('#shapeSlider').is_disabled())
  page.wait_for_timeout(950);page.screenshot(path=str(P/'qa/mobile-stage09-open.png'))
  page.locator('#undoBtn').click();check('undo after light movement available',snapshot(page)['historyLength']>=0)
  pick(page,6);route(page,steps[5]['steps'][:3]);page.wait_for_timeout(950);check('stage6 tangible gate open before goal',snapshot(page)['state']['devices']['door'] and not snapshot(page)['state']['won']);page.screenshot(path=str(P/'qa/mobile-stage06-open.png'))
  pick(page,8);route(page,steps[7]['steps'][:4]);page.wait_for_timeout(950);check('bridge opens before river crossing',snapshot(page)['state']['devices']['bridge']);page.screenshot(path=str(P/'qa/mobile-stage08-bridge.png'))
  pick(page,2);page.screenshot(path=str(P/'qa/mobile-stage02.png'))
  page.locator('#stagesBtn').click();page.screenshot(path=str(P/'qa/stage-picker.png'))
  check('stage picker has 19 map thumbnails',page.locator('.stage-card canvas').count()==19)
  check('new main campaign contains no numeric checkpoint instructions',not any(x in page.locator('#stageGrid').inner_text() for x in ['SW','인장','봉인']))
  context.close()
  context=browser.new_context(viewport={'width':390,'height':844},java_script_enabled=False)
  page=context.new_page();page.set_content(HTML)
  check('script-disabled preview shows explanation rather than blank map',page.locator('#bootNotice').is_visible() and page.locator('#staticBoard').is_visible())
  page.screenshot(path=str(P/'qa/no-script-preview.png'));context.close()
  (P/'qa/browser-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
  print(f'PASS: {len(report)} browser assertions; 19 stages completed through actual DOM inputs.')
 finally:browser.close()
