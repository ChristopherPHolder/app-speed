# ADR-0001: Audit Runs Feature Slice

Status: Accepted  
Date: 2026-03-03

## Decision
Implement Audit Runs as a dedicated Nx feature slice:
- `libs/portal/feature-audit-runs`
- `libs/portal/data-access-audit-runs`
- `libs/portal/ui/audit-runs`

## Context
The feature requires clear separation between page orchestration, API access, and presentational rendering. Existing frontend architecture already follows this pattern.

## Consequences
- Positive: clear ownership boundaries and testability.
- Positive: UI remains transport-agnostic.
- Negative: introduces additional libraries and path aliases.
