"""Rebuild hand-authored level data and UI-control witnesses. No procedural variants."""
import json,copy,subprocess,math
from pathlib import Path
R=Path(__file__).resolve().parents[1]
(R/'qa').mkdir(exist_ok=True)
old=json.loads(subprocess.check_output(['node','-e',"console.log(JSON.stringify(require('./archive/v7/src/levels.js')))"],cwd=R))
oldsol=json.loads((R/'tests/v7-solutions.json').read_text())
rooms={};routes={}
names=['첫 손잡이','벽 너머의 손','낮은 아치','가느다란 회랑','발걸음으로 놓는 다리','그늘이 있는 동안','내가 늘리는 길','길이와 폭','상자는 그대로, 빛만','방향을 만드는 빛','두 빛의 선택','선택하지 않은 그림자','꺾기 전에 바꾸기','누가 눌러야 할까','문을 열어야 늘어난다','모퉁이의 두 발판','출구에서 거꾸로','몸 대신 그림자를 보내기','한 그림자는 범위 안에','가까운 길보다 가능한 길','섬에 도착한 뒤 다시','문 뒤에서 닿는 장치','돌아오면 다른 장소','첫 설계 시험','세 단계의 준비','발판이 작업대가 되는 순간','움직여도 남는 그늘','작은 방, 큰 생각','몸을 옮기지 않고 닿기','닫혀도 되는 문','세 공간, 두 작업면','마지막 위치가 열쇠','두 조건, 두 문','먼저 길이 아닌 자리를','모두 길게 하면 막힌다','유지할 것과 바꿀 것','간단해 보이는 방','갈 때와 올 때는 다르다','둘 중 무엇부터라도','내가 완성한 세계']
def w(x,y,a,b,kind='wall'):return dict(x=x,y=y,w=a,h=b,kind=kind)
def pit(x,y,a,b):return w(x,y,a,b,'pit')
def light(x=500,y=80,movable=False,bounds=None):
 v=dict(x=x,y=y,movable=movable)
 if bounds:v['bounds']=dict(zip(['x1','y1','x2','y2'],bounds))
 return v
def sensor(id,x,y,accept='shadow',latch=True,zone=None):
 v=dict(id=id,x=x,y=y,r=30,accept=accept,latch=latch,name=('바닥 버튼' if accept=='box' else '그림자 장치' if latch else '그늘판 · 유지'))
 if zone:v.update(w=zone[0],h=zone[1])
 return v
def device(id,sid,x,y,a,b,type='gate'):return dict(id=id,sensorId=sid,x=x,y=y,w=a,h=b,type=type)
def deck(id,x,y,axis,area,length,minimum,maximum,start,end):return dict(id=id,name='발판 '+('A' if id=='deck-a' else 'B'),x=x,y=y,axis=axis,area=area,length=length,minLength=minimum,maxLength=maximum,spanStart=start,spanEnd=end)
def B(x,y):return ['box',x,y]
def F(a):return ['aspect',a]
def L(i,x,y):return ['light',i,x,y]
def D(id,n):return ['platform',id,n]
def S(i):return ['select',i]
def T(id='box'):return ['target',id]
def add(n,start,goal,walls,steps,sensors=(),devices=(),lights=None,platforms=(),axis=False,morph=True,tip='',hint='',meaning='',default='box',objective=None):
 g=dict(x=goal[0],y=goal[1],w=goal[2] if len(goal)>2 else 130,h=goal[3] if len(goal)>3 else 130)
 v=dict(id=f'campaign40-{n:02d}',name=names[n-1],start=dict(x=start[0],y=start[1],a=start[2] if len(start)>2 else 1),goal=g,walls=list(walls),sensors=list(sensors),devices=list(devices),lights=lights or [light()],platforms=list(platforms),axisMovement=axis,allowMorph=morph,defaultTarget=default,tip=tip,hint=hint,meaning=meaning)
 if objective:v['objective']=objective
 rooms[n]=v;routes[n]=steps

def reuse(n,k):
 v=copy.deepcopy(old[k-1]);v['name']=names[n-1];rooms[n]=v;routes[n]=copy.deepcopy(oldsol[k-1]['steps'])
