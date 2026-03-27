# @app-speed/audit/portal/builder

Vertical audit builder module for the portal.

Exports:
- `auditBuilderRoutes`
- `BuilderComponent`
- `AuditBuilderApiService`
- `AuditProgressService`
- `AuditBuilderComponent`

Internal structure:
- `src/lib/feature`: NgRx state, effects, and route-level builder orchestration
- `src/lib/api`: builder-specific HTTP and audit progress services
- `src/lib/components`: reusable builder form and field components
