# Regional data

This folder contains the **only active product/price files**.

- `hong-kong.js` — Hong Kong
- `taiwan.js` — Taiwan
- `japan.js` — Japan
- `thailand.js` — Thailand

## Rule

A regional price change must be made only in that region's file. Do not copy these files to the repository root and do not create nested `data/data/` folders.

Each file registers its data under `window.HBL_COUNTRY_DATA.<regionCode>` and must keep product `stock_no` values unique within that region.

Run `npm run check:data` after editing prices or product mappings.
