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
