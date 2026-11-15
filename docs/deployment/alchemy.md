# Alchemy deployments

Every deployable app is an [Alchemy](https://alchemy.run) stack. The reasons are in
[ADR-0009](../adr/ADR-0009-alchemy-deployment.md).

| App             | Stack                                          | Deploys                                                                  |
| --------------- | ---------------------------------------------- | ------------------------------------------------------------------------ |
| `portal`        | `tools/aws-deploy/src/stacks/portal.ts`        | `dist/apps/portal` to `appspeed.dev` / `dev.appspeed.dev` (us-east-1)    |
| `design-system` | `tools/aws-deploy/src/stacks/design-system.ts` | `dist/storybook/design-system` to `ds.appspeed.dev` (eu-central-1)       |
| `api`           | `tools/aws-deploy/src/stacks/api.ts`           | `$API_IMAGE_REF` on `i-016827500a47a80ef`, port 3000 (prod) / 3001 (dev) |
| `runner`        | `tools/aws-deploy/src/stacks/runner.ts`        | `$RUNNER_IMAGE_REF` on `i-049287bf43503d01e`, started and stopped for it |

## Deploy and plan

```sh
pnpm exec nx deploy portal --configuration=production
pnpm exec nx deploy portal --configuration=production --command=plan
```

`--command=plan` prints what would change and applies nothing. A deploy whose build or image has not changed is a
no-op. `--force` re-uploads every site file and reruns the rollout anyway.

The API and runner stacks read the image reference from `API_IMAGE_REF` or `RUNNER_IMAGE_REF`, which the workflows set
after `nx release publish`. Every `-e NAME` run argument in a stack must be set in the environment. The rollout
passes its value to the container, and only the name is stored in state.

Deploy targets still depend on their builds and on `auth-preflight`. Database migrations still run before the API
deploy.

## State store

State lives in the DynamoDB table `alchemy-state` in eu-central-1. Records too large for an item go to the overflow
bucket `alchemy-state-overflow-<account-id>-eu-central-1-an`. A deploy holds a lease on its stack and stage, and a
second concurrent deploy of the same stage fails. The workflows queue deploys of the same app, so this only happens
with local deploys.

Alchemy does not create the store in CI. Create it once, with credentials that can create DynamoDB tables and S3
buckets:

```sh
pnpm exec alchemy state bootstrap --config tools/aws-deploy/src/stacks/api.ts
```

All four stacks share the store, so one bootstrap covers them.

## CI permissions

The access key in `AWS_ACCESS_KEY_ID` keeps its current permissions: S3 access to the site buckets, SSM
`SendCommand`/`GetCommandInvocation`, EC2 start, stop and describe for the runner, and ECR push. It also needs the state
store:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:DescribeTable",
        "dynamodb:DescribeContinuousBackups",
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query",
        "dynamodb:BatchWriteItem",
        "dynamodb:TransactWriteItems"
      ],
      "Resource": "arn:aws:dynamodb:eu-central-1:<account-id>:table/alchemy-state"
    },
    {
      "Effect": "Allow",
      "Action": ["s3:ListBucket", "s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
      "Resource": [
        "arn:aws:s3:::alchemy-state-overflow-<account-id>-eu-central-1-an",
        "arn:aws:s3:::alchemy-state-overflow-<account-id>-eu-central-1-an/*"
      ]
    }
  ]
}
```

## Caching

HTML is never cached. Files with a content hash in their name are cached for a year as immutable. In the portal these
are the bundles, styles and fonts. `favicon.ico`, `assets/**`, text and JSON files revalidate on every request.
Storybook keeps its file names across builds, so every design-system file revalidates. Rules are in each stack's
`SiteFiles` call. `EXTRA_CONTENT_TYPES` sets the content types `AssetDeployment` does not infer: PDF, EPS and source
maps. Neither stack invalidates CloudFront.

## What the stacks do not own

The buckets, CloudFront distributions, ECR repositories and EC2 instances are referenced by name or ID. A stack never
creates, changes or deletes them. The uploaded site files are retained when a stack or stage is removed.
