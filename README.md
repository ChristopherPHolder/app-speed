<h1 align="center">AppSpeed - Web Application Performance Insight</h1>
<h3 align="center">Go beyond initial load. Measure the performance users actually experience.</h3>
<p align="center">
    <img src="apps/portal/src/assets/logo.svg" alt="AppSpeed logo" width="400" />
</p>

AppSpeed is a web performance toolkit for running repeatable Lighthouse user-flow audits, reviewing audit
history, and turning Chrome traces into screenshots and filmstrips. The Angular portal, Effect-based API,
and browser runner live together in this Nx monorepo.

[**Try AppSpeed →**](https://appspeed.dev) · [Run locally](#run-locally) · [Repository layout](#repository-layout) ·
[Contribute](CONTRIBUTING.md) · [Report a bug](https://github.com/ChristopherPHolder/app-speed/issues)

## What you can do

- Build user-flow audits from browser steps and follow their progress through to Lighthouse results and reports.
- Review scheduled, running, and completed audits in history.
- Extract screenshots and create filmstrips from Chrome traces locally in the browser.
- Sign in to organize audits into projects within workspaces, with membership and project access controls.

Public View provides audit and trace tools without signing in. Project-owned audits require access to their project.

## Run locally

Use Node.js 24 (CI pins `24.14.0`), pnpm `10.11.0` as specified in `package.json`, and Git.
Run these commands from the repository root.

1. Install dependencies:

   ```bash
   pnpm install
   ```

   The install step also configures Git hooks, patches Oxlint for Effect diagnostics, and clones the Effect
   source into the ignored `.repos/effect` directory. The first install needs network access.

2. Create an ignored root `.env` with these local settings:

   ```dotenv
   APP_ENV=development
   RUNNER_MANAGER_MODE=local
   RUNNER_HEADLESS=true
   ```

3. Start the portal:

   ```bash
   pnpm exec nx serve portal
   ```

Open <http://localhost:4200>. The portal target also starts the API on port `3000` and proxies API requests to it.
The API starts a local runner when an audit is submitted. No separate runner command is needed.

To try it, choose **Run a user-flow audit**, define the browser steps for a page you want to measure, and submit
the audit. Follow its progress to the results, then reopen it from **View audit history**.

Local data is stored in `.data/app-speed.sqlite`, with automatic schema initialization. This setup needs no
external database, S3 bucket, AWS credentials, or Clerk keys. If Chrome is missing, run
`pnpm exec puppeteer browsers install chrome`.

For sign-in and workspace management, follow the
[authentication and workspace setup](docs/development/authentication-and-workspaces.md).
For storage options and remote runners, see the [API configuration](apps/api/README.md) and
[runner configuration](apps/runner/README.md).

## Repository layout

| Path                 | Responsibility                                                             |
| -------------------- | -------------------------------------------------------------------------- |
| `apps/portal`        | Angular application shell and routes                                       |
| `apps/api`           | API composition and audit scheduling                                       |
| `apps/runner`        | Browser runner entry point                                                 |
| `apps/design-system` | UI component Storybook                                                     |
| `libs/audit`         | Audit contracts, domain logic, persistence, execution, and portal features |
| `libs/workspace`     | Workspace and project domain logic and API runtime                         |
| `libs/platform`      | Shared identity and observability services                                 |
| `libs/convenience`   | Trace tools and feature catalog                                            |
| `libs/ui`            | Shared Angular UI components and theme                                     |
| `tools`              | Nx executors for deployment, database tooling, and system tests            |
| `docs`               | Architecture decisions, feature guides, and operational documentation      |

Applications compose features; audit behavior belongs in `libs/audit`. See the
[domain-first architecture decision](docs/adr/ADR-0004-domain-first-audit-architecture.md) for boundaries.

## Contributing

Bug reports, documentation improvements, and code contributions are welcome. Read
[CONTRIBUTING.md](CONTRIBUTING.md) for the development workflow, coding conventions, checks, and pull request guidance.
Use [GitHub Issues](https://github.com/ChristopherPHolder/app-speed/issues) to report bugs or discuss feature ideas.

## Further reading

- [Domain model and current scope](CONTEXT.md)
- [Audit architecture and execution lifecycle](docs/audit-feature.md)
- [Workspace browser tests](docs/testing/workspace-e2e.md)
- [Integration and end-to-end tests](docs/testing/integration-and-e2e.md)
- [Effect diagnostics](docs/development/effect-diagnostics.md)
- [Angular secondary entry point conventions](docs/conventions/angular-secondary-entry-points.md)
- [Production authentication setup](docs/deployment/initial-auth-production.md)
- [Backend observability](docs/observability-backend.md)
