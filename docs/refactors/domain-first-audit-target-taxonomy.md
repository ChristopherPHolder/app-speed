# Domain-First Audit Project Taxonomy

Status: Active
Owner: Christopher Holder  
Last Updated: 2026-07-31

## Purpose

This document records the implemented audit project layout, import taxonomy, tags, and dependency rules. The workspace
uses one audit bounded context with a feature-neutral core and feature-specific implementations.

## Workspace Shape

```text
apps/
  api/       # Effect HTTP composition root
  portal/    # Angular route and provider composition root
  runner/    # Effect runner composition root

libs/
  audit/
    core/
      api-contract/
      api-runtime/
      domain/
      feature-history/
      persistence/
      portal-ui/
      runner/
    user-flow/
      api-contract/
      api-runtime/
      domain/
      feature-builder/
      feature-viewer/
      persistence/
      portal-data-access/
      runner/
  platform/
  ui/
```

`apps/*` contain bootstrap, runtime configuration, and final feature wiring. Audit behavior belongs in `libs/audit/*`.
Generic infrastructure belongs in `libs/platform/*`; generic visual primitives belong in `libs/ui/*`.

## Core Projects

| Project | Import | Responsibility | Layer |
| --- | --- | --- | --- |
| `audit-core-domain` | `@app-speed/audit/core/domain` | Shared audit identity and lifecycle vocabulary | `model` |
| `audit-core-api-contract` | `@app-speed/audit/core/api-contract` | Shared HTTP schemas and endpoints | `contract` |
| `audit-core-persistence` | `@app-speed/audit/core/persistence` | Shared templates, queue, runs, results, and history | `persistence` |
| `audit-core-api-runtime` | `@app-speed/audit/core/api-runtime` | Shared HTTP handlers and runner lifecycle | `application` |
| `audit-core-runner` | `@app-speed/audit/core/runner` | Feature-neutral queue polling and execution protocol | `application` |
| `audit-core-feature-history` | `@app-speed/audit/core/feature-history` | Reusable audit history UI | `feature` |
| `audit-core-portal-ui` | `@app-speed/audit/core/portal-ui` | Shared audit UI, icons, dialogs, and form fields | `ui` |

The portal UI secondary entry points are:

- `@app-speed/audit/core/portal-ui/icons`
- `@app-speed/audit/core/portal-ui/dialogs`
- `@app-speed/audit/core/portal-ui/form-fields`

## User-Flow Projects

The user-flow feature mirrors the relevant layers under `libs/audit/user-flow/*` and uses imports rooted at
`@app-speed/audit/user-flow/*`. It owns the user-flow definition, persistence subtype, API installation, builder,
viewer, portal data access, and runner executor.

## Tags

Every audit project is tagged with:

- `type:domain`
- `scope:audit`
- either `feature:audit-core` or `feature:audit-user-flow`
- one runtime tag: `runtime:agnostic`, `runtime:web`, or `runtime:node`
- one layer tag matching its responsibility

`audit-core-portal-ui` is tagged `scope:audit`, `feature:audit-core`, `runtime:web`, and `layer:ui` in addition to its
domain type.

## Dependency Rules

- Applications may compose domain, platform, and shared UI projects; libraries may not import applications.
- Runtime-specific projects may depend on the same runtime or runtime-agnostic projects only.
- Core projects must not import a feature implementation. Installed features are selected in `apps/api`, `apps/runner`,
  and `apps/portal`.
- Model and contract layers remain free of persistence, application, and feature dependencies.
- Web feature projects may depend on web/agnostic core contracts, models, history, and portal UI.
- Node application projects may depend on the matching model, contract, and persistence layers.

## Application Composition

- `apps/api` combines core and user-flow API groups and provides their Effect layers.
- `apps/runner` combines the core run loop with the user-flow executor.
- `apps/portal` installs shared history at `/audits/history`, filtered history at `/audits/user-flow/history`, and the
  user-flow builder/viewer at `/audits/user-flow` and `/audits/user-flow/:id`.
