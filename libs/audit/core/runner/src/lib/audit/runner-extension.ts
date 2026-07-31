import { setTimeout as waitForTime } from 'node:timers/promises';
import { PuppeteerRunnerExtension, type Step, type UserFlow as ReplayRecording } from '@puppeteer/replay';
import type { Browser, Page } from 'puppeteer';
import { Either, Schema } from 'effect';

import { AUDIT_CUSTOM_STEP_TYPE, ReplayAuditCustomStepSchema } from '@app-speed/audit/core/domain';

const decodeSharedStep = Schema.decodeUnknownEither(ReplayAuditCustomStepSchema);

export abstract class CoreRunnerExtension extends PuppeteerRunnerExtension {
  private readonly auditTimeout: number;

  constructor(browser: Browser, page: Page, opts?: { timeout?: number }) {
    super(browser, page, opts);
    this.auditTimeout = opts?.timeout ?? 30_000;
  }

  override async runStep(step: Step | unknown, flowRecording: ReplayRecording): Promise<void> {
    if (typeof step === 'object' && step !== null && 'type' in step && step.type === 'customStep') {
      const decoded = decodeSharedStep(step);
      if (Either.isRight(decoded)) return await this.runSharedCustomStep(decoded.right);
      return await this.runFeatureCustomStep(step);
    }
    return await super.runStep(step as Step, flowRecording);
  }

  protected abstract runFeatureCustomStep(step: unknown): Promise<void>;

  private async runSharedCustomStep(step: typeof ReplayAuditCustomStepSchema.Type): Promise<void> {
    switch (step.name) {
      case AUDIT_CUSTOM_STEP_TYPE.CLEAR_CACHE:
        return await this.page.createCDPSession().then((client) => client.send('Network.clearBrowserCache'));
      case AUDIT_CUSTOM_STEP_TYPE.ADD_COOKIE:
        return await this.page.setCookie(step.parameters);
      case AUDIT_CUSTOM_STEP_TYPE.WAIT_FOR_TIME:
        return await waitForTime(step.parameters.seconds * 1000);
      case AUDIT_CUSTOM_STEP_TYPE.WAIT_FOR_NETWORK_IDLE:
        return await this.page.waitForNetworkIdle({
          ...step.parameters,
          timeout: step.parameters.timeout ?? this.auditTimeout,
        });
    }
  }
}
