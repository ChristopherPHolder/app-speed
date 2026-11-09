# Initial auth production release

The first release offers Google and GitHub through Clerk. It does not offer email-code or password forms.
App Speed manages its own workspaces, memberships, and project grants; Clerk Organizations are not required.
Workspace creation also creates a same-named first project.

## Clerk production instance

Use a production instance for `appspeed.dev`, with its own live publishable and secret keys. Development keys
are rejected by the deployment preflight. Configure and verify the DNS records and certificates requested by
Clerk before deploying the portal.

Enable Google and GitHub as social connections. Both require custom production OAuth credentials:

- [Google setup](https://clerk.com/docs/guides/configure/auth-strategies/social-connections/google): create the
  OAuth client in Google Cloud, copy the redirect URI shown by Clerk, enter the client credentials in Clerk,
  and publish the consent screen for the intended audience.
- [GitHub setup](https://clerk.com/docs/guides/configure/auth-strategies/social-connections/github): register an
  OAuth application for production, use Clerk's callback URL, and enter its client credentials in Clerk.

The provider callback URL is the one shown by Clerk. The application's callback is
`https://appspeed.dev/auth/callback`; add the application's production redirect URLs to Clerk's allowlist.
Configure sign-in and sign-up URLs as `/sign-in` and `/sign-up`, with completion at `/workspaces`.

Allow personal accounts and do not require selecting a Clerk Organization. Do not enable mandatory session
tasks or authentication factors that the custom UI cannot complete. Accounts must have a verified primary
email to use workspace APIs. Optional profile completion supports username, first name, and last name.

See [Clerk's production deployment guide](https://clerk.com/docs/guides/development/deployment/production)
for the instance's DNS, redirect, and provider requirements.

## GitHub configuration

Configure these repository settings before merging, because `main` triggers deployment:

| Setting                  | Type     | Production value                                        |
| ------------------------ | -------- | ------------------------------------------------------- |
| `CLERK_SECRET_KEY`       | Secret   | `sk_live_…` from the production instance                |
| `CLERK_PUBLISHABLE_KEY`  | Variable | `pk_live_…` from the same instance                      |
| `DATABASE_URL`           | Secret   | Runtime Postgres connection with workspace table access |
| `DATABASE_MIGRATION_URL` | Secret   | Postgres connection with migration permissions          |

Both workflows use the same publishable-key variable. The API also receives the server secret and
`CLERK_AUTHORIZED_PARTIES=https://appspeed.dev`; the secret is never compiled into the portal.

For the development deployment, use `CLERK_DEVELOPMENT_SECRET_KEY` (secret),
`CLERK_DEVELOPMENT_PUBLISHABLE_KEY` (variable), `DATABASE_DEVELOPMENT_URL` (secret), and
`DATABASE_DEVELOPMENT_MIGRATION_URL` (secret). Development audit storage remains SQLite; workspace management
requires a separate migrated Postgres database. Never point development at the production workspace database.
The development API uses `https://dev.appspeed.dev` as its authorized party.

## Validation and release

With the deployment environment configured, these read-only checks reject missing keys, the wrong Clerk
environment, the wrong portal origin, and a missing or invalid Postgres URL:

```sh
pnpm exec nx run api:auth-preflight --configuration=production
pnpm exec nx run portal:auth-preflight --configuration=production
```

These checks validate configuration shape; they do not prove that keys belong to the same instance, that
OAuth credentials work, or that DNS is ready. Verify those in Clerk and through the release smoke test.
Deployment workflows run the checks before migrations or publishing, and deployment targets depend on them.
Application migrations run through `api:migrate` before starting the new API container, including the
workspace/project and logo/access-control migrations.

Before merging, require passing PR checks and reviewed desktop/mobile visual baselines. Run the live Clerk
session suite using a development instance as described in [workspace E2E testing](../testing/workspace-e2e.md).
Its SDK test helper verifies real session and API authorization; it does not exercise Google or GitHub's
external consent screens.

After deploying to the production domain, complete this smoke test with both providers:

Ensure fresh requests to `/sign-in`, `/sign-up`, `/auth/callback`, and `/workspaces/join` return the portal
application shell with HTTP 200. Configure the hosting SPA fallback for frontend routes without rewriting
`/api` responses or missing static assets. Loading the shell with an HTTP 404 is not a passing routing check.

1. Create a new account and sign in to an existing account; verify any required profile fields and callback.
2. Create a workspace and confirm that its same-named first project opens. Reload and verify persistence.
3. Create another project; invite a second account, accept the invitation, and grant/revoke project access.
4. Verify that another account cannot open private workspace/project URLs or call their APIs.
5. Switch to Public View, sign out, and verify that workspace APIs return 401 for an anonymous request.

Do not treat a successful build or the development session test as production OAuth evidence. Record both
provider results for the deployed commit before declaring the auth release ready.

## Release boundary

This release adds authenticated workspace/project management. Existing audit history and audit URLs remain
public; audits are not yet owned by projects. Invitations appear after the recipient signs in with the matching
verified primary email; creating an invitation does not send email. Project audit ownership and invitation
email delivery are later features.