for n,k in [(1,1),(2,2),(3,3),(4,4),(6,7),(7,15),(8,16),(9,9),(10,10),(11,12),(12,13),(13,5),(16,18),(24,19)]:reuse(n,k)
# Room 13's original route turned tall too close to the ceiling.
routes[13].insert(3,B(760,320))
add(5,(280,220),(750,810),[pit(0,450,440,150),pit(640,450,360,150),w(690,110,100,160)],
    [B(280,330),B(540,330),B(540,760),B(750,810)],
    [sensor('floor',280,330,'box')],[device('bridge','floor',440,450,200,150,'bridge')],morph=False,
    tip='노란 ○ 버튼은 상자로 눌러요. 케이블 끝에 다리가 생겨요.',hint='버튼을 누른 다음, 새로 펼쳐진 가운데 다리를 건너세요.',meaning='버튼은 방문 기록이 아니라, 없던 실제 길을 만드는 장치예요.')
add(14,(180,650),(800,850),[w(450,0,60,180),w(450,380,60,620),w(100,100,240,40),w(100,260,240,40),w(100,100,40,200),w(300,100,40,200),pit(510,610,190,140),pit(870,610,130,140)],
    [B(166.6666667,400),B(400,400),B(400,280),B(660,280),B(670,350),B(780,350),B(780,840),B(800,850)],
    [sensor('shade',200,200),sensor('floor',670,350,'box')],[device('gate','shade',450,180,60,200),device('bridge','floor',700,610,170,140,'bridge')],lights=[light(100,800)],
    tip='같은 모양으로 보아도, 누르는 주체는 서로 달라요.',hint='밀실은 그림자, 건너편의 노란 버튼은 상자로 작동시켜요.',meaning='그림자가 문을 열어 준 뒤, 상자가 다리를 펼쳤어요.')
add(15,(180,780),(820,300),[pit(360,0,360,1000),w(650,0,70,500),w(650,700,70,300)],
    [B(180,260),D('deck-a',500),T(),B(180,600),B(820,600),B(820,300)],
    [sensor('floor',180,260,'box')],[device('gate','floor',650,500,70,200)],
    platforms=[deck('deck-a',500,600,'x',50000,180,180,500,360,720)],
    tip='발판이 왜 더 늘어나지 않는지, 끝을 살펴보세요.',hint='닫힌 문은 상자뿐 아니라 발판 확장도 막아요. 문을 먼저 열면 돼요.',meaning='문을 먼저 열어, 발판이 자랄 공간부터 만들었어요.')
add(17,(180,510),(750,170,70,200),[pit(320,0,390,1000),w(790,0,210,1000)],
    [D('deck-a',440),T(),F(.25),B(750,510),B(750,170)],
    platforms=[deck('deck-a',510,510,'x',83200,260,240,520,320,710)],
    tip='출구 회랑에서 필요한 모양을 먼저 생각해 보세요.',hint='오른쪽 회랑은 좁아요. 세로형 상자의 높이도 받칠 만큼 발판 폭을 남기세요.',meaning='출구의 조건에서 거꾸로 생각해, 길과 상자를 미리 준비했어요.')
add(18,(250,780),(790,220),[pit(0,390,400,170),pit(580,390,420,170),w(640,120,80,160)],
    [B(300,610),L(0,380,930),B(490,650),B(490,340),B(790,340),B(790,220)],
    [sensor('shade',260,450)],[device('bridge','shade',400,390,180,170,'bridge')],lights=[light(300,220,True)],
    tip='물 위 장치까지 상자가 직접 갈 필요가 있을까요?',hint='아래 강둑에서 빛을 아래로 보내면, 그림자는 물 위의 장치로 뻗어요.',meaning='상자가 설 수 없는 곳에는 빛으로 그림자를 보냈어요.')
