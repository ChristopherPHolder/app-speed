# App Speed domain

## Account, workspace, and project

App Speed has three levels: **account → workspace → project**.

An **account** is a person's identity, authenticated through Clerk. A person uses the same account across all their
workspaces. An account is not a workspace, and switching workspaces does not sign the person out or create another
account.

A **workspace** is a shared place for an organization or group. It has its own members and projects. An account can
belong to multiple workspaces. A workspace membership determines that account's role in that workspace, such as
admin or member. Roles belong to memberships, not globally to accounts: someone can be an admin in Holder and a
member in Entain.

A **project** organizes work within exactly one workspace. Each project contains its audits, run history, and
Cron Audits. Project access determines which workspace members can use the project; workspace membership alone
must not be treated as access to every project.

For example:

```text
Chris's account
├── PushBased workspace (member)
│   ├── Storefront project
│   └── Documentation project
├── Entain workspace (member)
│   └── Sportsbook project
└── Holder workspace (admin)
    └── Personal site project
```

Switching the active workspace changes the membership, projects, and data in use. A selected project must belong to
the selected workspace, and the account must have access to it. A workspace or project identifier selected in the
browser is navigation context, not proof of authorization. Management APIs verify identity, membership, and project access on the server. Future audit APIs must enforce the
same boundary.

**Public View** is the default portal context. It is available to guests and signed-in accounts, and does not
have workspace membership, settings, or projects. It contains the existing public audit and trace tools.
Signed-in users can create a workspace or accept an invitation, and can always switch back to Public View.
Public View exposes the same public tools and data as the anonymous experience; it is outside workspace/project scope.
Creating a workspace also creates its first project with the same name, then opens that project.

## Current implementation and delivery boundaries

[Issue #233](https://github.com/ChristopherPHolder/app-speed/issues/233) introduces the account sign-in experience
and authenticated layout. The current portal integrates Clerk, custom Angular Material authentication pages, an
account menu, and responsive navigation. The first production release offers Google and GitHub through Clerk,
with optional profile completion after social sign-up. Email-code and password forms are not offered.
See [the auth release guide](docs/deployment/initial-auth-production.md) for production configuration and verification. Guests retain the existing audit and trace workflows.

Workspace/project creation and switching, membership roles, invitations, and project access are now implemented
as a management slice. See [ADR-0005](docs/adr/ADR-0005-workspaces-and-projects.md) for its policies and storage.
Audits are not yet assigned to projects; existing audit history is not private account or project history.
Persisted audit ownership, claiming, sharing, and Cron Audits remain later stages. Avoid showing example workspaces
or projects as if they were persisted, authorized data.

## Related issue and terminology changes

[Issue #222](https://github.com/ChristopherPHolder/app-speed/issues/222) is the broader ownership and recurring-audit
initiative. It predates this three-level model and describes personal and organization **spaces**, with all
organization members able to view organization audits. For future implementation, reconcile it with the model
above:

- Use **workspace** for the organization/group boundary and membership roles.
- Put audit ownership and Cron Audits inside **projects** belonging to a workspace.
- Check project access explicitly rather than assuming all workspace members see every audit.
- A personal site can be a project in a workspace such as Holder; it does not require treating the account itself
  as a project container.
- Decide invitation behavior, project permissions, admin access, and migration of existing guest audits before
  enforcing ownership. The initial management policy is specified in ADR-0005.

The newer model takes precedence where terminology or ownership differs. The remaining guest-claiming, sharing,
durable execution, and recurrence requirements in #222 still need review when their stages are implemented.

## Architecture

Follow [ADR-0004](docs/adr/ADR-0004-domain-first-audit-architecture.md): applications are composition roots and audit
behavior belongs under `libs/audit/**`. Reusable identity integration belongs under `libs/platform/**`.
ADR-0005 extends the domain boundaries for workspace/project management.

The multi-tenant authorization non-goal in [the audit feature guide](docs/audit-feature.md) describes the existing
audit implementation. Workspace/project management now enforces authorization on the server. Applying that boundary to audit
resources remains a planned expansion.
