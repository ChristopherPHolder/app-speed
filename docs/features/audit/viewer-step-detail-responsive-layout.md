# Viewer Step Detail: Responsive Layout Notes

Status: Draft
Owner: Christopher Holder
Last Updated: 2026-03-14

## Purpose

This document explains the review comment:

> The page lacks a stronger responsive layout strategy.

It describes what that means in the current `viewer-step-detail` implementation, why it matters from a Material 3 perspective, and how the screen could be improved for both mobile and desktop without changing the underlying data model.

## Scope

Primary component:

- `libs/portal/feature-audit/src/lib/viewer-container/viewer-step-details.component.ts`

Supporting components that drive most of the rendered layout:

- `libs/portal/feature-audit/src/lib/viewer-container/viewer-step-metric-summary.component.ts`
- `libs/portal/feature-audit/src/lib/viewer-container/viewer-file-strip.component.ts`
- `libs/portal/ui/viewer-diagnostics/src/lib/viewer-diagnostic.component.ts`
- `libs/portal/ui/viewer-diagnostics/src/lib/viewer-diagnostic-panel.component.ts`

## What "Lacks a Stronger Responsive Layout Strategy" Means

The page is technically responsive, but it is not strongly adaptive.

Today, the component renders the same vertical sequence regardless of screen size:

1. Metrics
2. Filmstrip
3. Insights / diagnostics / passed audits

The visual structure remains mostly the same on mobile and desktop. The main difference is that some elements wrap or slightly adjust sizing. For example:

- The metrics section changes from one column to two columns at a breakpoint.
- The expansion panel header height is adjusted for smaller screens.

That is responsive in a narrow sense, but it is not a stronger adaptive layout strategy. The page mostly shrinks and wraps rather than reorganizing around content priority.

## Why This Matters

Material 3 guidance encourages layouts to adapt by content role, not just by width.

In this screen, the content is not all equally important:

- Primary content: failing insights and diagnostics
- Secondary content: metric summary, screenshot filmstrip, passed audits

The current layout gives all of these sections roughly equal placement weight in one stacked flow. That creates a few issues:

- On mobile, users may need to scroll through support content before reaching the most actionable diagnostics.
- On desktop, wide screens are underused because the page remains a mostly linear column.
- The screen does not communicate a strong primary-vs-secondary hierarchy.

## Material 3 and Angular Material Guidance

These references support the recommendation to move toward a more adaptive composition:

- [Canonical layouts](https://developer.android.com/design/ui/mobile/guides/layout-and-content/canonical-layouts)
- [Supporting pane layout](https://m3.material.io/foundations/layout/canonical-layouts/supporting-pane)
- [Responsive/adaptive design](https://developer.android.com/develop/ui/views/layout/responsive-adaptive-design-with-views)
- [Bottom sheets](https://m3.material.io/components/bottom-sheets/overview)
- [Cards guidelines](https://m3.material.io/components/cards/guidelines)
- [Lists overview](https://m3.material.io/components/lists/overview)
- [Angular CDK layout overview](https://v14.material.angular.dev/docs-content/overviews/cdk/layout/layout)
- [Angular Material custom styling guidance](https://v14.material.angular.dev/docs-content/guides/customizing-component-styles)

### Key takeaway from the guidance

The important point is not "add more breakpoints."

The important point is:

- identify the primary task content
- identify supporting content
- change page composition as more space becomes available

That is the gap in the current screen.

## What a Better Layout Strategy Would Look Like

### Mobile / Compact Width

Goal:

- Get users to failing diagnostics as quickly as possible

Suggested direction:

- Keep insights and diagnostics at the top
- Collapse or defer support content such as metrics and screenshots
- Use a section toggle, tabs, or a bottom sheet for supporting content

Why:

- The user is most likely here to understand what failed and what to fix
- Metrics and screenshots are useful, but they are supporting context
- A compact screen should emphasize focus and reduce initial scroll depth

### Medium and Expanded Widths

Goal:

- Use horizontal space to reinforce hierarchy

Suggested direction:

- Main content area: insights and diagnostics
- Supporting pane: metric summary, filmstrip, and optionally passed audit summary

Why:

- This matches the Material 3 supporting-pane pattern
- It gives the most important content the most space
- It allows secondary content to stay visible without dominating the page

## Concrete Improvement Direction

### 1. Recompose the page by role

Instead of a single stacked column, split the page into:

- primary region for diagnostic accordions
- secondary region for summary/support content

On smaller screens, the secondary region can collapse into a support section. On larger screens, it can become a persistent side pane.

### 2. Move diagnostics ahead of support content on mobile

The mobile flow should likely be:

1. Insights
2. Diagnostics
3. Support content section
4. Passed audits

This reduces friction for the primary audit-review task.

### 3. Use a supporting pane on desktop

A practical desktop layout could be:

- left/main column: diagnostic accordion
- right/support column: metrics, filmstrip, step metadata, passed count

This would make the screen feel intentionally designed for larger widths rather than simply stretched.

### 4. Treat metrics as summary content

Metrics are currently rendered like a bordered list. A better fit would be a summary-card treatment:

- compact metric cards
- stronger value prominence
- lighter explanatory text
- optional deeper explanation on demand

That will make the secondary pane more useful and more scannable.

### 5. Keep passed audits visually subordinate

Passed audits should remain available, but they should not compete with failures.

Suggested direction:

- collapsed by default
- lighter visual weight
- summary count visible before expansion

## Example Breakpoint Strategy

One reasonable implementation direction would be:

- `< 600px`: single-column layout, diagnostics first, support content collapsed
- `600px - 839px`: stacked layout with stronger grouping, optional support-content toggle
- `>= 840px`: two-pane layout with diagnostics as primary and support content as secondary

This is less about the exact numbers and more about using explicit layout states rather than relying only on local wrapping behavior.

## Angular-Specific Implementation Notes

If this moves into implementation later, Angular Material and CDK already provide the right building blocks.

Recommended direction:

- use page-level layout composition instead of deeper per-component overrides
- use CDK breakpoint utilities to switch between compact, medium, and expanded layouts
- avoid heavy internal overrides of Material expansion panel anatomy

This matters because Angular Material guidance explicitly warns that deep style overrides against internal structure are brittle over time.

## Summary

The current screen is responsive in the basic sense that it scales down and wraps. It is not strongly adaptive because it does not change layout composition based on content priority.

The main improvement is to stop treating metrics, screenshots, diagnostics, and passed audits as one equal vertical stack. Instead:

- make diagnostics primary
- make metrics and screenshots secondary
- adapt composition by screen class
- use Material 3 supporting-pane patterns on larger screens
- reduce clutter and improve focus on smaller screens

That would make the viewer-step-detail experience feel much more intentional on both mobile and desktop.
