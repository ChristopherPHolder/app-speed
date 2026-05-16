# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

## Layout

Treat this repository as a single-context repo.

- Read root `CONTEXT.md` if it exists.
- Read `docs/adr/` for architectural decisions relevant to the area being changed.
- If `CONTEXT.md` does not exist yet, proceed silently and rely on the existing docs under `docs/`.

## Current repo state

- `CONTEXT.md` is not present today.
- `CONTEXT-MAP.md` is not present today.
- `docs/adr/` exists and should be treated as the primary decision record location.

## File structure

Single-context repo:

```text
/
├── CONTEXT.md
├── docs/adr/
└── apps/
```

## Use the repo's vocabulary

When writing issues, plans, or code explanations, prefer terms already used in the existing docs and ADRs. If a domain term is unclear or missing, document it later rather than inventing competing language in the moment.

## Flag ADR conflicts

If a proposed change contradicts an existing ADR, surface that conflict explicitly instead of silently overriding the earlier decision.
