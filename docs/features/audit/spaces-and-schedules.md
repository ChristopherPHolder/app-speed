# Spaces, authentication, and recurring audits

Issue: [#222](https://github.com/ChristopherPHolder/app-speed/issues/222)

## Setup

Run `pnpm install` and `pnpm exec nx run api:migrate` against the intended database before starting the API.
The migration preserves existing templates, runs, and results. Existing unowned records retain URL viewing,
but have no claim credential and cannot be claimed merely by knowing a run ID. They do not appear in any
browser's history unless that browser created them with a browser credential.

Create a Clerk application and enable open sign-up and your chosen sign-in methods. Configure its allowed
origins, production domain, redirect URLs, and email delivery. Enable Organizations, allow signed-in users
to create organizations, retain the built-in `org:admin`/`org:member` roles, and require invitations for joining.
Disable verified-domain automatic invitations, suggestions, and membership requests. Use Clerk's organization
profile to invite members, change roles, and remove members. Clerk must prevent removing/demoting the final
administrator; verify that policy in the application dashboard before enabling organizations in production.
Use Clerk's normal account/organization deletion controls; do not create an alternate identity store.

Set server environment variables outside the repository:

| Variable                             | Purpose                                                                                                  |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| `CLERK_SECRET_KEY`                   | Clerk backend secret; API only.                                                                          |
| `CLERK_PUBLISHABLE_KEY`              | Matching public key, served by `/api/auth/config`; contains no secret.                                   |
| `CLERK_AUTHORIZED_PARTIES`           | Comma-separated exact portal origins; local default `http://localhost:4200`.                             |
| `RUNNER_API_TOKEN`                   | Independent high-entropy machine secret, identical on API and runner. Required for all runner endpoints. |
| `PERSONAL_ACTIVE_SCHEDULE_LIMIT`     | Positive integer; default 10.                                                                            |
| `ORGANIZATION_ACTIVE_SCHEDULE_LIMIT` | Positive integer; default 10.                                                                            |
| `DATABASE_URL`                       | Existing Postgres runtime connection.                                                                    |

The browser loads Clerk's SDK lazily after fetching its publishable configuration. No browser build embeds
backend secrets. With no Clerk configuration, guest manual audits remain available and account features are
unavailable. Serve portal and `/api` on the same origin (the existing development proxy does this). Clerk's
same-origin session cookie authenticates native EventSource and report navigation; ordinary requests also
attach the current session bearer token. Include Clerk Frontend API, SDK/UI asset hosts, frames and configured
sign-in providers in the deployment's portal CSP. Keep Clerk's production domains/keys separate from development.

Deploy through the existing Nx executor-backed targets. The API workflow forwards the four Clerk/runner values
from repository secrets, and the two limits from repository variables (default 10). The runner workflow forwards
`RUNNER_API_TOKEN` to its deployment executor. Add these secrets before rollout. Configure the environment injection in the deployment
secret store/container environment, including `RUNNER_API_TOKEN` on both processes. Never use a Clerk session
as runner credentials. The local runner inherits the API environment; EC2 runners require their own matching
machine token and API base URL. Rotate the token on both sides together.

## Access and credentials

Reusable identity lives in `libs/platform/auth-api` and `libs/platform/auth-portal`. The API verifies Clerk token
signatures and authorized parties, checks the live session, and obtains current membership from Clerk rather
than trusting browser-selected organization IDs or cached role claims. A personal space is `personal:<userId>`;
an organization space is `org:<organizationId>`. Personal spaces are materialized on first authenticated API use.

Templates own runs, snapshots, results and schedules transitively. API history filters by the verified active
space before pagination. Organization visibility permits reading/running all definitions; mutation requires the
creator or an administrator. Schedule mutation uses the schedule's manager, independently from the definition's
creator. Admin reassignment requires the new manager to be a current contributor to the same space.

Guest history uses a random browser credential in local storage, sent as `x-guest-browser`; its SHA-256 hash is
persisted. Guest creation returns a separate random claim credential, stored per run by that browser. A claim
requires both browser and claim credentials plus verified destination-space access. Space and template locks
ensure one claimant wins; claiming clears both guest hashes and switches every run to private space access.
Legacy URL viewers cannot claim legacy records. Clearing local storage loses browser history/claim authority.

Public links use independent random tokens stored only as hashes. A token grants result/report access for one
run, never definition/history/SSE, mutation, membership or later runs. Revocation is checked on each request.
Private report responses are not cached and carry a restrictive sandbox CSP. Reports are self-contained HTML
and data URLs; no unauthenticated record-storage route is exposed. The public viewer uses the same responsive result
components as private runs and passes the share token only to the selected run's result endpoint.
Already-downloaded content cannot be recalled. API authorization re-runs during SSE polling, including session,
space existence and membership checks, so long-lived streams do not retain removed members' access.

A deleted Clerk user/organization immediately fails subsequent read/share authorization. On the next due tick,
the dispatcher durably marks its space deleted, stops future scheduling and revokes stored shares. Surviving
organization schedules do not check their departed creator's session or membership.

## Saved versions and dispatch

Saved versions append immutable definition snapshots. Editing creates another version; running, pinning or
repinning always selects a version explicitly. Foreign keys prevent destruction of referenced versions.
Unversioned legacy runs use their original persisted definition. New manual and recurring runs have version IDs;
both browser reads and runner claims resolve that snapshot. Soft deletion retains runs, versions and occurrences.

`SCHEDULED` still means queued. A recurring schedule is a separate durable record. Interval presets are 5/15/30
minutes and 1/6/12 hours. Their first run is one interval after activation, measured in elapsed time. Daily and
weekly rules store an IANA timezone and HH:mm local time (weekday 1=Monday through 7=Sunday). Calendar rules
follow wall time: nonexistent times are skipped and ambiguous times use the first occurrence exactly once.
Pausing/deleting prevents future dispatch, preserving existing work and history. Resume or recurrence edits
establish a new future cadence. Updating only the pinned version or manager preserves the next due instant.

Every API instance polls once per second. Dispatch and management lock the same owning-space row before schedule
rows, serializing duplicate ticks, pause/delete/edit and create/resume quota checks. The occurrence, normal queued
run and next due instant commit together; `(schedule_id, due_at)` is unique. The existing global FIFO runner path
is unchanged. Activation is retried from durable queue presence after a crash or activation failure.

A previous queued or running run from the same schedule causes an overlap skip, including a stuck run (#218).
Failures stay in normal result history and neither retry nor disable the schedule. An occurrence more than five
seconds late is classified as missed (the dispatch poll tolerance). Downtime creates a summary range/count and
advances strictly into the future; it never enqueues catch-up runs. Histories are read from persisted occurrences
joined to run/result state, including failure reasons. Paused schedules do not consume the active quota.

## Verification

Use Nx throughout:

```sh
pnpm exec nx run-many -t typecheck --projects=api,portal,runner
pnpm exec nx affected -t lint
pnpm exec nx affected -t test
pnpm exec nx run-many -t build --projects=api,portal,runner
APP_SPEED_TEST_DATABASE_URL=postgres://... pnpm exec nx run api:integration
APP_SPEED_TEST_DATABASE_URL=postgres://... pnpm exec nx run portal-e2e:e2e
```

`recurrence.spec.ts` tests interval anchors, weekday selection and DST transitions. The migrated PostgreSQL
integration suite drives real HTTP handlers with an injected verified-identity service; it tests direct-ID
isolation, membership changes, claim races, run-scoped shares, dispatcher races, overlap/downtime, version pins,
pause/resume/recurrence edits, quotas and deleted spaces. It never adds a test bypass to production authentication.
The real browser/runner journey verifies guest creation, browser-scoped history, SSE and persisted results.

Live Clerk sign-up/invitation/session flows require a configured Clerk instance and interactive test identities.
Validate sign-up, sign-in/out, organization creation/invitations, final-admin protection, role changes, member
removal and deletion against that instance before rollout. Local test identities are confined to the test layer.

Guest saved-audit page (real browser journey):

![Guest saved audits](../../screenshots/saved-audits-guest.png)
