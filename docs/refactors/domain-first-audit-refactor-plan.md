# Domain-First Audit Refactor

Status: Completed
Owner: Christopher Holder
Last Updated: 2026-07-31

## Outcome

The repository implements the domain-first architecture accepted by ADR-0004. `portal`, `api`, and `runner` are thin
applications and composition roots. Audit-specific model, contract, persistence, runtime, runner, and web code lives
under `libs/audit/*`.

The bounded context is split into:

- `libs/audit/core/*` for feature-neutral lifecycle behavior, shared persistence, history, contracts, runner behavior,
  and portal UI.
- `libs/audit/user-flow/*` for the installed user-flow definition, APIs, persistence subtype, executor, builder, viewer,
  and portal data access.

Shared observability and other technical infrastructure live under `libs/platform/*`. Visual primitives that contain no
audit vocabulary remain under `libs/ui/*`.

## Final Boundaries

- Core never imports a user-flow implementation.
- `apps/api` composes core and user-flow HTTP groups, persistence, and runtime layers.
- `apps/runner` composes the core queue processor with the user-flow executor.
- `apps/portal` composes core history and user-flow builder/viewer routes.
- Shared audit UI is owned by `libs/audit/core/portal-ui` and imported through
  `@app-speed/audit/core/portal-ui` and its secondary entry points.
- Nx tags enforce scope, feature, runtime, and layer boundaries.

## Canonical Public Surface

Portal routes:

- `/audits/history`
- `/audits/user-flow/history`
- `/audits/user-flow/:id`

API routes:

- `/api/audits/history`
- `/api/audits/user-flow/history`
- `/api/audits/user-flow/schedule`
- `/api/audits/user-flow/:id`
- `/api/audits/user-flow/:id/events`
- `/api/audits/user-flow/:id/result`
- `/api/audits/user-flow/:id/report`

## Verification

The architecture is verified through Nx project targets: lint, unit tests, builds, Effect diagnostics, API e2e,
runner integration, Angular routing/component tests, and portal Cypress e2e. Persistence and e2e verification use
isolated databases because the accepted audit migration replaces prior audit data.

## Decisions Retained

- Audit is the bounded context; deployment applications are not bounded contexts.
- Run history is a core audit capability shared by installed audit features.
- Feature-specific persistence and execution extend the core lifecycle without reversing the dependency direction.
- Cross-cutting modules remain horizontal only when they are reusable without audit semantics.
- Public routes and contracts use only the canonical paths listed above.

See `docs/adr/ADR-0004-domain-first-audit-architecture.md` and
`docs/refactors/domain-first-audit-target-taxonomy.md` for the accepted decision and implemented project taxonomy.
