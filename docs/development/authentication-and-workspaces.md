# Authentication and workspaces

[Back to the README](../../README.md)

## Portal sign-in

Export `CLERK_PUBLISHABLE_KEY` with your Clerk development instance's publishable key before running
`pnpm exec nx serve portal`. Enable sign-up in that instance to test account creation. The portal only needs the
publishable key; never supply a Clerk secret key to the browser build.

The portal deployment workflow reads the GitHub Actions repository variable `CLERK_PUBLISHABLE_KEY` for production
and `CLERK_DEVELOPMENT_PUBLISHABLE_KEY` for development. Configure each Clerk instance for its portal domain.
Without a key, guests can still run audits, browse audit history, and use trace tools.

## Workspace and project management

After sign-in, `/workspaces` opens the last selected workspace and project, or defaults to Public View.
Public View is available to everyone and links to the existing public audit and trace tools. Signed-in users can
create a workspace or review invitations from Public View or the workspace switcher.
A new workspace needs only a name; a project with the same name is created automatically and opens immediately. Switch
workspaces from the navigation drawer.
Workspace admins can upload, replace, or remove a workspace logo under Settings → General. The switcher shows
the workspace initial until a logo is added. Workspace settings also contain membership and invitation controls,
and project settings contain access grants.
Workspace admins manage projects and grant individual members access; admin access covers all workspace projects.
Invitations are visible in the recipient's account after signing in with their verified primary email. They expire
in seven days. Invitation emails are not sent.

Set both `CLERK_SECRET_KEY` and `CLERK_PUBLISHABLE_KEY` in the API environment, using the same Clerk application
as the portal. Both keys are available in [Clerk's API keys page](https://dashboard.clerk.com/~/api-keys). Set
`CLERK_AUTHORIZED_PARTIES` to
a comma-separated list of permitted portal origins (for example, `http://localhost:4200` in development). Keep the
secret in the ignored root `.env`, `apps/api/.env.local`, or your deployment's secret store. Nx loads the root
`.env` for local tasks; only the publishable key is included in the browser build. The secret is used by the server.
Without both keys, workspace management is unavailable while public tools
remain available.

Apply the additive account/workspace/project migration against the intended database with
`pnpm exec nx run api:migrate`, then restart the API with `pnpm exec nx serve api`. Workspace management requires a
Postgres `DATABASE_URL`, including in local development. Public audit
storage uses SQLite locally; it does not replace the workspace database. See the
[API configuration guide](../../apps/api/README.md). Applying a migration does not assign existing guest
audits to projects.

Run management checks with:

```bash
pnpm exec nx run-many -t build,test,lint,typecheck -p api,portal,platform-identity,workspace-domain,workspace-api-runtime
```

The workspace database tests apply the generated SQL to embedded Postgres through PGlite, without production
credentials. They cover invitation recipients and expiry, role isolation, project access, membership removal,
last-admin protection, and cascading deletion. Live multi-connection Postgres concurrency and signed-in browser
verification are separate checks.

See [CONTEXT.md](../../CONTEXT.md) and [ADR-0005](../adr/ADR-0005-workspaces-and-projects.md) for scope and permission
rules. Project-owned audits require current project access for history, definitions, results, reports, and progress.
Public View contains unowned audits, including existing historical runs. See
[ADR-0006](../adr/ADR-0006-project-audit-isolation.md) for isolation and deletion retention. Claiming, sharing,
and Cron Audits remain later stages of [#222](https://github.com/ChristopherPHolder/app-speed/issues/222).
