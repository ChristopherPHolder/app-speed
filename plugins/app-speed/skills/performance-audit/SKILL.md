---
name: performance-audit
description: Audit a website's loading and interaction performance with App Speed (Lighthouse user flows) and explain the results. Use when the user asks to audit, measure, benchmark or compare the performance or Core Web Vitals of a URL or user journey, or to check an App Speed audit.
---

# Performance audit with App Speed

App Speed runs Lighthouse user flows in a real browser. Use the `app-speed` MCP tools; the first call opens a
browser sign-in if the account is not connected yet.

## 1. Choose where the audit belongs

Call `get_workspaces`. If the user names a workspace or project, use its `projectId`. Otherwise ask which project
to use, and mention that omitting it puts the audit in Public View, where anyone can see it. Never guess an ID.

## 2. Build the user flow

`schedule_user_flow_audit` takes `{ title, device: "mobile" | "desktop", steps }`. Steps run in order:

- Page load: `startNavigation`, `navigate` to the URL, `endNavigation`.
- Interaction: `startTimespan`, the interaction steps (`click`, `change`, `keyDown`/`keyUp`, `scroll`,
  `waitForElement`, …), then `endTimespan`.
- Current state: `snapshot`.

Lighthouse steps are `{ "type": "customStep", "step": "<name>" }`. Interaction steps use the Chrome DevTools
Recorder format, for example `{ "type": "click", "selectors": [["#checkout"]], "offsetX": 1, "offsetY": 1 }`.
Prefer stable selectors (ids, `aria/` selectors) and keep flows short. Default to `mobile` unless asked otherwise.

## 3. Wait for the result

Scheduling returns immediately. Poll `get_audit_status` about every 20–30 seconds, reporting the queue position,
until `status` is `COMPLETE`. Audits usually take one to several minutes.

## 4. Explain the result

Call `get_user_flow_audit_result`. For each step, report the category scores, the metrics that miss their targets
(LCP ≤ 2.5 s, CLS ≤ 0.1, TBT ≤ 200 ms, INP ≤ 200 ms) and the top opportunities with their estimated savings.
Link the full report with the returned `url`. If the run failed, show the error and suggest a fix to the flow,
such as a wrong selector or a missing wait.

## Comparing runs

Use `list_audits` with a `search` on the title to find earlier runs of the same flow, then compare their results
step by step and call out regressions.

## Safety

Workspace management tools change shared data. Destructive tools require a `confirm` argument that matches the
target's name or email: confirm the exact target with the user before calling them.
