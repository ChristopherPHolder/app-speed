# Domain-First Audit Target Taxonomy

Status: Draft  
Owner: Christopher Holder  
Last Updated: 2026-03-27

## Purpose

This document makes the refactor target concrete. It defines:
- the top-level workspace shape
- the target project naming and import taxonomy
- the Nx tag taxonomy
- the intended dependency rules
- the migration map from the current structure to the target structure

It is a companion to the domain-first audit refactor plan and the domain-first architecture ADR draft.

## Top-Level Workspace Shape

The workspace should be organized around three concepts:

- Applications
  - deployable entrypoints and composition roots only
- Domain modules
  - product behavior organized by bounded context
- Cross-cutting technical modules
  - generic infrastructure or UI primitives that are reusable outside a single domain

Target top-level shape:

```text
apps/
  api/
  portal/
  runner/
  design-system/

libs/
  audit/
    model/
    contracts/
    persistence/
    control-plane/
    runner/
    portal/
      builder/
      viewer/
      runs/
  platform/
    observability/
    sqlite/           (only if generic DB runtime concerns are extracted)
  ui/
    status-badge/
    scroll-container/
    radial-chart/
```

Rules implied by that shape:
- `apps/*` own bootstrap, wiring, runtime config, and composition only.
- New audit business logic should go under `libs/audit/**`, not under `apps/api`, `apps/runner`, `libs/portal`, `libs/server`, `libs/shared`, or `libs/runner`.
- Generic technical concerns belong under `libs/platform/**` or `libs/ui/**` only if they are genuinely reusable outside audit.
- No new audit code should be added under the current horizontal buckets once migration starts.

## Target Projects

The target projects below are intentionally concrete enough to drive naming, path aliases, and Nx tags.

### Applications

| Project | Suggested Import Role | Responsibility | Target Tags |
| --- | --- | --- | --- |
| `portal` | none | Angular bootstrap, top-level routing, app-wide providers | `type:app`, `runtime:web`, `app:portal` |
| `api` | none | Node bootstrap, effect layer wiring, HTTP server composition | `type:app`, `runtime:node`, `app:api` |
| `runner` | none | Node CLI bootstrap and runner composition | `type:app`, `runtime:node`, `app:runner` |
| `design-system` | none | Storybook host for shared UI | `type:app`, `runtime:web`, `app:design-system` |

### Audit Domain

| Project | Suggested Import Alias | Responsibility | Target Tags |
| --- | --- | --- | --- |
| `audit-model` | `@app-speed/audit/model` | Audit value objects, constants, default values, shared domain vocabulary | `type:domain`, `scope:audit`, `runtime:agnostic`, `layer:model` |
| `audit-contracts` | `@app-speed/audit/contracts` | Schemas, contract types, wire-facing audit structures | `type:domain`, `scope:audit`, `runtime:agnostic`, `layer:contract` |
| `audit-persistence` | `@app-speed/audit/persistence` | Audit repositories, audit DB schema, query behavior, persistence contract tests | `type:domain`, `scope:audit`, `runtime:node`, `layer:persistence` |
| `audit-control-plane` | `@app-speed/audit/control-plane` | Audit HTTP API groups, runner lifecycle orchestration, server-side audit application logic | `type:domain`, `scope:audit`, `runtime:node`, `layer:application` |
| `audit-runner` | `@app-speed/audit/runner` | Audit execution, queue claim/complete/heartbeat logic, runner-side orchestration | `type:domain`, `scope:audit`, `runtime:node`, `layer:application` |
| `audit-portal-builder` | `@app-speed/audit/portal/builder` | Portal builder flow, builder state, builder routes, builder-specific UI | `type:domain`, `scope:audit`, `runtime:web`, `layer:feature` |
| `audit-portal-viewer` | `@app-speed/audit/portal/viewer` | Portal viewer flow, result rendering, diagnostics, viewer-specific UI | `type:domain`, `scope:audit`, `runtime:web`, `layer:feature` |
| `audit-portal-runs` | `@app-speed/audit/portal/runs` | Portal run-history list/detail flow, polling, navigation, run-history UI | `type:domain`, `scope:audit`, `runtime:web`, `layer:feature` |

