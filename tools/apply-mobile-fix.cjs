// One-time, checksum-guarded text patch for this repository's reviewed V7.1 sources.
// This helper and its workflow are deleted by the import commit after npm test.
const fs=require('node:fs'), crypto=require('node:crypto');
function readExact(path, sha){const b=fs.readFileSync(path);const actual=crypto.createHash('sha1').update(Buffer.from(`blob ${b.length}\0`)).update(b).digest('hex');if(actual!==sha)throw new Error(`Concurrent edit: ${path}`);return b.toString('utf8');}
function replace(s,a,b){if(s.split(a).length!==2)throw new Error('Patch context must match exactly once');return s.replace(a,b);}
let core=readExact('src/core.js','c29bff3c343f67e65c6f528631d4db87feb37743');
core=replace(core,`      if(!this.before)return false;const before=this.before;this.before=null;
      if(JSON.stringify(before)===JSON.stringify(this.snapshot()))return false;`,`      if(!this.before)return false;const before=this.before;this.before=null;
      // Touch/mouse coordinates can be quantized to CSS pixels. At release,
      // align a MOVED light near a cardinal axis; leave diagonal intent intact.
      if(this.level.axisMovement&&this.inputMode==='light'){
        const l=this.lights[this.activeLight],b=before.lights[this.activeLight];
        if(l?.movable&&b&&Math.hypot(l.x-b.x,l.y-b.y)>EPS){
          const limits=l.bounds||{x1:60,y1:60,x2:940,y2:940};
          if(Math.abs(l.x-this.state.x)<=12&&Math.abs(l.y-this.state.y)>=40&&this.state.x>=limits.x1&&this.state.x<=limits.x2)l.x=this.state.x;
          if(Math.abs(l.y-this.state.y)<=12&&Math.abs(l.x-this.state.x)>=40&&this.state.y>=limits.y1&&this.state.y<=limits.y2)l.y=this.state.y;
          this.updateWorld();
        }
      }
      if(JSON.stringify(before)===JSON.stringify(this.snapshot()))return false;`);
let host=readExact('tests/hosting_browser.py','e2f11be8c1c503d091c15ce291cde3f942e3bb3f');
host=replace(host,'from playwright.sync_api import sync_playwright','from playwright.sync_api import sync_playwright\nfrom driver_probe import probe_firefox_inputs');
host=replace(host,'has_touch=touch, java_script_enabled=not no_js)',"has_touch=touch and args.engine != 'firefox', java_script_enabled=not no_js)");
host=replace(host,'    page.mouse.move(x+dx, y+dy, steps=2)','    page.mouse.move(x+round(dx), y+round(dy), steps=2)');
host=replace(host,'        if distance <= 1:\n','        if distance <= 2:\n');
host=replace(host,'        try:\n            sizes =',"        try:\n            if args.engine == 'firefox':\n                probe_firefox_inputs(browser, OUT)\n            sizes =");
fs.writeFileSync('src/core.js',core);fs.writeFileSync('tests/hosting_browser.py',host);
const files={
 'tests/driver_probe.py':String.raw`"""Observe driver input independently of game code before Firefox UI checks."""
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
`,
 'tests/light-alignment.test.cjs':String.raw`const test=require('node:test'), assert=require('node:assert/strict');
const C=require('../src/core.js');
function game(extra={}){
 return C.createTestGame({id:'alignment',start:{x:400,y:500,a:1},goal:{x:800,y:800,w:130,h:130},walls:[],devices:[],sensors:[],axisMovement:true,lights:[{x:200,y:100,movable:true}],...extra});
}
function move(g,dx,dy){g.setInputMode('light');g.begin();g.moveLight(dx,dy);g.end();}
test('release near horizontal axis aligns the light without moving the box',()=>{
 const g=game();move(g,0,394);assert.equal(g.lights[0].y,500);assert.equal(g.lights[0].x,200);assert.equal(g.state.x,400);assert.equal(g.state.y,500);
});
test('release near vertical axis aligns light and undo restores the original position',()=>{
 const g=game();move(g,196,0);assert.equal(g.lights[0].x,400);assert.equal(g.lights[0].y,100);g.undo();assert.equal(g.lights[0].x,200);assert.equal(g.lights[0].y,100);
});
test('distant diagonal placement is not snapped',()=>{const g=game();move(g,0,379);assert.equal(g.lights[0].y,479);});
test('alignment never moves a light outside its allowed bounds',()=>{
 const g=game({lights:[{x:200,y:100,movable:true,bounds:{x1:80,y1:80,x2:900,y2:495}}]});move(g,0,500);assert.equal(g.lights[0].y,495);
});
test('alignment never collapses the light onto the box',()=>{const g=game();move(g,195,395);assert.equal(g.lights[0].x,395);assert.equal(g.lights[0].y,495);});
test('free-movement rooms preserve continuous light positioning',()=>{const g=game({axisMovement:false});move(g,0,394);assert.equal(g.lights[0].y,494);});
test('a mode or selection change alone never snaps a light',()=>{const g=game({lights:[{x:200,y:494,movable:true}]});g.begin();g.setInputMode('light');g.end();assert.equal(g.lights[0].y,494);});
`,
 'docs/MOBILE_FIXES.md':`# V7.1 모바일·PC 배포 검증 보완

- 진행 저장 복원: 상자를 선택해 저장했는데 해당 방의 기본 발판 선택으로 돌아가던 오류를 수정했습니다. 새로고침 시 위치·형태·발판·선택 대상·입력 모드를 유지합니다.
- 광원 축 정렬: 축 이동을 사용하는 방에서 이동 가능한 빛을 움직이고 손을 뗄 때, 상자의 가로/세로선에서 12 월드 단위 안이면 축에 맞춥니다. 상자는 움직이지 않고, 원래 대각선 의도·허용 광원 범위·되돌리기를 보존합니다. 빛과 상자가 같은 위치로 합쳐지지 않습니다.
- 자동 입력: WebKit의 정수 CSS 좌표를 고려해 드래그를 프레임에 걸쳐 전달하고, 마지막 구간은 실제 정밀 버튼을 사용합니다. 충돌·승리 조건을 완화하거나 테스트용 상태 setter를 추가하지 않았습니다.
- Firefox: 마우스 입력 검사는 표준 데스크톱 컨텍스트에서 수행하되 동일한 작은 화면도 검사합니다. 별도 빈 페이지에서 has_touch 켜짐/꺼짐 입력 이벤트를 관찰해 QA 아티팩트에 남깁니다. Firefox 모바일 에뮬레이션 성공을 주장하지 않습니다.
- Chromium과 WebKit 모바일 크기 및 Firefox 데스크톱 자동 검사는 실기기 iOS/Android 터치감·장시간 성능 검증을 대체하지 않습니다.

사이트의 게임 데이터 19개는 기존 V7과 동일합니다. 추가 자동화 회귀 항목은 저장 대상 5개, 광원 정렬 7개이며 전체 코어/레벨 검사는 78개입니다.
`
};
for(const [path,content] of Object.entries(files)){if(fs.existsSync(path))throw new Error(`Refusing to overwrite ${path}`);fs.writeFileSync(path,content);}
console.log('Applied exact, reviewed input and save compatibility fixes.');
