# UI Review: Viewer Step Detail

Status: Draft
Owner: Christopher Holder
Last Updated: 2026-03-14

## Scope

This document reviews the UI structure and visual presentation of the viewer step detail experience for:

- `libs/audit/portal/viewer/src/lib/steps/viewer-step-details.component.ts`

The review also includes the supporting components that determine most of the rendered layout and visual density:

- `libs/audit/portal/viewer/src/lib/steps/viewer-step-metric-summary.component.ts`
- `libs/audit/portal/viewer/src/lib/steps/viewer-film-strip.component.ts`
- `libs/audit/portal/viewer/src/lib/diagnostics/viewer-diagnostic.component.ts`
- `libs/audit/portal/viewer/src/lib/diagnostics/viewer-diagnostic-panel.component.ts`
- `libs/ui/status-badge/src/status-badge.component.ts`
- `libs/ui/theme/_theme.scss`

No code changes were made as part of this review.

## Summary

The current implementation has a solid data structure and reasonable sectioning, but the overall presentation does not yet feel like a deliberate Angular Material / Material 3 experience.

The main issue is not the content model. The issue is that Angular Material components are being used, while much of the spacing, hierarchy, color, interaction behavior, and responsive layout are still controlled by custom one-off styling. As a result:

- Mobile and desktop layouts read as the same stacked flow with limited adaptation by role.
- Visual hierarchy is inconsistent across metrics, screenshots, and diagnostics.
- Some interactions are less accessible or less discoverable than they should be.
- Theme usage is only partial, with several colors and surfaces still hard-coded.

## Current Structure

At the top level, the viewer step detail renders in this order:

1. Metric summary
2. Screenshot filmstrip
3. Diagnostics sections (`Insights`, `Diagnostics`, `Passed`)

This is simple, but it gives all content roughly equal layout weight. On desktop, that misses an opportunity to separate primary content from supporting content. On mobile, it creates a long vertical stack that can make failing audits harder to reach and scan.

## Key Observations

### 1. The page lacks a stronger responsive layout strategy

The current top-level component is effectively a single-column container with a max width and padding. That works mechanically, but it does not meaningfully adapt between mobile and desktop.

Implication:

- Desktop space is underused.
- Mobile users may need to scroll through support content before reaching the most actionable diagnostics.

### 2. Diagnostic panels carry most of the UX, but their header structure is cramped

The diagnostic accordion is the most important part of the screen. Each panel header currently combines the status icon, title, and display value inside a compact inline structure.

Implication:

- Long titles and values are harder to scan.
- Mobile wrapping behavior is less controlled.
- The content does not take full advantage of Material expansion panel affordances such as title/description separation.

### 3. The metrics section is functional but not visually strong

The metrics summary is currently a grid of bordered rows with a global "Expand/Collapse view" text control. This works, but it reads more like a utility table than a high-signal summary.

Implication:

- Important metrics do not stand out enough.
- Descriptions are all-or-nothing, which can increase visual noise.
- The mobile presentation is dense relative to the value of the content.

### 4. The filmstrip is desktop-biased

The filmstrip uses fixed-height thumbnails, hover scaling, and a horizontally scrollable list. That behavior is acceptable on desktop, but it is not especially touch-first.

Implication:

- Hover affordances do not translate to mobile.
- The fixed frame sizing can feel cramped on small screens.
- The filmstrip competes visually with diagnostics without clearly earning that space.

### 5. Material theming is only partially applied

The workspace already defines an Angular Material theme and some components use Material system tokens, but several UI elements still rely on hard-coded colors, shadows, borders, and inline styles.

Examples:

- Status colors are `red`, `orange`, `gray`, and `green`.
- The diagnostic header display value uses inline red text.
- The filmstrip uses a groove border and custom shadow styling.

Implication:

- The UI will feel less consistent across theme evolution.
- The design reads as "Material components with custom skinning" instead of one coherent system.

### 6. Some interaction patterns should be more accessible

The metrics expand/collapse control is currently a clickable `div`, not a button. Chips are used as metadata labels without stronger structural grouping.

Implication:

- Keyboard and assistive technology behavior is weaker than it should be.
- The control hierarchy is less obvious than standard Material actions.

## Potential Improvements

These are suggestions only. They are intentionally design-focused and do not prescribe exact implementation details yet.

### 1. Treat diagnostics as primary content and everything else as secondary

Desktop direction:

- Keep diagnostics in the main content column.
- Move metrics and screenshots into a secondary column or support rail.