### Cross-Cutting Technical Modules

| Project | Suggested Import Alias | Responsibility | Target Tags |
| --- | --- | --- | --- |
| `platform-observability` | `@app-speed/platform/observability` | Shared tracing/logging bootstrap and runtime helpers | `type:platform`, `scope:shared`, `runtime:node` |
| `platform-sqlite` | `@app-speed/platform/sqlite` | Optional generic DB client/runtime extraction if audit persistence needs it | `type:platform`, `scope:shared`, `runtime:node` |
| `ui-status-badge` | `@app-speed/ui/status-badge` | Reusable status pill primitive | `type:ui`, `scope:shared`, `runtime:web`, `layer:ui` |
| `ui-scroll-container` | `@app-speed/ui/scroll-container` | Reusable scroll container primitive | `type:ui`, `scope:shared`, `runtime:web`, `layer:ui` |
| `ui-radial-chart` | `@app-speed/ui/radial-chart` | Reusable chart primitive | `type:ui`, `scope:shared`, `runtime:web`, `layer:ui` |

## What Stays App-Local

The following concerns should stay inside applications unless a strong reuse case appears:

- `apps/portal`
  - bootstrap
  - root router setup
  - app-wide Angular providers
- `apps/api`
  - effect runtime startup
  - environment-driven layer selection
  - final HTTP server launch
- `apps/runner`
  - CLI bootstrap
  - runtime startup and shutdown wiring

The current `portal-feature-shell` should be retired rather than preserved as a top-level architectural unit. It is application shell code, not domain code.

## What Counts As Generic UI

Keep a UI module horizontal only if it can be reused outside audit without dragging audit vocabulary, audit routes, audit DTOs, or audit semantics with it.

Conservative target classification:
- keep horizontal
  - `status-badge`
  - `scroll-container`
  - `radial-chart`
- move under audit domain
  - `audit-builder`
  - `audit-summary`
  - `audit-runs`
  - `viewer-diagnostics`
  - `fractional-result-chip`

The goal is to stop treating “used by multiple audit screens” as equivalent to “generic”.

## Tag Taxonomy

Use four tag dimensions.

### `type:*`

- `type:app`
- `type:domain`
- `type:platform`
- `type:ui`

### `scope:*`

- `scope:audit`
- `scope:shared`

### `runtime:*`

- `runtime:web`
- `runtime:node`
- `runtime:agnostic`

### `layer:*`

- `layer:model`
- `layer:contract`
- `layer:persistence`
- `layer:application`
- `layer:feature`
- `layer:ui`

### `app:*`

- `app:portal`
- `app:api`
- `app:runner`
- `app:design-system`

Not every project needs every dimension. The important point is consistency:
- all applications get `type:app`
- all audit modules get `scope:audit`
- all reusable technical modules get `scope:shared`
- runtime-incompatible dependencies are easy to block

## Dependency Rules

These rules are the intended architectural guardrails.

### High-Level Rules

- `type:app`
  - may depend on `type:domain`, `type:platform`, and `type:ui`
  - may not be imported by any non-app project

- `type:domain`
  - may depend on same-scope domain modules
  - may depend on `type:platform`
  - may depend on `type:ui` only for web-facing feature modules
  - may not depend on `type:app`

- `type:platform`
  - may depend on `type:platform`
  - may not depend on `type:domain` or `type:app`

- `type:ui`
  - may depend on `type:ui`
  - may not depend on `type:domain`, `type:platform`, or `type:app`

### Runtime Rules

- `runtime:web` may depend only on `runtime:web` or `runtime:agnostic`
- `runtime:node` may depend on `runtime:node` or `runtime:agnostic`
- `runtime:agnostic` should not depend on runtime-specific modules

