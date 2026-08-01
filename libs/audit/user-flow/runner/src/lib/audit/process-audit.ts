import { generateReport, startFlow } from 'lighthouse';
import { Effect, Schema } from 'effect';
import type { FlowResult } from 'lighthouse';

import { RunnerContext, runPuppeteerReplay, type AuditClaim } from '@app-speed/audit/core/runner';
import { PuppeteerReplayUserflowRunnerSchema, UserFlowAuditDefinitionSchema } from '@app-speed/audit/user-flow/domain';

import { AuditConfig } from './audit-config';
import { UserFlowRunnerExtension } from './runner-extension';

export type UserFlowExecutionResult = { flowResult: FlowResult; reportHtml: string };

export const executeUserFlowAudit = (claim: AuditClaim): Effect.Effect<UserFlowExecutionResult, unknown> =>
  Effect.gen(function* () {
    const audit = yield* Schema.decodeUnknownEffect(UserFlowAuditDefinitionSchema)(claim.definition);
    const replayRecording = yield* Schema.decodeUnknownEffect(PuppeteerReplayUserflowRunnerSchema)(audit);
    const configuration = yield* AuditConfig(audit.device);
    const { browser, page } = yield* RunnerContext(configuration);
    const flow = yield* Effect.promise(() =>
      startFlow(page, { name: audit.title, config: configuration.lighthousePreset }),
    );
    const extension = new UserFlowRunnerExtension(browser, page, flow, { timeout: audit.timeout ?? 30_000 });
    yield* runPuppeteerReplay(replayRecording, extension);
    const flowResult = yield* Effect.promise(() => flow.createFlowResult());
    const reportHtml = yield* Effect.sync(() => generateReport(flowResult, 'html'));
    return { flowResult, reportHtml };
  }).pipe(Effect.scoped);