Mobile direction:

- Keep the failing insights and diagnostics near the top.
- Collapse or defer support content such as screenshots and expanded explanatory text.

Why:

- The most actionable content should be easiest to reach and scan.
- Responsive layout should change by content role, not just by width.

### 2. Rework diagnostic headers around Material expansion panel structure

Suggested direction:

- Use `mat-panel-title` for the audit title.
- Use `mat-panel-description` for value or secondary metadata.
- Allow the title/value layout to stack more naturally on smaller screens.

Why:

- This matches Angular Material’s intended panel anatomy more closely.
- It creates cleaner scanning on both mobile and desktop.
- It avoids over-compressing important information into a single inline span.

### 3. Redesign the metrics area as high-signal summary cards

Suggested direction:

- Represent metrics as compact cards instead of row items.
- Show the metric name, score/value, and status as the core content.
- Move longer explanatory copy behind a more targeted disclosure pattern.

Responsive direction:

- Mobile: single-column or 2-up card layout.
- Desktop: 3-up grid for faster comparison.

Why:

- Metrics are summary information and should read as such.
- Cards create clearer separation and stronger at-a-glance comprehension.

### 4. Make the filmstrip touch-first and easier to scan

Suggested direction:

- Use clearer frame spacing and simpler containment.
- Consider scroll snapping or a selected-frame preview pattern.
- Reduce reliance on hover-only feedback.

Why:

- The current hover treatment is desktop-centric.
- A touch-first pattern will improve mobile usability without hurting desktop.

### 5. De-emphasize passed audits

Suggested direction:

- Keep passed audits collapsed by default.
- Show a count and lighter visual treatment.
- Preserve access without giving the section the same visual weight as failures.

Why:

- Failed insights and diagnostics are the core task flow.
- Passed audits are supportive information, not primary action items.

### 6. Replace one-off styling with Material 3 tokens and component patterns

Suggested direction:

- Move status colors and text emphasis onto theme-aware tokens.
- Avoid inline styling for semantic values such as display status.
- Prefer Material surfaces, shape, and typography hierarchy over custom visual effects.

Why:

- This will make the experience feel more coherent and easier to maintain.
- It also aligns better with the Angular Material 21 stack already in use.

### 7. Strengthen interaction semantics

Suggested direction:

- Replace clickable `div` controls with real Material buttons.
- Expose expanded/collapsed state with appropriate accessibility attributes.
- Group metadata chips more deliberately, or replace them with lighter labels if chips feel too prominent.

Why:

- Material patterns are clearer, more consistent, and more accessible.
- This is especially important on mobile and for keyboard navigation.

## Design Direction by Breakpoint

### Mobile

Priorities:

- Faster path to failing insights
- Lower visual density
- Better touch affordances
- Clearer expansion panel scanning

Good candidates:

- Single-column flow
- Collapsed support sections
- Cleaner panel headers with natural wrapping
- Reduced copy shown by default

### Desktop

Priorities:

- Better use of horizontal space
- Stronger distinction between summary and detail
- Easier comparison across metrics and audit items

Good candidates:

- Main diagnostics column plus support rail
- Metrics displayed as cards or grouped summary blocks
- Filmstrip placed as secondary supporting content

## Material / Angular Material Guidance Reviewed

The following references informed the review:

- Angular Material custom styling guidance: <https://v14.material.angular.dev/docs-content/guides/customizing-component-styles>
- Angular Material theming guidance: <https://v14.material.angular.dev/docs-content/guides/theming>
- Angular Material duplicate theming/styles guidance: <https://v17.material.angular.dev/docs-content/guides/duplicate-theming-styles>
- Angular Material chips API: <https://next.material.angular.dev/docs-content/api-docs/material-chips>
- Material adaptive and canonical layout guidance: <https://developer.android.com/design/ui/mobile/guides/layout-and-content/canonical-layouts>
- Android responsive/adaptive layout guidance: <https://developer.android.com/develop/ui/views/layout/responsive-adaptive-design-with-views>
- Android accessibility touch target guidance: <https://support.google.com/accessibility/android/answer/7101858?hl=en>

## Recommended Next Step

Before implementation, convert these observations into a concrete redesign proposal with:

- A mobile layout direction
- A desktop layout direction
- A section hierarchy proposal
- A Material-aligned component mapping for metrics, diagnostics, and filmstrip

That would make the follow-up implementation phase much more precise and lower-risk.
