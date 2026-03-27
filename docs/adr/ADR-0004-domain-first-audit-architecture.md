# ADR-0004: Domain-First Audit Architecture

Status: Proposed  
Date: 2026-03-27

## Decision

Adopt a domain-first architecture centered on a single `Audit` bounded context.

Specifically:
- `portal`, `api`, and `runner` are applications and composition roots, not bounded contexts.
- Audit-specific code should be organized under a shared audit domain umbrella rather than split primarily by delivery mechanism or technical layer.
- Cross-cutting modules remain horizontal only when they are genuinely reusable outside the audit domain.
- Nx tags and dependency constraints must enforce the new boundaries.

The intended target is:
- thin applications in `apps/*`
- audit domain modules in `libs/audit/**`
- reusable platform modules in `libs/platform/**`
- reusable UI primitives in `libs/ui/**`

## Context

The current workspace already behaves like a single audit product:
- the portal builds and views audits
- the API schedules audits, reports progress, and serves results
- the runner executes audits
- shared schema and persistence code define the same audit lifecycle

However, the repository structure expresses that lifecycle poorly. Audit logic is split across:
- `libs/portal/*`
- `libs/server/*`
- `libs/runner/*`
- `libs/shared/*`
- `apps/api/src/**`

That makes it harder to answer basic ownership questions:
- where audit business logic lives
- which UI pieces are truly generic
- which server modules are audit-specific versus cross-cutting
- where new audit features should be added

The existing frontend `feature` / `data-access` / `ui` slice pattern is useful locally, but at repository scale it reinforces a horizontal architecture around one dominant domain.

The team also wants better co-location between frontend code, backend code, and schema ownership without changing API behavior or runtime behavior.

## Consequences

- Positive: the repository will express the actual business boundary more clearly.
- Positive: audit-related frontend, backend, runner, schema, and persistence code will be easier to discover and evolve together.
- Positive: applications become simpler composition roots with less embedded domain logic.
- Positive: Nx constraints can prevent architectural drift once the migration is complete.
- Positive: audit-specific UI can stop masquerading as generic shared UI.
- Negative: the migration will temporarily increase indirection because compatibility exports and old/new modules will coexist.
- Negative: project names, import aliases, and file ownership will change substantially.
- Negative: some existing “shared” or “server” modules will need to be split before they can move cleanly.
- Negative: this ADR intentionally does not define multiple bounded contexts beyond `Audit`; if the domain later proves more complex, additional ADRs may be required.
