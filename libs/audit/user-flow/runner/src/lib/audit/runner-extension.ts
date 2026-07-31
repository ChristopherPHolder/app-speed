import type { Browser, Page } from 'puppeteer';
import type { UserFlow } from 'lighthouse';
import { Schema } from 'effect';

import { CoreRunnerExtension } from '@app-speed/audit/core/runner';
import { LIGHTHOUSE_AUDIT_STEP_TYPE, ReplayUserflowStepSchema } from '@app-speed/audit/user-flow/domain';

const decodeUserFlowStep = Schema.decodeUnknownPromise(ReplayUserflowStepSchema);

export class UserFlowRunnerExtension extends CoreRunnerExtension {
  constructor(
    browser: Browser,
    page: Page,
    private readonly flow: UserFlow,
    opts?: { timeout?: number },
  ) {
    super(browser, page, opts);
  }

  protected override async runFeatureCustomStep(value: unknown): Promise<void> {
    const step = await decodeUserFlowStep(value);
    switch (step.name) {
      case LIGHTHOUSE_AUDIT_STEP_TYPE.START_NAVIGATION:
      case LIGHTHOUSE_AUDIT_STEP_TYPE.START_TIMESPAN:
      case LIGHTHOUSE_AUDIT_STEP_TYPE.SNAPSHOT:
        return this.flow[step.name](step.parameters);
      case LIGHTHOUSE_AUDIT_STEP_TYPE.END_NAVIGATION:
      case LIGHTHOUSE_AUDIT_STEP_TYPE.END_TIMESPAN:
        return this.flow[step.name]();
    }
  }
}
