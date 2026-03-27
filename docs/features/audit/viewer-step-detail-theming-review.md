# Viewer Step Detail: Theming Review

Status: Draft
Owner: Christopher Holder
Last Updated: 2026-03-14

## Purpose

This document expands the review note:

> Material theming is only partially applied.

It explains:

- why this matters
- how the issue shows up in the current `viewer-step-detail` experience
- how to identify similar inconsistencies elsewhere
- what resolution patterns would move the UI closer to a coherent Angular Material / Material 3 implementation

## Scope

Primary viewer code reviewed:

- `libs/audit/portal/viewer/src/lib/steps/viewer-step-details.component.ts`
- `libs/audit/portal/viewer/src/lib/steps/viewer-step-metric-summary.component.ts`
- `libs/audit/portal/viewer/src/lib/steps/viewer-film-strip.component.ts`
- `libs/audit/portal/viewer/src/lib/diagnostics/viewer-diagnostic-panel.component.ts`
- `libs/ui/status-badge/src/status-badge.component.ts`
- `libs/ui/status-badge/src/status-badge.constants.ts`

Theme entry points reviewed:

- `libs/ui/theme/_theme.scss`
- `libs/ui/theme/styles.scss`

## Motivation

### 1. Consistency

Material 3 is designed as a system, not as a loose set of components. If some parts of the page use theme roles and others use hard-coded styling, the UI starts to look assembled rather than designed.

In practice, that means:

- similar states can look different
- hierarchy becomes less clear
- the page feels less polished

### 2. Accessibility

Material theming is not only about brand color. It is also about using roles that preserve readable contrast and predictable emphasis. Hard-coded colors like raw red, orange, or gray can easily drift away from accessible pairings when placed on different surfaces.

### 3. Adaptability

Theming should make it easier to support:

- light and dark modes
- contrast adjustments
- future brand updates
- reusable styling across custom components

If custom components bypass the theme, those future changes become expensive and error-prone.

### 4. Maintainability

When visual decisions are scattered across inline styles, constants, and component-local CSS, it becomes hard to answer basic questions like:

- what is the correct warning color
- which text style should this value use
- how should support surfaces be styled

A stronger theme layer makes these decisions easier to centralize.

## Relevant Material / Angular Material Guidance

The following official references support the recommendations in this document:

