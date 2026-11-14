# UI

The shared design system. App Speed follows Material Design 3 and **all UI comes from this library**: the theme and
its tokens, and the components shared between features. It contains no business logic.

- `theme/` — the Angular Material theme plus the `--ui-*` tokens, layout mixins and utilities.
- `<component>/` — one secondary entry point per shared component, imported as `@app-speed/ui/<component>`.
- `layout/` — window size classes for TypeScript.
- `docs/` — the Foundations and Material guidance shown in Storybook.

See [the design system convention](../../docs/conventions/design-system.md) and
[ADR-0008](../../docs/adr/ADR-0008-shared-design-system.md).

## Running Storybook

Run `nx serve design-system` to start the shared Storybook locally.

## Running unit tests

Run `nx test ui` to execute the unit tests.
