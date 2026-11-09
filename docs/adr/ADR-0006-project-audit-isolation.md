# ADR-0006: Project audit isolation

Status: Accepted
Date: 2026-11-09

## Decision

Audit runs have nullable `project_id` ownership in both Postgres and SQLite. A null owner means Public View.
Existing runs retain null ownership; historical ownership cannot be inferred reliably from URLs or titles.
Scheduling a project audit persists the authorized project ID in the same transaction as its definition and run.

Audit HTTP requests select a project with `x-project-id` and authenticate with a Clerk bearer session. The server
checks current workspace membership and either workspace admin role or an explicit project grant. A project ID
is a filter, never proof of access. No project header means Public View, even for authenticated accounts.

Global and kind-specific history filter ownership before search, status/outcome filters, and cursor pagination.
Definitions, results, HTML reports, and SSE require an exact match between the requested scope and stored owner.
An audit ID alone cannot access a project audit. SSE checks authorization again before each snapshot.
API responses use `Cache-Control: no-store` so cached responses cannot bypass current permissions.

Portal audit URLs retain `projectId` as a query parameter through creation, history, viewing, and forking. Opening
such a URL restores its workspace/project from the authorized overview. Public URLs carry no project scope.
Changing project scope destroys mounted route components so old results, history cursors, and subscriptions do
not survive the switch. Angular HTTP requests attach the selected project and a current session token. Project
progress polls through that authenticated HTTP client because native EventSource cannot send bearer headers;
public audits retain the existing SSE experience.

## Deletion and retention

Audit ownership deliberately survives project/workspace deletion. There is no cascading foreign key or
`ON DELETE SET NULL`: either would destroy history or turn private records into public records. This also
supports development, where audit storage is SQLite while workspace management uses Postgres. A deleted
project's runs remain stored and unavailable through portal audit APIs because authorization requires a live
project and membership. The runner may finish already queued work; deletion does not cancel execution.

## Scope

This completes the audit isolation follow-up to ADR-0005 and issue #238. Guest claiming, sharing, recurrence,
archival/recovery UI, and cancellation on project deletion remain separate work under #222. The runner control plane processes a shared queue and requires a separate bearer credential on claim, completion,
heartbeat, and shutdown. This prevents ordinary accounts or anonymous callers from obtaining private definitions
through the worker protocol. Local API-spawned runners receive an ephemeral credential; remote runners and APIs
must configure matching `RUNNER_API_TOKEN` values. An absent remote credential denies runner requests.

## Rollout

Apply the Postgres migration before deploying the API. SQLite upgrades automatically from schema version 1 to 2;
existing audit runs stay public. Configure GitHub secrets `RUNNER_API_TOKEN` (production) and
`RUNNER_DEVELOPMENT_API_TOKEN` (development) with separate random credentials. The existing Nx deploy targets
pass each environment's credential to both API and runner. Deploy both images together: old runners do not send
the new bearer header, and will receive 403 responses from the updated API. No secret values belong in source.

Production recovery retries must also use Nx targets:

```shell
pnpm exec nx run aws-deploy:workflow-rerun --runId=<api-workflow-run-id>
pnpm exec nx run aws-deploy:workflow-rerun --runId=<runner-workflow-run-id> --failedOnly
```

Retry both API and runner after provisioning a previously missing credential. A successful API container deployment
alone does not prove worker authentication is configured. The API authentication preflight requires a nonempty
runner credential before migrations or publishing, and Docker environment passthrough rejects blank values.

API and runner image tags include the workflow run ID and attempt so retries do not overwrite immutable ECR tags.
Dispatch a fresh deployment from an explicit ref with:

```shell
pnpm exec nx run aws-deploy:workflow-dispatch --workflow=deploy-api.yml --ref=<git-ref> --environment=production
```

Runner deployment cleanup stops an instance only when that deployment started it. A previously running worker
remains under the API lifecycle's control. The runner workflow step allows 55 minutes for the executor's bounded
30-minute startup, 10-minute SSM command, and 10-minute stop phases, so Actions does not kill cleanup prematurely.

An empty queue at API startup does not itself authorize stopping an externally started worker. Lifecycle
reconciliation consumes explicit idle/shutdown requests once. Newly discovered workers retain the existing idle
grace period, preventing the API from powering off an instance just as deployment sends its SSM command.
