import { Duration, Effect } from 'effect';
import { Browser, launch } from 'puppeteer';
import { startFlow } from 'lighthouse';
import { UserFlowRunnerExtension } from './runner-extension';
import { createRunner, parse as puppeteerReplayParse } from '@puppeteer/replay';
import { ReplayUserflowAudit } from '@app-speed/shared-user-flow-replay/schema';
import { AuditRequestSchema } from './data-access/queue.effect';

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

    const flow = yield* Effect.promise(() => startFlow(page, { name: audit.title }));

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

    const [_duration, result] = yield* Effect.timed(runAudit(auditRequest.auditDetails));

    const duration = Duration.format(_duration);

    yield* Effect.log(`Completed processing ${auditRequest.auditId} in ${duration}`);

    return { result, duration };
  });
});
