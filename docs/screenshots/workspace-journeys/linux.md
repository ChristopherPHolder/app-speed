# Linux CI workspace and project journeys

These are real browser → API → database journeys using isolated PGlite storage and fixed identities compiled only into test application builds. Workspace mutations reach the real API. The recovery journey injects one failed overview request to verify safe retry. Live Clerk authentication is tested separately.

The set contains 59 Linux baselines. The original 57 were captured by [run 42486415919](https://github.com/ChristopherPHolder/app-speed/actions/runs/42486415919) from source commit `160af7000847c16f72db48a6f1944e0014355d36`. The desktop/mobile social sign-in and saved-workspace recovery images were reviewed and updated from [run 42666471952](https://github.com/ChristopherPHolder/app-speed/actions/runs/42666471952), source commit `d59d01c5e0690e1356723591430772fad5ecba93`; all 13 browser tests passed. Every image was captured again from [run 43626520399](https://github.com/ChristopherPHolder/app-speed/actions/runs/43626520399), source commit `016df9c9053ab97413a8be034dee8d4c99764951`, after Cookie settings moved into the footer and pages stopped overflowing the viewport; all 13 browser tests passed and 59 images changed. All 59 capture names and widths match the macOS journey set. Unrelated baselines were retained. Normal Linux PR checks compare against these images without updating them.

Review changes before updating baselines with `pnpm exec nx run portal-e2e:e2e --configuration=update-snapshots`. A missing baseline fails comparison; normal CI never creates or updates baselines.

CI uploads `e2e-diagnostics` on success and failure. Download it and open `artifacts/workspace-visuals/index.html` to browse actual screenshots. Visual failures also produce diff PNGs.

## Anonymous public view

| Desktop | Mobile |
| --- | --- |
| ![Anonymous public view desktop](baselines/linux/desktop/01-anonymous-public-view.png) | ![Anonymous public view mobile](baselines/linux/mobile/01-anonymous-public-view.png) |

## Sign in

| Desktop | Mobile |
| --- | --- |
| ![Sign in desktop](baselines/linux/desktop/02-sign-in.png) | ![Sign in mobile](baselines/linux/mobile/02-sign-in.png) |

## Create or join

| Desktop | Mobile |
| --- | --- |
| ![Create or join desktop](baselines/linux/desktop/03-create-or-join.png) | ![Create or join mobile](baselines/linux/mobile/03-create-or-join.png) |

## Workspace name

| Desktop | Mobile |
| --- | --- |
| ![Workspace name desktop](baselines/linux/desktop/04-workspace-name.png) | ![Workspace name mobile](baselines/linux/mobile/04-workspace-name.png) |

## Default project

| Desktop | Mobile |
| --- | --- |
| ![Default project desktop](baselines/linux/desktop/05-default-project.png) | ![Default project mobile](baselines/linux/mobile/05-default-project.png) |

## Project list

| Desktop | Mobile |
| --- | --- |
| ![Project list desktop](baselines/linux/desktop/06-project-list.png) | ![Project list mobile](baselines/linux/mobile/06-project-list.png) |

## Create project dialog

| Desktop | Mobile |
| --- | --- |
| ![Create project dialog desktop](baselines/linux/desktop/07-create-project-dialog.png) | ![Create project dialog mobile](baselines/linux/mobile/07-create-project-dialog.png) |

## Project settings

| Desktop | Mobile |
| --- | --- |
| ![Project settings desktop](baselines/linux/desktop/08-project-settings.png) | ![Project settings mobile](baselines/linux/mobile/08-project-settings.png) |

## Renamed project

| Desktop | Mobile |
| --- | --- |
| ![Renamed project desktop](baselines/linux/desktop/09-renamed-project.png) | ![Renamed project mobile](baselines/linux/mobile/09-renamed-project.png) |

## Delete project confirmation

| Desktop | Mobile |
| --- | --- |
| ![Delete project confirmation desktop](baselines/linux/desktop/10-delete-project-confirmation.png) | ![Delete project confirmation mobile](baselines/linux/mobile/10-delete-project-confirmation.png) |

## Workspace switcher

| Desktop | Mobile |
| --- | --- |
| ![Workspace switcher desktop](baselines/linux/desktop/11-workspace-switcher.png) | ![Workspace switcher mobile](baselines/linux/mobile/11-workspace-switcher.png) |

## Signed in public view

| Desktop | Mobile |
| --- | --- |
| ![Signed in public view desktop](baselines/linux/desktop/13-signed-in-public-view.png) | ![Signed in public view mobile](baselines/linux/mobile/13-signed-in-public-view.png) |

## Account menu

| Desktop | Mobile |
| --- | --- |
| ![Account menu desktop](baselines/linux/desktop/14-account-menu.png) | ![Account menu mobile](baselines/linux/mobile/14-account-menu.png) |

## Invite member

| Desktop | Mobile |
| --- | --- |
| ![Invite member desktop](baselines/linux/desktop/15-invite-member.png) | ![Invite member mobile](baselines/linux/mobile/15-invite-member.png) |

## Pending invitation

| Desktop | Mobile |
| --- | --- |
| ![Pending invitation desktop](baselines/linux/desktop/16-pending-invitation.png) | ![Pending invitation mobile](baselines/linux/mobile/16-pending-invitation.png) |

## Accept invitation

| Desktop | Mobile |
| --- | --- |
| ![Accept invitation desktop](baselines/linux/desktop/17-accept-invitation.png) | ![Accept invitation mobile](baselines/linux/mobile/17-accept-invitation.png) |

## Member without access

| Desktop | Mobile |
| --- | --- |
| ![Member without access desktop](baselines/linux/desktop/18-member-without-access.png) | ![Member without access mobile](baselines/linux/mobile/18-member-without-access.png) |

## Project access granted

| Desktop | Mobile |
| --- | --- |
| ![Project access granted desktop](baselines/linux/desktop/19-project-access-granted.png) | ![Project access granted mobile](baselines/linux/mobile/19-project-access-granted.png) |

## Member project

| Desktop | Mobile |
| --- | --- |
| ![Member project desktop](baselines/linux/desktop/20-member-project.png) | ![Member project mobile](baselines/linux/mobile/20-member-project.png) |

## Access revoked

| Desktop | Mobile |
| --- | --- |
| ![Access revoked desktop](baselines/linux/desktop/21-access-revoked.png) | ![Access revoked mobile](baselines/linux/mobile/21-access-revoked.png) |

## Workspace settings

| Desktop | Mobile |
| --- | --- |
| ![Workspace settings desktop](baselines/linux/desktop/22-workspace-settings.png) | ![Workspace settings mobile](baselines/linux/mobile/22-workspace-settings.png) |

## Workspace logo

| Desktop | Mobile |
| --- | --- |
| ![Workspace logo desktop](baselines/linux/desktop/23-workspace-logo.png) | ![Workspace logo mobile](baselines/linux/mobile/23-workspace-logo.png) |

## Leave workspace confirmation

| Desktop | Mobile |
| --- | --- |
| ![Leave workspace confirmation desktop](baselines/linux/desktop/24-leave-workspace-confirmation.png) | ![Leave workspace confirmation mobile](baselines/linux/mobile/24-leave-workspace-confirmation.png) |

## Last admin protection

| Desktop | Mobile |
| --- | --- |
| ![Last admin protection desktop](baselines/linux/desktop/25-last-admin-protection.png) | ![Last admin protection mobile](baselines/linux/mobile/25-last-admin-protection.png) |

## Invitation declined

| Desktop | Mobile |
| --- | --- |
| ![Invitation declined desktop](baselines/linux/desktop/26-invitation-declined.png) | ![Invitation declined mobile](baselines/linux/mobile/26-invitation-declined.png) |

## Promote admin confirmation

| Desktop | Mobile |
| --- | --- |
| ![Promote admin confirmation desktop](baselines/linux/desktop/27-promote-admin-confirmation.png) | ![Promote admin confirmation mobile](baselines/linux/mobile/27-promote-admin-confirmation.png) |

## Workspace members

| Desktop | Mobile |
| --- | --- |
| ![Workspace members desktop](baselines/linux/desktop/28-workspace-members.png) | ![Workspace members mobile](baselines/linux/mobile/28-workspace-members.png) |

## Member workspace settings

| Desktop | Mobile |
| --- | --- |
| ![Member workspace settings desktop](baselines/linux/desktop/29-member-workspace-settings.png) | ![Member workspace settings mobile](baselines/linux/mobile/29-member-workspace-settings.png) |

## Mobile navigation

![Mobile navigation](baselines/linux/mobile/12-mobile-navigation.png)

## Saved workspace recovery

| Desktop | Mobile |
| --- | --- |
| ![Saved workspace recovery desktop](baselines/linux/desktop/30-saved-workspace-recovery.png) | ![Saved workspace recovery mobile](baselines/linux/mobile/30-saved-workspace-recovery.png) |
