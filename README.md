# Shadow Morph — 난이도 재편 · V8.1.0

**플레이: https://herothgf-cell.github.io/Shadow_Puzzle/**

40스테이지 모바일·PC 퍼즐입니다. 신규 기믹은 추가하지 않고, 기존 28개 방을 난이도 중심으로 재배치하고 후반 12개를 새 지형/해답으로 교체했습니다.

## 이번 변경

| 구간 | 중심 판단 |
|---|---|
| 1–8 | 이동·형태·버튼·발판의 길이/폭 |
| 9–16 | 단일 그림자 접촉과 장치 선행 관계 |
| 17–22 | 한 광원의 위치·이동축·작업 공간 |
| 23–28 | 두 광원의 선택·축 갈아타기 |
| 29–34 | 다른 작업 중 그늘 유지와 역할 전환 |
| 35–40 | 발판·유지형 문·광원을 다시 설정하는 종합 문제 |

기존 11·12는 23·29로, 기존 13·14는 5·10으로 옮겼습니다. `23+` 또는 `?stage=23`으로 두 광원부터 테스트할 수 있습니다. 순서는 설계 난도 추정이며 체감 난도는 플레이테스트로 검증합니다.

## 문서

- [승인된 난이도 재편 제안 원문](docs/Shadow_Puzzle_Difficulty_Rebalance_Proposal.md)
- [구현 상세·전체 번호 대응표·검증 범위](docs/REBALANCE81_RELEASE.md)
- [최초 40스테이지 확장 기획 원문](docs/Shadow_Puzzle_40Stage_Expansion_Plan.md)
- [웹 검증 방법](docs/WEB_TESTING.md)

## 조작·저장

모바일은 그림자/패드를 쓸고 버튼/슬라이더로 형태를 바꿉니다. PC는 마우스 또는 방향키, A/D 변형, Z 되돌리기, R 재시작입니다. 복합 방에서는 상자·발판·빛과 빛 A/B를 각각 선택합니다.

진행은 해당 기기와 브라우저에 저장됩니다. 동일 방은 ID로 새 번호에 이어집니다. 새로 교체된 방에는 옛 클리어를 붙이지 않고 옛 완료 ID는 남깁니다. 계정·광고·개인정보 수집·서버 저장은 없습니다.

## 개발·검증·배포

Node 22+, Python 3.13 기준입니다. 런타임/빌드는 외부 npm 라이브러리를 필요로 하지 않습니다.

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

`src/levels.js`는 빌드에 들어가는 레벨 데이터, `tools/rebalance_campaign.py`는 명시적 작성 원본, `tests/campaign40-solutions.json`은 실제 UI 해답 입력입니다. `tests/v8-*`에는 이전 40개, `archive/v7`에는 이전 19개를 보존합니다. `main` 변경은 전체 검사 후 Pages에 게시되며, 공개 HTTPS의 버전/커밋과 실제 플레이를 다시 검사합니다.

브라우저 엔진 자동 검사는 실기기 터치감, 후반 체감 난도, 반복감이 없다는 보장이 아닙니다.
