import { PuppeteerRunnerExtension, Step, StepType, UserFlow as UserFlowRecording } from '@puppeteer/replay';
import type { Browser, Page } from 'puppeteer';
import type { UserFlow } from 'lighthouse';
import { isReplayUserflowStep, isReplayUserflowStepWithFlags } from '@app-speed/audit/contracts';

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

  override async runStep(step: Step, flowRecording: UserFlowRecording): Promise<void> {
    if (step.type !== StepType.CustomStep) {
      return super.runStep(step as Step, flowRecording);
    }

    if (isReplayUserflowStep(step)) {
      if (isReplayUserflowStepWithFlags(step)) {
        return this.flow[step.name](step.parameters);
      }
      return this.flow[step.name]();
    }

    throw new Error(`Unknown custom step type ${JSON.stringify(step)}`);
  }
}
