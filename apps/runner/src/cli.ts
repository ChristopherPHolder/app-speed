import { Command } from '@effect/cli';
import { Duration, Effect } from 'effect';
import { processQueue } from '@app-speed/runner-user-flow-replay';
import { AuditRepoLive, DbClient } from '@app-speed/server/db';

const command = Command.make('audit', {}, () => {
  return Effect.gen(function* () {
    yield* Effect.log('Initialize audit runner');
    yield* Effect.log('Extracting audits from database queue');

    const program = processQueue.pipe(Effect.provide(AuditRepoLive), Effect.provide(DbClient.live));
    const [duration] = yield* Effect.timed(program);

    yield* Effect.log(`Completed audits in ${Duration.format(duration)}`);
  });
});

export const cli = Command.run(command, {
  name: 'Audit Runner',
  version: 'v0.0.1',
});
