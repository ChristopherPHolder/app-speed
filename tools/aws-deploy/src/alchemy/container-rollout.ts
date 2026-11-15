import { Action } from 'alchemy';
import * as Data from 'effect/Data';
import * as Effect from 'effect/Effect';

import { rolloutToRunningHosts } from '../rollout/running-hosts.ts';
import type { RunningHostsRollout } from '../rollout/running-hosts.ts';
import { rolloutToStoppedHost } from '../rollout/stopped-host.ts';
import type { StoppedHostRollout } from '../rollout/stopped-host.ts';

export class ContainerRolloutError extends Data.TaggedError('ContainerRolloutError')<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

/*
 * Rollouts are Actions rather than Resources: they have no lifecycle to read or delete, they run when their input
 * changes. Every published image has a unique reference, so each deploy of a new image runs the rollout once, and a
 * repeated deploy of the same image is a no-op.
 *
 * The input is stored in the state table. Secrets stay out of it: `-e NAME` run arguments name a variable, and the
 * rollout reads its value from the deploy job's environment.
 */

/** Replace the container on hosts that are always running (the API). */
export const RunningHostsContainer = Action(
  'AppSpeed.RunningHostsContainer',
  Effect.fn(function* (input: RunningHostsRollout) {
    const result = yield* Effect.tryPromise({
      try: () => rolloutToRunningHosts(input),
      catch: (cause) =>
        new ContainerRolloutError({ message: cause instanceof Error ? cause.message : String(cause), cause }),
    });
    yield* Effect.logInfo(result.message);
    return { imageRef: input.imageRef, commandId: result.commandId };
  }),
);

/** Start a host that is normally stopped, replace its container, and stop it again (the runner). */
export const StoppedHostContainer = Action(
  'AppSpeed.StoppedHostContainer',
  Effect.fn(function* (input: StoppedHostRollout) {
    const result = yield* rolloutToStoppedHost(input);
    yield* Effect.logInfo(result.message);
    return { imageRef: input.imageRef, commandId: result.commandId };
  }),
);
