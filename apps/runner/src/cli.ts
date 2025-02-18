import { Command, Options } from '@effect/cli';
import { Effect } from 'effect';
import { processQueue } from '@app-speed/runner-user-flow-replay';

const queue = Options.text('queue');

const command = Command.make('audit', { queue }, ({ queue }) => {
  return Effect.gen(function* () {
    yield* Effect.log(`Queue: ${queue}`);

    yield* processQueue;

    yield* Effect.log('Audits Complete');
    return void 0;
  });
});

export const cli = Command.run(command, {
  name: 'Audit Runner',
  version: 'v0.0.1',
});
