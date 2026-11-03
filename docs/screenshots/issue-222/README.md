# Issue #222 — desktop and mobile visual review

71 screenshots across 36 journey steps. Each pair shows the same state at desktop and mobile widths.

Local demo accounts exercise the real portal, API, PostgreSQL database, permissions, and audit runner. Successful results come from real runs against an HTTPS checkout fixture. Failure, overlap, and downtime history are seeded review examples. The capture deployment uses a quota of two active schedules. Mobile captures use Chromium at 390 × 844; desktop uses 1440 × 1000. Full-page image heights vary. Clerk-hosted authentication, organization creation, and invitation dialogs require live credentials and are excluded; their application entry points are shown.

Reproduce with `pnpm exec nx run portal-e2e:capture-journeys` and a configured `APP_SPEED_TEST_DATABASE_URL`. See [capture setup](../../testing/journey-screenshots.md).

## Guest execution and history

### Guest home

Start a new audit without an account.

| Desktop                                            | Mobile                                           |
| -------------------------------------------------- | ------------------------------------------------ |
| ![Guest home — desktop](desktop/01-guest-home.png) | ![Guest home — mobile](mobile/01-guest-home.png) |

### Mobile navigation

Open the responsive navigation menu.

| Desktop                | Mobile                                                         |
| ---------------------- | -------------------------------------------------------------- |
| Mobile-only navigation | ![Mobile navigation — mobile](mobile/02-mobile-navigation.png) |

### Build an audit

Configure the checkout steps and target device.

| Desktop                                                        | Mobile                                                       |
| -------------------------------------------------------------- | ------------------------------------------------------------ |
| ![Build an audit — desktop](desktop/03-build-manual-audit.png) | ![Build an audit — mobile](mobile/03-build-manual-audit.png) |

### Run progress

Submit the audit and follow its execution.

| Desktop                                                     | Mobile                                                    |
| ----------------------------------------------------------- | --------------------------------------------------------- |
| ![Run progress — desktop](desktop/04-queued-or-running.png) | ![Run progress — mobile](mobile/04-queued-or-running.png) |

### Completed result

Inspect a real runner result and performance scores.

| Desktop                                                        | Mobile                                                       |
| -------------------------------------------------------------- | ------------------------------------------------------------ |
| ![Completed result — desktop](desktop/05-completed-result.png) | ![Completed result — mobile](mobile/05-completed-result.png) |

### Browser history

Find audits associated with this browser.

| Desktop                                                      | Mobile                                                     |
| ------------------------------------------------------------ | ---------------------------------------------------------- |
| ![Browser history — desktop](desktop/06-browser-history.png) | ![Browser history — mobile](mobile/06-browser-history.png) |

### Reopen a result

Return to a completed run from history.

| Desktop                                                      | Mobile                                                     |
| ------------------------------------------------------------ | ---------------------------------------------------------- |
| ![Reopen a result — desktop](desktop/07-reopened-result.png) | ![Reopen a result — mobile](mobile/07-reopened-result.png) |

## Personal space, claiming, and saving

### Save requires a space

See the sign-in prompt for saved audits.

| Desktop                                                             | Mobile                                                            |
| ------------------------------------------------------------------- | ----------------------------------------------------------------- |
| ![Save requires a space — desktop](desktop/08-sign-in-required.png) | ![Save requires a space — mobile](mobile/08-sign-in-required.png) |

### Claim prompt

Demo sign-in reveals the option to claim this browser audit.

| Desktop                                                        | Mobile                                                       |
| -------------------------------------------------------------- | ------------------------------------------------------------ |
| ![Claim prompt — desktop](desktop/09-sign-in-claim-prompt.png) | ![Claim prompt — mobile](mobile/09-sign-in-claim-prompt.png) |

### Personal space onboarding

An empty signed-in space introduces saved audits, schedules, and sharing.

| Desktop                                                                      | Mobile                                                                     |
| ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| ![Personal space onboarding — desktop](desktop/09b-personal-empty-state.png) | ![Personal space onboarding — mobile](mobile/09b-personal-empty-state.png) |

### Claim confirmed

Move the browser audit into the active personal space.

