# ADR-0002: Audit Runs API Error Contract

Status: Accepted  
Date: 2026-03-03

## Decision
New Audit Runs endpoints return structured error payloads with:
- `code`
- `message`
- optional `details`

Codes:
- `INVALID_QUERY`
- `INVALID_CURSOR`
- `RUN_NOT_FOUND`
- `INTERNAL_ERROR`

## Context
The UI requires deterministic handling for malformed query input, cursor decoding, not-found states, and generic server failures.

## Consequences
- Positive: frontend can branch on stable machine-readable codes.
- Positive: improved troubleshooting with optional details.
- Negative: endpoint-specific error types increase API surface.
