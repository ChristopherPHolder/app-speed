# Design Document: Audit History

Status: Active  
Owner: Christopher Holder  
Last Updated: 2026-07-31

## Summary

Audit History lists scheduled, running, and completed audits from newest to oldest. The shared history feature serves
both the cross-feature route at `/audits/history` and the user-flow route at `/audits/user-flow/history`. Every row
navigates to the installed feature's canonical lifecycle/result page; for user-flow audits that route is
`/audits/user-flow/:id`.

## Ownership

- `libs/audit/core/api-contract` defines the canonical history contract at `GET /api/audits/history`.
- `libs/audit/core/api-runtime` implements the shared history handler.
- `libs/audit/core/persistence` owns cursor pagination over shared run lifecycle records.
- `libs/audit/core/feature-history` owns the reusable Angular history page, API client, and table.
- `libs/audit/user-flow/api-contract` exposes the feature-filtered contract at
  `GET /api/audits/user-flow/history`.
- `libs/audit/user-flow/api-runtime` installs the user-flow history handler by filtering shared history by feature kind.
- `libs/audit/user-flow/feature-viewer` owns `/audits/user-flow/:id` and the user-flow result experience.
- `apps/api` composes the core and user-flow HTTP groups, while `apps/portal` supplies the endpoint and result-route
  configuration to the shared history feature.

The shared `libs/audit/core/*` projects do not import the user-flow implementation. Application composition maps the
feature-neutral history row (`kind`, `auditId`) to an installed feature route.

## Routing

- `/audits/history`: all installed audit kinds, backed by `GET /api/audits/history`.
- `/audits/user-flow/history`: user-flow audits, backed by `GET /api/audits/user-flow/history`.
- `/audits/user-flow/:id`: canonical user-flow lifecycle and result page.
- `/audits` redirects to `/audits/history`.

## Runtime Behavior

- Runs are ordered by `(createdAt, id)` descending.
- The default page size is `25`; accepted limits are `1` through `100`.
- Status filters default to `SCHEDULED`, `IN_PROGRESS`, and `COMPLETE`.
- Queue position is populated only for scheduled runs.
- Manual refresh and cursor-based next/previous navigation are available.

## Error Handling

The history endpoints return structured `INVALID_QUERY`, `INVALID_CURSOR`, and `INTERNAL_ERROR` responses. The UI
renders actionable errors and preserves the current page state when a transient request fails.
