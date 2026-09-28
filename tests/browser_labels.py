"""Render a valid saved state to check that overlapping object captions are suppressed."""
from pathlib import Path
import os
from playwright.sync_api import sync_playwright
import json,subprocess
P=Path(__file__).resolve().parents[1]
js="""const C=require('./src/core.js'),g=new C.Game(7),path=require('./tests/solutions.json')[7].steps.slice(0,4);for(const [type,x,y] of path){g.begin();if(type==='box')g.moveShadow((x-g.state.x)*1.5,(y-g.state.y)*1.5);if(type==='aspect')g.setAspect(x);g.end();}console.log(JSON.stringify({game:g.serialize(),completed:[],fine:false}));"""
save=subprocess.check_output(['node','-e',js],cwd=P,text=True).strip()
html=(P/'site-ready/index.html').read_text()
# An isolated storage fixture, not a live-game mutation API.
setup='''<script>window.captionLog=[];Object.defineProperty(window,'localStorage',{value:{getItem:()=>SAVE,setItem:()=>{}}});const proto=CanvasRenderingContext2D.prototype,old=proto.fillText,clear=proto.clearRect;proto.clearRect=function(...a){if(this.canvas.id==='board')window.captionLog=[];return clear.apply(this,a)};proto.fillText=function(t,x,y,...a){if(this.canvas.id==='board')window.captionLog.push({t,x,y});return old.call(this,t,x,y,...a)};</script>'''.replace('SAVE',json.dumps(save))
html=html.replace('<script>/* V7 touch UI',setup+'<script>/* V7 touch UI')
with sync_playwright() as p:
 b=p.chromium.launch(**({'executable_path':os.environ['BROWSER_EXECUTABLE']} if os.getenv('BROWSER_EXECUTABLE') else {}),args=['--no-sandbox']);page=b.new_page(viewport={'width':390,'height':844});page.set_content(html);page.wait_for_timeout(100)
 log=page.evaluate('window.captionLog');box=[r for r in log if r['t']=='상자'];pads=[r for r in log if r['t']=='상자로 누르기']
 assert pads,'Expected a floor-button caption'
 assert not any(abs(a['x']-q['x'])<90 and abs(a['y']-q['y'])<32 for a in box for q in pads),f'Overlapping box and button labels: {box}, {pads}'
 b.close();print('PASS: pressed button and box captions do not overlap')
# Before light A/B is introduced, a clipped shadow must not be labelled only "A".
start_js="const C=require('./src/core.js');console.log(JSON.stringify({game:new C.Game(5).serialize(),completed:[],fine:false}));"
start_save=subprocess.check_output(['node','-e',start_js],cwd=P,text=True).strip()
start_setup=setup.replace(json.dumps(save),json.dumps(start_save))
start_html=(P/'site-ready/index.html').read_text().replace('<script>/* V7 touch UI',start_setup+'<script>/* V7 touch UI')
with sync_playwright() as p:
 b=p.chromium.launch(**({'executable_path':os.environ['BROWSER_EXECUTABLE']} if os.getenv('BROWSER_EXECUTABLE') else {}),args=['--no-sandbox']);page=b.new_page(viewport={'width':390,'height':844});page.set_content(start_html);page.wait_for_timeout(100)
 captions=page.evaluate('window.captionLog.map(x=>x.t)')
 assert 'A' not in captions,f'An unexplained A marker appears before the two-light tutorial: {captions}'
 assert '그림자' in captions,'Off-board shadow should still be named'
 b.close();print('PASS: off-board single shadow has an explicit shadow label')
