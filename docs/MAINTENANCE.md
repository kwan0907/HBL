# HBL Maintenance Runbook

This is the day-to-day operating guide for repository changes.

## 1. Price-only change

Edit only the matching file under `data/`.

Examples:

- Hong Kong: `data/hong-kong.js`
- Taiwan: `data/taiwan.js`
- Japan: `data/japan.js`
- Thailand: `data/thailand.js`

Do not copy the file elsewhere. Do not edit the root compatibility files for a price change.

After editing, run:

```bash
npm run check:data
```

## 2. Add or remove a product

1. Update the regional `data/*.js` file.
2. Keep `stock_no` unique within that region.
3. If the product should be compared across regions, update `config/comparison-map.js`.
4. Run `npm run check`.

## 3. Add a new region

1. Add `data/<region>.js`.
2. Register the region in `config/countries.js`.
3. Add currency metadata if the currency is new.
4. Add comparison mappings where useful.
5. Run `npm run check`.

## 4. App logic change

Canonical logic is `src/app.js`.

The root `app.js` is a compatibility bootstrap only. Do not put new feature logic in the root file.

## 5. CSS change

Canonical CSS is `src/styles/app.css`.

The root `styles.css` is a compatibility entry point only.

## 6. PWA change

PWA runtime files are:

- `manifest.json`
- `service-worker.js`
- `icons/`

When changing cache behavior, bump the service-worker cache name so installed clients can discard the previous cache cleanly.

## 7. Before merging

Run:

```bash
npm run check
```

A successful check confirms repository structure and active region/comparison data integrity. GitHub Actions repeats the same check automatically.

## 8. If a price edit appears to do nothing

Check these first:

1. You edited `data/<region>.js`, not a duplicate file.
2. The changed field is the price tier actually displayed by the App.
3. `config/countries.js` still points to the expected `dataFile`.
4. The commit reached the branch/deployment used by the live site.
5. The App's "更新價目" action was used if an installed PWA is already open.

Do not create a second copy of the file as a workaround.
