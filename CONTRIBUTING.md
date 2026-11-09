# Contributing to AppSpeed

Start with the [README](README.md#run-locally) to install dependencies and run the local stack.
This guide covers reporting problems, making changes, and preparing a pull request.

## Report a bug or propose a feature

Search [existing issues](https://github.com/ChristopherPHolder/app-speed/issues) before opening a new one.
For a bug, include steps to reproduce, expected and actual behavior, and relevant browser or runtime versions.
Screenshots and logs help; remove credentials and private data before sharing them.

For a feature, describe the problem and a concrete example of the behavior you want. Discuss substantial changes
in an issue so the scope and approach can be agreed before implementation.

## Make a change

1. Fork the repository if you do not have write access, then clone your fork.
2. Create a branch from an up-to-date `main`:

   ```bash
   git switch main
   git pull --ff-only
   git switch -c fix/describe-your-change
   ```

3. Follow the [local setup](README.md#run-locally), then make a focused change in the owning Nx project.
4. Add or update tests for changed behavior, and update documentation when setup or usage changes.
5. Run the relevant checks below, commit, and open a pull request against `main`.

## Follow the project conventions

- Use two-space indentation, single quotes, trailing commas, and a 120-character line width. Prettier's
  [configuration](.prettierrc) is the formatting source of truth.
- Keep applications focused on composition. Put audit behavior in `libs/audit`, workspace behavior in
  `libs/workspace`, and reusable platform services in `libs/platform`.
- Respect the library boundaries enforced by ESLint and keep consumer imports aligned with public APIs.
  Follow the [Angular secondary entry point conventions](docs/conventions/angular-secondary-entry-points.md)
  when changing publishable libraries.
- Use workspace-consistent Nx generators for Angular code, with SCSS for component styles.
- Keep generated `dist/` output and secrets out of commits. Use the ignored local `.env` for development settings.
- Implement deployment and release logic as Nx executors under `tools`; CI/CD operations must use Nx targets.

Read the [domain model](CONTEXT.md) and relevant [architecture decisions](docs/adr) when changing domain behavior.
[AGENTS.md](AGENTS.md) contains additional repository and agent guidance.

## Verify your change

Use Nx targets for project checks. For example, when changing the portal:

```bash
pnpm exec nx lint portal
pnpm exec nx test portal
pnpm exec nx build portal
```

Replace `portal` with the owning project's name. Use `pnpm exec nx show project <project>` to see its available
targets. Unit tests use Vitest; keep `*.spec.ts` or `*.test.ts` files near the code they exercise.

Before opening a pull request, check affected projects against your local `main`:

```bash
pnpm exec nx affected -t lint,test,build --base=main
pnpm exec nx affected -t effect:diagnostics --base=main
```

For changes to API boundaries or complete audit journeys, run the relevant system tests:

```bash
pnpm exec nx run api:integration
pnpm exec nx run portal-e2e:e2e
```

These targets manage their own local services and isolated databases. Stop the development stack before running
browser tests, which need ports `3000`, `4200`, and `4443`. See the
[system-test guide](docs/testing/integration-and-e2e.md) for browser prerequisites and troubleshooting, the
[workspace browser-test guide](docs/testing/workspace-e2e.md) for authenticated journeys, and the
[Effect diagnostics guide](docs/development/effect-diagnostics.md) for rule and output options.

## Commit and open a pull request

Use Conventional Commits with the Angular preset. For example:

```text
fix(portal): preserve selected project after refresh
docs: clarify local runner setup
```

Husky and commitlint check commit messages. Keep each pull request focused so reviewers can understand the change
and Nx can limit affected checks.

In the pull request description, explain the problem and resulting behavior, link related issues, and list the
checks you ran with their results. Include screenshots for UI changes and call out any configuration or migration
steps. CI runs affected lint, Effect diagnostics, unit tests, builds, integration tests, and end-to-end tests.