| Desktop                                                              | Mobile                                                             |
| -------------------------------------------------------------------- | ------------------------------------------------------------------ |
| ![Claim confirmed — desktop](desktop/10-claim-confirmed-private.png) | ![Claim confirmed — mobile](mobile/10-claim-confirmed-private.png) |

### Saved definition

Inspect the immutable version created by claiming.

| Desktop                                                               | Mobile                                                              |
| --------------------------------------------------------------------- | ------------------------------------------------------------------- |
| ![Saved definition — desktop](desktop/11-saved-immutable-version.png) | ![Saved definition — mobile](mobile/11-saved-immutable-version.png) |

## Recurring schedules and occurrence history

### Fixed interval

Pin a saved version and choose an elapsed interval.

| Desktop                                                           | Mobile                                                          |
| ----------------------------------------------------------------- | --------------------------------------------------------------- |
| ![Fixed interval — desktop](desktop/12-fixed-interval-editor.png) | ![Fixed interval — mobile](mobile/12-fixed-interval-editor.png) |

### Active schedule

Inspect the next due time and schedule controls.

| Desktop                                                               | Mobile                                                              |
| --------------------------------------------------------------------- | ------------------------------------------------------------------- |
| ![Active schedule — desktop](desktop/13-active-schedule-next-due.png) | ![Active schedule — mobile](mobile/13-active-schedule-next-due.png) |

### Daily and timezone

Choose a local time and an IANA timezone.

| Desktop                                                               | Mobile                                                              |
| --------------------------------------------------------------------- | ------------------------------------------------------------------- |
| ![Daily and timezone — desktop](desktop/14-daily-timezone-editor.png) | ![Daily and timezone — mobile](mobile/14-daily-timezone-editor.png) |

### Weekly recurrence

Choose a weekday, local time, and timezone.

| Desktop                                                              | Mobile                                                             |
| -------------------------------------------------------------------- | ------------------------------------------------------------------ |
| ![Weekly recurrence — desktop](desktop/15-weekly-weekday-editor.png) | ![Weekly recurrence — mobile](mobile/15-weekly-weekday-editor.png) |

### Occurrence history

Inspect a real successful run alongside seeded failure, overlap, and downtime examples.

| Desktop                                                                          | Mobile                                                                         |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| ![Occurrence history — desktop](desktop/16-occurrence-success-failure-skips.png) | ![Occurrence history — mobile](mobile/16-occurrence-success-failure-skips.png) |

### Pause a schedule

Paused schedules release active quota.

| Desktop                                                       | Mobile                                                      |
| ------------------------------------------------------------- | ----------------------------------------------------------- |
| ![Pause a schedule — desktop](desktop/17-paused-schedule.png) | ![Pause a schedule — mobile](mobile/17-paused-schedule.png) |

### Resume a schedule

Resume with a future due time and retained history.

| Desktop                                                         | Mobile                                                        |
| --------------------------------------------------------------- | ------------------------------------------------------------- |
| ![Resume a schedule — desktop](desktop/18-resumed-schedule.png) | ![Resume a schedule — mobile](mobile/18-resumed-schedule.png) |

### Active schedule quota

The demo deployment uses a limit of two active schedules.

| Desktop                                                                  | Mobile                                                                 |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| ![Active schedule quota — desktop](desktop/22-active-schedule-limit.png) | ![Active schedule quota — mobile](mobile/22-active-schedule-limit.png) |

### Quota reached in the editor

See why a new active schedule cannot be created and how to make room.

| Desktop                                                                        | Mobile                                                                       |
| ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| ![Quota reached in the editor — desktop](desktop/22b-quota-reached-editor.png) | ![Quota reached in the editor — mobile](mobile/22b-quota-reached-editor.png) |

## Immutable versions and explicit repinning

### Edit a definition

Change the draft while retaining its saved audit identity.

| Desktop                                                                  | Mobile                                                                 |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| ![Edit a definition — desktop](desktop/19-edit-audit-as-new-version.png) | ![Edit a definition — mobile](mobile/19-edit-audit-as-new-version.png) |

### Two immutable versions

Inspect both snapshots under the same saved audit.

| Desktop                                                                | Mobile                                                               |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------- |
| ![Two immutable versions — desktop](desktop/20-two-saved-versions.png) | ![Two immutable versions — mobile](mobile/20-two-saved-versions.png) |

