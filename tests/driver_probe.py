"""Observe driver input independently of game code before Firefox UI checks."""
import json

def probe_firefox_inputs(browser, output_dir):
    rows = []
    for touch in [False, True]:
        context = browser.new_context(viewport={'width':393,'height':852}, has_touch=touch)
        page = context.new_page()
        page.set_content('''<div style="width:300px;height:300px;touch-action:none">Input probe</div>
        <script>window.observed=[];
        ['pointerdown','pointermove','pointerup','mousedown','mousemove','mouseup'].forEach(type=>
        window.addEventListener(type,e=>observed.push({type:e.type,pointerType:e.pointerType,
        trusted:e.isTrusted,x:e.clientX,y:e.clientY}),true));</script>''')
        page.mouse.move(100,100)
        page.mouse.down()
        page.mouse.move(140,100,steps=3)
        page.mouse.up()
        page.evaluate('()=>new Promise(requestAnimationFrame)')
        events = page.evaluate('observed')
        rows.append({'has_touch':touch,'events':events})
        context.close()
    (output_dir/'firefox-input-probe.json').write_text(json.dumps(rows,indent=2))
    print('Firefox independent driver probe: ' + json.dumps(rows),flush=True)
    assert any(e['type']=='pointerdown' for e in rows[0]['events']), 'Default desktop driver must deliver pointer input'
