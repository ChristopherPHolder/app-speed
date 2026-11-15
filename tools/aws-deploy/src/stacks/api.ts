import * as Alchemy from 'alchemy';
import * as Config from 'effect/Config';
import * as Effect from 'effect/Effect';

import { awsProviders, awsState } from '../alchemy/aws.ts';
import { RunningHostsContainer } from '../alchemy/container-rollout.ts';
import { deployStage } from '../alchemy/stage.ts';
import type { DeployStage } from '../alchemy/stage.ts';

const REGION = 'eu-central-1';

/** Both stages run on this host, side by side on different ports. */
const API_INSTANCE_ID = 'i-016827500a47a80ef';

/** `-e NAME` is read from the deploy job's environment. Every one of them must be set. */
const SHARED_ENVIRONMENT = [
  '-e RUNNER_API_TOKEN',
  '-e DATABASE_URL',
  '-e CLERK_SECRET_KEY',
  '-e CLERK_PUBLISHABLE_KEY',
  '-e CLERK_AUTHORIZED_PARTIES',
];

const CONTAINERS: Record<
  DeployStage,
  { containerName: string; hostPort: number; pruneDockerBeforePull: boolean; additionalRunArgs: string[] }
> = {
  development: {
    containerName: 'app-speed-api-development',
    hostPort: 3001,
    // Leaves the production container's image in place.
    pruneDockerBeforePull: false,
    additionalRunArgs: [
      '-e APP_ENV=development',
      '-e SQLITE_PATH=/data/app-speed.sqlite',
      '-v app-speed-api-development:/data',
      '-e RUNNER_MANAGER_MODE=manual',
      ...SHARED_ENVIRONMENT,
    ],
  },
  production: {
    containerName: 'app-speed-api',
    hostPort: 3000,
    pruneDockerBeforePull: true,
    additionalRunArgs: [
      '-e APP_ENV=production',
      '-e MCP_RESOURCE_URL=https://appspeed.dev/mcp',
      '-e PORTAL_URL=https://appspeed.dev',
      '-e RECORD_PERSISTENCE_MODE=s3',
      '-e RECORD_PERSISTENCE_BUCKET=app-speed-audit-results-prod',
      `-e AWS_REGION=${REGION}`,
      ...SHARED_ENVIRONMENT,
    ],
  },
};

export default Alchemy.Stack(
  'app-speed-api',
  { providers: awsProviders(REGION), state: awsState },
  Effect.gen(function* () {
    const stage = yield* deployStage;
    // Published by `nx release publish --group=api` earlier in the deploy job.
    const imageRef = yield* Config.String('API_IMAGE_REF');
    const container = CONTAINERS[stage];
    const rollout = yield* RunningHostsContainer('ApiContainer', {
      region: REGION,
      instanceIds: [API_INSTANCE_ID],
      imageRef,
      containerName: container.containerName,
      hostPort: container.hostPort,
      containerPort: 3000,
      additionalRunArgs: container.additionalRunArgs,
      pruneDockerBeforePull: container.pruneDockerBeforePull,
      pollIntervalMs: 5000,
      timeoutMs: 900000,
    });
    return { imageRef: rollout.imageRef, commandId: rollout.commandId };
  }),
);