### Layer Rules Inside Audit

- `layer:model`
  - no dependencies on `layer:contract`, `layer:persistence`, `layer:application`, or `layer:feature`

- `layer:contract`
  - may depend on `layer:model`
  - may not depend on `layer:persistence`, `layer:application`, or `layer:feature`

- `layer:persistence`
  - may depend on `layer:model`, `layer:contract`, and `type:platform`
  - may not depend on `layer:feature`

- `layer:application`
  - may depend on `layer:model`, `layer:contract`, `layer:persistence`, and `type:platform`
  - may not depend on `type:app`

- `layer:feature`
  - may depend on `layer:model`, `layer:contract`, shared `type:ui`, and same-domain feature support modules
  - may not depend on node-only modules

## Current To Target Mapping

| Current Module | Target Module | Notes |
| --- | --- | --- |
| `libs/shared/user-flow-replay` | `audit-model` | Move domain vocabulary and defaults here |
| `libs/shared/user-flow-replay/schema` | `audit-contracts` | Move schemas and contract-facing types here |
| `libs/server/db` | `audit-persistence` plus optional `platform-sqlite` | Split only if generic DB runtime concerns become clear |
| `apps/api/src/Audit/**` | `audit-control-plane` | Keep endpoint shapes unchanged |
| `apps/api/src/Runner/**` | `audit-control-plane` | Runner lifecycle is still audit-specific control-plane logic |
| `libs/runner/user-flow-replay` | `audit-runner` | Rename around domain ownership rather than runtime bucket |
| `libs/portal/feature-audit` | `audit-portal-builder` and `audit-portal-viewer` | Split by portal feature responsibility |
| `libs/portal/feature-audit-runs` | `audit-portal-runs` | Keep as part of the same audit bounded context |
| `libs/portal/data-access` | absorbed into audit portal modules | Do not keep a top-level horizontal data-access bucket |
| `libs/portal/data-access-audit-runs` | absorbed into audit portal modules | Same rule as above |
| `libs/portal/ui/audit-builder` | `audit-portal-builder` | Audit-specific UI should live with the feature |
| `libs/portal/ui/audit-summary` | `audit-portal-viewer` | Audit-specific UI should live with the feature |
| `libs/portal/ui/audit-runs` | `audit-portal-runs` | Audit-specific UI should live with the feature |
| `libs/portal/ui/viewer-diagnostics` | `audit-portal-viewer` | Audit-specific UI should live with the feature |
| `libs/portal/ui/fractional-result-chip` | `audit-portal-viewer` | Treat as audit-specific unless a broader use case appears |
| `libs/portal/ui/status-badge` | `ui-status-badge` | Keep as shared UI primitive |
| `libs/portal/ui/scroll-container` | `ui-scroll-container` | Keep as shared UI primitive |
| `libs/portal/ui/radial-chart` | `ui-radial-chart` | Keep as shared UI primitive |
| `libs/shared/observability` | `platform-observability` | Rename to reflect cross-cutting platform ownership |
| `libs/portal/feature-shell` | move into `apps/portal` | App shell, not domain library |

## Naming Guidance

Prefer names that describe domain ownership first and runtime second.

Good examples:
- `audit-model`
- `audit-contracts`
- `audit-persistence`
- `audit-control-plane`
- `audit-runner`
- `audit-portal-builder`

Avoid names that make the runtime or technical layer the primary identity when the module is really audit-specific:
- `shared-user-flow-replay`
- `server-db`
- `runner-user-flow-replay`
- `portal-data-access`

## Migration Notes

- Introduce new projects before moving imports.
- Keep compatibility exports only long enough to migrate consumer groups cleanly.
- Move tests with the owning module as early as possible so architectural ownership and verification stay aligned.
- Add hard dependency constraints only after the new target projects exist and most imports have moved.
- Once migration begins, treat the current horizontal buckets as legacy structures.
