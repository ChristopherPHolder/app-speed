# Failed user-flow results

A replay failure keeps the run outcome `FAILURE`. Its stored error now includes `diagnostics` with the zero-based
`stepIndex`, one-based `stepOrdinal`, `lastSuccessfulStepIndex` (null if nothing completed), and an ordered step log.
Each entry records its type, measurement name when available, URL, selector alternatives, effective timeout and
`completed`, `failed` or `skipped` status. Replay steps and Lighthouse measurements have different indices.

The runner asks Lighthouse for results from completed measurements before disposing the flow and browser. It stores
these as `error.partialResult` with the failed run using the existing error JSON column, in both PostgreSQL and SQLite.
No migration is required. Recovery is bounded to 30 seconds; an unavailable partial report does not replace the replay
failure. In-progress measurements and subsequent measurements are excluded by Lighthouse.

The HTTP result endpoint exposes the structured error and partial Lighthouse result. The audit detail page highlights
the failed replay action and renders saved measurements using the existing viewer. MCP `get_user_flow_audit_result`
returns `error.diagnostics` and a top-level `partialResult` with the same category scores, metrics and recommendations
as successful results. Historical errors without diagnostics or partial results remain supported. Project authorization
continues to apply to all result reads. The standalone HTML report endpoint remains available for successful runs.

Diagnostics omit change values, cookie parameters, key contents, expressions and raw exception text. URLs exclude
credentials, query strings and fragments. Only simple CSS identifiers/combinators are retained; selectors containing attributes, text, functional pseudo
selectors, quoting, escapes or unsupported syntax are redacted in full.
Failure screenshots and raw browser logs are omitted because they can expose page/form data; `diagnostics.evidence`
makes this explicit. Completed Lighthouse results retain the existing result content and access policy.
