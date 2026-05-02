import { PuppeteerRunnerExtension, Step, UserFlow as UserFlowRecording } from '@puppeteer/replay';
import type { Browser, Page } from 'puppeteer';
import type { UserFlow } from 'lighthouse';
import { ReplayUserflowStepSchema, UserflowStepTypeWithStepFlagsLiteral } from '@app-speed/audit/domain';
import { Schema } from 'effect';

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
    if (Schema.is(ReplayUserflowStepSchema)(step)) {
      return this.runCustomStep(step);
    }

    if (step.type === 'customStep') {
      throw new Error(`Unknown custom step type ${JSON.stringify(step)}`);
    }

    return super.runStep(step as Step, flowRecording);
  }

  async runCustomStep(step: typeof ReplayUserflowStepSchema.Type) {
    if (Schema.is(UserflowStepTypeWithStepFlagsLiteral)(step.name)) {
      return this.flow[step.name](step.parameters);
    }
    return this.flow[step.name]();
  }
}