### Repin a schedule

Explicitly choose the newly saved version.

| Desktop                                                                | Mobile                                                               |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------- |
| ![Repin a schedule — desktop](desktop/21-explicitly-repin-version.png) | ![Repin a schedule — mobile](mobile/21-explicitly-repin-version.png) |

## Public result links and revocation

### Create a public link

Share a specific completed result.

| Desktop                                                                 | Mobile                                                                |
| ----------------------------------------------------------------------- | --------------------------------------------------------------------- |
| ![Create a public link — desktop](desktop/23-create-run-share-link.png) | ![Create a public link — mobile](mobile/23-create-run-share-link.png) |

### Anonymous report

Open the shared report after signing out.

| Desktop                                                               | Mobile                                                              |
| --------------------------------------------------------------------- | ------------------------------------------------------------------- |
| ![Anonymous report — desktop](desktop/24-anonymous-shared-report.png) | ![Anonymous report — mobile](mobile/24-anonymous-shared-report.png) |

### Revoke a link

Revoke the public result link from the owning space.

| Desktop                                                       | Mobile                                                      |
| ------------------------------------------------------------- | ----------------------------------------------------------- |
| ![Revoke a link — desktop](desktop/25-share-link-revoked.png) | ![Revoke a link — mobile](mobile/25-share-link-revoked.png) |

### Revoked access

Verify that the anonymous report is unavailable.

| Desktop                                                           | Mobile                                                          |
| ----------------------------------------------------------------- | --------------------------------------------------------------- |
| ![Revoked access — desktop](desktop/26-revoked-public-access.png) | ![Revoked access — mobile](mobile/26-revoked-public-access.png) |

## Organization administration and member permissions

### Empty organization space

Inspect onboarding before the organization has saved resources.

| Desktop                                                                         | Mobile                                                                        |
| ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| ![Empty organization space — desktop](desktop/26b-organization-empty-state.png) | ![Empty organization space — mobile](mobile/26b-organization-empty-state.png) |

### Organization administrator

Switch to Acme Performance and inspect shared resources.

| Desktop                                                                    | Mobile                                                                   |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| ![Organization administrator — desktop](desktop/27-organization-admin.png) | ![Organization administrator — mobile](mobile/27-organization-admin.png) |

### Workspace settings

Open organization creation, membership, and invitation entry points. Hosted Clerk dialogs require live credentials.

| Desktop                                                                      | Mobile                                                                     |
| ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| ![Workspace settings — desktop](desktop/27a-organization-workspace-menu.png) | ![Workspace settings — mobile](mobile/27a-organization-workspace-menu.png) |

### Run a saved version

Execute the organization version through the real runner.

| Desktop                                                                          | Mobile                                                                         |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| ![Run a saved version — desktop](desktop/27b-run-saved-organization-version.png) | ![Run a saved version — mobile](mobile/27b-run-saved-organization-version.png) |

### Assign a schedule manager

The administrator assigns management to the demo member.

| Desktop                                                                         | Mobile                                                                        |
| ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| ![Assign a schedule manager — desktop](desktop/28-admin-reassigns-schedule.png) | ![Assign a schedule manager — mobile](mobile/28-admin-reassigns-schedule.png) |

### Organization member

Inspect the member view and creator permissions.

| Desktop                                                                          | Mobile                                                                         |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| ![Organization member — desktop](desktop/29-organization-member-permissions.png) | ![Organization member — mobile](mobile/29-organization-member-permissions.png) |

### Manage the assigned schedule

The assigned member pauses the schedule.

| Desktop                                                                                    | Mobile                                                                                   |
| ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| ![Manage the assigned schedule — desktop](desktop/30-member-manages-assigned-schedule.png) | ![Manage the assigned schedule — mobile](mobile/30-member-manages-assigned-schedule.png) |

### Delete and retain history

Delete the schedule and reopen its retained occurrence history.

| Desktop                                                                                   | Mobile                                                                                  |
| ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| ![Delete and retain history — desktop](desktop/31-deleted-schedule-history-preserved.png) | ![Delete and retain history — mobile](mobile/31-deleted-schedule-history-preserved.png) |
