# @app-speed/audit-builder-ui

UI package for audit-builder-specific Angular components and assets.

This library is the audit-builder UI layer. It should contain presentational components, UI-only helpers, and builder-specific assets such as icons. Keep routing, store logic, HTTP/SSE, and other feature or data-access concerns out of this package.

## Entry Points

- `@app-speed/audit-builder-ui`
  - root package entrypoint
  - currently exports `AuditBuilderUiComponent`
- `@app-speed/audit-builder-ui/icons`
  - secondary entrypoint for audit-builder icon registration
  - exports `provideAuditBuilderIcons()`
- `@app-speed/audit-builder-ui/status-dialog`
  - secondary entrypoint for the loading dialog surface
  - exports `StatusDialog` and `StatusDialogViewModel`
- `@app-speed/audit-builder-ui/form-fields`
  - secondary entrypoint for audit builder form field UI
  - currently reserved for extracted field components

## Structure

- `src/index.ts`
  - root public API
- `src/lib/audit-builder-ui.component.ts`
  - current root component placeholder
- `icons/src/index.ts`
  - public API for the `icons` secondary entrypoint
- `icons/src/lib/icons.ts`
  - raw SVG strings and icon name constants
- `icons/src/lib/icons.provide.ts`
  - Angular provider that registers builder badge icons with `MatIconRegistry`
- `icons/src/lib/icons.stories.ts`
  - Storybook gallery for the icon set
- `status-dialog/src/index.ts`
  - public API for the `status-dialog` secondary entrypoint
- `status-dialog/src/lib/status-dialog.ts`
  - presentational loading dialog body for builder progress
- `status-dialog/src/lib/status-dialog-view-model.ts`
  - UI-facing view model for the dialog status copy
- `form-fields/src/index.ts`
  - public API for the `form-fields` secondary entrypoint
- `vitest.config.mts`
  - shared Vitest config for both `src/**` and `icons/src/**`

## Icons

The `icons` secondary entrypoint currently provides two registered SVG icons:

- `lighthouse-badge`
- `puppeteer-badge`

Use them by registering the provider once at an app, route, or story boundary:

```ts
import { provideAuditBuilderIcons } from '@app-speed/audit-builder-ui/icons';

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
- `status-dialog/src/**/*.spec.ts` covers the status dialog secondary entrypoint

Run:

- `pnpm exec nx test audit-builder-ui`
- `pnpm exec nx lint audit-builder-ui`
- `pnpm exec nx build audit-builder-ui`

## Notes

- Nx project name: `audit-builder-ui`
- Tags: `type:domain`, `scope:audit`, `runtime:web`, `layer:ui`
- The root entrypoint is still minimal. As more builder UI pieces move in, export them from `src/index.ts` and keep shared icon registration in the `icons` secondary entrypoint.
- Candidate extractions from `libs/audit/portal/builder` are tracked in [MIGRATION-CANDIDATES.md](./MIGRATION-CANDIDATES.md).
- Secondary entrypoint naming must stay aligned with the root package name.
  - Use `@app-speed/audit-builder-ui/icons`
  - Use `@app-speed/audit-builder-ui/form-fields`
  - Do not introduce alternate aliases such as `@app-speed/audit-builder-ui-icons` or slash-mismatched variants
- After renaming the package name or secondary entrypoint aliases, run `pnpm exec nx reset` before trusting incremental builds.
- See [docs/conventions/angular-secondary-entry-points.md](../../../../docs/conventions/angular-secondary-entry-points.md) for the full rule and recovery steps.
