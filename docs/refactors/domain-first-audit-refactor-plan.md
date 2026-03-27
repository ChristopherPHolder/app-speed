# Domain-First Audit Refactor Plan

## Problem Statement

The current repository structure is organized primarily by delivery mechanism and technical layer instead of by the dominant business domain. The main audit workflow is spread across frontend feature libraries, frontend data-access libraries, backend application modules, runner libraries, database libraries, and shared schema libraries. That split makes the codebase harder to reason about because one conceptual change to the audit product crosses several top-level areas that appear unrelated even though they belong to the same lifecycle.

The result is architectural drag:
- `portal`, `api`, and `runner` behave like thin deployable shells in practice, but the surrounding library layout treats them as if they were the primary architectural boundaries.
- Audit authoring, scheduling, execution, persistence, result viewing, and run history all use the same vocabulary and lifecycle, yet they are scattered across unrelated top-level library groups.
- Nx project tags and dependency constraints do not currently express the intended boundaries, so the structure is mostly conventional rather than enforced.
- The existing `feature` / `data-access` / `ui` pattern improves local frontend organization, but at repository scale it creates more horizontal slices around a single domain instead of making the domain more discoverable.

This refactor should improve module boundaries, ownership, and co-location without changing runtime behavior, public API behavior, endpoint shapes, queue semantics, or persistence behavior.

## Solution

Adopt a domain-first architecture centered on a single `Audit` bounded context, because the current codebase is dominated by one cohesive audit lifecycle rather than multiple independent product domains.

Within that model:
- `portal`, `api`, and `runner` remain thin applications and composition roots, not bounded contexts.
- Audit-specific code is reorganized under a single audit domain umbrella with colocated slices for domain model, contracts/schema, persistence, API handlers, runner execution, and portal-facing features.
- Cross-cutting technical modules remain horizontal only where they are truly generic, such as design system primitives, shared visual components that are not audit-specific, observability, and low-level infrastructure foundations.
- The refactor is delivered in multiple phases with temporary compatibility exports and gradual import migration so the workspace stays functional throughout.
- Nx tags and dependency constraints are updated to enforce the new architectural intent after the new boundaries exist.

`portal`, `api`, and `runner` should not be treated as bounded contexts for this refactor. They are runtime and delivery boundaries. Modeling them as bounded contexts would mostly preserve the current architectural mismatch and continue to scatter one audit lifecycle across several top-level modules. The domain boundary should instead follow the shared audit language and behavior, while runtime-specific concerns sit underneath that domain.

## Commits

1. Write and commit an architecture decision record for the domain-first direction, including the explicit decision that `portal`, `api`, and `runner` are applications and composition roots rather than bounded contexts.

2. Introduce a target taxonomy for Nx tags that distinguishes domain modules, application shells, and cross-cutting technical modules. Keep the first pass permissive enough that no existing code breaks yet.

3. Create empty audit-domain library shells and public entrypoints for the future audit model, audit schema/contracts, audit persistence, audit API, audit runner execution, and audit portal slices. Do not move consumers yet.

4. Move the pure audit domain model into the new audit-domain model module. Keep the existing shared exports as compatibility re-exports so current imports still compile.

5. Move the audit schema and wire-format definitions into the new audit-domain contracts/schema module. Preserve existing exported types and schemas through compatibility re-exports.

6. Migrate audit-specific persistence code into the new audit persistence module. If needed, split generic database runtime concerns from audit-specific repository concerns so the audit repository no longer lives inside a generic server bucket.

7. Re-export the migrated persistence APIs from the old module so application code can keep working while imports are updated incrementally.

8. Move audit-specific API contracts, error types, and handler logic out of the application-local API modules into the audit API slice. Keep routes and payload shapes unchanged.

9. Update the API application to become a composition root that wires together audit API modules, runner lifecycle modules, persistence, and observability without owning audit business logic directly.

10. Move runner-side audit execution logic, claim/complete/heartbeat communication, and related orchestration into the audit runner execution slice. Keep the runner application as a thin executable shell.

11. Update the runner application to depend on the new audit runner execution entrypoint instead of the old runtime-specific library, preserving current command behavior.

12. Move the portal audit builder and viewer feature logic under the audit domain’s portal slice so authoring and viewing live next to the audit model and contracts they consume.

13. Migrate the portal run-history experience into the same audit domain umbrella instead of keeping it as a separate top-level portal feature family. Keep run history as part of the same audit domain rather than a separate bounded context.

14. Consolidate portal-side audit HTTP clients and DTO ownership under the audit domain so frontend transport code lives near the frontend features and contracts it serves.

15. Decide which UI components remain truly generic and keep only those in cross-cutting UI libraries. Move audit-specific presentational components under the audit domain portal slice, while leaving design system primitives and genuinely reusable visual building blocks horizontal.

16. Update path aliases and imports a slice at a time: first shared domain consumers, then persistence consumers, then API consumers, then runner consumers, then portal consumers. Keep compatibility exports in place until each consumer group is migrated.

