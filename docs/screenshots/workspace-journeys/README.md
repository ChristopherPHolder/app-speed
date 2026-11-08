# Workspace and project journeys

These are real browser → API → database journeys using isolated PGlite storage and fixed identities compiled only into test application builds. Workspace API responses are not intercepted. Live Clerk authentication is tested separately.

The committed baselines are compared on every normal E2E run using a separate set for each operating system. The gallery below shows macOS (`darwin`); Linux CI uses `baselines/linux`. Native font rendering differs between platforms even with the same bundled fonts and Chrome version. Desktop is 1440 × 1000; mobile is 390 × 844. Screenshots capture the full page. Invitation expiry text is blacked out because it changes with the run date. Fonts are bundled into the test build.

Review changes before updating baselines with `pnpm exec nx run portal-e2e:e2e --configuration=update-snapshots`. A missing baseline fails comparison; normal CI never creates or updates baselines.

CI uploads `e2e-diagnostics` on success and failure. Download it and open `artifacts/workspace-visuals/index.html` to browse actual screenshots. Visual failures also produce diff PNGs.

## Anonymous public view

| Desktop | Mobile |
| --- | --- |
| ![Anonymous public view desktop](baselines/darwin/desktop/01-anonymous-public-view.png) | ![Anonymous public view mobile](baselines/darwin/mobile/01-anonymous-public-view.png) |

## Sign in

| Desktop | Mobile |
| --- | --- |
| ![Sign in desktop](baselines/darwin/desktop/02-sign-in.png) | ![Sign in mobile](baselines/darwin/mobile/02-sign-in.png) |

## Create or join

| Desktop | Mobile |
| --- | --- |
| ![Create or join desktop](baselines/darwin/desktop/03-create-or-join.png) | ![Create or join mobile](baselines/darwin/mobile/03-create-or-join.png) |

## Workspace name

| Desktop | Mobile |
| --- | --- |
| ![Workspace name desktop](baselines/darwin/desktop/04-workspace-name.png) | ![Workspace name mobile](baselines/darwin/mobile/04-workspace-name.png) |

## Default project

| Desktop | Mobile |
| --- | --- |
| ![Default project desktop](baselines/darwin/desktop/05-default-project.png) | ![Default project mobile](baselines/darwin/mobile/05-default-project.png) |

## Project list

| Desktop | Mobile |
| --- | --- |
| ![Project list desktop](baselines/darwin/desktop/06-project-list.png) | ![Project list mobile](baselines/darwin/mobile/06-project-list.png) |

## Create project dialog

| Desktop | Mobile |
| --- | --- |
| ![Create project dialog desktop](baselines/darwin/desktop/07-create-project-dialog.png) | ![Create project dialog mobile](baselines/darwin/mobile/07-create-project-dialog.png) |

## Project settings

| Desktop | Mobile |
| --- | --- |
| ![Project settings desktop](baselines/darwin/desktop/08-project-settings.png) | ![Project settings mobile](baselines/darwin/mobile/08-project-settings.png) |

## Renamed project

| Desktop | Mobile |
| --- | --- |
| ![Renamed project desktop](baselines/darwin/desktop/09-renamed-project.png) | ![Renamed project mobile](baselines/darwin/mobile/09-renamed-project.png) |

## Delete project confirmation

| Desktop | Mobile |
| --- | --- |
| ![Delete project confirmation desktop](baselines/darwin/desktop/10-delete-project-confirmation.png) | ![Delete project confirmation mobile](baselines/darwin/mobile/10-delete-project-confirmation.png) |

## Workspace switcher

| Desktop | Mobile |
| --- | --- |
| ![Workspace switcher desktop](baselines/darwin/desktop/11-workspace-switcher.png) | ![Workspace switcher mobile](baselines/darwin/mobile/11-workspace-switcher.png) |

## Signed in public view

| Desktop | Mobile |
| --- | --- |
| ![Signed in public view desktop](baselines/darwin/desktop/13-signed-in-public-view.png) | ![Signed in public view mobile](baselines/darwin/mobile/13-signed-in-public-view.png) |

## Account menu

