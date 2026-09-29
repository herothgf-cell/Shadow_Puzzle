# 40-stage Campaign Implementation Plan

> Execution: inline in this session, user explicitly authorized development, main update and deployment.

Goal: ship the approved 40-room campaign without adding mechanics.
Architecture: retain the V7.1 physics and immutable V7 baseline; authored level data + witnessed solutions; ID-based progress migration; existing controls combined, not replaced.
Spec: ../Shadow_Puzzle_40Stage_Expansion_Plan.md (original, byte-preserved).
Base: 97565fa8d4e0ac3cccb5c46cc0ea8cb73f3ee6b6.

## Constraints / review focus
- Existing sensors (box/ellipse/centre-zone), gates/bridges, lights and anchored area-preserving decks only.
- All 40 starts valid. At least one real-input solution each; room39 has two valid orders.
- Exact V7 physics retained; legacy regression uses the active core with V7 level fixtures.
- Unchanged IDs migrate; changed layouts use new IDs. Legacy storage is never deleted or overwritten.
- Selected deck must not hide either light; guides do not invent mandatory sensor visitation.
- Small/rotated screens retain all controls. No test-only live state mutation.

## Tasks
1. [x] Representative 17/26/33 witnesses and ablations, then 40-room data + solutions. RED: assert length=40 and replay representative IDs; GREEN: valid initial/continuous states and representative preparation required.
2. [x] Progress migration tests, ID-based core restore and old/new completed-ID storage. RED: reorder index with same ID; GREEN: exact state+target+light restore and unrelated ID rejected.
3. [x] Combined controls + 17+ shortcut + dynamic campaign labels. RED: deck+two-light UI and room40 selector; GREEN: actual browser controls, no overlap.
4. [ ] Entire Node suite + original V7 UI + active 40-room browser replays on mobile and PC, all engines in CI.
5. [ ] Store original plan, execution/QA notes, publish non-force update to main, wait for tests + Pages + live commit verification.

## Reproducible checks
```
npm test
npm run build
BROWSER_EXECUTABLE=/usr/bin/chromium python tests/hosting_browser.py --engine chromium
```
