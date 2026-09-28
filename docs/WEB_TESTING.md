# Web verification

## Local prerequisites
- Node.js 22 or newer (runtime/build has no npm dependencies)
- Python 3.11+ for browser tests

```sh
npm run build
npm test
python -m pip install -r requirements-dev.txt
python -m playwright install --with-deps chromium webkit firefox
mkdir -p qa
npm run test:browser
python tests/hosting_browser.py --engine chromium
python tests/hosting_browser.py --engine webkit
python tests/hosting_browser.py --engine firefox
```

The hosted tests start a temporary HTTP server automatically. `--base-url` checks a published site. `--smoke` limits campaign traversal to rooms 1, 15 and 19 but retains PC keyboard, storage reload and layout checks.

`--fixture` is only for sandboxes that disallow browser navigation. It uses in-memory HTML, does not prove HTTP or persistent-origin storage, and is never used in CI.

## Coverage
- 19 levels through the collision engine and actual browser button/pad gestures.
- Compact 320x568, 360x640, phone 393x852, landscape 844x390, tablet 768x1024, PC 1365x768 and 1920x1080.
- Square visible canvas, separate controls, PC direction keys/A/D/Z/R, native Chromium touch then immediate tap.
- Deck target selection, gates, undo, orientation changes, reload storage, denied storage and disabled JavaScript.
- All previous V7 tests are retained.

WebKit on Linux is browser-engine coverage, not a physical iPhone Safari test. Native iOS/Android touch latency and battery use still need physical devices.

## Migration
V7 level data and core simulation are unchanged from the supplied V7 package. Changes are hosting/build identity, compact-phone layout and portable test tooling. The browser key stays `shadow-morph-v7-platforms`. Saved games from an HTML attachment, a different host or a different browser cannot automatically migrate to the new site's origin.
