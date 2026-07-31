import { createRunner, parse as parseReplay, type PuppeteerRunnerExtension, type UserFlow } from '@puppeteer/replay';
import { Data, Effect } from 'effect';

class ReplayExecutionError extends Data.TaggedError('ReplayExecutionError')<{
  readonly message: string;
  readonly cause: unknown;
}> {}

export const runPuppeteerReplay = Effect.fn('runner.replay.execute')(
  (recording: unknown, extension: PuppeteerRunnerExtension) =>
    Effect.tryPromise({
      try: async () => {
        const script = parseReplay(recording as UserFlow);
        const runner = await createRunner(script, extension);
        await runner.run();
      },
      catch: (cause) =>
        new ReplayExecutionError({
          message: cause instanceof Error ? cause.message : 'Puppeteer Replay execution failed.',
          cause,
        }),
    }),
);
