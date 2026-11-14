# Design system convention

App Speed follows [Material Design 3](https://m3.material.io/). **UI comes from the shared library, `libs/ui`.**
The decision is recorded in [ADR-0008](../adr/ADR-0008-shared-design-system.md); the full guidance, with live
examples, is the Storybook in `apps/design-system` (`pnpm exec nx serve design-system`).

## Where UI comes from

| Need                                                                     | Source                                            |
| ------------------------------------------------------------------------ | ------------------------------------------------- |
| A colour, type style, corner, shadow, spacing, duration or breakpoint    | A theme token: `--mat-sys-*` or `--ui-*`          |
| A standard control (button, field, dialog, menu, tab, chip, list, table) | Angular Material, unmodified                      |
| A pattern used by more than one feature                                  | A component in `@app-speed/ui/<name>`             |
| Something only one feature needs                                         | The feature library, composed from the rows above |

If the value or component you need doesn't exist, add it to `libs/ui` first, with a story, then use it.

## Tokens

| Family              | Tokens                                                                                         | Notes                                                        |
| ------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Colour roles        | `--mat-sys-primary`, `--mat-sys-surface-container-low`, `--mat-sys-on-surface-variant`, …      | Pair a fill with its own `on-` colour                        |
| Status colour       | `--ui-success*`, `--ui-warning*`; `--mat-sys-error*` for errors; primary roles for in-progress | Never colour alone: add an icon or label                     |
| Type                | `font: var(--mat-sys-headline-medium)` and the rest of the scale                               | Set the `font` token, not size or weight                     |
| Shape               | `--mat-sys-corner-extra-small` … `--mat-sys-corner-full`                                       | No pixel radii                                               |
| Elevation           | `--mat-sys-level0` … `--mat-sys-level5`                                                        | Prefer tonal surfaces; shadows only for overlapping surfaces |
| Spacing             | `--ui-space-1` (4dp) … `--ui-space-16` (64dp)                                                  | 4dp grid                                                     |
| Motion              | `--ui-motion-duration-*`, `--ui-motion-easing-*`                                               | Always a duration and an easing; honour reduced motion       |
| Layout              | `--ui-page-gutter`, `--ui-page-width-narrow                                                    | medium                                                       | wide`, `--ui-target-size` |     |
| Window size classes | `(width >= 600px)`, `840px`, `1200px`, `1600px`                                                | `_layout.scss` mixins, `@app-speed/ui/layout` constants      |

## Rules

- No literal colours in component styles, including as `var()` fallbacks and inside `color-mix()`. The
  `app-speed/no-hardcoded-colors` lint rule reports them.
- No pixel radii, hand-written `box-shadow`, or standalone `font-size` / `font-weight`.
- Don't restyle Material components beyond their documented tokens.
- Interactive surfaces show state with a state layer, not by moving, scaling or raising.
- Text is sentence case.
- Icons are `<mat-icon>`, not inline SVG or text characters.
- Check a change at 390px wide, with the keyboard, and in the dark scheme in Storybook.

## Exceptions

Two kinds of literal colour are legitimate, and each disables the rule with a comment saying why:

- **Artwork** — brand marks and illustrations with fixed colours.
- **Exports** — images drawn to a canvas for download, which must look the same whatever the page's theme.

## Adding a shared component

1. Create `libs/ui/<name>/` with `ng-package.json`, `public-api.ts` and `src/`, following the
   [secondary entry point convention](angular-secondary-entry-points.md).
2. Add the `@app-speed/ui/<name>` path alias to `tsconfig.base.json`.
3. Build it from tokens and Material components only. Use the `ui-` selector prefix.
4. Add a story under `Components/` covering each variant, and a spec.
5. Replace the feature copies with the shared component in the same change.
