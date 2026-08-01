# Integration and end-to-end tests

The repository has two uncached, independently runnable system-test targets:

```shell
pnpm exec nx run api:integration
pnpm exec nx run portal-e2e:e2e
```

`api:integration` starts a production API build against an isolated migrated database. It drives real HTTP and
PostgreSQL boundaries in `RUNNER_MANAGER_MODE=manual`, so it does not execute queued audits.

`portal-e2e:e2e` builds the production API, portal, and runner, then starts the complete local stack. Its single
Cypress journey submits an audit in the real Angular UI, follows SSE progress, lets the local runner execute
Puppeteer and Lighthouse against the repository-owned HTTPS fixture, renders the persisted result, and reopens it
from history. No response is stubbed or changed.

## Prerequisite

Provide a PostgreSQL connection whose user can create and drop temporary databases:

```shell
export APP_SPEED_TEST_DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5432/postgres
```

PostgreSQL is the only local infrastructure prerequisite. Each target creates a uniquely named database, invokes
the existing `api:migrate` Nx target, terminates remaining connections, and drops the database during teardown.

The browser target uses fixed loopback ports:

- API: `3000`
- production portal: `4200`
- deterministic HTTPS fixture: `4443`

It fails before startup with the conflicting port number if any port is occupied.

## Browser and timing behavior

The browser journey is headless and has a five-minute timeout. The executor uses Puppeteer's installed Chrome for
both Cypress and the runner. It creates a self-signed fixture certificate for each run, trusts only that
certificate's SPKI in those two test browser processes, and removes the certificate and private key during teardown.

Dependency readiness uses bounded polling; failed tests are not retried. A local run may spend additional time in
the production builds before the five-minute browser budget begins.

## Diagnostics

Service logs are overwritten at the start of each target and retained after it exits:

```text
artifacts/test-orchestration/integration/api.log
artifacts/test-orchestration/e2e/api.log
artifacts/test-orchestration/e2e/runner.log
artifacts/test-orchestration/e2e/portal.log
artifacts/test-orchestration/e2e/fixture.log
```

Cypress writes screenshots and video under `dist/cypress/apps/portal-e2e/screenshots/` and
`dist/cypress/apps/portal-e2e/videos/`. CI uploads these paths and the service logs on failure with seven-day
retention.

## Troubleshooting

- `APP_SPEED_TEST_DATABASE_URL is required`: export the connection variable before invoking Nx.
- `permission denied to create database`: use a local PostgreSQL role with `CREATEDB` and permission to terminate
  connections to databases it owns.
- `Port ... is already in use`: stop the named local service; the target deliberately does not reuse existing
  processes.
- Browser artifacts missing: run `pnpm exec cypress install` and `pnpm exec puppeteer browsers install chrome`.
- Runner failures: inspect `runner.log` first, then `api.log` for claim or completion errors.

Both targets own their application processes and clean up the complete process group, database, and temporary
certificate material on success, failure, signal-driven shutdown, or timeout.
