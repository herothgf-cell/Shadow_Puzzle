# Shadow Morph — Shadow Puzzle

그림자로 상자와 발판을 조작하고 실제 문·다리를 바꾸는 **19스테이지 웹 퍼즐**입니다. 기존 V7의 레벨과 엔진을 유지한 웹 배포 버전은 **7.1.0**입니다.

## 플레이

**https://herothgf-cell.github.io/Shadow_Puzzle/**

휴대폰 또는 PC 브라우저에서 같은 주소를 엽니다. HTML 다운로드, Python 설치, 로컬 서버가 필요하지 않습니다. 최초 배포 진행 중에는 Actions의 `Test and deploy Shadow Puzzle` 성공 여부를 확인하세요.

## 조작

- 모바일: 그림자 또는 아래 패드를 쓸어서 이동. 형태 버튼·슬라이더로 변형합니다.
- PC: 마우스 드래그 또는 방향키로 이동, `A / D` 형태 변경, `Z` 되돌리기, `R` 재시작.
- 15~19: `상자 / 발판 A / 발판 B` 중 조작 대상을 선택합니다. `15+` 버튼으로 새 구간부터 시작할 수 있습니다.
- 빛을 움직일 수 있는 방에서는 `빛 이동`을 선택합니다. `? / 힌트`에서 현재 규칙을 확인합니다.

모바일 세로·가로 및 PC 레이아웃을 지원합니다. 높이가 작은 휴대폰에서는 중복 설명·범례를 접어 게임판을 확보하고, 전체 안내는 `? / 힌트`에 유지합니다.

## 개발

Node.js 22 이상으로 빌드합니다. 게임 실행 및 빌드에는 외부 npm 라이브러리가 필요하지 않습니다.

```sh
npm test
npm run build
```

산출물은 `site-ready/index.html`, `site-ready/version.json`, `.nojekyll`입니다. 게임판은 외부 스크립트·이미지 다운로드 없이 실행됩니다. 개발 중 로컬 확인은 Python 3가 있는 환경에서 `npm run serve`를 실행합니다.

```text
src/levels.js             19개 방의 데이터
src/core.js               화면 크기에 독립적인 퍼즐 엔진
src/ui.js                 터치·마우스·키보드, 화면, 로컬 저장
src/shell.html / style.css 화면 구조와 반응형 레이아웃
build.cjs                 배포용 HTML 및 빌드 식별정보 생성
tests/                    코어·레벨·브라우저 회귀 검사
.github/workflows/        검증 후 GitHub Pages 자동 배포
```

## 자동 검증과 배포

`main` 변경마다 Chromium, WebKit, Firefox에서 실제 HTTP로 게임을 열고 자동 검증합니다. 세 엔진의 검사가 모두 통과해야 GitHub Pages에 배포합니다. 배포 후에는 공개 HTTPS 주소의 커밋 ID 및 PC·모바일 크기 플레이를 다시 확인합니다. PR에서는 검사만 실행합니다.

브라우저 검사에는 여러 화면 크기의 게임판·조작부 배치, 19개 방의 실제 UI 클리어, 키보드 입력, 저장/새로고침, 회전, 저장 차단 환경이 포함됩니다. Chromium에서는 터치 이벤트도 확인합니다. 테스트 결과와 화면은 Actions의 QA 아티팩트에 남습니다.

```sh
python -m pip install -r requirements-dev.txt
python -m playwright install --with-deps chromium webkit firefox
npm run build
python tests/hosting_browser.py --engine chromium
python tests/hosting_browser.py --engine webkit
python tests/hosting_browser.py --engine firefox
npm run test:browser
```

**자동화 엔진 검사는 실제 아이폰·갤럭시 실기기 검사를 대체하지 않습니다.** 해당 기기의 터치감, 브라우저 UI, 장기 플레이 성능은 별도 확인 대상입니다.

## 저장과 개인정보

진행은 허용되는 브라우저의 로컬 저장소에만 저장합니다. 계정, 결제, 분석/광고 SDK, 서버 전송 기능은 없습니다. 기기·브라우저 간 동기화는 없으며, 예전 파일 미리보기나 다른 호스트에서의 저장은 이 사이트로 자동 이전되지 않습니다. 저장이 제한된 환경에서도 플레이는 계속됩니다.

## 변경 범위

기존 V7의 1~19 지형·퍼즐 엔진은 그대로 유지했습니다. 이번 이관은 소스/테스트 버전 관리, 작은 화면 보완, 자동 검증, GitHub Pages 공개 배포에 집중했습니다. 발판 자유 이동·회전, 추·도르래, 기계 정지는 포함하지 않습니다.
