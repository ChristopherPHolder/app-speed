import { Command, Options } from '@effect/cli';
import { Duration, Effect } from 'effect';
import { processQueue } from '@app-speed/runner-user-flow-replay';

const queue = Options.text('queue').pipe(Options.withDefault('local'));

const command = Command.make('audit', { queue }, ({ queue }) => {
  return Effect.gen(function* () {
    yield* Effect.log('Initialize audit runner');
    yield* Effect.log(`Extracting audits from ${queue}`);

    const [duration] = yield* Effect.timed(processQueue);

    yield* Effect.log(`Completed audits in ${Duration.format(duration)}`);
  });
});

export const cli = Command.run(command, {
  name: 'Audit Runner',
  version: 'v0.0.1',
});
