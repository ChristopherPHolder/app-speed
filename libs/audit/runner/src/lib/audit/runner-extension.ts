import { PuppeteerRunnerExtension, Step, UserFlow as UserFlowRecording } from '@puppeteer/replay';
import type { Browser, Page } from 'puppeteer';
import type { UserFlow } from 'lighthouse';
import { LIGHTHOUSE_AUDIT_STEP_TYPE, ReplayUserflowStepSchema } from '@app-speed/audit/domain';
import { Schema } from 'effect';

const decodeReplayUserflowStep = Schema.decodeUnknownSync(ReplayUserflowStepSchema);

export class UserFlowRunnerExtension extends PuppeteerRunnerExtension {
  constructor(
    browser: Browser,
    page: Page,
    private flow: UserFlow,
    opts?: {
      timeout?: number;
    },
  ) {
    super(browser, page, opts);
  }

  override async runStep(
    step: Step | typeof ReplayUserflowStepSchema.Type,
    flowRecording: UserFlowRecording,
  ): Promise<void> {
    if (step.type === 'customStep') {
      return this.runCustomStep(decodeReplayUserflowStep(step));
    }

    return super.runStep(step as Step, flowRecording);
  }

  async runCustomStep(step: typeof ReplayUserflowStepSchema.Type) {
    switch (step.name) {
      case LIGHTHOUSE_AUDIT_STEP_TYPE.START_NAVIGATION:
      case LIGHTHOUSE_AUDIT_STEP_TYPE.START_TIMESPAN:
      case LIGHTHOUSE_AUDIT_STEP_TYPE.SNAPSHOT:
        return this.flow[step.name](step.parameters);
      case LIGHTHOUSE_AUDIT_STEP_TYPE.END_NAVIGATION:
      case LIGHTHOUSE_AUDIT_STEP_TYPE.END_TIMESPAN:
        return this.flow[step.name]();
    }

    return assertNever(step);
  }
}

const assertNever = (step: never): never => {
  throw new Error(`Unsupported replay custom step: ${JSON.stringify(step)}`);
};