| Desktop | Mobile |
| --- | --- |
| ![Account menu desktop](baselines/darwin/desktop/14-account-menu.png) | ![Account menu mobile](baselines/darwin/mobile/14-account-menu.png) |

## Invite member

| Desktop | Mobile |
| --- | --- |
| ![Invite member desktop](baselines/darwin/desktop/15-invite-member.png) | ![Invite member mobile](baselines/darwin/mobile/15-invite-member.png) |

## Pending invitation

| Desktop | Mobile |
| --- | --- |
| ![Pending invitation desktop](baselines/darwin/desktop/16-pending-invitation.png) | ![Pending invitation mobile](baselines/darwin/mobile/16-pending-invitation.png) |

## Accept invitation

| Desktop | Mobile |
| --- | --- |
| ![Accept invitation desktop](baselines/darwin/desktop/17-accept-invitation.png) | ![Accept invitation mobile](baselines/darwin/mobile/17-accept-invitation.png) |

## Member without access

| Desktop | Mobile |
| --- | --- |
| ![Member without access desktop](baselines/darwin/desktop/18-member-without-access.png) | ![Member without access mobile](baselines/darwin/mobile/18-member-without-access.png) |

## Project access granted

| Desktop | Mobile |
| --- | --- |
| ![Project access granted desktop](baselines/darwin/desktop/19-project-access-granted.png) | ![Project access granted mobile](baselines/darwin/mobile/19-project-access-granted.png) |

## Member project

| Desktop | Mobile |
| --- | --- |
| ![Member project desktop](baselines/darwin/desktop/20-member-project.png) | ![Member project mobile](baselines/darwin/mobile/20-member-project.png) |

## Access revoked

| Desktop | Mobile |
| --- | --- |
| ![Access revoked desktop](baselines/darwin/desktop/21-access-revoked.png) | ![Access revoked mobile](baselines/darwin/mobile/21-access-revoked.png) |

## Workspace settings

| Desktop | Mobile |
| --- | --- |
| ![Workspace settings desktop](baselines/darwin/desktop/22-workspace-settings.png) | ![Workspace settings mobile](baselines/darwin/mobile/22-workspace-settings.png) |

## Workspace logo

| Desktop | Mobile |
| --- | --- |
| ![Workspace logo desktop](baselines/darwin/desktop/23-workspace-logo.png) | ![Workspace logo mobile](baselines/darwin/mobile/23-workspace-logo.png) |

## Leave workspace confirmation

| Desktop | Mobile |
| --- | --- |
| ![Leave workspace confirmation desktop](baselines/darwin/desktop/24-leave-workspace-confirmation.png) | ![Leave workspace confirmation mobile](baselines/darwin/mobile/24-leave-workspace-confirmation.png) |

## Last admin protection

| Desktop | Mobile |
| --- | --- |
| ![Last admin protection desktop](baselines/darwin/desktop/25-last-admin-protection.png) | ![Last admin protection mobile](baselines/darwin/mobile/25-last-admin-protection.png) |

## Invitation declined

| Desktop | Mobile |
| --- | --- |
| ![Invitation declined desktop](baselines/darwin/desktop/26-invitation-declined.png) | ![Invitation declined mobile](baselines/darwin/mobile/26-invitation-declined.png) |

## Promote admin confirmation

| Desktop | Mobile |
| --- | --- |
| ![Promote admin confirmation desktop](baselines/darwin/desktop/27-promote-admin-confirmation.png) | ![Promote admin confirmation mobile](baselines/darwin/mobile/27-promote-admin-confirmation.png) |

## Workspace members

| Desktop | Mobile |
| --- | --- |
| ![Workspace members desktop](baselines/darwin/desktop/28-workspace-members.png) | ![Workspace members mobile](baselines/darwin/mobile/28-workspace-members.png) |

## Member workspace settings

| Desktop | Mobile |
| --- | --- |
| ![Member workspace settings desktop](baselines/darwin/desktop/29-member-workspace-settings.png) | ![Member workspace settings mobile](baselines/darwin/mobile/29-member-workspace-settings.png) |

## Mobile navigation

![Mobile navigation](baselines/darwin/mobile/12-mobile-navigation.png)
