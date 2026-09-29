"""V8.1 explicit difficulty-first campaign; engine rules are unchanged.
Frozen V8 data is retained for regression. Every new room has a control witness.
"""
import json,copy,subprocess
from pathlib import Path
R=Path(__file__).resolve().parents[1]
old=json.loads(subprocess.check_output(['node','-e',"console.log(JSON.stringify(require('./tests/v8-levels.cjs')))"],cwd=R))
sol=json.loads((R/'tests/v8-solutions.json').read_text())
rooms={};routes={};mapping=[]
def w(x,y,a,b,kind='wall'):return dict(x=x,y=y,w=a,h=b,kind=kind)
def pit(x,y,a,b):return w(x,y,a,b,'pit')
def water_except(land):
 pieces=[pit(0,0,1000,1000)]
 for b in land:
  out=[]
  for a in pieces:
   x=max(a['x'],b['x']);y=max(a['y'],b['y']);r=min(a['x']+a['w'],b['x']+b['w']);d=min(a['y']+a['h'],b['y']+b['h'])
   if r<=x or d<=y:out.append(a);continue
   for q in [pit(a['x'],a['y'],a['w'],y-a['y']),pit(a['x'],d,a['w'],a['y']+a['h']-d),pit(a['x'],y,x-a['x'],d-y),pit(r,y,a['x']+a['w']-r,d-y)]:
    if q['w']>0 and q['h']>0:out.append(q)
  pieces=out
 return pieces
def lamp(x,y,m=False,bounds=None):
 z=dict(x=x,y=y,movable=m)
 if bounds:z['bounds']=dict(zip(['x1','y1','x2','y2'],bounds))
 return z
def sense(id,x,y,accept='shadow',zone=None):
 z=dict(id=id,x=x,y=y,r=30,accept=accept,latch=zone is None,name='그늘판 · 유지' if zone else '바닥 버튼' if accept=='box' else '그림자 장치')
 if zone:z.update(w=zone[0],h=zone[1])
 return z
def gate(id,sid,x,y,a,b,kind='gate'):return dict(id=id,sensorId=sid,x=x,y=y,w=a,h=b,type=kind)
def deck(id,x,y,axis,area,length,lo,hi,start,end):return dict(id=id,name='발판 '+('A' if id=='deck-a' else 'B'),x=x,y=y,axis=axis,area=area,length=length,minLength=lo,maxLength=hi,spanStart=start,spanEnd=end)
def B(x,y):return ['box',x,y]
def F(a):return ['aspect',a]
def L(i,x,y):return ['light',i,x,y]
def D(id,n):return ['platform',id,n]
def S(i):return ['select',i]
def T():return ['target','box']
def new(n,name,start,goal,walls,lights,steps,sensors=(),devices=(),platforms=(),axis=True,morph=True,tip='',hint='',insight='',pattern=''):
 rooms[n]=dict(id=f'rebalance81-{n:02d}',name=name,start=dict(x=start[0],y=start[1],a=start[2] if len(start)>2 else 1),goal=dict(x=goal[0],y=goal[1],w=130,h=130),walls=walls,lights=lights,sensors=list(sensors),devices=list(devices),platforms=list(platforms),axisMovement=axis,allowMorph=morph,defaultTarget='box',tip=tip,hint=hint,meaning=insight,pattern=pattern)
 routes[n]=dict(stage=n,levelId=rooms[n]['id'],steps=steps);mapping.append(dict(stage=n,old=None,id=rooms[n]['id'],status='rebuilt',insight=insight))
order={1:1,2:5,3:3,4:4,5:13,6:7,7:8,8:17,9:2,10:14,11:15,12:29,13:16,14:22,15:39,16:25,17:9,18:18,19:32,20:10,21:24,22:26,23:11,24:28,29:12,31:27,32:36,33:33}
for n,k in order.items():
 rooms[n]=copy.deepcopy(old[k-1]);routes[n]=copy.deepcopy(sol[k-1]);routes[n]['stage']=n;routes[n]['levelId']=rooms[n]['id']
 rooms[n]['pattern']=f'retained-{k}';mapping.append(dict(stage=n,old=k,id=rooms[n]['id'],status='reordered',insight=rooms[n].get('meaning','')))

