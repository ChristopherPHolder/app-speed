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

## Audit and category coverage

A soft navigation is an interval that ends in a new view, so `config.ts` resolves the
stock configuration for `timespan` and for `snapshot` and merges the two artifact and
audit sets. The timespan artifacts record the transition; the snapshot artifacts read
the document the transition produced, during the final `getArtifact` phase. Without
this merge a step reports only the performance and best-practices pair a timespan
reports, because `initializeConfig` drops the artifacts, audits and then the categories
its gather mode does not support.

Audit references come from the `navigation` resolution, filtered to the audits this
collection configures. A category may declare the modes it supports, and accessibility,
SEO and agentic browsing are not resolved for an interval at all, so merging the two
collection resolutions alone would lose the references they hold for the other mode.
The merge keeps the stock ordering of categories and references.

Settings come from the timespan resolution, which replaces simulated throttling with
observed throttling: there is no page load to simulate.

Audits only a page load supports are not configured, for one of three reasons. Some need
an artifact no collection mode gathers, such as the document's own response body
(`charset`) or the WebMCP gatherers. Some declare `supportedModes: ['navigation']`
because they describe the document request rather than the transition: the request chain
(`redirects`, `redirects-http`, `server-response-time`, `http-status-code`, `canonical`,
`hreflang`, `is-crawlable`), the response headers (`has-hsts`, `origin-isolation`,
`clickjacking-mitigation`, `trusted-types-xss`) and the lantern page-load estimates
(`speed-index`, `interactive`, `max-potential-fid`). The rest need artifacts from both
collection modes at once, such as `csp-xss` and `unused-css-rules`, which neither
resolution configures on its own. Category scores for a soft navigation are therefore
computed from fewer audits than a navigation's.

A gatherer that branches on the gather mode behaves here as it does for an interval,
because collection passes `timespan`. `AgentResourceDiscovery` skips its `Link` header
path, so a site that advertises agent resources only through that header fails
`ard-schema` on a soft-navigation step while passing it on a navigation step.

A caller's `onlyCategories` and `onlyAudits` select against the merged configuration, so
they may name any category a flow reports. `skipAudits` applies to every resolution.

Artifacts are saved with `GatherContext.gatherMode = 'navigation'`. Each selected
audit receives an interval context through a local adapter so stock computations do
not require a new document's `navigationStart`. The existing paint overrides measure
FCP/LCP from Chrome's soft-navigation events; INP covers the recorded interaction
interval. Audit exclusions and device settings still apply.

The adapted resolved configuration is registered alongside the gather step in
Lighthouse's runner-options map. Exported artifacts alone are not sufficient for a
stock Lighthouse re-audit: they also require this soft-navigation audit configuration.

Normal completion and failed waits release instrumentation, throttling, and the CDP
session. Flow disposal awaits collector setup and cleanup when replay is interrupted,
before the caller releases the page/browser. Completed steps are registered only after
cleanup succeeds, keeping artifact and flow-mode indexes aligned.
