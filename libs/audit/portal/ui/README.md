# @app-speed/audit/portal/ui

UI package for audit portal Angular components and assets.

This library is the audit portal UI layer. It should contain presentational components, UI-only helpers, and portal-specific assets such as icons. Keep routing, store logic, HTTP/SSE, and other feature or data-access concerns out of this package.

## Entry Points

- `@app-speed/audit/portal/ui`
  - root package entrypoint
  - currently exports `ToTitleCasePipe`
- `@app-speed/audit/portal/ui/icons`
  - secondary entrypoint for audit portal icon registration
  - exports `provideAuditBuilderIcons()`
- `@app-speed/audit/portal/ui/dialogs`
  - secondary entrypoint for audit portal dialog surfaces
  - exports `StatusDialog`, `StatusDialogModel`, `ErrorDialog`, and `ErrorDialogModel`
- `@app-speed/audit/portal/ui/form-fields`
  - secondary entrypoint for audit portal form field UI
  - exports extracted leaf field components and field view models

## Structure

- `src/index.ts`
  - root public API
- `src/lib/toTitleCase.pipe.ts`
  - root formatting helper exported by the package
- `icons/src/index.ts`
  - public API for the `icons` secondary entrypoint
- `icons/src/lib/icons.ts`
  - raw SVG strings and icon name constants
- `icons/src/lib/icons.provide.ts`
  - Angular provider that registers audit portal badge icons with `MatIconRegistry`
- `icons/src/lib/icons.stories.ts`
  - Storybook gallery for the icon set
- `dialogs/src/index.ts`
  - public API for the `dialogs` secondary entrypoint
- `dialogs/src/lib/status-dialog.ts`
  - presentational loading dialog body for builder progress
- `dialogs/src/lib/error-dialog.ts`
  - presentational error dialog body for request failures
- `dialogs/src/lib/error-dialog.model.ts`
  - UI-facing model for the dialog error copy
- `dialogs/src/lib/status-dialog.model.ts`
  - UI-facing view model for the dialog status copy
- `form-fields/src/index.ts`
  - public API for the `form-fields` secondary entrypoint
- `form-fields/src/lib/array-field.ts`
  - extracted presentational array field component
- `form-fields/src/lib/input-field.ts`
  - extracted presentational input field component
- `form-fields/src/lib/options-field.ts`
  - extracted presentational options field component
- `form-fields/src/lib/array-field.stories.ts`
  - Storybook stories for the array field component
- `form-fields/src/lib/input-field.stories.ts`
  - Storybook stories for the input field component
- `form-fields/src/lib/options-field.stories.ts`
  - Storybook stories for the options field component
- `form-fields/src/lib/array-field.spec.ts`
  - component test coverage for the array field component
- `form-fields/src/lib/input-field.spec.ts`
  - component test coverage for the `form-fields` secondary entrypoint
- `form-fields/src/lib/options-field.spec.ts`
  - component test coverage for the options field component
- `vitest.config.mts`
  - shared Vitest config for both `src/**` and `icons/src/**`

## Icons

The `icons` secondary entrypoint currently provides two registered SVG icons:

- `lighthouse-badge`
- `puppeteer-badge`

Use them by registering the provider once at an app, route, or story boundary:

```ts
import { provideAuditBuilderIcons } from '@app-speed/audit/portal/ui/icons';

export const appConfig = {
  providers: [provideAuditBuilderIcons()],
};
```

After that, Angular Material icons can reference:

```html
<mat-icon svgIcon="lighthouse-badge" />
<mat-icon svgIcon="puppeteer-badge" />
```

## Testing

Testing is configured for the library through the root Nx project:

- `src/test-setup.ts` bootstraps Angular + Vitest
- `src/**/*.spec.ts` covers the root entrypoint
- `icons/src/**/*.spec.ts` covers the secondary entrypoint
- `dialogs/src/**/*.spec.ts` covers the dialogs secondary entrypoint
- `form-fields/src/**/*.spec.ts` covers the form-fields secondary entrypoint

Run:

- `pnpm exec nx test audit-portal-ui`
- `pnpm exec nx lint audit-portal-ui`
- `pnpm exec nx build audit-portal-ui`

## Notes

- Nx project name: `audit-portal-ui`
- Angular component selectors in this library currently use the `b-ui-*` prefix for compatibility.
- Tags: `type:domain`, `scope:audit`, `runtime:web`, `layer:ui`
- The root entrypoint is still minimal. As more audit portal UI pieces move in, export them from `src/index.ts` and keep shared icon registration in the `icons` secondary entrypoint.
- Candidate extractions from `libs/audit/portal/builder` are tracked in [MIGRATION-CANDIDATES.md](./MIGRATION-CANDIDATES.md).
- Secondary entrypoint naming must stay aligned with the root package name.
  - Use `@app-speed/audit/portal/ui/icons`
  - Use `@app-speed/audit/portal/ui/form-fields`
  - Use `@app-speed/audit/portal/ui/dialogs`
  - Do not introduce alternate aliases such as `@app-speed/audit-portal-ui-icons` or slash-mismatched variants
- After renaming the package name or secondary entrypoint aliases, run `pnpm exec nx reset` before trusting incremental builds.
- See [docs/conventions/angular-secondary-entry-points.md](../../../../docs/conventions/angular-secondary-entry-points.md) for the full rule and recovery steps.
