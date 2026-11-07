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

## Non-production

The API selects SQLite for development, tests, staging and preview via `APP_ENV`. See `apps/api/README.md` for
selection rules and durable storage. The Postgres repositories and schemas in this library remain production-only;
SQLite implementations satisfy the same repository service contracts. SQLite payload records and audit metadata
share one database; successful completion commits payloads and metadata together.

SQLite starts at schema version 1. Startup initializes fresh files transactionally and rejects newer unsupported
versions. `api:migrate-generate` produces reviewable SQLite SQL, but those generated files are not automatically
applied by startup or `api:migrate`. Future schema changes must add an ordered, transactional version upgrade to
`sqlite-db.ts` and test it against an existing file before deploying; do not edit version 1 initialization alone.
