# Soft navigation experiment

Soft navigations are navigation steps in a user flow. Set `softNavigation: true` on **Start Navigation**,
perform an interaction that updates the URL and renders new content in the same document, then use **End
Navigation**. Load the application before starting the soft navigation. Use a snapshot afterwards when you
also want to audit the resulting page state.

In the builder, add the optional **Soft Navigation (Experimental)** property to Start Navigation and select
True. Omitting it, or selecting False, keeps the existing page-load behavior. It is not a timespan option.

```json
[
  { "type": "customStep", "step": "startNavigation", "name": "Initial page load" },
  { "type": "navigate", "url": "https://example.com" },
  { "type": "customStep", "step": "endNavigation" },
  { "type": "customStep", "step": "startNavigation", "name": "Product details", "softNavigation": true },
  { "type": "click", "offsetX": 40, "offsetY": 15, "selectors": [{ "segments": ["#product"] }] },
  { "type": "customStep", "step": "endNavigation" }
]
```

The result stays `gatherMode: "navigation"` with `configSettings.softNavigation: true`. Standard First
Contentful Paint and Largest Contentful Paint audits appear in Performance. The viewer labels the step
“soft navigation.” Ordinary timespans no longer receive the previous `soft-nav-fcp` / `soft-nav-lcp` audits.
Previously saved reports retain their original audits.

## Lighthouse patch

Lighthouse is pinned to **13.6.0** with a pnpm patch in `patches/lighthouse@13.6.0.patch`. The patch ports the
runtime and settings changes from [GoogleChrome/lighthouse#17075](https://github.com/GoogleChrome/lighthouse/pull/17075)
at commit `4deeacee1a6328eb6e0ce6a87cf588e5cd42f81e`, authored by ChristopherPHolder. Upstream Lighthouse's
Apache-2.0 license headers are preserved. Remove the patch and version pin once a released implementation
can replace it. Installation applies the patch automatically, including the runner's packaged dependencies.

The patch changes navigation gathering, same-document navigation waiting, trace processing, audit filtering,
and metric timing. It does not build upstream's flow-report UI changes; exported Lighthouse HTML uses its
existing Navigation label, while App Speed distinguishes soft navigation steps.

This requires Chrome 149 or newer. The experimental implementation preserves page state, skips storage
reset and `about:blank`, and uses observed throttling rather than Lantern simulation. Metrics use Chrome's
soft-navigation trace events and navigation IDs. Page-load-only audits are filtered out or become not
applicable. FCP/LCP retain Lighthouse's page-load scoring curves; those thresholds are experimental for
soft navigations.

Use one soft navigation per step. Multiple detections produce a warning and only the first is measured.
No detection produces explicit metric errors instead of reusing the initial page's paint timing. Run
warnings and metric errors are displayed in the viewer.

## Verification

```shell
pnpm exec nx run audit-user-flow-runner:integration
```

This uncached target starts an isolated local HTTP fixture and Puppeteer's installed Chrome. It verifies:

- A page load, a soft navigation through the real replay extension, and an ordinary timespan in one flow.
- Standard FCP/LCP results, navigation metadata, preserved local storage, and no audit errors.
- Missing soft navigation errors with a bounded wait.
- Multiple soft navigation warnings.

Set `APP_SPEED_SOFT_NAV_ARTIFACTS` to an absolute output directory to retain the real flow result JSON and
HTML from the successful browser test. These are generated test artifacts, not repository fixtures.

## Screenshots

The builder screenshot demonstrates the optional navigation setting. The results screenshot uses actual
Lighthouse output from the Chrome 152 browser test, with a 250 ms delayed SPA render. For this UI review,
Playwright fulfills the API responses with that captured result; database persistence is not exercised.

![Soft navigation configured on Start Navigation](screenshots/soft-navigation-builder.png)

![Soft navigation metrics in Performance](screenshots/soft-navigation-results.png)
