import * as Alchemy from 'alchemy';
import * as Config from 'effect/Config';
import * as Effect from 'effect/Effect';

import { awsProviders, awsState } from '../alchemy/aws.ts';
import { StoppedHostContainer } from '../alchemy/container-rollout.ts';
import { deployStage } from '../alchemy/stage.ts';
import type { DeployStage } from '../alchemy/stage.ts';

const REGION = 'eu-central-1';

/** Normally stopped; the API starts it to run audits. Both stages deploy to it. */
const RUNNER_INSTANCE_ID = 'i-049287bf43503d01e';

const API_BASE_URLS: Record<DeployStage, string> = {
  development: 'https://dev.appspeed.dev/api',
  production: 'https://appspeed.dev/api',
};

export default Alchemy.Stack(
  'app-speed-runner',
  { providers: awsProviders(REGION), state: awsState },
  Effect.gen(function* () {
    const stage = yield* deployStage;
    // Published by `nx release publish --group=runner` earlier in the deploy job.
    const imageRef = yield* Config.String('RUNNER_IMAGE_REF');
    const rollout = yield* StoppedHostContainer('RunnerContainer', {
      region: REGION,
      instanceId: RUNNER_INSTANCE_ID,
      imageRef,
      containerName: 'app-speed-runner',
      additionalRunArgs: [
        // Read from the deploy job's environment.
        '-e RUNNER_API_TOKEN',
        `-e RUNNER_API_BASE_URL=${API_BASE_URLS[stage]}`,
        `-e RUNNER_ID=ec2-${RUNNER_INSTANCE_ID}`,
        `-e AWS_REGION=${REGION}`,
        '-e RUNNER_HEADLESS=true',
      ],
      pruneDockerBeforePull: true,
      // Stop the instance only if this deploy started it; one the API started is still working.
      stopAfterCompletion: true,
      stopOnlyIfStarted: true,
      expectBootstrapShutdown: false,
      pollIntervalMs: 5000,
      startWaitTimeoutMs: 1800000,
      timeoutMs: 600000,
    });
    return { imageRef: rollout.imageRef, commandId: rollout.commandId };
  }),
);
