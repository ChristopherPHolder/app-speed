# Portal analytics

The portal uses GA4 measurement ID `G-W51NXLKGXB` on `appspeed.dev` only. Localhost and `dev.appspeed.dev` never load the Google tag. The consent UI is available in every environment.

The Google script is injected only after an explicit acceptance or a saved, unexpired acceptance (basic consent mode). Rejecting a first visit sends no commands or requests to Google. Advertising storage, advertising user data and personalization remain denied. Choices are saved in local storage for 180 days; unavailable storage falls back to a choice for the current page session.

Cookie settings is available below the footer. Withdrawing consent disables collection, removes host-only `_ga` cookies and reloads the page to unload Google's listeners. Consent changes in other tabs are synchronized. A reload also ensures that a slow, pending Google script cannot subsequently resume collection after withdrawal.

## GA4 setup before deployment

In GA4 Admin → Data streams → the web stream for this ID, **turn off Enhanced Measurement**. The application owns page-view events for Angular navigation. Enhanced Measurement can independently send history, form, search and outbound-link events, including raw URLs, even with `send_page_view: false`.

Application page views use route templates (for example `/audits/user-flow/:id`) and exclude query strings and fragments. Referrers are blank and the page title is fixed to avoid transmitting audit content. No custom audit, trace, form or upload events are collected. The GA runtime still collects its standard device/session information after acceptance.

Review and publish the site's own privacy notice with the site's operator details, Google Analytics purpose, recipients, retention and applicable transfer information before launch. The banner links to Google's data-use explanation; it is not a substitute for the site's privacy notice.

## Verification

Run `pnpm exec nx test portal`, `pnpm exec nx lint portal` and `pnpm exec nx build portal`.

On production, use a clean browser profile and inspect Network: no `gtag/js` or GA collection request should appear before consent or after rejection. Accept, confirm one script and one page view per navigation, and verify in GA4 Realtime. Reopen Cookie settings and reject: the page reloads, GA cookies disappear, and no further collection occurs. Confirm the same behavior in a second open tab.

References: [Google consent mode](https://developers.google.com/tag-platform/security/concepts/consent-mode), [manual page views](https://developers.google.com/analytics/devguides/collection/ga4/views).