17. Tighten Nx dependency constraints to reflect the new architecture: application shells may depend on domain and cross-cutting modules, domain modules may depend only on allowed domain or cross-cutting modules, and audit modules may not reach back into application shells.

18. Remove obsolete aliases, temporary re-exports, and old top-level audit libraries only after all consumers are migrated and the dependency rules pass cleanly.

19. Update architecture docs to describe the final domain-first layout, replacing any earlier guidance that treated top-level horizontal slices as the primary repository structure.

## Decision Document

- The repository will treat `Audit` as the primary bounded context for this refactor.

- `portal`, `api`, and `runner` remain applications and runtime boundaries, not bounded contexts.

- Audit authoring, run history, execution, persistence, and result viewing stay inside one bounded context because they share a single lifecycle, vocabulary, and data model.

- Run history is not split into a separate bounded context. It is another facet of the same audit domain.

- Cross-cutting technical modules are retained only where they are genuinely reusable outside the audit domain. The expected survivors are design-system primitives, clearly generic UI building blocks, observability, and low-level infrastructure foundations.

- Audit-specific persistence is treated as part of the audit domain, even if it continues to use shared database infrastructure underneath.

- Audit-specific API contracts and handler logic are treated as part of the audit domain, even though they are served by the API application.

- Audit-specific runner orchestration and execution logic are treated as part of the audit domain, even though they are launched by the runner application.

- The refactor will allow aggressive project and import renaming. Compatibility exports are a migration aid, not a long-term abstraction.

- The migration will happen in multiple phases. Old and new modules may coexist temporarily, but the plan should converge quickly and remove duplicate ownership once imports have moved.

- Nx module-boundary enforcement is part of the refactor scope. The new architecture must be expressed in dependency rules, not just in folder names.

- The refactor does not introduce new business capabilities. It reorganizes ownership and boundaries without intentionally changing runtime behavior.

- The earlier frontend feature-slice pattern remains useful inside a domain when it improves clarity, but it is no longer the top-level organizing principle for the repository.

- If a future feature introduces a truly independent business language and lifecycle, it can become a separate bounded context later. This refactor should not invent additional bounded contexts before that evidence exists.

## Testing Decisions

- A good test for this refactor proves that observable behavior is unchanged while code ownership moves. Tests should focus on public contracts, data flow, routing outcomes, queue semantics, persistence semantics, and exported module behavior rather than internal implementation details.

- Existing tests are the default safety net. The refactor is movement-first, so new characterization tests are added only when a move exposes a blocker or leaves an important public boundary effectively unprotected.

- The audit domain model and schema modules should continue to be protected by schema and value-object tests that validate accepted inputs, rejected inputs, and stable derived behavior.

- The audit persistence module should continue to be protected by contract-style repository tests that verify template creation, run creation, claiming behavior, pagination, filtering, completion behavior, and result storage.

- The audit runner execution slice should continue to be protected by tests around runner-to-API behavior, queue lifecycle behavior, and any error-handling logic that is part of its public contract.

- The audit portal slice should continue to be protected by route-level and feature-level tests that validate builder behavior, viewer behavior, run-history polling and navigation behavior, and other externally visible UI state transitions.

- Nx project-scoped test runs should be used throughout the migration so each moved slice can stay green independently. Affected lint, test, and build runs should be used at phase boundaries before removing compatibility exports.

- Useful prior art already exists in the current repository: schema tests, audit repository contract tests, runner queue tests, runner lifecycle tests, builder state tests, viewer tests, and audit-runs page tests. Those should be preserved and repointed before writing substantial new coverage.

## Out of Scope

- Any API contract change, including endpoint paths, payload shapes, response schemas, or SSE event shapes.

- Any behavior change to scheduling, queue position semantics, runner activation and shutdown policy, result persistence, or frontend UX flows.

- Database schema changes, data migrations, or persistence model redesign beyond relocating ownership.

- Tooling refactors unrelated to module-boundary enforcement, including deployment executor redesign or broader Nx tooling cleanup.

- Design-system redesign or generic UI rework unless a component clearly needs to move because it is audit-specific.

- Observability redesign beyond moving audit-specific ownership where necessary.

- Premature creation of multiple new bounded contexts without evidence that the business domain has actually split.

## Further Notes

- This plan intentionally treats the current repository as a product with one dominant domain. That is a better fit for the existing code than mirroring the deployment topology at the top level.

- Temporary compatibility exports are important for keeping the migration reviewable, but they should be short-lived. Once the last consumer of an old boundary is removed, the old boundary should be deleted rather than left as a permanent alias.

- Existing architecture notes about audit runs and the user-flow audit feature remain valuable as domain knowledge, but they should be updated or superseded once the new domain-first structure is established.

- Companion documents:
  - `docs/adr/ADR-0004-domain-first-audit-architecture.md`
  - `docs/refactors/domain-first-audit-target-taxonomy.md`
