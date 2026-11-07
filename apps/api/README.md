# API App

Control plane API for scheduling audits, reporting status, and orchestrating runner lifecycle.

## Run

```bash
pnpm exec nx serve api
```

## Runtime Configuration

The API resolves runtime config through Effect `Config` in:

- `src/Config/config.ts`
- `@app-speed/audit/core/persistence`

Runtime env vars:

- `DATABASE_URL` (required in production): Postgres connection string for audit persistence.
- `RUNNER_MANAGER_MODE` (optional): `local`, `manual`, or `aws` (default is hardcoded to `aws`). `manual` is
  reserved for boundary-driven integration tests and does not launch a runner.
- `DEVTOOLS_URL` (optional)

Database migrations are run through the `api:migrate` Nx target. Set `DATABASE_MIGRATION_URL` when
the migration/admin connection string differs from `DATABASE_URL`.

### Local Mode

- The API uses `LocalRunnerManager` and starts a local runner process using Nx.

### AWS Mode

AWS runner settings are hardcoded in `src/Runner/AwsRunnerManager.ts` for now:

- region: `eu-central-1`
- instance ids: `i-049287bf43503d01e`
- start wait timeout: `600000`
- stop wait timeout: `600000`

Behavior:

- `ensureRunnerActive` starts the first configured EC2 instance if none are `pending` or `running`.
- `listActiveRunners` returns active EC2-backed runners.
- `terminateRunner` stops a managed EC2 instance by id.

### DevTools

- `DEVTOOLS_URL` (optional): enables Effect DevTools layer when set.

## Examples

Local development:

```bash
RUNNER_MANAGER_MODE=local
```

AWS production:

```bash
RUNNER_MANAGER_MODE=aws
```

## Storage environments

Local startup defaults to SQLite at `.data/app-speed.sqlite`. Set `SQLITE_PATH` to an absolute or relative local
filesystem path to choose another durable database. All audit metadata, user-flow definitions, JSON results and
HTML reports live in that file. No database URL, S3 bucket or AWS credentials are required for persistence.
Schema initialization is automatic on startup and can also be run with `pnpm exec nx run api:migrate`.

`APP_ENV=production` selects the existing Postgres and configured record persistence backend. When `APP_ENV` is
unset, `NODE_ENV=production` retains the existing production behavior. Explicit `APP_ENV=development`, `test`,
or `staging`/`preview` selects SQLite even in a production-built image. Production deployments
pin `APP_ENV=production`, S3 mode and the existing bucket. Development deployments pin `APP_ENV=development`
and mount the named Docker volume `app-speed-api-development` at `/data`.

Do not share a SQLite file over a network filesystem. Keep it on durable local storage and back up the file with
SQLite-aware backup tooling. SQLite is intended for a single-host non-production stack; production continues to
use Postgres queue locking. Existing external non-production data is retained and is not automatically imported.
Rollback uses the previous application revision; keep SQLite files for recovery. Production schemas and object
keys are unchanged.

Development deployments listen on host port 3001 in `app-speed-api-development`, leaving the production container
and port 3000 intact. `api:studio` and `api:migrate-generate` select SQLite configuration outside production.

Development deployment uses manual runner management; connect a runner explicitly to its API on port 3001.
