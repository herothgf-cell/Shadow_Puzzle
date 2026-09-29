# 40-room web verification

Run `npm test` then `npm run build`. Browser tests use Python Playwright from `requirements-dev.txt`.

```sh
python -m pip install -r requirements-dev.txt
python -m playwright install --with-deps chromium webkit firefox
python tests/hosting_browser.py --engine chromium
python tests/hosting_browser.py --engine webkit
python tests/hosting_browser.py --engine firefox
npm run test:browser
```

`hosting_browser.py` starts its own temporary HTTP server. `--base-url` uses the actual published HTTPS origin. `--smoke` replays rooms 1,5,11,12,23,29,35,37,38,39,40 plus the ID-resolved alternate preparation route and PC room26, retaining storage, keyboard and layout checks. Full mode replays all40 plus PC5/11/12/23/29/35/37/40.

`--fixture` is only for local sandboxes which prohibit URL navigation. It loads the same built HTML in memory and deliberately skips persistent-origin reload/migration checks. CI never uses this option. `--from-stage` resumes a local diagnostic run only; CI full runs do not use it.

All input follows real buttons, pointer events or keyboard events. The read-only snapshot surface observes state. Browser witness points on fixed-light axes are projected onto the actual radial line within 12 world units to account for integer CSS coordinates; arbitrary off-axis targets are rejected. Engine witnesses use exact authored coordinates. Final success always requires the unchanged game win condition.

Screen sizes include 320×568, 360×640, 393×852, 844×390, 768×1024, 1365×768 and 1920×1080. Tests cover the combined deck/light selector, square map visibility, direction keys, A/D, Z/R, touch then immediate tap (Chromium), orientation, reload and blocked storage.

The original V7 UI checks run against `qa/legacy-v7/index.html` produced from archived UI/levels and the active physics engine. They cannot accidentally test the new campaign under obsolete room numbers. They do not replace active40 checks.

Browser automation does not constitute physical iPhone/Galaxy testing. WebKit on Linux covers the engine, not every Safari device/browser UI; Firefox uses desktop input contexts at the same small sizes.

V8.1 reorders stages by stable ID. Old campaign assertions remain in `campaign-v8-regression.test.cjs`; active routes validate 40 reordered/rebuilt rooms. The 209-node-test count does not imply 209 human difficulty evaluations.
