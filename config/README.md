# Configuration

This folder contains shared configuration, not product prices.

- `countries.js` — region metadata, currencies, price tiers, feature flags and each region's active `dataFile` path.
- `comparison-map.js` — mappings between equivalent/similar products across regions for multi-region comparison.

## Rule

Do not put regional product lists here. A normal price update should not require changes in `config/`.

When adding a new region, add the regional data file under `data/`, then register that file in `countries.js`. Add product mappings in `comparison-map.js` only when cross-region comparison is needed.

Run `npm run check` after configuration changes.
