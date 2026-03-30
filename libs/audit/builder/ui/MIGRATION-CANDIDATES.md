# Audit Portal Builder Migration Candidates

This note evaluates which pieces from `libs/audit/portal/builder` are good candidates for the domain-scoped `layer:ui` library at `libs/audit/builder/ui`.

## Boundary

- `audit-builder-ui` is tagged `layer:ui`, so it should follow the Nx UI-library pattern: presentational components, UI-only helpers, and visual assets.
- Keep routing, NgRx state, HTTP/SSE, and workflow orchestration in `libs/audit/portal/builder`.
- The workspace dependency rules already allow a `layer:ui` library to depend on `layer:model` and `layer:contract`, so audit model/contracts imports are acceptable here when they are only used to render UI.

## Strong Candidates

### `audit-builder/loading-status.component.ts`

Status:
- Migrated into `audit-builder-ui` as the `@app-speed/audit-builder-ui/status-dialog` secondary entry point.

Why it fits:
- Pure dialog content.
- Only depends on Angular Material and a small view-model interface.
- No store, routing, or API access.

Move with:
- `audit-builder/loading-status.models.ts`
- `audit-builder/loading-status.stories.ts`

### `audit-builder/error-dialog.component.ts`

Why it fits:
- Pure dialog body rendered from injected data.
- Opened by the feature container, but the visual itself belongs in UI.

Cleanup to do during move:
- Remove the `console.log` calls from `ngOnInit`.
- Consider dropping `OnInit` entirely.

### `components/utils/toTitleCase.pipe.ts`

Why it fits:
- Pure formatting helper.
- No feature or domain orchestration.

### `components/fields/input-field.component.ts`

Why it fits:
- Standalone presentational wrapper around a supplied `FormControl`.
- Clear leaf UI component with projected action slot.

Small refactor needed:
- Extract the `StepField` type from `components/audit-builder-form.ts` into a UI-owned file so this component does not depend on feature-owned form construction.

Move with:
- `components/fields/input-field.stories.ts`

### `components/fields/options-field.component.ts`

Why it fits:
- Same pattern as `input-field.component.ts`.
- Renders provided field metadata and options without store/API coupling.

Small refactor needed:
- Extract the `StepField` type into the UI library first.

Move with:
- `components/fields/options-field.stories.ts`

### `components/fields/array-field.component.ts`

Why it fits:
- Mostly UI-local behavior around an injected `FormArray`.
- No feature/store/API coupling.

Small refactor needed:
- Extract the `StepField` type into the UI library first.

Move with:
- `components/fields/array-field.stories.ts`

## Phase 2 Candidates

### `components/audit-step.component.ts`

Why it is close:
- Visual composition is strongly UI-oriented.
- Depends on field components, icons, and step metadata display.

Why it is not a clean first move:
- It is coupled to `StepFormGroup`.
- It mutates step structure through `resetStepControls`, `addOptionalField`, and `removeOptionalField`.

Recommended move path:
- First replace the current `StepFormGroup` dependency with a slimmer UI-facing API or view model.
- Then move the component and its story.

### `components/audit-builder.component.ts`

Why it is close:
- This is the main builder surface and likely belongs in the UI library eventually.

Why it is not a clean first move:
- It creates `AuditFormGroup` internally.
- It owns `valueChanges` subscription and emits raw form values.
- It toggles form enabled/disabled state internally.

Recommended move path:
- Split it into container vs presenter responsibilities.
- Let the feature layer own form creation and persistence concerns.
- Move the styles with it:
  - `components/audit-builder.styles.scss`
  - `components/audit-builder.stories.ts`

## Not Good UI-Lib Moves

These should stay in `libs/audit/portal/builder` or move somewhere other than the base UI library:

- `feature/*`
  - NgRx state, effects, dialog orchestration, and navigation logic.
- `api/*`
  - HTTP and progress-stream concerns.
- `audit.routes.ts`
  - Route composition and providers.
- `audit.component.ts`
  - Composition root shell.
- `components/audit-builder-form.ts`
  - Audit-specific form assembly and schema-driven control creation.
- `components/step-property.ts`
  - Form-control factory logic for audit step schema.

If `audit-builder-form.ts` or `step-property.ts` need reuse later, extract them into a dedicated form-support surface instead of the base `layer:ui` entrypoint.

## Suggested Extraction Order

1. Move the dialog pieces and `toTitleCase` pipe.
2. Extract `StepField` into the UI library and move the three leaf field components.
3. Re-export those pieces from `libs/audit/builder/ui/src/index.ts`.
4. Repoint the portal-builder stories and imports.
5. Revisit `AuditStepComponent` and `AuditBuilderComponent` after the form API is separated from the feature layer.

## Migration Notes

- The current portal-builder component selectors use `ui-*`, while `libs/audit/builder/ui/.eslintrc.json` enforces `b-ui-*`. Rename moved selectors to the UI-library prefix when extracting those components.
- Keep icon registration in `@app-speed/audit-builder-ui/icons`; the moved components already align with that secondary entrypoint.
