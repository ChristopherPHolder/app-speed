# Workspace and authentication browser tests

## Repeatable workspace journeys

Run `pnpm exec nx run portal-e2e:e2e`. The existing Nx executor builds and starts the API, portal, audit runner, and HTTPS audit fixture, and removes the isolated database directories afterward. The fixed-identity and live-Clerk API builds use separate output directories. Optional `--apiPort`, `--portalPort`, and `--fixturePort` arguments avoid collisions with development servers.

The workspace journeys run on desktop and mobile. They exercise the real HTTP endpoints and production workspace permission handlers against PGlite using the checked-in Postgres migrations. They do not intercept workspace responses. Test identities are provided by separate API and portal entry points; these are never imported by the normal production entry points. The existing real Lighthouse execution journey runs alongside them.

Coverage includes workspace creation and its default project, reload persistence, project creation/rename/deletion, workspace switching and remembered projects, anonymous/signed-in Public View, sign-out, invitations and recipient isolation, project grants/revocation, direct URL/API authorization, logos, last-admin protection, invitation decline/revocation, admin transfer, leaving a workspace, and recovery when a successful creation is followed by a failed overview reload. That last test injects one 503 response; all mutations still reach the real API and the test asserts that only one workspace was created. Fixture cleanup covers every test identity before each journey.

PGlite is a real embedded Postgres implementation, but does not replace a multi-connection production Postgres concurrency check. Audit data uses isolated SQLite storage as before.

## Visual comparisons

Screenshots are taken only after fonts, loading indicators, and Material overlay lifecycle states settle (dialogs fully open and closing menus detached), with animations and caret rendering disabled. Test builds bundle fonts. Every capture asserts there is no horizontal overflow. Invitation expiry text is blacked out because it changes daily.

Normal runs compare with committed PNG baselines in `docs/screenshots/workspace-journeys/baselines/<platform>` (`darwin` or `linux`). Baselines from another operating system are never used as a fallback. Missing baselines, changed dimensions, or a pixel difference above 0.5% fail the run. Pixelmatch excludes antialiasing differences and uses a per-pixel threshold of 0.1. Unit tests verify that visual regressions fail and write a diff.

To update intentionally, run:

```sh
pnpm exec nx run portal-e2e:e2e --configuration=update-snapshots
```

Review every changed PNG before committing it. Never run the update configuration as the CI check. The pinned Puppeteer Chrome is used locally and in CI. Each operating system has its own reviewed baseline set because native font rasterization differs. To capture Linux baselines, dispatch the CI workflow on the branch with `capture_visual_baselines=true`, download the `linux-visual-baselines` artifact, review its images, and commit them under `baselines/linux`. Normal PR checks always compare; they never update snapshots.

The CI `e2e-diagnostics` artifact is uploaded on successful and failed runs. It includes actual screenshots, visual diff PNGs on mismatch, an HTML gallery, videos, and application logs. Open `artifacts/workspace-visuals/index.html` after extracting the artifact. The committed screenshot index is `docs/screenshots/workspace-journeys/README.md` and is also linked from the PR.

## Live Clerk session

Run `pnpm exec nx run portal-e2e:e2e-clerk` with development `CLERK_SECRET_KEY` and `CLERK_PUBLISHABLE_KEY` from the same Clerk instance. Production keys are rejected before starting the test stack. Configure email-code support for test users in this development instance and the portal origin used by the run. Email-code authentication is used only by Clerk's test helper; the product UI offers Google and GitHub.

This suite uses the real portal auth service and server identity verifier. Only workspace storage is replaced with an isolated database. Clerk's official test helper authenticates a temporary account through its SDK, without driving an external Google/GitHub account or replacing the app's auth service. The account is removed after the run, including on failure. The suite checks provider choices, active session requirements, server-authenticated onboarding, persistence after reload, sign-out, and anonymous rejection. Live screenshots are diagnostic images because the SDK state and temporary account identifiers vary.

The `Live Clerk E2E` workflow can be dispatched once the repository has `CLERK_E2E_SECRET_KEY` (secret) and `CLERK_E2E_PUBLISHABLE_KEY` (variable) from a dedicated development instance. Missing credentials fail explicitly. Screenshots and logs are uploaded as `clerk-e2e-evidence`.

Unit tests cover Google/GitHub redirect arguments for sign-in and sign-up, callback dispatch, retry after provider errors, and required profile completion. Actual OAuth consent, new-account creation, and existing-account sign-in with each provider must also be checked on the production domain. See the [production release guide](../deployment/initial-auth-production.md).

Clerk session tasks must match the product's custom flow. App Speed owns workspace membership; requiring a Clerk Organization before activating a session is incompatible with this flow.
