# Audit Builder UI

This folder documents the target boundary for the future audit builder UI library.

Primary reference:
- Nx project dependency rules: <https://nx.dev/docs/concepts/decisions/project-dependency-rules>

## Purpose

The audit builder UI library should be a domain-owned presentational library for the portal audit builder.

It is not a shared `libs/ui/**` primitive library. The builder is audit-specific, so the code should stay under `libs/audit/**` even when it is split into `feature`, `data-access`, `ui`, and `utils`.

Recommended tags when the project is created:
- `type:domain`
- `scope:audit`
- `runtime:web`
- `layer:ui`

## Nx Boundary

Following the Nx UI-library pattern, this library should:
- render presentational components only
- receive data through `input()`s or other values supplied by the caller
- emit user intent through `output()`s
- avoid route orchestration, store orchestration, and transport concerns

This means no:
- `HttpClient`
- NgRx `Store`, effects, or reducers
- `Router` / `ActivatedRoute`
- `EventSource` / SSE handling
- `MatDialog` orchestration
- route definitions or feature providers

## What Belongs Here

The UI lib should own audit-builder rendering and local interaction only:
- standalone presentational components
- field renderer components
- dialog content components
- builder-specific styles
- builder-specific icon registration
- stories and component tests
- UI-only view models and types

Candidate files from the current implementation:
- `components/audit-builder.component.ts`
- `components/audit-step.component.ts`
- `components/fields/input-field.component.ts`
- `components/fields/options-field.component.ts`
- `components/fields/array-field.component.ts`
- `components/utils/toTitleCase.pipe.ts`
- `components/audit-builder-icons.provider.ts`
- `audit-builder/loading-status.component.ts`
- `audit-builder/error-dialog.component.ts`

## What Must Stay Out

These belong in `feature`, `data-access`, or app composition:
- `audit.routes.ts`
- `audit.component.ts`
- `feature/builder.component.ts`
- `feature/builder.actions.ts`
- `feature/builder.state.ts`
- `feature/builder.effects.ts`
- `api/audit-builder-api.service.ts`
- `api/audit-progress.service.ts`

Those files own routing, state, network calls, progress subscription, dialog lifecycle, query-param sync, and navigation. None of that should move into the UI lib.

## Current Implementation Review

The existing `libs/audit/portal/builder` library mixes several responsibilities in one Nx project:
- route entry and providers
- NgRx feature state and effects
- HTTP and SSE services
- presentational builder components

The current presentational components are already close to the target boundary, but there are a few cleanup items to carry into the rewrite:
- `AuditBuilderComponent` uses `output<any>()` for `submitAudit` and `modified`; replace those with explicit event types
- `AuditFormGroup` currently ignores `initialAudit.device` and `initialAudit.timeout` and falls back to defaults instead
- `ErrorDialogComponent` logs to the console during `ngOnInit`; dialog content should stay pure
- `step-property.ts` still contains unimplemented handlers and `console.warn` fallbacks
- `audit-step.component.ts` still renders a `TODO not yet implemented` fallback branch

## Decision Needed: Form Construction

There is one important boundary decision for the rewrite:

`audit-builder-form.ts` and `step-property.ts` currently build schema-driven Angular forms using `@app-speed/audit/model` and `@app-speed/audit/contracts`.

Two valid options:

1. Keep form construction in the UI lib
   - Works with the current workspace rules because `layer:ui` is allowed to depend on `layer:model` and `layer:contract`
   - Keeps the builder component self-contained
   - Is slightly looser than the strict Nx article, because the UI lib now knows domain schema details

2. Move form construction into `libs/audit/builder/utils`
   - Best match for the Nx article's "UI depends on UI/util" guidance
   - UI components receive a prepared `FormGroup`, field descriptors, or builder view model from the caller
   - Makes the UI lib easier to test and easier to reuse with alternate form implementations

Recommended direction for the rewrite:
- move schema-to-form creation and control factories into `libs/audit/builder/utils`
- keep the UI lib focused on rendering the form it is given

If that feels too indirect for the first pass, keep the form classes local to the UI lib temporarily, but do not let HTTP, routing, store, or progress logic cross the boundary.

## Public API Guidance

The UI lib should expose a small boundary:
- `AuditBuilderComponent`
- `AuditStepComponent`
- `LoadingStatusComponent`
- `ErrorDialogComponent`
- `provideAuditBuilderIcons`

Field components can stay exported only if they are useful for stories or tests. Otherwise keep them internal.

## Reimplementation Conventions

- Use explicit input and output types. No `any`.
- Keep components standalone and story-friendly.
- Prefer immutable view-model inputs over reading global state.
- Keep Material usage and local form interaction inside the component boundary.
- Do not import feature actions, reducers, services, or routes.
- Do not hide transport or navigation side effects inside components.
- Component tests should not need `HttpClientTestingModule`, router setup, or NgRx setup.

## Suggested Migration Split

When extracting from `libs/audit/portal/builder`, move code in this order:

1. Presentational components, pipes, styles, and icons
2. Dialog content components
3. Optional form helpers, if they remain UI-owned

Keep these behind in the feature/data-access layers:
- route configuration
- state/actions/effects
- audit scheduling API calls
- audit progress subscriptions
- navigation to the viewer
- query-param persistence
