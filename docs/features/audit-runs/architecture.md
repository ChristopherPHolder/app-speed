# Design Document: Audit Runs Feature

Status: Draft  
Owner: Christopher Holder  
Last Updated: 2026-03-03

## Summary
The Audit Runs feature adds a top-level experience for browsing queued, running, and completed audits from newest to oldest. The page is available at `/audit-runs` and uses a paginated table with a dedicated run details route at `/audit-runs/:id`.

## Goals
- Show all run states (`SCHEDULED`, `IN_PROGRESS`, `COMPLETE`) in one list.
- Expose stable pagination under active inserts.
- Allow quick drill-down from list rows.
- Keep frontend architecture split into `feature`, `data-access`, and `ui` slices.

## Non-Goals
- Retry/cancel run actions.
- Authorization changes.
- Data model migrations.

## Backend Architecture
- New API endpoints:
  - `GET /api/audit/runs`
  - `GET /api/audit/runs/:id`
- `libs/server/db` provides paginated summaries via `listRunsPage`.
- Cursor uses `(createdAtMs, id)` with descending order (`createdAt desc`, `id desc`).
- Queue position is computed only for `SCHEDULED`.

## Frontend Architecture
- `libs/portal/feature-audit-runs`:
  - Route container pages.
  - Polling orchestration (5s on first page only).
  - Navigation decisions by run state.
- `libs/portal/data-access-audit-runs`:
  - HTTP contracts and DTOs.
  - API methods for list/detail.
- `libs/portal/ui/audit-runs`:
  - Dumb table/filter/pagination component.
  - No `HttpClient` usage.

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
