import os
"""When player and deck shadows overlap, the explicitly selected target wins."""
from pathlib import Path
from playwright.sync_api import sync_playwright
P=Path(__file__).resolve().parents[1]
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path=os.environ.get('BROWSER_EXECUTABLE'),args=['--no-sandbox'])
 p=b.new_page(viewport={'width':390,'height':844});p.set_content((P/'qa/legacy-v7/index.html').read_text());p.wait_for_function('window.ShadowMorph&&ShadowMorph.snapshot().ready')
 p.locator('#newRoomsBtn').click();p.locator('[data-aspect="4"]').click();p.locator('[data-target="box"]').click()
 r=p.locator('#touchpad').bounding_box();x=r['x']+r['width']/2;y=r['y']+r['height']/2
 p.mouse.move(x,y);p.mouse.down();p.mouse.move(x+280*1.5/3.2,y);p.mouse.up()
 before=p.evaluate('ShadowMorph.snapshot()');assert abs(before['state']['x']-500)<.01
 r=p.locator('#board').bounding_box();x=r['x']+.5*r['width'];y=r['y']+.57*r['height']
 p.mouse.move(x,y);p.mouse.down();p.mouse.move(x+12,y);p.mouse.up()
 after=p.evaluate('ShadowMorph.snapshot()')
 assert after['target']=='box' and after['state']['x']>before['state']['x'],'An overlapping platform shadow stole the selected box gesture'
 assert after['state']['platforms']==before['state']['platforms'],'Dragging selected box must not resize a deck'
 b.close();print('PASS selected box retains input when its shadow overlaps a platform shadow')
