# Frontend Architecture: Audit History

Status: Active  
Owner: Christopher Holder  
Last Updated: 2026-07-02

## Module Layout

- `libs/audit/portal/viewer/runs/src/lib/audit-history.routes.ts`: exported routes for `/user-flow/results/history`.
- `libs/audit/portal/viewer/runs/src/lib/audit-history-page.component.ts`: history-page orchestration.
- `libs/audit/portal/viewer/runs/src/lib/api`: run-history HTTP client and DTOs.
- `libs/audit/portal/viewer/runs/src/lib/components`: presentational history table.

## Responsibilities

### Route-Level Pages

- Own page state and route navigation.
- Trigger refresh, pagination, and status filtering.
- Handle row click behavior:
  - `COMPLETE` -> `/user-flow/results/:id`
  - `SCHEDULED|IN_PROGRESS` -> `/user-flow/results/:id`

### API Layer

- Encodes query params for the run-history list endpoint.
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
- Cypress test verifies redirect, history render, pagination, and canonical result navigation.
