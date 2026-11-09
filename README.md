<h1 align="center">AppSpeed - Web Application Performance Insight</h1>
<h3 align="center">Go beyond initial load. Measure the performance users actually experience.</h3>
<p align="center">
    <img src="apps/portal/src/assets/logo.svg" alt="AppSpeed logo" width="400" />
</p>

## Current Architecture

- `apps/portal`: thin Angular application shell and route composition.
- `apps/api`: Effect-based API control plane.
- `apps/runner`: thin runner entrypoint and deployment target.
- `libs/audit/**`: audit domain code shared across portal, API, runner, contracts, model, and persistence.
- `libs/platform/**`: cross-cutting platform services such as observability.
- `libs/ui/**`: reusable web UI primitives.

## Integration and browser tests

The API integration suite and full local browser journey are independently runnable Nx targets. See
[docs/testing/integration-and-e2e.md](docs/testing/integration-and-e2e.md) for prerequisites, artifacts, and
troubleshooting.

## Effect diagnostics (per Nx project)

Effect diagnostics run through the official `@effect/tsgo` Oxlint integration. `@nx/oxlint` infers the
`effect:diagnostics` target for projects with a `.oxlintrc.json`. ESLint continues to run through `lint`.

`pnpm install` patches Oxlint and its type-aware engine through the `prepare` script. The pinned Oxlint,
`oxlint-tsgolint`, and `@effect/tsgo` versions must remain compatible; update them together using the
[Effect compatibility table](https://github.com/Effect-TS/tsgo#supported-package-versions).
Only Oxlint is patched; Angular keeps using TypeScript 6. The shared TypeScript config uses relative
path aliases without `baseUrl` and enables `esModuleInterop` so both compilers can read it.

The shared `oxlint.effect.json` enables the recommended Effect rules and disables Oxlint’s default
correctness category so this target stays focused on Effect. Errors fail the target; warnings are reported
without failing it. Use `--deny-warnings` to also fail on warnings. Nx caches results including dependency
sources and all three integration packages.

Run diagnostics for a single library:

```bash
pnpm exec nx run <project-name>:effect:diagnostics
```

Example:

```bash
pnpm exec nx run platform-observability:effect:diagnostics
```

Emit JSON (the previous custom `--outputFile` and `--severity` flags have been removed):

```bash
pnpm exec nx run platform-observability:effect:diagnostics --format=json
```

Run diagnostics for multiple libraries:

```bash
pnpm exec nx run-many -t effect:diagnostics --projects=platform-observability,audit-core-persistence,audit-core-runner --parallel=3
```

## Angular Publishable Libraries

For publishable Angular libraries with secondary entry points, keep the root package name, `tsconfig.base.json` aliases, and consumer imports in the same canonical form.

Reference:

- [docs/conventions/angular-secondary-entry-points.md](docs/conventions/angular-secondary-entry-points.md)

### Portal sign-in

Export `CLERK_PUBLISHABLE_KEY` with your Clerk development instance's publishable key before running
`pnpm exec nx serve portal`. Enable sign-up in that instance to test account creation. The portal only needs the
publishable key; never supply a Clerk secret key to the browser build.

The portal deployment workflow reads the GitHub Actions repository variable `CLERK_PUBLISHABLE_KEY` for production
and `CLERK_DEVELOPMENT_PUBLISHABLE_KEY` for development. Configure each Clerk instance for its portal domain.
Without a key, guests can still run audits, browse audit history, and use trace tools.

### Workspace and project management

After sign-in, `/workspaces` opens the last selected workspace and project, or defaults to Public View.
Public View is available to everyone and links to the existing public audit and trace tools. Signed-in users can
create a workspace or review invitations from Public View or the workspace switcher.
A new workspace needs only a name; a project with the same name is created automatically and opens immediately. Switch workspaces from the navigation drawer.
Workspace admins can upload, replace, or remove a workspace logo under Settings → General. The switcher shows
the workspace initial until a logo is added. Workspace settings also contain membership and invitation controls,
and project settings contain access grants.
Workspace admins manage projects and grant individual members access; admin access covers all workspace projects.
Invitations are visible in the recipient's account after signing in with their verified primary email. They expire
in seven days. This slice does not send invitation emails.

Set both `CLERK_SECRET_KEY` and `CLERK_PUBLISHABLE_KEY` in the API environment, using the same Clerk application
as the portal. Both keys are available in [Clerk's API keys page](https://dashboard.clerk.com/~/api-keys). Set `CLERK_AUTHORIZED_PARTIES` to
a comma-separated list of permitted portal origins (for example, `http://localhost:4200` in development). Keep the
secret in the ignored root `.env`, `apps/api/.env.local`, or your deployment's secret store. Nx loads the root
`.env` for local tasks; only the publishable key is included in the browser build. The secret is used by the server. Without both keys, workspace management is unavailable while public tools
remain available.

Apply the additive account/workspace/project migration against the intended database with
`pnpm exec nx run api:migrate`, then restart the API with `pnpm exec nx serve api`. The API also needs its existing
`DATABASE_URL` configuration. Applying a migration does not assign existing guest audits to projects.

Run management checks with:

```bash
pnpm exec nx run-many -t build,test,lint,typecheck -p api,portal,platform-identity,workspace-domain,workspace-api-runtime
```

The workspace database tests apply the generated SQL to embedded Postgres through PGlite, without production
credentials. They cover invitation recipients and expiry, role isolation, project access, membership removal,
last-admin protection, and cascading deletion. Live multi-connection Postgres concurrency and signed-in browser
verification are separate checks.

See [CONTEXT.md](CONTEXT.md) and [ADR-0005](docs/adr/ADR-0005-workspaces-and-projects.md) for scope and permission
rules. Existing audit tools are still separate from projects; project audit ownership and Cron Audits follow in
later slices of [#222](https://github.com/ChristopherPHolder/app-speed/issues/222).
