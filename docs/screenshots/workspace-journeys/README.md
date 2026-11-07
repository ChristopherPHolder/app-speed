# Workspace and project journeys

These are real browser → API → database journeys using isolated PGlite storage and fixed identities compiled only into test application builds. Workspace API responses are not intercepted. Live Clerk authentication is tested separately.

The committed baselines are compared on every normal E2E run. Desktop is 1440 × 1000; mobile is 390 × 844. Screenshots capture the full page. Invitation expiry text is blacked out because it changes with the run date. Fonts are bundled into the test build.

Review changes before updating baselines with `pnpm exec nx run portal-e2e:e2e --configuration=update-snapshots`. A missing baseline fails comparison; normal CI never creates or updates baselines.

CI uploads `e2e-diagnostics` on success and failure. Download it and open `artifacts/workspace-visuals/index.html` to browse actual screenshots. Visual failures also produce diff PNGs.

## Anonymous public view

| Desktop | Mobile |
| --- | --- |
| ![Anonymous public view desktop](baselines/desktop/01-anonymous-public-view.png) | ![Anonymous public view mobile](baselines/mobile/01-anonymous-public-view.png) |

## Sign in

| Desktop | Mobile |
| --- | --- |
| ![Sign in desktop](baselines/desktop/02-sign-in.png) | ![Sign in mobile](baselines/mobile/02-sign-in.png) |

## Create or join

| Desktop | Mobile |
| --- | --- |
| ![Create or join desktop](baselines/desktop/03-create-or-join.png) | ![Create or join mobile](baselines/mobile/03-create-or-join.png) |

## Workspace name

| Desktop | Mobile |
| --- | --- |
| ![Workspace name desktop](baselines/desktop/04-workspace-name.png) | ![Workspace name mobile](baselines/mobile/04-workspace-name.png) |

## Default project

| Desktop | Mobile |
| --- | --- |
| ![Default project desktop](baselines/desktop/05-default-project.png) | ![Default project mobile](baselines/mobile/05-default-project.png) |

## Project list

| Desktop | Mobile |
| --- | --- |
| ![Project list desktop](baselines/desktop/06-project-list.png) | ![Project list mobile](baselines/mobile/06-project-list.png) |

## Create project dialog

| Desktop | Mobile |
| --- | --- |
| ![Create project dialog desktop](baselines/desktop/07-create-project-dialog.png) | ![Create project dialog mobile](baselines/mobile/07-create-project-dialog.png) |

## Project settings

| Desktop | Mobile |
| --- | --- |
| ![Project settings desktop](baselines/desktop/08-project-settings.png) | ![Project settings mobile](baselines/mobile/08-project-settings.png) |

## Renamed project

| Desktop | Mobile |
| --- | --- |
| ![Renamed project desktop](baselines/desktop/09-renamed-project.png) | ![Renamed project mobile](baselines/mobile/09-renamed-project.png) |

## Delete project confirmation

| Desktop | Mobile |
| --- | --- |
| ![Delete project confirmation desktop](baselines/desktop/10-delete-project-confirmation.png) | ![Delete project confirmation mobile](baselines/mobile/10-delete-project-confirmation.png) |

## Workspace switcher

| Desktop | Mobile |
| --- | --- |
| ![Workspace switcher desktop](baselines/desktop/11-workspace-switcher.png) | ![Workspace switcher mobile](baselines/mobile/11-workspace-switcher.png) |

## Signed in public view

| Desktop | Mobile |
| --- | --- |
| ![Signed in public view desktop](baselines/desktop/13-signed-in-public-view.png) | ![Signed in public view mobile](baselines/mobile/13-signed-in-public-view.png) |

## Account menu

| Desktop | Mobile |
| --- | --- |
| ![Account menu desktop](baselines/desktop/14-account-menu.png) | ![Account menu mobile](baselines/mobile/14-account-menu.png) |

## Invite member

| Desktop | Mobile |
| --- | --- |
| ![Invite member desktop](baselines/desktop/15-invite-member.png) | ![Invite member mobile](baselines/mobile/15-invite-member.png) |

## Pending invitation

| Desktop | Mobile |
| --- | --- |
| ![Pending invitation desktop](baselines/desktop/16-pending-invitation.png) | ![Pending invitation mobile](baselines/mobile/16-pending-invitation.png) |

## Accept invitation

| Desktop | Mobile |
| --- | --- |
| ![Accept invitation desktop](baselines/desktop/17-accept-invitation.png) | ![Accept invitation mobile](baselines/mobile/17-accept-invitation.png) |

## Member without access

| Desktop | Mobile |
| --- | --- |
| ![Member without access desktop](baselines/desktop/18-member-without-access.png) | ![Member without access mobile](baselines/mobile/18-member-without-access.png) |

## Project access granted

| Desktop | Mobile |
| --- | --- |
| ![Project access granted desktop](baselines/desktop/19-project-access-granted.png) | ![Project access granted mobile](baselines/mobile/19-project-access-granted.png) |

## Member project

| Desktop | Mobile |
| --- | --- |
| ![Member project desktop](baselines/desktop/20-member-project.png) | ![Member project mobile](baselines/mobile/20-member-project.png) |

## Access revoked

| Desktop | Mobile |
| --- | --- |
| ![Access revoked desktop](baselines/desktop/21-access-revoked.png) | ![Access revoked mobile](baselines/mobile/21-access-revoked.png) |

## Workspace settings

| Desktop | Mobile |
| --- | --- |
| ![Workspace settings desktop](baselines/desktop/22-workspace-settings.png) | ![Workspace settings mobile](baselines/mobile/22-workspace-settings.png) |

## Workspace logo

| Desktop | Mobile |
| --- | --- |
| ![Workspace logo desktop](baselines/desktop/23-workspace-logo.png) | ![Workspace logo mobile](baselines/mobile/23-workspace-logo.png) |

## Leave workspace confirmation

| Desktop | Mobile |
| --- | --- |
| ![Leave workspace confirmation desktop](baselines/desktop/24-leave-workspace-confirmation.png) | ![Leave workspace confirmation mobile](baselines/mobile/24-leave-workspace-confirmation.png) |

## Last admin protection

| Desktop | Mobile |
| --- | --- |
| ![Last admin protection desktop](baselines/desktop/25-last-admin-protection.png) | ![Last admin protection mobile](baselines/mobile/25-last-admin-protection.png) |

## Invitation declined

| Desktop | Mobile |
| --- | --- |
| ![Invitation declined desktop](baselines/desktop/26-invitation-declined.png) | ![Invitation declined mobile](baselines/mobile/26-invitation-declined.png) |

## Promote admin confirmation

| Desktop | Mobile |
| --- | --- |
| ![Promote admin confirmation desktop](baselines/desktop/27-promote-admin-confirmation.png) | ![Promote admin confirmation mobile](baselines/mobile/27-promote-admin-confirmation.png) |

## Workspace members

| Desktop | Mobile |
| --- | --- |
| ![Workspace members desktop](baselines/desktop/28-workspace-members.png) | ![Workspace members mobile](baselines/mobile/28-workspace-members.png) |

## Member workspace settings

| Desktop | Mobile |
| --- | --- |
| ![Member workspace settings desktop](baselines/desktop/29-member-workspace-settings.png) | ![Member workspace settings mobile](baselines/mobile/29-member-workspace-settings.png) |

## Mobile navigation

![Mobile navigation](baselines/mobile/12-mobile-navigation.png)
