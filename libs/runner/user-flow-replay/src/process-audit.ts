import { Config, Data, Effect, Schema } from 'effect';
import { Browser, launch } from 'puppeteer';
import { createRunner, parse as puppeteerReplayParse } from '@puppeteer/replay';
import { Config as LighthouseConfig, defaultConfig, desktopConfig, startFlow } from 'lighthouse';

import { PuppeteerReplayUserflowRunnerSchema, ReplayUserflowAudit } from '@app-speed/shared-user-flow-replay/schema';

import { UserFlowRunnerExtension } from './runner-extension';
import { AuditRequestSchema } from './data-access/queue.effect';
import { DEVICE_TYPE, DeviceSchema } from '@app-speed/shared-user-flow-replay';

const configOptions = {
  [DEVICE_TYPE.MOBILE]: defaultConfig,
  [DEVICE_TYPE.DESKTOP]: desktopConfig,
} as const satisfies Record<typeof DeviceSchema.Type, LighthouseConfig>;

const RunnerContext = Effect.gen(function* () {
  const headless = yield* Config.boolean('RUNNER_HEADLESS').pipe(Config.withDefault(false));
  const browser = yield* Effect.acquireRelease(
    Effect.promise(() => launch({ headless, args: ['--no-sandbox', '--disable-setuid-sandbox'] })),
    (browser: Browser) => Effect.promise(() => browser.close()),
  );
  const page = yield* Effect.promise(() => browser.newPage());
  return { browser, page };
});

class RunnerError extends Data.TaggedError('RunnerFailed')<{
  message: string;
  cause?: unknown;
}> {}

export const runAudit = Effect.fn((audit: ReplayUserflowAudit) =>
  Effect.gen(function* () {
    const runnerScript = yield* Schema.decode(PuppeteerReplayUserflowRunnerSchema)(audit);
    const replayScript = puppeteerReplayParse(runnerScript);

    const { browser, page } = yield* RunnerContext;

    const flow = yield* Effect.promise(() =>
      startFlow(page, {
        name: audit.title,
        config: {
          ...configOptions[audit.device],
        },
      }),
    );

    const runnerExtension = new UserFlowRunnerExtension(browser, page, flow);

    yield* Effect.tryPromise({
      try: () => createRunner(replayScript, runnerExtension).then((runner) => runner.run()),
      catch: (error) => {
        if (error instanceof Error) {
          new RunnerError({ message: error.message, cause: error.cause });
        }
        return new RunnerError({ message: 'Audit failed during while running' });
      },
    });

    return yield* Effect.promise(() => flow.createFlowResult());
  }).pipe(Effect.scoped),
);

export const processAudit = Effect.fn((auditRequest: typeof AuditRequestSchema.Type) => {
  return Effect.gen(function* () {
    yield* Effect.log(`Starting processing ${auditRequest.auditId}`);

    const result = yield* runAudit(auditRequest.auditDetails);

    yield* Effect.log(`Completed processing ${auditRequest.auditId}`);

    return result;
  });
});
