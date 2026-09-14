# Application source

`src/` contains the canonical implementation source used by the root compatibility entry files.

- `app.js` — active application logic.
- `styles/app.css` — active application stylesheet.

The root `app.js` and `styles.css` are intentionally tiny compatibility entry points so old URLs and the existing `index.html` references remain stable.

## Maintenance rule

Do not create another copy of `app.js` under `data/`, the repository root, or a nested folder. New application logic belongs under `src/`.

The current runtime remains buildless (plain browser JavaScript) so Vercel/static hosting does not require a compilation step. Repository validation is handled by the scripts under `scripts/`.
