"""Cross-engine checks of the actual hosted build. No live-state setters.
CI serves real HTTP; --base-url exercises the deployed HTTPS site.
"""
import argparse
import functools
import http.server
import json
import math
import os
from pathlib import Path
import threading
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'qa'
OUT.mkdir(exist_ok=True)
parser = argparse.ArgumentParser()
parser.add_argument('--engine', choices=['chromium', 'webkit', 'firefox'], default='chromium')
parser.add_argument('--base-url')
parser.add_argument('--smoke', action='store_true')
parser.add_argument('--fixture', action='store_true', help='Sandbox-only in-memory HTML; CI uses real HTTP without this flag')
args = parser.parse_args()
report = []

def check(name, condition, details=None):
    row = {'check': name, 'pass': bool(condition), 'detail': details}
    report.append(row)
    print(('PASS ' if condition else 'FAIL ') + name, flush=True)
    (OUT / f'hosting-{args.engine}.json').write_text(json.dumps(report, ensure_ascii=False, indent=2))
    if not condition:
        raise AssertionError(f'{name}: {details}')

class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass

server = None
if args.base_url:
    URL = args.base_url.rstrip('/') + '/'
else:
    handler = functools.partial(QuietHandler, directory=str(ROOT / 'site-ready'))
    server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    URL = f'http://127.0.0.1:{server.server_port}/'

def snap(page):
    return page.evaluate('ShadowMorph.snapshot()')

def boot(browser, width=393, height=852, touch=True, blocked_storage=False, no_js=False):
    opts = dict(viewport={'width': width, 'height': height}, device_scale_factor=2 if touch else 1,
                has_touch=touch, java_script_enabled=not no_js)
    if args.engine != 'firefox':
        opts['is_mobile'] = touch
    context = browser.new_context(**opts)
    if blocked_storage:
        context.add_init_script("Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Blocked','SecurityError')}})")
    page = context.new_page()
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    if args.fixture:
        page.set_content((ROOT / 'site-ready/index.html').read_text())
    else:
        response = page.goto(URL, wait_until='load', timeout=45000)
        assert response and response.status == 200, 'HTTP entrypoint must return 200'
    if not no_js:
        page.wait_for_function('window.ShadowMorph && ShadowMorph.snapshot().ready', timeout=20000)
    return context, page, errors

def pick(page, number):
    if page.locator('#winDialog').is_visible():
        page.locator('#replayBtn').click()
    page.locator('#stagesBtn').click()
    page.locator(f'.stage-card[data-stage="{number}"]').click()
    page.wait_for_function('(n)=>ShadowMorph.snapshot().index===n-1', arg=number)
    # CSS layout updates and ResizeObserver have completed by this frame.
    page.evaluate('()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))')

def pad(page, dx, dy):
    b = page.locator('#touchpad').bounding_box()
    x, y = b['x'] + b['width']/2, b['y'] + b['height']/2
    page.mouse.move(x, y)
    page.mouse.down()
    page.mouse.move(x+dx, y+dy, steps=2)
    page.mouse.up()

def box_to(page, x, y):
    if page.locator('[data-target="box"]').count():
        page.locator('[data-target="box"]').click()
    if snap(page)['inputMode'] != 'shadow':
        page.locator('#modeShadow').click()
    for _ in range(45):
        before = snap(page)['state']
        if before['won']:
            return
        dx, dy = (x-before['x'])*1.5/3.2, (y-before['y'])*1.5/3.2
        if math.hypot(dx, dy) < .02:
            return
        gain = min(1, 58/max(abs(dx), abs(dy)))
        pad(page, dx*gain, dy*gain)
        now = snap(page)['state']
        if math.hypot(now['x']-before['x'], now['y']-before['y']) < .001:
            raise AssertionError(f'UI path blocked before {x,y}: {now}')
    raise AssertionError('Too many movement gestures')

def light_to(page, i, x, y):
    if page.locator('[data-target="@light"]').count():
        page.locator('[data-target="@light"]').click()
    else:
        page.locator('#modeLight').click()
    if page.locator(f'[data-light="{i}"]').count():
        page.locator(f'[data-light="{i}"]').click()
    for _ in range(40):
        before = snap(page)['lights'][i]
        dx, dy = (x-before['x'])/3.2, (y-before['y'])/3.2
        if math.hypot(dx, dy) < .02:
            return
        gain = min(1, 58/max(abs(dx), abs(dy)))
        pad(page, dx*gain, dy*gain)
    raise AssertionError('Too many light gestures')

def route(page, steps):
    for action in steps:
        if snap(page)['state']['won']:
            break
        kind, *a = action
        if kind == 'box':
            box_to(page, *a)
        elif kind == 'light':
            light_to(page, *a)
        elif kind == 'target':
            page.locator(f'[data-target="{a[0]}"]').click()
        elif kind == 'platform':
            page.locator(f'[data-target="{a[0]}"]').click()
            page.locator('[data-aspect="1"]' if a[1] == 430 else '[data-aspect="4"]').click()
        elif kind == 'aspect':
            if snap(page)['inputMode'] != 'shadow':
                page.locator('#modeShadow').click()
            page.locator(f'[data-aspect="{a[0]}"]').click()
        elif kind == 'select':
            page.locator(f'[data-light="{a[0]}"]').click()
        else:
            raise AssertionError(f'Unknown solution action {kind}')

