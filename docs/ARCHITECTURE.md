# HBL Repository Architecture

The repository is intentionally buildless and keeps stable deploy entry URLs at the root while grouping implementation files by responsibility.

```text
HBL/
├── index.html                 # App shell / DOM
├── app.js                     # Compatibility bootstrap -> src/app.js
├── styles.css                 # Compatibility stylesheet -> src/styles/app.css
├── manifest.json              # PWA manifest
├── service-worker.js          # PWA service worker
├── logo.svg                   # Current runtime logo URL kept for compatibility
├── package.json               # Maintenance/check commands only
│
├── src/
│   ├── app.js                 # Canonical application logic
│   └── styles/
│       └── app.css            # Canonical application CSS
│
├── config/
│   ├── countries.js           # Region/currency/tier/feature configuration
│   └── comparison-map.js      # Cross-region product mappings
│
├── data/
│   ├── hong-kong.js
│   ├── taiwan.js
│   ├── japan.js
│   └── thailand.js            # Canonical regional product/price files
│
├── icons/                     # PWA icons and favicon
├── assets/branding/           # High-resolution branding source assets
├── scripts/                   # Repository/data validation tools
├── docs/                      # Maintenance documentation
└── .github/workflows/         # Automatic repository checks
```

## Canonical-source rules

1. Regional prices live only under `data/`.
2. Region/currency/tier configuration lives only under `config/`.
3. Active JavaScript implementation lives under `src/app.js`; root `app.js` is only a compatibility loader.
4. Active CSS lives under `src/styles/app.css`; root `styles.css` is only a compatibility entry point.
5. Do not recreate root copies of regional data, `countries.js`, `comparison-map.js`, icons, or nested `data/data/` structures.
6. Root runtime URLs remain stable unless a deliberate migration updates every reference and validation rule together.

## Verification

Run this before merging maintenance changes:

```bash
npm run check
```

The same validation runs automatically in GitHub Actions for pull requests and pushes to `main`.

## Price-update workflow

For a normal regional price change, edit only the matching `data/<region>.js` file. Do not touch `src/app.js`, `index.html`, other regional files, or config unless the product/configuration itself has changed.
