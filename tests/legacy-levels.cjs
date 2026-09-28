(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.ShadowLevels=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){return [
  {
    "id": "rebuild-01",
    "name": "그림자를 잡아보세요",
    "tag": "손잡이",
    "tip": "보라색 그림자나 아래 패드를 오른쪽으로 쓸어 보세요.",
    "hint": "그림자와 상자는 같은 방향으로 움직여요. 상자 전체를 초록 출구에 넣고 손을 떼세요.",
    "meaning": "그림자는 직접 조작하는 손잡이, 노란 상자가 출구에 도착해야 완료됩니다.",
    "chapter": "손잡이와 형태",
    "start": {
      "x": 230,
      "y": 350,
      "a": 1
    },
    "goal": {
      "x": 720,
      "y": 350,
      "w": 130,
      "h": 130
    },
    "walls": [],
    "sensors": [],
    "devices": [],
    "lights": [
      {
        "x": 300,
        "y": 120,
        "movable": false,
        "name": "빛"
      }
    ],
    "axisMovement": false,
    "allowMorph": false
  },
  {
    "id": "rebuild-02",
    "name": "벽 너머의 손",
    "tag": "그림자만 가능한 일",
    "tip": "닫힌 작은 방의 ◇ 장치를 그림자로 덮어 보세요.",
    "hint": "아래쪽 닫힌 방에는 상자가 못 들어가요. 상자를 왼쪽 아래 공간으로 옮기면 그림자는 벽 너머 장치에 닿아요.",
    "meaning": "그림자가 갇힌 장치를 건드리면, 연결된 실제 문이 열립니다.",
    "chapter": "손잡이와 형태",
    "start": {
      "x": 200,
      "y": 300,
      "a": 1
    },
    "goal": {
      "x": 820,
      "y": 250,
      "w": 130,
      "h": 130
    },
    "walls": [
      {
        "x": 680,
        "y": 0,
        "w": 60,
        "h": 160,
        "kind": "wall"
      },
      {
        "x": 680,
        "y": 340,
        "w": 60,
        "h": 660,
        "kind": "wall"
      },
      {
        "x": 240,
        "y": 680,
        "w": 280,
        "h": 40,
        "kind": "wall"
      },
      {
        "x": 240,
        "y": 880,
        "w": 280,
        "h": 40,
        "kind": "wall"
      },
      {
        "x": 240,
        "y": 680,
        "w": 40,
        "h": 240,
        "kind": "wall"
      },
      {
        "x": 480,
        "y": 680,
        "w": 40,
        "h": 240,
        "kind": "wall"
      }
    ],
    "sensors": [
      {
        "id": "pad",
        "x": 380,
        "y": 790,
        "r": 28,
        "accept": "shadow",
        "latch": true,
        "name": "그림자 장치"
      }
    ],
    "devices": [
      {
        "id": "door",
        "type": "gate",
        "x": 680,
        "y": 160,
        "w": 60,
        "h": 180,
        "sensorId": "pad"
      }
    ],
    "lights": [
      {
        "x": 400,
        "y": 100,
        "movable": false,
        "name": "빛"
      }
    ],
    "axisMovement": false,
    "allowMorph": false
  },
  {
    "id": "rebuild-03",
    "name": "낮은 아치",
    "tag": "가로로 납작하게",
    "tip": "가로로 늘리면 높이가 줄어요. 낮은 틈을 건너세요.",
    "hint": "가로형으로 중앙 아치를 지나고, 출구 앞에서는 기본형으로 돌아오세요.",
    "meaning": "그림자 형태가 상자의 실제 충돌 크기를 바꿉니다.",
    "chapter": "손잡이와 형태",
    "start": {
      "x": 220,
      "y": 430,
      "a": 1
    },
    "goal": {
      "x": 800,
      "y": 430,
      "w": 130,
      "h": 130
    },
    "walls": [
      {
        "x": 390,
        "y": 0,
        "w": 180,
        "h": 392,
        "kind": "wall"
      },
      {
        "x": 430,
        "y": 468,
        "w": 100,
        "h": 532,
        "kind": "wall"
      },
      {
        "x": 700,
        "y": 680,
        "w": 160,
        "h": 140,
        "kind": "wall"
      }
    ],
    "sensors": [],
    "devices": [],
    "lights": [
      {
        "x": 500,
        "y": 80,
        "movable": false,
        "name": "빛"
      }
    ],
    "axisMovement": false,
    "allowMorph": true
  },
  {
    "id": "rebuild-04",
    "name": "가느다란 회랑",
    "tag": "세로로 가늘게",
    "tip": "이번에는 높이 대신 폭을 줄여야 해요.",
    "hint": "세로형으로 위쪽 좁은 회랑을 내려온 뒤, 넓은 아래 공간에서 기본형으로 바꾸세요.",
    "meaning": "같은 변형이 낮은 통로에는 불리하고, 좁은 통로에는 유리합니다.",
    "chapter": "손잡이와 형태",
    "start": {
      "x": 320,
      "y": 180,
      "a": 1
    },
    "goal": {
      "x": 660,
      "y": 820,
      "w": 130,
      "h": 130
    },
    "walls": [
      {
        "x": 0,
        "y": 350,
        "w": 286,
        "h": 140,
        "kind": "wall"
      },
      {
        "x": 354,
        "y": 350,
        "w": 646,
        "h": 140,
        "kind": "wall"
      },
      {
        "x": 80,
        "y": 740,
        "w": 260,
        "h": 80,
        "kind": "wall"
      }
    ],
    "sensors": [],
    "devices": [],
    "lights": [
      {
        "x": 500,
        "y": 80,
        "movable": false,
        "name": "빛"
      }
    ],
    "axisMovement": false,
    "allowMorph": true
  },
  {
    "id": "rebuild-05",
    "name": "모퉁이에서 변신",
    "tag": "미리 형태 고르기",
    "tip": "낮은 아치 다음에는 좁은 문이 있어요.",
    "hint": "왼쪽 아치는 가로형, 오른쪽 아래 문은 세로형. 넓은 모퉁이에서 형태를 바꾸세요.",
    "meaning": "길을 외우기보다, 다음 통로에 맞는 형태를 넓은 공간에서 준비합니다.",
    "chapter": "손잡이와 형태",
    "start": {
      "x": 180,
      "y": 200,
      "a": 1
    },
    "goal": {
      "x": 790,
      "y": 810,
      "w": 130,
      "h": 130
    },
    "walls": [
      {
        "x": 310,
        "y": 0,
        "w": 70,
        "h": 164,
        "kind": "wall"
      },
      {
        "x": 310,
        "y": 236,
        "w": 70,
        "h": 764,
        "kind": "wall"
      },
      {
        "x": 380,
        "y": 570,
        "w": 345,
        "h": 65,
        "kind": "wall"
      },
      {
        "x": 795,
        "y": 570,
        "w": 205,
        "h": 65,
        "kind": "wall"
      },
      {
        "x": 610,
        "y": 70,
        "w": 240,
        "h": 70,
        "kind": "wall"
      }
    ],
    "sensors": [],
    "devices": [],
    "lights": [
      {
        "x": 500,
        "y": 80,
        "movable": false,
        "name": "빛"
      }
    ],
    "axisMovement": false,
    "allowMorph": true
  },
  {
    "id": "rebuild-06",
    "name": "밟으면 문이 열려요",
    "tag": "상자로 누르는 버튼",
    "tip": "노란 ○ 버튼은 상자로 누르세요. 연결된 문이 열려요.",
    "hint": "왼쪽 가로 벽의 오른편으로 돌아, 위쪽 바닥 버튼을 누르세요. 한 번 누른 문은 열린 채로 남아요.",
    "meaning": "숫자 수집이 아니라, 버튼과 케이블에 연결된 문이 실제로 사라집니다.",
    "chapter": "눈앞에서 바뀌는 세계",
    "start": {
      "x": 190,
      "y": 760,
      "a": 1
    },
    "goal": {
      "x": 810,
      "y": 240,
      "w": 130,
      "h": 130
    },
    "walls": [
      {
        "x": 560,
        "y": 0,
        "w": 70,
        "h": 310,
        "kind": "wall"
      },
      {
        "x": 560,
        "y": 480,
        "w": 70,
        "h": 520,
        "kind": "wall"
      },
      {
        "x": 100,
        "y": 460,
        "w": 290,
        "h": 80,
        "kind": "wall"
      }
    ],
    "sensors": [
      {
        "id": "pad",
        "x": 220,
        "y": 240,
        "r": 28,
        "accept": "box",
        "latch": true,
        "name": "바닥 버튼"
      }
    ],
    "devices": [
      {
        "id": "door",
        "type": "gate",
        "x": 560,
        "y": 310,
        "w": 70,
        "h": 170,
        "sensorId": "pad"
      }
    ],
    "lights": [
      {
        "x": 500,
        "y": 80,
        "movable": false,
        "name": "빛"
      }
    ],
    "axisMovement": false,
    "allowMorph": true
  },
  {
    "id": "rebuild-07",
    "name": "그림자를 남겨 두세요",
    "tag": "덮고 있는 동안만",
    "tip": "아래 그늘판 안에 그림자를 두면 문이 열려 있어요.",
    "hint": "상자를 오른쪽으로 움직이면 그림자가 아래 그늘판에 들어가요. 같은 높이로 이동해, 문을 지나는 동안 그늘을 유지하세요.",
    "meaning": "바닥 버튼을 누른 채 혼자 떠나는 불가능한 요구 대신, 그림자가 원격으로 문을 잡습니다.",
    "chapter": "눈앞에서 바뀌는 세계",
    "start": {
      "x": 220,
      "y": 560,
      "a": 1
    },
    "goal": {
      "x": 820,
      "y": 560,
      "w": 130,
      "h": 130
    },
    "walls": [
      {
        "x": 480,
        "y": 0,
        "w": 60,
        "h": 480,
        "kind": "wall"
      },
      {
        "x": 480,
        "y": 640,
        "w": 60,
        "h": 360,
        "kind": "wall"
      },
      {
        "x": 60,
        "y": 660,
        "w": 860,
        "h": 40,
        "kind": "wall"
      }
    ],
    "sensors": [
      {
        "id": "pad",
        "x": 630,
        "y": 800,
        "r": 28,
        "accept": "shadow",
        "latch": false,
        "name": "그늘판 · 유지",
        "w": 640,
        "h": 180
      }
    ],
    "devices": [
      {
        "id": "door",
        "type": "gate",
        "x": 480,
        "y": 480,
        "w": 60,
        "h": 160,
        "sensorId": "pad"
      }
    ],
    "lights": [
      {
        "x": 500,
        "y": 80,
        "movable": false,
        "name": "빛"
      }
    ],
    "axisMovement": false,
    "allowMorph": true
  },
  {
    "id": "rebuild-08",
    "name": "사라진 다리",
    "tag": "버튼으로 길 만들기",
    "tip": "방 안의 버튼을 누르면 끊긴 곳에 다리가 펼쳐져요.",
    "hint": "왼쪽 위 방에는 낮은 입구가 있어요. 가로형으로 버튼을 누르고, 다시 나와 아래쪽 다리를 건너세요.",
    "meaning": "다리 전에는 빈 공간이 실제 이동을 막고, 다리 후에는 같은 위치가 바닥이 됩니다.",
    "chapter": "눈앞에서 바뀌는 세계",
    "start": {
      "x": 220,
      "y": 760,
      "a": 1
    },
    "goal": {
      "x": 790,
      "y": 760,
      "w": 130,
      "h": 130
    },
    "walls": [
      {
        "x": 620,
        "y": 0,
        "w": 110,
        "h": 650,
        "kind": "pit"
      },
      {
        "x": 620,
        "y": 850,
        "w": 110,
        "h": 150,
        "kind": "pit"
      },
      {
        "x": 100,
        "y": 100,
        "w": 60,
        "h": 320,
        "kind": "wall"
      },
      {
        "x": 100,
        "y": 100,
        "w": 320,
        "h": 60,
        "kind": "wall"
      },
      {
        "x": 100,
        "y": 360,
        "w": 320,
        "h": 60,
        "kind": "wall"
      },
      {
        "x": 360,
        "y": 100,
        "w": 60,
        "h": 124,
        "kind": "wall"
      },
      {
        "x": 360,
        "y": 296,
        "w": 60,
        "h": 124,
        "kind": "wall"
      }
    ],
    "sensors": [
      {
        "id": "pad",
        "x": 260,
        "y": 260,
        "r": 28,
        "accept": "box",
        "latch": true,
        "name": "바닥 버튼"
      }
    ],
    "devices": [
      {
        "id": "bridge",
        "type": "bridge",
        "x": 620,
        "y": 650,
        "w": 110,
        "h": 200,
        "sensorId": "pad"
      }
    ],
    "lights": [
      {
        "x": 500,
        "y": 80,
        "movable": false,
        "name": "빛"
      }
    ],
    "axisMovement": false,
    "allowMorph": true
  },
  {
    "id": "rebuild-09",
    "name": "빛만 움직여도",
    "tag": "빛 → 그림자 → 문",
    "tip": "광원 모드로 빛을 아래쪽에 옮겨 보세요. 상자는 그대로예요.",
    "hint": "상자를 움직여서는 위쪽 밀실의 그림자 장치에 닿지 않아요. 빛을 상자 오른쪽 아래로 옮기면 그림자가 위로 뻗어요.",
    "meaning": "빛을 옮기는 행동만으로 그림자가 장치를 덮어 실제 문을 엽니다. 상자 순간이동은 없습니다.",
    "chapter": "빛으로 길을 만드는 법",
    "start": {
      "x": 300,
      "y": 500,
      "a": 1
    },
    "goal": {
      "x": 780,
      "y": 500,
      "w": 130,
      "h": 130
    },
    "walls": [
      {
        "x": 540,
        "y": 0,
        "w": 60,
        "h": 400,
        "kind": "wall"
      },
      {
        "x": 540,
        "y": 600,
        "w": 60,
        "h": 400,
        "kind": "wall"
      },
      {
        "x": 100,
        "y": 240,
        "w": 320,
        "h": 40,
        "kind": "wall"
      },
      {
        "x": 100,
        "y": 390,
        "w": 320,
        "h": 40,
        "kind": "wall"
      },
      {
        "x": 100,
        "y": 240,
        "w": 40,
        "h": 190,
        "kind": "wall"
      },
      {
        "x": 380,
        "y": 240,
        "w": 40,
        "h": 190,
        "kind": "wall"
      }
    ],
    "sensors": [
      {
        "id": "pad",
        "x": 250,
        "y": 340,
        "r": 28,
        "accept": "shadow",
        "latch": true,
        "name": "그림자 장치"
      }
    ],
    "devices": [
      {
        "id": "door",
        "type": "gate",
        "x": 540,
        "y": 400,
        "w": 60,
        "h": 200,
        "sensorId": "pad"
      }
    ],
    "lights": [
      {
        "x": 300,
        "y": 220,
        "movable": true,
        "name": "빛"
      }
    ],
    "axisMovement": false,
    "allowMorph": true
  },
  {
    "id": "rebuild-10",
    "name": "빛으로 방향 만들기",
    "tag": "새 규칙 · 빛의 선",
    "tip": "이 방부터 상자는 빛과 연결된 점선을 따라서만 움직여요.",
    "hint": "먼저 세로 점선을 이용해 벽 위로 올라가세요. 빛을 상자 왼쪽에 놓으면 가로 점선이 생겨요.",
    "meaning": "광원을 옮기면 조종 가능한 방향 자체가 달라집니다. 가로·세로 제한은 이 방에서 명시적으로 소개합니다.",
    "chapter": "빛으로 길을 만드는 법",
    "start": {
      "x": 260,
      "y": 750,
      "a": 1
    },
    "goal": {
      "x": 790,
      "y": 220,
      "w": 130,
      "h": 130
    },
    "walls": [
      {
        "x": 440,
        "y": 300,
        "w": 160,
        "h": 460,
        "kind": "wall"
      },
      {
        "x": 40,
        "y": 300,
        "w": 150,
        "h": 80,
        "kind": "wall"
      },
      {
        "x": 650,
        "y": 630,
        "w": 260,
        "h": 90,
        "kind": "wall"
      }
    ],
    "sensors": [],
    "devices": [],
    "lights": [
      {
        "x": 260,
        "y": 400,
        "movable": true,
        "name": "빛"
      }
    ],
    "axisMovement": true,
    "allowMorph": true
  },
  {
    "id": "rebuild-11",
    "name": "형태와 방향",
    "tag": "엇갈린 두 아치",
    "tip": "두 낮은 아치 사이에서 빛의 방향을 바꿔 보세요.",
    "hint": "가로형으로 왼쪽 위 아치를 지나세요. 빛을 옮겨 가운데를 아래로 내려간 뒤, 오른쪽 아래 아치를 통과하고 위로 올라가요.",
    "meaning": "좁은 통로에서 형태를 유지하고, 넓은 방에서는 빛을 옮겨 방향을 바꿉니다. 같은 L자 지형의 반복이 아닌 엇갈린 동선입니다.",
    "chapter": "빛으로 길을 만드는 법",
    "start": {
      "x": 180,
      "y": 220,
      "a": 1
    },
    "goal": {
      "x": 820,
      "y": 220,
      "w": 130,
      "h": 130
    },
    "walls": [
      {
        "x": 300,
        "y": 0,
        "w": 65,
        "h": 185,
        "kind": "wall"
      },
      {
        "x": 300,
        "y": 255,
        "w": 65,
        "h": 745,
        "kind": "wall"
      },
      {
        "x": 630,
        "y": 0,
        "w": 65,
        "h": 700,
        "kind": "wall"
      },
      {
        "x": 630,
        "y": 770,
        "w": 65,
        "h": 230,
        "kind": "wall"
      }
    ],
    "sensors": [],
    "devices": [],
    "lights": [
      {
        "x": 80,
        "y": 220,
        "movable": true,
        "name": "빛"
      }
    ],
    "axisMovement": true,
    "allowMorph": true
  },
  {
    "id": "rebuild-12",
    "name": "두 빛, 두 방향",
    "tag": "다른 손잡이 선택",
    "tip": "빛 A와 B는 고정돼 있어요. 어느 그림자를 당길지 고르세요.",
    "hint": "A 그림자로 오른쪽으로 옮겨, 상자가 B 빛의 아래에 오게 하세요. 그다음 B 그림자로 내려가세요.",
    "meaning": "각 빛은 현재 상자와 이어지는 서로 다른 방향을 만듭니다. 빛을 선택해도 상자는 움직이지 않습니다.",
    "chapter": "빛으로 길을 만드는 법",
    "start": {
      "x": 300,
      "y": 400,
      "a": 1
    },
    "goal": {
      "x": 620,
      "y": 780,
      "w": 130,
      "h": 130
    },
    "walls": [
      {
        "x": 430,
        "y": 530,
        "w": 120,
        "h": 360,
        "kind": "wall"
      },
      {
        "x": 180,
        "y": 600,
        "w": 170,
        "h": 90,
        "kind": "wall"
      }
    ],
    "sensors": [],
    "devices": [],
    "lights": [
      {
        "x": 100,
        "y": 400,
        "movable": false,
        "name": "빛 A"
      },
      {
        "x": 620,
        "y": 100,
        "movable": false,
        "name": "빛 B"
      }
    ],
    "axisMovement": true,
    "allowMorph": true
  },
  {
    "id": "rebuild-13",
    "name": "하나는 문을, 하나는 길을",
    "tag": "선택하지 않은 그림자도 작동",
    "tip": "A 그림자가 그늘판을 누르는 동안 B 그림자로 문을 지나세요.",
    "hint": "A 그림자로 상자를 B 빛 바로 아래까지 옮기세요. B로 내려가면 오른쪽의 A 그림자가 그늘판을 덮어요.",
    "meaning": "조작 중인 그림자만 존재하는 것이 아닙니다. 나머지 그림자가 현실의 문을 잡는 역할을 맡습니다.",
    "chapter": "빛으로 길을 만드는 법",
    "start": {
      "x": 320,
      "y": 320,
      "a": 1
    },
    "goal": {
      "x": 680,
      "y": 820,
      "w": 130,
      "h": 130
    },
    "walls": [
      {
        "x": 0,
        "y": 570,
        "w": 590,
        "h": 60,
        "kind": "wall"
      },
      {
        "x": 770,
        "y": 570,
        "w": 230,
        "h": 60,
        "kind": "wall"
      },
      {
        "x": 870,
        "y": 485,
        "w": 30,
        "h": 515,
        "kind": "wall"
      }
    ],
    "sensors": [
      {
        "id": "pad",
        "x": 930,
        "y": 740,
        "r": 28,
        "accept": "shadow",
        "latch": false,
        "name": "그늘판 · 유지",
        "w": 92,
        "h": 450
      }
    ],
    "devices": [
      {
        "id": "door",
        "type": "gate",
        "x": 590,
        "y": 570,
        "w": 180,
        "h": 60,
        "sensorId": "pad"
      }
    ],
    "lights": [
      {
        "x": 100,
        "y": 320,
        "movable": false,
        "name": "빛 A"
      },
      {
        "x": 680,
        "y": 80,
        "movable": false,
        "name": "빛 B"
      }
    ],
    "axisMovement": true,
    "allowMorph": true
  },
  {
    "id": "rebuild-14",
    "name": "작은 세계를 깨우기",
    "tag": "첫 종합 퍼즐",
    "tip": "그림자로 문을 열고, 상자로 다리를 펼쳐 출구에 도착하세요.",
    "hint": "왼쪽 밀실 장치를 그림자로 덮으면 오른쪽 문이 열려요. 문 너머 바닥 버튼이 강 위의 다리를 펼쳐요. A는 옮길 수 있고 B는 고정이에요.",
    "meaning": "목록을 순서대로 지우는 것이 아니라 문과 다리가 다음 공간을 실제로 열어 주는 인과관계입니다.",
    "chapter": "빛으로 길을 만드는 법",
    "start": {
      "x": 190,
      "y": 780,
      "a": 1
    },
    "goal": {
      "x": 860,
      "y": 230,
      "w": 130,
      "h": 130
    },
    "walls": [
      {
        "x": 470,
        "y": 0,
        "w": 60,
        "h": 650,
        "kind": "wall"
      },
      {
        "x": 470,
        "y": 850,
        "w": 60,
        "h": 150,
        "kind": "wall"
      },
      {
        "x": 530,
        "y": 420,
        "w": 170,
        "h": 130,
        "kind": "pit"
      },
      {
        "x": 860,
        "y": 420,
        "w": 140,
        "h": 130,
        "kind": "pit"
      },
      {
        "x": 80,
        "y": 160,
        "w": 280,
        "h": 40,
        "kind": "wall"
      },
      {
        "x": 80,
        "y": 350,
        "w": 280,
        "h": 40,
        "kind": "wall"
      },
      {
        "x": 80,
        "y": 160,
        "w": 40,
        "h": 230,
        "kind": "wall"
      },
      {
        "x": 320,
        "y": 160,
        "w": 40,
        "h": 230,
        "kind": "wall"
      }
    ],
    "sensors": [
      {
        "id": "shade",
        "x": 220,
        "y": 280,
        "r": 28,
        "accept": "shadow",
        "latch": true,
        "name": "그림자 장치"
      },
      {
        "id": "floor",
        "x": 730,
        "y": 760,
        "r": 28,
        "accept": "box",
        "latch": true,
        "name": "바닥 버튼"
      }
    ],
    "devices": [
      {
        "id": "door",
        "type": "gate",
        "x": 470,
        "y": 650,
        "w": 60,
        "h": 200,
        "sensorId": "shade"
      },
      {
        "id": "bridge",
        "type": "bridge",
        "x": 700,
        "y": 420,
        "w": 160,
        "h": 130,
        "sensorId": "floor"
      }
    ],
    "lights": [
      {
        "x": 190,
        "y": 540,
        "movable": true,
        "name": "빛 A"
      },
      {
        "x": 80,
        "y": 230,
        "movable": false,
        "name": "빛 B"
      }
    ],
    "axisMovement": true,
    "allowMorph": true
  }
];});
