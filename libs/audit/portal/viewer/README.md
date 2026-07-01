# @app-speed/audit/portal/viewer

Vertical audit viewer module for the portal.

Exports:

- `AuditViewerContainer`
- `AuditSummaryComponent`
- `ViewerDiagnosticComponent`
- `ViewerMarkdownTextComponent`

Internal structure:

- `src/lib/page`: inline result container rendered by `/user-flow/results/:id`
- `src/lib/summary`: audit overview and score presentation
- `src/lib/steps`: step-level result rendering, filmstrip, and metric summaries
- `src/lib/diagnostics`: detailed diagnostic panels and supporting visualizers

The portal shell lazy-loads this module from `@app-speed/audit/portal/viewer`.
