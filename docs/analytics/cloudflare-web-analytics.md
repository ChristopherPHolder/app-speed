# Portal analytics

The portal loads Cloudflare Web Analytics on `appspeed.dev` only. Localhost and `dev.appspeed.dev` do not load the beacon. The module in `apps/portal/src/index.html` installs the supplied tracking script with public site token `d563032dd21941aca829e11a78de26d1`.

Cloudflare provides basic traffic and performance metrics without analytics cookies. Its beacon handles SPA navigation automatically; the application does not send custom events. Google Analytics, its consent storage logic, the banner and Cookie settings have been removed.

Use manual snippet installation in the Cloudflare dashboard for `appspeed.dev`. Do not also enable automatic script injection, which would duplicate the beacon and bypass the application hostname restriction.

Unlike the previous Google integration, the Cloudflare beacon observes browser URLs directly rather than application route templates. Keep personal information and secrets out of URLs. Update the site's privacy notice to describe Cloudflare Web Analytics; removing the banner does not replace that notice or determine consent requirements for any future tracking.

Existing Google cookies and saved consent choices are no longer read or refreshed by the app. This cleanup does not actively erase existing browser storage; the old Google cookies expire according to their original lifetime.

## Verification

Run `pnpm exec nx test portal`, `pnpm exec nx lint portal` and `pnpm exec nx build portal`.

On localhost and `dev.appspeed.dev`, confirm that no Cloudflare beacon or Google Analytics script is requested and no consent banner or Cookie settings button appears.

After deployment to `appspeed.dev`, confirm there is one `beacon.min.js` script with the site token, no Google Analytics requests, and no analytics cookies. Navigate between portal routes and back, then confirm traffic appears in the Cloudflare dashboard. Browser checks with mocked collection requests cannot verify dashboard ingestion.

References: [setup](https://developers.cloudflare.com/web-analytics/get-started/), [SPA measurement](https://developers.cloudflare.com/web-analytics/get-started/web-analytics-spa/), [privacy](https://developers.cloudflare.com/web-analytics/about/).
