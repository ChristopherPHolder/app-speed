import { Context, Effect, Layer, type Scope } from 'effect';
import { generateReport, startFlow } from 'lighthouse';

import { RunnerContext, runPuppeteerReplay } from '@app-speed/audit/core/runner';
import {
  type PuppeteerReplayUserflowRunnerSchema,
  type UserFlowAuditDefinition,
  type UserFlowResult,
} from '@app-speed/audit/user-flow/domain';

import { AuditConfig } from './audit-config';
import { UserFlowRunnerExtension } from './runner-extension';
import { ExperimentalUserFlow, navigationPlan } from '../soft-navigation/flow';

export type UserFlowExecutionResult = { flowResult: UserFlowResult; reportHtml: string };

type UserFlowSession = {
  readonly replay: (
    recording: typeof PuppeteerReplayUserflowRunnerSchema.Type,
    timeout: number,
  ) => Effect.Effect<void, unknown>;
  readonly result: Effect.Effect<UserFlowExecutionResult, unknown>;
  readonly dispose: Effect.Effect<void>;
};

/** Browser integration boundary; the caller owns the returned flow's lifetime. */
export class UserFlowDriver extends Context.Service<
  UserFlowDriver,
  { readonly start: (audit: UserFlowAuditDefinition) => Effect.Effect<UserFlowSession, unknown, Scope.Scope> }
>()('audit/user-flow/Driver') {
  static readonly layer = Layer.succeed(UserFlowDriver)({
    start: Effect.fn('userFlowDriver.start')(function* (audit) {
      const configuration = yield* AuditConfig(audit.device);
      const { browser, page } = yield* RunnerContext(configuration);
      const flow = yield* Effect.promise(() =>
        startFlow(page, { name: audit.title, config: configuration.lighthousePreset }),
      );
      let experiment: ExperimentalUserFlow | undefined;

      return {
        replay: (recording, timeout) => {
          experiment = new ExperimentalUserFlow(page, flow, navigationPlan(recording), timeout);
          return runPuppeteerReplay(recording, new UserFlowRunnerExtension(browser, page, experiment, { timeout }));
        },
        result: Effect.gen(function* () {
          const flowResult = yield* Effect.promise(() =>
            experiment ? experiment.createFlowResult() : flow.createFlowResult(),
          );
          const reportHtml = yield* Effect.sync(() => generateReport(flowResult, 'html'));
          return { flowResult, reportHtml };
        }),
        dispose: Effect.sync(() => (experiment ? experiment.dispose() : flow.dispose())),
      };
    }),
  });
}
