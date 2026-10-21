# 14. 데이터 명세·제작·문서 유지

> 기준: V8.1.0 / main `5ea02af8c748bfc1207a06932154407bbf3a0232`. 이 문서는 현행 구현을 정리합니다. 기획 의도·제작 기준·후속 검토는 별도로 표시합니다.

## 소스 역할

| 파일 | 책임 |
|---|---|
| `src/levels.js` | 현재 40개 방의 데이터와 배열 순서 |
| `src/core.js` | 투영·충돌·센서·발판·상태·복원 |
| `src/progress.js` | 완료 ID 및 이전 저장 읽기 |
| `src/ui.js` | 실제 입력, 화면, 메시지, 저장 호출 |
| `src/shell.html`, `src/style.css` | 화면 구조·반응형 스타일 |
| `tools/rebalance_campaign.py` | V8.1 명시적 레벨 작성 원본 |
| `tools/author_campaign.py` | 현행 작성 절차 진입점 |
| `tests/campaign40-solutions.json` | 작성된 코어/실제 UI 해답 경로 |
| `build.cjs` | 의존성 없이 소스들을 HTML로 묶고 버전 정보 출력 |

파일명에 V7/V8 등이 남아 있어도 현재 제품 버전은 package.json과 빌드 ID를 기준으로 확인한다. 주석의 옛 소개 스테이지 번호보다 현재 levels 배열이 우선이다.

## 방 데이터 계약

| 필드 | 의미 / 좌표 기준 |
|---|---|
| `id` | 안정적인 방 식별자. 번호와 다름 |
| `name/chapter/tag` | 선택/미션 화면 표시 |
| `tip/hint/meaning` | 시작 안내 / 선택 힌트 / 완료 의미 |
| `objective` | 선택적 현재 목표 문구. 승리 조건 추가가 아님 |
| `start:{x,y,a}` | 상자 중심·비율 |
| `goal:{x,y,w,h}` | 출구 중심·크기 |
| `walls:[{x,y,w,h,kind}]` | 좌상단·크기. kind pit이면 빈 공간, 그 외는 벽 |
| `lights:[{x,y,movable,bounds,name,id}]` | 빛의 점 좌표, 선택적 범위/이름/ID |
| `sensors:[{id,x,y,accept,r,latch,w,h,name}]` | 중심. accept box/shadow, w/h는 그림자 중심 영역 |
| `devices:[{id,type,sensorId,x,y,w,h}]` | 좌상단. gate/bridge, 센서 하나 참조 |
| `platforms:[{id,name,x,y,axis,area,length,minLength,maxLength,spanStart,spanEnd,purpose}]` | 고정 중심·방향·면적·길이 범위·안내 기준점 |
| `axisMovement` | 현재 방의 자유/빛축 이동 |
| `allowMorph` | 상자 변형 허용. 발판 길이 조작과 별개 |
| `defaultTarget` | 처음 선택한 발판 ID 또는 상자 |

walls/sensors/devices/platforms가 없으면 빈 목록으로 정규화한다. 광원이 없으면 기본 (500,80)을 제공한다. allowMorph 생략은 true다. 현재 데이터는 센서 및 장치 ID 연결이 유효하다는 전제를 가지므로 편집 시 검증해야 한다.

## 좌표형 혼동 방지

상자·출구·빛·센서·발판은 중심 또는 점 좌표, 벽·장치는 좌상단 좌표다. 센서 r은 그림자 점형 접촉의 반경이 아니다. 발판 spanStart/End는 바닥을 생성하지 않는 안내값이다. `purpose` 같은 UI 지원 필드와 활성 캠페인에서 실제 사용하는 필드는 구별한다.

## 제작 절차 — 현행 명령

```sh
python tools/author_campaign.py
npm test
npm run build
python -m pip install -r requirements-dev.txt
python -m playwright install --with-deps chromium webkit firefox
python tests/hosting_browser.py --engine chromium
python tests/hosting_browser.py --engine webkit
python tests/hosting_browser.py --engine firefox
npm run test:browser
```

작성 원본과 생성 결과를 함께 수정한다. levels.js만 수정한 뒤 생성 명령으로 변경을 잃지 않게 한다. Node.js 22 이상, 현재 브라우저 검사 기준은 Python 3.13이다. 실행/빌드는 외부 npm 라이브러리를 요구하지 않는다. 필요한 브라우저 런타임과 개발 의존성은 별도 설치다.

## 빌드·게시 산출물

`site-ready/index.html`, `version.json`, `.nojekyll`과 로컬 단일 HTML을 만든다. main 변경은 기존 Actions가 코어 및 3엔진 HTTP 검사를 거쳐 Pages에 게시하고, 공개 주소의 커밋과 대표 경로를 다시 검사한다. 이 문서 작업은 게임 규칙이나 배포 설정을 변경하지 않는다.

현재는 웹게임이며 앱 패키지·PWA 설치·오프라인 서비스워커가 구현됐다고 여기서 주장하지 않는다. itch.io 재업로드와 잼 제출은 별도 계정/게시 절차로 GitHub 커밋이 자동 수행하지 않는다.

## 문서 변경 규칙

규칙 변경 시 해당 요소 문서와 데이터·검사를 함께 갱신한다. 번호 변경 시 두 스테이지 카탈로그·도움말·직접 진입 예시를 재확인한다. 지형 교체 시 새 ID 및 저장 이전을 확인한다. 제안 단계의 아이디어는 [후속 검토](16-decisions-and-backlog.md)에 두고 현행 판정에 섞지 않는다.

## 근거

[package.json](../../package.json), [build.cjs](../../build.cjs), [작성 도구](../../tools/rebalance_campaign.py), [진입 도구](../../tools/author_campaign.py), [현행 소스](../../src/levels.js), [워크플로](../../.github/workflows/deploy-pages.yml), [웹 검사 안내](../../docs/WEB_TESTING.md).
