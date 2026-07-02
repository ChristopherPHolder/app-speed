# Design Document: Audit History

Status: Active  
Owner: Christopher Holder  
Last Updated: 2026-07-02

## Summary

Audit History provides the result-history experience for browsing queued, running, and completed audits from newest to oldest. The page is available at `/user-flow/results/history`; every row opens the canonical result route at `/user-flow/results/:id`.

## Goals

- Show all run states (`SCHEDULED`, `IN_PROGRESS`, `COMPLETE`) in one list.
- Expose stable pagination under active inserts.
- Allow quick drill-down from list rows into the canonical result view.
- Keep the feature inside the audit domain rather than split across top-level horizontal portal libraries.

## Non-Goals

- Retry/cancel run actions.
- Authorization changes.
- Data model migrations.

## Backend Architecture

- New API endpoints:
  - `GET /api/audit/runs`
  - `GET /api/audit/runs/:id/details`
- `libs/audit/api-runtime` owns the route handlers and HTTP contract.
- `libs/audit/persistence` provides paginated summaries via `listRunsPage` and result-route hydration via `getRunDetailsById`.
- Cursor uses `(createdAtMs, id)` with descending order (`createdAt desc`, `id desc`).
- Queue position is computed only for `SCHEDULED`.

## Frontend Architecture

- `libs/audit/portal/viewer/runs`:
  - Exposes `auditHistoryRoutes` as a secondary entry point of the viewer package.
  - Owns the route-level page component for history.
  - Owns the API client and DTOs under `src/lib/api`.
  - Owns reusable presentational components under `src/lib/components`.
- `libs/audit/portal/builder` owns the `/user-flow/results/*` route tree and lazy-loads the history entry point from `@app-speed/audit/portal/viewer/runs`.

## Routing

- `/user-flow/results`: redirects to `/user-flow/results/history`.
- `/user-flow/results/history`: history page.
- `/user-flow/results/:id`: canonical result route for every run state.

## Runtime Behavior

- Default page size is `25`.
- Status filters default to all statuses.
- Manual refresh is always available.

## Error Handling

- Structured API errors for new endpoints:
  - `INVALID_QUERY`
  - `INVALID_CURSOR`
  - `RUN_NOT_FOUND`
  - `INTERNAL_ERROR`
- UI renders actionable messaging and avoids hard failures on transient network errors.
