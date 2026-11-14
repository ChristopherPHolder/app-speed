# ADR-0008: Shared Material 3 design system

Status: Accepted
Date: 2026-11-14

## Context

The portal is built with Angular Material, but the theme in `libs/ui/theme` only wired up Material's system tokens
and `libs/ui` exported two components. Each feature filled the gaps itself. An inventory of `apps/portal` and
`libs/**` found literal colours in 28 component style blocks, pixel radii in 31, shadows outside the elevation scale
in 10 and ad-hoc font sizes in 24, alongside seven different page widths and several copies of the same page header,
link card, status pill and empty state. The audit viewer used CSS keyword colours (`red`, `blue`), which rendered
passed audits in red and failed contrast for warnings. Tracked in
[#260](https://github.com/ChristopherPHolder/app-speed/issues/260).

## Decision

App Speed follows Material Design 3, and **all UI comes from the shared library `libs/ui`**.

**Tokens.** `libs/ui/theme` is the only place a visual value is declared. Angular Material's `--mat-sys-*` tokens
are the source for colour roles, the type scale, shape, elevation and state-layer opacity. The M3 tokens Material
does not emit live under `--ui-*`: spacing on the 4dp grid, motion durations and easings, extended status colour
roles (success, warning), page gutters and widths. Window size classes are Sass mixins in `_layout.scss` and
constants in `@app-speed/ui/layout`. The theme is emitted with `color-scheme`, so every token resolves in light and
dark; the portal sets `color-scheme: light`.

**Components.** Standard controls are Angular Material components, themed by the tokens and not restyled. A pattern
used by more than one feature is a component in `libs/ui`, exposed as its own secondary entry point
(`@app-speed/ui/<name>`) with a story. Feature libraries compose those; they don't declare literal colours, radii,
shadows, font sizes or breakpoints.

**Documentation.** The Storybook in `apps/design-system` is the reference. Foundations documents each token family
from the live theme, Material documents how each Material component is used here, Components documents the shared
components, and Patterns shows feature UI. A toolbar toggle switches the colour scheme.

**Enforcement.** The workspace ESLint rule `@nx/workspace-no-hardcoded-colors` (in `tools/eslint-rules`) reports literal
colours in Angular component styles and inline `style` attributes. It is an error. Nx module boundaries already
restrict `type:ui` libraries to depend only on other UI and platform libraries.

## Consequences

- A new visual value is a change to the theme, reviewed once, rather than a literal in a feature.
- Features can be checked in dark before a dark theme ships, because nothing bypasses the tokens.
- Exceptions need a reason next to them: artwork with fixed brand colours and canvas exports that must not depend on
  the page's theme disable the rule with a comment.
- Radii, shadows, font sizes and breakpoints are covered by convention and review, not by lint. The rule can grow if
  that proves insufficient.
- Component SCSS files are outside ESLint's reach; they follow the same convention.

See [the design system convention](../conventions/design-system.md) for day-to-day guidance.
