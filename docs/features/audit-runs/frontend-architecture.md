# Frontend Architecture: Audit Runs

Status: Active  
Owner: Christopher Holder  
Last Updated: 2026-03-27

## Module Layout
- `libs/audit/portal/runs/src/lib/audit-runs.routes.ts`: exported routes for `/audit-runs`.
- `libs/audit/portal/runs/src/lib/audit-runs-page.component.ts`: list-page orchestration.
- `libs/audit/portal/runs/src/lib/audit-run-details-page.component.ts`: detail-page orchestration.
- `libs/audit/portal/runs/src/lib/api`: list/detail HTTP client and DTOs.
- `libs/audit/portal/runs/src/lib/components`: presentational table and details components.

## Responsibilities

### Route-Level Pages
- Own page state and route navigation.
- Trigger refresh, pagination, and status filtering.
- Poll every 5 seconds when cursor is `null` (page 1).
- Handle row click behavior:
  - `COMPLETE` -> `/user-flow/viewer?auditId=...`
  - `SCHEDULED|IN_PROGRESS` -> `/audit-runs/:id`

### API Layer
- Encodes query params for list/detail endpoints.
- Exposes typed interfaces used by the route pages and presentational components.
- Keeps transport details out of UI components.

### Components Layer
- Receives immutable inputs and emits events only.
- Renders:
  - Status filter controls
  - Manual refresh button
  - Previous/Next pagination controls
  - Table columns: status, title, created, duration, queue, result
- Contains no HTTP/state orchestration logic.

## Testing Strategy
- Page unit tests verify polling cadence and routing decisions.
- Component test verifies render + event emission without `HttpClient`.
- Cypress test verifies list render, pagination, and detail navigation.
