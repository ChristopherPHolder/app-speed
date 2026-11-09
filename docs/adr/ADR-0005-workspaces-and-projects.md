# ADR-0005: Account, workspace, and project management

Status: Accepted
Date: 2026-11-05

## Decision

Use Clerk for identity and App Speed's Postgres database for workspaces, memberships, projects, and project access.
One Clerk user ID maps to one App Speed account across all workspace memberships. The server verifies Clerk
sessions and obtains the primary verified email from Clerk; request bodies cannot choose an account identity.

Workspace management introduces a domain boundary under `libs/workspace/**`, extending ADR-0004 beyond the Audit
context. Reusable Clerk identity verification lives under `libs/platform/identity`. Applications compose these
libraries, and audit code continues to live under `libs/audit/**`.

The initial management policy is:

- Creating a workspace makes its creator an admin and creates a same-named first project in the same transaction.
  The portal opens that project directly. There is no implicit workspace created during authentication.
- Admins manage workspace details, memberships, invitations, projects, and project access.
- Members can view the workspace roster and projects explicitly granted to them. They cannot manage other members
  or projects. Admins have access to all projects in their workspace.
- Workspace invitations are addressed to an email, expire after seven days, and appear in the recipient's account
  after sign-in with that verified primary email. Creating an invitation does not send email. An email-delivery
  integration can be added later without changing membership authorization.
- Acceptance uses the server-verified recipient, not a browser-supplied email. Joining a workspace grants no
  implicit access to its projects.
- The last admin cannot leave, be removed, or be demoted. Membership mutations lock the workspace row before
  checking roles and admin counts so competing mutations serialize in Postgres.
- Removing a workspace member cascades their project grants. Rejoining does not restore previous grants.
- The active workspace and last project in each workspace are account-specific navigation preferences stored in
  the browser. The portal validates them against the authorized workspace data returned by the server.

Workspace and project deletion currently remove their management records and dependent grants/invitations.
Before projects own durable audit records or schedules, define deletion/archival behavior that preserves run
history and stops future scheduling as required by issue #222.

## Scope

This implements management of the three-level model. It does not assign existing guest audits to projects, change
guest URLs, make existing audit history private, introduce recurring execution, or implement claim/share links.
The management UI states this boundary. Audit ownership, scoped API/report/SSE access, and Cron Audits are the
next slices of [#222](https://github.com/ChristopherPHolder/app-speed/issues/222).

## Consequences

Workspaces do not depend on Clerk Organizations or their configuration. Membership decisions are fresh database
reads, independent of cached organization claims. The API requires a server-side Clerk key and configured portal
origins. Guest audit endpoints remain available if Clerk account management is not configured.

The workspace schema uses composite foreign keys so a project grant cannot refer to a different workspace's
project or membership. Management requests use validated action schemas and explicit permission checks inside
transactions. Future audit integration must reuse this authorization boundary rather than trusting an active
workspace or project supplied by the portal.
