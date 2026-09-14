# Maintenance scripts

These scripts protect the repository from the file-layout problems that previously caused stale or ineffective updates.

- `validate-repo.mjs` — checks required runtime paths, compatibility entry points, and rejects known duplicate/stale locations.
- `validate-data.mjs` — evaluates region/config files, checks product identifiers, region registration and comparison-map references.

Use:

```bash
npm run check
```

The same command runs automatically in GitHub Actions on pull requests and pushes to `main`.