add(19,(300,250),(880,741),[w(0,430,640,70),w(760,430,240,70),w(480,590,120,320)],
    [S(0),B(700,250),S(1),B(700,620),S(0),B(880,741.090909)],
    [sensor('hold',935,620,latch=False,zone=(120,480))],[device('gate','hold',640,430,120,70)],lights=[light(150,250),light(700,880)],axis=True,
    tip='선택하지 않은 그림자까지 함께 움직이는 걸 기억하세요.',hint='가로로 자리를 잡고, 두 번째 빛으로 문을 통과한 뒤 다시 축을 바꾸세요.',meaning='움직이는 그림자와 장치를 유지하는 그림자의 범위를 함께 고려했어요.')
add(20,(220,220),(800,450),[w(410,0,60,210),w(410,280,60,350),w(410,810,60,190),w(470,340,530,60),w(0,470,250,60)],
    [B(330,220),B(330,780),B(220,800),B(330,720),B(800,720),B(800,450)],
    [sensor('floor',220,800,'box')],[device('gate','floor',410,630,60,180)],
    tip='출구와 가까워지는 길이 반드시 출구로 이어지지는 않아요.',hint='위쪽 낮은 틈 너머는 막힌 방이에요. 아래쪽 버튼과 연결된 넓은 문을 보세요.',meaning='짧은 길보다, 필요한 공간으로 이어지는 길을 골랐어요.')
add(21,(300,170),(840,890),[pit(0,300,1000,100),pit(0,590,1000,230),w(70,820,390,60)],
    [D('deck-a',280),T(),B(300,535),B(500,535),D('deck-b',460),T(),B(720,515),F(.25),B(720,885),F(1),B(840,890)],
    [sensor('floor',500,520,'box')],[device('gate','floor',650,560,140,50)],
    platforms=[deck('deck-a',300,395,'y',45000,100,100,460,300,400),deck('deck-b',720,705,'y',30000,140,140,500,590,820)],
    tip='중간 섬에 도착하면, 다음 길을 다시 살펴보세요.',hint='첫 발판은 섬까지, 섬의 버튼은 두 번째 발판이 늘어날 자리를 열어요.',meaning='첫 연결만으로 끝내지 않고, 새 작업 위치에서 다음 구간을 준비했어요.')
add(22,(180,700),(830,280),[w(340,0,60,600),w(340,800,60,200),w(690,0,60,180),w(690,400,60,600),w(420,380,90,110)],
    [B(180,250),B(180,700),B(560,700),B(580,560),B(580,280),B(830,280)],
    [sensor('floor',180,250,'box'),sensor('shade',620,800)],
    [device('one','floor',340,600,60,200),device('two','shade',690,180,60,220)],
    tip='아직 닿지 않는 장치는, 다른 방에 들어간 뒤 다시 보세요.',hint='첫 문을 지나야 두 번째 장치에 그림자를 보낼 위치에 설 수 있어요.',meaning='조작 순서가 목록이 아닌, 실제 접근 가능한 위치에서 생겼어요.')
add(23,(180,500),(480,140),[w(350,300,300,400),w(710,0,60,720),w(0,190,380,50),w(580,190,130,50)],
    [B(180,800),B(820,800),B(180,800),F(4),B(180,270),B(480,270),B(480,140),F(1)],
    [sensor('floor',820,800,'box')],[device('gate','floor',380,190,200,50)],
    tip='버튼이 열어 준 길은, 지나왔던 쪽에 있어요.',hint='오른쪽 아래에서 문을 열고, 왼쪽으로 돌아와 낮은 복도에서 위로 나가세요.',meaning='돌아온 공간에서 새로 열린 연결을 사용했어요.')
add(25,(600,200),(880,855),[pit(0,360,1000,340),w(710,130,220,30),w(710,340,220,30),w(710,130,30,240),w(900,130,30,240),w(740,700,60,120),w(740,890,60,110)],
    [F(4),D('deck-a',660),T(),F(.25),B(600,800),F(4),B(600,855),B(880,855),F(1)],
    [sensor('shade',750,260)],[device('gate','shade',545,330,110,50)],
    platforms=[deck('deck-a',600,530,'y',48000,160,160,660,360,700)],
    tip='다리를 준비하려면 문을, 문을 열려면 그림자의 모양을 먼저 보세요.',hint='시작 자리에서 가로형 그림자를 보내 문을 연 뒤, 세로형으로 다리를 건너세요. 마지막 낮은 문에서는 다시 가로형이에요.',meaning='그림자 모양 → 문 → 길의 폭 → 출구 형태를 차례로 연결했어요.')
