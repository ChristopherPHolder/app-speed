# Frontend Architecture: Audit Runs

Status: Draft  
Owner: Christopher Holder  
Last Updated: 2026-03-03

## Feature Slice Layout
- `libs/portal/feature-audit-runs`: route-level orchestration.
- `libs/portal/data-access-audit-runs`: API client + DTOs.
- `libs/portal/ui/audit-runs`: presentational table/filter component.

## Responsibilities

### Feature Layer
- Owns page state and route navigation.
- Triggers refresh/pagination/status filtering.
- Polls every 5 seconds when cursor is `null` (page 1).
- Handles row click behavior:
  - `COMPLETE` -> `/user-flow/viewer?auditId=...`
  - `SCHEDULED|IN_PROGRESS` -> `/audit-runs/:id`

### Data-Access Layer
- Encodes query params for list/detail endpoints.
- Exposes typed interfaces used by feature layer.
- Keeps transport details out of UI components.

### UI Layer
- Receives immutable inputs and emits events only.
- Renders:
  - Status filter controls
  - Manual refresh button
  - Previous/Next pagination controls
  - Table columns: status, title, created, duration, queue, result
- Contains no HTTP/state orchestration logic.

## Testing Strategy
- Feature unit tests verify polling cadence and routing decisions.
- UI component test verifies render + event emission without `HttpClient`.
- Cypress test verifies list render, pagination, and detail navigation.