new(25,'세 번 갈아타는 빛',(250,700),(900,600),[w(550,550,100,370),w(80,280,400,100),w(730,400,70,80)],
 [lamp(80,700),lamp(800,100)], [S(0),B(350,700),S(1),B(575,400),S(0),B(829.1891891892,245.9459459459),S(1),B(900,600)],morph=False,
 tip='출구로 이어지는 축 앞에 돌기둥이 서 있어요.',hint='아래 가로축에서 B로 위쪽 마당에 간 뒤, A로 오른편 높은 자리를 찾으세요. 그 자리에서 B가 출구를 향해요.',insight='한 번 찾은 교점에서 끝내지 않고 장애물 반대편의 다음 교점을 마련했어요.',pattern='alternating-ray-detour')
new(26,'점선 위의 변신',(200,250),(600,610.2941176471),[w(400,0,60,215),w(400,285,60,715),w(460,450,286,70),w(814,450,186,70),w(890,60,60,700)],
 [lamp(100,250),lamp(780,100)], [F(4),S(0),B(780,250),F(.25),S(1),B(780,740),F(1),S(0),B(600,610.2941176471)],
 tip='통로 모양만이 아니라, 통과한 뒤의 점선 방향도 보세요.',hint='가로로 첫 틈을 지나 B로 좁은 아래 틈을 건너세요. 마지막 출구는 A와 연결된 대각선 위에 있어요.',insight='통과할 형태와 다음에 선택할 축을 같이 준비했어요.',pattern='radial-morph-return')
new(27,'먼저 멀어지는 자리',(300,700),(650,650),[w(500,0,60,200),w(500,480,60,520),w(750,380,250,70),w(100,380,130,120)],
 [lamp(100,700),lamp(700,100)], [S(0),B(180,700),S(1),B(440,400),S(0),B(693.0232558139535,176.74418604651146),S(1),B(650,650)],
 [sense('back',220,700),sense('inner',310,550)], [gate('outer','back',500,200,60,280),gate('lower','inner',560,380,190,70)],
 tip='두 문은 서로 다른 위치에서 그림자가 닿아요.',hint='A로 왼쪽부터 살핀 뒤 B로 가운데 마당에 가세요. A로 오른쪽 위 자리까지 나가면 B로 마지막 문을 통과할 수 있어요.',insight='출구에서 멀어지는 첫 이동으로 두 문에 닿을 작업 위치를 차례로 만들었어요.',pattern='reverse-setup-two-latches')
new(28,'빛이 닿는 두 작업실',(200,650),(820,724),[w(400,0,70,140),w(400,320,70,680),pit(470,450,210,150),pit(885,450,115,150),w(800,65,150,25),w(800,190,150,25),w(800,65,25,150),w(925,65,25,150)],
 [lamp(200,300,True,(60,60,360,930)),lamp(850,850)], [B(200,220),L(0,80,220),B(700,220),L(0,340,380),S(1),B(820,724)],
 [sense('floor',200,220,'box'),sense('remote',880,140)], [gate('entry','floor',400,140,70,180),gate('bridge','remote',680,450,205,150,'bridge')],
 tip='빛 A는 왼쪽에서만 움직여요. 출구 쪽에는 어떤 축이 필요할까요?',hint='위쪽 버튼을 누르고 A의 가로축으로 오른편에 들어가세요. A를 (오른쪽 아래 범위)로 보내 밀실 장치를 켠 뒤 B로 건너세요.',insight='움직일 수 있는 빛의 한계를 다른 고정 빛의 축으로 보완했어요.',pattern='bounded-light-transfer')