add(26,(160,700),(700,150),[pit(280,260,720,740),pit(280,0,300,260)],
    [D('deck-a',720),D('deck-b',680),T(),F(4),B(660,700),D('deck-a',520),T(),F(1),B(700,700),F(.25),B(700,150),F(1)],
    platforms=[deck('deck-a',500,700,'x',57600,300,200,720,280,700),deck('deck-b',700,470,'y',51000,240,200,680,260,700)],
    tip='건넌 발판이 이제는 어떤 역할을 해야 할까요?',hint='중앙 직전에서 A를 줄이면 폭이 넓어져요. 그 작업면에서 기본형으로 바꾸고 B 위에서 세로형으로 나가세요.',meaning='다리를 단순한 길이 아니라, 형태를 바꾸는 작업면으로 다시 썼어요.')
add(27,(280,260),(300,875),[w(0,470,570,190),w(750,470,250,190),w(440,750,100,180),w(780,780,150,140)],
    [S(0),B(660,260),S(1),B(660,720),F(4),L(0,900,720),B(300,720),F(1),L(0,300,80),B(300,875)],
    [sensor('hold',930,695,latch=False,zone=(100,530))],[device('gate','hold',570,470,180,190)],
    lights=[light(90,260,True),light(660,900)],axis=True,
    tip='문을 완전히 지난 뒤라야 빛을 자유롭게 바꿀 수 있어요.',hint='A의 그늘을 남기고 B로 아래까지 내려오세요. 낮은 작업선에서는 가로형으로, 이후에는 새 이동축으로 나가세요.',meaning='유지해야 하는 구간과 새 방향을 만들어도 되는 구간을 구별했어요.')
add(28,(350,700),(700,240),[w(400,600,140,220),w(180,260,160,130)],
    [S(0),B(108.5714285714,700),S(1),B(700,240)],lights=[light(920,700),light(880,100)],axis=True,
    tip='물체가 적어도, 출구에 이어지는 점선은 따로 있어요.',hint='출구와 B를 잇는 직선을 현재 높이까지 연장해 보세요. 그 교점으로 A를 이용해 이동하세요.',meaning='두 이동축이 만날 위치를 역산했어요. 복잡한 장치 없이도 방향을 계획할 수 있어요.')

def subtract(a,b):
 x=max(a['x'],b['x']);y=max(a['y'],b['y']);r=min(a['x']+a['w'],b['x']+b['w']);d=min(a['y']+a['h'],b['y']+b['h'])
 if r<=x or d<=y:return [a]
 return [q for q in [pit(a['x'],a['y'],a['w'],y-a['y']),pit(a['x'],d,a['w'],a['y']+a['h']-d),pit(a['x'],y,x-a['x'],d-y),pit(r,y,a['x']+a['w']-r,d-y)] if q['w']>0 and q['h']>0]
def water_except(land):
 pieces=[pit(0,0,1000,1000)]
 for r in land:pieces=[q for a in pieces for q in subtract(a,r)]
 return pieces
add(29,(400,500),(830,500),water_except([w(325,440,150,120),w(280,472,240,56),w(520,472,230,56),w(750,0,250,1000)]),
    [F(4),B(840,500),F(1),B(830,500)],
    [sensor('shade',455,710)],[device('bridge','shade',520,472,230,56,'bridge')],
    tip='몸이 움직일 자리가 작다면, 그림자의 끝을 보세요.',hint='가로형은 낮은 옆 날개에 설 수 있고 그림자는 더 멀리 닿아요. 기본형으로 옆으로 미는 것과 달라요.',meaning='중심을 옮기지 않고도 그림자의 형태로 멀리 있는 장치를 작동시켰어요.')
