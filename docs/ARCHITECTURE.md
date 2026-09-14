# HBL Repository Architecture

This repository keeps the deploy entry points at the root and groups implementation files by responsibility.

- `index.html` — app shell / DOM
- `app.js` — compatibility bootstrap only; loads `src/app.js`
- `src/app.js` — active application logic
- `styles.css` — active stylesheet (to be split in a later safe refactor)
- `config/` — country and comparison configuration
- `data/` — one active product/price file per region
- `icons/` — PWA and favicon assets
- `assets/branding/` — non-runtime HD branding assets
- `docs/` — maintenance and upload documentation
- `manifest.json` / `service-worker.js` — PWA runtime files

## Maintenance rule

Do not add duplicate copies of runtime files to the repository root or inside `data/`. Regional price changes should be made only in the corresponding file under `data/`.

Large refactors should keep legacy entry URLs working until the new paths have been verified in production.
