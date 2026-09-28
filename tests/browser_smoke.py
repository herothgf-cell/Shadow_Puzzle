from pathlib import Path
import os
from playwright.sync_api import sync_playwright
import json,sys
P=Path(__file__).resolve().parents[1]
with sync_playwright() as p:
 b=p.chromium.launch(**({'executable_path':os.environ['BROWSER_EXECUTABLE']} if os.getenv('BROWSER_EXECUTABLE') else {}),args=['--no-sandbox'])
 page=b.new_page(viewport={'width':390,'height':844},device_scale_factor=2,is_mobile=True,has_touch=True)
 page.set_content((P/'site-ready/index.html').read_text()); page.wait_for_timeout(500)
 got=page.evaluate('window.ShadowMorph && window.ShadowMorph.version')
 assert got=='7.0.0',f'Expected playable V7 platform build; got {got}'
 page.locator('#stagesBtn').click()
 assert page.locator('.stage-card[data-stage]').count()==19,'Expected 19 rooms'
 b.close()
 print('Browser smoke PASS')
