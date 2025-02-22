import { Duration, Effect } from 'effect';
import { Browser, launch } from 'puppeteer';
import { createRunner, parse as puppeteerReplayParse } from '@puppeteer/replay';
import { Config, defaultConfig, desktopConfig, startFlow } from 'lighthouse';

import { DeviceSchema, ReplayUserflowAudit } from '@app-speed/shared-user-flow-replay/schema';

import { UserFlowRunnerExtension } from './runner-extension';
import { AuditRequestSchema } from './data-access/queue.effect';
import { DEVICE_TYPE } from '@app-speed/shared-user-flow-replay';

const configOptions = {
  [DEVICE_TYPE.MOBILE]: defaultConfig,
  [DEVICE_TYPE.DESKTOP]: desktopConfig,
} as const satisfies Record<typeof DeviceSchema.Type, Config>;

const RunnerContext = Effect.gen(function* () {
  const browser = yield* Effect.acquireRelease(
    Effect.promise(() => launch({ headless: false, args: ['--no-sandbox', '--disable-setuid-sandbox'] })),
    (browser: Browser) => Effect.promise(() => browser.close()),
  );
  const page = yield* Effect.promise(() => browser.newPage());
  return { browser, page };
});

export const runAudit = Effect.fn((audit: ReplayUserflowAudit) =>
  Effect.gen(function* () {
    const { browser, page } = yield* RunnerContext;

    const flow = yield* Effect.promise(() =>
      startFlow(page, { name: audit.title, config: configOptions[audit.device] }),
    );

    const runnerExtension = new UserFlowRunnerExtension(browser, page, flow);

    const replayScript = puppeteerReplayParse(audit);

    const runner = yield* Effect.promise(() => createRunner(replayScript, runnerExtension));

    yield* Effect.promise(() => runner.run());

    return yield* Effect.promise(() => flow.createFlowResult());
  }).pipe(Effect.scoped),
);

export const processAudit = Effect.fn((auditRequest: typeof AuditRequestSchema.Type) => {
  return Effect.gen(function* () {
    yield* Effect.log(`Starting processing ${auditRequest.auditId}`);

    const [duration, result] = yield* Effect.timed(runAudit(auditRequest.auditDetails));

    const auditDuration = Duration.format(duration);

    yield* Effect.log(`Completed processing ${auditRequest.auditId} in ${auditDuration}`);

    return { result, duration: auditDuration };
  });
});