new(30,'그늘을 바꾸는 복도',(220,560),(800,820),[w(430,0,60,460),w(430,650,60,350),w(650,650,60,60),w(890,650,110,60),w(510,740,90,170)],
 [lamp(220,80,True),lamp(850,560)], [L(0,220,280),S(1),B(800,560),L(0,800,80),S(0),B(800,820)],
 [sense('h',610,700,zone=(550,160)),sense('v',800,890,zone=(200,190))],
 [gate('first','h',430,460,60,190),gate('second','v',710,650,180,60)],
 tip='첫 문을 유지하던 빛의 배치가 다음 문에도 맞을까요?',hint='A의 높이를 바꿔 그늘을 첫 판에 남기고 B로 오른편에 가세요. 첫 문을 지난 뒤 A를 위에 놓으면 다음 문을 열 수 있어요.',insight='같은 광원을 두 그늘판의 서로 다른 배치로 사용했어요.',pattern='sequential-hold-reassignment')

new(34,'문 사이의 인수인계',(250,250),(780,820),[w(430,0,70,160),w(430,350,70,260),w(430,800,70,200),w(560,450,130,60),w(880,450,120,60),w(80,470,230,100)],
 [lamp(250,80,True),lamp(780,930,True)], [L(0,80,250),B(340,250),L(1,720,250),L(0,80,250),B(740,250),L(0,740,80),B(740,700),L(0,80,700),B(780,700),L(1,780,930),S(1),B(780,820)],
 [sense('h',660,250,zone=(600,180)),sense('v',780,620,zone=(200,520))],
 [gate('upper','h',430,160,70,190),gate('down','v',690,450,190,60)],
 tip='내가 움직일 축과 다른 문을 열어 둘 그림자를 구분하세요.',hint='가로로 건널 때는 A를 왼쪽에, 세로로 나갈 때는 B를 아래쪽에 놓아요. 문 앞에서 다른 그림자도 어떤 판에 놓이는지 보세요.',insight='이동에 쓸 빛과 다음 문을 준비할 빛의 역할을 넘겼어요.',pattern='two-mobile-hold-handoff')

new(35,'그늘 위의 작업대',(160,700),(700,150),water_except([w(0,0,280,1000),w(580,80,260,180)]),
 [lamp(160,80,True),lamp(700,930)], [L(0,80,700),D('deck-a',720),T(),F(4),B(660,700),D('deck-a',520),T(),F(1),B(700,700),L(0,200,700),D('deck-b',680),T(),F(.25),S(1),B(700,180),F(1),B(700,150)],
 [sense('hold',930,500,zone=(120,700))],[gate('door','hold',640,280,120,65)],
 [deck('deck-a',500,700,'x',57600,300,200,720,280,700),deck('deck-b',700,470,'y',51000,240,200,680,260,700)],
 tip='상자의 형태를 바꿀 바닥과, 다음 문을 열 그늘이 모두 필요해요.',hint='A 발판을 줄여 작업면을 만든 뒤 빛 A를 다시 놓으세요. 그 그늘을 남긴 채 빛 B로 위쪽 문을 통과해요.',insight='작업 폭을 마련한 위치에서 다음 유지형 문에 맞는 빛을 준비했어요.',pattern='worktable-to-maintained-axis')
new(36,'두 수로의 다른 조건',(220,220),(920,780),water_except([w(0,0,1000,360),w(160,650,260,280),w(860,650,140,350)]),
 [lamp(220,80,True),lamp(940,780)], [L(0,80,220),B(300,220),D('deck-a',600),T(),F(.25),L(0,300,80),B(300,780),F(4),L(0,300,540),D('deck-b',680),T(),S(1),B(880,780),D('deck-b',560),T(),F(1),S(1),B(920,780)],
 [sense('hold',620,900,zone=(720,150))],[gate('door','hold',740,690,60,180)],
 [deck('deck-a',300,505,'y',48000,180,180,600,360,650),deck('deck-b',600,780,'x',52000,180,180,680,420,860)],
 tip='첫 연결을 건넌 설정만으로는 다음 수로를 지날 수 없어요.',hint='세로 발판을 먼저 건너 아래 작업 공간에서 가로형을 준비해요. 빛 A의 그늘을 아래 판에 남기고 B로 옆 수로를 건너세요.',insight='서로 다른 수로의 지지 폭과 유지해야 할 그늘을 연결했어요.',pattern='island-orthogonal-support-hold')
