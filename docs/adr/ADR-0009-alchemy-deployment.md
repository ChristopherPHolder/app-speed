# ADR-0009: Deployments as Alchemy stacks

Status: Accepted
Date: 2026-11-15

## Context

Each app deployed through its own imperative Nx executor: `s3-upload` ran `aws s3 sync --delete` for the portal and
the design system, `ssm-deploy` sent an SSM shell script to the API host, and `ec2-ssm-cycle` started the runner host,
rolled out its container and stopped it again. Bucket names, instance IDs and container settings were spread across
`project.json` options. Nothing recorded what was deployed where, a deploy could not be previewed, and two deploys of
the same app and environment could interleave. Tracked in
[#292](https://github.com/ChristopherPHolder/app-speed/issues/292).

## Decision

Every deployable app is an [Alchemy](https://alchemy.run) stack in `tools/aws-deploy/src/stacks`. Alchemy v2 is an
Effect program, like the rest of the workspace.

- **Stages** are `development` and `production`, the Nx `deploy` configurations. The stack rejects any other stage.
- **State** lives in Alchemy's AWS store: the DynamoDB table `alchemy-state` in eu-central-1, with an S3 overflow
  bucket. It holds one record per stack, stage and resource. A deploy holds a lease on its stage, so a concurrent
  deploy of the same stage fails instead of interleaving.
- **Static sites** (`portal`, `design-system`) use `AWS.Website.AssetDeployment` through `SiteFiles`. It uploads changed
  files, deletes stale ones, sets content types and keeps HTML uncached. The build's content hash is part of the
  resource's props, so an unchanged build is a no-op. Each stack is pinned to its bucket's region (the portal buckets
  are in us-east-1).
- **Containers** (`api`, `runner`) are Alchemy `Action`s that run the existing SSM rollouts. An Action runs when its
  input changes, and every published image has a unique reference, so each new image rolls out once. The input is
  stored in state, so it names secret variables (`-e CLERK_SECRET_KEY`) and the rollout reads their values from the
  job's environment.
- **Nx stays the entry point.** `@app-speed/aws-deploy:alchemy` runs `alchemy deploy` or `alchemy plan` for a stack and
  stage, with Alchemy's telemetry off. Workflows keep calling `nx deploy <app> --configuration=<env>`.
- Docker images are still built and pushed by `nx release`.

The buckets, CloudFront distributions, ECR repositories and EC2 instances are referenced by name or ID, not owned by a
stack. A stack cannot change, replace or delete them, and the site files are retained if a stack is removed.

## Consequences

- `nx deploy <app> --configuration=<env> --command=plan` previews a deploy, and a repeated deploy is a no-op.
- The state store has to be bootstrapped once, and the CI credentials need access to it. See
  [Alchemy deployments](../deployment/alchemy.md).
- Alchemy v2 is in beta. The version is pinned. `SiteFiles` resolves its globs to exact paths itself, because the
  matcher in `AssetDeployment` 2.0.0-beta.87 fails on `*`.
- Adopting the buckets, distributions, repositories and instances into the stacks, so that their configuration is
  code too, is a separate change. It needs their live configuration first: adopting with different props would modify
  them.