add(30,(180,220),(780,900),[w(0,410,250,70),w(450,410,550,70),w(520,500,70,150),pit(0,760,650,90),pit(850,760,150,90)],
    [B(350,340),B(350,600),B(350,710),B(740,710),B(780,560),B(780,710),B(780,900)],
    [sensor('hold',400,650,latch=False,zone=(400,480)),sensor('floor',780,560,'box')],
    [device('gate','hold',250,410,200,70),device('bridge','floor',650,760,200,90,'bridge')],
    tip='이미 사용한 문까지 계속 열어 둘 필요가 있을까요?',hint='그늘로 첫 문을 지나세요. 오른쪽 버튼으로 다리를 펼친 뒤에는, 지나온 문은 닫혀도 괜찮아요.',meaning='임시로 유지할 조건과 한 번 작동하면 남는 결과를 구별했어요.')
add(31,(130,700),(920,860),water_except([w(0,0,220,1000),w(840,0,160,1000),w(530,70,140,190)]),
    [D('deck-a',600),D('deck-b',780),T(),F(4),B(600,700),D('deck-a',520),T(),F(.25),B(600,180),B(600,700),F(4),D('deck-a',760),T(),B(870,700),F(1),B(920,700),B(920,860)],
    [sensor('floor',600,180,'box')],[device('gate','floor',840,0,50,1000)],
    platforms=[deck('deck-a',500,700,'x',72000,180,180,760,220,840),deck('deck-b',600,420,'y',49140,200,160,780,260,700)],
    tip='건널 설정과 변형할 설정, 마지막에 필요한 설정은 달라요.',hint='위쪽 섬의 버튼이 출구 쪽 문을 열어요. 중앙에서는 A를 짧게 해 작업면을, 돌아올 때는 길게 해 마지막 길을 만들어요.',meaning='두 발판의 길을 시간 순서에 맞춰 작업면과 이동로로 바꿨어요.')
add(32,(230,780),(830,550),[w(660,0,60,450),w(660,650,60,350),w(200,180,400,100),w(200,280,110,280),w(420,600,140,80)],
    [B(370,780),B(370,470),B(500,420),L(0,900,900),B(550,550),B(830,550)],
    [sensor('shade',300,180)],[device('gate','shade',660,450,60,200)],lights=[light(650,650,True,(650,650,900,900))],
    tip='빛의 이동 범위를 먼저 확인하고, 상자의 작업 위치를 정하세요.',hint='시작 위치에서 빛만 옮겨서는 부족해요. 돌벽 오른편 위쪽에서 그림자를 보내 보세요.',meaning='광원 이동 범위와 상자가 도착할 수 있는 위치를 함께 계산했어요.')
add(33,(300,300),(900,851.72413793),[w(0,470,610,60),w(750,470,250,60),w(780,530,40,160),w(780,920,40,80)],
    [S(0),B(680,300),S(1),B(680,700),S(0),B(900,851.72413793)],
    [sensor('one',930,650,latch=False,zone=(110,350)),sensor('two',865,750,latch=False,zone=(220,220))],
    [device('gate-a','one',610,470,140,60),device('gate-b','two',780,690,40,230)],lights=[light(100,300),light(680,930)],axis=True,
    tip='각 문에는 자기 그늘판이 있어요. 두 그림자를 함께 보세요.',hint='첫 문까지는 B의 세로축을, 다음 문에서는 A의 대각축을 써 보세요. 그림자 둘은 함께 움직여요.',meaning='독립된 두 문을 각 그림자의 유지 범위에 맞춰 통과했어요.')
add(34,(160,740),(830,900),[pit(260,0,470,1000),w(650,0,70,240),w(650,440,70,210),w(650,830,70,170)],
    [D('deck-a',500),T(),B(160,340),B(600,340),B(160,340),B(160,740),D('deck-b',600),T(),F(4),B(820,740),F(1),B(830,900)],
    [sensor('shade',730,340)],[device('gate','shade',650,650,70,180)],lights=[light(310,340)],
    platforms=[deck('deck-a',440,340,'x',50000,200,200,500,260,730),deck('deck-b',500,740,'x',42000,200,200,600,260,730)],
    tip='출구로 가는 길보다 먼저, 장치에 닿을 자리를 만드세요.',hint='A는 바로 건너는 다리가 아니라, 그림자를 장치로 보낼 작업 위치를 만들어요. 그 뒤 B를 준비하세요.',meaning='길 만들기의 첫 목적이 이동이 아니라 장치에 닿는 자리일 수도 있어요.')
