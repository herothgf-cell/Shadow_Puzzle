# Shadow Morph — 40개의 작은 세계 · V8.0.0

**플레이: https://herothgf-cell.github.io/Shadow_Puzzle/**

그림자로 상자·문·다리·광원·발판을 조작하는 모바일·PC 웹 퍼즐입니다. 이번 캠페인은 신규 기믹을 추가하지 않고 **기존 규칙의 조합과 준비 순서**를 사용합니다. 다운로드나 로컬 서버 없이 위 주소를 엽니다.

## 캠페인

| 구간 | 목적 |
|---|---|
| 1–12 | 주요 기믹 튜토리얼. 발판은 7번, 광원은 9번, 두 그림자는 11번부터 |
| 13–16 | 두 규칙을 연결하는 연습 |
| 17–24 | 출구 조건과 준비 순서를 먼저 생각하는 퍼즐 |
| 25–32 | 발판을 작업면으로 사용하고 그늘 유지·축을 계획하는 고난도 |
| 33–40 | 유지할 조건과 바꿀 조건을 구분하는 최종 도전 |

`17+`는 본격 퍼즐로 바로 가는 테스트용 버튼입니다. 스테이지 선택에서 모든 방에 접근할 수 있습니다. `?stage=26`처럼 특정 방부터 열 수도 있습니다. 방 번호는 방문 체크포인트가 아니며, 출구에 실제 상자 전체를 넣고 손을 떼면 완료됩니다.

## 조작

- 모바일: 보라 그림자 또는 패드를 쓸어 이동합니다. 버튼·슬라이더로 형태를 바꿉니다.
- PC: 마우스 드래그 또는 방향키 이동, `A / D` 변형, `Z` 되돌리기, `R` 재시작.
- `상자 / 발판 A / 발판 B / 빛 이동`은 조작 대상입니다. 별도의 `상자 그림자 / 빛 A·B` 선택도 복합 방에서 숨겨지지 않습니다.
- **자유 이동** 방과 **점선 이동** 방은 상단에 명시합니다. 선택하지 않은 그림자도 상자와 함께 움직입니다.
- 발판은 고정된 자리에서 길어질수록 폭이 줄어듭니다. 물체를 받칠 바닥이 사라지는 조작은 기존 안전 판정으로 막습니다.

## 기획 및 개발 문서

- [승인된 40스테이지 확장 기획안 원문](docs/Shadow_Puzzle_40Stage_Expansion_Plan.md)
- [구현 계획](docs/plans/CAMPAIGN40_IMPLEMENTATION.md)
- [구현 범위와 검증](docs/CAMPAIGN40_RELEASE.md)
- [웹 검증 및 배포](docs/WEB_TESTING.md)

기획안 원문은 SHA-256 `5d40618ae78ad1a79d628b56cc24c8af7fe476ebf7762e33a1c34d987b241b26`과 동일하게 보존했습니다. 기존 V7의 19개 방과 화면 소스는 `archive/v7/src`에 보존했습니다.

## 개발

실행/빌드는 외부 npm 라이브러리가 필요하지 않습니다. Node.js 22 이상을 사용합니다.

```sh
npm test
npm run build
python -m pip install -r requirements-dev.txt
python -m playwright install --with-deps chromium webkit firefox
python tests/hosting_browser.py --engine chromium
python tests/hosting_browser.py --engine webkit
python tests/hosting_browser.py --engine firefox
npm run test:browser
```

`src/levels.js`는 명시적으로 작성한 40개 방 데이터입니다. 수정용 원본 `tools/author_campaign.py`를 실행하면 레벨과 `tests/campaign40-solutions.json`의 해답 입력 경로를 함께 재생성합니다. 지형을 무작위로 만들거나 같은 맵을 자동 회전시키지 않습니다.

`src/core.js`는 화면 크기와 분리된 기존 물리 엔진, `src/progress.js`는 ID 기반 저장 이전, `src/ui.js`는 실제 입력과 화면입니다. `build.cjs`는 `site-ready/index.html`, `version.json`, `.nojekyll`을 만듭니다.

## 저장 이전

새 키는 `shadow-morph-campaign40-v8`입니다. 이전 V6/V7 키는 읽기만 하며 덮어쓰거나 삭제하지 않습니다. 지형이 그대로인 방은 **방 ID**로 현재 위치·형태·선택 대상을 이전합니다. 새 지형에는 이전 위치나 클리어 기록을 임의로 붙이지 않습니다. 사라진 방의 완료 ID는 새 저장에도 보관하되 새로운 방의 완료로 표시하지 않습니다.

진행은 이 기기·브라우저에만 저장됩니다. 계정, 광고 SDK, 개인 정보 수집, 서버 저장은 없습니다. 저장이 제한되어도 플레이는 가능합니다.

## 배포

`main` 변경 → 코어/레벨 검사 → Chromium·WebKit·Firefox의 실제 HTTP 검사 → GitHub Pages → 공개 HTTPS 주소의 버전·커밋 및 실제 조작 검사 순서입니다. 테스트를 건너뛰어 사이트를 배포하지 않습니다.

자동 검사에서 해결 가능성을 확인하는 것과 체감 난이도·재미를 검증하는 것은 다릅니다. 실제 아이폰/갤럭시 터치감과 17번 이후 난이도 곡선은 플레이테스트로 계속 평가해야 합니다.
