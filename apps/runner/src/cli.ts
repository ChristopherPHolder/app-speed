import { Command } from '@effect/cli';
import { Duration, Effect } from 'effect';
import { processQueue } from '@app-speed/runner-user-flow-replay';

const command = Command.make('audit', {}, () => {
  return Effect.gen(function* () {
    yield* Effect.log('Initializing RunnerApp');
    const [duration] = yield* Effect.timed(processQueue);
    yield* Effect.annotateCurrentSpan({ 'runner.total_duration_ms': Duration.toMillis(duration) });
    yield* Effect.log(`Terminating RunnerApp after ${Duration.format(duration)}`);
  }).pipe(Effect.withSpan('runner.cli.execute'));
});

export const cli = Command.run(command, {
  name: 'Audit Runner',
  version: 'v0.0.1',
});
