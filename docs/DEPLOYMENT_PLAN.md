# Shadow Puzzle web migration

Approved scope: migrate existing V7 (19 rooms) to herothgf-cell/Shadow_Puzzle main and publish a working web URL for mobile and PC.

- [x] Read actual V7 sources and tests; repository was empty.
- [x] Preserve all room data, input rules and previous save keys.
- [x] Baseline: 65 core tests and existing browser suite passed.
- [x] Add deterministic standalone build identity (RED: missing version.json).
- [ ] Cross-engine HTTP-origin tests: Chromium, WebKit, Firefox.
- [ ] Verify compact portrait, landscape, tablet and desktop layouts; mouse/keyboard/touch, reload persistence and safe failures.
- [ ] Import modular source and tests into main.
- [ ] Add CI test gate then Pages deployment then live URL smoke check.

Implementation decisions: retain V7 gameplay; add no level redesign. Previous attachment/local origins cannot automatically transfer browser storage to the new HTTPS origin. Self-review is used because no reviewer subagent tool is available.