new(37,'섬은 출구가 아니라 자리',(190,780),(910,400),water_except([w(0,0,330,1000),w(500,300,150,550),w(860,0,140,1000)]),
 [lamp(190,80,True),lamp(120,560,True)], [L(0,80,780),D('deck-a',320),T(),F(4),B(400,780),D('deck-a',600),T(),B(575,780),F(1),L(0,575,930),B(575,400),L(1,940,400),L(0,400,200),S(1),B(600,400),D('deck-b',460),T(),S(1),B(910,400)],
 [sense('first',745,890,zone=(490,140)),sense('hold',820,500,zone=(340,160))],[gate('first-door','first',600,730,30,100),gate('door','hold',830,315,30,170)],
 [deck('deck-a',420,780,'x',46000,180,180,600,330,500),deck('deck-b',730,400,'x',50000,180,180,460,650,860)],
 tip='가운데 섬은 잠깐 쉬는 곳보다 더 중요한 역할을 해요.',hint='A 발판을 중간까지 늘려 아래 그늘판을 누를 자리를 확보하세요. 섬을 건넌 뒤에는 빛 B도 다시 놓아 위쪽 출구축으로 사용해요.',insight='첫 다리가 만든 작업 위치에서만 다음 문과 이동축을 함께 준비했어요.',pattern='central-island-shadow-station')
new(38,'돌아오는 길을 남겨 두기',(180,720),(200,180),water_except([w(0,0,310,1000),w(660,80,220,260),w(670,600,280,320),w(310,130,350,140)]),
 [lamp(180,80,True),lamp(770,940,True)], [L(0,80,720),D('deck-a',500),T(),F(4),B(770,720),F(1),L(0,500,720),D('deck-b',460),T(),S(1),F(.25),B(770,240),F(1),B(770,200),L(1,120,80),L(0,80,200),S(0),B(200,200),B(200,180)],
 [sense('hold',905,480,zone=(150,650)),sense('floor',770,200,'box'),sense('back',550,260,zone=(650,80))],
 [gate('gate','hold',695,350,150,30),gate('return','floor',310,130,350,140,'bridge'),gate('return-shade','back',480,130,60,140)],
 [deck('deck-a',500,720,'x',42000,180,180,500,310,670),deck('deck-b',770,470,'y',40000,180,180,460,340,600)],
 tip='갈 때 만든 길을 그대로 되돌아올 수 있을까요?',hint='아래 다리에서 들어가 A로 그늘을 남기고 B로 올라가요. 귀환 때는 B를 위쪽 왼편으로 옮겨 새 그늘을 유지하고 A로 돌아가세요.',insight='갈 때의 유지형 통로와 돌아올 때 고정되는 길을 다른 순서로 준비했어요.',pattern='return-bridge-after-maintained-canal')
new(39,'양쪽 그림자의 합의',(200,300),(920,810),[pit(360,0,300,1000),w(860,0,40,630),w(860,870,40,130)],
 [lamp(200,80,True),lamp(840,940,True)], [L(0,80,300),D('deck-a',600),T(),F(4),B(720,300),F(1),L(0,250,300),D('deck-b',640),T(),F(.25),L(1,720,940),S(1),B(720,750),F(1),L(1,940,750),L(0,200,750),S(0),B(920,750),L(1,920,940),S(1),B(920,810)],
 [sense('one',900,550,zone=(160,650)),sense('two',860,780,zone=(260,180))],
 [gate('vertical','one',660,400,120,30),gate('exit','two',860,630,40,240)],
 [deck('deck-a',500,300,'x',50000,180,180,600,360,660),deck('deck-b',720,520,'y',50000,180,180,640,300,750)],
 tip='한 문이 열렸다는 사실만으로 다음 문까지 열리는 건 아니에요.',hint='아래로 내려가는 동안 A의 그늘을 유지해요. 옆 문으로 나갈 때는 B의 자리도 다시 맞춰야 해요.',insight='한 빛으로 모든 역할을 대신하지 않고 각 문에 맞게 두 그림자를 재배치했어요.',pattern='two-shades-two-deck-roles')
