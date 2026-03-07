# ADR-0003: Audit Runs Refresh and Pagination

Status: Accepted  
Date: 2026-03-03

## Decision
- Use cursor pagination based on `(createdAt, id)` with descending order.
- Default page size is `25`.
- Enable automatic refresh every 5 seconds only on the first page (`cursor = null`).
- Provide manual refresh and previous/next controls.

## Context
Runs are continuously inserted while users browse. Offset pagination can duplicate or skip rows under concurrent writes.

## Consequences
- Positive: stable paging during active queue updates.
- Positive: bounded refresh load by limiting auto-refresh to page 1.
- Negative: opaque cursor handling is more complex than offsets.
