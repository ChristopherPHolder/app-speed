# Design Document: Audit Runs Feature

Status: Active  
Owner: Christopher Holder  
Last Updated: 2026-03-27

## Summary
The Audit Runs feature adds a top-level experience for browsing queued, running, and completed audits from newest to oldest. The page is available at `/audit-runs` and uses a paginated table with a dedicated run details route at `/audit-runs/:id`.

## Goals
- Show all run states (`SCHEDULED`, `IN_PROGRESS`, `COMPLETE`) in one list.
- Expose stable pagination under active inserts.
- Allow quick drill-down from list rows.
- Keep the feature inside the audit domain rather than split across top-level horizontal portal libraries.

## Non-Goals
- Retry/cancel run actions.
- Authorization changes.
- Data model migrations.

## Backend Architecture
- New API endpoints:
  - `GET /api/audit/runs`
  - `GET /api/audit/runs/:id`
- `libs/audit/control-plane` owns the route handlers and HTTP contract.
- `libs/audit/persistence` provides paginated summaries via `listRunsPage` and detail lookups via `getRunSummaryById`.
- Cursor uses `(createdAtMs, id)` with descending order (`createdAt desc`, `id desc`).
- Queue position is computed only for `SCHEDULED`.

## Frontend Architecture
- `libs/audit/portal/runs`:
  - Exposes `auditRunsRoutes` for the portal shell.
  - Owns the route-level page components for list and detail.
  - Owns the API client and DTOs under `src/lib/api`.
  - Owns reusable presentational components under `src/lib/components`.
- `apps/portal` remains the composition root and lazy-loads the runs module from `@app-speed/audit/portal/runs`.

## Routing
- `/audit-runs`: list page
- `/audit-runs/:id`: active run details page
- Completed rows navigate to existing `/user-flow/viewer?auditId=<id>`.

## Runtime Behavior
- Default page size is `25`.
- Status filters default to all statuses.
- Poll interval is `5` seconds while viewing page 1.
- Manual refresh is always available.

## Error Handling
- Structured API errors for new endpoints:
  - `INVALID_QUERY`
  - `INVALID_CURSOR`
  - `RUN_NOT_FOUND`
  - `INTERNAL_ERROR`
- UI renders actionable messaging and avoids hard failures on transient network errors.