new(40,'설정은 한 번으로 끝나지 않는다',(160,700),(820,180),water_except([w(0,0,270,1000),w(660,80,300,170)]),
 [lamp(160,80,True),lamp(760,930)], [L(0,80,700),D('deck-a',740),T(),F(4),B(665,700),D('deck-a',530),T(),F(1),B(710,700),L(0,250,700),D('deck-b',680),T(),B(760,700),L(0,400,700),F(.25),S(1),B(760,360),F(1),B(760,345),L(0,400,80),D('deck-b',720),T(),L(0,760,800),S(1),B(760,180),L(0,80,180),S(0),B(820,180)],
 [sense('lower',930,600,zone=(120,330)),sense('upper',760,140,zone=(240,220))],
 [gate('low','lower',705,400,110,60),gate('high','upper',650,230,250,30)],
 [deck('deck-a',500,700,'x',60000,240,180,740,270,710),deck('deck-b',760,610,'y',90000,220,220,720,250,700)],
 tip='지금 필요한 그늘과, 다음 문이 요구하는 그늘은 서로 달라요.',hint='중앙에서 발판 A를 작업면으로 바꿔요. 첫 문과 위 문은 서로 다른 그늘을 요구해요. 두 문 사이에서 두 그림자가 각각 어느 판에 닿는지 보고 발판을 마저 펼치세요.',insight='발판 작업면과 두 그늘판을 한 번의 고정 설정이 아닌 단계별 계획으로 해결했어요.',pattern='worktable-midchannel-reconfiguration')

# Physical geometry never depends on the stage number. IDs preserve exact rooms.
bands=[(8,'차근차근'),(16,'길과 장치'),(22,'빛과 작업 위치'),(28,'두 축의 계획'),(34,'그늘을 유지하기'),(40,'설정을 다시 쓰기')]
for n,l in rooms.items():
 l['chapter']=next(label for end,label in bands if n<=end)
 l['tag']=('자유 이동' if not l['axisMovement'] else '빛축 이동')+' · '+l['chapter']
 # Teach control semantics, not an exact walkthrough in the persistent HUD.
 if n>=17:
  l['tip']=l['tip'].replace('점선 이동 · ','').replace('자유 이동 · ','')
 l['tip']=('빛축 이동 · ' if l['axisMovement'] else '자유 이동 · ')+l['tip'].removeprefix('자유 이동 · ').removeprefix('점선 이동 · ')
# Fix stale stage-number tutorial wording inherited from the old order.
rooms[20]['tip']='빛축 이동 · 빛과 상자를 잇는 점선 방향으로만 움직이는 방이에요.'
rooms[23]['tip']='빛축 이동 · 고정된 두 빛 중 어느 그림자를 당길지 고르세요.'
rooms[29]['tip']='빛축 이동 · 다른 그림자가 그늘판을 벗어나지 않는 경로를 찾아보세요.'
# No automatic answer chain in late brief/objective.
for n in range(17,41):rooms[n].pop('objective',None)
# Ignore zero-size blocks; no invisible walls.
for l in rooms.values():l['walls']=[v for v in l['walls'] if v['w']>0 and v['h']>0]
rows=[rooms[n] for n in range(1,41)]
text='/* V8.1 difficulty-first campaign. See docs/REBALANCE81_RELEASE.md. */\n(function(root,factory){if(typeof module===\'object\'&&module.exports)module.exports=factory();else root.ShadowLevels=factory();})(typeof globalThis!==\'undefined\'?globalThis:this,function(){return '+json.dumps(rows,ensure_ascii=False,separators=(',',':'),indent=None)+';});\n'
# One level per line, facilitating review and future edits.
text=text.replace('},{"id":','},\n{"id":')
(R/'src/levels.js').write_text(text)
(R/'tests/campaign40-solutions.json').write_text(json.dumps([routes[n] for n in range(1,41)],ensure_ascii=False,indent=2)+'\n')
(R/'docs/rebalance81-map.json').write_text(json.dumps(sorted(mapping,key=lambda r:r['stage']),ensure_ascii=False,indent=2)+'\n')
print('Authored',len(rows),'rooms;',len([x for x in mapping if x['old'] is None]),'new identities')