add(35,(130,600),(850,115),[pit(240,180,760,820),pit(240,0,400,180)],
    [D('deck-a',760),D('deck-b',560),T(),F(4),B(590,600),D('deck-a',380),T(),F(.5),B(700,600),F(.25),B(700,115),F(1),B(850,115)],
    platforms=[deck('deck-a',500,600,'x',51000,200,160,760,240,700),deck('deck-b',700,425,'y',43200,180,160,650,180,600)],
    tip='두 발판의 최대 길이가 동시에 좋은 설정은 아니에요.',hint='A를 작업면으로 넓히고, B는 연결에 필요한 길이와 폭을 함께 맞추세요. 슬라이더의 중간 형태도 사용할 수 있어요.',meaning='길이, 작업 폭, 중간 형태의 균형을 각각 다른 목적에 맞췄어요.')
add(36,(220,560),(780,900),[w(440,0,70,480),w(440,640,70,360),w(600,0,120,420),pit(510,700,170,140),pit(860,700,140,140)],
    [L(0,220,80),B(220,280),B(220,560),L(0,220,140),S(1),B(780,560),L(0,780,80),B(780,900)],
    [sensor('hold',570,800,latch=False,zone=(500,100)),sensor('floor',220,280,'box')],
    [device('gate','hold',440,480,70,160),device('bridge','floor',680,700,180,140,'bridge')],lights=[light(220,420,True),light(80,560)],axis=True,
    tip='고정된 결과는 남겨 두고, 지금 유지할 그늘에 집중하세요.',hint='먼저 버튼으로 다리를 펼쳐요. 빛 A를 위로 보내 문에 그늘을 남기고 B의 가로축으로 통과하세요.',meaning='한 번 만든 다리는 놓아두고, 문을 통과할 때만 그늘을 유지했어요.')
add(37,(700,180),(280,700),[w(560,620,140,210),w(230,300,170,130)],
    [S(0),B(874.2857142857,180),S(1),B(280,700)],lights=[light(900,180),light(120,840)],axis=True,
    tip='출구에서 잠시 멀어지는 이동도 해답의 일부일 수 있어요.',hint='출구와 B를 잇는 선이 현재 가로축과 어디서 만나는지 보세요. 먼저 오른쪽으로 나가야 해요.',meaning='목표를 향해 당기는 대신, 목표에 이어지는 축을 먼저 찾았어요.')
add(38,(170,760),(220,140),[pit(420,0,160,260),pit(420,500,160,500),w(650,380,350,90)],
    [D('deck-a',500),T(),F(4),B(820,760),F(1),B(820,620),F(.25),B(615,620),B(615,200),B(820,200),B(615,200),B(615,380),B(300,380),F(1),B(220,380),B(220,140)],
    [sensor('floor',820,200,'box')],[device('bridge','floor',420,260,160,240,'bridge'),device('gate','floor',0,240,420,60)],
    platforms=[deck('deck-a',500,760,'x',40000,160,160,500,420,580)],
    tip='돌아올 때에도 처음의 긴 길을 써야 할까요?',hint='오른쪽 버튼은 위쪽에 새 다리를 펼쳐요. 낮은 쪽 발판으로 갔다가, 새 연결로 돌아오세요.',meaning='장치가 만든 새 지름길을 돌아오는 경로로 활용했어요.')
add(39,(180,500),(880,760),[pit(360,0,120,260),pit(360,340,120,660),pit(680,0,120,680),pit(680,840,120,160),w(480,470,50,80),w(610,470,70,80)],
    [B(180,220),B(286.6666667,626.6666667),B(250,300),F(4),B(565,300),F(.25),B(565,630),F(1),B(565,760),B(880,760)],
    [sensor('floor',180,220,'box'),sensor('shade',180,900)],
    [device('upper','floor',360,260,120,80,'bridge'),device('lower','shade',680,680,120,160,'bridge')],
    tip='두 준비의 순서는 자유예요. 실제 길이 이어지면 됩니다.',hint='왼쪽 위 버튼과 아래 그림자 장치는 독립돼 있어요. 두 다리를 펼친 다음 중간 회랑의 형태를 준비하세요.',meaning='정해진 방문 순서 없이, 두 준비를 자신이 고른 순서로 마쳤어요.',objective='두 다리 준비 · 어느 장치부터 해도 돼요')
