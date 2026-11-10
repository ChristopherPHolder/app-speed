import { createRunner, parse as parseReplay, type PuppeteerRunnerExtension, type UserFlow } from '@puppeteer/replay';
import { Data, Effect } from 'effect';
import type { ReplayDiagnosticsSchema } from '@app-speed/audit/core/domain';

class ReplayExecutionError extends Data.TaggedError('ReplayExecutionError')<{
  readonly message: string;
  readonly diagnostics?: typeof ReplayDiagnosticsSchema.Type;
}> {}

// Diagnostic targets exclude URL credentials/query/fragment and selector values.
const safeUrl = (value: string) => {
  try {
    const url = new URL(value);
    return `${url.origin}${url.pathname}`;
  } catch {
    return '[redacted URL]';
  }
};
// Only retain simple CSS identifiers/combinators. Attribute values, functional pseudo
// selectors, quoting and escapes require parsing; redact the entire selector instead.
const safeSelector = (value: string) => (/^[a-zA-Z0-9_\s.#>+~*:-]+$/.test(value) ? value : '[redacted selector]');

export const runPuppeteerReplay = Effect.fn('runner.replay.execute')((
  recording: unknown,
  extension: PuppeteerRunnerExtension,
  timeout = 30_000,
) => {
  let diagnostics: typeof ReplayDiagnosticsSchema.Type | undefined;
  return Effect.tryPromise({
    try: async () => {
      const script = parseReplay(recording as UserFlow);
      let current = -1;
      let lastSuccessfulStepIndex: number | null = null;
      let targetUrl: string | undefined;
      let stepName: string | undefined;
      const steps = script.steps.map((step, stepIndex) => {
        if (step.type === 'navigate') targetUrl = safeUrl(step.url);
        if (step.type === 'customStep' && ['startNavigation', 'startTimespan', 'snapshot'].includes(step.name)) {
          const parameters = step.parameters as { name?: string } | undefined;
          stepName = parameters?.name;
        }
        return {
          stepIndex,
          stepOrdinal: stepIndex + 1,
          stepType: step.type,
          stepName,
          targetUrl,
          selectors:
            'selectors' in step
              ? step.selectors.map((selector) =>
                  (typeof selector === 'string' ? [selector] : selector).map(safeSelector),
                )
              : undefined,
          timeoutMs: step.timeout ?? script.timeout ?? timeout,
          status: 'skipped' as 'completed' | 'failed' | 'skipped',
        };
      });
      const before = extension.beforeEachStep;
      const after = extension.afterEachStep;
      extension.beforeEachStep = async function (step, flow) {
        current++;
        await before?.call(this, step, flow);
      };
      extension.afterEachStep = async function (step, flow) {
        await after?.call(this, step, flow);
        steps[current].status = 'completed';
        lastSuccessfulStepIndex = current;
      };
      try {
        const runner = await createRunner(script, extension);
        await runner.run();
      } catch (cause) {
        if (current >= 0 && current < steps.length) {
          steps[current].status = 'failed';
          diagnostics = {
            stepIndex: current,
            stepOrdinal: current + 1,
            lastSuccessfulStepIndex,
            steps,
            evidence:
              'Step execution log only. Failure screenshots and raw browser logs are omitted to protect page and form data.',
          };
        }
        throw cause;
      } finally {
        extension.beforeEachStep = before;
        extension.afterEachStep = after;
      }
    },
    catch: (cause) => {
      const raw = cause instanceof Error ? cause.message : '';
      const duration = raw.match(/(?:waiting |timeout[^\d]*)(\d+)\s*ms/i)?.[1];
      const network = raw.match(/net::ERR_[A-Z_]+/)?.[0];
      return new ReplayExecutionError({
        message: /timed? ?out|timeout/i.test(raw)
          ? `Replay step timed out${duration ? ` after ${duration}ms` : ''}.`
          : network
            ? `Navigation failed: ${network}.`
            : /not found|no element|could not find|unable to find/i.test(raw)
              ? 'Target element was not found. Check the target and selector.'
              : 'Replay step failed. Check the target and selector.',
        diagnostics,
      });
    },
  });
});
