# ADR-0001: Audit Runs Feature Slice

Status: Superseded  
Date: 2026-03-03
Superseded By: ADR-0004

## Decision

Implement Audit Runs as a dedicated Nx feature slice:

- `libs/portal/feature-audit-runs`
- `libs/portal/data-access-audit-runs`
- `libs/portal/ui/audit-runs`

## Supersession Note

This ADR captured the pre-migration frontend direction for Audit Runs.
The repository no longer follows this horizontal portal split.

Audit history now lives inside the audit viewer package as a secondary entry point:

- `libs/audit/portal/viewer/runs`
- `@app-speed/audit/portal/viewer/runs`

The broader architectural decision is recorded in `ADR-0004: Domain-First Audit Architecture`.

## Context

The feature requires clear separation between page orchestration, API access, and presentational rendering. Existing frontend architecture already follows this pattern.

## Consequences

- Positive: clear ownership boundaries and testability.
- Positive: UI remains transport-agnostic.
- Negative: introduces additional libraries and path aliases.
