# @app-speed/audit/persistence

Audit persistence library.

This library owns:
- SQLite client wiring
- migrations
- audit template, run, and result persistence
- queue and run-history queries exposed through `AuditRepo`

Build with:

```bash
pnpm exec nx run audit-persistence:build
```

Test with:

```bash
pnpm exec nx run audit-persistence:test
```
