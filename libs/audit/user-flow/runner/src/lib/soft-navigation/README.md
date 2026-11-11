# Soft-navigation collection

`ExperimentalUserFlow` routes an explicit `navigate` step through Lighthouse's native
navigation runner. An interaction enclosed by `startNavigation` / `endNavigation`
uses `startSoftNavigationGather` instead.

The custom collector owns the Lighthouse driver and instrumentation lifecycle. It
records the existing document, preserves storage, and adds a navigation-mode gather
step directly to the flow. The flow waits for the triggering navigation and a
subsequent network-idle window before ending collection. Results retain navigation
identity from the base artifacts through the report; there is no report-mode rewrite.

## Lighthouse compatibility boundary

`gatherer.ts` targets the installed Lighthouse 13.6 APIs. It uses internal driver,
phase collection, configuration, and user-flow step registration APIs. The browser
integration suite must pass when upgrading Lighthouse.

Lighthouse does not have a soft-navigation gather mode. We reuse its timespan-capable
artifact/audit selection and device preparation helpers, but do not call its timespan
runner or user-flow timespan API. The trace gatherer's timespan context supplies the
clock marker needed to identify the existing document's main frame.

Artifacts are saved with `GatherContext.gatherMode = 'navigation'`. Each selected
audit receives an interval context through a local adapter so stock computations do
not require a new document's `navigationStart`. The existing paint overrides measure
FCP/LCP from Chrome's soft-navigation events; INP covers the recorded interaction
interval. Audit exclusions and device settings still apply. This retains the previous
supported audit coverage rather than enabling document-load-only audits.

The adapted resolved configuration is registered alongside the gather step in
Lighthouse's runner-options map. Exported artifacts alone are not sufficient for a
stock Lighthouse re-audit: they also require this soft-navigation audit configuration.

Normal completion and failed waits release instrumentation, throttling, and the CDP
session. Flow disposal awaits collector setup and cleanup when replay is interrupted,
before the caller releases the page/browser. Completed steps are registered only after
cleanup succeeds, keeping artifact and flow-mode indexes aligned.
