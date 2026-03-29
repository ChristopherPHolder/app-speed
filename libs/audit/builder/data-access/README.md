# @app-speed/audit-builder-data-access

Planned data-access library for the rebuilt audit portal builder under `libs/audit/builder`.

This library should follow the Nx [data-access library](https://nx.dev/docs/concepts/decisions/project-dependency-rules#data-access-libraries) pattern:

- act as the client-side delegate layer for builder-related APIs
- own builder state management
- expose a stable API to the feature layer
- stay free of presentational Angular components

This folder does not have a generated Nx project yet. The README exists to capture the target boundary before code moves in.

## Boundary

Own here:

- HTTP/SSE access for scheduling audits, tracking progress, and loading results
- builder state, selectors, reducers, effects, and related helpers
- serialization / persistence of builder draft state when that persistence is part of the state layer
- normalization of transport errors into builder-friendly messages or typed errors

Keep out of here:

- route definitions and navigation decisions
- Angular components, dialogs, icons, and stories
- form rendering and field composition
- page-level orchestration that only exists to drive UI behavior

## Workspace Constraints

The current workspace dependency rules in `.eslintrc.json` allow `layer:data-access` projects to depend on:

- `layer:data-access`
- `layer:model`
- `layer:contract`
- `type:ui`
- `type:platform`

For this builder specifically, the intended direction should still be:

- `feature -> data-access -> model/contracts/platform`

Even though `type:ui` is technically allowed by lint rules, builder-specific UI components should not live in or be imported by this library.

## Likely Structure

Suggested internal layout once the project is generated:

- `src/lib/api`
  - HTTP and SSE delegates
  - request / response DTO mapping
- `src/lib/+state`
  - actions
  - reducer
  - selectors
  - effects
  - optional facade
- `src/lib/persistence`
  - draft persistence adapter if the builder continues to use query params or local storage
- `src/index.ts`
  - public API surface used by `libs/audit/portal/builder`

## What This Library Should Probably Export

Candidate surface area:

- `provideAuditBuilderDataAccess()` or equivalent state/provider entrypoint
- builder selectors or a facade for consuming feature containers
- `AuditBuilderApiService`
- `AuditProgressService`
- typed builder state models and domain-safe status types

The feature library should depend on this surface instead of reaching into `api/*` or `+state/*` internals.

## Migration Candidates

Current source of truth: `libs/audit/portal/builder`.

### Strong First Moves

- `src/lib/api/audit-builder-api.service.ts`
  - Direct delegate for `POST /api/audit/schedule`
  - Good fit for `src/lib/api`
  - Tighten `requestAudit(auditDetails: any)` to use `AuditDetails`

- `src/lib/api/audit-progress.service.ts`
  - Owns EventSource lifecycle and result-fetch follow-up
  - Strong data-access fit because it is transport + stream normalization
  - Likely worth splitting later into smaller transport adapters, but it belongs in this layer

- `src/lib/feature/builder.actions.ts`
  - Builder request / progress / result events belong next to state
  - Consider renaming action sources away from `[Builder Page]` if this state is no longer page-owned

- `src/lib/feature/builder-error-message.ts`
  - Transport error normalization helper used by effects
  - Good fit as a data-access helper

### Move After Small Cleanup

- `src/lib/feature/builder.state.ts`
  - Reducer, feature key, and selectors are natural data-access assets
  - `loadingDialog` is UI-shaped state and should not move as-is
  - Replace dialog-specific view models with neutral status selectors before extraction

- `src/lib/feature/builder.effects.ts`
  - Most effects belong here once split from feature-only routing behavior
  - Good data-access candidates:
    - submit audit request
    - listen to audit progress
    - update queue position
    - request audit result
    - fetch audit result
  - Feature-only effect to leave behind:
    - `auditResultSuccessNavigateEffect`

### Conditional Candidates

- URL draft persistence in:
  - `loadAuditDetailsEffect`
  - `loadAuditDetailsSuccessEffect`
  - `updateAuditDetailsEffect`

These are reasonable data-access candidates only if URL query params remain the chosen persistence strategy for builder draft state. If URL persistence is temporary or page-specific, keep that adapter shallow and avoid coupling the whole state layer directly to `Router` / `ActivatedRoute`.

### Types Worth Centralizing Here

The following types are currently spread across feature and API files and should likely live with data-access:

- `AuditStage`
- `ScheduleAuditResponse`
- `AuditResultResponse`

That keeps transport and state contracts close to the code that actually owns them.

## Not Data-Access Moves

These should stay in the feature or UI layers:

- `src/lib/feature/builder.component.ts`
  - container component and dialog orchestration
- `src/lib/audit.routes.ts`
  - route composition and provider wiring
- `src/lib/audit.component.ts`
  - route shell
- `src/lib/components/*`
  - form rendering and builder presentation
- `src/lib/audit-builder/*`
  - dialog components and loading UI

## Suggested Extraction Order

1. Generate the Nx library with tags: `type:domain`, `scope:audit`, `runtime:web`, `layer:data-access`.
2. Move API services and error/transport helpers first.
3. Move actions, reducer, selectors, and shared builder status types.
4. Split current effects into:
   - data-access effects for API, SSE, result loading, and draft persistence
   - feature effects for navigation and dialog behavior
5. Repoint `libs/audit/portal/builder` to consume the exported data-access surface.

## Open Decisions

- Should builder draft persistence stay in query params or move to local/session storage?
- Should consumers use raw NgRx exports or a small facade/provider API?
- Should result fetching stay coupled to `AuditProgressService`, or move into a separate result API delegate?
- Should loading-dialog text be derived in feature/UI from builder status selectors instead of living in store state?
