# Frontend Architecture: Audit History

Status: Active  
Owner: Christopher Holder  
Last Updated: 2026-07-31

## Module Layout

- `libs/audit/core/feature-history/src/lib/audit-history.routes.ts`: reusable history route entry point.
- `libs/audit/core/feature-history/src/lib/audit-history-page.component.ts`: route-level state and orchestration.
- `libs/audit/core/feature-history/src/lib/api`: endpoint-neutral HTTP client and history models.
- `libs/audit/core/feature-history/src/lib/components`: presentational history table.
- `apps/portal/src/app/shell/shell.routes.ts`: installs the all-audit and user-flow route configurations.

## Installed Routes

- `/audits/history` calls `/api/audits/history`.
- `/audits/user-flow/history` calls `/api/audits/user-flow/history`.
- Selecting any installed user-flow row navigates to `/audits/user-flow/:id`, regardless of lifecycle state.

The core feature accepts its endpoint and result-route mapper through route data. It therefore remains feature-neutral
and does not import `libs/audit/user-flow/*`.

## Responsibilities

### Route-Level Page

- Own refresh, pagination, status filtering, loading, and error state.
- Read and validate the endpoint/result-route configuration from route data.
- Delegate row navigation to the application-supplied result-route mapper.

### API Layer

- Encode `limit`, `cursor`, and `status` query parameters.
- Expose transport models shared by the route page and presentational table.
- Keep HTTP details out of components.

### Components

- Receive immutable inputs and emit user actions.
- Render status filters, refresh and pagination controls, and the history table.
- Contain no HTTP or route orchestration.

## Testing Strategy

- Page tests verify polling, pagination, filtering, route configuration, and navigation.
- Table tests verify rendering and event emission without `HttpClient`.
- Portal routing tests verify both installed history routes and the canonical user-flow result mapping.
- Cypress covers history rendering, pagination, and result navigation through the composed application.
