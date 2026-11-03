# Desktop and mobile journey screenshots

Run the complete local application journey at desktop (1440 × 1000) and mobile (390 × 844) viewport sizes:

```bash
APP_SPEED_TEST_DATABASE_URL=postgres://postgres:postgres@localhost:5432/postgres \
  pnpm exec nx run portal-e2e:capture-journeys
```

The PostgreSQL connection must allow creating and dropping a temporary database. The Nx executor builds the
applications, creates and migrates an isolated database, serves an HTTPS checkout fixture, starts the API and real
audit runner, runs Cypress, and cleans up its processes and database. Ports 3000, 4420, and 4444 must be available.
Chromium is supplied by the workspace's Puppeteer installation.

Screenshots are written to `dist/cypress/apps/portal-e2e/screenshots/user-journeys.cy.ts/{desktop,mobile}`. Each
filename identifies its journey step. The navigation-menu step is mobile-only. Full-page captures temporarily make
the sticky header and editor static to avoid repeating it during screenshot stitching. Every capture asserts that the page fits
the viewport horizontally and that the exported PNG retains the requested viewport width. The capture browser window
is large enough to accommodate the desktop viewport alongside the Cypress controls.

## Coverage

- Guest: build, queue, execute, inspect results, browse history, and reopen a run.
- Personal space: empty-state onboarding, workspace settings, sign in, claim a browser audit, save immutable versions, edit a definition, and explicitly repin a
  schedule to its new version.
- Recurrence: fixed intervals, daily times and IANA timezones, weekly weekdays, next due times, pause/resume, and the
  active schedule limit and quota-reached editor.
- Occurrences: successful and failed runs, overlaps, downtime skips, and retained history after schedule deletion.
- Sharing: create a result link, view it anonymously, revoke it, and verify that public access stops.
- Organization: administrator and member views, execute a saved version, reassign a schedule, and manage it as the
  assigned member.

## Demo identities and data

Only the explicit `screenshots` API and portal build configurations use demo authentication. Production entry points
continue to use Clerk. The portal capture entry refuses non-local hosts; the API requires `APP_SPEED_DEMO_CAPTURE`.
Fixture mutation tasks also require a temporary database name created by the orchestration executor.

Alex Morgan (`user_demo_admin`) owns a personal space and administers Acme Performance (`demo_team`). Sam Rivera
(`user_demo_member`) is an organization member. Signing in uses the demo identity directly. These identities exercise
the real Angular UI, management endpoints, permissions, PostgreSQL persistence, audit runner, and public reports.

Successful audit results come from actual runner executions against the checkout fixture. Failure, overlap, and
downtime history are seeded examples; the completed runs are linked to those demo schedules for review. Organization
resources are initialized through the real management API. The capture deployment sets its active schedule limit to
two to make quota behavior easy to inspect.

Clerk-hosted sign-in, registration, organization creation, and membership/invitation dialogs require a live Clerk
development instance and are outside these demo captures. The demo does not substitute imitation dialogs for them.