add(40,(160,780),(820,130),[pit(340,0,320,1000),pit(660,320,340,280),w(610,0,60,560),w(610,880,60,120),w(60,100,230,30),w(60,310,230,30),w(60,100,30,240),w(260,100,30,240)],
    [L(0,160,930),B(160,400),L(0,280,860),L(0,160,80),B(160,720),D('deck-a',660),T(),F(4),L(0,80,720),B(760,720),F(1),L(0,760,80),B(760,820),L(0,80,820),B(820,820),L(0,600,80),D('deck-b',320),T(),S(1),F(.25),B(820,250),F(1),B(820,130)],
    [sensor('shade',100,170),sensor('floor',760,820,'box'),sensor('hold',930,390,latch=False,zone=(100,520))],
    [device('gate-a','shade',610,560,60,320),device('gate-b','floor',730,580,180,60),device('gate-c','hold',660,220,340,60)],
    lights=[light(160,420,True),light(820,930)],axis=True,
    platforms=[deck('deck-a',500,720,'x',54000,180,180,660,340,660),deck('deck-b',820,460,'y',25600,100,100,320,320,600)],
    tip='지금까지 배운 것만으로 작은 세계의 출구를 완성하세요.',hint='왼쪽 그림자 장치 → 발판 A 연결 → 오른쪽 바닥 버튼 → 발판 B 연결. 마지막에는 빛 A의 그림자를 그늘판에 남기고, 빛 B의 세로축으로 나가세요.',meaning='작업 위치, 문, 발판 폭, 그늘 유지와 이동축을 하나의 계획으로 완성했어요.')

# Stage34's first deck reaches a work position, not the far bank. Display-only metadata.
rooms[34]['platforms'][0].update(purpose='worksite',spanEnd=600)
# Authored scene data; no procedural/random variation. Keep unchanged room IDs.
for n in range(1,41):
 v=rooms[n]
 v['chapter']= '기본 원리' if n<=12 else '두 규칙 연결' if n<=16 else '계획하는 퍼즐' if n<=24 else '다른 쓰임 발견' if n<=32 else '최종 도전'
 v['tag']=('학습' if n<=12 else '연습' if n<=16 else '응용' if n<=24 else '고난도' if n<=32 else '최종')+' · '+str(n).zfill(2)
 # Input-mode changes are explicitly signalled, including free-movement returns.
 if n>=10:
  v['tip']=('점선 이동 · ' if v.get('axisMovement') else '자유 이동 · ')+v['tip']
 # Quantize witnesses to the existing slider's 201 positions, not hidden APIs.
 for a in routes[n]:
  if a[0]=='platform':
   p=next(p for p in v.get('platforms',[]) if p['id']==a[1])
   value=round((a[2]-p['minLength'])/(p['maxLength']-p['minLength'])*200)
   a[2]=round(p['minLength']+value/200*(p['maxLength']-p['minLength']),8)
  if a[0]=='aspect':a[1]=4**(round(math.log(a[1],4)*100)/100)
levels=[rooms[n] for n in range(1,41)]
header="/* Authored 40-room campaign. Existing mechanics only; see docs/Shadow_Puzzle_40Stage_Expansion_Plan.md. */\n(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.ShadowLevels=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){return "
(R/'src/levels.js').write_text(header+'[\n'+',\n'.join('  '+json.dumps(v,ensure_ascii=False,separators=(',',':')) for v in levels)+'\n];});\n')
sol=[dict(stage=n,levelId=rooms[n]['id'],steps=routes[n]) for n in range(1,41)]
sol[38]['alternateSteps']=[B(286.6666667,626.6666667),B(180,220)]+routes[39][2:]
(R/'tests/campaign40-solutions.json').write_text(json.dumps(sol,ensure_ascii=False,indent=2)+'\n')
(R/'qa/scene-data.json').write_text(json.dumps(levels,ensure_ascii=False,indent=2)+'\n')
print('Authored:',len(levels),'rooms')
