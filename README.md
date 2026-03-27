# AppSpeed

AppSpeed runs Lighthouse user-flow audits in a stable environment.
The workspace contains a web portal, an API control plane, a runner process, and shared audit domain libraries.

## Current Architecture

- `apps/portal`: thin Angular application shell and route composition.
- `apps/api`: Effect-based API control plane.
- `apps/runner`: thin runner entrypoint and deployment target.
- `libs/audit/**`: audit domain code shared across portal, API, runner, contracts, model, and persistence.
- `libs/platform/**`: cross-cutting platform services such as observability.
- `libs/ui/**`: reusable web UI primitives.

## General architecture for user-flow runner

- APIGateway configured as a websocket
- Lambda function to handle interactions
- SQS Fifo to schedule the audits
- SSM Document to initiate the runner
- EC2 instance to run audits in a stable environment
- S3 bucket to store the results

![Screenshot 2022-11-15 at 15 34 17](https://user-images.githubusercontent.com/40126819/201945750-8067dd5d-04da-49dd-87b3-e331e1a4b580.png)

## The application is deployed using GitHub CI

[Production Url](http://app.appspeed.dev)

[Development URL](http://dev.appspeed.dev.s3-website-us-east-1.amazonaws.com)

## Effect diagnostics (per Nx project)

This workspace provides an Nx target to run `@effect/language-service` diagnostics per project.

Run diagnostics for a single library:

```bash
pnpm exec nx run <project-name>:effect:diagnostics
```

Example:

```bash
pnpm exec nx run platform-observability:effect:diagnostics
```

Emit JSON (useful for machine processing or sharing with Codex):

```bash
pnpm exec nx run platform-observability:effect:diagnostics --format=json --outputFile=.tmp/effect/obs.json
```

Run diagnostics for multiple libraries:

```bash
pnpm exec nx run-many -t effect:diagnostics --projects=platform-observability,audit-persistence,audit-runner --parallel=3
```
