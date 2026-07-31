# @app-speed/audit/core/persistence

Audit persistence library.

This library owns:

- Postgres client wiring
- shared audit schema and Postgres client wiring
- audit run and result persistence contracts
- queue and run-history queries exposed through `AuditRepo`

## Environment

Runtime persistence requires:

```bash
DATABASE_URL=postgres://user:password@host:5432/database
```

Migration commands use `DATABASE_MIGRATION_URL` when it is set, otherwise they use `DATABASE_URL`.
Use `DATABASE_MIGRATION_URL` for direct/admin Supabase connections when pooled runtime URLs are not suitable for DDL.

Build with:

```bash
pnpm exec nx run audit-core-persistence:build
```

Test with:

```bash
pnpm exec nx run audit-core-persistence:test
```

Generate a migration after schema changes with:

```bash
pnpm exec nx run api:migrate-generate
```

Apply migrations with:

```bash
DATABASE_MIGRATION_URL=postgres://user:password@host:5432/database pnpm exec nx run api:migrate
```