try:
    with sync_playwright() as pw:
        launch = {'headless': True}
        exe = os.getenv('BROWSER_EXECUTABLE')
        if exe:
            launch['executable_path'] = exe
        if args.engine == 'chromium':
            launch['args'] = ['--no-sandbox']
        browser = getattr(pw, args.engine).launch(**launch)
        try:
            sizes = [(393,852),(1365,768)] if args.smoke else [(320,568),(360,640),(393,852),(844,390),(768,1024),(1365,768),(1920,1080)]
            for w, h in sizes:
                c, p, errors = boot(browser, w, h, touch=w<1000)
                for n in ([1,15,19] if args.smoke else [1,3,7,9,13,15,18,19]):
                    pick(p, n)
                    b, controls = p.locator('#board').bounding_box(), p.locator('.control-panel').bounding_box()
                    check(f'{w}x{h} room {n}: square board inside viewport', abs(b['width']-b['height'])<2 and b['width']>=100 and b['x']>=-1 and b['y']>=-1 and b['x']+b['width']<=w+1 and b['y']+b['height']<=h+1, b)
                    overlap = not (b['x']+b['width']<=controls['x'] or controls['x']+controls['width']<=b['x'] or b['y']+b['height']<=controls['y'] or controls['y']+controls['height']<=b['y'])
                    check(f'{w}x{h} room {n}: controls visible and separate', not overlap and controls['x']>=-1 and controls['y']>=-1 and controls['x']+controls['width']<=w+1 and controls['y']+controls['height']<=h+1, controls)
                check(f'{w}x{h}: canvas paint without runtime errors', not errors, errors)
                p.screenshot(path=str(OUT / f'{args.engine}-{w}x{h}.png'))
                c.close()
            c, p, errors = boot(browser)
            check('page and build identity loaded over HTTP', p.locator('meta[name="build-version"]').get_attribute('content')=='7.1.0')
            if not args.fixture:
                version = p.evaluate("()=>fetch('version.json',{cache:'no-store'}).then(r=>r.json())")
                check('version endpoint reports complete campaign', version['version']=='7.1.0' and version['stages']==19, version)
                if args.base_url and os.getenv('EXPECTED_SHA'):
                    check('deployed commit matches this run', version['commit']==os.environ['EXPECTED_SHA'], version)
            solutions = json.loads((ROOT/'tests/solutions.json').read_text())
            for n in ([1,15,19] if args.smoke else range(1,20)):
                pick(p,n)
                route(p,solutions[n-1]['steps'])
                check(f'room {n}: cleared using actual controls', snap(p)['state']['won'])
                check(f'room {n}: completion dialog visible', p.locator('#winDialog').is_visible())
            pick(p,15)
            p.locator('[data-aspect="4"]').click()
            p.locator('[data-target="box"]').click()
            box_to(p,300,420)
            before = snap(p)
            if not args.fixture:
                p.reload(wait_until='load')
                p.wait_for_function('window.ShadowMorph && ShadowMorph.snapshot().ready')
                restored = snap(p)
                check('real origin storage restores box and deck after reload', restored['index']==before['index'] and restored['state']==before['state'] and restored['target']==before['target'] and restored['storageOK'])
            else:
                restored = before
            p.set_viewport_size({'width':844,'height':390})
            p.wait_for_timeout(120)
            check('orientation change preserves puzzle', snap(p)['state']==restored['state'])
            check('hosted touch-sized context has no JS exceptions', not errors, errors)
            c.close()
            c, p, errors = boot(browser,1365,768,touch=False)
            pick(p,1)
            p.locator('#touchpad').focus()
            before = snap(p)['state']
            p.keyboard.down('ArrowRight');p.wait_for_timeout(220);p.keyboard.up('ArrowRight')
            check('PC held direction key moves box', snap(p)['state']['x']>before['x']+5)
            p.keyboard.press('z')
            check('PC Z undoes whole keyboard gesture', abs(snap(p)['state']['x']-before['x'])<.01)
            pick(p,3);p.locator('#touchpad').focus()
            p.keyboard.down('d');p.wait_for_timeout(150);p.keyboard.up('d')
            check('PC D changes box form',snap(p)['state']['a']>1.1)
            p.keyboard.press('r');check('PC R resets room', abs(snap(p)['state']['a']-1)<.01)
            check('PC input raises no errors',not errors,errors);c.close()
            if args.engine == 'chromium':
                c,p,errors=boot(browser)
                before=snap(p)['state'];b=p.locator('#touchpad').bounding_box();x=b['x']+b['width']/2;y=b['y']+b['height']/2
                cdp=c.new_cdp_session(p)
                cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x,'y':y}]})
                cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':x+35,'y':y}]})
                cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
                check('native Chromium touch moves box',snap(p)['state']['x']>before['x'])
                p.locator('#undoBtn').tap()
                check('tap right after swipe undoes correctly',abs(snap(p)['state']['x']-before['x'])<.01)
                c.close()
            c,p,errors=boot(browser,blocked_storage=True)
            pad(p,20,0)
            check('blocked storage remains playable',snap(p)['state']['x']>230 and not snap(p)['storageOK'] and not errors)
            c.close()
            c,p,errors=boot(browser,no_js=True)
            check('disabled JavaScript shows clear fallback',p.locator('#staticBoard').is_visible() and p.locator('#bootNotice').is_visible())
            c.close()
        finally:
            browser.close()
finally:
    if server:
        server.shutdown()
print(f'{args.engine}: {len(report)} checks passed. Mode: {"fixture" if args.fixture else "HTTP"}; URL: {URL}', flush=True)