- [Themes overview](https://developer.android.com/design/ui/mobile/guides/styles/themes)
- [Material 3 theming codelab](https://developer.android.com/codelabs/m3-design-theming)
- [Android color guidance](https://developer.android.com/design/ui/mobile/guides/styles/color)
- [Angular Material theming guide](https://v14.material.angular.dev/docs-content/guides/theming)
- [Angular Material custom styling guidance](https://v14.material.angular.dev/docs-content/guides/customizing-component-styles)
- [Angular Material theming your own components](https://v9.material.angular.dev/docs-content/guides/theming-your-components)
- [Angular Material note on theme systems: color, density, typography](https://v17.material.angular.dev/docs-content/guides/duplicate-theming-styles)

Key themes from those references:

- a theme includes more than one color choice
- color should be assigned by role, not by arbitrary hard-coded value
- typography and density are part of the theme system
- custom components should participate in theming intentionally
- deep or brittle styling overrides against Material internals should be avoided

## Current State in This Repo

The repo already has a real Angular Material theme:

- `_theme.scss` defines a theme with `mat.define-theme(...)`
- `styles.scss` applies `theme.core` and `theme.all-component-theme`

That foundation is good. The gap is that the custom viewer components are not consistently authored as theme consumers.

### Evidence of partial adoption

#### Theme-aware styles already exist

Some viewer diagnostics code already uses Material system tokens:

- `--mat-sys-outline`
- `--mat-sys-surface-variant`
- `--mat-sys-on-surface-variant`
- `--mat-sys-primary`

That means the codebase is already moving in the right direction.

#### Theme bypasses still exist

Important parts of the same experience still use direct values:

- `red`, `orange`, `gray`, `green` in `status-badge.constants.ts`
- inline red text for `displayValue` in `viewer-diagnostic-panel.component.ts`
- `#ccc`, `medium`, and `large` in `viewer-step-metric-summary.component.ts`
- `groove gray` and custom shadow values in `viewer-film-strip.component.ts`
- inline `style.color` bindings based on raw status constants

The result is a mixed system:

- part token-driven
- part hard-coded
- part Material
- part local custom styling

## What "Partially Applied" Means Here

It does not mean the app has no theme.

It means the app theme exists, but the viewer experience does not consistently derive its visual decisions from that theme.

More specifically:

- theme coverage is uneven
- semantic states are not mapped through theme roles
- typography is ad hoc
- component surfaces are inconsistent
- custom components are not fully integrated into the theme layer

## How to Identify More Theming Inconsistencies

This is the reusable part of the review. The checklist below can be applied to this viewer and to other UI areas in the repo.

### 1. Look for hard-coded colors

Common signals:

- named colors like `red`, `green`, `orange`, `gray`
- hex values like `#ccc`
- rgba values for UI surfaces or state styling
- inline `[style.color]` bindings

Why it matters:

- these values do not automatically stay aligned with the active theme
- they often ignore contrast, dark mode, and semantic role pairing

Example from current code:

- status colors in `status-badge.constants.ts`

Resolution pattern:

- replace with theme tokens or app-level semantic tokens derived from theme roles

### 2. Look for inline styles carrying semantic meaning

Common signals:

- `style="color: red"`
- `[style.color]="..."`
- inline spacing or text styles used to indicate importance

Why it matters:

- semantic styling becomes invisible to the theme layer
- reuse becomes difficult

Example from current code:

- `displayValue` rendered with inline red text in the diagnostic panel

Resolution pattern:

- use semantic classes or component variants that are backed by theme-aware CSS

### 3. Look for typography that is not role-based

Common signals:

- `font-size: medium`
- `font-size: large`
- one-off font weights used inconsistently
- text hierarchy expressed only through local CSS

Why it matters:

- Material 3 uses type roles to preserve hierarchy and consistency
- ad hoc font sizes drift over time

Example from current code:

- metric label and value sizing in `viewer-step-metric-summary.component.ts`

Resolution pattern:

- map text usage to a small set of theme-backed roles such as title, label, and body styles

### 4. Look for surfaces styled as custom effects instead of themed surfaces

Common signals:

- groove borders
- hand-tuned shadows
- arbitrary mixes with white or black
- custom borders that do not align with surface roles

Why it matters:

- surfaces stop looking related
- large support blocks can feel visually disconnected from the rest of Material UI

Example from current code:

- filmstrip frame border and shadow styling

Resolution pattern:

- define surface treatments using outline, surface, surface-variant, and corresponding on-surface roles

### 5. Look for semantic state encoded only as a raw color

Common signals:

- alert = red
- pass = green
- warn = orange

Why it matters:

- state meaning should survive changes in palette and theme mode
- color alone is a weak semantic contract

Example from current code:

- `STATUS_COLOR` constants driving both icon and metric value styling

Resolution pattern:

- define semantic app tokens for audit states and pair them with iconography, labels, and surfaces

### 6. Look for theme definitions that stop at color only

Common signals:

- theme file defines only color
- typography and density decisions remain local to components

Why it matters:

- components cannot inherit a consistent type and spacing system
- repeated local styling grows over time

Example from current code:

- `_theme.scss` defines color only

Resolution pattern:

- add explicit typography and density configuration where appropriate and map custom components onto that system

### 7. Look for custom components that are not themed through a shared layer

Common signals:

- custom UI components styling themselves independently
- repeated color logic across components
- status styles duplicated in multiple places

Why it matters:

- visual rules become fragmented
- updates require editing many files

Example from current code:

- status, metrics, and filmstrip all define local appearance decisions separately

Resolution pattern:

- move shared visual logic into a component theme mixin or a small semantic token layer

## Resolution Patterns

The goal is not to replace every custom style with a Material component. The goal is to make custom UI use the same theme system intentionally.

### 1. Expand the theme from color-only to a fuller system

Current state:

- the theme is defined, but only color is configured

Improve by:

- defining explicit typography choices
- defining density choices where needed
- treating these as app-level design decisions rather than per-component styling

Why:

- Angular Material explicitly treats themes as color, density, and typography systems

### 2. Introduce semantic app tokens for audit states

Recommended token layer:

- `--app-audit-alert`
- `--app-audit-warn`
- `--app-audit-info`
- `--app-audit-pass`

These should map back to Material roles instead of raw named colors.

Why:

- it preserves semantics even if the palette changes
- it centralizes visual state logic

### 3. Move theme-dependent styling into shared theme-aware styles

Instead of:

- local inline colors
- per-component hard-coded surfaces

Prefer:

- theme mixins for custom components
- shared semantic classes
- token-based component styling

Why:

- Angular Material recommends theming custom components intentionally

### 4. Replace local typography guesses with consistent roles

Instead of:

- `medium`
- `large`
- arbitrary local emphasis

Prefer:

- a deliberate mapping for labels, values, section headings, and helper text

Why:

- consistent type roles improve hierarchy and readability

### 5. Standardize support surfaces

For support blocks such as:

- metric cards
- filmstrip frames
- stack-pack panels

Prefer:

- consistent outline treatment
- consistent surface/container colors
- restrained shadow usage

Why:

- Material 3 relies heavily on surface hierarchy to organize content

### 6. Audit contrast and theme resilience

Before accepting a custom color or surface decision, ask:

- does this still work in dark mode
- does this still work with higher contrast needs
- is the foreground paired with the right background role
- does the meaning survive without relying only on hue

Why:

- Material guidance emphasizes role pairing and accessible contrast, not just decorative palette use

## Current Inconsistencies and Suggested Resolutions

| Area | Current inconsistency | Why it is a problem | Suggested resolution |
| --- | --- | --- | --- |
| Status badge | Uses raw named colors in `status-badge.constants.ts` | Not theme-resilient and not role-based | Replace with semantic audit tokens derived from theme roles |
| Diagnostic header value | Uses inline red text | Bypasses theme and may fail contrast expectations | Use a semantic value class with token-backed color |
| Metrics summary | Uses `#ccc`, `medium`, `large`, inline color binding | Typography and borders are ad hoc | Map to type roles, outline tokens, and semantic state tokens |
| Filmstrip | Uses groove border and custom shadow | Looks visually separate from Material surfaces | Use surface/outline roles and more restrained containment styling |
| Theme layer | Defines color only | Typography and density drift into local component CSS | Expand theme configuration and align custom components to it |

## Practical Review Workflow for Future Screens

When reviewing another screen, use this order:

1. Find the global theme entry point.
2. Check whether custom components use theme tokens or bypass them.
3. Search for hard-coded colors and inline styles.
4. Search for ad hoc typography values.
5. Compare state styling across similar components.
6. Check whether semantic states depend on color alone.
7. Decide whether the fix belongs in:
   - the app theme
   - shared semantic tokens
   - a custom component theme mixin
   - the local component only

This helps avoid solving every visual inconsistency as a one-off CSS patch.

## Summary

The viewer-step-detail experience already sits on top of a valid Angular Material theme, but the custom viewer UI does not consistently consume that theme as a system.

The main problem is not the absence of theming. The problem is fragmented theming:

- some styling is token-based
- some styling is hard-coded
- some semantic states are centralized
- some are embedded directly in components

The resolution is to treat custom viewer components as first-class theme consumers:

- broaden the theme beyond color only
- define semantic audit tokens
- standardize typography and surfaces
- replace inline and hard-coded values
- use a repeatable review checklist to catch future inconsistencies

That will improve consistency, accessibility, adaptability, and long-term maintainability.
